import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export interface TextAnalysisResult {
  dealScore: number;
  verdict: "vermijden" | "voorzichtig" | "redelijk" | "koopje";
  eerlijkePrijs: number;
  directeWinst: number;
  positievePunten: string[];
  aandachtspunten: string[];
  rodeVlaggen: Array<{
    ernst: "hoog" | "middel" | "laag";
    titel: string;
    uitleg: string;
  }>;
  advertentieAnalyse: {
    taalgebruik: string;
    volledigheid: string;
    onlineSinds: string;
    prijsWijzigingen: string;
  };
  onderhandelingsScript: string;
  openingsBod: number;
  onderhandelingsTips: string[];
  samenvatting: string[];
}

export interface PhotoAnalysisResult {
  fotos: Array<{
    url?: string;
    bevinding: string;
    ernst: "ok" | "waarschuwing" | "probleem";
    label: string;
  }>;
  ontbrekendeFotos: string[];
}

function getAIClient() {
  let apiKey = process.env.GEMINI_API_KEY;
  
  // Fallback: lees .env file
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    try {
      const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
      const match = envContent.match(/GEMINI_API_KEY=(.*)/);
      if (match && match[1]) {
        apiKey = match[1].trim();
      }
    } catch(e) {}
  }
  
  // Hardcoded fallback (TIJDELIJK)
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    apiKey = "AIzaSyDZEzKWENdXAHvMtK5-ksPrhZEWt-Z_FvM";
  }
  
  console.log(`[AI] Gemini API key geladen: ${apiKey ? apiKey.substring(0, 8) + '...' : 'GEEN KEY!'}`);
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ontbreekt volledig!");
  }
  
  return new GoogleGenAI({ apiKey });
}

const DEFAULT_MODEL = "gemini-3-flash-preview";

export async function analyseerdeTekst(listingData: any, vergelijkbareAutos: any[] = []): Promise<TextAnalysisResult | null> {
  try {
    const ai = getAIClient();

    // Trim description to save input tokens (most important info is in the first 1500 chars)
    const shortBeschrijving = (listingData.beschrijving || "").substring(0, 1500);

    const textPrompt = `Analyseer deze advertentie voor een tweedehands auto:
Titel: ${listingData.titel}
Prijs: €${listingData.prijs}
Kilometerstand: ${listingData.kilometerstand} km
Bouwjaar: ${listingData.bouwjaar}
Dagen online: ${listingData.dagenOnline}
Verkoper: ${listingData.verkoper} (Type: ${listingData.verkoperType || 'Particulier'}, Lid sinds: ${listingData.verkoperSinds})
Beschrijving: ${shortBeschrijving}

Vergelijking (voor marktgemiddelde): ${JSON.stringify(vergelijkbareAutos.slice(0, 10).map(v => ({ prijs: v.prijs, km: v.km, jaar: v.jaar })))}

INSTRUCTIES:
1. dealScore (0-100): 40% prijs vs markt, 30% risico/vlaggen, 15% advertentiekwaliteit, 15% km-stand.
2. eerlijkePrijs: Gemiddelde marktwaarde gecorrigeerd met +/- €0,10/km en €1000/jaar verschil.
3. directeWinst: eerlijkePrijs - vraagprijs.
4. verdict: 'koopje' (winst > 1500), 'redelijk' (winst > 0), 'voorzichtig' (bij risico), 'vermijden' (grote problemen).
5. advertentieAnalyse: Analyseer taalgebruik, volledigheid, onlineSinds (${listingData.dagenOnline} dagen) en prijsWijzigingen.
6. onderhandelingsScript: Schrijf een krachtig NL script op basis van vraagprijs (€${listingData.prijs}) en vlaggen.
7. samenvatting: 3 korte bullets.

OUTPUT JSON FORMAT:
{
  "dealScore": number,
  "verdict": "vermijden" | "voorzichtig" | "redelijk" | "koopje",
  "eerlijkePrijs": number,
  "directeWinst": number,
  "positievePunten": string[],
  "aandachtspunten": string[],
  "rodeVlaggen": [{"ernst": "hoog"|"middel"|"laag", "titel": string, "uitleg": string}],
  "advertentieAnalyse": {"taalgebruik": string, "volledigheid": string, "onlineSinds": string, "prijsWijzigingen": string},
  "onderhandelingsScript": string,
  "openingsBod": number,
  "onderhandelingsTips": [string, string, string],
  "samenvatting": string[]
}`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: { parts: [{ text: textPrompt }] },
      config: {
        systemInstruction: "Je bent een Nederlandse expert in tweedehands auto's en marktplaats advertenties. Analyseer advertenties en bereken waarden nauwkeurig in JSON formaat. Huidig jaar is 2026. Bestempel een bouwjaar uit het huidige jaar of recenter NOOIT als onjuist of onmogelijk.",
        responseMimeType: "application/json",
      }
    });
    
    const textData = response.text;
    
    if (textData) {
      return JSON.parse(textData);
    }
    return null;
  } catch (error) {
    console.error("Fout tijdens analyseerdeTekst:", error);
    return null;
  }
}

export async function analyseerFotos(fotoUrls: string[]): Promise<PhotoAnalysisResult> {
  if (!fotoUrls || fotoUrls.length === 0) {
    return { fotos: [], ontbrekendeFotos: ["Geen foto's beschikbaar"] };
  }
  
  try {
    const ai = getAIClient();
    
    // Limit to 3 high-quality photos to save multimodal tokens while keeping quality
    const urlsToUse = fotoUrls.slice(0, 3);

    const fetchedImages = await Promise.all(
      urlsToUse.map(async (url) => {
        if (!url || !url.startsWith('http')) return null;
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const arrayBuffer = await res.arrayBuffer();
          const base64data = Buffer.from(arrayBuffer).toString('base64');
          return { url, base64: base64data, mimeType: res.headers.get("content-type") || "image/jpeg" };
        } catch (e) {
          return null;
        }
      })
    );

    const validImages = fetchedImages.filter(Boolean) as any[];

    if (validImages.length === 0) {
      return { fotos: [], ontbrekendeFotos: ["Alle foto's"] };
    }

    const photoPrompt = `Analyseer deze foto's op carrosserie (deuken/kleurverschil), interieur slijtage, motorruimte (lekkage) en banden.
Response format:
{
  "fotos": [{"url": "string", "bevinding": "string", "ernst": "ok"|"waarschuwing"|"probleem", "label": "string"}],
  "ontbrekendeFotos": ["string"]
}`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: {
        parts: [
          { text: photoPrompt },
          ...validImages.map(img => ({
            inlineData: {
              data: img.base64,
              mimeType: img.mimeType
            }
          }))
        ]
      },
      config: {
        systemInstruction: "Je bent een expert in het optisch keuren van tweedehands auto's op basis van foto's. Geef kritische analyses in JSON formaat.",
        responseMimeType: "application/json"
      }
    });

    const textData = response.text;
    
    if (textData) {
      const parsed = JSON.parse(textData);
      if (parsed.fotos) {
        parsed.fotos = parsed.fotos.map((f: any, i: number) => ({
          ...f,
          url: validImages[i] ? validImages[i].url : (f.url || "")
        }));
      }
      return parsed;
    }
    return { fotos: [], ontbrekendeFotos: ["Analyse mislukt"] };
  } catch (error) {
    console.error("Fout tijdens analyseerFotos:", error);
    return { fotos: [], ontbrekendeFotos: ["API fout tijdens foto analyse"] };
  }
}


