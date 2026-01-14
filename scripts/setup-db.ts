import { sql } from "@vercel/postgres";

async function setupDatabase() {
    console.log("🔧 Setting up database...\n");

    try {
        // Enable pgvector extension
        console.log("1. Enabling pgvector extension...");
        await sql`CREATE EXTENSION IF NOT EXISTS vector`;
        console.log("   ✅ pgvector enabled\n");

        // Create documents table
        console.log("2. Creating documents table...");
        await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        total_chunks INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
        console.log("   ✅ documents table created\n");

        // Create chunks table with vector column
        console.log("3. Creating chunks table...");
        await sql`
      CREATE TABLE IF NOT EXISTS chunks (
        id SERIAL PRIMARY KEY,
        document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        page_number INTEGER,
        chunk_index INTEGER,
        embedding vector(768),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
        console.log("   ✅ chunks table created\n");

        // Create index for vector similarity search
        console.log("4. Creating vector index...");
        await sql`
      CREATE INDEX IF NOT EXISTS chunks_embedding_idx 
      ON chunks USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `;
        console.log("   ✅ vector index created\n");

        console.log("🎉 Database setup complete!");
        console.log("\nNext step: Run 'npm run process-pdfs' to process your PDF files.");

    } catch (error) {
        console.error("❌ Error setting up database:", error);
        process.exit(1);
    }
}

setupDatabase();
