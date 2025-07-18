import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { blink } from '@/blink/client'
import { 
  Trophy, 
  Crown,
  Medal,
  TrendingUp,
  Calendar,
  Globe,
  Star,
  Target,
  Users,
  Gamepad2
} from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  avatarUrl?: string
  country?: string
  rating: number
  gamesPlayed: number
  gamesWon: number
  winRate: number
  isPremium: boolean
  favoriteVariant: string
}

interface TournamentWinner {
  id: string
  tournamentName: string
  winnerName: string
  winnerAvatar?: string
  winnerCountry?: string
  prize: number
  date: string
  participants: number
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'user1',
    displayName: 'Chen Wei',
    country: 'China',
    rating: 2380,
    gamesPlayed: 156,
    gamesWon: 98,
    winRate: 62.8,
    isPremium: true,
    favoriteVariant: 'Chinese Classical'
  },
  {
    rank: 2,
    userId: 'user2',
    displayName: 'Yuki Tanaka',
    country: 'Japan',
    rating: 2350,
    gamesPlayed: 203,
    gamesWon: 121,
    winRate: 59.6,
    isPremium: true,
    favoriteVariant: 'Japanese Riichi'
  },
  {
    rank: 3,
    userId: 'user3',
    displayName: 'Sarah Kim',
    country: 'Korea',
    rating: 2290,
    gamesPlayed: 134,
    gamesWon: 79,
    winRate: 59.0,
    isPremium: false,
    favoriteVariant: 'Filipino Mahjong'
  },
  {
    rank: 4,
    userId: 'user4',
    displayName: 'Li Ming',
    country: 'Singapore',
    rating: 2250,
    gamesPlayed: 189,
    gamesWon: 108,
    winRate: 57.1,
    isPremium: true,
    favoriteVariant: 'Hong Kong Mahjong'
  },
  {
    rank: 5,
    userId: 'user5',
    displayName: 'Maria Santos',
    country: 'Philippines',
    rating: 2180,
    gamesPlayed: 167,
    gamesWon: 92,
    winRate: 55.1,
    isPremium: false,
    favoriteVariant: 'Filipino Mahjong'
  }
]

const MOCK_TOURNAMENT_WINNERS: TournamentWinner[] = [
  {
    id: 'tournament1',
    tournamentName: 'Global Championship 2024',
    winnerName: 'Chen Wei',
    winnerCountry: 'China',
    prize: 1000,
    date: '2024-01-15',
    participants: 64
  },
  {
    id: 'tournament2',
    tournamentName: 'Asian Masters Cup',
    winnerName: 'Yuki Tanaka',
    winnerCountry: 'Japan',
    prize: 500,
    date: '2024-01-10',
    participants: 32
  },
  {
    id: 'tournament3',
    tournamentName: 'Filipino Mahjong Open',
    winnerName: 'Maria Santos',
    winnerCountry: 'Philippines',
    prize: 250,
    date: '2024-01-05',
    participants: 16
  }
]

export function LeaderboardsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [tournamentWinners, setTournamentWinners] = useState<TournamentWinner[]>([])
  const [selectedVariant, setSelectedVariant] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [timeframe, setTimeframe] = useState('all-time')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      loadLeaderboards()
    }
  }, [user, selectedVariant, selectedRegion, timeframe])

  const loadLeaderboards = async () => {
    try {
      // Try to load real data from database
      const profiles = await blink.db.userProfiles.list({
        orderBy: { rating: 'desc' },
        limit: 50
      })

      if (profiles.length > 0) {
        const leaderboardData = profiles.map((profile, index) => ({
          rank: index + 1,
          userId: profile.userId,
          displayName: profile.displayName || 'Anonymous',
          avatarUrl: profile.avatarUrl,
          country: profile.country,
          rating: profile.rating || 1500,
          gamesPlayed: profile.gamesPlayed || 0,
          gamesWon: profile.gamesWon || 0,
          winRate: profile.winRate || 0,
          isPremium: Number(profile.isPremium) > 0,
          favoriteVariant: profile.favoriteVariant || 'Filipino Mahjong'
        }))
        setLeaderboard(leaderboardData)
      } else {
        // Fallback to mock data
        setLeaderboard(MOCK_LEADERBOARD)
      }

      // Load tournament winners (using mock data for now)
      setTournamentWinners(MOCK_TOURNAMENT_WINNERS)
    } catch (error) {
      console.error('Failed to load leaderboards:', error)
      // Fallback to mock data
      setLeaderboard(MOCK_LEADERBOARD)
      setTournamentWinners(MOCK_TOURNAMENT_WINNERS)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2: return <Medal className="w-6 h-6 text-gray-400" />
      case 3: return <Medal className="w-6 h-6 text-amber-600" />
      default: return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
        2: 'bg-gray-400/20 text-gray-400 border-gray-400/30',
        3: 'bg-amber-600/20 text-amber-600 border-amber-600/30'
      }
      return colors[rank as keyof typeof colors]
    }
    return 'bg-muted/20 text-muted-foreground border-muted/30'
  }

  const filteredLeaderboard = leaderboard.filter(entry => {
    if (selectedVariant !== 'all' && entry.favoriteVariant !== selectedVariant) return false
    if (selectedRegion !== 'all' && entry.country !== selectedRegion) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
            <div className="w-8 h-8 bg-primary-foreground rounded opacity-50" />
          </div>
          <p className="text-muted-foreground">Loading leaderboards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold mb-4">Global Leaderboards</h1>
            <p className="text-xl text-muted-foreground">
              Compete with the best Mahjong players worldwide
            </p>
          </motion.div>

          <Tabs defaultValue="ratings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ratings" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Top Ratings</span>
              </TabsTrigger>
              <TabsTrigger value="tournaments" className="flex items-center space-x-2">
                <Crown className="w-4 h-4" />
                <span>Tournament Winners</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Statistics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ratings" className="space-y-6">
              {/* Filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Variant:</label>
                        <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Variants</SelectItem>
                            <SelectItem value="Filipino Mahjong">Filipino Mahjong</SelectItem>
                            <SelectItem value="Chinese Classical">Chinese Classical</SelectItem>
                            <SelectItem value="Japanese Riichi">Japanese Riichi</SelectItem>
                            <SelectItem value="Hong Kong Mahjong">Hong Kong Mahjong</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Region:</label>
                        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            <SelectItem value="Philippines">Philippines</SelectItem>
                            <SelectItem value="China">China</SelectItem>
                            <SelectItem value="Japan">Japan</SelectItem>
                            <SelectItem value="Korea">Korea</SelectItem>
                            <SelectItem value="Singapore">Singapore</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Timeframe:</label>
                        <Select value={timeframe} onValueChange={setTimeframe}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-time">All Time</SelectItem>
                            <SelectItem value="monthly">This Month</SelectItem>
                            <SelectItem value="weekly">This Week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Top 3 Podium */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {filteredLeaderboard.slice(0, 3).map((entry, index) => (
                    <Card key={entry.userId} className={`bg-card/50 ${index === 0 ? 'md:order-2 ring-2 ring-yellow-500/50' : index === 1 ? 'md:order-1' : 'md:order-3'}`}>
                      <CardContent className="p-6 text-center">
                        <div className="relative mb-4">
                          <Avatar className="w-20 h-20 mx-auto">
                            <AvatarImage src={entry.avatarUrl} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                              {entry.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {entry.isPremium && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                              <Crown className="w-4 h-4 text-accent-foreground" />
                            </div>
                          )}
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                            <Badge variant="secondary" className={getRankBadge(entry.rank)}>
                              #{entry.rank}
                            </Badge>
                          </div>
                        </div>
                        
                        <h3 className="font-bold text-lg mb-1">{entry.displayName}</h3>
                        {entry.country && (
                          <p className="text-sm text-muted-foreground mb-3">{entry.country}</p>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-center space-x-1">
                            <Trophy className="w-4 h-4 text-accent" />
                            <span className="text-2xl font-bold text-accent">{entry.rating}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {entry.gamesWon}/{entry.gamesPlayed} wins ({entry.winRate.toFixed(1)}%)
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* Full Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Full Rankings</span>
                      <Badge variant="secondary">{filteredLeaderboard.length} players</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredLeaderboard.slice(3).map((entry) => (
                        <div key={entry.userId} className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border border-border/50 hover:bg-background/80 transition-colors">
                          <div className="flex items-center justify-center w-12">
                            {getRankIcon(entry.rank)}
                          </div>
                          
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={entry.avatarUrl} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {entry.displayName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {entry.isPremium && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                                <Crown className="w-3 h-3 text-accent-foreground" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{entry.displayName}</h4>
                              {entry.country && (
                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                  <Globe className="w-3 h-3" />
                                  <span>{entry.country}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.favoriteVariant} • {entry.gamesPlayed} games
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xl font-bold text-accent">{entry.rating}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.winRate.toFixed(1)}% win rate
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="tournaments" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Crown className="w-5 h-5" />
                      <span>Recent Tournament Winners</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tournamentWinners.map((winner, index) => (
                        <div key={winner.id} className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border border-border/50">
                          <div className="flex items-center justify-center w-12">
                            {index === 0 ? (
                              <Trophy className="w-8 h-8 text-yellow-500" />
                            ) : (
                              <Crown className="w-8 h-8 text-accent" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{winner.tournamentName}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>Winner: {winner.winnerName}</span>
                              {winner.winnerCountry && (
                                <div className="flex items-center space-x-1">
                                  <Globe className="w-3 h-3" />
                                  <span>{winner.winnerCountry}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{winner.participants} players</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(winner.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-500">${winner.prize}</div>
                            <div className="text-sm text-muted-foreground">Prize</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <Card className="bg-card/50">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-3xl font-bold mb-2">{leaderboard.length.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Players</div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Gamepad2 className="w-8 h-8 text-accent" />
                    </div>
                    <div className="text-3xl font-bold mb-2">
                      {leaderboard.reduce((sum, p) => sum + p.gamesPlayed, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Games Played</div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold mb-2">
                      {Math.max(...leaderboard.map(p => p.rating))}
                    </div>
                    <div className="text-sm text-muted-foreground">Highest Rating</div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold mb-2">
                      {(leaderboard.reduce((sum, p) => sum + p.winRate, 0) / leaderboard.length).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Win Rate</div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}