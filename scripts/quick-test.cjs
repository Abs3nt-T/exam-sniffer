// Quick test of gemini-2.0-flash with new API key
require("dotenv").config({ path: ".env.local" });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    console.log("Testing gemini-2.0-flash...");
    console.log("API Key:", process.env.GEMINI_API_KEY?.substring(0, 15) + "...");

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        console.log("\nSending request...");
        const result = await model.generateContent("Rispondi solo: OK");
        console.log("✅ SUCCESS! Response:", result.response.text());
    } catch (err) {
        console.log("❌ ERROR:", err.message);
    }
}

test();
