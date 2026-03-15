import dotenv from "dotenv";
dotenv.config();

import express from "express";
console.log("Starting server...");
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import { db, initializeDb } from "./server/db";
import usersRoutes, { initializeLawyer } from "./server/routes/users";
import casesRoutes from "./server/routes/cases";
import sessionsRoutes from "./server/routes/sessions";
import documentsRoutes from "./server/routes/documents";
import aiRoutes from "./server/routes/ai";
import statsRoutes from "./server/routes/stats";
import searchRoutes from "./server/routes/search";
import clientsRoutes from "./server/routes/clients";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database
initializeDb();
await initializeLawyer();

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/sessions", sessionsRoutes);
app.use("/api/cases", casesRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api", usersRoutes);

// File Serving/Download Setup
app.get("/api/download/:filename", (req, res) => {
    const file = path.join(__dirname, "uploads", req.params.filename);
    res.download(file);
});

// File Preview Route
app.get("/api/view/:filename", (req, res) => {
    const file = path.join(__dirname, "uploads", req.params.filename);
    res.sendFile(file);
});

// Socket.IO Setup
io.on("connection", (socket) => {
    socket.on("join-case", (caseId) => {
        socket.join(`case_${caseId}`);
    });

    socket.on("send-message", (data) => {
        const { case_id, sender_id, content } = data;
        try {
            const result = db.prepare("INSERT INTO messages (case_id, sender_id, content) VALUES (?, ?, ?)").run(case_id, sender_id, content);

            const message = db.prepare(`
        SELECT messages.*, users.name as sender_name 
        FROM messages 
        JOIN users ON messages.sender_id = users.id 
        WHERE messages.id = ?
      `).get(result.lastInsertRowid);

            io.to(`case_${case_id}`).emit("new-message", message);
        } catch (e: any) {
            console.error(e);
        }
    });

    socket.on("disconnect", () => { });
});

// Vite Setup for Development
async function setupVite() {
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
    });
    app.use(vite.middlewares);
}

setupVite().then(() => {
    // SPA Fallback
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "index.html"));
    });

});

// Use 3000 if not specified
const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running!`);
    console.log(`- Local:   http://localhost:${PORT}`);
    console.log(`- Network: http://192.168.0.145:${PORT} (للوصول من الهاتف)`);
});
