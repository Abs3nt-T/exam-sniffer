// Direct test of Gemini text generation
require("dotenv").config({ path: ".env.local" });

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGeneration() {
    console.log("Testing Gemini Text Generation...\n");

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key:", apiKey ? apiKey.substring(0, 15) + "..." : "Missing");

    const genAI = new GoogleGenerativeAI(apiKey);

    // Test different models
    const models = [
        "gemini-pro",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.0-pro"
    ];

    for (const modelName of models) {
        console.log(`\n--- Testing model: ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Rispondi con una sola parola: Ciao");
            const text = result.response.text();
            console.log(`✅ ${modelName} works! Response: ${text.substring(0, 50)}`);
            break; // Found a working model
        } catch (err) {
            console.log(`❌ ${modelName} failed: ${err.message}`);
        }
    }
}

testGeneration();
