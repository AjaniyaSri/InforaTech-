require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log("Starting Gemini test...");
  console.log("API Key found:", process.env.GEMINI_API_KEY ? "Yes (length: " + process.env.GEMINI_API_KEY.length + ")" : "No");

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log("Sending 'Hi' to Gemini...");
    const result = await model.generateContent("Hi");
    const response = await result.response;
    console.log("Response from Gemini:", response.text());
    console.log("Test PASSED!");
  } catch (err) {
    console.error("Test FAILED!");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    if (err.response) {
      console.error("Error Detail:", JSON.stringify(err.response, null, 2));
    }
  }
}

testGemini();
