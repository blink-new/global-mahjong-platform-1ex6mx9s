import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GameState } from '@/types/mahjong'
import { 
  Lightbulb, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Target,
  Zap,
  Crown,
  Shuffle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GameHintsProps {
  gameState: GameState
  currentUserId: string
}

interface Hint {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  priority: 'low' | 'medium' | 'high'
  category: 'gameplay' | 'strategy' | 'rules' | 'ui'
}

export function GameHints({ gameState, currentUserId }: GameHintsProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [hasSeenHints, setHasSeenHints] = useState(false)

  const currentPlayer = gameState.players.find(p => p.id === currentUserId)
  const currentPlayerIndex = gameState.players.findIndex(p => p.id === currentUserId)
  const isCurrentTurn = gameState.currentPlayer === currentPlayerIndex

  // Generate contextual hints based on game state
  const generateHints = (): Hint[] => {
    const hints: Hint[] = []

    // First-time player hints
    if (!hasSeenHints) {
      hints.push({
        id: 'welcome',
        title: 'Welcome to Filipino Mahjong!',
        description: 'Click tiles to select them, then use the action buttons below. Press S to auto-sort your tiles.',
        icon: <Crown className="w-4 h-4" />,
        priority: 'high',
        category: 'gameplay'
      })
    }

    // Phase-specific hints
    if (isCurrentTurn) {
      if (gameState.phase === 'draw') {
        hints.push({
          id: 'draw-phase',
          title: 'Draw Phase',
          description: 'Click the Draw button to draw a tile from the wall. You must draw before you can discard.',
          icon: <Target className="w-4 h-4" />,
          priority: 'high',
          category: 'gameplay'
        })
      } else if (gameState.phase === 'discard') {
        hints.push({
          id: 'discard-phase',
          title: 'Discard Phase',
          description: 'Select a tile from your hand and click Discard. Choose wisely - other players can claim your discards!',
          icon: <Zap className="w-4 h-4" />,
          priority: 'high',
          category: 'gameplay'
        })
      }
    }

    // Hand organization hints
    if (currentPlayer && currentPlayer.hand.length > 10) {
      const hasSequentialTiles = checkForSequentialTiles(currentPlayer.hand)
      if (hasSequentialTiles) {
        hints.push({
          id: 'organize-hand',
          title: 'Organize Your Hand',
          description: 'You have tiles that could form sequences. Press S to auto-sort or drag tiles to arrange them manually.',
          icon: <Shuffle className="w-4 h-4" />,
          priority: 'medium',
          category: 'ui'
        })
      }
    }

    // Claiming opportunities
    if (gameState.lastDiscard && !isCurrentTurn) {
      hints.push({
        id: 'claim-opportunity',
        title: 'Claiming Opportunity',
        description: 'Another player just discarded a tile. Check if you can claim it for Chow, Pung, Kong, or Win!',
        icon: <Lightbulb className="w-4 h-4" />,
        priority: 'high',
        category: 'strategy'
      })
    }

    // Flower collection hints
    if (currentPlayer && currentPlayer.flowers.length > 0) {
      hints.push({
        id: 'flowers-bonus',
        title: 'Flower Bonus',
        description: `You have ${currentPlayer.flowers.length} flower(s)! Flowers give bonus points and are automatically replaced when drawn.`,
        icon: <Crown className="w-4 h-4" />,
        priority: 'low',
        category: 'rules'
      })
    }

    // Meld strategy hints
    if (currentPlayer && currentPlayer.melds.length > 0) {
      hints.push({
        id: 'meld-strategy',
        title: 'Building Melds',
        description: `You have ${currentPlayer.melds.length} meld(s). You need 5 total melds plus 1 pair to win!`,
        icon: <Target className="w-4 h-4" />,
        priority: 'medium',
        category: 'strategy'
      })
    }

    // Win condition hints
    if (currentPlayer && isCloseToWinning(currentPlayer)) {
      hints.push({
        id: 'close-to-win',
        title: 'Close to Winning!',
        description: 'You\'re getting close to a winning hand. Look for opportunities to complete your melds or form Siete Pares.',
        icon: <Crown className="w-4 h-4" />,
        priority: 'high',
        category: 'strategy'
      })
    }

    // Game progress hints
    if (gameState.wall.length < 30) {
      hints.push({
        id: 'wall-running-low',
        title: 'Wall Running Low',
        description: `Only ${gameState.wall.length} tiles left in the wall. The game will end soon if no one wins!`,
        icon: <Zap className="w-4 h-4" />,
        priority: 'medium',
        category: 'gameplay'
      })
    }

    // Sort by priority
    return hints.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  const hints = generateHints()

  // Auto-advance hints
  useEffect(() => {
    if (hints.length > 1) {
      const timer = setInterval(() => {
        setCurrentHintIndex((prev) => (prev + 1) % hints.length)
      }, 8000) // Change hint every 8 seconds

      return () => clearInterval(timer)
    }
  }, [hints.length])

  // Mark as seen after first interaction
  useEffect(() => {
    if (!hasSeenHints) {
      const timer = setTimeout(() => {
        setHasSeenHints(true)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [hasSeenHints])

  if (!isVisible || hints.length === 0) return null

  const currentHint = hints[currentHintIndex]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      default: return 'text-muted-foreground bg-muted/10 border-border'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed bottom-4 left-4 z-20 max-w-sm"
    >
      <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={cn(
                'p-1 rounded-full border',
                getPriorityColor(currentHint.priority)
              )}>
                {currentHint.icon}
              </div>
              <div>
                <h4 className="font-semibold text-sm">{currentHint.title}</h4>
                <Badge variant="outline" className="text-xs mt-1">
                  {currentHint.category}
                </Badge>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            {currentHint.description}
          </p>

          {hints.length > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {hints.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      index === currentHintIndex ? 'bg-accent' : 'bg-muted'
                    )}
                  />
                ))}
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentHintIndex((prev) => 
                    prev === 0 ? hints.length - 1 : prev - 1
                  )}
                  className="h-6 w-6 p-0"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentHintIndex((prev) => 
                    (prev + 1) % hints.length
                  )}
                  className="h-6 w-6 p-0"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Helper functions
function checkForSequentialTiles(hand: any[]): boolean {
  const numberedTiles = hand.filter(t => ['circles', 'bamboos', 'characters'].includes(t.suit))
  
  for (const suit of ['circles', 'bamboos', 'characters']) {
    const suitTiles = numberedTiles
      .filter(t => t.suit === suit)
      .map(t => t.value)
      .sort((a, b) => a - b)
    
    // Check for consecutive numbers
    for (let i = 0; i < suitTiles.length - 1; i++) {
      if (suitTiles[i + 1] === suitTiles[i] + 1) {
        return true
      }
    }
  }
  
  return false
}

function isCloseToWinning(player: any): boolean {
  const totalMelds = player.melds.length
  const handSize = player.hand.length
  
  // If player has 4 melds and 5 tiles in hand, they're close
  if (totalMelds >= 4 && handSize <= 5) return true
  
  // If player has 3 melds and 8 tiles in hand, they're getting close
  if (totalMelds >= 3 && handSize <= 8) return true
  
  return false
}