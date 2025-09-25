/*
 * Nightly S3 backup for SQLite DB with versioning and encryption.
 * Usage:
 *   node services/backup.js now            # run immediately
 *   node services/backup.js schedule       # start nightly at 03:00 UTC
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const DB_PATH = path.join(__dirname, '../data/hilo_casino.db')

function getEnv(name, fallback) {
  return process.env[name] || fallback
}

const S3_BUCKET = getEnv('BACKUP_S3_BUCKET', '')
const S3_PREFIX = getEnv('BACKUP_S3_PREFIX', 'backups/')
const REGION = getEnv('AWS_REGION', 'us-east-1')
const SSE = getEnv('BACKUP_SSE', 'AES256') // AES256 or aws:kms
const KMS_KEY_ID = getEnv('BACKUP_KMS_KEY_ID', undefined)

function makeS3Client() {
  return new S3Client({ region: REGION })
}

async function backupOnce() {
  if (!S3_BUCKET) {
    console.error('BACKUP_S3_BUCKET not configured; skipping offsite backup')
    process.exit(1)
  }
  // Ensure DB exists
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database file not found:', DB_PATH)
    process.exit(2)
  }
  // Read file
  const data = fs.readFileSync(DB_PATH)
  // Create content hash for verification
  const sha256 = crypto.createHash('sha256').update(data).digest('hex')
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const key = `${S3_PREFIX}sqlite-${ts}.db`

  const client = makeS3Client()
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: data,
    ServerSideEncryption: SSE,
  }
  if (SSE === 'aws:kms' && KMS_KEY_ID) params.SSEKMSKeyId = KMS_KEY_ID
  await client.send(new PutObjectCommand(params))
  console.log('✅ Backup uploaded to S3:', key, 'sha256:', sha256)
}

function scheduleNightly(hourUTC = 3) {
  const now = new Date()
  const next = new Date(now)
  next.setUTCHours(hourUTC, 0, 0, 0)
  if (next <= now) next.setUTCDate(now.getUTCDate() + 1)
  const delay = next.getTime() - now.getTime()
  console.log(`⏰ Scheduling nightly S3 backup at ${hourUTC}:00 UTC (in ${Math.round(delay/1000)}s)`) 
  setTimeout(async () => {
    await backupOnce().catch(e => console.error('Nightly backup error:', e))
    setInterval(() => backupOnce().catch(e => console.error('Nightly backup error:', e)), 24 * 60 * 60 * 1000)
  }, delay)
}

if (require.main === module) {
  const cmd = process.argv[2] || 'now'
  if (cmd === 'now') {
    backupOnce().catch(err => { console.error(err); process.exit(1) })
  } else if (cmd === 'schedule') {
    scheduleNightly(3)
  } else {
    console.log('Usage: node services/backup.js [now|schedule]')
  }
}

module.exports = { backupOnce, scheduleNightly }


