import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API endpoint for AI Astrophysicist
app.post('/api/astrophysicist', async (req, res) => {
  const { messages, currentParams } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messaggi mancanti o formato non valido.' });
  }

  if (!ai) {
    return res.status(503).json({
      error: 'Il servizio AI non è configurato. Assicurati che la chiave GEMINI_API_KEY sia impostata nei Segreti.',
    });
  }

  try {
    const lastMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, messages.length - 1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `Sei un astrofisico esperto di relatività generale e buchi neri.
Rispondi alle domande dell'utente in italiano, con un tono entusiasta, accademico ma accessibile, divulgativo e chiaro.
Usa analogie efficaci (come il telo elastico per lo spaziotempo).
Spiega in dettaglio la fisica dietro il simulatore: l'effetto di lente gravitazionale, l'Orizzonte degli Eventi (Raggio di Schwarzschild), la Sfera dei fotoni, l'Anello di Einstein, l'effetto Doppler relativistico (beaming) e i dischi di accrescimento.

Contesto del simulatore corrente per aiutare la tua risposta:
- Massa corrente del buco nero nel simulatore: ${currentParams?.mass || 'N/D'} masse solari (M☉)
- Raggio di Schwarzschild calcolato: ${currentParams?.schwarzschildRadius || 'N/D'} km
- Sfera dei fotoni (orbita instabile della luce): ${currentParams?.photonSphereRadius || 'N/D'} km
- Inclinazione del disco di accrescimento: ${currentParams?.inclination || 'N/D'} gradi
- Spin del buco nero (buco nero di Kerr se rotante): ${currentParams?.spin || 'N/D'} (da 0 a 0.99)
- Effetto di Redshift/Doppler attivo: ${currentParams?.dopplerEffect ? 'Sì (il lato sinistro che ruota verso l\'osservatore è più luminoso e bluastro, quello destro che si allontana è più fioco e rossastro)' : 'No'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: lastMessage }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({ response: response.text });
  } catch (error: any) {
    console.error('Error calling Gemini:', error);
    return res.status(500).json({ error: error.message || 'Errore interno del server durante la generazione della risposta.' });
  }
});

// Serve frontend
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
