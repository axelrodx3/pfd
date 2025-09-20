#!/usr/bin/env node

/**
 * Security checker script
 * Validates security headers, CSP, HTTPS status, and other security configurations
 */

const https = require('https')
const http = require('http')
const url = require('url')

class SecurityChecker {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    }
  }

  async checkSecurity() {
    console.log(`🔍 Checking security for: ${this.baseUrl}`)

    await this.checkHTTPS()
    await this.checkSecurityHeaders()
    await this.checkCSP()
    await this.checkMixedContent()
    await this.checkCookies()

    this.printResults()
    return this.results
  }

  async checkHTTPS() {
    try {
      const parsedUrl = url.parse(this.baseUrl)

      if (parsedUrl.protocol === 'https:') {
        this.results.passed.push('✅ HTTPS is enabled')

        // Check certificate
        await this.checkCertificate(parsedUrl.hostname)
      } else {
        this.results.failed.push('❌ HTTPS is not enabled - CRITICAL')
      }
    } catch (error) {
      this.results.failed.push(`❌ HTTPS check failed: ${error.message}`)
    }
  }

  async checkCertificate(hostname) {
    return new Promise(resolve => {
      const options = {
        hostname,
        port: 443,
        path: '/',
        method: 'GET',
        rejectUnauthorized: false,
      }

      const req = https.request(options, res => {
        const cert = res.connection.getPeerCertificate()

        if (cert && cert.subject) {
          const daysUntilExpiry = Math.floor(
            (new Date(cert.valid_to) - new Date()) / (1000 * 60 * 60 * 24)
          )

          if (daysUntilExpiry > 30) {
            this.results.passed.push(
              `✅ SSL certificate valid for ${daysUntilExpiry} days`
            )
          } else if (daysUntilExpiry > 0) {
            this.results.warnings.push(
              `⚠️ SSL certificate expires in ${daysUntilExpiry} days`
            )
          } else {
            this.results.failed.push('❌ SSL certificate has expired')
          }
        }

        resolve()
      })

      req.on('error', error => {
        this.results.failed.push(
          `❌ Certificate check failed: ${error.message}`
        )
        resolve()
      })

      req.end()
    })
  }

  async checkSecurityHeaders() {
    try {
      const headers = await this.fetchHeaders()

      const requiredHeaders = {
        'strict-transport-security': 'HSTS header',
        'x-frame-options': 'X-Frame-Options header',
        'x-content-type-options': 'X-Content-Type-Options header',
        'referrer-policy': 'Referrer-Policy header',
        'content-security-policy': 'Content Security Policy header',
      }

      Object.entries(requiredHeaders).forEach(([header, description]) => {
        if (headers[header]) {
          this.results.passed.push(`✅ ${description} is present`)

          // Check specific header values
          this.validateHeaderValue(header, headers[header])
        } else {
          this.results.failed.push(`❌ ${description} is missing`)
        }
      })

      // Check for dangerous headers
      if (headers['x-powered-by']) {
        this.results.warnings.push('⚠️ X-Powered-By header should be removed')
      }
    } catch (error) {
      this.results.failed.push(
        `❌ Security headers check failed: ${error.message}`
      )
    }
  }

  validateHeaderValue(header, value) {
    switch (header) {
      case 'x-frame-options':
        if (
          value.toLowerCase() === 'deny' ||
          value.toLowerCase() === 'sameorigin'
        ) {
          this.results.passed.push(
            `✅ X-Frame-Options set to secure value: ${value}`
          )
        } else {
          this.results.warnings.push(
            `⚠️ X-Frame-Options should be 'DENY' or 'SAMEORIGIN': ${value}`
          )
        }
        break

      case 'x-content-type-options':
        if (value.toLowerCase() === 'nosniff') {
          this.results.passed.push('✅ X-Content-Type-Options set to nosniff')
        } else {
          this.results.warnings.push(
            `⚠️ X-Content-Type-Options should be 'nosniff': ${value}`
          )
        }
        break

      case 'strict-transport-security':
        if (value.includes('max-age') && value.includes('includeSubDomains')) {
          this.results.passed.push('✅ HSTS properly configured')
        } else {
          this.results.warnings.push(
            `⚠️ HSTS should include max-age and includeSubDomains: ${value}`
          )
        }
        break

      case 'content-security-policy':
        this.validateCSP(value)
        break
    }
  }

  validateCSP(csp) {
    const directives = csp.split(';').map(d => d.trim())
    const directiveMap = {}

    directives.forEach(directive => {
      const [name, ...values] = directive.split(' ').map(v => v.trim())
      if (name) {
        directiveMap[name.toLowerCase()] = values
      }
    })

    // Check for unsafe directives
    if (directiveMap['script-src']?.includes("'unsafe-eval'")) {
      this.results.warnings.push('⚠️ CSP script-src contains unsafe-eval')
    }

    if (directiveMap['script-src']?.includes("'unsafe-inline'")) {
      this.results.warnings.push('⚠️ CSP script-src contains unsafe-inline')
    }

    // Check for required directives
    const requiredDirectives = [
      'default-src',
      'script-src',
      'style-src',
      'connect-src',
    ]
    requiredDirectives.forEach(directive => {
      if (directiveMap[directive]) {
        this.results.passed.push(`✅ CSP ${directive} directive present`)
      } else {
        this.results.failed.push(`❌ CSP ${directive} directive missing`)
      }
    })

    // Check for frame-ancestors
    if (directiveMap['frame-ancestors']?.includes("'none'")) {
      this.results.passed.push('✅ CSP frame-ancestors set to none')
    } else {
      this.results.warnings.push('⚠️ CSP frame-ancestors should be set to none')
    }
  }

  async checkCSP() {
    try {
      const headers = await this.fetchHeaders()

      if (headers['content-security-policy']) {
        this.results.passed.push('✅ Content Security Policy header is present')
      } else if (headers['content-security-policy-report-only']) {
        this.results.warnings.push('⚠️ CSP is in report-only mode')
      } else {
        this.results.failed.push('❌ Content Security Policy header is missing')
      }
    } catch (error) {
      this.results.failed.push(`❌ CSP check failed: ${error.message}`)
    }
  }

  async checkMixedContent() {
    try {
      const response = await this.fetchPage()

      // Check for mixed content indicators
      const mixedContentPatterns = [
        /src="http:/,
        /href="http:/,
        /url\(http:/,
        /@import.*http:/,
      ]

      mixedContentPatterns.forEach((pattern, index) => {
        if (pattern.test(response)) {
          this.results.warnings.push(
            `⚠️ Potential mixed content detected (pattern ${index + 1})`
          )
        }
      })

      if (!mixedContentPatterns.some(pattern => pattern.test(response))) {
        this.results.passed.push('✅ No mixed content detected')
      }
    } catch (error) {
      this.results.failed.push(
        `❌ Mixed content check failed: ${error.message}`
      )
    }
  }

  async checkCookies() {
    try {
      const headers = await this.fetchHeaders()
      const setCookieHeaders = headers['set-cookie'] || []

      if (setCookieHeaders.length === 0) {
        this.results.passed.push('✅ No cookies set (good for privacy)')
        return
      }

      setCookieHeaders.forEach((cookie, index) => {
        const cookieStr = Array.isArray(cookie) ? cookie[0] : cookie

        // Check for secure flag
        if (cookieStr.includes('Secure')) {
          this.results.passed.push(`✅ Cookie ${index + 1} has Secure flag`)
        } else {
          this.results.warnings.push(
            `⚠️ Cookie ${index + 1} missing Secure flag`
          )
        }

        // Check for HttpOnly flag
        if (cookieStr.includes('HttpOnly')) {
          this.results.passed.push(`✅ Cookie ${index + 1} has HttpOnly flag`)
        } else {
          this.results.warnings.push(
            `⚠️ Cookie ${index + 1} missing HttpOnly flag`
          )
        }

        // Check for SameSite
        if (
          cookieStr.includes('SameSite=Strict') ||
          cookieStr.includes('SameSite=Lax')
        ) {
          this.results.passed.push(
            `✅ Cookie ${index + 1} has SameSite attribute`
          )
        } else {
          this.results.warnings.push(
            `⚠️ Cookie ${index + 1} missing SameSite attribute`
          )
        }
      })
    } catch (error) {
      this.results.failed.push(`❌ Cookie check failed: ${error.message}`)
    }
  }

  async fetchHeaders() {
    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(this.baseUrl)
      const isHttps = parsedUrl.protocol === 'https:'
      const client = isHttps ? https : http

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: 'HEAD',
        headers: {
          'User-Agent': 'SecurityChecker/1.0',
        },
      }

      const req = client.request(options, res => {
        resolve(res.headers)
      })

      req.on('error', reject)
      req.end()
    })
  }

  async fetchPage() {
    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(this.baseUrl)
      const isHttps = parsedUrl.protocol === 'https:'
      const client = isHttps ? https : http

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: 'GET',
        headers: {
          'User-Agent': 'SecurityChecker/1.0',
        },
      }

      const req = client.request(options, res => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => resolve(data))
      })

      req.on('error', reject)
      req.end()
    })
  }

  printResults() {
    console.log('\n📊 Security Check Results:\n')

    if (this.results.passed.length > 0) {
      console.log('✅ PASSED:')
      this.results.passed.forEach(result => console.log(`  ${result}`))
      console.log('')
    }

    if (this.results.warnings.length > 0) {
      console.log('⚠️ WARNINGS:')
      this.results.warnings.forEach(result => console.log(`  ${result}`))
      console.log('')
    }

    if (this.results.failed.length > 0) {
      console.log('❌ FAILED:')
      this.results.failed.forEach(result => console.log(`  ${result}`))
      console.log('')
    }

    const total =
      this.results.passed.length +
      this.results.warnings.length +
      this.results.failed.length
    const passed = this.results.passed.length
    const score = total > 0 ? Math.round((passed / total) * 100) : 0

    console.log(`📈 Security Score: ${score}% (${passed}/${total})`)

    if (score >= 80) {
      console.log('🎉 Good security posture!')
    } else if (score >= 60) {
      console.log('⚠️ Security needs improvement')
    } else {
      console.log('🚨 Critical security issues found!')
    }
  }
}

// CLI usage
if (require.main === module) {
  const url = process.argv[2]

  if (!url) {
    console.log('Usage: node security-checker.js <URL>')
    console.log('Example: node security-checker.js https://example.com')
    process.exit(1)
  }

  const checker = new SecurityChecker(url)
  checker
    .checkSecurity()
    .then(results => {
      process.exit(results.failed.length > 0 ? 1 : 0)
    })
    .catch(error => {
      console.error('Security check failed:', error)
      process.exit(1)
    })
}

module.exports = SecurityChecker
