import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../db";

const router = express.Router();

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: VITE_GEMINI_API_KEY is missing from environment variables.");
    throw new Error("API Key configuration error");
  }
  return new GoogleGenerativeAI(apiKey);
};

const SYSTEM_INSTRUCTIONS = `
أنت "المستشار القانوني الخاص"، خبير محامي رقمي محترف ومتخصص حصراً في الأنظمة والقوانين.
قواعد صارمة جداً لعملك (يجب الالتزام بها):
1. التخصص القانوني المطلق: أجب فقط وفقط على الأسئلة المتعلقة بالقوانين، الأنظمة، الإجراءات القضائية، أو تفاصيل القضية الحالية.
2. الرفض الصارم: إذا سألك المستخدم عن أي شيء خارج نطاق القانون (على سبيل المثال لا الحصر: الطبخ، الرياضة، البرمجة، الأحداث العامة، النصائح الشخصية غير القانونية، إلخ)، يجب أن تعتذر بأسلوب مهذب وحازم قائلاً: "أعتذر منك، أنا مستشار قانوني متخصص في تحليل القضايا والأنظمة فقط. لا يمكنني تقديم المساعدة أو الإجابة على مواضيع خارج هذا التخصص."
3. لا تخرج عن النص: لا تحاول الإجابة على أسئلة عامة حتى لو كانت بسيطة إذا لم تكن ذات صبغة قانونية واضحة.
4. الدقة والمصادر: حاول دائماً ذكر نصوص مواد قانونية أو إجراءات قضائية متبعة لتعزيز مصداقية ردك.
5. الأسلوب: كن مهنياً، واضحاً، ومفيداً جداً للمحامي.
`;

router.post("/chat", async (req, res) => {
  const { caseId, message, history } = req.body;
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const genAI = getAIClient();
      const model = genAI.getGenerativeModel({ model: modelName });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{
              text: `${SYSTEM_INSTRUCTIONS}
أنت الآن في وضع الدردشة القانونية حول القضية رقم: ${caseId}.
تذكر: لا تجب على أي سؤال خارج الإطار القانوني مهما كان.` }],
          },
          {
            role: "model",
            parts: [{ text: "أهلاً بك يا سعادة المحامي. أنا مستشارك القانوني الرقمي، جاهز تماماً لتحليل هذه القضية قانونياً. كيف يمكنني مساعدتك؟" }],
          },
          ...(history || [])
        ],
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return res.json({ text: response.text() });
    } catch (err: any) {
      console.error(`FAILED with model ${modelName}:`, err.message);
      lastError = err;
    }
  }

  console.error("ALL MODELS FAILED:", lastError);
  res.status(500).json({
    error: "تعذر الحصول على رد من المستشار حالياً. يرجى التأكد من مفتاح API في ملف .env أو المحاولة لاحقاً.",
    details: lastError?.message
  });
});

export default router;
