import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { blink } from '@/blink/client'
import { 
  Trophy, 
  Star, 
  Crown,
  Edit,
  Save,
  X,
  TrendingUp,
  Calendar,
  Globe,
  Award,
  Target,
  Gamepad2
} from 'lucide-react'

interface UserProfile {
  id: string
  userId: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  country?: string
  rating: number
  gamesPlayed: number
  gamesWon: number
  winRate: number
  favoriteVariant: string
  isPremium: boolean
  achievements: string[]
  createdAt: string
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: string
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first game',
    icon: '🏆',
    rarity: 'common'
  },
  {
    id: 'win_streak_5',
    name: 'Hot Streak',
    description: 'Win 5 games in a row',
    icon: '🔥',
    rarity: 'rare'
  },
  {
    id: 'escalera_master',
    name: 'Escalera Master',
    description: 'Win with Escalera 10 times',
    icon: '🎯',
    rarity: 'epic'
  },
  {
    id: 'rating_2000',
    name: 'Elite Player',
    description: 'Reach 2000+ rating',
    icon: '⭐',
    rarity: 'legendary'
  },
  {
    id: 'tournament_winner',
    name: 'Champion',
    description: 'Win a tournament',
    icon: '👑',
    rarity: 'legendary'
  }
]

const COUNTRIES = [
  'Philippines', 'China', 'Japan', 'Korea', 'Singapore', 'Malaysia', 
  'Thailand', 'Vietnam', 'Indonesia', 'Taiwan', 'Hong Kong', 'United States',
  'Canada', 'Australia', 'United Kingdom', 'Other'
]

export function ProfilePage() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    country: '',
    favoriteVariant: 'Filipino Mahjong'
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    if (!user) return

    try {
      // Try to load existing profile
      const profiles = await blink.db.userProfiles.list({
        where: { userId: user.id },
        limit: 1
      })

      if (profiles.length > 0) {
        const profileData = profiles[0]
        const userProfile: UserProfile = {
          id: profileData.id,
          userId: profileData.userId,
          displayName: profileData.displayName,
          avatarUrl: profileData.avatarUrl,
          bio: profileData.bio,
          country: profileData.country,
          rating: profileData.rating || 1500,
          gamesPlayed: profileData.gamesPlayed || 0,
          gamesWon: profileData.gamesWon || 0,
          winRate: profileData.winRate || 0,
          favoriteVariant: profileData.favoriteVariant || 'Filipino Mahjong',
          isPremium: Number(profileData.isPremium) > 0,
          achievements: profileData.achievements ? JSON.parse(profileData.achievements) : [],
          createdAt: profileData.createdAt
        }
        setProfile(userProfile)
        setEditForm({
          displayName: userProfile.displayName || '',
          bio: userProfile.bio || '',
          country: userProfile.country || '',
          favoriteVariant: userProfile.favoriteVariant
        })
      } else {
        // Create new profile
        const newProfile: UserProfile = {
          id: `profile-${Date.now()}`,
          userId: user.id,
          displayName: user.displayName || user.email.split('@')[0],
          bio: '',
          country: '',
          rating: 1500,
          gamesPlayed: 0,
          gamesWon: 0,
          winRate: 0,
          favoriteVariant: 'Filipino Mahjong',
          isPremium: false,
          achievements: [],
          createdAt: new Date().toISOString()
        }

        await blink.db.userProfiles.create({
          id: newProfile.id,
          userId: newProfile.userId,
          displayName: newProfile.displayName,
          bio: newProfile.bio,
          country: newProfile.country,
          rating: newProfile.rating,
          gamesPlayed: newProfile.gamesPlayed,
          gamesWon: newProfile.gamesWon,
          winRate: newProfile.winRate,
          favoriteVariant: newProfile.favoriteVariant,
          isPremium: newProfile.isPremium,
          achievements: JSON.stringify(newProfile.achievements),
          createdAt: newProfile.createdAt
        })

        setProfile(newProfile)
        setEditForm({
          displayName: newProfile.displayName || '',
          bio: newProfile.bio || '',
          country: newProfile.country || '',
          favoriteVariant: newProfile.favoriteVariant
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      })
    }
  }

  const handleSave = async () => {
    if (!profile || !user) return

    setSaving(true)
    try {
      await blink.db.userProfiles.update(profile.id, {
        displayName: editForm.displayName,
        bio: editForm.bio,
        country: editForm.country,
        favoriteVariant: editForm.favoriteVariant,
        updatedAt: new Date().toISOString()
      })

      setProfile({
        ...profile,
        displayName: editForm.displayName,
        bio: editForm.bio,
        country: editForm.country,
        favoriteVariant: editForm.favoriteVariant
      })

      setEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully"
      })
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast({
        title: "Error",
        description: "Failed to save profile changes",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'rare': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'epic': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'legendary': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
            <div className="w-8 h-8 bg-primary-foreground rounded opacity-50" />
          </div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Unable to load profile data</p>
            <Button onClick={loadProfile} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const unlockedAchievements = ACHIEVEMENTS.filter(a => profile.achievements.includes(a.id))
  const lockedAchievements = ACHIEVEMENTS.filter(a => !profile.achievements.includes(a.id))

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-card/50 mb-8">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
                  <div className="relative">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={profile.avatarUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                        {(profile.displayName || user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {profile.isPremium && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                        <Crown className="w-5 h-5 text-accent-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    {editing ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            value={editForm.displayName}
                            onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                            placeholder="Enter your display name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Select value={editForm.country} onValueChange={(value) => setEditForm({ ...editForm, country: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {COUNTRIES.map(country => (
                                  <SelectItem key={country} value={country}>{country}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="variant">Favorite Variant</Label>
                            <Select value={editForm.favoriteVariant} onValueChange={(value) => setEditForm({ ...editForm, favoriteVariant: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Filipino Mahjong">Filipino Mahjong</SelectItem>
                                <SelectItem value="Chinese Classical">Chinese Classical</SelectItem>
                                <SelectItem value="Japanese Riichi">Japanese Riichi</SelectItem>
                                <SelectItem value="Hong Kong Mahjong">Hong Kong Mahjong</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleSave} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button variant="outline" onClick={() => setEditing(false)}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-4 mb-4">
                          <h1 className="text-3xl font-bold">{profile.displayName || 'Anonymous Player'}</h1>
                          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        </div>
                        
                        {profile.bio && (
                          <p className="text-muted-foreground mb-4">{profile.bio}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          {profile.country && (
                            <div className="flex items-center space-x-1">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              <span>{profile.country}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            <span>Prefers {profile.favoriteVariant}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="bg-card/50 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Trophy className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{profile.rating}</div>
                      <div className="text-sm text-muted-foreground">Rating</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Gamepad2 className="w-8 h-8 text-accent" />
                      </div>
                      <div className="text-2xl font-bold">{profile.gamesPlayed}</div>
                      <div className="text-sm text-muted-foreground">Games Played</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Star className="w-8 h-8 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold">{profile.gamesWon}</div>
                      <div className="text-sm text-muted-foreground">Games Won</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="w-8 h-8 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold">{profile.winRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Achievements</span>
                    <Badge variant="secondary">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {unlockedAchievements.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-green-400">Unlocked</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {unlockedAchievements.map(achievement => (
                            <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg border border-green-500/30">
                              <div className="text-2xl">{achievement.icon}</div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium">{achievement.name}</h5>
                                  <Badge variant="secondary" className={getRarityColor(achievement.rarity)}>
                                    {achievement.rarity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {lockedAchievements.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-muted-foreground">Locked</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {lockedAchievements.map(achievement => (
                            <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-background/30 rounded-lg border border-border/50 opacity-60">
                              <div className="text-2xl grayscale">{achievement.icon}</div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium">{achievement.name}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {achievement.rarity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
              {/* Premium Status */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="w-5 h-5" />
                    <span>Membership</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.isPremium ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-accent" />
                      </div>
                      <h3 className="font-semibold text-accent mb-2">Premium Member</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Enjoy video chat, exclusive tournaments, and premium features
                      </p>
                      <Button variant="outline" className="w-full">
                        Manage Subscription
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-muted/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">Free Member</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upgrade to premium for video chat and exclusive features
                      </p>
                      <Button className="w-full bg-accent hover:bg-accent/90">
                        Upgrade to Premium
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rank</span>
                    <span className="font-medium">#{Math.floor(Math.random() * 1000) + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best Streak</span>
                    <span className="font-medium">{Math.floor(Math.random() * 10) + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tournaments</span>
                    <span className="font-medium">{Math.floor(Math.random() * 5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. Game Time</span>
                    <span className="font-medium">{Math.floor(Math.random() * 20) + 15}m</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}