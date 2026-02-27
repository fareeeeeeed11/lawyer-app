import express from "express";
console.log("Starting server...");
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("justice_v2.db");
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");

// Initialize Database
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
    court TEXT,
    type TEXT,
    status TEXT DEFAULT 'active',
    lawyer_id INTEGER,
    client_id INTEGER,
    fees DECIMAL(10, 2) DEFAULT 0,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
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

// Seed Lawyer if not exists
const lawyer = db.prepare("SELECT * FROM users WHERE role = 'lawyer'").get();
if (!lawyer) {
  db.prepare("INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)").run(
    "محمد أحمد الكامل",
    "Mohammedalkamel@gmail.com",
    "alkamel19791979",
    "lawyer",
    "0000000000" // Placeholder phone for lawyer
  );
} else {
  // Update existing lawyer to match requested credentials if needed
  db.prepare("UPDATE users SET name = ?, email = ?, password = ? WHERE role = 'lawyer'").run(
    "محمد أحمد الكامل",
    "Mohammedalkamel@gmail.com",
    "alkamel19791979"
  );
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// File Upload Setup
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// API Routes
app.post("/api/login", (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or phone
  const user = db.prepare("SELECT * FROM users WHERE (email = ? OR phone = ?) AND password = ?").get(identifier, identifier, password) as any;
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
  }
});

app.post("/api/register", (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const result = db.prepare("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)").run(
      name,
      email,
      phone,
      password,
      "client"
    );
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as any;
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (e: any) {
    res.status(400).json({ error: "البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً" });
  }
});

app.get("/api/cases", (req, res) => {
  const { userId, role } = req.query;
  let cases;
  if (role === 'lawyer') {
    cases = db.prepare(`
      SELECT cases.*, users.name as client_name 
      FROM cases 
      LEFT JOIN users ON cases.client_id = users.id 
      WHERE lawyer_id = ?
    `).all(userId);
  } else {
    cases = db.prepare(`
      SELECT cases.*, users.name as lawyer_name 
      FROM cases 
      LEFT JOIN users ON cases.lawyer_id = users.id 
      WHERE client_id = ?
    `).all(userId);
  }
  res.json(cases);
});

app.post("/api/cases", (req, res) => {
  const { case_number, title, court, type, lawyer_id, client_email, client_name, fees } = req.body;
  
  // Find or create client
  let client = db.prepare("SELECT * FROM users WHERE email = ?").get(client_email) as any;
  if (!client) {
    const result = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
      client_name,
      client_email,
      "client123", // Default password
      "client"
    );
    client = { id: result.lastInsertRowid };
  }

  try {
    const result = db.prepare(`
      INSERT INTO cases (case_number, title, court, type, lawyer_id, client_id, fees) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(case_number, title, court, type, lawyer_id, client.id, Number(fees) || 0);
    res.json({ id: result.lastInsertRowid });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/cases/:id", (req, res) => {
  const caseData = db.prepare(`
    SELECT cases.*, u1.name as lawyer_name, u2.name as client_name, u2.email as client_email
    FROM cases 
    JOIN users u1 ON cases.lawyer_id = u1.id
    JOIN users u2 ON cases.client_id = u2.id
    WHERE cases.id = ?
  `).get(req.params.id);
  
  const sessions = db.prepare("SELECT * FROM sessions WHERE case_id = ? ORDER BY session_date ASC").all(req.params.id);
  const documents = db.prepare("SELECT * FROM documents WHERE case_id = ? ORDER BY created_at DESC").all(req.params.id);
  const messages = db.prepare(`
    SELECT messages.*, users.name as sender_name, users.role as sender_role
    FROM messages 
    JOIN users ON messages.sender_id = users.id
    WHERE case_id = ? 
    ORDER BY created_at ASC
  `).all(req.params.id);

  res.json({ ...caseData, sessions, documents, messages });
});

app.post("/api/sessions", (req, res) => {
  const { case_id, session_date, notes } = req.body;
  const result = db.prepare("INSERT INTO sessions (case_id, session_date, notes) VALUES (?, ?, ?)").run(case_id, session_date, notes);
  res.json({ id: result.lastInsertRowid });
});

app.post("/api/documents", upload.single("file"), (req, res) => {
  const { case_id, uploaded_by } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const result = db.prepare("INSERT INTO documents (case_id, file_name, file_path, uploaded_by) VALUES (?, ?, ?, ?)").run(
    case_id,
    file.originalname,
    file.filename,
    uploaded_by
  );
  res.json({ id: result.lastInsertRowid, file_name: file.originalname, file_path: file.filename });
});

app.get("/api/download/:filename", (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

app.patch("/api/cases/:id/fees", (req, res) => {
  const { fees, paid_amount } = req.body;
  try {
    db.prepare("UPDATE cases SET fees = ?, paid_amount = ? WHERE id = ?").run(fees, paid_amount, req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/cases/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM messages WHERE case_id = ?").run(req.params.id);
    db.prepare("DELETE FROM sessions WHERE case_id = ?").run(req.params.id);
    db.prepare("DELETE FROM documents WHERE case_id = ?").run(req.params.id);
    db.prepare("DELETE FROM cases WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/stats/lawyer/:id", (req, res) => {
  const activeCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE lawyer_id = ? AND status = 'active'").get(req.params.id) as any;
  const totalClients = db.prepare("SELECT COUNT(DISTINCT client_id) as count FROM cases WHERE lawyer_id = ?").get(req.params.id) as any;
  const upcomingSessions = db.prepare(`
    SELECT COUNT(*) as count FROM sessions 
    JOIN cases ON sessions.case_id = cases.id 
    WHERE cases.lawyer_id = ? AND session_date > datetime('now')
  `).get(req.params.id) as any;

  res.json({
    activeCases: activeCases.count,
    totalClients: totalClients.count,
    upcomingSessions: upcomingSessions.count
  });
});

app.post("/api/ai/summarize", async (req, res) => {
  const { caseId } = req.body;
  try {
    const caseInfo = db.prepare(`
      SELECT cases.*, u1.name as lawyer_name, u2.name as client_name
      FROM cases 
      JOIN users u1 ON cases.lawyer_id = u1.id
      JOIN users u2 ON cases.client_id = u2.id
      WHERE cases.id = ?
    `).get(caseId) as any;

    const messages = db.prepare(`
      SELECT messages.*, users.name as sender_name 
      FROM messages 
      JOIN users ON messages.sender_id = users.id 
      WHERE case_id = ? 
      ORDER BY created_at DESC LIMIT 20
    `).all(caseId);

    const sessions = db.prepare("SELECT * FROM sessions WHERE case_id = ? ORDER BY session_date ASC").all(caseId);

    const prompt = `
      أنت مساعد قانوني خبير في النظام القضائي. حلل بيانات القضية التالية وقدم:
      1. ملخص تنفيذي ذكي جداً ومختصر.
      2. أهم النقاط القانونية التي يجب التركيز عليها.
      3. نصائح استراتيجية للمحامي لكسب القضية.
      4. تنبيهات حول أي مواعيد جلسات قريبة وكيفية التحضير لها.
      
      بيانات القضية:
      - الرقم: ${caseInfo.case_number}
      - العنوان: ${caseInfo.title}
      - المحكمة: ${caseInfo.court}
      - النوع: ${caseInfo.type}
      
      الجلسات المجدولة:
      ${sessions.map((s: any) => `- تاريخ: ${s.session_date}, ملاحظات: ${s.notes}`).join('\n')}
      
      آخر الرسائل في المحادثة:
      ${messages.map((m: any) => `- ${m.sender_name}: ${m.content}`).join('\n')}
      
      اجعل الرد بتنسيق Markdown جميل ومنظم جداً وباللغة العربية الفصحى.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ summary: response.text() });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "فشل تحليل الذكاء الاصطناعي" });
  }
});

// Socket.io for real-time chat
io.on("connection", (socket) => {
  socket.on("join-case", (caseId) => {
    socket.join(`case-${caseId}`);
  });

  socket.on("send-message", (data) => {
    const { case_id, sender_id, content } = data;
    const result = db.prepare("INSERT INTO messages (case_id, sender_id, content) VALUES (?, ?, ?)").run(case_id, sender_id, content);
    const message = db.prepare(`
      SELECT messages.*, users.name as sender_name, users.role as sender_role
      FROM messages 
      JOIN users ON messages.sender_id = users.id
      WHERE messages.id = ?
    `).get(result.lastInsertRowid);
    
    io.to(`case-${case_id}`).emit("new-message", message);
  });
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  // SPA fallback for development
  app.get("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api")) return next();
    
    try {
      let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const PORT = 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
