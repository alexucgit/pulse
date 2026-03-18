# PULSE — Geopolitical Sentiment Engine

> Motore di analisi del sentiment geopolitico real-time per contesti di intelligence.  
> Rileva ironia, propaganda e framing narrativo su notizie fresche — non solo keyword.

---

## Come funziona

Il flusso di ogni analisi:

```
Browser → Express (proxy) → NewsAPI (notizie fresche) → OpenAI GPT-4o-mini → Browser
```

1. L'utente seleziona i paesi da monitorare e avvia l'analisi
2. Il backend raccoglie in parallelo articoli recenti da **NewsAPI** per ogni paese
3. I testi reali vengono passati come contesto a **GPT-4o-mini**
4. Il modello analizza il linguaggio implicito e restituisce score, forecast e intelligence brief

La differenza rispetto ai tool esistenti: il modello capisce **cosa c'è dietro le parole** — ironia, propaganda, framing — non solo quali parole compaiono.

---

## Output

Per ogni paese monitorato PULSE produce:

- **Score di tensione** — indice da -100 (ostile) a +100 (cooperativo)
- **Trend 7 giorni** — variazione percepita nel periodo
- **Forecast +7 giorni** — proiezione: escalation / stabilizzazione / deterioramento / miglioramento
- **Segnali rilevati** — feed di segnali con tipo di comunicazione (propaganda / ironia / framing / genuino)
- **Distribuzione framing** — percentuale per categoria sul totale degli articoli
- **Key Insight** — valutazione sintetica da analista senior generata dal modello

---

## Stack

| Layer | Tecnologia |
|---|---|
| Frontend | HTML, CSS, JavaScript vanilla |
| Backend | Node.js, Express |
| News real-time | NewsAPI.org |
| Modello AI | OpenAI GPT-4o-mini |
| Env management | dotenv |

---

## Requisiti

- Node.js 18+
- Una API key OpenAI → [platform.openai.com](https://platform.openai.com)
- Una API key NewsAPI → [newsapi.org](https://newsapi.org) (piano free: 100 req/giorno)

---

## Installazione

```bash
# 1. Clona o decomprimi il progetto
cd pulse

# 2. Installa le dipendenze
npm install

# 3. Crea il file .env
cp .env.example .env
```

Apri `.env` e inserisci le tue chiavi:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEWSAPI_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```bash
# 4. Avvia il server
npm start
```

Apri il browser su **http://localhost:3000**

---

## Struttura del progetto

```
pulse/
├── server.js           # Backend Express — proxy NewsAPI + OpenAI
├── package.json
├── .env                # Chiavi API (non committare)
├── .env.example        # Template variabili d'ambiente
├── README.md
└── public/
    └── index.html      # Frontend completo (dashboard + logica)
```

---

## Paesi supportati

| Paese | Query di ricerca |
|---|---|
| Russia | Russia geopolitics, military, Ukraine |
| Cina | China geopolitics, military, Taiwan |
| Iran | Iran nuclear, sanctions, military |
| USA | United States foreign policy, diplomacy |
| Turchia | Turkey Erdogan, NATO, geopolitics |
| Corea del Nord | North Korea missiles, Kim Jong-un |
| Brasile | Brazil Lula, foreign policy |

Nuovi paesi si aggiungono estendendo l'oggetto `queryMap` in `server.js`.

---

## Note di sicurezza

- La API key OpenAI è gestita **esclusivamente lato server** — non è mai esposta al browser
- Il backend fa da proxy: il frontend chiama solo `/api/analyze` sul server locale
- Non committare mai il file `.env` nel repository (già in `.gitignore` se usi Git)

---

## Licenza

Prototipo a scopo dimostrativo. 
