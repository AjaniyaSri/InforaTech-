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

// Initialize Gemini API
console.log("Checking API Key setup...");
if (process.env.GEMINI_API_KEY) {
  const key = process.env.GEMINI_API_KEY;
  console.log("Found key starting with:", key.substring(0, 6));
} else {
  console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Expanded list of models to try
const MODEL_NAMES = [
  "gemini-2.0-flash",
  "models/gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "models/gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-pro"
];

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  console.log("--- New Chat Request ---");
  console.log("Message:", message);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Check if API key is provided
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_actual_api_key_here') {
    return res.json({ responseText: "I'm ready for real AI! Please add your Gemini API key to the .env file in the backend folder to enable smart responses." });
  }

  try {
    let result = null;
    let lastError = null;

    // Smart Failover Logic: Try multiple models until one works
    for (const modelName of MODEL_NAMES) {
      try {
        console.log(`Attempting Gemini with model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(message);
        console.log(`✅ SUCCESS with model: ${modelName}`);
        break;
      } catch (err) {
        lastError = err;
        const errMsg = err.message || "";
        const errStatus = err.status || (err.response ? err.response.status : null);
        
        // If it's a 404 (Not Found), try the next model string
        if (errStatus === 404 || errMsg.includes("404") || errMsg.includes("not found")) {
          console.log(`❌ Model ${modelName} not found (404), trying next...`);
          continue;
        }
        // If it's a different error, log it and keep trying just in case
        console.log(`⚠️ Model ${modelName} failed with error: ${errMsg.substring(0, 50)}...`);
      }
    }

    if (!result) throw lastError;

    const response = await result.response;
    
    // Check if the response was blocked
    if (response.promptFeedback && response.promptFeedback.blockReason) {
      const reason = response.promptFeedback.blockReason;
      console.warn("Gemini blocked response:", reason);
      return res.json({ responseText: `The message was blocked due to safety reasons: ${reason}` });
    }

    const responseText = response.text();
    res.json({ responseText });

  } catch (error) {
    console.error('--- GEMINI API ERROR ---');
    console.error(error);
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] GEMINI API ERROR:\n${error.stack || error}\n\n`);
    res.status(500).json({ error: "Failed to fetch response from AI." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Ready for requests!`);
});
