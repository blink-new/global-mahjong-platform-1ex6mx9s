import { GameState, Player, Tile, Meld, AmbitionType, WinCondition, ClaimAction } from '@/types/mahjong'
import { createTileSet, shuffleTiles, tilesMatch, isValidSequence, isValidTriplet, isValidQuad } from '@/utils/mahjongTiles'

// Initialize a new Filipino Mahjong game
export function initializeGame(players: Player[]): GameState {
  const tiles = shuffleTiles(createTileSet())
  
  // Separate bonus tiles (flowers/seasons) from regular tiles
  const bonusTiles = tiles.filter(tile => tile.isBonus)
  const regularTiles = tiles.filter(tile => !tile.isBonus)
  
  // Build walls - regular tiles for main wall, bonus tiles for replacement
  const wall = shuffleTiles(regularTiles) // 136 regular tiles
  const flowerWall = shuffleTiles(bonusTiles) // 8 bonus tiles
  
  // Deal initial tiles
  const dealerIndex = Math.floor(Math.random() * 4)
  const gameState: GameState = {
    id: `game-${Date.now()}`,
    players: players.map((player, index) => ({
      ...player,
      hand: [],
      melds: [],
      flowers: [],
      discards: [],
      isDealer: index === dealerIndex
    })),
    currentPlayer: dealerIndex,
    dealer: dealerIndex,
    wall: [],
    flowerWall: [],
    discardPile: [],
    round: 1,
    wind: 'east',
    status: 'playing',
    scores: [0, 0, 0, 0],
    ambitions: [],
    phase: 'discard', // Dealer starts with 17 tiles, so they discard first
    hasDrawnThisTurn: false
  }

  // Deal exactly 16 tiles to each player (including dealer initially)
  let tileIndex = 0
  
  // Deal 4 rounds of 4 tiles each (16 tiles per player)
  for (let round = 0; round < 4; round++) {
    for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
      for (let tileCount = 0; tileCount < 4; tileCount++) {
        if (tileIndex < wall.length) {
          gameState.players[playerIndex].hand.push(wall[tileIndex])
          tileIndex++
        }
      }
    }
  }

  // Set remaining wall and flower wall
  gameState.wall = wall.slice(tileIndex)
  gameState.flowerWall = flowerWall

  // Auto-expose and replace flowers for all players to ensure exactly 16 non-flower tiles
  gameState.players.forEach((player, index) => {
    ensureCorrectHandSize(gameState, index)
    console.log(`Player ${player.name} has ${player.flowers.length} flowers:`, player.flowers.map(f => f.flower || f.season))
  })

  // Dealer draws the 17th tile to start the game
  drawTile(gameState, dealerIndex)

  return gameState
}

// Ensure player has exactly 16 non-flower tiles in hand
export function ensureCorrectHandSize(gameState: GameState, playerIndex: number): void {
  const player = gameState.players[playerIndex]
  let hasFlowers = true
  
  while (hasFlowers) {
    hasFlowers = false
    
    // Find bonus tiles in hand
    for (let i = player.hand.length - 1; i >= 0; i--) {
      const tile = player.hand[i]
      if (tile.isBonus) {
        // Move to flowers collection
        player.flowers.push(tile)
        player.hand.splice(i, 1)
        hasFlowers = true
        
        // Draw replacement from main wall (not flower wall)
        if (gameState.wall.length > 0) {
          const replacement = gameState.wall.shift()!
          player.hand.push(replacement)
          
          // If replacement is also a flower, continue loop
          if (replacement.isBonus) {
            hasFlowers = true
          }
        }
      }
    }
  }
  
  // Ensure exactly 16 tiles in hand (excluding flowers)
  while (player.hand.length < 16 && gameState.wall.length > 0) {
    const tile = gameState.wall.shift()!
    if (tile.isBonus) {
      player.flowers.push(tile)
      // Continue drawing until we get a non-flower tile
    } else {
      player.hand.push(tile)
    }
  }
}

// Legacy function for backward compatibility
export function exposeAndReplaceFlowers(gameState: GameState, playerIndex: number): void {
  ensureCorrectHandSize(gameState, playerIndex)
}

// Draw a tile from the wall
export function drawTile(gameState: GameState, playerIndex: number): Tile | null {
  if (gameState.wall.length === 0) return null
  
  const player = gameState.players[playerIndex]
  let drawnTile: Tile | null = null
  
  // Clear previous recently drawn markers
  player.hand.forEach(tile => {
    tile.isRecentlyDrawn = false
  })
  
  // Keep drawing until we get a non-flower tile
  while (gameState.wall.length > 0) {
    const tile = gameState.wall.shift()!
    
    if (tile.isBonus) {
      // Auto-expose flower and continue drawing
      player.flowers.push(tile)
    } else {
      // Found a regular tile
      tile.isRecentlyDrawn = true
      player.hand.push(tile)
      drawnTile = tile
      gameState.lastDrawnTile = tile
      gameState.phase = 'discard' // After drawing, player must discard
      gameState.hasDrawnThisTurn = true // Mark that current player has drawn
      break
    }
  }
  
  return drawnTile
}

// Discard a tile
export function discardTile(gameState: GameState, playerIndex: number, tile: Tile): void {
  const player = gameState.players[playerIndex]
  const tileIndex = player.hand.findIndex(t => t.id === tile.id)
  
  if (tileIndex !== -1) {
    // Clear recently drawn marker from all tiles
    player.hand.forEach(t => {
      t.isRecentlyDrawn = false
    })
    
    // Mark tile as recently discarded
    tile.isRecentlyDiscarded = true
    
    // Remove tile from hand
    player.hand.splice(tileIndex, 1)
    player.discards.push(tile)
    gameState.discardPile.push(tile)
    gameState.lastDiscard = tile
    gameState.lastDrawnTile = undefined
    
    // Ensure player still has exactly 16 tiles after discard
    // (This should normally be the case, but adding as safety check)
    if (player.hand.length < 16) {
      console.warn(`Player ${player.name} has ${player.hand.length} tiles after discard, should have 16`)
    }
    
    // Move to next player and set phase to draw
    gameState.currentPlayer = (gameState.currentPlayer + 1) % 4
    gameState.phase = 'draw' // Next player needs to draw first
    gameState.hasDrawnThisTurn = false // Reset for next player
  }
}

// Check if a claim is valid
export function isValidClaim(gameState: GameState, claim: ClaimAction): boolean {
  const player = gameState.players.find(p => p.id === claim.playerId)
  if (!player || !gameState.lastDiscard) return false
  
  const lastDiscard = gameState.lastDiscard
  
  switch (claim.type) {
    case 'chow': {
      // In Filipino Mahjong, any player can claim chow (not just left player like in Chinese Mahjong)
      // Need 2 tiles to form sequence with discard
      return canFormSequence(player.hand, lastDiscard)
    }
      
    case 'pung':
      // Need 2 matching tiles
      return player.hand.filter(t => tilesMatch(t, lastDiscard)).length >= 2
      
    case 'kong':
      // Need 3 matching tiles
      return player.hand.filter(t => tilesMatch(t, lastDiscard)).length >= 3
      
    case 'win':
      return isWinningHand(player.hand.concat([lastDiscard]), player.melds, player.flowers).isValid
      
    default:
      return false
  }
}

// Check if player can form a sequence with the discard
function canFormSequence(hand: Tile[], discard: Tile): boolean {
  if (!['circles', 'bamboos', 'characters'].includes(discard.suit)) return false
  
  const suitTiles = hand.filter(t => t.suit === discard.suit && t.value)
  const discardValue = discard.value!
  
  console.log(`Checking chow for discard: ${discard.suit} ${discardValue}`)
  console.log(`Available suit tiles:`, suitTiles.map(t => `${t.suit} ${t.value}`))
  
  // Pattern 1: discard + 1 + 2 (e.g., 2-3-4 with discard=2)
  if (discardValue <= 7) {
    const hasNext = suitTiles.some(t => t.value === discardValue + 1)
    const hasNext2 = suitTiles.some(t => t.value === discardValue + 2)
    if (hasNext && hasNext2) {
      console.log(`Found chow pattern 1: ${discardValue}-${discardValue + 1}-${discardValue + 2}`)
      return true
    }
  }
  
  // Pattern 2: -1 + discard + 1 (e.g., 2-3-4 with discard=3)
  if (discardValue >= 2 && discardValue <= 8) {
    const hasPrev = suitTiles.some(t => t.value === discardValue - 1)
    const hasNext = suitTiles.some(t => t.value === discardValue + 1)
    if (hasPrev && hasNext) {
      console.log(`Found chow pattern 2: ${discardValue - 1}-${discardValue}-${discardValue + 1}`)
      return true
    }
  }
  
  // Pattern 3: -2 + -1 + discard (e.g., 2-3-4 with discard=4)
  if (discardValue >= 3) {
    const hasPrev = suitTiles.some(t => t.value === discardValue - 1)
    const hasPrev2 = suitTiles.some(t => t.value === discardValue - 2)
    if (hasPrev && hasPrev2) {
      console.log(`Found chow pattern 3: ${discardValue - 2}-${discardValue - 1}-${discardValue}`)
      return true
    }
  }
  
  console.log('No chow patterns found')
  return false
}

// Get all possible sequences that can be formed with a discard tile
export function getAllPossibleSequences(hand: Tile[], discard: Tile): Tile[][] {
  if (!['circles', 'bamboos', 'characters'].includes(discard.suit)) return []
  
  const suitTiles = hand.filter(t => t.suit === discard.suit && t.value)
  const discardValue = discard.value!
  const sequences: Tile[][] = []
  
  // Pattern 1: discard is the lowest (e.g., 2-3-4 with discard=2)
  if (discardValue <= 7) {
    const tile1 = suitTiles.find(t => t.value === discardValue + 1)
    const tile2 = suitTiles.find(t => t.value === discardValue + 2)
    if (tile1 && tile2) {
      sequences.push([discard, tile1, tile2])
    }
  }
  
  // Pattern 2: discard is in the middle (e.g., 2-3-4 with discard=3)
  if (discardValue >= 2 && discardValue <= 8) {
    const tile1 = suitTiles.find(t => t.value === discardValue - 1)
    const tile2 = suitTiles.find(t => t.value === discardValue + 1)
    if (tile1 && tile2) {
      sequences.push([tile1, discard, tile2])
    }
  }
  
  // Pattern 3: discard is the highest (e.g., 2-3-4 with discard=4)
  if (discardValue >= 3) {
    const tile1 = suitTiles.find(t => t.value === discardValue - 2)
    const tile2 = suitTiles.find(t => t.value === discardValue - 1)
    if (tile1 && tile2) {
      sequences.push([tile1, tile2, discard])
    }
  }
  
  return sequences
}

// Process a claim
export function processClaim(gameState: GameState, claim: ClaimAction): boolean {
  if (!isValidClaim(gameState, claim)) return false
  
  const playerIndex = gameState.players.findIndex(p => p.id === claim.playerId)
  const player = gameState.players[playerIndex]
  const lastDiscard = gameState.lastDiscard!
  
  switch (claim.type) {
    case 'chow': {
      const chowTiles = formChow(player.hand, lastDiscard)
      if (chowTiles) {
        // Remove the claimed tile from discard pile
        const discardIndex = gameState.discardPile.findIndex(t => t.id === lastDiscard.id)
        if (discardIndex !== -1) {
          gameState.discardPile.splice(discardIndex, 1)
        }
        
        // Remove tiles from hand (the 2 tiles that form chow with discard, excluding the discard itself)
        const handTilesToRemove = chowTiles.filter(tile => tile.id !== lastDiscard.id)
        handTilesToRemove.forEach(tile => {
          const index = player.hand.findIndex(t => t.id === tile.id)
          if (index !== -1) player.hand.splice(index, 1)
        })
        
        // Add meld
        player.melds.push({
          id: `meld-${Date.now()}`,
          type: 'chow',
          tiles: chowTiles,
          isConcealed: false,
          claimedFrom: gameState.currentPlayer
        })
        
        gameState.currentPlayer = playerIndex
        gameState.phase = 'discard' // Player must discard after claiming (NO DRAWING)
        gameState.lastDiscard = undefined
        gameState.hasDrawnThisTurn = true // Mark as having "drawn" to prevent further claims until discard
        return true
      }
      break
    }
      
    case 'pung': {
      const pungTiles = player.hand.filter(t => tilesMatch(t, lastDiscard)).slice(0, 2)
      if (pungTiles.length === 2) {
        // Remove the claimed tile from discard pile
        const discardIndex = gameState.discardPile.findIndex(t => t.id === lastDiscard.id)
        if (discardIndex !== -1) {
          gameState.discardPile.splice(discardIndex, 1)
        }
        
        // Remove tiles from hand
        pungTiles.forEach(tile => {
          const index = player.hand.findIndex(t => t.id === tile.id)
          if (index !== -1) player.hand.splice(index, 1)
        })
        
        // Add meld
        player.melds.push({
          id: `meld-${Date.now()}`,
          type: 'pung',
          tiles: [lastDiscard, ...pungTiles],
          isConcealed: false,
          claimedFrom: gameState.currentPlayer
        })
        
        // Record ambition
        recordAmbition(gameState, claim.playerId, 'kang', 0.25)
        gameState.currentPlayer = playerIndex
        gameState.phase = 'discard' // Player must discard after claiming (NO DRAWING)
        gameState.lastDiscard = undefined
        gameState.hasDrawnThisTurn = true // Mark as having "drawn" to prevent further claims until discard
        return true
      }
      break
    }
      
    case 'kong': {
      const kongTiles = player.hand.filter(t => tilesMatch(t, lastDiscard)).slice(0, 3)
      if (kongTiles.length === 3) {
        // Remove the claimed tile from discard pile
        const discardIndex = gameState.discardPile.findIndex(t => t.id === lastDiscard.id)
        if (discardIndex !== -1) {
          gameState.discardPile.splice(discardIndex, 1)
        }
        
        // Remove tiles from hand
        kongTiles.forEach(tile => {
          const index = player.hand.findIndex(t => t.id === tile.id)
          if (index !== -1) player.hand.splice(index, 1)
        })
        
        // Add meld
        player.melds.push({
          id: `meld-${Date.now()}`,
          type: 'kong',
          tiles: [lastDiscard, ...kongTiles],
          isConcealed: false,
          claimedFrom: gameState.currentPlayer
        })
        
        // Draw replacement tile for Kong (special case - Kong gets replacement)
        drawTile(gameState, playerIndex)
        
        // Record ambition
        recordAmbition(gameState, claim.playerId, 'kang', 0.25)
        gameState.currentPlayer = playerIndex
        gameState.phase = 'discard' // Player must discard after claiming and drawing replacement
        gameState.lastDiscard = undefined
        gameState.hasDrawnThisTurn = true // Mark as having drawn to prevent further claims until discard
        return true
      }
      break
    }
      
    case 'win': {
      const winCondition = isWinningHand(player.hand.concat([lastDiscard]), player.melds, player.flowers)
      if (winCondition.isValid) {
        gameState.status = 'finished'
        gameState.winner = playerIndex
        
        // Record win ambitions
        winCondition.ambitions.forEach(ambition => {
          recordAmbition(gameState, claim.playerId, ambition, getAmbitionPayout(ambition))
        })
        
        return true
      }
      break
    }
  }
  
  return false
}

// Form a chow from hand tiles and discard
function formChow(hand: Tile[], discard: Tile): Tile[] | null {
  if (!['circles', 'bamboos', 'characters'].includes(discard.suit)) return null
  
  const suitTiles = hand.filter(t => t.suit === discard.suit && t.value)
  const discardValue = discard.value!
  
  console.log(`Forming chow for discard: ${discard.suit} ${discardValue}`)
  console.log(`Available suit tiles:`, suitTiles.map(t => `${t.suit} ${t.value}`))
  
  // Pattern 1: discard + 1 + 2 (e.g., 2-3-4 with discard=2)
  if (discardValue <= 7) {
    const tile1 = suitTiles.find(t => t.value === discardValue + 1)
    const tile2 = suitTiles.find(t => t.value === discardValue + 2)
    if (tile1 && tile2) {
      const chow = [discard, tile1, tile2].sort((a, b) => a.value! - b.value!)
      console.log(`Formed chow pattern 1:`, chow.map(t => `${t.suit} ${t.value}`))
      return chow
    }
  }
  
  // Pattern 2: -1 + discard + 1 (e.g., 2-3-4 with discard=3)
  if (discardValue >= 2 && discardValue <= 8) {
    const tile1 = suitTiles.find(t => t.value === discardValue - 1)
    const tile2 = suitTiles.find(t => t.value === discardValue + 1)
    if (tile1 && tile2) {
      const chow = [tile1, discard, tile2].sort((a, b) => a.value! - b.value!)
      console.log(`Formed chow pattern 2:`, chow.map(t => `${t.suit} ${t.value}`))
      return chow
    }
  }
  
  // Pattern 3: -2 + -1 + discard (e.g., 2-3-4 with discard=4)
  if (discardValue >= 3) {
    const tile1 = suitTiles.find(t => t.value === discardValue - 2)
    const tile2 = suitTiles.find(t => t.value === discardValue - 1)
    if (tile1 && tile2) {
      const chow = [tile1, tile2, discard].sort((a, b) => a.value! - b.value!)
      console.log(`Formed chow pattern 3:`, chow.map(t => `${t.suit} ${t.value}`))
      return chow
    }
  }
  
  console.log('Could not form chow')
  return null
}

// Check if hand is a winning hand (17 tiles total)
export function isWinningHand(hand: Tile[], melds: Meld[], flowers: Tile[]): WinCondition {
  const totalTiles = hand.length + melds.reduce((sum, meld) => sum + meld.tiles.length, 0)
  
  if (totalTiles !== 17) {
    return { isValid: false, handType: '', ambitions: [], totalPayout: 0, breakdown: {} }
  }
  
  // Check for special hands first
  if (isSietePares(hand)) {
    return {
      isValid: true,
      handType: 'Siete Pares',
      ambitions: ['todas', 'siete_pares'],
      totalPayout: 1.5,
      breakdown: { 'Basic Win': 1, 'Siete Pares': 0.5 }
    }
  }
  
  // Check standard hand: 5 trios + 1 pair
  const standardWin = checkStandardWin(hand, melds)
  if (standardWin.isValid) {
    const ambitions: AmbitionType[] = ['todas']
    let totalPayout = 1
    const breakdown: { [key: string]: number } = { 'Basic Win': 1 }
    
    // Check for additional ambitions
    if (isEscalera(melds)) {
      ambitions.push('escalera')
      totalPayout += 0.5
      breakdown['Escalera'] = 0.5
    }
    
    if (flowers.length === 0) {
      ambitions.push('no_flowers_end')
      totalPayout += 0.25
      breakdown['No Flowers'] = 0.25
    }
    
    const concealedMelds = melds.filter(m => m.isConcealed).length
    if (concealedMelds === melds.length && melds.length > 0) {
      ambitions.push('all_up')
      totalPayout += 0.25
      breakdown['All Up'] = 0.25
    }
    
    return {
      isValid: true,
      handType: standardWin.handType,
      ambitions,
      totalPayout,
      breakdown
    }
  }
  
  return { isValid: false, handType: '', ambitions: [], totalPayout: 0, breakdown: {} }
}

// Check for Siete Pares (7 pairs + 1 trio)
function isSietePares(hand: Tile[]): boolean {
  if (hand.length !== 17) return false
  
  const tileCounts = new Map<string, number>()
  
  hand.forEach(tile => {
    const key = `${tile.suit}-${tile.value}-${tile.wind}-${tile.dragon}`
    tileCounts.set(key, (tileCounts.get(key) || 0) + 1)
  })
  
  const counts = Array.from(tileCounts.values()).sort((a, b) => b - a)
  
  // Rule 1: One triple (3) and seven pairs (2 each) = 8 unique tile types
  const hasTripleAndPairs = counts.length === 8 && counts[0] === 3 && counts.slice(1).every(c => c === 2)
  
  if (hasTripleAndPairs) return true
  
  // Rule 2: Check if we can form 7 pairs + 1 trio (sequence or triplet)
  // This means we could have different combinations like 6 pairs + 1 triplet + 1 sequence
  return checkSevenPairsWithTrio(hand)
}

// Check for 7 pairs + 1 trio (either sequence or triplet)
function checkSevenPairsWithTrio(hand: Tile[]): boolean {
  const tiles = [...hand]
  let hasTrioOrSequence = false
  
  // Try to find 7 pairs and 1 trio
  const tileCounts = new Map<string, { tiles: Tile[], count: number }>()
  
  tiles.forEach(tile => {
    const key = `${tile.suit}-${tile.value}-${tile.wind}-${tile.dragon}`
    if (!tileCounts.has(key)) {
      tileCounts.set(key, { tiles: [], count: 0 })
    }
    const entry = tileCounts.get(key)!
    entry.tiles.push(tile)
    entry.count++
  })
  
  // Count exact pairs (groups of 2)
  const pairs: Tile[][] = []
  const remaining: Tile[] = []
  
  for (const [key, entry] of tileCounts) {
    if (entry.count === 2) {
      pairs.push(entry.tiles)
    } else if (entry.count === 3) {
      // This could be our trio
      if (!hasTrioOrSequence) {
        hasTrioOrSequence = true
      } else {
        // Too many trios
        return false
      }
    } else if (entry.count === 1) {
      remaining.push(...entry.tiles)
    } else if (entry.count === 4) {
      // Could be 2 pairs or 1 quad (not valid for this pattern)
      pairs.push([entry.tiles[0], entry.tiles[1]])
      pairs.push([entry.tiles[2], entry.tiles[3]])
    } else {
      // Invalid count
      return false
    }
  }
  
  // If we don't have a triplet, check if remaining tiles can form a sequence
  if (!hasTrioOrSequence && remaining.length === 3) {
    hasTrioOrSequence = canFormSequenceFromTiles(remaining)
  }
  
  return pairs.length === 7 && hasTrioOrSequence
}

// Check if 3 tiles can form a sequence
function canFormSequenceFromTiles(tiles: Tile[]): boolean {
  if (tiles.length !== 3) return false
  
  // All tiles must be from the same numbered suit
  const suit = tiles[0].suit
  if (!['circles', 'bamboos', 'characters'].includes(suit)) return false
  
  if (!tiles.every(t => t.suit === suit && t.value)) return false
  
  const values = tiles.map(t => t.value!).sort((a, b) => a - b)
  return values[1] === values[0] + 1 && values[2] === values[1] + 1
}

// Check standard winning hand structure: 5 trios + 1 pair
function checkStandardWin(hand: Tile[], melds: Meld[]): { isValid: boolean; handType: string } {
  // Create a copy of the hand to work with
  const remainingTiles = [...hand]
  
  // Try to find the winning combination: 5 trios + 1 pair
  const result = findWinningCombination(remainingTiles, melds)
  
  if (result.isValid) {
    return { isValid: true, handType: 'Standard Win' }
  }
  
  return { isValid: false, handType: '' }
}

// Find a valid winning combination of 5 trios + 1 pair
function findWinningCombination(tiles: Tile[], existingMelds: Meld[]): { isValid: boolean; trios: Tile[][]; pair: Tile[] } {
  // We need to form (5 - existingMelds.length) more trios from remaining tiles
  const neededTrios = 5 - existingMelds.length
  
  // Try all possible combinations to find trios and a pair
  return findTriosAndPair(tiles, neededTrios)
}

// Recursively find the required number of trios and exactly one pair
function findTriosAndPair(tiles: Tile[], neededTrios: number): { isValid: boolean; trios: Tile[][]; pair: Tile[] } {
  if (neededTrios === 0) {
    // We've found all needed trios, now check if remaining tiles form exactly one pair
    if (tiles.length === 2 && tilesMatch(tiles[0], tiles[1])) {
      return { isValid: true, trios: [], pair: tiles }
    }
    return { isValid: false, trios: [], pair: [] }
  }
  
  if (tiles.length < 3) {
    return { isValid: false, trios: [], pair: [] }
  }
  
  // Try to form a trio (either triplet or sequence)
  for (let i = 0; i < tiles.length - 2; i++) {
    // Try triplet first (3 of the same)
    const triplet = findTriplet(tiles, i)
    if (triplet.length === 3) {
      const remainingTiles = tiles.filter(t => !triplet.some(tt => tt.id === t.id))
      const result = findTriosAndPair(remainingTiles, neededTrios - 1)
      if (result.isValid) {
        return { isValid: true, trios: [triplet, ...result.trios], pair: result.pair }
      }
    }
    
    // Try sequence (straight like 2-3-4 of same suit)
    const sequence = findSequence(tiles, i)
    if (sequence.length === 3) {
      const remainingTiles = tiles.filter(t => !sequence.some(st => st.id === t.id))
      const result = findTriosAndPair(remainingTiles, neededTrios - 1)
      if (result.isValid) {
        return { isValid: true, trios: [sequence, ...result.trios], pair: result.pair }
      }
    }
  }
  
  return { isValid: false, trios: [], pair: [] }
}

// Find a triplet starting from a specific tile
function findTriplet(tiles: Tile[], startIndex: number): Tile[] {
  const baseTile = tiles[startIndex]
  const matchingTiles = tiles.filter(t => tilesMatch(t, baseTile))
  
  if (matchingTiles.length >= 3) {
    return matchingTiles.slice(0, 3)
  }
  
  return []
}

// Find a sequence starting from a specific tile
function findSequence(tiles: Tile[], startIndex: number): Tile[] {
  const baseTile = tiles[startIndex]
  
  // Only numbered suits can form sequences
  if (!['circles', 'bamboos', 'characters'].includes(baseTile.suit) || !baseTile.value) {
    return []
  }
  
  const suit = baseTile.suit
  const value = baseTile.value
  
  // Look for consecutive tiles in the same suit
  const nextTile = tiles.find(t => t.suit === suit && t.value === value + 1)
  const nextNextTile = tiles.find(t => t.suit === suit && t.value === value + 2)
  
  if (nextTile && nextNextTile) {
    return [baseTile, nextTile, nextNextTile]
  }
  
  return []
}

// Find all possible groups in remaining tiles
function findAllGroups(tiles: Tile[]): Tile[][] {
  // Simplified grouping logic - in a real implementation, this would be more complex
  const groups: Tile[][] = []
  const remaining = [...tiles]
  
  // Find pairs first
  for (let i = 0; i < remaining.length - 1; i++) {
    for (let j = i + 1; j < remaining.length; j++) {
      if (tilesMatch(remaining[i], remaining[j])) {
        groups.push([remaining[i], remaining[j]])
        remaining.splice(j, 1)
        remaining.splice(i, 1)
        break
      }
    }
  }
  
  return groups
}

// Check for Escalera (1-9 straight in one suit)
function isEscalera(melds: Meld[]): boolean {
  const chows = melds.filter(m => m.type === 'chow')
  if (chows.length < 3) return false
  
  // Check if we have 1-2-3, 4-5-6, 7-8-9 in same suit
  const suitGroups = new Map<string, number[][]>()
  
  chows.forEach(chow => {
    const suit = chow.tiles[0].suit
    const values = chow.tiles.map(t => t.value!).sort((a, b) => a - b)
    
    if (!suitGroups.has(suit)) {
      suitGroups.set(suit, [])
    }
    suitGroups.get(suit)!.push(values)
  })
  
  // Check each suit for complete 1-9 sequence
  for (const [suit, sequences] of suitGroups) {
    const flatValues = sequences.flat().sort((a, b) => a - b)
    const expectedSequence = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    
    if (JSON.stringify(flatValues) === JSON.stringify(expectedSequence)) {
      return true
    }
  }
  
  return false
}

// Record an ambition
function recordAmbition(gameState: GameState, playerId: string, type: AmbitionType, payout: number): void {
  gameState.ambitions.push({
    id: `ambition-${Date.now()}`,
    playerId,
    type,
    payout,
    isInstant: ['kang', 'secret', 'sagasa', 'thirteen_flowers', 'no_flowers_start'].includes(type),
    timestamp: Date.now()
  })
}

// Get payout amount for ambition
function getAmbitionPayout(ambition: AmbitionType): number {
  const payouts: { [key in AmbitionType]: number } = {
    kang: 0.25,
    secret: 0.5,
    sagasa: 0.5,
    thirteen_flowers: 0.25,
    no_flowers_start: 0.25,
    todas: 1,
    escalera: 0.5,
    siete_pares: 0.5,
    no_flowers_end: 0.25,
    all_up: 0.25,
    all_down: 0.25,
    all_chow: 0.25,
    all_pung: 0.25,
    single: 0.25,
    bisaklat: 1
  }
  
  return payouts[ambition] || 0
}