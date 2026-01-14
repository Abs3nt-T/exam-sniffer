// Test script to debug API issues
require("dotenv").config({ path: ".env.local" });

async function test() {
    console.log("Testing API...\n");

    // Test 1: Check env vars
    console.log("1. Environment Variables:");
    console.log("   GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✅ Set (" + process.env.GEMINI_API_KEY.substring(0, 10) + "...)" : "❌ Missing");
    console.log("   POSTGRES_URL:", process.env.POSTGRES_URL ? "✅ Set" : "❌ Missing");

    // Test 2: Test Gemini
    console.log("\n2. Testing Gemini API...");
    try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent("test");
        console.log("   ✅ Gemini embedding works! Dimensions:", result.embedding.values.length);
    } catch (err) {
        console.log("   ❌ Gemini error:", err.message);
    }

    // Test 3: Test Database
    console.log("\n3. Testing Database...");
    try {
        const { Pool } = require("pg");
        const pool = new Pool({
            connectionString: process.env.POSTGRES_URL,
            ssl: { rejectUnauthorized: false },
        });
        const result = await pool.query("SELECT COUNT(*) as count FROM chunks");
        console.log("   ✅ Database works! Chunks count:", result.rows[0].count);
        await pool.end();
    } catch (err) {
        console.log("   ❌ Database error:", err.message);
    }

    console.log("\n✅ Test complete!");
}

test();
