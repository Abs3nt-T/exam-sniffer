// List available Gemini models
require("dotenv").config({ path: ".env.local" });

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    console.log("Listing available Gemini models...\n");

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key:", apiKey ? apiKey.substring(0, 15) + "..." : "Missing");

    try {
        // The SDK doesn't have listModels, so we'll use fetch directly
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();

        if (data.error) {
            console.log("Error:", data.error.message);
            return;
        }

        console.log("\nAvailable models for text generation:\n");
        for (const model of data.models) {
            if (model.supportedGenerationMethods.includes("generateContent")) {
                console.log(`  - ${model.name} (${model.displayName})`);
            }
        }
    } catch (err) {
        console.log("Error:", err.message);
    }
}

listModels();
