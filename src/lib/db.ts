import { sql } from "@vercel/postgres";

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

    const result = await sql<Chunk>`
    SELECT 
      c.id,
      c.document_id,
      c.content,
      c.page_number,
      c.chunk_index,
      d.filename
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    ORDER BY c.embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;

    return result.rows;
}

/**
 * Insert a new document record
 */
export async function insertDocument(filename: string, totalChunks: number): Promise<number> {
    const result = await sql`
    INSERT INTO documents (filename, total_chunks)
    VALUES (${filename}, ${totalChunks})
    RETURNING id
  `;
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

    await sql`
    INSERT INTO chunks (document_id, content, page_number, chunk_index, embedding)
    VALUES (${documentId}, ${content}, ${pageNumber}, ${chunkIndex}, ${embeddingStr}::vector)
  `;
}

/**
 * Check if database is connected and tables exist
 */
export async function checkDatabase(): Promise<boolean> {
    try {
        await sql`SELECT 1 FROM documents LIMIT 1`;
        return true;
    } catch {
        return false;
    }
}

/**
 * Get document count
 */
export async function getDocumentCount(): Promise<number> {
    const result = await sql`SELECT COUNT(*) as count FROM documents`;
    return parseInt(result.rows[0].count);
}

/**
 * Get chunk count
 */
export async function getChunkCount(): Promise<number> {
    const result = await sql`SELECT COUNT(*) as count FROM chunks`;
    return parseInt(result.rows[0].count);
}
