// Normalize existing expiresAt values in database.db
// For each row in links table: if expiresAt is a valid date, convert to ISO string; otherwise set to NULL.

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: './database.db', driver: sqlite3.Database });

  const rows = await db.all('SELECT id, expiresAt FROM links');
  for (const row of rows) {
    if (!row.expiresAt) continue;
    const parsed = new Date(row.expiresAt);
    if (isNaN(parsed.getTime())) {
      console.log(`Clearing invalid expiresAt for id=${row.id} (value="${row.expiresAt}")`);
      await db.run('UPDATE links SET expiresAt = NULL WHERE id = ?', row.id);
    } else {
      const iso = parsed.toISOString();
      if (iso !== row.expiresAt) {
        console.log(`Normalizing id=${row.id}: ${row.expiresAt} -> ${iso}`);
        await db.run('UPDATE links SET expiresAt = ? WHERE id = ?', iso, row.id);
      }
    }
  }

  console.log('Normalization complete');
  await db.close();
})();
