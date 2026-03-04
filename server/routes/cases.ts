import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get("/", (req, res) => {
    const { userId, role } = req.query;
    let cases;
    if (role === 'lawyer') {
        cases = db.prepare(`
      SELECT cases.*, users.name as client_name 
      FROM cases 
      JOIN users ON cases.client_id = users.id 
      WHERE lawyer_id = ?
      ORDER BY created_at DESC
    `).all(userId);
    } else {
        cases = db.prepare(`
      SELECT cases.*, users.name as lawyer_name 
      FROM cases 
      JOIN users ON cases.lawyer_id = users.id 
      WHERE client_id = ?
      ORDER BY created_at DESC
    `).all(userId);
    }
    res.json(cases);
});

router.post("/", (req, res) => {
    const { case_number, title, court, type, lawyer_id, client_name, client_email, fees, currency } = req.body;

    try {
        let client = db.prepare("SELECT * FROM users WHERE email = ?").get(client_email) as any;
        if (!client) {
            const result = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
                client_name, client_email, "123456", "client"
            );
            client = { id: result.lastInsertRowid };
        }

        const result = db.prepare(`
      INSERT INTO cases (case_number, title, court, type, lawyer_id, client_id, fees, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(case_number, title, court, type, lawyer_id, client.id, Number(fees) || 0, currency || 'ر.س');
        res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.get("/:id", (req, res) => {
    const caseData = db.prepare(`
    SELECT cases.*, u1.name as lawyer_name, u2.name as client_name, u2.email as client_email
    FROM cases 
    JOIN users u1 ON cases.lawyer_id = u1.id
    JOIN users u2 ON cases.client_id = u2.id
    WHERE cases.id = ?
  `).get(req.params.id) as any;

    if (!caseData) return res.status(404).json({ error: "Case not found" });

    const sessions = db.prepare("SELECT * FROM sessions WHERE case_id = ? ORDER BY session_date DESC").all(req.params.id);
    const messages = db.prepare(`
    SELECT messages.*, users.name as sender_name 
    FROM messages 
    JOIN users ON messages.sender_id = users.id 
    WHERE case_id = ? 
    ORDER BY created_at ASC
  `).all(req.params.id);
    const documents = db.prepare("SELECT * FROM documents WHERE case_id = ? ORDER BY created_at DESC").all(req.params.id);

    res.json({ ...caseData, sessions, messages, documents });
});

router.patch("/:id/fees", (req, res) => {
    const { fees, paid_amount, currency } = req.body;
    try {
        db.prepare("UPDATE cases SET fees = ?, paid_amount = ?, currency = ? WHERE id = ?").run(fees, paid_amount, currency, req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.delete("/:id", (req, res) => {
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

// Stats route included here for lawyer context
router.get("/stats/lawyer/:id", (req, res) => {
    const activeCases = db.prepare("SELECT count(*) as count FROM cases WHERE lawyer_id = ? AND status = 'active'").get(req.params.id) as any;
    const totalClients = db.prepare("SELECT count(DISTINCT client_id) as count FROM cases WHERE lawyer_id = ?").get(req.params.id) as any;
    const upcomingSessions = db.prepare(`
      SELECT count(*) as count FROM sessions 
      JOIN cases ON sessions.case_id = cases.id 
      WHERE cases.lawyer_id = ? AND session_date > datetime('now')
    `).get(req.params.id) as any;

    res.json({
        activeCases: activeCases.count,
        totalClients: totalClients.count,
        upcomingSessions: upcomingSessions.count
    });
});

export default router;
