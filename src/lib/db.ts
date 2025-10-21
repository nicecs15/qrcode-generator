import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';

// This helps avoid re-opening the database on every hot-reload in development
declare global {
  var db: Database | undefined;
}

let db: Database;

async function initializeDb() {
  const dbFile = process.env.SQLITE_FILE || './database.db';

  if (process.env.NODE_ENV === 'production') {
    if (db) return db;
    db = await open({
      filename: dbFile,
      driver: sqlite3.Database
    });
  } else {
    // In development, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global.db) {
      global.db = await open({
        filename: dbFile,
        driver: sqlite3.Database
      });
    }
    db = global.db;
  }

  // Create table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shortId TEXT NOT NULL UNIQUE,
      originalUrl TEXT NOT NULL,
      expiresAt TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

// Export a function that initializes and returns the DB
export async function getDb() {
  return await initializeDb();
}