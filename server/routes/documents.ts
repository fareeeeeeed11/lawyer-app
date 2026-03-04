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
const uploadDir = path.join(__dirname, "../../../uploads");
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

export default router;
