import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// ─── API KEYS ─────────────────────────────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const NEWSAPI_KEY    = process.env.NEWSAPI_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌  Manca OPENAI_API_KEY nel file .env');
  process.exit(1);
}
if (!NEWSAPI_KEY) {
  console.error('❌  Manca NEWSAPI_KEY nel file .env — registrati su https://newsapi.org');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── STEP 1: Raccoglie notizie fresche per un paese ──────────────────────────
async function fetchNewsForCountry(country) {
  const queryMap = {
    'Russia':         'Russia geopolitics OR Russia military OR Russia Ukraine',
    'Cina':           'China geopolitics OR China military OR China Taiwan',
    'Iran':           'Iran Iraq OR Iran militia OR Iran nuclear OR Iran sanctions',
    'Iraq':           'Iraq conflict OR Iraq militia OR Iraq security OR Iraq war',
    'Siria':          'Syria conflict OR Syria war OR Syria humanitarian',
    'Turchia':        'Turkey Erdogan OR Turkey Iraq OR Turkey Syria OR Turkey Kurdish',
    'Israele':        'Israel Gaza OR Israel Iran OR Israel military',
    'Arabia Saudita': 'Saudi Arabia Yemen OR Saudi Arabia Iran OR Saudi Arabia geopolitics',
    'USA':            'United States foreign policy OR US military Iraq OR US Middle East',
    'Corea del Nord': 'North Korea missiles OR North Korea Kim Jong-un',
  };

  const query = queryMap[country] || `${country} geopolitics OR ${country} military`;
  const url = `https://newsapi.org/v2/everything?` +
    `q=${encodeURIComponent(query)}` +
    `&language=en` +
    `&sortBy=publishedAt` +
    `&pageSize=5` +
    `&apiKey=${NEWSAPI_KEY}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (data.status !== 'ok') {
      console.warn(`NewsAPI warning per ${country}:`, data.message);
      return [];
    }
    return (data.articles || []).map(a => ({
      title:       a.title        || '',
      description: a.description  || '',
      source:      a.source?.name || '',
      publishedAt: a.publishedAt  || '',
    }));
  } catch (err) {
    console.warn(`Errore NewsAPI per ${country}:`, err.message);
    return [];
  }
}

// ─── STEP 2: Formatta le notizie come contesto per il modello ─────────────────
function formatNewsContext(newsMap) {
  return Object.entries(newsMap).map(([country, articles]) => {
    if (!articles.length) return `## ${country}\nNessun articolo recente disponibile.`;
    const lines = articles.map((a, i) =>
      `  ${i + 1}. [${a.source} — ${a.publishedAt?.slice(0,10)}] ${a.title}` +
      (a.description ? ` — ${a.description}` : '')
    ).join('\n');
    return `## ${country}\n${lines}`;
  }).join('\n\n');
}

// ─── PROXY ENDPOINT ───────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { countries } = req.body;
  if (!countries || !countries.length) {
    return res.status(400).json({ error: 'Nessun paese specificato' });
  }

  // Raccoglie notizie per tutti i paesi in parallelo
  console.log(`📰  Raccolta notizie per: ${countries.join(', ')}`);
  const newsEntries = await Promise.all(
    countries.map(async c => [c, await fetchNewsForCountry(c)])
  );
  const newsMap     = Object.fromEntries(newsEntries);
  const newsContext = formatNewsContext(newsMap);
  console.log(`✅  Notizie raccolte — invio a OpenAI`);

  const systemPrompt = `Sei PULSE, motore di sentiment geopolitico per intelligence italiana.
La tua innovazione chiave: analizzi notizie REALI e recenti rilevando ironia, propaganda e framing narrativo — non solo keyword.
Rispondi ESCLUSIVAMENTE con JSON valido, nessun testo aggiuntivo.`;

  const userPrompt = `Analizza il sentiment geopolitico dei seguenti paesi basandoti sulle notizie REALI qui sotto.

=== NOTIZIE RECENTI (fonte: NewsAPI) ===
${newsContext}
========================================

Per ogni paese rileva score di tensione, tipo di comunicazione, tendenza e previsione.

Struttura JSON richiesta:
{
  "countries": [
    {
      "name": "nome paese",
      "score": numero da -100 a +100 (negativo=ostile/teso, positivo=stabile/cooperativo),
      "label": "TESO|OSTILE|NEUTRO|POSITIVO|CRITICO",
      "delta": numero con segno es +3 o -7,
      "trend_7d": numero 0-100 per sparkline,
      "forecast_label": "ESCALATION|STABILIZZAZIONE|DETERIORAMENTO|MIGLIORAMENTO",
      "forecast_arrow": "↑|↓|→",
      "forecast_color": "#e63946|#2a9d8f|#f4a261"
    }
  ],
  "signals": [
    {
      "country": "nome paese",
      "text": "segnale specifico estratto dalle notizie in 1 frase con contesto implicito",
      "type": "irony|propaganda|framing|genuine",
      "color": "#e63946|#2a9d8f|#f4a261|#9b2226"
    }
  ],
  "framing": {
    "propaganda": numero percentuale,
    "irony": numero percentuale,
    "genuine": numero percentuale,
    "framing": numero percentuale
  },
  "insight": "2-3 frasi di insight basate sulle notizie reali, scritto da analista senior"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 2800,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   }
        ]
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error('OpenAI error:', data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const raw = data.choices?.[0]?.message?.content || '';
    if (!raw) return res.status(500).json({ error: 'Risposta vuota da OpenAI — aumentare max_tokens o ridurre i paesi selezionati' });
    const parsed = JSON.parse(raw);
    res.json(parsed);

  } catch (err) {
    console.error('Errore:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🟢  PULSE server avviato su http://localhost:${PORT}`);
  console.log(`🤖  Motore: OpenAI gpt-4o-mini + NewsAPI real-time`);
  console.log(`📡  Proxy attivo su POST /api/analyze\n`);
});
