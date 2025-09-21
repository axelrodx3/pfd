#!/usr/bin/env node

/**
 * Deployment Optimization Script
 * Validates build output and optimizes for production deployment
 */

import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'

const DIST_DIR = 'dist'

console.log('🚀 Starting deployment optimization...')

// Check if dist directory exists
if (!existsSync(DIST_DIR)) {
  console.error('❌ Dist directory not found. Run "npm run build" first.')
  process.exit(1)
}

// Validate critical files
const criticalFiles = [
  'index.html',
  'manifest.json',
  'sw.js',
  'icon-192.svg'
]

console.log('📋 Validating critical files...')
for (const file of criticalFiles) {
  const filePath = join(DIST_DIR, file)
  if (!existsSync(filePath)) {
    console.error(`❌ Missing critical file: ${file}`)
    process.exit(1)
  }
  console.log(`✅ ${file}`)
}

// Check assets directory
const assetsDir = join(DIST_DIR, 'assets')
if (!existsSync(assetsDir)) {
  console.error('❌ Assets directory not found')
  process.exit(1)
}

// Get asset files
const assetFiles = readFileSync(assetsDir, { encoding: 'utf8' })
  .split('\n')
  .filter(file => file.trim())
  .map(file => join(assetsDir, file.trim()))

console.log(`📦 Found ${assetFiles.length} asset files`)

// Validate HTML file
console.log('🔍 Validating HTML file...')
const htmlPath = join(DIST_DIR, 'index.html')
const htmlContent = readFileSync(htmlPath, 'utf8')

// Check for essential meta tags
const requiredMetaTags = [
  'viewport',
  'description',
  'theme-color'
]

for (const tag of requiredMetaTags) {
  if (!htmlContent.includes(tag)) {
    console.warn(`⚠️  Missing meta tag: ${tag}`)
  } else {
    console.log(`✅ Meta tag: ${tag}`)
  }
}

// Check for PWA manifest link
if (htmlContent.includes('manifest.json')) {
  console.log('✅ PWA manifest linked')
} else {
  console.warn('⚠️  PWA manifest not linked')
}

// Validate manifest.json
console.log('📱 Validating PWA manifest...')
const manifestPath = join(DIST_DIR, 'manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

const requiredManifestFields = ['name', 'short_name', 'start_url', 'display']
for (const field of requiredManifestFields) {
  if (!manifest[field]) {
    console.warn(`⚠️  Missing manifest field: ${field}`)
  } else {
    console.log(`✅ Manifest field: ${field}`)
  }
}

// Check file sizes
console.log('📊 Analyzing file sizes...')
const fileStats = []
const totalSize = 0

function analyzeFile(filePath, relativePath) {
  if (existsSync(filePath)) {
    const stats = statSync(filePath)
    const sizeKB = Math.round(stats.size / 1024)
    fileStats.push({ file: relativePath, size: sizeKB })
    return stats.size
  }
  return 0
}

// Analyze main files
analyzeFile(htmlPath, 'index.html')
analyzeFile(manifestPath, 'manifest.json')
analyzeFile(join(DIST_DIR, 'sw.js'), 'sw.js')

// Analyze assets
const assetPattern = /\.(js|css|map)$/
const assetFiles = require('fs').readdirSync(assetsDir)
  .filter(file => assetPattern.test(file))

let totalAssetSize = 0
for (const file of assetFiles) {
  const size = analyzeFile(join(assetsDir, file), `assets/${file}`)
  totalAssetSize += size
}

// Sort by size
fileStats.sort((a, b) => b.size - a.size)

console.log('\n📈 File Size Analysis:')
fileStats.forEach(({ file, size }) => {
  const status = size > 500 ? '🔴' : size > 200 ? '🟡' : '🟢'
  console.log(`${status} ${file}: ${size} KB`)
})

const totalSizeKB = Math.round((totalAssetSize + fileStats.reduce((sum, f) => sum + (f.size * 1024), 0)) / 1024)
console.log(`\n📦 Total deployment size: ${totalSizeKB} KB`)

// Performance recommendations
console.log('\n💡 Performance Recommendations:')
if (totalSizeKB > 2000) {
  console.log('⚠️  Consider code splitting for better loading performance')
}
if (fileStats.some(f => f.size > 500)) {
  console.log('⚠️  Some files are large. Consider compression optimization')
}
if (assetFiles.length > 10) {
  console.log('⚠️  High number of assets. Consider bundling optimization')
}

console.log('\n✅ Deployment optimization complete!')
console.log('🚀 Ready for deployment to Vercel')
