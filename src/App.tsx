import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { LandingPage } from '@/pages/LandingPage'
import { Dashboard } from '@/pages/Dashboard'
import { GamePage } from '@/pages/GamePage'
import { ProfilePage } from '@/pages/ProfilePage'
import { LeaderboardsPage } from '@/pages/LeaderboardsPage'
import { Toaster } from '@/components/ui/toaster'
import { blink } from '@/blink/client'
import './App.css'

interface User {
  id: string
  email: string
  displayName?: string
  avatar?: string
  isPremium?: boolean
  rating?: number
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
            <div className="w-8 h-8 bg-primary-foreground rounded opacity-50" />
          </div>
          <p className="text-muted-foreground">Loading Mahjong Global...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route 
            path="/" 
            element={
              user ? (
                <>
                  <Header />
                  <Dashboard />
                </>
              ) : (
                <LandingPage />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              user ? (
                <>
                  <Header />
                  <Dashboard />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/game/quick-match" 
            element={
              user ? (
                <GamePage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/game/:gameId" 
            element={
              user ? (
                <GamePage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/profile" 
            element={
              user ? (
                <>
                  <Header />
                  <ProfilePage />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/leaderboards" 
            element={
              user ? (
                <>
                  <Header />
                  <LeaderboardsPage />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App