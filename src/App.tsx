import * as React from 'react'
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

// Lazy-load heavy Territory Wars pages to reduce initial bundle
const TerritoryWarsPage = React.lazy(() => import('./pages/TerritoryWarsPage'))
const ModernTerritoryWarsPage = React.lazy(() => import('./pages/ModernTerritoryWarsPage'))
import { ErrorBoundary } from './components/ErrorBoundary'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'
import { SolanaWalletDetector } from './components/SolanaWalletDetector'
import { ThemeProvider } from './contexts/ThemeContext'
import { WalletContextWrapper } from './contexts/WalletContextWrapper'
import { ToastContainer, useToast, ToastProvider } from './components/Toast'
import { WalletTest } from './components/WalletTest'
import { debug } from './lib/debug'

/**
 * Main App Component
 * Sets up routing and global layout with error boundaries and theme support
 */
function App() {
  console.log('🎨 App component rendering...')
  console.log('🎨 App - React version:', React.version)
  console.log('🎨 App - Environment check:', {
    isProduction: (import.meta as any).env?.PROD || false,
    isDevelopment: (import.meta as any).env?.DEV || false,
    mode: (import.meta as any).env?.MODE || 'unknown'
  })
  debug.info('🎨 App component rendering...')

  try {
    console.log('🎨 App - Creating component tree...')
    
    // TEMPORARY: Use wallet test for debugging (add ?test=wallet to URL)
    const useWalletTest = typeof window !== 'undefined' && window.location.search.includes('test=wallet')
    
    if (useWalletTest) {
      console.log('🎨 App - Using wallet test component')
      return <WalletTest />
    }
    
    const appContent = (
      <GlobalErrorBoundary>
        <ErrorBoundary>
          <SolanaWalletDetector>
            <ThemeProvider>
              <ToastProvider>
                <WalletContextWrapper>
                  <AppContent />
                </WalletContextWrapper>
              </ToastProvider>
            </ThemeProvider>
          </SolanaWalletDetector>
        </ErrorBoundary>
      </GlobalErrorBoundary>
    )
    console.log('🎨 App - Component tree created successfully')
    return appContent
  } catch (error) {
    console.error('❌ Error in App component', error)
    console.error('❌ App Error Stack:', error instanceof Error ? error.stack : 'No stack trace')
    debug.error('❌ Error in App component', error)
    return (
      <div style={{ padding: '20px', color: 'red', backgroundColor: 'white', minHeight: '100vh' }}>
        <h1>App Component Error</h1>
        <p><strong>Error:</strong> {String(error)}</p>
        <p><strong>Stack:</strong></p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {error instanceof Error ? error.stack : 'No stack trace available'}
        </pre>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '20px' }}>
          Reload Page
        </button>
      </div>
    )
  }
}

function AppContent() {
  console.log('🎨 AppContent component rendering...')
  debug.info('🎨 AppContent component rendering...')
  
  try {
    console.log('🎨 AppContent - getting toast hook...')
    const toastContext = useToast()
    console.log('🎨 AppContent - toast hook obtained, creating router...')

    return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-hilo-black text-white">
          {/* Navigation */}
          <Navigation />

          {/* Main Content */}
          <main className="pt-16">
            <React.Suspense fallback={<div style={{ padding: 20 }}>Loading…</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/game" element={<EnhancedGamePage />} />
              <Route path="/territory-wars" element={<TerritoryWarsPage />} />
              <Route path="/modern-territory-wars" element={<ModernTerritoryWarsPage />} />
              <Route path="/classic" element={<GamePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route
                path="/provably-fair"
                element={<EnhancedProvablyFairPage />}
              />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
            </React.Suspense>
          </main>

          {/* Footer */}
          <Footer />

          {/* Toast Notifications */}
          <ToastContainer toasts={toastContext.toasts} onClose={toastContext.removeToast} />
        </div>
      </Router>
    )
  } catch (error) {
    console.error('❌ Error in AppContent component', error)
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
