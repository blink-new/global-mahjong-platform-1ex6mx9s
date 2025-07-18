import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Users, 
  Trophy, 
  Video, 
  Globe, 
  Shield,
  Zap,
  Crown,
  Star,
  ArrowRight,
  Gamepad2
} from 'lucide-react'
import { blink } from '@/blink/client'

const features = [
  {
    icon: Users,
    title: 'Global Multiplayer',
    description: 'Play with players from around the world in real-time matches'
  },
  {
    icon: Video,
    title: 'Premium Video Chat',
    description: 'See your opponents with crystal-clear video streaming'
  },
  {
    icon: Trophy,
    title: 'Tournaments & Rankings',
    description: 'Compete in tournaments and climb the global leaderboards'
  },
  {
    icon: Globe,
    title: 'Multiple Variants',
    description: 'Chinese Classical, Japanese Riichi, and more game styles'
  },
  {
    icon: Shield,
    title: 'Anti-Cheat Security',
    description: 'Advanced security measures ensure fair play for everyone'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Ultra-low latency gameplay for seamless tile interactions'
  }
]

const testimonials = [
  {
    name: 'Chen Wei',
    location: 'Shanghai, China',
    rating: 2150,
    text: 'The most authentic online Mahjong experience. Video chat makes it feel like playing in person.',
    avatar: '👨‍💼'
  },
  {
    name: 'Yuki Tanaka',
    location: 'Tokyo, Japan',
    rating: 1980,
    text: 'Perfect Riichi implementation. The tournament system is incredibly well designed.',
    avatar: '👩‍💻'
  },
  {
    name: 'Sarah Kim',
    location: 'Seoul, Korea',
    rating: 2050,
    text: 'Finally, a platform that brings together players from all over Asia. Love the community!',
    avatar: '👩‍🎨'
  }
]

export function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = async () => {
    setIsLoading(true)
    try {
      blink.auth.login()
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 mahjong-gradient" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-accent/5" />
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <Badge variant="secondary" className="mb-4 bg-accent/20 text-accent border-accent/30">
                <Crown className="w-3 h-3 mr-1" />
                Premium Mahjong Experience
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-accent to-primary bg-clip-text text-transparent leading-tight">
                Global Mahjong
                <br />
                <span className="text-4xl md:text-6xl">Platform</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                Experience the authentic art of Mahjong with players worldwide. 
                Premium video chat, real-time gameplay, and tournament competition.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold mahjong-glow"
                onClick={handleGetStarted}
                disabled={isLoading}
              >
                <Play className="w-5 h-5 mr-2" />
                {isLoading ? 'Starting...' : 'Start Playing'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-accent/30 text-accent hover:bg-accent/10 px-8 py-6 text-lg"
              >
                <Video className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center justify-center space-x-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>12,847 players online</span>
              </div>
              <div className="flex items-center space-x-2">
                <Gamepad2 className="w-4 h-4" />
                <span>2,156 active games</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for serious players who demand the best Mahjong experience online
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-card/50 border-border/50 hover:bg-card/80 transition-all duration-300 hover:mahjong-glow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Players Worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of satisfied players from across the globe
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-3xl">{testimonial.avatar}</div>
                      <div>
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Trophy className="w-3 h-3 text-accent" />
                          <span className="text-sm text-accent">{testimonial.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">
                      &quot;{testimonial.text}&quot;
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Master Mahjong?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the global community of Mahjong enthusiasts. 
              Start with free games or upgrade to premium for the full experience.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold mahjong-glow"
                onClick={handleGetStarted}
                disabled={isLoading}
              >
                <Play className="w-5 h-5 mr-2" />
                {isLoading ? 'Starting...' : 'Play Now - Free'}
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-accent/30 text-accent hover:bg-accent/10 px-8 py-6 text-lg"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}