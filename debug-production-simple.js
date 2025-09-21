const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugProduction() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = `prod-debug-${timestamp}.log`;
  
  console.log('🔍 Starting production debug capture...');
  console.log(`📝 Log file: ${logFile}`);
  
  const logs = [];
  const errors = [];
  
  function log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    logs.push(logEntry);
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      log(`CONSOLE ${type.toUpperCase()}: ${text}`);
      
      if (type === 'error' || type === 'warning') {
        errors.push({
          type: 'console',
          level: type,
          message: text,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Capture page errors
    page.on('pageerror', error => {
      log(`PAGE ERROR: ${error.message}`);
      log(`STACK: ${error.stack}`);
      errors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
    
    // Capture network requests
    page.on('response', response => {
      const status = response.status();
      const url = response.url();
      const contentType = response.headers()['content-type'];
      
      log(`NETWORK: ${status} ${response.request().method()} ${url}`);
      
      if (status >= 400) {
        log(`❌ FAILED REQUEST: ${status} ${url}`);
        errors.push({
          type: 'network',
          status: status,
          url: url,
          contentType: contentType,
          timestamp: new Date().toISOString()
        });
      }
      
      // Check for incorrect MIME types
      if (url.includes('.js') && contentType && !contentType.includes('javascript')) {
        log(`❌ INCORRECT MIME: ${url} served as ${contentType}`);
        errors.push({
          type: 'mime',
          url: url,
          contentType: contentType,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    log('🌐 Loading Vercel URL: https://hilo-livid.vercel.app/');
    
    try {
      const response = await page.goto('https://hilo-livid.vercel.app/', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      log(`📄 Page loaded with status: ${response.status()}`);
      
      // Wait for React to potentially mount
      await page.waitForTimeout(5000);
      
      // Check if React mounted
      const reactMounted = await page.evaluate(() => {
        const root = document.querySelector('#root');
        return root && root.innerHTML.trim() !== '';
      });
      
      log(`⚛️ React mounted: ${reactMounted}`);
      
      // Get page content analysis
      const pageAnalysis = await page.evaluate(() => {
        const root = document.querySelector('#root');
        const content = root ? root.innerHTML : '';
        const hasError = content.includes('Error') || content.includes('error');
        const isBlank = content.trim() === '';
        
        return {
          contentLength: content.length,
          hasError,
          isBlank,
          content: content.substring(0, 500) // First 500 chars
        };
      });
      
      log(`🔍 Page analysis:`);
      log(`  - Content length: ${pageAnalysis.contentLength} chars`);
      log(`  - Has error indicators: ${pageAnalysis.hasError}`);
      log(`  - Is blank: ${pageAnalysis.isBlank}`);
      log(`  - Content preview: ${pageAnalysis.content}`);
      
      // Check service worker
      const swInfo = await page.evaluate(() => {
        if ('serviceWorker' in navigator) {
          return navigator.serviceWorker.getRegistrations().then(regs => ({
            hasSW: regs.length > 0,
            count: regs.length
          })).catch(err => ({ error: err.message }));
        }
        return { hasSW: false };
      });
      
      log(`🔧 Service Worker: ${JSON.stringify(swInfo)}`);
      
    } catch (error) {
      log(`❌ Navigation failed: ${error.message}`);
      errors.push({
        type: 'navigation',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
    
  } finally {
    await browser.close();
  }
  
  // Write log file
  const fullLog = [
    '=== PRODUCTION DEBUG REPORT ===',
    `Timestamp: ${new Date().toISOString()}`,
    `URL: https://hilo-livid.vercel.app/`,
    '',
    '=== CONSOLE LOGS ===',
    ...logs,
    '',
    '=== ERRORS SUMMARY ===',
    ...errors.map(error => JSON.stringify(error, null, 2)),
    '',
    '=== END REPORT ==='
  ].join('\n');
  
  fs.writeFileSync(logFile, fullLog);
  console.log(`📝 Full report written to: ${logFile}`);
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total errors: ${errors.length}`);
  console.log(`Console errors: ${errors.filter(e => e.type === 'console').length}`);
  console.log(`Page errors: ${errors.filter(e => e.type === 'pageerror').length}`);
  console.log(`Network errors: ${errors.filter(e => e.type === 'network').length}`);
  
  return { errors, logs, logFile };
}

// Run the debug
debugProduction().catch(console.error);
