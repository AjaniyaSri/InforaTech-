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
  console.log("Found key starting with:", process.env.GEMINI_API_KEY.substring(0, 5), "... and ending with:", process.env.GEMINI_API_KEY.substring(process.env.GEMINI_API_KEY.length - 4));
} else {
  console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables!");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Check if API key is provided
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_actual_api_key_here') {
    return res.json({ responseText: "I'm ready for real AI! Please add your Gemini API key to the .env file in the backend folder to enable smart responses." });
  }

  try {
    console.log("Receiving message:", message);
    const result = await model.generateContent(message);
    const response = await result.response;
    
    // Check if the response was blocked
    if (response.promptFeedback && response.promptFeedback.blockReason) {
      return res.json({ responseText: `The message was blocked due to safety reasons: ${response.promptFeedback.blockReason}` });
    }

    const responseText = response.text();
    console.log("Gemini response success");

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
});
