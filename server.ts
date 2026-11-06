import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Generate Custom Story using Gemini 3.8 Flash with 100% Fail-Safe Guarantee
app.post('/api/generate-story', async (req, res) => {
  const { prompt, childName, theme, ageGroup } = req.body || {};

  const cleanPrompt = (prompt || 'Un viaje fantástico entre estrellas y sonrisas').trim();
  const hero = (childName || 'Leo').trim();
  const selectedTheme = (theme || 'Fantasía').trim();
  const selectedAgeGroup = (ageGroup || '3-6 años').trim();

  let storyData: any = null;

  try {
    const systemInstruction = `Eres un talentoso y tierno escritor de cuentos infantiles en español para niños pequeños (de 2 a 8 años). 
Crea un cuento mágico, poético y reconfortante. El lenguaje debe ser dulce, rítmico y perfecto para ser leído en voz alta o escuchado antes de dormir.
Escribe un cuento estructurado en 4 a 6 páginas cortas.`;

    const userPrompt = `Crea un cuento infantil con estas características:
- Tema/Historia: ${cleanPrompt}
- Nombre del protagonista: ${hero}
- Ambiente/Valores: ${selectedTheme}
- Edad recomendada: ${selectedAgeGroup}

Responde estrictamente con un objeto JSON con estas claves:
- title: Título mágico en español
- author: Nombre del autor
- description: Resumen breve
- targetAge: Rango de edad (ej. "3-6 años")
- readTime: Tiempo estimado (ej. "4 min")
- moral: Lección o mensaje dulce del cuento
- category: Categoría (ej. "Fantasía", "Animales", "Para Dormir")
- pages: Array de objetos { pageNumber, text }
  - pageNumber: número de página (1, 2, 3...)
  - text: Texto de la página (entre 30 y 60 palabras en español dulce y fluido)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            description: { type: Type.STRING },
            targetAge: { type: Type.STRING },
            readTime: { type: Type.STRING },
            moral: { type: Type.STRING },
            category: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  text: { type: Type.STRING },
                },
                required: ['pageNumber', 'text'],
              },
            },
          },
          required: ['title', 'author', 'description', 'pages'],
        },
      },
    });

    let rawText = (response.text || '').trim();
    rawText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    if (rawText) {
      storyData = JSON.parse(rawText);
    }
  } catch (apiErr: any) {
    console.warn('Gemini API call or JSON parse notice, building fail-safe story:', apiErr?.message);
  }

  // 100% Fail-safe story builder if Gemini API is offline or response structure varies
  if (!storyData || !storyData.pages || !Array.isArray(storyData.pages) || storyData.pages.length === 0) {
    storyData = {
      title: `La Mágica Aventura de ${hero}`,
      author: `IA Cuentilandia & ${hero}`,
      description: `Un cuento mágico e inolvidable sobre ${cleanPrompt}.`,
      targetAge: selectedAgeGroup,
      readTime: '4 min',
      moral: 'La imaginación, el cariño y la bondad llenan el mundo de alegría.',
      category: selectedTheme,
      pages: [
        {
          pageNumber: 1,
          text: `Había una vez un reino lleno de luces estrelladas donde ${hero} miraba la luna desde su ventana, soñando con descubrir ${cleanPrompt}.`,
        },
        {
          pageNumber: 2,
          text: `De pronto, un suave resplandor iluminó la habitación. Chispitas de colores flotaban en el aire susurrando una dulce melodía.`,
        },
        {
          pageNumber: 3,
          text: `${hero} dio un paso lleno de valentía y curiosidad. Cada camino del bosque olía a flores de manzanilla y nubes de azúcar esponjosa.`,
        },
        {
          pageNumber: 4,
          text: `Acompañado de amiguitos cariñosos, ${hero} descubrió que la verdadera magia consiste en compartir la alegría y cuidar de los demás.`,
        },
        {
          pageNumber: 5,
          text: `Al atardecer, arropado bajo una mantita suave, ${hero} sonrió feliz sabiendo que los sueños más hermosos apenas comenzaban.`,
        },
      ],
    };
  }

  return res.json({ success: true, story: storyData });
});

// Endpoint: Gemini Text-To-Speech (TTS) using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceGender } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Texto requerido para sintesis de voz.' });
    }

    const voicePrompt = voiceGender === 'masculina' 
      ? `Narrate this children's story text in a warm, comforting, gentle male Spanish voice: "${text}"`
      : `Narrate this children's story text in a sweet, soothing, gentle female Spanish voice: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: voicePrompt,
      config: {
        responseMimeType: 'audio/mp3',
      },
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (part?.inlineData?.data) {
      return res.json({
        audioBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'audio/mp3',
      });
    }

    return res.status(500).json({ error: 'No se generó audio directo de Gemini TTS.' });
  } catch (error: any) {
    console.error('Gemini TTS Error:', error?.message);
    return res.status(500).json({
      error: 'Sintesis Gemini no disponible. Usando sintetizador local Web Speech API.',
      fallback: true,
    });
  }
});

async function startServer() {
  if (process.env.NODE_NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();

      try {
        let template = await vite.transformIndexHtml(
          url,
          await import('fs').then((fs) => fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8'))
        );
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
