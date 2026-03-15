import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../justice_v2.db');
const db = new Database(dbPath);

console.log("Starting migration...");

db.exec(`
  PRAGMA foreign_keys=OFF;

  CREATE TABLE new_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('lawyer', 'client')) NOT NULL,
    phone TEXT
  );

  INSERT INTO new_users (id, name, email, password, role, phone)
  SELECT id, name, email, password, role, phone FROM users;

  DROP TABLE users;

  ALTER TABLE new_users RENAME TO users;

  PRAGMA foreign_keys=ON;
`);

console.log("Migration complete!");
