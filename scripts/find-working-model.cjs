// Test all available generation models
require("dotenv").config({ path: ".env.local" });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testAllModels() {
    console.log("Testing available generation models...\n");
    console.log("API Key:", process.env.GEMINI_API_KEY?.substring(0, 15) + "...\n");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try models that might have separate quotas
    const models = [
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash",
        "gemma-3-1b-it",
        "gemini-flash-latest",
    ];

    for (const modelName of models) {
        console.log(`Testing: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Rispondi solo: OK");
            console.log(`✅ ${modelName} WORKS! Response: ${result.response.text().substring(0, 50)}`);
            console.log(`\n>>> USE THIS MODEL: ${modelName} <<<\n`);
            return modelName; // Return first working model
        } catch (err) {
            if (err.message.includes("429")) {
                console.log(`❌ ${modelName} - Quota exceeded`);
            } else if (err.message.includes("404")) {
                console.log(`❌ ${modelName} - Not available`);
            } else {
                console.log(`❌ ${modelName} - ${err.message.substring(0, 50)}`);
            }
        }
    }
    console.log("\nNo working model found.");
}

testAllModels();
