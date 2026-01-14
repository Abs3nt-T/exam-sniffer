import { Pool } from "pg";

// Create a connection pool
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
});

export interface Chunk {
    id: number;
    document_id: number;
    content: string;
    page_number: number | null;
    chunk_index: number;
    filename?: string;
}

/**
 * Search for similar chunks using vector similarity
 */
export async function searchSimilarChunks(
    embedding: number[],
    limit: number = 5
): Promise<Chunk[]> {
    const embeddingStr = `[${embedding.join(",")}]`;

    const result = await pool.query<Chunk>(
        `SELECT 
            c.id,
            c.document_id,
            c.content,
            c.page_number,
            c.chunk_index,
            d.filename
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
        ORDER BY c.embedding <=> $1::vector
        LIMIT $2`,
        [embeddingStr, limit]
    );

    return result.rows;
}

/**
 * Insert a new document record
 */
export async function insertDocument(filename: string, totalChunks: number): Promise<number> {
    const result = await pool.query(
        `INSERT INTO documents (filename, total_chunks)
        VALUES ($1, $2)
        RETURNING id`,
        [filename, totalChunks]
    );
    return result.rows[0].id;
}

/**
 * Insert a chunk with its embedding
 */
export async function insertChunk(
    documentId: number,
    content: string,
    pageNumber: number | null,
    chunkIndex: number,
    embedding: number[]
): Promise<void> {
    const embeddingStr = `[${embedding.join(",")}]`;

    await pool.query(
        `INSERT INTO chunks (document_id, content, page_number, chunk_index, embedding)
        VALUES ($1, $2, $3, $4, $5::vector)`,
        [documentId, content, pageNumber, chunkIndex, embeddingStr]
    );
}

/**
 * Check if database is connected and tables exist
 */
export async function checkDatabase(): Promise<boolean> {
    try {
        await pool.query("SELECT 1 FROM documents LIMIT 1");
        return true;
    } catch {
        return false;
    }
}

/**
 * Get document count
 */
export async function getDocumentCount(): Promise<number> {
    const result = await pool.query("SELECT COUNT(*) as count FROM documents");
    return parseInt(result.rows[0].count);
}

/**
 * Get chunk count
 */
export async function getChunkCount(): Promise<number> {
    const result = await pool.query("SELECT COUNT(*) as count FROM chunks");
    return parseInt(result.rows[0].count);
}
