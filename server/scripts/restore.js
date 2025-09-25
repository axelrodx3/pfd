/*
 * Restore SQLite DB from a snapshot file (local or S3 URL already downloaded).
 * Usage:
 *   npm run restore -- path/to/backup.db
 */
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../data/hilo_casino.db')

async function main() {
  const src = process.argv[2]
  if (!src) {
    console.error('Usage: npm run restore -- <backup_file_path>')
    process.exit(1)
  }
  if (!fs.existsSync(src)) {
    console.error('Backup file not found:', src)
    process.exit(2)
  }
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  // Create safety copy of current DB
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const safety = path.join(dir, `pre-restore-${stamp}.db`)
  if (fs.existsSync(DB_PATH)) fs.copyFileSync(DB_PATH, safety)
  // Restore
  fs.copyFileSync(src, DB_PATH)
  console.log('✅ Database restored from', src)
  console.log('🛟 Previous DB saved to', safety)
}

if (require.main === module) main()


