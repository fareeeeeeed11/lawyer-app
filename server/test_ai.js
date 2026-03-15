import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const run = async () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        console.log("Key available:", !!apiKey);
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Testing models
        const models = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];
        for (const m of models) {
            try {
                console.log("Testing model:", m);
                const model = genAI.getGenerativeModel({ model: m });
                const chat = model.startChat({
                    history: [
                        { role: "user", parts: [{ text: "Hello" }] },
                        { role: "model", parts: [{ text: "Hi" }] }
                    ]
                });
                const result = await chat.sendMessage("test");
                console.log(m, "SUCCESS:", result.response.text());
                return;
            } catch (e) {
                console.error(m, "FAILED:", e.message);
            }
        }
    } catch (e) {
        console.error("OVERALL FAILED:", e);
    }
};

run();
