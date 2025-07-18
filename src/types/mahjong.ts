// Filipino Mahjong Types

export type TileSuit = 'circles' | 'bamboos' | 'characters' | 'winds' | 'dragons' | 'flowers' | 'seasons'

export type TileValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type WindType = 'east' | 'south' | 'west' | 'north'
export type DragonType = 'red' | 'green' | 'white'
export type FlowerType = 'plum' | 'orchid' | 'chrysanthemum' | 'bamboo'
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter'

export interface Tile {
  id: string
  suit: TileSuit
  value?: TileValue
  wind?: WindType
  dragon?: DragonType
  flower?: FlowerType
  season?: SeasonType
  isBonus: boolean
  isRecentlyDrawn?: boolean
  isRecentlyDiscarded?: boolean
}

export type MeldType = 'chow' | 'pung' | 'kong' | 'secret_kong' | 'sagasa'

export interface Meld {
  id: string
  type: MeldType
  tiles: Tile[]
  isConcealed: boolean
  claimedFrom?: number // player index
}

export interface Player {
  id: string
  name: string
  avatar?: string
  rating: number
  hand: Tile[]
  melds: Meld[]
  flowers: Tile[]
  discards: Tile[]
  isDealer: boolean
  isConnected: boolean
  hasVideo?: boolean
}

export interface GameState {
  id: string
  players: Player[]
  currentPlayer: number
  dealer: number
  wall: Tile[]
  flowerWall: Tile[]
  discardPile: Tile[]
  lastDiscard?: Tile
  round: number
  wind: WindType
  status: 'waiting' | 'playing' | 'finished'
  winner?: number
  scores: number[]
  ambitions: AmbitionRecord[]
  phase: 'draw' | 'discard' // Track whether current player needs to draw or discard
  lastDrawnTile?: Tile // Track the most recently drawn tile
  hasDrawnThisTurn?: boolean // Track if current player has drawn this turn (disables claims)
}

export interface AmbitionRecord {
  id: string
  playerId: string
  type: AmbitionType
  payout: number
  isInstant: boolean
  timestamp: number
}

export type AmbitionType = 
  | 'kang' // Exposed Kong
  | 'secret' // Concealed Kong
  | 'sagasa' // Promoted Kong
  | 'thirteen_flowers' // 13 bonus tiles
  | 'no_flowers_start' // No bonuses after deal
  | 'todas' // Basic win
  | 'escalera' // 1-9 straight
  | 'siete_pares' // Seven pairs + triple
  | 'no_flowers_end' // Win with no bonuses
  | 'all_up' // Concealed hand
  | 'all_down' // All melds exposed
  | 'all_chow' // Hand all Chows
  | 'all_pung' // Hand all Pungs/Kongs
  | 'single' // Difficult wait
  | 'bisaklat' // Dealer wins on initial hand

export interface ClaimAction {
  type: 'chow' | 'pung' | 'kong' | 'win'
  playerId: string
  tiles?: Tile[]
  meldType?: MeldType
}

export interface GameAction {
  type: 'draw' | 'discard' | 'claim' | 'declare_ambition' | 'win'
  playerId: string
  tile?: Tile
  tiles?: Tile[]
  claim?: ClaimAction
  ambition?: AmbitionType
}

export interface WinCondition {
  isValid: boolean
  handType: string
  ambitions: AmbitionType[]
  totalPayout: number
  breakdown: { [key: string]: number }
}