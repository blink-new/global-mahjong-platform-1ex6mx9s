import { GameState, Player, Tile, ClaimAction } from '@/types/mahjong'
import { tilesMatch, sortTiles } from '@/utils/mahjongTiles'
import { isWinningHand, isValidClaim, getAllPossibleSequences } from '@/utils/filipinoMahjongLogic'

// Enhanced AI that actively pursues winning strategies
export class EnhancedMahjongAI {
  private difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  
  constructor(difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'expert') {
    this.difficulty = difficulty
  }

  // Main AI decision making function
  makeDecision(gameState: GameState, playerId: string): {
    action: 'draw' | 'discard' | 'claim' | 'win'
    tile?: Tile
    claimAction?: ClaimAction
  } {
    const player = gameState.players.find(p => p.id === playerId)
    if (!player) return { action: 'draw' }

    // Check if we can win immediately
    const winCheck = this.checkForWin(player, gameState.lastDiscard)
    if (winCheck.canWin) {
      return { action: 'win' }
    }

    // Check if we should claim a tile
    if (gameState.lastDiscard && gameState.phase === 'draw') {
      const claimDecision = this.shouldClaim(player, gameState.lastDiscard, gameState)
      if (claimDecision.shouldClaim) {
        return { action: 'claim', claimAction: claimDecision.claimAction }
      }
    }

    // If it's our turn to discard, choose the best tile to discard
    if (gameState.phase === 'discard' && gameState.currentPlayer === gameState.players.findIndex(p => p.id === playerId)) {
      const discardTile = this.chooseBestDiscard(player, gameState)
      return { action: 'discard', tile: discardTile }
    }

    // Default to drawing
    return { action: 'draw' }
  }

  // Check if we can win with current hand + optional extra tile
  private checkForWin(player: Player, extraTile?: Tile): { canWin: boolean; winType?: string } {
    const testHand = extraTile ? [...player.hand, extraTile] : player.hand
    const winCondition = isWinningHand(testHand, player.melds, player.flowers)
    
    return {
      canWin: winCondition.isValid,
      winType: winCondition.handType
    }
  }

  // Determine if we should claim a discarded tile
  private shouldClaim(player: Player, discardedTile: Tile, gameState: GameState): {
    shouldClaim: boolean
    claimAction?: ClaimAction
  } {
    // Priority 1: Can we win with this tile?
    if (this.checkForWin(player, discardedTile).canWin) {
      return {
        shouldClaim: true,
        claimAction: { type: 'win', playerId: player.id }
      }
    }

    // Priority 2: Kong (4 of a kind) - highest value meld
    const matchingTiles = player.hand.filter(t => tilesMatch(t, discardedTile))
    if (matchingTiles.length >= 3) {
      const claimAction: ClaimAction = { type: 'kong', playerId: player.id }
      if (isValidClaim(gameState, claimAction)) {
        return { shouldClaim: true, claimAction }
      }
    }

    // Priority 3: Pung (3 of a kind)
    if (matchingTiles.length >= 2) {
      const claimAction: ClaimAction = { type: 'pung', playerId: player.id }
      if (isValidClaim(gameState, claimAction)) {
        // Only claim pung if it significantly improves our hand
        const handValue = this.evaluateHandValue(player.hand, player.melds)
        const projectedValue = this.evaluateHandValue(
          player.hand.filter(t => !matchingTiles.slice(0, 2).some(mt => mt.id === t.id)),
          [...player.melds, {
            id: `temp-pung-${Date.now()}`,
            type: 'pung',
            tiles: [discardedTile, ...matchingTiles.slice(0, 2)],
            isConcealed: false,
            claimedFrom: gameState.currentPlayer
          }]
        )
        
        if (projectedValue > handValue + 15) { // Significant improvement threshold
          return { shouldClaim: true, claimAction }
        }
      }
    }

    // Priority 4: Chow (sequence) - but be more selective
    const sequences = getAllPossibleSequences(player.hand, discardedTile)
    if (sequences.length > 0) {
      const claimAction: ClaimAction = { type: 'chow', playerId: player.id }
      if (isValidClaim(gameState, claimAction)) {
        // Only claim chow if it helps complete a winning pattern
        const handValue = this.evaluateHandValue(player.hand, player.melds)
        const sequenceTiles = sequences[0].filter(t => t.id !== discardedTile.id)
        const projectedValue = this.evaluateHandValue(
          player.hand.filter(t => !sequenceTiles.some(st => st.id === t.id)),
          [...player.melds, {
            id: `temp-chow-${Date.now()}`,
            type: 'chow',
            tiles: sequences[0],
            isConcealed: false,
            claimedFrom: gameState.currentPlayer
          }]
        )
        
        // Be more selective with chows - only if significant improvement
        if (projectedValue > handValue + 10 && this.difficulty === 'expert') {
          return { shouldClaim: true, claimAction }
        }
      }
    }

    return { shouldClaim: false }
  }

  // Choose the best tile to discard using advanced strategy
  private chooseBestDiscard(player: Player, gameState: GameState): Tile {
    const hand = [...player.hand]
    let bestDiscard = hand[0]
    let lowestValue = Infinity

    // First, check if we're close to winning and prioritize accordingly
    const winningAnalysis = this.analyzeWinningPotential(player)
    
    // If we're very close to winning (1-2 tiles away), be more conservative
    if (winningAnalysis.tilesAwayFromWin <= 2) {
      console.log(`AI ${player.name} is ${winningAnalysis.tilesAwayFromWin} tiles away from winning - being conservative`)
      
      // Prioritize keeping tiles that lead to winning combinations
      for (const tile of hand) {
        const value = this.evaluateDiscardValueForWin(tile, player, gameState, winningAnalysis)
        if (value < lowestValue) {
          lowestValue = value
          bestDiscard = tile
        }
      }
    } else {
      // Normal discard strategy
      for (const tile of hand) {
        const value = this.evaluateDiscardValue(tile, player, gameState)
        if (value < lowestValue) {
          lowestValue = value
          bestDiscard = tile
        }
      }
    }

    return bestDiscard
  }

  // Evaluate how valuable a tile is to keep (lower = better to discard)
  private evaluateDiscardValue(tile: Tile, player: Player, gameState: GameState): number {
    let value = 0

    // Base value - honor tiles are generally less useful for sequences
    if (tile.suit === 'winds' || tile.suit === 'dragons') {
      value += 20
    } else {
      value += 10
    }

    // Check if tile is part of potential melds
    const remainingHand = player.hand.filter(t => t.id !== tile.id)
    
    // Value for potential triplets
    const matchingTiles = remainingHand.filter(t => tilesMatch(t, tile))
    if (matchingTiles.length >= 2) {
      value -= 50 // Very valuable - part of potential kong
    } else if (matchingTiles.length === 1) {
      value -= 25 // Valuable - part of potential pung
    }

    // Value for potential sequences (only for numbered suits)
    if (['circles', 'bamboos', 'characters'].includes(tile.suit) && tile.value) {
      const sequenceValue = this.evaluateSequencePotential(tile, remainingHand)
      value -= sequenceValue
    }

    // Avoid discarding tiles that opponents might need
    const dangerValue = this.evaluateDangerLevel(tile, gameState)
    value += dangerValue

    // Terminal tiles (1, 9) are less flexible
    if (tile.value === 1 || tile.value === 9) {
      value += 5
    }

    // Middle tiles (4, 5, 6) are more flexible
    if (tile.value && tile.value >= 4 && tile.value <= 6) {
      value -= 5
    }

    return value
  }

  // Evaluate potential for sequences
  private evaluateSequencePotential(tile: Tile, hand: Tile[]): number {
    if (!tile.value || !['circles', 'bamboos', 'characters'].includes(tile.suit)) {
      return 0
    }

    let potential = 0
    const suitTiles = hand.filter(t => t.suit === tile.suit && t.value)
    const value = tile.value

    // Check for adjacent tiles
    const hasLower = suitTiles.some(t => t.value === value - 1)
    const hasHigher = suitTiles.some(t => t.value === value + 1)
    const hasLower2 = suitTiles.some(t => t.value === value - 2)
    const hasHigher2 = suitTiles.some(t => t.value === value + 2)

    // Complete sequence potential
    if (hasLower && hasHigher) potential += 30
    
    // Two-tile sequence potential
    if (hasLower || hasHigher) potential += 15
    
    // Gap sequence potential
    if (hasLower2 || hasHigher2) potential += 10

    return potential
  }

  // Evaluate how dangerous it is to discard this tile
  private evaluateDangerLevel(tile: Tile, gameState: GameState): number {
    let danger = 0

    // Check what other players have discarded
    const allDiscards = gameState.players.flatMap(p => p.discards)
    const sameTypeDiscards = allDiscards.filter(t => tilesMatch(t, tile))

    // If others have discarded the same tile, it's safer
    danger -= sameTypeDiscards.length * 5

    // If it's a middle value tile, it's more dangerous
    if (tile.value && tile.value >= 4 && tile.value <= 6) {
      danger += 10
    }

    // Honor tiles are generally safer to discard
    if (tile.suit === 'winds' || tile.suit === 'dragons') {
      danger -= 5
    }

    return danger
  }

  // Evaluate overall hand value for strategic decisions
  private evaluateHandValue(hand: Tile[], melds: any[]): number {
    let value = 0

    // Points for completed melds
    value += melds.length * 30

    // Points for potential melds in hand
    const tileCounts = new Map<string, number>()
    hand.forEach(tile => {
      const key = `${tile.suit}-${tile.value}-${tile.wind}-${tile.dragon}`
      tileCounts.set(key, (tileCounts.get(key) || 0) + 1)
    })

    // Value pairs and triplets
    for (const count of tileCounts.values()) {
      if (count >= 3) value += 25
      else if (count === 2) value += 15
    }

    // Value potential sequences
    const suits = ['circles', 'bamboos', 'characters']
    for (const suit of suits) {
      const suitTiles = hand.filter(t => t.suit === suit && t.value).sort((a, b) => a.value! - b.value!)
      value += this.evaluateSequencePatterns(suitTiles) * 10
    }

    // Bonus for having fewer tiles (closer to winning)
    value += (17 - hand.length) * 5

    return value
  }

  // Evaluate sequence patterns in a suit
  private evaluateSequencePatterns(suitTiles: Tile[]): number {
    if (suitTiles.length < 2) return 0

    let patterns = 0
    const values = suitTiles.map(t => t.value!).sort((a, b) => a - b)

    // Count consecutive sequences
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i + 1] === values[i] + 1) {
        patterns += 1
        // Bonus for longer sequences
        if (i < values.length - 2 && values[i + 2] === values[i] + 2) {
          patterns += 2
        }
      }
    }

    return patterns
  }

  // Analyze how close the player is to winning
  private analyzeWinningPotential(player: Player): {
    tilesAwayFromWin: number
    potentialWinningTiles: Tile[]
    bestStrategy: 'pairs' | 'sequences' | 'mixed'
  } {
    const hand = [...player.hand]
    const totalMelds = player.melds.length
    
    // Check for Siete Pares potential (7 pairs + 1 trio)
    const pairsAnalysis = this.analyzePairsStrategy(hand)
    
    // Check for standard win potential (5 trios + 1 pair)
    const standardAnalysis = this.analyzeStandardStrategy(hand, totalMelds)
    
    // Return the better strategy
    if (pairsAnalysis.tilesAwayFromWin <= standardAnalysis.tilesAwayFromWin) {\n      return {\n        tilesAwayFromWin: pairsAnalysis.tilesAwayFromWin,\n        potentialWinningTiles: pairsAnalysis.potentialWinningTiles,\n        bestStrategy: 'pairs'\n      }\n    } else {\n      return {\n        tilesAwayFromWin: standardAnalysis.tilesAwayFromWin,\n        potentialWinningTiles: standardAnalysis.potentialWinningTiles,\n        bestStrategy: standardAnalysis.tilesAwayFromWin <= 3 ? 'sequences' : 'mixed'\n      }\n    }\n  }\n\n  // Analyze pairs strategy potential\n  private analyzePairsStrategy(hand: Tile[]): {\n    tilesAwayFromWin: number\n    potentialWinningTiles: Tile[]\n  } {\n    const tileCounts = new Map<string, Tile[]>()\n    \n    hand.forEach(tile => {\n      const key = `${tile.suit}-${tile.value}-${tile.wind}-${tile.dragon}`\n      if (!tileCounts.has(key)) {\n        tileCounts.set(key, [])\n      }\n      tileCounts.get(key)!.push(tile)\n    })\n    \n    let pairs = 0\n    let singles = 0\n    let triples = 0\n    \n    for (const tiles of tileCounts.values()) {\n      if (tiles.length === 2) pairs++\n      else if (tiles.length === 1) singles++\n      else if (tiles.length === 3) triples++\n      else if (tiles.length === 4) pairs += 2 // 4 of a kind = 2 pairs\n    }\n    \n    // Need 7 pairs + 1 triple (or equivalent)\n    const neededPairs = Math.max(0, 7 - pairs)\n    const neededTriples = Math.max(0, 1 - triples)\n    \n    // Estimate tiles away from win\n    let tilesAway = neededPairs + neededTriples\n    \n    // Singles can become pairs with 1 more tile\n    const availableSingles = Math.min(singles, neededPairs)\n    tilesAway = Math.max(0, tilesAway - availableSingles)\n    \n    return {\n      tilesAwayFromWin: tilesAway,\n      potentialWinningTiles: [] // Simplified for now\n    }\n  }\n\n  // Analyze standard strategy potential\n  private analyzeStandardStrategy(hand: Tile[], existingMelds: number): {\n    tilesAwayFromWin: number\n    potentialWinningTiles: Tile[]\n  } {\n    const neededMelds = 5 - existingMelds\n    const neededPairs = 1\n    \n    // Count potential melds in hand\n    let potentialMelds = 0\n    let potentialPairs = 0\n    \n    // Count existing pairs and near-sequences\n    const tileCounts = new Map<string, number>()\n    hand.forEach(tile => {\n      const key = `${tile.suit}-${tile.value}-${tile.wind}-${tile.dragon}`\n      tileCounts.set(key, (tileCounts.get(key) || 0) + 1)\n    })\n    \n    // Count pairs and triplets\n    for (const count of tileCounts.values()) {\n      if (count >= 3) potentialMelds++\n      else if (count === 2) potentialPairs++\n    }\n    \n    // Count potential sequences\n    const suits = ['circles', 'bamboos', 'characters']\n    for (const suit of suits) {\n      const suitTiles = hand.filter(t => t.suit === suit && t.value).sort((a, b) => a.value! - b.value!)\n      potentialMelds += this.countPotentialSequences(suitTiles)\n    }\n    \n    // Estimate tiles away from win\n    const meldsShortfall = Math.max(0, neededMelds - potentialMelds)\n    const pairsShortfall = Math.max(0, neededPairs - potentialPairs)\n    \n    return {\n      tilesAwayFromWin: meldsShortfall + pairsShortfall,\n      potentialWinningTiles: [] // Simplified for now\n    }\n  }\n\n  // Count potential sequences in a suit\n  private countPotentialSequences(suitTiles: Tile[]): number {\n    if (suitTiles.length < 3) return 0\n    \n    let sequences = 0\n    const values = suitTiles.map(t => t.value!)\n    \n    // Look for consecutive runs\n    for (let i = 0; i <= values.length - 3; i++) {\n      if (values[i + 1] === values[i] + 1 && values[i + 2] === values[i] + 2) {\n        sequences++\n        i += 2 // Skip the next 2 tiles as they're part of this sequence\n      }\n    }\n    \n    return sequences\n  }\n\n  // Evaluate discard value when close to winning\n  private evaluateDiscardValueForWin(tile: Tile, player: Player, gameState: GameState, winningAnalysis: any): number {\n    let value = 0\n    \n    // Base penalty for discarding when close to win\n    value += 50\n    \n    // Heavy penalty for discarding tiles that could complete winning combinations\n    if (winningAnalysis.bestStrategy === 'pairs') {\n      // For pairs strategy, heavily penalize discarding singles that could become pairs\n      const matchingTiles = player.hand.filter(t => \n        t.suit === tile.suit && t.value === tile.value && \n        t.wind === tile.wind && t.dragon === tile.dragon && t.id !== tile.id\n      )\n      \n      if (matchingTiles.length === 1) {\n        value += 100 // Very high penalty for breaking potential pairs\n      } else if (matchingTiles.length === 0) {\n        value -= 20 // Lower penalty for isolated tiles\n      }\n    } else {\n      // For sequences strategy, penalize breaking potential sequences\n      if (['circles', 'bamboos', 'characters'].includes(tile.suit) && tile.value) {\n        const sequencePotential = this.evaluateSequencePotential(tile, player.hand.filter(t => t.id !== tile.id))\n        value += sequencePotential * 2 // Double the sequence value when close to winning\n      }\n      \n      // Penalize breaking potential triplets\n      const matchingTiles = player.hand.filter(t => \n        t.suit === tile.suit && t.value === tile.value && \n        t.wind === tile.wind && t.dragon === tile.dragon && t.id !== tile.id\n      )\n      \n      if (matchingTiles.length >= 2) {\n        value += 150 // Extremely high penalty for breaking triplets when close to win\n      } else if (matchingTiles.length === 1) {\n        value += 75 // High penalty for breaking pairs\n      }\n    }\n    \n    return value\n  }\n\n  // Get AI difficulty settings\n  getDifficultySettings() {\n    const settings = {\n      easy: { claimThreshold: 5, discardRandomness: 0.3, winPursuitAggression: 0.3 },\n      medium: { claimThreshold: 10, discardRandomness: 0.2, winPursuitAggression: 0.6 },\n      hard: { claimThreshold: 15, discardRandomness: 0.1, winPursuitAggression: 0.8 },\n      expert: { claimThreshold: 20, discardRandomness: 0.05, winPursuitAggression: 1.0 }\n    }\n    \n    return settings[this.difficulty]\n  }
}

// Factory function to create AI instances
export function createEnhancedAI(difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'expert'): EnhancedMahjongAI {
  return new EnhancedMahjongAI(difficulty)
}

// Helper function to simulate AI thinking time (for realism)
export function simulateThinkingTime(complexity: number = 1): Promise<void> {
  const baseTime = 500 // 0.5 seconds
  const thinkingTime = baseTime + (Math.random() * 1000 * complexity) // Up to 1 second additional
  return new Promise(resolve => setTimeout(resolve, thinkingTime))
}