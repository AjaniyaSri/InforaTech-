require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = await genAI.listModels();
    console.log("Available Gemini Models:");
    models.forEach(model => {
      console.log(`- ${model.name} (${model.supportedMethods.join(', ')})`);
    });
  } catch (err) {
    console.error("Failed to list models:", err.message);
  }
}

listModels();
