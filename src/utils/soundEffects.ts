// Sound effects utility for Mahjong game
// Using Web Audio API for better performance and control

class SoundManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private enabled: boolean = true

  constructor() {
    // Initialize audio context on first user interaction
    this.initializeAudioContext()
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Resume context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
    } catch (error) {
      console.warn('Audio context not supported:', error)
    }
  }

  // Generate tile click sound
  private generateTileClickSound(): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.1 // 100ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate a short click sound with frequency sweep
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate
      const frequency = 800 + (200 * Math.exp(-t * 20)) // Frequency sweep from 1000Hz to 800Hz
      const envelope = Math.exp(-t * 15) // Quick decay
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3
    }

    return buffer
  }

  // Generate tile discard sound
  private generateDiscardSound(): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.2 // 200ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate a satisfying "thunk" sound
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate
      const frequency = 150 + (100 * Math.exp(-t * 8)) // Lower frequency sweep
      const envelope = Math.exp(-t * 5) // Slower decay
      const noise = (Math.random() - 0.5) * 0.1 // Add slight noise for texture
      data[i] = (Math.sin(2 * Math.PI * frequency * t) + noise) * envelope * 0.4
    }

    return buffer
  }

  // Generate draw tile sound
  private generateDrawSound(): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.15 // 150ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate a soft "whoosh" sound
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate
      const frequency = 400 + (200 * Math.sin(t * 20)) // Gentle frequency modulation
      const envelope = Math.sin(Math.PI * t / duration) * Math.exp(-t * 3) // Bell curve envelope
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.25
    }

    return buffer
  }

  // Generate win sound
  private generateWinSound(): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const duration = 1.0 // 1 second
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate a triumphant chord progression
    const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5 (C major chord)
    
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate
      const envelope = Math.sin(Math.PI * t / duration) * Math.exp(-t * 0.5)
      
      let sample = 0
      frequencies.forEach((freq, index) => {
        const phase = 2 * Math.PI * freq * t
        const amplitude = 0.2 / frequencies.length
        sample += Math.sin(phase) * amplitude * envelope
      })
      
      data[i] = sample
    }

    return buffer
  }

  // Generate claim sound
  private generateClaimSound(): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.3 // 300ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate an ascending tone
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate
      const frequency = 600 + (400 * t / duration) // Ascending from 600Hz to 1000Hz
      const envelope = Math.sin(Math.PI * t / duration) * 0.8 // Bell curve
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.35
    }

    return buffer
  }

  // Initialize all sounds
  public async initialize() {
    if (!this.audioContext) {
      await this.initializeAudioContext()
    }

    if (!this.audioContext) return

    // Generate and cache all sounds
    const tileClick = this.generateTileClickSound()
    const discard = this.generateDiscardSound()
    const draw = this.generateDrawSound()
    const win = this.generateWinSound()
    const claim = this.generateClaimSound()

    if (tileClick) this.sounds.set('tileClick', tileClick)
    if (discard) this.sounds.set('discard', discard)
    if (draw) this.sounds.set('draw', draw)
    if (win) this.sounds.set('win', win)
    if (claim) this.sounds.set('claim', claim)
  }

  // Play a sound
  public play(soundName: string, volume: number = 1.0) {
    if (!this.enabled || !this.audioContext || !this.sounds.has(soundName)) return

    try {
      const buffer = this.sounds.get(soundName)!
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = buffer
      gainNode.gain.value = Math.max(0, Math.min(1, volume))

      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      source.start()
    } catch (error) {
      console.warn('Failed to play sound:', error)
    }
  }

  // Enable/disable sounds
  public setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  public isEnabled(): boolean {
    return this.enabled
  }
}

// Create singleton instance
export const soundManager = new SoundManager()

// Initialize sounds on first user interaction
let initialized = false
export const initializeSounds = async () => {
  if (!initialized) {
    await soundManager.initialize()
    initialized = true
  }
}

// Convenience functions
export const playTileClick = () => soundManager.play('tileClick', 0.6)
export const playDiscard = () => soundManager.play('discard', 0.8)
export const playDraw = () => soundManager.play('draw', 0.5)
export const playWin = () => soundManager.play('win', 1.0)
export const playClaim = () => soundManager.play('claim', 0.7)

// Sound control functions
export const setSoundEnabled = (enabled: boolean) => soundManager.setEnabled(enabled)
export const isSoundEnabled = () => soundManager.isEnabled()