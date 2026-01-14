// Pure CommonJS script for processing PDFs
require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pool } = require("pg");

// Configuration
const PDF_DIR = path.join(process.cwd(), "pdfs");
const CHUNK_SIZE = 700; // tokens (roughly)
const CHUNK_OVERLAP = 100;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Initialize Postgres
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
});

/**
 * Extract text from a PDF file
 */
async function extractTextFromPDF(filePath) {
    const buffer = fs.readFileSync(filePath);

    try {
        // Try normal text extraction first
        const data = await pdf(buffer);

        // Check if we got meaningful text
        if (data.text.trim().length > 100) {
            console.log(`   📄 Extracted text directly (${data.numpages} pages)`);
            return { text: data.text, numPages: data.numpages };
        }

        // If not much text, likely a scanned PDF - use OCR
        console.log(`   🔍 PDF appears to be scanned, using Gemini Vision OCR...`);
        return await extractWithOCR(buffer);

    } catch (err) {
        console.log(`   🔍 Falling back to Gemini Vision OCR...`);
        return await extractWithOCR(buffer);
    }
}

/**
 * Use Gemini Vision to OCR a PDF
 */
async function extractWithOCR(pdfBuffer) {
    const base64 = pdfBuffer.toString("base64");

    const result = await visionModel.generateContent([
        {
            inlineData: {
                mimeType: "application/pdf",
                data: base64,
            },
        },
        "Estrai TUTTO il testo da questo PDF. Se ci sono formule matematiche, trascrivile in formato LaTeX. Mantieni la struttura del documento (titoli, paragrafi, liste). Restituisci SOLO il testo estratto.",
    ]);

    const text = result.response.text();
    // Estimate pages based on text length
    const estimatedPages = Math.ceil(text.length / 3000);

    return { text, numPages: estimatedPages };
}

/**
 * Split text into overlapping chunks
 */
function splitIntoChunks(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);

    let currentChunk = "";
    let currentLength = 0;

    for (const sentence of sentences) {
        const sentenceLength = sentence.split(/\s+/).length; // Rough token count

        if (currentLength + sentenceLength > chunkSize && currentChunk) {
            chunks.push(currentChunk.trim());

            // Keep overlap
            const words = currentChunk.split(/\s+/);
            currentChunk = words.slice(-overlap).join(" ") + " " + sentence;
            currentLength = overlap + sentenceLength;
        } else {
            currentChunk += " " + sentence;
            currentLength += sentenceLength;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text) {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}

/**
 * Process a single PDF file
 */
async function processPDF(filePath) {
    const filename = path.basename(filePath);
    console.log(`\n📚 Processing: ${filename}`);

    // Extract text
    const { text, numPages } = await extractTextFromPDF(filePath);
    console.log(`   📝 Extracted ${text.length} characters from ${numPages} pages`);

    // Split into chunks
    const chunks = splitIntoChunks(text);
    console.log(`   🔪 Split into ${chunks.length} chunks`);

    // Insert document record
    const docResult = await pool.query(
        "INSERT INTO documents (filename, total_chunks) VALUES ($1, $2) RETURNING id",
        [filename, chunks.length]
    );
    const documentId = docResult.rows[0].id;

    // Process each chunk
    console.log(`   ⏳ Generating embeddings and inserting...`);
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Generate embedding
        const embedding = await generateEmbedding(chunk);
        const embeddingStr = `[${embedding.join(",")}]`;

        // Estimate page number
        const pageNumber = Math.ceil((i / chunks.length) * numPages);

        // Insert chunk
        await pool.query(
            "INSERT INTO chunks (document_id, content, page_number, chunk_index, embedding) VALUES ($1, $2, $3, $4, $5::vector)",
            [documentId, chunk, pageNumber, i, embeddingStr]
        );

        // Progress indicator
        if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
            process.stdout.write(`\r   ✅ Processed ${i + 1}/${chunks.length} chunks`);
        }

        // Rate limiting - Gemini has limits
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n   🎉 ${filename} complete!`);
}

/**
 * Main function
 */
async function main() {
    console.log("🚀 PDF Processing Script");
    console.log("========================\n");

    // Check if pdfs directory exists
    if (!fs.existsSync(PDF_DIR)) {
        console.log(`📁 Creating pdfs directory at: ${PDF_DIR}`);
        fs.mkdirSync(PDF_DIR, { recursive: true });
        console.log("\n⚠️  No PDF files found!");
        console.log("   Put your PDF files in the 'pdfs' folder and run this script again.");
        process.exit(0);
    }

    // Find all PDF files
    const pdfFiles = fs.readdirSync(PDF_DIR)
        .filter(f => f.toLowerCase().endsWith(".pdf"))
        .map(f => path.join(PDF_DIR, f));

    if (pdfFiles.length === 0) {
        console.log("⚠️  No PDF files found in the 'pdfs' folder!");
        console.log("   Put your PDF files there and run this script again.");
        process.exit(0);
    }

    console.log(`📚 Found ${pdfFiles.length} PDF files to process:\n`);
    pdfFiles.forEach(f => console.log(`   - ${path.basename(f)}`));

    // Process each PDF
    const startTime = Date.now();

    for (const pdfFile of pdfFiles) {
        try {
            await processPDF(pdfFile);
        } catch (err) {
            console.error(`\n❌ Error processing ${path.basename(pdfFile)}:`, err.message);
            console.log("   Continuing with next file...\n");
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n\n=============================");
    console.log("🎉 All PDFs processed!");
    console.log(`⏱️  Total time: ${elapsed} seconds`);
    console.log("=============================\n");
    console.log("Next step: Deploy to Vercel and test your app!");

    await pool.end();
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
