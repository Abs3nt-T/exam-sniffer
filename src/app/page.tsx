"use client";

import { useState, useRef } from "react";

interface QueryResult {
    success: boolean;
    queryText: string;
    solution: string;
    sources: Array<{ filename: string; page: number | null }>;
}

export default function Home() {
    const [text, setText] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<QueryResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!text.trim() && !image) {
            setError("Inserisci una traccia o scatta una foto");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text.trim() || undefined, image }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Errore sconosciuto");
                return;
            }

            setResult(data);
        } catch {
            setError("Errore di connessione. Controlla la tua rete.");
        } finally {
            setLoading(false);
        }
    };

    const clearAll = () => {
        setText("");
        setImage(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
            {/* Header */}
            <header style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h1 style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginBottom: "0.5rem"
                }}>
                    📚 Exam Sniffer
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                    Trova soluzioni d&apos;esame dalle tue dispense
                </p>
            </header>

            {/* Input Card */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
                {/* Camera Button */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    style={{ display: "none" }}
                    id="camera-input"
                />
                <label
                    htmlFor="camera-input"
                    className="btn btn-secondary"
                    style={{
                        width: "100%",
                        marginBottom: "1rem",
                        cursor: "pointer"
                    }}
                >
                    📷 Scatta Foto della Traccia
                </label>

                {/* Image Preview */}
                {image && (
                    <div style={{ marginBottom: "1rem", position: "relative" }}>
                        <img
                            src={image}
                            alt="Preview traccia"
                            className="camera-preview"
                            style={{ width: "100%", borderRadius: "12px" }}
                        />
                        <button
                            onClick={() => {
                                setImage(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                background: "rgba(0,0,0,0.7)",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "32px",
                                height: "32px",
                                fontSize: "1.2rem",
                                cursor: "pointer"
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Divider */}
                <div style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    margin: "1rem 0",
                    fontSize: "0.875rem"
                }}>
                    oppure scrivi la traccia
                </div>

                {/* Text Input */}
                <textarea
                    className="textarea"
                    placeholder="Incolla o scrivi qui la traccia d'esame..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                />

                {/* Submit Button */}
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={loading || (!text.trim() && !image)}
                    style={{ width: "100%", marginTop: "1rem" }}
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Cerco la soluzione...
                        </>
                    ) : (
                        "🔍 Trova Soluzione"
                    )}
                </button>

                {/* Clear Button */}
                {(text || image || result) && !loading && (
                    <button
                        className="btn btn-secondary"
                        onClick={clearAll}
                        style={{ width: "100%", marginTop: "0.75rem" }}
                    >
                        🗑️ Cancella tutto
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid var(--error)",
                    borderRadius: "12px",
                    padding: "1rem",
                    color: "var(--error)",
                    marginBottom: "1rem"
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="result-card">
                    <h3>✅ Soluzione Trovata</h3>

                    {/* Query Text */}
                    {result.queryText && (
                        <div style={{
                            marginBottom: "1rem",
                            padding: "0.75rem",
                            background: "var(--bg-input)",
                            borderRadius: "8px",
                            fontSize: "0.9rem"
                        }}>
                            <strong>Traccia riconosciuta:</strong>
                            <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)" }}>
                                {result.queryText}
                            </p>
                        </div>
                    )}

                    {/* Solution */}
                    <div className="result-content">
                        {result.solution}
                    </div>

                    {/* Sources */}
                    {result.sources && result.sources.length > 0 && (
                        <div className="result-sources">
                            <strong>📖 Fonti:</strong>
                            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
                                {result.sources.map((source, i) => (
                                    <li key={i}>
                                        {source.filename}
                                        {source.page && ` (pag. ${source.page})`}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
