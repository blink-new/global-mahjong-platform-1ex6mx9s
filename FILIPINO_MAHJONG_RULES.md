# Filipino Mahjong Game Logic & Rules Documentation

## Table of Contents
1. [Game Overview](#game-overview)
2. [Tile Set Composition](#tile-set-composition)
3. [Game Setup](#game-setup)
4. [Turn Structure](#turn-structure)
5. [Claiming Rules](#claiming-rules)
6. [Winning Conditions](#winning-conditions)
7. [Ambitions (Special Hands)](#ambitions-special-hands)
8. [Scoring System](#scoring-system)
9. [Technical Implementation](#technical-implementation)

---

## Game Overview

Filipino Mahjong is a 4-player tile-based game where players compete to form winning combinations of tiles. The game combines elements of skill, strategy, and chance, with a unique ambition system that allows players to declare special hands for bonus payouts.

### Key Differences from Other Mahjong Variants:
- **17-tile winning hands** (instead of 14)
- **Ambition system** for declaring special hands
- **Bonus tiles** (flowers/seasons) are automatically exposed
- **Unique winning patterns** like Siete Pares (Seven Pairs)

---

## Tile Set Composition

### Total: 144 Tiles

#### Numbered Suits (108 tiles)
- **Circles (Dots)**: 1-9, 4 copies each = 36 tiles
- **Bamboos (Sticks)**: 1-9, 4 copies each = 36 tiles  
- **Characters (Wan)**: 1-9, 4 copies each = 36 tiles

#### Honor Tiles (28 tiles)
- **Winds**: East, South, West, North, 4 copies each = 16 tiles
- **Dragons**: Red, Green, White, 4 copies each = 12 tiles

#### Bonus Tiles (8 tiles)
- **Flowers**: Plum, Orchid, Chrysanthemum, Bamboo = 4 tiles
- **Seasons**: Spring, Summer, Autumn, Winter = 4 tiles

---

## Game Setup

### Initial Deal
1. **Shuffle** all 144 tiles
2. **Separate** bonus tiles from regular tiles
3. **Deal 16 tiles** to each player in 4 rounds of 4 tiles
4. **Auto-expose flowers**: Any bonus tiles in initial hands are automatically moved to the flower collection and replaced with regular tiles
5. **Dealer draws 17th tile** to start the game

### Player Positions
- **Dealer (East)**: Starts the game, rotates clockwise each round
- **South**: Right of dealer
- **West**: Opposite of dealer  
- **North**: Left of dealer

### Wall Management
- **Main Wall**: 136 regular tiles (after dealing)
- **Flower Wall**: 8 bonus tiles for replacements
- **Dead Wall**: Last 14 tiles reserved (not implemented in current version)

---

## Turn Structure

### Phase System
Each turn has two phases:

#### 1. Draw Phase
- Current player **must draw** a tile from the wall
- If drawn tile is a bonus tile, it's auto-exposed and player draws again
- Player now has 17 tiles (16 in hand + 1 drawn)
- **CLAIM button is disabled** for the current player during this phase

#### 2. Discard Phase  
- Player **must discard** one tile to return to 16 tiles
- Discarded tile becomes available for other players to claim
- Turn passes to next player
- **CLAIM button is enabled** for all players (if valid claims exist)

### Turn Order
- **Clockwise rotation**: East → South → West → North → East
- **Exception**: Player who claims a tile gets the next turn (out of sequence)

---

## Claiming Rules

### Claim Types

#### 1. **Chow (Sequence)**
- **Requirements**: 3 consecutive tiles of same suit (e.g., 4-5-6 Circles)
- **Restriction**: Can only claim from **left player** (previous in turn order)
- **Result**: Forms exposed meld, player discards and continues turn

#### 2. **Pung (Triplet)**
- **Requirements**: 3 identical tiles
- **Restriction**: Can claim from **any player**
- **Result**: Forms exposed meld, player discards and continues turn
- **Ambition**: Triggers "Kang" ambition (0.25x payout)

#### 3. **Kong (Quad)**
- **Requirements**: 4 identical tiles (3 in hand + 1 claimed)
- **Restriction**: Can claim from **any player**
- **Result**: Forms exposed meld, player draws replacement tile, then discards
- **Ambition**: Triggers "Kang" ambition (0.25x payout)

#### 4. **Win**
- **Requirements**: Claimed tile completes a winning hand
- **Restriction**: Can claim from **any player**
- **Result**: Game ends, player wins

### Claim Priority
1. **Win** (highest priority)
2. **Kong** 
3. **Pung**
4. **Chow** (lowest priority, only from left player)

### Claim Restrictions
- **Current player cannot claim** while in draw phase (after drawing but before discarding)
- **Other players can always claim** if they have valid combinations
- **No claims on bonus tiles** (automatically handled)

---

## Winning Conditions

### Standard Win: 5 Trios + 1 Pair (17 tiles total)

#### Valid Trios:
- **Chow**: 3 consecutive tiles of same suit (1-2-3, 4-5-6, etc.)
- **Pung**: 3 identical tiles
- **Kong**: 4 identical tiles (counts as one trio)

#### Valid Pairs:
- **Eyes**: 2 identical tiles

#### Example Standard Win:
```
Hand: 1-2-3 Circles, 4-4-4 Bamboos, 7-8-9 Characters, East-East-East, 5-5 Dots
Structure: [Chow] + [Pung] + [Chow] + [Pung] + [Pair] = 5 trios + 1 pair
```

### Special Win: Siete Pares (Seven Pairs + One Trio)

#### Requirements:
- **7 pairs** (2 identical tiles each)
- **1 trio** (either triplet or sequence)
- **Total**: 17 tiles

#### Example Siete Pares:
```
Hand: 1-1, 2-2, 3-3, 4-4, 5-5, 6-6, 7-7 (7 pairs) + 8-8-8 (1 triplet)
```

### Winning Methods:
1. **Self-Draw (Tsumo)**: Draw winning tile from wall
2. **Claim Win (Ron)**: Claim discarded tile to complete hand
3. **Instant Win**: Special ambitions that end game immediately

---

## Ambitions (Special Hands)

### Instant Ambitions (Declared immediately when achieved)

#### 1. **Kang** (0.25x payout)
- **Trigger**: Form any Kong (exposed or concealed)
- **Payment**: Immediate from all players

#### 2. **Secret** (0.5x payout)  
- **Trigger**: Form concealed Kong (4 identical tiles in hand)
- **Payment**: Immediate from all players

#### 3. **Sagasa** (0.5x payout)
- **Trigger**: Promote exposed Pung to Kong by drawing 4th tile
- **Payment**: Immediate from all players

#### 4. **Thirteen Flowers** (0.25x payout)
- **Trigger**: Collect all 8 bonus tiles (impossible with current 4-player setup)
- **Payment**: Immediate from all players

#### 5. **No Flowers Start** (0.25x payout)
- **Trigger**: Have no bonus tiles after initial deal and flower replacement
- **Payment**: Immediate from all players

### End-Game Ambitions (Declared with winning hand)

#### 6. **Todas** (1x payout)
- **Trigger**: Any winning hand
- **Payment**: Basic win payout

#### 7. **Escalera** (0.5x payout)
- **Trigger**: Win with 1-2-3, 4-5-6, 7-8-9 sequence in same suit
- **Payment**: Bonus on top of basic win

#### 8. **Siete Pares** (0.5x payout)
- **Trigger**: Win with Seven Pairs + One Trio pattern
- **Payment**: Bonus on top of basic win

#### 9. **No Flowers End** (0.25x payout)
- **Trigger**: Win with no bonus tiles in collection
- **Payment**: Bonus on top of basic win

#### 10. **All Up** (0.25x payout)
- **Trigger**: Win with all melds concealed (no claimed tiles)
- **Payment**: Bonus on top of basic win

#### 11. **All Down** (0.25x payout)
- **Trigger**: Win with all melds exposed (all claimed)
- **Payment**: Bonus on top of basic win

#### 12. **All Chow** (0.25x payout)
- **Trigger**: Win with hand containing only sequences
- **Payment**: Bonus on top of basic win

#### 13. **All Pung** (0.25x payout)
- **Trigger**: Win with hand containing only triplets/quads
- **Payment**: Bonus on top of basic win

#### 14. **Single** (0.25x payout)
- **Trigger**: Win on difficult wait (single tile completion)
- **Payment**: Bonus on top of basic win

#### 15. **Bisaklat** (1x payout)
- **Trigger**: Dealer wins on initial 17-tile hand (before any discards)
- **Payment**: Double basic win

---

## Scoring System

### Base Payouts
- **Basic Win (Todas)**: 1x base amount
- **Each Ambition**: Additional multiplier as specified above

### Payment Structure
- **Winner receives** from all other players
- **Instant ambitions** paid immediately when achieved
- **End-game ambitions** paid with final win

### Example Scoring:
```
Player wins with Escalera + No Flowers End:
- Todas (basic win): 1x
- Escalera bonus: 0.5x  
- No Flowers End bonus: 0.25x
- Total payout: 1.75x from each player
```

### Multiple Ambitions
- **Stack additively**: All applicable ambitions add to total payout
- **No maximum limit**: Theoretical maximum depends on combination achieved

---

## Technical Implementation

### Game State Management

#### Core Data Structures:
```typescript
interface GameState {
  players: Player[]           // 4 players with hands, melds, flowers
  currentPlayer: number       // Index of current player (0-3)
  wall: Tile[]               // Remaining tiles to draw
  discardPile: Tile[]        // All discarded tiles
  lastDiscard?: Tile         // Most recent discard (claimable)
  phase: 'draw' | 'discard'  // Current turn phase
  hasDrawnThisTurn: boolean  // Prevents claims during draw phase
  ambitions: AmbitionRecord[] // All declared ambitions
  status: 'playing' | 'finished'
}
```

#### Turn Flow Logic:
```typescript
// 1. Draw Phase
if (phase === 'draw') {
  drawTile(gameState, currentPlayer)
  gameState.phase = 'discard'
  gameState.hasDrawnThisTurn = true
  // CLAIM disabled for current player
}

// 2. Discard Phase  
if (phase === 'discard') {
  discardTile(gameState, currentPlayer, selectedTile)
  gameState.currentPlayer = (currentPlayer + 1) % 4
  gameState.phase = 'draw'
  gameState.hasDrawnThisTurn = false
  // CLAIM enabled for all players
}
```

### Claim Processing

#### Validation Logic:
```typescript
function isValidClaim(gameState: GameState, claim: ClaimAction): boolean {
  // Check if there's a tile to claim
  if (!gameState.lastDiscard) return false
  
  // Check if player has required tiles
  switch (claim.type) {
    case 'chow':
      // Only from left player + need sequence tiles
      return canFormSequence(player.hand, gameState.lastDiscard)
    case 'pung':
      // Need 2 matching tiles
      return countMatching(player.hand, gameState.lastDiscard) >= 2
    case 'kong':
      // Need 3 matching tiles  
      return countMatching(player.hand, gameState.lastDiscard) >= 3
    case 'win':
      // Check if claim completes winning hand
      return isWinningHand(player.hand.concat([gameState.lastDiscard]))
  }
}
```

### Win Detection

#### Standard Win Algorithm:
```typescript
function checkStandardWin(hand: Tile[], melds: Meld[]): boolean {
  // Need 5 trios + 1 pair = 17 tiles total
  const totalTiles = hand.length + melds.reduce((sum, m) => sum + m.tiles.length, 0)
  if (totalTiles !== 17) return false
  
  // Try to form required combinations from remaining hand tiles
  const neededTrios = 5 - melds.length
  return findTriosAndPair(hand, neededTrios).isValid
}
```

#### Siete Pares Algorithm:
```typescript
function isSietePares(hand: Tile[]): boolean {
  if (hand.length !== 17) return false
  
  const tileCounts = countTileTypes(hand)
  const counts = Array.from(tileCounts.values()).sort((a, b) => b - a)
  
  // Pattern: 1 triple + 7 pairs = [3, 2, 2, 2, 2, 2, 2, 2]
  return counts.length === 8 && 
         counts[0] === 3 && 
         counts.slice(1).every(c => c === 2)
}
```

### Flower Handling

#### Auto-Exposure Logic:
```typescript
function ensureCorrectHandSize(gameState: GameState, playerIndex: number): void {
  const player = gameState.players[playerIndex]
  
  // Keep replacing flowers until hand has only regular tiles
  while (hasFlowerTiles(player.hand)) {
    // Move flowers to collection
    const flowers = player.hand.filter(t => t.isBonus)
    flowers.forEach(flower => {
      player.flowers.push(flower)
      removeFromHand(player.hand, flower)
    })
    
    // Draw replacements from wall
    while (player.hand.length < 16 && gameState.wall.length > 0) {
      const replacement = gameState.wall.shift()!
      if (replacement.isBonus) {
        player.flowers.push(replacement)
      } else {
        player.hand.push(replacement)
      }
    }
  }
}
```

### UI State Management

#### Claim Button Logic:
```typescript
const canClaim = !!gameState.lastDiscard && (
  !isCurrentTurn ||                           // Other players can always claim
  (isCurrentTurn && !gameState.hasDrawnThisTurn) // Current player only before drawing
)
```

#### Drag Sensitivity Improvements:
```typescript
<Reorder.Item
  dragElastic={0.05}        // Reduced from 0.1 for immediate response
  dragMomentum={false}      // Disable momentum for precise control
  dragTransition={{         // Smooth transitions
    bounceStiffness: 600,
    bounceDamping: 20
  }}
>
```

---

## Game Balance & Strategy

### Strategic Considerations:
1. **Ambition Timing**: When to declare vs. when to wait
2. **Claim Priority**: Which claims to make vs. which to pass
3. **Hand Building**: Balancing speed vs. ambition potential
4. **Defensive Play**: Avoiding dangerous discards
5. **Flower Management**: Maximizing bonus tile advantages

### Common Patterns:
- **Early Kongs**: Quick ambition payouts but reveal hand information
- **Concealed Hands**: Higher ambition potential but slower development
- **Mixed Strategies**: Balance between speed and bonus potential

---

This documentation provides the complete framework for Filipino Mahjong implementation, covering all game mechanics, rules, and technical considerations for a fully functional online platform.