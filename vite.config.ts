import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  assetsInclude: ['**/*.wasm', '**/*.wasm.gz'],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  esbuild: {
    target: 'es2022',
    supported: {
      'bigint': true
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'BigInt': 'BigInt',
  },
  optimizeDeps: {
    include: [
      'buffer',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-phantom',
      '@solana/wallet-adapter-solflare',
      '@solana/web3.js',
      'framer-motion',
      'lucide-react',
      'react',
      'react-dom',
      'react-router-dom'
    ],
    exclude: ['@solana/wallet-adapter-wallets']
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0', // Bind to all interfaces (IPv4 and IPv6)
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Suppress large chunk warnings for wallet bundles
    chunkSizeWarningLimit: 3000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
        // pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true,
        unsafe_regexp: true
      },
      mangle: {
        safari10: true
      }
    },
    cssCodeSplit: true,
    reportCompressedSize: false,
    target: 'es2022',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'solana-wallet': [
            '@solana/wallet-adapter-base',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/wallet-adapter-phantom',
            '@solana/wallet-adapter-solflare',
            '@solana/web3.js'
          ],
          'ui-components': [
            'framer-motion',
            'lucide-react'
          ],
          'react-vendor': [
            'react',
            'react-dom',
            'react-router-dom'
          ]
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            if (facadeModuleId.includes('node_modules')) {
              return 'assets/vendor-[hash].js'
            }
          }
          return 'assets/[name]-[hash].js'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash].css'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
  },
})
