import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProvablyFairPage from './pages/ProvablyFairPage'
import AboutPage from './pages/AboutPage'

/**
 * Main App Component
 * Sets up routing and global layout
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-hilo-black text-white">
        {/* Navigation */}
        <Navigation />
        
        {/* Main Content */}
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/provably-fair" element={<ProvablyFairPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </Router>
  )
}

export default App
