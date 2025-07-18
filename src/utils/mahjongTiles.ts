import { Tile, TileSuit, TileValue, WindType, DragonType, FlowerType, SeasonType } from '@/types/mahjong'

// Create a complete 144-tile set for Filipino Mahjong
export function createTileSet(): Tile[] {
  const tiles: Tile[] = []
  let tileId = 0

  // Suited tiles (108 total)
  const suits: TileSuit[] = ['circles', 'bamboos', 'characters']
  suits.forEach(suit => {
    for (let value = 1; value <= 9; value++) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({
          id: `${suit}-${value}-${copy}`,
          suit,
          value: value as TileValue,
          isBonus: false
        })
        tileId++
      }
    }
  })

  // Wind tiles (16 total)
  const winds: WindType[] = ['east', 'south', 'west', 'north']
  winds.forEach(wind => {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({
        id: `wind-${wind}-${copy}`,
        suit: 'winds',
        wind,
        isBonus: false
      })
      tileId++
    }
  })

  // Dragon tiles (12 total)
  const dragons: DragonType[] = ['red', 'green', 'white']
  dragons.forEach(dragon => {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({
        id: `dragon-${dragon}-${copy}`,
        suit: 'dragons',
        dragon,
        isBonus: false
      })
      tileId++
    }
  })

  // Flower tiles (4 total)
  const flowers: FlowerType[] = ['plum', 'orchid', 'chrysanthemum', 'bamboo']
  flowers.forEach(flower => {
    tiles.push({
      id: `flower-${flower}`,
      suit: 'flowers',
      flower,
      isBonus: true
    })
    tileId++
  })

  // Season tiles (4 total)
  const seasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter']
  seasons.forEach(season => {
    tiles.push({
      id: `season-${season}`,
      suit: 'seasons',
      season,
      isBonus: true
    })
    tileId++
  })

  return tiles
}

// Shuffle tiles using Fisher-Yates algorithm
export function shuffleTiles(tiles: Tile[]): Tile[] {
  const shuffled = [...tiles]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Get tile display name
export function getTileDisplayName(tile: Tile): string {
  if (tile.suit === 'circles') {
    return `${tile.value} Circles`
  }
  if (tile.suit === 'bamboos') {
    return `${tile.value} Bamboos`
  }
  if (tile.suit === 'characters') {
    return `${tile.value} Characters`
  }
  if (tile.suit === 'winds') {
    return `${tile.wind?.charAt(0).toUpperCase()}${tile.wind?.slice(1)} Wind`
  }
  if (tile.suit === 'dragons') {
    return `${tile.dragon?.charAt(0).toUpperCase()}${tile.dragon?.slice(1)} Dragon`
  }
  if (tile.suit === 'flowers') {
    return `${tile.flower?.charAt(0).toUpperCase()}${tile.flower?.slice(1)} Flower`
  }
  if (tile.suit === 'seasons') {
    return `${tile.season?.charAt(0).toUpperCase()}${tile.season?.slice(1)} Season`
  }
  return 'Unknown Tile'
}

// Get tile emoji representation
export function getTileEmoji(tile: Tile): string {
  if (tile.suit === 'circles') {
    const circleEmojis = ['', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨']
    return circleEmojis[tile.value || 0]
  }
  if (tile.suit === 'bamboos') {
    const bambooEmojis = ['', '🎋', '🎋', '🎋', '🎋', '🎋', '🎋', '🎋', '🎋', '🎋']
    return `${tile.value}${bambooEmojis[1]}`
  }
  if (tile.suit === 'characters') {
    const charEmojis = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']
    return charEmojis[tile.value || 0]
  }
  if (tile.suit === 'winds') {
    const windEmojis = { east: '東', south: '南', west: '西', north: '北' }
    return windEmojis[tile.wind as WindType]
  }
  if (tile.suit === 'dragons') {
    const dragonEmojis = { red: '中', green: '發', white: '白' }
    return dragonEmojis[tile.dragon as DragonType]
  }
  if (tile.suit === 'flowers') {
    const flowerEmojis = { plum: '🌸', orchid: '🌺', chrysanthemum: '🌼', bamboo: '🎋' }
    return flowerEmojis[tile.flower as FlowerType] || '🌸'
  }
  if (tile.suit === 'seasons') {
    const seasonEmojis = { spring: '🌱', summer: '☀️', autumn: '🍂', winter: '❄️' }
    return seasonEmojis[tile.season as SeasonType] || '🌱'
  }
  return '🀫'
}

// Check if tiles form a valid sequence (for Chow)
export function isValidSequence(tiles: Tile[]): boolean {
  if (tiles.length !== 3) return false
  
  const suit = tiles[0].suit
  if (!['circles', 'bamboos', 'characters'].includes(suit)) return false
  
  // All tiles must be same suit
  if (!tiles.every(tile => tile.suit === suit)) return false
  
  // Sort by value and check sequence
  const values = tiles.map(tile => tile.value!).sort((a, b) => a - b)
  return values[1] === values[0] + 1 && values[2] === values[1] + 1
}

// Check if tiles form a valid triplet (for Pung)
export function isValidTriplet(tiles: Tile[]): boolean {
  if (tiles.length !== 3) return false
  
  const first = tiles[0]
  return tiles.every(tile => 
    tile.suit === first.suit &&
    tile.value === first.value &&
    tile.wind === first.wind &&
    tile.dragon === first.dragon
  )
}

// Check if tiles form a valid quad (for Kong)
export function isValidQuad(tiles: Tile[]): boolean {
  if (tiles.length !== 4) return false
  
  const first = tiles[0]
  return tiles.every(tile => 
    tile.suit === first.suit &&
    tile.value === first.value &&
    tile.wind === first.wind &&
    tile.dragon === first.dragon
  )
}

// Check if two tiles are identical
export function tilesMatch(tile1: Tile, tile2: Tile): boolean {
  return (
    tile1.suit === tile2.suit &&
    tile1.value === tile2.value &&
    tile1.wind === tile2.wind &&
    tile1.dragon === tile2.dragon &&
    tile1.flower === tile2.flower &&
    tile1.season === tile2.season
  )
}

// Sort tiles for display
export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => {
    // Sort order: circles, bamboos, characters, winds, dragons, flowers, seasons
    const suitOrder = ['circles', 'bamboos', 'characters', 'winds', 'dragons', 'flowers', 'seasons']
    const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit)
    if (suitDiff !== 0) return suitDiff
    
    // Within suit, sort by value/type
    if (a.value && b.value) return a.value - b.value
    if (a.wind && b.wind) {
      const windOrder = ['east', 'south', 'west', 'north']
      return windOrder.indexOf(a.wind) - windOrder.indexOf(b.wind)
    }
    if (a.dragon && b.dragon) {
      const dragonOrder = ['red', 'green', 'white']
      return dragonOrder.indexOf(a.dragon) - dragonOrder.indexOf(b.dragon)
    }
    
    return 0
  })
}