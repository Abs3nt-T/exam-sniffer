// Pure CommonJS script to avoid ESM import order issues
require("dotenv").config({ path: ".env.local" });

const { Pool } = require("pg");

async function setupDatabase() {
    console.log("🔧 Setting up database...\n");
    console.log("Connection URL found:", !!process.env.POSTGRES_URL);
    console.log("URL starts with:", process.env.POSTGRES_URL?.substring(0, 30) + "...\n");

    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        // Test connection
        console.log("Testing connection...");
        await pool.query("SELECT 1");
        console.log("✅ Connected to database!\n");

        // Enable pgvector extension
        console.log("1. Enabling pgvector extension...");
        await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
        console.log("   ✅ pgvector enabled\n");

        // Create documents table
        console.log("2. Creating documents table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        total_chunks INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
        console.log("   ✅ documents table created\n");

        // Create chunks table with vector column
        console.log("3. Creating chunks table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS chunks (
        id SERIAL PRIMARY KEY,
        document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        page_number INTEGER,
        chunk_index INTEGER,
        embedding vector(768),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
        console.log("   ✅ chunks table created\n");

        console.log("🎉 Database setup complete!");
        console.log("\nNext step: Put your PDFs in the 'pdfs' folder and run 'npm run process-pdfs'");

    } catch (error) {
        console.error("❌ Error setting up database:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setupDatabase();
