import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "../db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// File Upload Setup
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

router.post("/", upload.single("file"), (req, res) => {
    const { case_id, uploaded_by } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    try {
        const result = db.prepare(
            "INSERT INTO documents (case_id, file_name, file_path, uploaded_by) VALUES (?, ?, ?, ?)"
        ).run(case_id, file.originalname, file.filename, uploaded_by);

        res.json({
            id: result.lastInsertRowid,
            file_name: file.originalname,
            file_path: file.filename
        });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.get("/all/:userId", (req, res) => {
    try {
        const documents = db.prepare(`
            SELECT documents.*, cases.title as case_title, cases.case_number, users.name as uploader_name
            FROM documents
            JOIN cases ON documents.case_id = cases.id
            JOIN users ON documents.uploaded_by = users.id
            WHERE cases.lawyer_id = ?
            ORDER BY documents.created_at DESC
        `).all(req.params.userId);

        res.json(documents);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.delete("/:id", (req, res) => {
    try {
        // Option 1: First get the file_path to delete the actual file
        const doc = db.prepare("SELECT file_path FROM documents WHERE id = ?").get(req.params.id) as any;
        if (doc && doc.file_path) {
            const filePath = path.join(uploadDir, doc.file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

export default router;
