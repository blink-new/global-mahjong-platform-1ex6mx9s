import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { GameState } from '@/types/mahjong'
import { 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  Users, 
  Zap,
  Eye,
  EyeOff,
  Crown,
  Flower
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GameStatsProps {
  gameState: GameState
  currentUserId: string
}

export function GameStats({ gameState, currentUserId }: GameStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const currentPlayer = gameState.players.find(p => p.id === currentUserId)
  const currentPlayerIndex = gameState.players.findIndex(p => p.id === currentUserId)
  
  // Calculate game progress
  const totalTiles = 144
  const remainingTiles = gameState.wall.length
  const gameProgress = ((totalTiles - remainingTiles) / totalTiles) * 100
  
  // Calculate player statistics
  const getPlayerStats = (playerIndex: number) => {
    const player = gameState.players[playerIndex]
    const handSize = player.hand.length
    const meldCount = player.melds.length
    const flowerCount = player.flowers.length
    const discardCount = player.discards.length
    
    // Calculate hand efficiency (how close to winning)
    const totalSets = meldCount + Math.floor((handSize - 2) / 3) // Rough estimate
    const efficiency = Math.min(100, (totalSets / 5) * 100)
    
    return {
      handSize,
      meldCount,
      flowerCount,
      discardCount,
      efficiency
    }
  }
  
  // Get turn statistics
  const getTurnStats = () => {
    const totalTurns = gameState.players.reduce((sum, p) => sum + p.discards.length, 0)
    const averageTurnTime = 25 // Simulated average
    const currentTurnNumber = totalTurns + 1
    
    return {
      totalTurns,
      averageTurnTime,
      currentTurnNumber
    }
  }
  
  const playerStats = currentPlayer ? getPlayerStats(currentPlayerIndex) : null
  const turnStats = getTurnStats()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 right-4 z-20"
    >
      <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              <span>Game Stats</span>
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {/* Always visible: Game progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Game Progress</span>
              <span className="font-medium">{Math.round(gameProgress)}%</span>
            </div>
            <Progress value={gameProgress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tiles left: {remainingTiles}</span>
              <span>Turn #{turnStats.currentTurnNumber}</span>
            </div>
          </div>
          
          {/* Current player quick stats */}
          {playerStats && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3 text-blue-400" />
                  <span>{playerStats.handSize}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span>{playerStats.meldCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Flower className="w-3 h-3 text-pink-400" />
                  <span>{playerStats.flowerCount}</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {Math.round(playerStats.efficiency)}% ready
              </Badge>
            </div>
          )}
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 border-t border-border/30 pt-3"
              >
                {/* Detailed player stats */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">All Players</h4>
                  {gameState.players.map((player, index) => {
                    const stats = getPlayerStats(index)
                    const isCurrentTurn = gameState.currentPlayer === index
                    const isCurrentUser = player.id === currentUserId
                    
                    return (
                      <div
                        key={player.id}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-lg text-xs',
                          isCurrentTurn && 'bg-accent/10 border border-accent/20',
                          isCurrentUser && 'bg-primary/5'
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {player.isDealer && <Crown className="w-3 h-3 text-accent" />}
                            <span className={cn(
                              'font-medium truncate max-w-16',
                              isCurrentUser && 'text-primary'
                            )}>
                              {player.name}
                            </span>
                            {isCurrentTurn && (
                              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <span title="Hand size">{stats.handSize}H</span>
                          <span title="Melds">{stats.meldCount}M</span>
                          <span title="Flowers">{stats.flowerCount}F</span>
                          <Badge 
                            variant="outline" 
                            className="text-xs px-1 py-0"
                            title="Win readiness"
                          >
                            {Math.round(stats.efficiency)}%
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Game timing stats */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">Timing</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>Avg: {turnStats.averageTurnTime}s</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-muted-foreground" />
                      <span>Phase: {gameState.phase}</span>
                    </div>
                  </div>
                </div>
                
                {/* Wind and round info */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">Game Info</h4>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {gameState.wind.charAt(0).toUpperCase() + gameState.wind.slice(1)} Wind
                      </Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Round {gameState.round}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      {gameState.discardPile.length} discards
                    </div>
                  </div>
                </div>
                
                {/* Ambitions/achievements */}
                {gameState.ambitions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">Ambitions</h4>
                    <div className="space-y-1">
                      {gameState.ambitions.slice(-3).map((ambition) => {
                        const player = gameState.players.find(p => p.id === ambition.playerId)
                        return (
                          <div key={ambition.id} className="flex items-center justify-between text-xs">
                            <span className="truncate">{player?.name}</span>
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              {ambition.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}