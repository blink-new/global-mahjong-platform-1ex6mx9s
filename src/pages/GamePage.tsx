import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GameTable } from '@/components/mahjong/GameTable'
import { GameState, Player, Tile, ClaimAction } from '@/types/mahjong'
import { initializeGame, drawTile, discardTile, processClaim } from '@/utils/filipinoMahjongLogic'
import { createEnhancedAI, simulateThinkingTime } from '@/utils/enhancedMahjongAI'
import { blink } from '@/blink/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Users, Trophy, Clock } from 'lucide-react'
import { playDiscard, playDraw, playWin, playClaim, initializeSounds } from '@/utils/soundEffects'

export function GamePage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameNotifications, setGameNotifications] = useState<Array<{
    id: string
    title: string
    description: string
    timestamp: number
  }>>([])
  const [claimInProgress, setClaimInProgress] = useState(false)
  const [claimTimeout, setClaimTimeout] = useState<NodeJS.Timeout | null>(null)
  const [aiInstances] = useState(() => ({
    'ai-1': createEnhancedAI('expert'),
    'ai-2': createEnhancedAI('expert'), 
    'ai-3': createEnhancedAI('expert')
  }))

  // Custom notification function
  const showGameNotification = useCallback((title: string, description: string) => {
    const notification = {
      id: Date.now().toString(),
      title,
      description,
      timestamp: Date.now()
    }
    setGameNotifications(prev => [...prev, notification])
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setGameNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 3000)
  }, [])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setCurrentUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (currentUser && gameId) {
      initializeGameState()
    }
  }, [currentUser, gameId]) // eslint-disable-line react-hooks/exhaustive-deps

  const initializeGameState = async () => {
    try {
      // Check if this is a quick match
      if (gameId === 'quick-match') {
        // Immediately start a game with AI opponents
        const quickMatchPlayers: Player[] = [
          {
            id: currentUser.id,
            name: currentUser.displayName || 'You',
            avatar: currentUser.avatar,
            rating: currentUser.rating || 1500,
            hand: [],
            melds: [],
            flowers: [],
            discards: [],
            isDealer: true, // User starts as dealer in quick match
            isConnected: true,
            hasVideo: false // No video in quick match for simplicity
          },
          {
            id: 'ai-1',
            name: 'Chen Wei',
            rating: 2150,
            hand: [],
            melds: [],
            flowers: [],
            discards: [],
            isDealer: false,
            isConnected: true,
            hasVideo: false
          },
          {
            id: 'ai-2',
            name: 'Yuki Tanaka',
            rating: 2380,
            hand: [],
            melds: [],
            flowers: [],
            discards: [],
            isDealer: false,
            isConnected: true,
            hasVideo: false
          },
          {
            id: 'ai-3',
            name: 'Sarah Kim',
            rating: 2050,
            hand: [],
            melds: [],
            flowers: [],
            discards: [],
            isDealer: false,
            isConnected: true,
            hasVideo: false
          }
        ]

        const newGameState = initializeGame(quickMatchPlayers)
        setGameState(newGameState)
        
        // Show quick match notification
        showGameNotification("Quick Match Started!", "You're now playing Filipino Mahjong with AI opponents.")
        
        // Start AI turn simulation if it's not user's turn
        if (newGameState.currentPlayer !== 0) {
          setTimeout(() => simulateAITurn(newGameState), 2000)
        }
        
        return
      }
      
      // For any other gameId, treat as practice game

      // Fallback to AI practice game
      const mockPlayers: Player[] = [
        {
          id: currentUser.id,
          name: currentUser.displayName || 'You',
          avatar: currentUser.avatar,
          rating: 1500,
          hand: [],
          melds: [],
          flowers: [],
          discards: [],
          isDealer: false,
          isConnected: true,
          hasVideo: true
        },
        {
          id: 'ai-1',
          name: 'Chen Wei',
          rating: 2150,
          hand: [],
          melds: [],
          flowers: [],
          discards: [],
          isDealer: false,
          isConnected: true,
          hasVideo: false
        },
        {
          id: 'ai-2',
          name: 'Yuki Tanaka',
          rating: 2380,
          hand: [],
          melds: [],
          flowers: [],
          discards: [],
          isDealer: false,
          isConnected: true,
          hasVideo: true
        },
        {
          id: 'ai-3',
          name: 'Sarah Kim',
          rating: 2050,
          hand: [],
          melds: [],
          flowers: [],
          discards: [],
          isDealer: false,
          isConnected: true,
          hasVideo: false
        }
      ]

      const newGameState = initializeGame(mockPlayers)
      setGameState(newGameState)
      
      // Start AI turn simulation
      if (newGameState.currentPlayer !== 0) {
        setTimeout(() => simulateAITurn(newGameState), 2000)
      }
    } catch (err) {
      setError('Failed to initialize game')
      console.error('Game initialization error:', err)
    }
  }

  const simulateAITurn = async (currentGameState: GameState) => {
    if (!currentGameState || currentGameState.status !== 'playing') return
    if (claimInProgress) return // Stop AI processing if claim is in progress

    const currentPlayerIndex = currentGameState.currentPlayer
    const currentPlayer = currentGameState.players[currentPlayerIndex]
    
    if (currentPlayer.id === currentUser?.id) return // Don't simulate user turns

    const ai = aiInstances[currentPlayer.id as keyof typeof aiInstances]
    if (!ai) return

    try {
      // Get AI decision
      const decision = ai.makeDecision(currentGameState, currentPlayer.id)
      
      // Show AI thinking indicator
      showGameNotification(`${currentPlayer.name} is thinking...`, 
        decision.action === 'draw' ? "Drawing a tile" : 
        decision.action === 'discard' ? "Choosing which tile to discard" :
        decision.action === 'claim' ? "Considering a claim" : "Analyzing hand")

      // Simulate thinking time
      await simulateThinkingTime(1.5)

      // Execute AI decision
      switch (decision.action) {
        case 'draw':
          if (currentGameState.phase === 'draw') {
            const drawnTile = drawTile(currentGameState, currentPlayerIndex)
            console.log(`AI ${currentPlayer.name} drew a tile. Hand size: ${currentPlayer.hand.length}`)
            playDraw()
            setGameState({ ...currentGameState })
            
            showGameNotification(`${currentPlayer.name} drew a tile`, `Hand size: ${currentPlayer.hand.length}`)
            
            // After drawing, continue with discard decision
            setTimeout(() => simulateAITurn(currentGameState), 1000)
          }
          break

        case 'discard':
          if (currentGameState.phase === 'discard' && decision.tile) {
            console.log(`AI ${currentPlayer.name} discarding strategically. Hand size before: ${currentPlayer.hand.length}`)
            discardTile(currentGameState, currentPlayerIndex, decision.tile)
            console.log(`AI ${currentPlayer.name} discarded. Hand size after: ${currentPlayer.hand.length}`)
            playDiscard()
            setGameState({ ...currentGameState })
            
            showGameNotification(`${currentPlayer.name} discarded`, 
              `${decision.tile.suit} ${decision.tile.value || decision.tile.wind || decision.tile.dragon}`)
            
            // Start claim window
            setClaimInProgress(true)
            
            if (claimTimeout) {
              clearTimeout(claimTimeout)
            }
            
            const newTimeout = setTimeout(() => {
              setClaimInProgress(false)
              setClaimTimeout(null)
              
              // Continue AI simulation if next player is also AI
              const nextPlayerIndex = currentGameState.currentPlayer
              const nextPlayer = currentGameState.players[nextPlayerIndex]
              
              if (nextPlayer.id !== currentUser?.id) {
                setTimeout(() => simulateAITurn(currentGameState), 1000)
              }
            }, 8000)
            
            setClaimTimeout(newTimeout)
          }
          break

        case 'claim':
          if (decision.claimAction) {
            // AI wants to claim - process immediately
            const success = processClaim(currentGameState, decision.claimAction)
            if (success) {
              setGameState({ ...currentGameState })
              
              if (decision.claimAction.type === 'win') {
                playWin()
                showGameNotification(`${currentPlayer.name} wins!`, "Game Over!")
              } else {
                playClaim()
                const claimType = decision.claimAction.type.charAt(0).toUpperCase() + decision.claimAction.type.slice(1)
                showGameNotification(`${currentPlayer.name} claimed!`, `Used ${claimType} to claim the tile`)
              }
              
              // Clear claim timeout since claim was made
              if (claimTimeout) {
                clearTimeout(claimTimeout)
                setClaimTimeout(null)
              }
              setClaimInProgress(false)
              
              // Continue with AI turn if they need to discard
              if (currentGameState.phase === 'discard') {
                setTimeout(() => simulateAITurn(currentGameState), 1500)
              }
            }
          }
          break

        case 'win': {
          // AI declares win
          const winClaim: ClaimAction = { type: 'win', playerId: currentPlayer.id }
          const success = processClaim(currentGameState, winClaim)
          if (success) {
            setGameState({ ...currentGameState })
            playWin()
            showGameNotification(`${currentPlayer.name} wins!`, "Congratulations to the winner!")
          }
          break
        }
      }
    } catch (error) {
      console.error('AI decision error:', error)
      // Fallback to simple random decision
      if (currentGameState.phase === 'draw') {
        const drawnTile = drawTile(currentGameState, currentPlayerIndex)
        if (drawnTile) {
          playDraw()
          setGameState({ ...currentGameState })
          setTimeout(() => simulateAITurn(currentGameState), 1000)
        }
      } else if (currentGameState.phase === 'discard' && currentPlayer.hand.length > 0) {
        const randomTile = currentPlayer.hand[Math.floor(Math.random() * currentPlayer.hand.length)]
        discardTile(currentGameState, currentPlayerIndex, randomTile)
        playDiscard()
        setGameState({ ...currentGameState })
      }
    }
  }

  const handleTileClick = (tile: Tile) => {
    if (!gameState || !currentUser) return
    
    const playerIndex = gameState.players.findIndex(p => p.id === currentUser.id)
    if (playerIndex === -1 || gameState.currentPlayer !== playerIndex) return
    
    const player = gameState.players[playerIndex]
    
    // Check if player needs to draw first
    if (gameState.phase === 'draw') {
      console.log(`User needs to draw a tile first. Current phase: ${gameState.phase}`)
      const drawnTile = drawTile(gameState, playerIndex)
      if (drawnTile) {
        console.log(`User drew a tile: ${drawnTile.suit} ${drawnTile.value}. New hand size: ${player.hand.length}`)
        playDraw() // Play draw sound
        setGameState({ ...gameState })
      }
      return // Don't process tile selection until after drawing
    }
    
    console.log('Tile clicked:', tile)
  }

  const handleDiscard = (tile: Tile) => {
    if (!gameState || !currentUser) return

    const playerIndex = gameState.players.findIndex(p => p.id === currentUser.id)
    if (playerIndex === -1 || gameState.currentPlayer !== playerIndex) return

    // Only allow discard when in discard phase
    if (gameState.phase !== 'discard') {
      console.log(`Cannot discard during ${gameState.phase} phase`)
      return
    }

    const player = gameState.players[playerIndex]
    console.log(`User discarding. Hand size before: ${player.hand.length}`)
    
    discardTile(gameState, playerIndex, tile)
    console.log(`User discarded. Hand size after: ${player.hand.length}`)
    
    playDiscard() // Play discard sound
    setGameState({ ...gameState })

    // Trigger AI turns - longer delay for AI to have chance to claim
    setTimeout(() => simulateAITurn(gameState), 2500)
  }

  const handleClaim = (action: ClaimAction) => {
    if (!gameState) return

    const claimingPlayer = gameState.players.find(p => p.id === action.playerId)
    const success = processClaim(gameState, action)
    
    if (success) {
      setGameState({ ...gameState })
      
      // Play appropriate sound
      if (action.type === 'win') {
        playWin()
      } else {
        playClaim()
      }
      
      // Show notification to all players
      const claimType = action.type.charAt(0).toUpperCase() + action.type.slice(1)
      const playerName = claimingPlayer?.name || 'Player'
      
      if (action.playerId === currentUser?.id) {
        showGameNotification(`${claimType} Successful!`, `You claimed the ${gameState.lastDiscard?.suit} ${gameState.lastDiscard?.value} tile.`)
      } else {
        showGameNotification(`${playerName} claimed a tile!`, `${playerName} used ${claimType} to claim the ${gameState.lastDiscard?.suit} ${gameState.lastDiscard?.value} tile.`)
      }
      
      // If it's still an AI turn after claim, continue simulation
      const currentPlayerIndex = gameState.currentPlayer
      const currentPlayer = gameState.players[currentPlayerIndex]
      
      if (currentPlayer.id !== currentUser?.id) {
        setTimeout(() => simulateAITurn(gameState), 1500)
      }
    } else {
      // Show error notification
      showGameNotification("Claim Failed", "Invalid claim. You don't have the required tiles.")
    }
  }

  const handleClaimTimeout = useCallback(() => {
    showGameNotification("Claim Window Expired", "You took too long to make a claim. The game continues.")
  }, [showGameNotification])

  const handleDeclareAmbition = (ambition: string) => {
    console.log('Ambition declared:', ambition)
    // Handle ambition declaration logic
  }

  const handleTileReorder = (newOrder: Tile[]) => {
    if (!gameState || !currentUser) return
    
    const playerIndex = gameState.players.findIndex(p => p.id === currentUser.id)
    if (playerIndex === -1) return
    
    // Update the player's hand with the new order
    const updatedGameState = { ...gameState }
    updatedGameState.players[playerIndex].hand = newOrder
    setGameState(updatedGameState)
  }

  const handleLeaveGame = () => {
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
            <div className="w-8 h-8 bg-primary-foreground rounded opacity-50" />
          </div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400">Game Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!gameState || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Game not found</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (gameState.status === 'finished') {
    const winner = gameState.winner !== undefined ? gameState.players[gameState.winner] : null
    const isWinner = winner?.id === currentUser.id

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <Card className="bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-2">
                <Trophy className={`w-6 h-6 ${isWinner ? 'text-accent' : 'text-muted-foreground'}`} />
                <span>Game Finished</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {isWinner ? (
                  <div>
                    <h2 className="text-2xl font-bold text-accent mb-2">Congratulations!</h2>
                    <p className="text-muted-foreground">You won the game!</p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Game Over</h2>
                    <p className="text-muted-foreground">
                      Winner: <span className="text-accent font-semibold">{winner?.name}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Final Scores</h3>
                {gameState.players.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <span className={player.id === currentUser.id ? 'font-semibold' : ''}>
                      {player.name}
                    </span>
                    <Badge variant={index === gameState.winner ? 'default' : 'secondary'}>
                      {gameState.scores[index]} pts
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button variant="outline" className="w-full">
                  Play Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Game header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeaveGame}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Leave Game
              </Button>
              
              <div className="flex items-center space-x-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>Filipino Mahjong</span>
                <span className="text-muted-foreground">•</span>
                <span>{gameId === 'quick-match' ? 'Quick Match' : `Game #${gameId}`}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Round {gameState.round}</span>
              </div>
              <Badge variant="secondary">
                {gameState.wind.charAt(0).toUpperCase() + gameState.wind.slice(1)} Wind
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Game Notifications - positioned below upper left UI */}
      <div className="fixed top-20 left-4 z-30 space-y-2 max-w-sm">
        <AnimatePresence>
          {gameNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.8 }}
              className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg"
            >
              <div className="text-sm font-medium text-foreground">
                {notification.title}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {notification.description}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Game table */}
      <div className="pt-16">
        <GameTable
          gameState={gameState}
          currentUserId={currentUser.id}
          onTileClick={handleTileClick}
          onDiscard={handleDiscard}
          onClaim={handleClaim}
          onDeclareAmbition={handleDeclareAmbition}
          onTileReorder={handleTileReorder}
          onClaimTimeout={handleClaimTimeout}
        />
      </div>
    </div>
  )
}