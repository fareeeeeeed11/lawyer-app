import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";

const router = express.Router();

// Get all unique clients for a specific lawyer
router.get("/:lawyerId", (req, res) => {
    try {
        const clients = db.prepare(`
            SELECT u.id, u.name, u.email, u.phone,
            (SELECT COUNT(*) FROM cases WHERE client_id = u.id) as total_cases,
            (SELECT COUNT(*) FROM cases WHERE client_id = u.id AND status = 'active') as active_cases
            FROM users u
            WHERE u.role = 'client'
            ORDER BY u.name ASC
        `).all();

        res.json(clients);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Add a standalone client without a case
router.post("/", async (req, res) => {
    let { name, phone } = req.body;

    try {
        // Check if user exists
        const existing = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
        if (existing) {
            return res.status(400).json({ error: "العميل مسجل مسبقاً بهذا الرقم" });
        }

        const hashedPassword = await bcrypt.hash("123456", 10);
        const result = db.prepare(
            "INSERT INTO users (name, password, role, phone) VALUES (?, ?, ?, ?)"
        ).run(name, hashedPassword, "client", phone);

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Edit a client
router.put("/:id", (req, res) => {
    const { name, phone } = req.body;
    try {
        db.prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?").run(name, phone, req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Delete a client
router.delete("/:id", (req, res) => {
    try {
        // Check if client has cases
        const cases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE client_id = ?").get(req.params.id) as any;
        if (cases && cases.count > 0) {
            return res.status(400).json({ error: "لا يمكن حذف العميل لوجود قضايا مرتبطة به. يرجى حذف القضايا الخاصة به أولاً." });
        }

        db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

export default router;
