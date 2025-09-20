import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import { EnhancedGamePage } from './pages/EnhancedGamePage'
import GamesPage from './pages/GamesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import { EnhancedProvablyFairPage } from './pages/EnhancedProvablyFairPage'
import AboutPage from './pages/AboutPage'
import WalletPage from './pages/WalletPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import WalletContextProvider from './contexts/WalletContext'
import { ToastContainer, useToast } from './components/Toast'
import { debug } from './lib/debug'

/**
 * Main App Component
 * Sets up routing and global layout with error boundaries and theme support
 */
function App() {
  debug.info('🎨 App component rendering...')

  try {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <WalletContextProvider>
            <AppContent />
          </WalletContextProvider>
        </ThemeProvider>
      </ErrorBoundary>
    )
  } catch (error) {
    debug.error('❌ Error in App component', error)
    return (
      <div style={{ padding: '20px', color: 'red', backgroundColor: 'white' }}>
        <h1>App Component Error</h1>
        <pre>{String(error)}</pre>
      </div>
    )
  }
}

function AppContent() {
  debug.info('🎨 AppContent component rendering...')
  const { toasts, removeToast } = useToast()

  try {

    return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-hilo-black text-white">
          {/* Navigation */}
          <Navigation />

          {/* Main Content */}
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/game" element={<EnhancedGamePage />} />
              <Route path="/classic" element={<GamePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route
                path="/provably-fair"
                element={<EnhancedProvablyFairPage />}
              />
              <Route path="/wallet" element={<WalletPage />} />
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
  } catch (error) {
    debug.error('❌ Error in AppContent component', error)
    return (
      <div style={{ padding: '20px', color: 'red', backgroundColor: 'white' }}>
        <h1>AppContent Error</h1>
        <pre>{String(error)}</pre>
      </div>
    )
  }
}

export default App
