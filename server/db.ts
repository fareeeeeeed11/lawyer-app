import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const db = new Database(path.join(__dirname, "../justice_v2.db"));

export const initializeDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('lawyer', 'client')) NOT NULL,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      court TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      lawyer_id INTEGER,
      client_id INTEGER,
      fees REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      currency TEXT DEFAULT 'ريال سعودي',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lawyer_id) REFERENCES users(id),
      FOREIGN KEY(client_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER,
      session_date DATETIME NOT NULL,
      notes TEXT,
      FOREIGN KEY(case_id) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER,
      sender_id INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(case_id) REFERENCES cases(id),
      FOREIGN KEY(sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(case_id) REFERENCES cases(id),
      FOREIGN KEY(uploaded_by) REFERENCES users(id)
    );
  `);
};
