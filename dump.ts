import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'justice_v2.db');
const db = new Database(dbPath);

console.log("=== CASES ===");
console.log(db.prepare("SELECT * FROM cases").all());

console.log("=== USERS ===");
console.log(db.prepare("SELECT id, name, email, role FROM users").all());

console.log("=== SESSIONS ===");
console.log(db.prepare("SELECT * FROM sessions").all());
