import React, { useEffect, useState } from 'react'

/**
 * Test component to isolate wallet adapter initialization issues
 */
export const WalletTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const addResult = (result: string) => {
    console.log('🧪 Wallet Test:', result)
    setTestResults(prev => [...prev, result])
  }

  useEffect(() => {
    const runTests = async () => {
      try {
        addResult('Starting wallet adapter tests...')
        
        // Test 1: Check if window object exists
        addResult(`Window object exists: ${typeof window !== 'undefined'}`)
        
        // Test 2: Check if crypto is available
        addResult(`Crypto available: ${typeof crypto !== 'undefined'}`)
        
        // Test 3: Check if Buffer is available
        addResult(`Buffer available: ${typeof Buffer !== 'undefined'}`)
        
        // Test 4: Try to import Solana web3.js
        try {
          const { Connection } = await import('@solana/web3.js')
          addResult('✅ Solana web3.js imported successfully')
          
          // Test 5: Try to create a connection
          try {
            const conn = new Connection('https://api.devnet.solana.com', 'confirmed')
            addResult('✅ Solana connection created successfully')
            
            // Test 6: Try to get version
            try {
              const version = await conn.getVersion()
              addResult(`✅ Solana RPC working: ${JSON.stringify(version)}`)
            } catch (error) {
              addResult(`❌ Solana RPC failed: ${error}`)
            }
          } catch (error) {
            addResult(`❌ Connection creation failed: ${error}`)
          }
        } catch (error) {
          addResult(`❌ Solana web3.js import failed: ${error}`)
        }
        
        // Test 7: Try to import wallet adapters
        try {
          const { SolflareWalletAdapter } = await import('@solana/wallet-adapter-solflare')
          addResult('✅ SolflareWalletAdapter imported successfully')
          
          // Test 8: Try to create wallet adapter
          try {
            const adapter = new SolflareWalletAdapter()
            addResult('✅ SolflareWalletAdapter created successfully')
          } catch (error) {
            addResult(`❌ SolflareWalletAdapter creation failed: ${error}`)
          }
        } catch (error) {
          addResult(`❌ SolflareWalletAdapter import failed: ${error}`)
        }
        
        addResult('Wallet adapter tests completed!')
        
      } catch (error) {
        addResult(`❌ Test suite failed: ${error}`)
        console.error('Wallet test error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    runTests()
  }, [])

  if (isLoading) {
    return (
      <div style={{ padding: '20px', background: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
        <h2>🧪 Wallet Adapter Test</h2>
        <div>Running tests...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', background: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h2>🧪 Wallet Adapter Test Results</h2>
      <div style={{ marginTop: '20px' }}>
        {testResults.map((result, index) => (
          <div key={index} style={{ marginBottom: '10px', fontFamily: 'monospace' }}>
            {result}
          </div>
        ))}
      </div>
      <button 
        onClick={() => window.location.reload()} 
        style={{ 
          padding: '10px 20px', 
          marginTop: '20px',
          background: '#FFD700',
          color: 'black',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Reload Page
      </button>
    </div>
  )
}
