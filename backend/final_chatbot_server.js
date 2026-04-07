require('dotenv').config();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const logPath = path.join(__dirname, 'error.log');

app.use(cors());
app.use(express.json());

console.log("✨ V2.2 - SUPER SMART CHATBOT SERVER STARTING... ✨");

// Check API Key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models list (prio high-quota 8b model)
const MODEL_NAMES = [
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "models/gemini-pro"
];


// 🔥 NEW: Retry Logic Function
async function generateResponse(model, message, retries = 2) {
  try {
    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();

  } catch (error) {
    const errStatus = error.status || (error.response ? error.response.status : null);

    // Handle rate limit (429)
    if ((errStatus === 429 || error.message?.includes("429")) && retries > 0) {
      console.log("⚠️ Rate limit hit, retrying in 2s...");
      await new Promise(res => setTimeout(res, 2000));
      return generateResponse(model, message, retries - 1);
    }

    throw error;
  }
}


// 🏠 ROOT ROUTE (To prevent "Cannot GET /")
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white; height: 100vh;">
      <h1 style="color: #38bdf8;">🚀 Chatbot API is Running!</h1>
      <p>To use the chat interface, please visit the <b>Frontend Port</b>:</p>
      <a href="http://localhost:5173" style="color: #4ade80; font-size: 1.2rem; text-decoration: none; border: 1px solid #4ade80; padding: 10px 20px; border-radius: 8px;">Go to http://localhost:5173</a>
      <p style="margin-top: 20px; color: #64748b;">(API Endpoint: /api/chat [POST])</p>
    </div>
  `);
});


// 🚀 MAIN CHAT ROUTE
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  console.log("\n--- New Chat Request ---");
  console.log("User:", message);

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    let responseText = null;
    let lastError = null;

    // 🔁 Try multiple models
    for (const modelName of MODEL_NAMES) {
      try {
        console.log(`Trying model: ${modelName}`);

        const model = genAI.getGenerativeModel({ model: modelName });

        responseText = await generateResponse(model, message);

        console.log(`✅ Success with ${modelName}`);
        break;

      } catch (err) {
        lastError = err;
        const errStatus = err.status || (err.response ? err.response.status : null);

        // Stop if rate limit (handled already)
        if (errStatus === 429) {
          throw err;
        }

        console.log(`❌ ${modelName} failed, trying next...`);
        await new Promise(res => setTimeout(res, 1000));
      }
    }

    if (!responseText) throw lastError;

    res.json({ responseText });

  } catch (error) {
    console.error("❌ FINAL ERROR:", error.message);

    const errStatus = error.status || (error.response ? error.response.status : null);

    // 🧠 Friendly message for rate limit or quota issues
    if (errStatus === 429 || error.message?.includes("429") || error.message?.includes("quota")) {
      const isLimitZero = error.message?.includes("limit: 0");
      return res.status(429).json({
        responseText: isLimitZero 
          ? "🚫 **API Quota Issue**: Your current API key has a limit of 0. Please create a **NEW API KEY** at aistudio.google.com and update your .env file."
          : "⏳ Too many requests. Please wait a few seconds and try again."
      });
    }

    // Log error
    fs.appendFileSync(
      logPath,
      `[${new Date().toISOString()}]\n${error.stack || error}\n\n`
    );

    res.status(500).json({
      responseText: "⚠️ Something went wrong. Please try again later."
    });
  }
});


// 🚀 START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});