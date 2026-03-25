const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// 🧠 AI BRIEFING FUNCTION
async function getAIBriefing(topic, headlines, userLanguage, userType) {
    try {
        const prompt = `
You are an AI News Navigator for ET.

User Type: ${userType}
Language: ${userLanguage}
Topic: ${topic}

News Headlines:
${headlines.join("\n")}

Generate output in ${userLanguage} in STRICT format:

🧠 সারসংক্ষেপ / Summary:
- Key points

📊 প্রভাব / Impact:
- Users
- Market
- Economy
- India (IMPORTANT: Always add India-specific impact)

🧭 ভবিষ্যৎ / What Next:
- Future prediction

💡 সহজ ব্যাখ্যা / Simple Explanation:
- Explain for ${userType}

🧩 গল্পের ধারা / Story Arc:
- Past → Present → Future

IMPORTANT:
- MUST include India-specific context (very important)
- Keep language natural (not translation)
- Adapt tone for ${userType}
`;

        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile"
        });

        return response.choices[0].message.content;

    } catch (err) {
        console.error("AI Error:", err.message);
        return "AI Briefing unavailable.";
    }
}

// 📰 NEWS API
app.get("/news/:topic/:lang/:type", async (req, res) => {
    const { topic, lang, type } = req.params;

    try {
        const url = `https://newsapi.org/v2/everything?q=${topic}&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`;

        const newsRes = await axios.get(url);

        const headlines = newsRes.data.articles
            .slice(0, 5)
            .map(a => a.title);

        const briefing = await getAIBriefing(topic, headlines, lang, type);

        res.json({
            topic: topic.toUpperCase(),
            language: lang,
            userType: type,
            briefing,
            sources: headlines
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to fetch news" });
    }
});

// 💬 CHAT API
app.post("/chat", async (req, res) => {
    const { query, context } = req.body;

    try {
        const prompt = `
Context:
${context}

User Question:
${query}

Answer clearly in simple language.
`;

        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile"
        });

        res.json({
            reply: response.choices[0].message.content
        });

    } catch (err) {
        res.status(500).json({ error: "Chat failed" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});