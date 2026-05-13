import { GoogleGenAI } from '@google/genai';

export interface TextAnalysisResult {
  dealScore: number;
  verdict: string;
  eerlijkePrijs: number;
  directeWinst: number;
  positievePunten: string[];
  aandachtspunten: string[];
  rodeVlaggen: Array<{
    ernst: string;
    titel: string;
    uitleg: string;
  }>;
  advertentieAnalyse: {
    taalgebruik: string;
    prijswijzigingen: string;
    volledigheid: string;
  };
  onderhandelingsScript: string;
  openingsBod: number;
  onderhandelingsTips: string[];
  samenvatting: string[];
}

export interface PhotoAnalysisResult {
  fotos: Array<{
    bevinding: string;
    ernst: string;
    label: string;
  }>;
  ontbrekendeFootos: string[];
}

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is niet geconfigureerd in de environment');
  }
  return new GoogleGenAI(apiKey);
}

export async function analyseerdeTekst(listingData: any, vergelijkbaar: any): Promise<TextAnalysisResult | null> {
  try {
    const genAI = getAIClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const textPrompt = `Je bent een Nederlandse expert in tweedehands auto's.
Analyseer deze advertentie en bescherm de koper.
Reageer ALLEEN in het Nederlands.
Geef ALLEEN geldige JSON terug zonder tekst erbuiten.

JSON structuur:
{
  "dealScore": 85,
  "verdict": "koopje",
  "eerlijkePrijs": 5000,
  "directeWinst": 500,
  "positievePunten": ["punt 1", "punt 2"],
  "aandachtspunten": ["punt 1", "punt 2"],
  "rodeVlaggen": [{
    "ernst": "hoog",
    "titel": "Voorbeeld",
    "uitleg": "Uitleg"
  }],
  "advertentieAnalyse": {
    "taalgebruik": "Netjes",
    "prijswijzigingen": "Geen",
    "volledigheid": "Matig"
  },
  "onderhandelingsScript": "Hallo...",
  "openingsBod": 4500,
  "onderhandelingsTips": ["tip 1"],
  "samenvatting": ["punt 1", "punt 2"]
}

Advertentie data: ${JSON.stringify(listingData)}
Vergelijkbare autos: ${JSON.stringify(vergelijkbaar)}`;

    const result = await model.generateContent(textPrompt);
    const response = await result.response;
    const textData = response.text();
    if (textData) {
      const match = textData.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    }
    return null;
  } catch (error) {
    console.error("Fout tijdens analyseerdeTekst:", error);
    return null;
  }
}

export async function analyseerFotos(fotoUrls: string[]): Promise<PhotoAnalysisResult | null> {
  try {
    const genAI = getAIClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const imageParts: any[] = [];
    const urlsToUse = (fotoUrls || []).slice(0, 5); // Haal max 5 fotos op

    for (const imgUrl of urlsToUse) {
      try {
        const resImg = await fetch(imgUrl);
        const buffer = await resImg.arrayBuffer();
        const mime = resImg.headers.get("content-type") || "image/jpeg";
        imageParts.push({
          inlineData: {
            data: Buffer.from(buffer).toString("base64"),
            mimeType: mime
          }
        });
      } catch (e) {
        console.warn("Kon afbeelding niet ophalen voor Gemini:", imgUrl);
      }
    }

    if (imageParts.length === 0) {
        return { fotos: [], ontbrekendeFootos: [] };
    }

    const photoPrompt = `Analyseer deze auto fotos. Zoek naar schade, spuitwerk, 
kleurverschillen en ontbrekende fotos.
Geef ALLEEN JSON terug:
{
  "fotos": [{"bevinding": "kras", "ernst": "waarschuwing", "label": "Kras op deur"}],
  "ontbrekendeFootos": ["Onderhoudsboekje", "Motorruimte"]
}`;

    const result = await model.generateContent([photoPrompt, ...imageParts]);
    const response = await result.response;
    const photoData = response.text();
    if (photoData) {
      const match = photoData.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    }
    return null;
  } catch (error) {
    console.error("Fout tijdens analyseerFotos:", error);
    return null;
  }
}
