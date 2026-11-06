
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const databaseDirectory = __dirname

fs.mkdirSync(databaseDirectory, { recursive: true })

const dbPath = path.join(databaseDirectory, 'visualguard.db')

const db = new Database(dbPath)

// Enable foreign key support
db.pragma('foreign_keys = ON')

// Create scan history table
db.exec(`
    CREATE TABLE IF NOT EXISTS scan_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        title TEXT,
        viewport TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        screenshot TEXT,
        baseline_filename TEXT,
        difference_image TEXT,
        similarity_percentage REAL,
        difference_percentage REAL,
        changed_pixels INTEGER,
        status TEXT DEFAULT 'Captured',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`)
// Add browser column for multi-browser testing
const columns = db.prepare(`
    PRAGMA table_info(scan_history)
`).all()

const browserColumnExists = columns.some(
    column => column.name === 'browser'
)

if (!browserColumnExists) {
    db.exec(`
        ALTER TABLE scan_history
        ADD COLUMN browser TEXT NOT NULL DEFAULT 'Chromium'
    `)
}

console.log('Browser column migration checked successfully')

// Create cross-browser test history table
db.exec(`
    CREATE TABLE IF NOT EXISTS cross_browser_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        viewport TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        chromium_screenshot TEXT,
        firefox_screenshot TEXT,
        webkit_screenshot TEXT,
        firefox_similarity REAL,
        firefox_difference REAL,
        firefox_changed_pixels INTEGER,
        firefox_difference_image TEXT,
        firefox_passed INTEGER,
        webkit_similarity REAL,
        webkit_difference REAL,
        webkit_changed_pixels INTEGER,
        webkit_difference_image TEXT,
        webkit_passed INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`)

console.log('Cross-browser history table checked successfully')
// Create email OTP verification table
db.exec(`
    CREATE TABLE IF NOT EXISTS email_otp_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        otp_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        verified INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`)

console.log('Email OTP verification table checked successfully')
console.log('SQLite database connected successfully')

module.exports = db