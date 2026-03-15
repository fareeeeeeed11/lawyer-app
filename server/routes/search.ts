import express from 'express';
import { db } from '../db';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const router = express.Router();

router.get("/", (req, res) => {
    const { q, userId } = req.query;

    if (!q || !userId) {
        return res.json({ clients: [], cases: [] });
    }

    try {
        const searchTerm = `%${q}%`;

        // Search Cases
        const cases = db.prepare(`
            SELECT id, title, case_number, status, created_at 
            FROM cases
            WHERE lawyer_id = ? 
            AND (title LIKE ? OR case_number LIKE ?)
            LIMIT 5
        `).all(userId, searchTerm, searchTerm) as any[];

        // Search Clients
        const clients = db.prepare(`
            SELECT DISTINCT u.id, u.name, u.phone 
            FROM users u
            JOIN cases c ON u.id = c.client_id
            WHERE c.lawyer_id = ? 
            AND (u.name LIKE ? OR u.phone LIKE ?)
            LIMIT 5
        `).all(userId, searchTerm, searchTerm) as any[];

        res.json({
            cases: cases.map(c => ({
                ...c,
                type: 'case',
                date: format(new Date(c.created_at), 'dd MMM yyyy', { locale: ar })
            })),
            clients: clients.map(c => ({ ...c, type: 'client' }))
        });

    } catch (e: any) {
        console.error("Search Error:", e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
