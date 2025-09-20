#!/usr/bin/env node

/**
 * Build Verification Script
 * Ensures CSS and other critical assets are properly generated during build
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

function verifyBuild() {
  console.log('🔍 Verifying build output...')

  const distPath = join(projectRoot, 'dist')
  const indexPath = join(distPath, 'index.html')

  // Check if dist directory exists
  if (!existsSync(distPath)) {
    console.error('❌ Build failed: dist directory not found')
    process.exit(1)
  }

  // Check if index.html exists
  if (!existsSync(indexPath)) {
    console.error('❌ Build failed: index.html not found in dist/')
    process.exit(1)
  }

  // Read and parse index.html
  const htmlContent = readFileSync(indexPath, 'utf-8')

  // Check for CSS link
  const cssLinkMatch = htmlContent.match(/<link[^>]*rel="stylesheet"[^>]*>/g)
  if (!cssLinkMatch || cssLinkMatch.length === 0) {
    console.error('❌ Build failed: No CSS stylesheet found in index.html')
    console.error('   This usually means TailwindCSS compilation failed')
    process.exit(1)
  }

  // Check for JS script
  const jsScriptMatch = htmlContent.match(/<script[^>]*type="module"[^>]*>/g)
  if (!jsScriptMatch || jsScriptMatch.length === 0) {
    console.error('❌ Build failed: No JavaScript module found in index.html')
    process.exit(1)
  }

  // Verify CSS file exists
  const cssHrefMatch = htmlContent.match(/href="([^"]*\.css)"/)
  if (cssHrefMatch) {
    const cssPath = join(distPath, cssHrefMatch[1].replace(/^\//, ''))
    if (!existsSync(cssPath)) {
      console.error(`❌ Build failed: CSS file not found: ${cssHrefMatch[1]}`)
      process.exit(1)
    }

    // Check CSS file size (should be substantial for TailwindCSS)
    const cssStats = readFileSync(cssPath, 'utf-8')
    if (cssStats.length < 1000) {
      console.error(
        `❌ Build failed: CSS file too small (${cssStats.length} bytes) - TailwindCSS likely not compiled`
      )
      process.exit(1)
    }

    console.log(
      `✅ CSS file verified: ${cssHrefMatch[1]} (${cssStats.length} bytes)`
    )
  }

  // Verify JS file exists
  const jsSrcMatch = htmlContent.match(/src="([^"]*\.js)"/)
  if (jsSrcMatch) {
    const jsPath = join(distPath, jsSrcMatch[1].replace(/^\//, ''))
    if (!existsSync(jsPath)) {
      console.error(
        `❌ Build failed: JavaScript file not found: ${jsSrcMatch[1]}`
      )
      process.exit(1)
    }
    console.log(`✅ JavaScript file verified: ${jsSrcMatch[1]}`)
  }

  console.log('✅ Build verification passed! All critical assets present.')
  console.log(`   - HTML: ${indexPath}`)
  console.log(`   - CSS: ${cssLinkMatch.length} stylesheet(s) found`)
  console.log(`   - JS: ${jsScriptMatch.length} script(s) found`)
}

// Run verification
try {
  verifyBuild()
} catch (error) {
  console.error('❌ Build verification failed:', error.message)
  process.exit(1)
}
