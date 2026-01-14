import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Model for text generation
export const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp"
});

// Model for embeddings
export const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004"
});

/**
 * Extract text from an image using Gemini Vision
 */
export async function extractTextFromImage(base64Image: string): Promise<string> {
    const imagePart: Part = {
        inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.replace(/^data:image\/\w+;base64,/, ""),
        },
    };

    const result = await model.generateContent([
        "Estrai tutto il testo visibile in questa immagine. Se ci sono formule matematiche, trascrivile in formato LaTeX. Restituisci SOLO il testo estratto, senza commenti aggiuntivi.",
        imagePart,
    ]);

    return result.response.text();
}

/**
 * Generate embedding for a text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}

/**
 * Generate a solution based on context and query
 */
export async function generateSolution(query: string, context: string): Promise<string> {
    const prompt = `Sei un assistente esperto che aiuta studenti a risolvere esercizi d'esame.

CONTESTO DALLE DISPENSE:
${context}

DOMANDA/TRACCIA D'ESAME:
${query}

ISTRUZIONI:
1. Analizza la traccia d'esame fornita
2. Usa il contesto dalle dispense per trovare la soluzione
3. Se ci sono formule matematiche, usa il formato LaTeX (racchiudi le formule inline con $ e quelle display con $$)
4. Spiega i passaggi in modo chiaro
5. Se non trovi informazioni sufficienti nel contesto, dillo chiaramente

SOLUZIONE:`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}
