import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { 
  Users, 
  Trophy, 
  Clock, 
  Play,
  Crown,
  Gamepad2,
  TrendingUp,
  Calendar,
  Globe,
  Video,
  Settings
} from 'lucide-react'
import { blink } from '@/blink/client'

interface GameRoom {
  id: string
  name: string
  variant: string
  players: number
  maxPlayers: number
  isPrivate: boolean
  hasVideo: boolean
  createdAt: string
  host: {
    name: string
    avatar?: string
    rating: number
  }
}

interface RecentGame {
  id: string
  variant: string
  result: 'win' | 'loss' | 'draw'
  score: number
  duration: string
  playedAt: string
  opponents: string[]
}

interface User {
  id: string
  email: string
  displayName?: string
  avatar?: string
  isPremium?: boolean
  rating?: number
  gamesPlayed?: number
  winRate?: number
}

export function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([])
  const [recentGames, setRecentGames] = useState<RecentGame[]>([])


  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) return

    // Load active rooms - simplified to just show practice room
    const loadActiveRooms = async () => {
      setActiveRooms([
        {
          id: 'practice',
          name: 'Practice Room',
          variant: 'Filipino Mahjong',
          players: 1,
          maxPlayers: 4,
          isPrivate: false,
          hasVideo: false,
          createdAt: 'Now',
          host: {
            name: 'AI Practice',
            rating: 1500
          }
        }
      ])
    }

    // Load recent games - simplified to empty for now
    const loadRecentGames = async () => {
      setRecentGames([])
    }

    loadActiveRooms()
    loadRecentGames()
  }, [user])



  const handleJoinRoom = async (roomId: string) => {
    if (!user) return
    // Simply navigate to the game page
    navigate(`/game/${roomId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-4" />
                  <div className="h-8 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.displayName || 'Player'}!
              </h1>
              <p className="text-muted-foreground">
                Ready for your next Mahjong challenge?
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              {user?.isPremium && (
                <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              <Button 
                onClick={() => navigate('/game/quick-match')}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Play className="w-4 h-4 mr-2" />
                Quick Match
              </Button>

            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="text-2xl font-bold">{user?.rating || 1500}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Games Played</p>
                    <p className="text-2xl font-bold">{user?.gamesPlayed || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold">{user?.winRate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Rooms */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Active Rooms</span>
                  <Badge variant="secondary" className="ml-auto">
                    {activeRooms.length} available
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={room.host.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {room.host.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{room.name}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{room.variant}</span>
                            <span>•</span>
                            <span>Host: {room.host.name} ({room.host.rating})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm">
                        {room.hasVideo && (
                          <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
                            <Video className="w-3 h-3 mr-1" />
                            Video
                          </Badge>
                        )}
                        {room.isPrivate && (
                          <Badge variant="outline">Private</Badge>
                        )}
                        <span className="text-muted-foreground">
                          {room.players}/{room.maxPlayers}
                        </span>
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={room.players >= room.maxPlayers}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Join
                      </Button>
                    </div>
                  </div>
                ))}

                {activeRooms.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active rooms available</p>
                    <p className="text-sm">Create a new room to start playing!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">

                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-accent/10 hover:bg-accent/20 border-accent/30 text-accent hover:text-accent"
                  onClick={() => navigate('/game/quick-match')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Quick Match
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Trophy className="w-4 h-4 mr-2" />
                  Join Tournament
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/game/practice')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Practice Filipino Mahjong
                </Button>
              </CardContent>
            </Card>

            {/* Recent Games */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Games</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentGames.map((game) => (
                  <div
                    key={game.id}
                    className="p-3 bg-background/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{game.variant}</span>
                      <Badge
                        variant={game.result === 'win' ? 'default' : 'secondary'}
                        className={
                          game.result === 'win'
                            ? 'bg-green-500/20 text-green-500 border-green-500/30'
                            : game.result === 'loss'
                            ? 'bg-red-500/20 text-red-500 border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                        }
                      >
                        {game.result.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Score: {game.score.toLocaleString()}</div>
                      <div>Duration: {game.duration}</div>
                      <div>{game.playedAt}</div>
                    </div>
                  </div>
                ))}

                {recentGames.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent games</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>


    </div>
  )
}