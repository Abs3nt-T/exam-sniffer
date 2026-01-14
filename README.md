# Exam Sniffer 📚

Uno strumento AI per trovare soluzioni d'esame dalle tue dispense.

## Come Funziona

1. **Pre-processing** (una volta): Processi i tuoi PDF sul PC, i dati vanno nel database cloud
2. **Uso quotidiano**: Da telefono, scatti foto della traccia e l'AI trova la soluzione

## Setup Iniziale

### 1. Prerequisiti
- Node.js 18+
- Account [Vercel](https://vercel.com) (gratuito)
- API Key [Google AI Studio](https://aistudio.google.com/app/apikey) (gratuita)

### 2. Clona e Installa
```bash
git clone <your-repo-url>
cd exam-sniffer
npm install
```

### 3. Configura Vercel Postgres
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Crea un nuovo progetto collegando questo repo
3. Vai su **Storage** → **Create Database** → **Postgres**
4. Copia le variabili d'ambiente generate

### 4. Configura Variabili Ambiente
```bash
cp .env.example .env.local
```
Modifica `.env.local` con:
- `GEMINI_API_KEY` da Google AI Studio
- Le variabili Postgres da Vercel

### 5. Setup Database
```bash
npm run setup-db
```

### 6. Processa i PDF
```bash
# Metti i tuoi PDF nella cartella 'pdfs/'
npm run process-pdfs
```

### 7. Deploy su Vercel
```bash
# Pusha su GitHub, Vercel deploya automaticamente
git add .
git commit -m "Initial commit"
git push
```

## Uso

1. Apri l'app dal telefono: `https://tuo-progetto.vercel.app`
2. Scatta una foto della traccia d'esame OPPURE scrivi il testo
3. Clicca "Trova Soluzione"
4. L'AI cerca nelle dispense e genera la soluzione!

## Struttura Progetto

```
├── src/
│   ├── app/
│   │   ├── api/query/    # API endpoint
│   │   ├── page.tsx      # Homepage
│   │   └── layout.tsx    # Layout
│   └── lib/
│       ├── gemini.ts     # Gemini API
│       └── db.ts         # Database queries
├── scripts/
│   ├── setup-db.ts       # Crea tabelle
│   └── process-pdfs.ts   # Processa PDF
└── pdfs/                 # I tuoi PDF (locale)
```

## Limiti (Tier Gratuito)

| Servizio | Limite |
|----------|--------|
| Gemini API | 1500 req/giorno |
| Vercel Postgres | 256MB storage |
| Vercel Functions | 10s timeout |

## Troubleshooting

**"Non ho trovato contenuti rilevanti"**
- Assicurati di aver eseguito `npm run process-pdfs`
- Verifica che i PDF siano nella cartella `pdfs/`

**Errore durante il processing**
- Controlla che `GEMINI_API_KEY` sia corretta
- Verifica la connessione a Vercel Postgres
