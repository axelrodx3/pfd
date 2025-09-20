#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

// Helper function to run commands in parallel with proper tagging
function runCommandParallel(command, args, description, tag) {
  return new Promise(resolve => {
    console.log(
      `${colors.blue}${colors.bold}🔍 [${tag}] Starting: ${description}${colors.reset}`
    )

    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', data => {
      const output = data.toString()
      stdout += output
      // Tag each line of output
      const lines = output.split('\n')
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`${colors.blue}[${tag}]${colors.reset} ${line}`)
        }
      })
    })

    child.stderr.on('data', data => {
      const output = data.toString()
      stderr += output
      // Tag each line of error output
      const lines = output.split('\n')
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`${colors.red}[${tag}]${colors.reset} ${line}`)
        }
      })
    })

    child.on('close', code => {
      if (code === 0) {
        console.log(
          `${colors.green}✅ [${tag}] ${description} - PASSED${colors.reset}`
        )
        resolve({ success: true, output: stdout, errors: stderr })
      } else {
        console.log(
          `${colors.red}❌ [${tag}] ${description} - FAILED (exit code: ${code})${colors.reset}`
        )
        resolve({
          success: false,
          output: stdout,
          errors: stderr,
          exitCode: code,
        })
      }
    })

    child.on('error', error => {
      console.log(
        `${colors.red}❌ [${tag}] ${description} - ERROR: ${error.message}${colors.reset}`
      )
      resolve({ success: false, error: error.message })
    })
  })
}

// Check if a package is installed
function isPackageInstalled(packageName) {
  try {
    require.resolve(packageName)
    return true
  } catch {
    return false
  }
}

// Main security check function - PARALLEL VERSION
async function runSecurityCheck() {
  console.log(
    `${colors.bold}${colors.blue}🛡️  Starting Parallel Security Check Suite${colors.reset}\n`
  )

  // Prepare all commands to run in parallel
  const commands = [
    {
      command: 'npm',
      args: ['audit', '--production'],
      description: 'npm audit --production',
      tag: 'AUDIT',
    },
    {
      command: 'npx',
      args: ['eslint', '.', '--ext', '.ts,.js'],
      description: 'ESLint security check',
      tag: 'ESLINT',
    },
    {
      command: 'npx',
      args: ['tsc', '--noEmit'],
      description: 'TypeScript type check',
      tag: 'TYPESCRIPT',
    },
  ]

  // Add snyk if available
  if (isPackageInstalled('snyk')) {
    commands.push({
      command: 'npx',
      args: ['snyk', 'test'],
      description: 'snyk vulnerability test',
      tag: 'SNYK',
    })
  } else {
    console.log(
      `${colors.yellow}⚠️  snyk not installed - skipping deep vulnerability scan${colors.reset}`
    )
    console.log(
      `${colors.blue}   Install with: npm install -g snyk${colors.reset}`
    )
    console.log(`${colors.blue}   Or run: npx snyk test${colors.reset}\n`)
  }

  console.log(
    `${colors.bold}🚀 Running ${commands.length} security checks in parallel...${colors.reset}\n`
  )

  // Start all commands in parallel
  const startTime = Date.now()
  const promises = commands.map(cmd =>
    runCommandParallel(cmd.command, cmd.args, cmd.description, cmd.tag)
  )

  // Wait for all commands to complete
  const results = await Promise.all(promises)
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  console.log(
    `\n${colors.bold}⏱️  All checks completed in ${duration}s${colors.reset}\n`
  )

  // Check for failures
  let hasFailures = false
  results.forEach((result, index) => {
    if (!result.success) {
      hasFailures = true
    }
  })

  // 5. Optional: Check for security headers configuration (runs after parallel checks)
  console.log(
    `${colors.bold}5. Security Headers Configuration Check${colors.reset}`
  )
  checkSecurityHeaders()
  console.log('')

  // Summary
  console.log(
    `${colors.bold}${colors.blue}📊 Security Check Summary${colors.reset}`
  )
  console.log(`${colors.bold}=============================${colors.reset}`)

  const checkNames = ['npm audit', 'snyk test', 'ESLint', 'TypeScript']

  results.forEach((result, index) => {
    const checkName = checkNames[index] || `Check ${index + 1}`
    if (result.success) {
      console.log(`${colors.green}✅ ${checkName}: PASSED${colors.reset}`)
    } else {
      console.log(`${colors.red}❌ ${checkName}: FAILED${colors.reset}`)
    }
  })

  console.log('')

  if (hasFailures) {
    console.log(
      `${colors.red}${colors.bold}🚨 Security check FAILED - Issues found that need attention${colors.reset}`
    )
    console.log(
      `${colors.yellow}Please review the failed checks above and fix the issues before deploying.${colors.reset}`
    )
    process.exit(1)
  } else {
    console.log(
      `${colors.green}${colors.bold}🎉 All security checks PASSED - Your code is secure!${colors.reset}`
    )
    process.exit(0)
  }
}

// Check for security headers configuration
function checkSecurityHeaders() {
  const configFiles = [
    'server/security.js',
    'vercel.json',
    '.vercel/project.json',
  ]

  let foundSecurityConfig = false

  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(
        `${colors.green}✅ Found security config: ${file}${colors.reset}`
      )
      foundSecurityConfig = true
    }
  })

  if (!foundSecurityConfig) {
    console.log(
      `${colors.yellow}⚠️  No explicit security headers configuration found${colors.reset}`
    )
    console.log(
      `${colors.blue}   Consider implementing security headers in your deployment config${colors.reset}`
    )
  }

  // Check for CSP in HTML files
  const htmlFiles = ['index.html', 'dist/index.html']
  htmlFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8')
      if (content.includes('Content-Security-Policy')) {
        console.log(
          `${colors.green}✅ CSP headers found in ${file}${colors.reset}`
        )
      } else {
        console.log(
          `${colors.yellow}⚠️  No CSP headers found in ${file}${colors.reset}`
        )
      }
    }
  })
}

// Run the security check
if (require.main === module) {
  runSecurityCheck()
}

module.exports = { runSecurityCheck }
