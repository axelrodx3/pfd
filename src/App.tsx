import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import { LiveFeed } from './components/LiveFeed'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import { EnhancedGamePage } from './pages/EnhancedGamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProvablyFairPage from './pages/ProvablyFairPage'
import { EnhancedProvablyFairPage } from './pages/EnhancedProvablyFairPage'
import AboutPage from './pages/AboutPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastContainer, useToast } from './components/Toast'

/**
 * Main App Component
 * Sets up routing and global layout with error boundaries and theme support
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

function AppContent() {
  const { toasts, removeToast } = useToast()

  return (
    <Router>
      <div className="min-h-screen bg-hilo-black text-white">
        {/* Navigation */}
        <Navigation />
        
        {/* Main Content */}
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<EnhancedGamePage />} />
            <Route path="/classic" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/provably-fair" element={<EnhancedProvablyFairPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <Footer />
        
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </Router>
  )
}

export default App
