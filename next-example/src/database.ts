import sqlite from 'sqlite3';
import SQL, { type SQLStatement } from 'sql-template-strings';

const db = new sqlite.Database('database.db');

export const run = (query: SQLStatement) => {
  db.run(query.sql, query.values)
}

export const query = (query: SQLStatement) => {
  return new Promise((resolve, reject) => {
    db.all(query.sql, query.values, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    })
  })
}

run(SQL`CREATE TABLE IF NOT EXISTS messages (
  message_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp INTEGER NOT NULL
)`)