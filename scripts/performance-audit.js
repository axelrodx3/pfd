#!/usr/bin/env node

/**
 * Performance Audit Script
 * Analyzes build output for performance optimizations
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'fs'
import { join } from 'path'

const DIST_DIR = 'dist'

console.log('🚀 Starting performance audit...')

if (!existsSync(DIST_DIR)) {
  console.error('❌ Dist directory not found. Run "npm run build" first.')
  process.exit(1)
}

// Analyze build assets
const assetsDir = join(DIST_DIR, 'assets')
const assets = []

if (existsSync(assetsDir)) {
  const files = readdirSync(assetsDir)
  
  for (const file of files) {
    const filePath = join(assetsDir, file)
    const stats = statSync(filePath)
    const sizeKB = Math.round(stats.size / 1024)
    
    assets.push({
      name: file,
      size: sizeKB,
      type: getFileType(file),
      critical: isCriticalAsset(file)
    })
  }
}

// Sort by size
assets.sort((a, b) => b.size - a.size)

console.log('\n📊 Asset Analysis:')
console.log('==================')

let totalSize = 0
let criticalSize = 0
let jsSize = 0
let cssSize = 0

assets.forEach(asset => {
  const status = getSizeStatus(asset.size, asset.type)
  const critical = asset.critical ? '🔴' : '🟢'
  console.log(`${status} ${critical} ${asset.name}: ${asset.size} KB (${asset.type})`)
  
  totalSize += asset.size
  
  if (asset.critical) criticalSize += asset.size
  if (asset.type === 'JS') jsSize += asset.size
  if (asset.type === 'CSS') cssSize += asset.size
})

console.log('\n📈 Performance Metrics:')
console.log('======================')
console.log(`Total Bundle Size: ${totalSize} KB`)
console.log(`Critical Assets: ${criticalSize} KB`)
console.log(`JavaScript: ${jsSize} KB`)
console.log(`CSS: ${cssSize} KB`)

// Performance recommendations
console.log('\n💡 Performance Recommendations:')
console.log('==============================')

if (totalSize > 2000) {
  console.log('⚠️  Total bundle size is large. Consider:')
  console.log('   - Code splitting for non-critical features')
  console.log('   - Lazy loading for routes')
  console.log('   - Tree shaking unused code')
}

if (jsSize > 1000) {
  console.log('⚠️  JavaScript bundle is large. Consider:')
  console.log('   - Dynamic imports for heavy libraries')
  console.log('   - Web Workers for heavy computations')
  console.log('   - Bundle analysis with webpack-bundle-analyzer')
}

if (cssSize > 200) {
  console.log('⚠️  CSS bundle is large. Consider:')
  console.log('   - Critical CSS inlining')
  console.log('   - Unused CSS removal')
  console.log('   - CSS minification optimization')
}

// Check for optimization opportunities
const largeAssets = assets.filter(a => a.size > 500)
if (largeAssets.length > 0) {
  console.log('\n🔍 Large Assets (>500KB):')
  largeAssets.forEach(asset => {
    console.log(`   - ${asset.name}: ${asset.size} KB`)
  })
}

// Check chunk distribution
const jsAssets = assets.filter(a => a.type === 'JS')
if (jsAssets.length > 8) {
  console.log('\n⚠️  High number of JS chunks. Consider consolidation.')
}

console.log('\n✅ Performance audit complete!')

// Helper functions
function getFileType(filename) {
  if (filename.endsWith('.js')) return 'JS'
  if (filename.endsWith('.css')) return 'CSS'
  if (filename.endsWith('.map')) return 'SourceMap'
  if (filename.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'Image'
  return 'Other'
}

function isCriticalAsset(filename) {
  return filename.includes('index') || filename.includes('main')
}

function getSizeStatus(size, type) {
  if (type === 'JS') {
    if (size > 1000) return '🔴'
    if (size > 500) return '🟡'
    return '🟢'
  }
  if (type === 'CSS') {
    if (size > 200) return '🔴'
    if (size > 100) return '🟡'
    return '🟢'
  }
  return '🟢'
}
