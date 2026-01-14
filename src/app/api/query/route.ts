import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage, generateEmbedding, generateSolution } from "@/lib/gemini";
import { searchSimilarChunks } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, image } = body;

        if (!text && !image) {
            return NextResponse.json(
                { error: "Devi fornire una traccia (testo o immagine)" },
                { status: 400 }
            );
        }

        // Step 1: Extract text from image if provided
        let queryText = text || "";
        if (image) {
            queryText = await extractTextFromImage(image);
        }

        if (!queryText.trim()) {
            return NextResponse.json(
                { error: "Non sono riuscito a leggere il testo dall'immagine" },
                { status: 400 }
            );
        }

        // Step 2: Generate embedding for the query
        const queryEmbedding = await generateEmbedding(queryText);

        // Step 3: Search for similar chunks in the database
        const relevantChunks = await searchSimilarChunks(queryEmbedding, 5);

        if (relevantChunks.length === 0) {
            return NextResponse.json(
                {
                    error: "Non ho trovato contenuti rilevanti nelle dispense. Assicurati di aver processato i PDF.",
                    queryText
                },
                { status: 404 }
            );
        }

        // Step 4: Build context from relevant chunks
        const context = relevantChunks
            .map((chunk, i) => `[Fonte ${i + 1}: ${chunk.filename}, pag. ${chunk.page_number || "N/A"}]\n${chunk.content}`)
            .join("\n\n---\n\n");

        // Step 5: Generate solution with Gemini
        const solution = await generateSolution(queryText, context);

        // Step 6: Return response with sources
        return NextResponse.json({
            success: true,
            queryText,
            solution,
            sources: relevantChunks.map((chunk) => ({
                filename: chunk.filename,
                page: chunk.page_number,
            })),
        });
    } catch (error) {
        console.error("Query error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : "";
        console.error("Error details:", { errorMessage, errorStack });
        return NextResponse.json(
            { error: "Si è verificato un errore. Riprova più tardi.", details: errorMessage },
            { status: 500 }
        );
    }
}
