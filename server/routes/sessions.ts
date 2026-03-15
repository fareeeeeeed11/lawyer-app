import express from "express";
import { db } from "../db";

const router = express.Router();

router.post("/", (req, res) => {
    const { case_id, session_date, notes } = req.body;
    const result = db.prepare("INSERT INTO sessions (case_id, session_date, notes) VALUES (?, ?, ?)").run(case_id, session_date, notes);
    res.json({ id: result.lastInsertRowid });
});

router.get("/upcoming/:lawyerId", (req, res) => {
    try {
        const sessions = db.prepare(`
            SELECT sessions.*, cases.title as case_title, cases.case_number
            FROM sessions
            JOIN cases ON sessions.case_id = cases.id
            WHERE cases.lawyer_id = ? AND sessions.session_date > DATETIME('now', '-1 hour', 'localtime')
            ORDER BY sessions.session_date ASC
        `).all(req.params.lawyerId);
        res.json(sessions);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.get("/all/:userId", (req, res) => {
    try {
        const sessions = db.prepare(`
            SELECT sessions.*, cases.title as case_title, cases.case_number 
            FROM sessions 
            JOIN cases ON sessions.case_id = cases.id 
            WHERE cases.lawyer_id = ?
            ORDER BY sessions.session_date ASC
        `).all(req.params.userId);

        res.json(sessions);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.patch("/:id", (req, res) => {
    const { session_date, notes } = req.body;
    try {
        db.prepare("UPDATE sessions SET session_date = ?, notes = ? WHERE id = ?").run(session_date, notes, req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.delete("/:id", (req, res) => {
    try {
        db.prepare("DELETE FROM sessions WHERE id = ?").run(req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

export default router;
