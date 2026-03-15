import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';

const router = express.Router();

router.post("/recover", async (req, res) => {
    const { phone, dob } = req.body;

    // We hardcode the lawyer validation per the user's specific request
    if (phone === "777400733" && dob === "19791979mm") {
        res.json({
            email: "mohammedalkamel@gmail.com",
            password: "alkamel19791979"
        });
    } else {
        res.status(401).json({ error: "البيانات غير صحيحة" });
    }
});

router.post("/login", async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ error: "الرجاء إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور" });
    }

    try {
        const user = db.prepare("SELECT * FROM users WHERE (email = ? OR phone = ?) AND role = 'lawyer'").get(identifier, identifier) as any;

        if (user && await bcrypt.compare(password, user.password || "")) {
            const { password: _, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post("/register", async (req, res) => {
    const { name, email, password, phone } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = db.prepare(
            "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)"
        ).run(name, email, hashedPassword, 'lawyer', phone);

        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as any;
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (e: any) {
        res.status(400).json({ error: "البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً" });
    }
});

router.get("/clients", (req, res) => {
    try {
        const clients = db.prepare("SELECT id, name, email, phone, role FROM users WHERE role = 'client' ORDER BY id DESC").all();
        res.json(clients);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post("/clients", async (req, res) => {
    const { name, email, phone } = req.body;
    try {
        const password = await bcrypt.hash("123456", 10);
        const result = db.prepare(
            "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)"
        ).run(name, email, password, 'client', phone);
        res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.patch("/clients/:id", (req, res) => {
    const { name, email, phone } = req.body;
    try {
        db.prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?").run(name, email, phone, req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});


// Seed Lawyer if not exists
export const initializeLawyer = async () => {
    const lawyer = db.prepare("SELECT * FROM users WHERE role = 'lawyer'").get();
    if (!lawyer) {
        const hashedPassword = await bcrypt.hash("alkamel19791979", 10);
        db.prepare("INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)").run(
            "محمد أحمد الكامل",
            "mohammedalkamel@gmail.com",
            hashedPassword,
            "lawyer",
            "777400733"
        );
    }
}

export default router;
