// Simple test script to insert a short link with an expiry a few seconds in the future
// and verify the stored expiresAt value.

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { nanoid } = require('nanoid');

(async () => {
  const db = await open({ filename: './database.db', driver: sqlite3.Database });
  await db.exec(`CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shortId TEXT NOT NULL UNIQUE,
      originalUrl TEXT NOT NULL,
      expiresAt TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

  const shortId = nanoid(8);
  const url = 'https://example.com/test-expiry';
  const expiresAt = new Date(Date.now() + 10 * 1000).toISOString(); // 10 seconds from now

  await db.run('INSERT INTO links (shortId, originalUrl, expiresAt) VALUES (?, ?, ?)', [shortId, url, expiresAt]);

  const row = await db.get('SELECT * FROM links WHERE shortId = ?', shortId);
  console.log('Inserted row:', row);

  await db.close();
})();
