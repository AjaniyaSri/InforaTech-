require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const modelsToTest = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-1.0-pro"
];

async function findWorkingModel() {
  console.log("--- Gemini Model Discovery ---");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("test");
      const response = await result.response;
      if (response.text()) {
        console.log(`✅ SUCCESS: '${modelName}' is working!`);
        console.log("--- CONFIGURATION FOUND ---");
        return;
      }
    } catch (err) {
      console.log(`❌ FAILED: '${modelName}' (${err.status || 'Error'}: ${err.message.substring(0, 50)}...)`);
    }
  }
  console.log("--- NO WORKING MODELS FOUND ---");
  console.log("Tip: Ensure your API key is active in Google AI Studio and check your region's availability.");
}

findWorkingModel();
