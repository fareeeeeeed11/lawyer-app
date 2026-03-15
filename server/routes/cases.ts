import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get("/", (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
    }
    const cases = db.prepare(`
      SELECT cases.*, users.name as client_name 
      FROM cases 
      JOIN users ON cases.client_id = users.id 
      WHERE lawyer_id = ?
      ORDER BY created_at DESC
    `).all(userId);
    res.json(cases);
});

router.post("/", (req, res) => {
    const { case_number, title, court, type, lawyer_id, client_id, client_name, client_phone, fees, currency } = req.body;

    try {
        let finalClientId = client_id;
        const safePhone = client_phone?.trim() || "";
        const safeName = client_name?.trim() || "";

        if (!finalClientId) {
            let existingClient = null;
            if (safePhone) {
                existingClient = db.prepare("SELECT * FROM users WHERE phone = ? AND role = 'client'").get(safePhone) as any;
            }
            if (!existingClient && safeName) {
                existingClient = db.prepare("SELECT * FROM users WHERE name = ? AND role = 'client'").get(safeName) as any;
            }

            if (existingClient) {
                finalClientId = existingClient.id;
                if (safePhone && existingClient.phone !== safePhone) {
                    db.prepare("UPDATE users SET phone = ? WHERE id = ?").run(safePhone, finalClientId);
                }
            } else {
                const result = db.prepare("INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)").run(
                    safeName, safePhone, "123456", "client"
                );
                finalClientId = result.lastInsertRowid;
            }
        }

        const result = db.prepare(`
      INSERT INTO cases (case_number, title, court, type, lawyer_id, client_id, fees, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(case_number, title, court, type, lawyer_id, finalClientId, Number(fees) || 0, currency || 'ر.س');
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

router.patch("/:id", (req, res) => {
    const { title, status, type } = req.body;
    try {
        db.prepare("UPDATE cases SET title = ?, status = ?, type = ? WHERE id = ?").run(title, status, type, req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
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
