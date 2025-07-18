import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MahjongTile } from './MahjongTile'
import { PlayerHand } from './PlayerHand'
import { DiscardPileViewer } from './DiscardPileViewer'
import { GameStats } from './GameStats'
import { GameHints } from './GameHints'
import { GameState, Player, Tile, ClaimAction } from '@/types/mahjong'
import { sortTiles } from '@/utils/mahjongTiles'
import { 
  Clock, 
  Users, 
  Crown,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  MessageCircle,
  History,
  Volume2,
  VolumeX
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { setSoundEnabled, isSoundEnabled } from '@/utils/soundEffects'
import { useIsMobile } from '@/hooks/use-mobile'

interface GameTableProps {
  gameState: GameState
  currentUserId: string
  onTileClick: (tile: Tile) => void
  onDiscard: (tile: Tile) => void
  onClaim: (action: ClaimAction) => void
  onDeclareAmbition: (ambition: string) => void
  onTileReorder?: (newOrder: Tile[]) => void
  onClaimTimeout?: () => void
}

export function GameTable({
  gameState,
  currentUserId,
  onTileClick,
  onDiscard,
  onClaim,
  onDeclareAmbition,
  onTileReorder,
  onClaimTimeout
}: GameTableProps) {
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [showClaimOptions, setShowClaimOptions] = useState(false)
  const [claimTimeLeft, setClaimTimeLeft] = useState(0)
  const [showDiscardViewer, setShowDiscardViewer] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled())
  const isMobile = useIsMobile()

  const currentPlayer = gameState.players.find(p => p.id === currentUserId)
  const currentPlayerIndex = gameState.players.findIndex(p => p.id === currentUserId)
  const isCurrentTurn = gameState.currentPlayer === currentPlayerIndex
  
  // CLAIM button logic: Disable only for current player when they're drawing
  // Other players can always claim if there's a valid discard
  const canClaim = !!gameState.lastDiscard && (
    !isCurrentTurn || // Other players can always claim
    (isCurrentTurn && !gameState.hasDrawnThisTurn) // Current player can claim only if they haven't drawn yet
  )

  // Timer countdown
  useEffect(() => {
    if (isCurrentTurn && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [isCurrentTurn, timeLeft])

  // Reset timer when turn changes
  useEffect(() => {
    setTimeLeft(30)
  }, [gameState.currentPlayer])

  // Claim timer countdown
  useEffect(() => {
    if (showClaimOptions && claimTimeLeft > 0) {
      const timer = setTimeout(() => setClaimTimeLeft(claimTimeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (showClaimOptions && claimTimeLeft === 0) {
      // Auto-close claim options when timer expires
      setShowClaimOptions(false)
      // Show notification that claim window expired
      onClaimTimeout?.()
    }
  }, [showClaimOptions, claimTimeLeft, onClaimTimeout])

  // Start claim timer when claim options are shown
  useEffect(() => {
    if (showClaimOptions) {
      setClaimTimeLeft(8) // 8 seconds to make a claim
    }
  }, [showClaimOptions])

  const handleTileClick = (tile: Tile) => {
    if (!isCurrentTurn) return
    
    if (selectedTile?.id === tile.id) {
      setSelectedTile(null)
    } else {
      setSelectedTile(tile)
      onTileClick(tile)
    }
  }

  const handleDiscard = () => {
    if (selectedTile && isCurrentTurn) {
      onDiscard(selectedTile)
      setSelectedTile(null)
    }
  }

  const handleTableClick = () => {
    setShowDiscardViewer(true)
  }

  const handleSoundToggle = () => {
    const newSoundEnabled = !soundEnabled
    setSoundEnabledState(newSoundEnabled)
    setSoundEnabled(newSoundEnabled)
  }

  // Prepare data for discard viewer
  const playerDiscards: { [playerId: string]: Tile[] } = {}
  const playerNames: { [playerId: string]: string } = {}
  
  gameState.players.forEach(player => {
    playerDiscards[player.id] = player.discards
    playerNames[player.id] = player.name
  })

  const getPlayerPosition = (playerIndex: number) => {
    // Arrange players around the table relative to current player
    const positions = ['bottom', 'right', 'top', 'left']
    const relativeIndex = (playerIndex - currentPlayerIndex + 4) % 4
    return positions[relativeIndex]
  }

  const renderPlayer = (player: Player, index: number) => {
    const position = getPlayerPosition(index)
    const isCurrentPlayerTurn = gameState.currentPlayer === index
    const isDealer = player.isDealer

    // Skip rendering the current user (bottom position) as it's integrated into PlayerHand
    if (position === 'bottom') {
      return null
    }

    return (
      <div
        key={player.id}
        className={cn(
          'absolute flex items-center z-20',
          isMobile ? 'space-x-2' : 'space-x-3',
          position === 'top' && (isMobile 
            ? 'top-4 left-1/2 transform -translate-x-1/2' 
            : 'top-12 left-1/2 transform -translate-x-1/2'
          ),
          position === 'left' && (isMobile 
            ? 'left-2 top-1/2 transform -translate-y-1/2' 
            : 'left-12 top-1/2 transform -translate-y-1/2'
          ),
          position === 'right' && (isMobile 
            ? 'right-2 top-1/2 transform -translate-y-1/2' 
            : 'right-12 top-1/2 transform -translate-y-1/2'
          )
        )}
      >
        <Card className={cn(
          'bg-card/95 backdrop-blur-sm transition-all duration-300 border-2',
          isCurrentPlayerTurn && 'ring-2 ring-accent shadow-lg shadow-accent/50 border-accent/50 bg-accent/10',
          !isCurrentPlayerTurn && 'border-border/50'
        )}>
          <CardContent className={isMobile ? "p-2" : "p-3"}>
            <div className={cn(
              "flex items-center",
              isMobile ? "space-x-2" : "space-x-3"
            )}>
              <div className="relative">
                <Avatar className={cn(
                  'transition-all duration-300',
                  isMobile ? 'w-8 h-8' : 'w-12 h-12',
                  isCurrentPlayerTurn && 'ring-2 ring-accent/50'
                )}>
                  <AvatarImage src={player.avatar} />
                  <AvatarFallback className={cn(
                    "bg-primary text-primary-foreground font-semibold",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {player.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isDealer && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-background">
                    <Crown className="w-3 h-3 text-accent-foreground" />
                  </div>
                )}
                {!player.isConnected && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
                {isCurrentPlayerTurn && (
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-sm truncate">{player.name}</h4>
                  {player.hasVideo && (
                    <Badge variant="secondary" className="text-xs">
                      <Video className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>Rating: {player.rating}</span>
                  <span>•</span>
                  <span>Tiles: {player.hand.length}</span>
                </div>
                {/* Show flowers */}
                {player.flowers.length > 0 && (
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs text-pink-400">Flowers:</span>
                    {player.flowers.map((flower) => (
                      <MahjongTile key={flower.id} tile={flower} size="sm" />
                    ))}
                  </div>
                )}
                
                {/* Show melds */}
                {player.melds.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-green-400 mb-1">Melds:</div>
                    <div className="space-y-1">
                      {player.melds.map((meld, meldIndex) => (
                        <div key={meld.id} className="flex items-center space-x-1">
                          <span className="text-xs text-muted-foreground capitalize">
                            {meld.type}:
                          </span>
                          {meld.tiles.map((tile, tileIndex) => (
                            <MahjongTile 
                              key={`${meld.id}-${tile.id}`} 
                              tile={tile} 
                              size="sm"
                              className={meld.isConcealed ? 'opacity-60' : ''}
                            />
                          ))}
                          {!meld.isConcealed && (
                            <span className="text-xs text-blue-400">exposed</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {isCurrentPlayerTurn && (
              <div className="mt-2 flex items-center justify-center">
                <div className="flex items-center space-x-2 text-xs">
                  <Clock className="w-3 h-3 text-accent" />
                  <span className={cn(
                    'font-mono',
                    timeLeft <= 10 ? 'text-red-400' : 'text-accent'
                  )}>
                    {timeLeft}s
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-background via-card/20 to-background overflow-hidden">
      {/* Game Table - responsive sizing and positioning */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        isMobile 
          ? "pb-52 pt-12" // More space for mobile player hand and compact header
          : "pb-44 pt-16" // Desktop spacing
      )}>
        <div className={cn(
          "relative bg-gradient-to-br from-primary/20 to-primary/40 rounded-full border-4 border-primary/50 shadow-2xl",
          isMobile 
            ? "w-56 h-56" // Even smaller table on mobile for better fit
            : "w-80 h-80" // Full size on desktop
        )}>
          {/* Center discard area - clickable */}
          <div 
            className={cn(
              "absolute bg-card/50 rounded-full border-2 border-border flex items-center justify-center cursor-pointer hover:bg-card/70 transition-colors group",
              isMobile ? "inset-4" : "inset-8"
            )}
            onClick={handleTableClick}
          >
            <div className="text-center">
              <div className={cn(
                "text-muted-foreground mb-1 group-hover:text-foreground transition-colors",
                isMobile ? "text-xs" : "text-sm"
              )}>
                Discards
              </div>
              <div className={cn(
                "grid gap-0.5",
                isMobile ? "grid-cols-2 max-w-16" : "grid-cols-4 max-w-32"
              )}>
                {gameState.discardPile.slice(isMobile ? -4 : -8).map((tile, index) => {
                  const isLastDiscard = gameState.lastDiscard && tile.id === gameState.lastDiscard.id && index === gameState.discardPile.slice(isMobile ? -4 : -8).length - 1
                  return (
                    <MahjongTile
                      key={`${tile.id}-${index}`}
                      tile={tile}
                      size="sm"
                      isDiscarded
                      isRecentDiscard={isLastDiscard}
                    />
                  )
                })}
              </div>
              {gameState.lastDiscard && (
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Last: {gameState.lastDiscard.suit}
                  </Badge>
                </div>
              )}
              <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                  <History className="w-3 h-3" />
                  <span>{isMobile ? "Tap" : "Click"} to view all</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Players around the table */}
      {gameState.players.map((player, index) => renderPlayer(player, index))}

      {/* Current player's hand (bottom) - positioned to not cover table */}
      {currentPlayer && (
        <div className={cn(
          "absolute left-1/2 transform -translate-x-1/2 w-full",
          isMobile 
            ? "bottom-1 px-2 max-w-full" 
            : "bottom-1 px-4 max-w-5xl"
        )}>
          <PlayerHand
            tiles={currentPlayer.hand}
            selectedTile={selectedTile}
            isCurrentTurn={isCurrentTurn}
            player={currentPlayer}
            gameState={gameState}
            onTileClick={handleTileClick}
            onTileReorder={onTileReorder || (() => {})}
            onDiscard={handleDiscard}
            onClaim={() => setShowClaimOptions(true)}
            onWin={() => onDeclareAmbition('todas')}
            onDraw={() => onTileClick(currentPlayer.hand[0])}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Game controls */}
      <div className={cn(
        "absolute flex items-center",
        isMobile 
          ? "top-2 right-2 space-x-1" 
          : "top-4 right-4 space-x-2"
      )}>
        <Button
          size={isMobile ? "sm" : "sm"}
          variant="outline"
          onClick={() => setVideoEnabled(!videoEnabled)}
          className={cn(
            videoEnabled ? 'text-green-400' : 'text-red-400',
            isMobile && "h-8 w-8 p-0"
          )}
        >
          {videoEnabled ? <Video className={isMobile ? "w-3 h-3" : "w-4 h-4"} /> : <VideoOff className={isMobile ? "w-3 h-3" : "w-4 h-4"} />}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={cn(
            audioEnabled ? 'text-green-400' : 'text-red-400',
            isMobile && "h-8 w-8 p-0"
          )}
        >
          {audioEnabled ? <Mic className={isMobile ? "w-3 h-3" : "w-4 h-4"} /> : <MicOff className={isMobile ? "w-3 h-3" : "w-4 h-4"} />}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleSoundToggle}
          className={cn(
            'border-2 transition-all duration-200',
            soundEnabled 
              ? 'text-green-400 border-green-400/50 hover:bg-green-400/10' 
              : 'text-red-400 border-red-400/50 hover:bg-red-400/10',
            isMobile && "h-8 w-8 p-0"
          )}
          title={soundEnabled ? 'Sound Effects: ON' : 'Sound Effects: OFF'}
        >
          {soundEnabled ? <Volume2 className={isMobile ? "w-3 h-3" : "w-4 h-4"} /> : <VolumeX className={isMobile ? "w-3 h-3" : "w-4 h-4"} />}
        </Button>
        
        {!isMobile && (
          <>
            <Button size="sm" variant="outline">
              <MessageCircle className="w-4 h-4" />
            </Button>
            
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Game info */}
      <div className={cn(
        "absolute",
        isMobile ? "top-2 left-2" : "top-4 left-4"
      )}>
        <Card className="bg-card/90 backdrop-blur-sm">
          <CardContent className={isMobile ? "p-1.5" : "p-2"}>
            <div className={cn(
              "flex items-center",
              isMobile ? "space-x-2 text-xs" : "space-x-3 text-sm"
            )}>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span>R{gameState.round}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Crown className="w-3 h-3 text-accent" />
                <span>{gameState.wind}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span>{gameState.wall.length}</span>
              </div>
            </div>
            {!isMobile && (
              <div className="mt-1 text-xs text-muted-foreground">
                Quick Match with AI • Phase: {gameState.phase === 'draw' ? 'Draw tile' : 'Discard tile'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Claim options modal */}
      <AnimatePresence>
        {showClaimOptions && gameState.lastDiscard && currentPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowClaimOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card p-6 rounded-lg border border-border shadow-xl max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Claim Options</h3>
                <div className={cn(
                  'flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium',
                  claimTimeLeft <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-accent/20 text-accent'
                )}>
                  <Clock className="w-4 h-4" />
                  <span>{claimTimeLeft}s</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm text-muted-foreground">Last discard:</span>
                <MahjongTile tile={gameState.lastDiscard} size="sm" />
                <span className="text-sm font-medium">{gameState.lastDiscard.suit} {gameState.lastDiscard.value}</span>
              </div>
              
              <div className="space-y-2">
                {/* Chow option - using same pattern as Kong/Pung */}
                {(() => {
                  // Check if player can form a chow with the last discard
                  if (!gameState.lastDiscard || !['circles', 'bamboos', 'characters'].includes(gameState.lastDiscard.suit)) {
                    return null
                  }
                  
                  const discardValue = gameState.lastDiscard.value!
                  const suitTiles = currentPlayer.hand.filter(t => t.suit === gameState.lastDiscard!.suit && t.value)
                  
                  // Check for possible sequences using the same logic as filipinoMahjongLogic.ts
                  let canFormChow = false
                  let sequenceType = ''
                  let foundTiles: Tile[] = []
                  
                  // Pattern 1: discard + 1 + 2 (e.g., 2-3-4 with discard=2)
                  if (discardValue <= 7) {
                    const tile1 = suitTiles.find(t => t.value === discardValue + 1)
                    const tile2 = suitTiles.find(t => t.value === discardValue + 2)
                    if (tile1 && tile2) {
                      canFormChow = true
                      sequenceType = `${discardValue}-${discardValue + 1}-${discardValue + 2}`
                      foundTiles = [gameState.lastDiscard, tile1, tile2]
                    }
                  }
                  
                  // Pattern 2: -1 + discard + 1 (e.g., 2-3-4 with discard=3)
                  if (!canFormChow && discardValue >= 2 && discardValue <= 8) {
                    const tile1 = suitTiles.find(t => t.value === discardValue - 1)
                    const tile2 = suitTiles.find(t => t.value === discardValue + 1)
                    if (tile1 && tile2) {
                      canFormChow = true
                      sequenceType = `${discardValue - 1}-${discardValue}-${discardValue + 1}`
                      foundTiles = [tile1, gameState.lastDiscard, tile2]
                    }
                  }
                  
                  // Pattern 3: -2 + -1 + discard (e.g., 2-3-4 with discard=4)
                  if (!canFormChow && discardValue >= 3) {
                    const tile1 = suitTiles.find(t => t.value === discardValue - 2)
                    const tile2 = suitTiles.find(t => t.value === discardValue - 1)
                    if (tile1 && tile2) {
                      canFormChow = true
                      sequenceType = `${discardValue - 2}-${discardValue - 1}-${discardValue}`
                      foundTiles = [tile1, tile2, gameState.lastDiscard]
                    }
                  }
                  
                  return canFormChow && (
                    <Button
                      className="w-full justify-start text-left p-3"
                      variant="outline"
                      onClick={() => {
                        onClaim({ type: 'chow', playerId: currentUserId })
                        setShowClaimOptions(false)
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold">Chow:</span>
                        <div className="flex items-center space-x-1">
                          {foundTiles.map((tile, i) => (
                            <MahjongTile key={i} tile={tile} size="sm" />
                          ))}
                        </div>
                        <span className="text-sm">{sequenceType}</span>
                      </div>
                    </Button>
                  )
                })()}
                
                {/* Pung option */}
                {(() => {
                  const matchingTiles = currentPlayer.hand.filter(t => t.suit === gameState.lastDiscard!.suit && 
                    t.value === gameState.lastDiscard!.value && 
                    t.wind === gameState.lastDiscard!.wind && 
                    t.dragon === gameState.lastDiscard!.dragon)
                  
                  return matchingTiles.length >= 2 && (
                    <Button
                      className="w-full justify-start p-3"
                      onClick={() => {
                        onClaim({ type: 'pung', playerId: currentUserId })
                        setShowClaimOptions(false)
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold">Pung:</span>
                        <div className="flex items-center space-x-1">
                          <MahjongTile tile={gameState.lastDiscard} size="sm" />
                          {matchingTiles.slice(0, 2).map((tile, i) => (
                            <MahjongTile key={i} tile={tile} size="sm" />
                          ))}
                        </div>
                      </div>
                    </Button>
                  )
                })()}
                
                {/* Kong option */}
                {(() => {
                  const matchingTiles = currentPlayer.hand.filter(t => t.suit === gameState.lastDiscard!.suit && 
                    t.value === gameState.lastDiscard!.value && 
                    t.wind === gameState.lastDiscard!.wind && 
                    t.dragon === gameState.lastDiscard!.dragon)
                  
                  return matchingTiles.length >= 3 && (
                    <Button
                      className="w-full justify-start p-3"
                      onClick={() => {
                        onClaim({ type: 'kong', playerId: currentUserId })
                        setShowClaimOptions(false)
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold">Kong:</span>
                        <div className="flex items-center space-x-1">
                          <MahjongTile tile={gameState.lastDiscard} size="sm" />
                          {matchingTiles.slice(0, 3).map((tile, i) => (
                            <MahjongTile key={i} tile={tile} size="sm" />
                          ))}
                        </div>
                      </div>
                    </Button>
                  )
                })()}
                
                <Button
                  className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    onClaim({ type: 'win', playerId: currentUserId })
                    setShowClaimOptions(false)
                  }}
                >
                  WIN
                </Button>
              </div>
              
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowClaimOptions(false)}
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Statistics - DISABLED */}
      {/* <GameStats gameState={gameState} currentUserId={currentUserId} /> */}

      {/* Game Hints */}
      <GameHints gameState={gameState} currentUserId={currentUserId} />

      {/* Discard Pile Viewer */}
      <DiscardPileViewer
        isOpen={showDiscardViewer}
        onClose={() => setShowDiscardViewer(false)}
        discardPile={gameState.discardPile}
        playerDiscards={playerDiscards}
        playerNames={playerNames}
      />
    </div>
  )
}