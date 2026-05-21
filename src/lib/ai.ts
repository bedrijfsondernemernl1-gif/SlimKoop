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
  
  if (!apiKey) {
    console.warn(`[AI] GEMINI_API_KEY ontbreekt!`);
  } else {
    console.log(`[AI] Gemini API key geladen: ${apiKey.substring(0, 8)}...`);
  }
  
  return new GoogleGenAI({ apiKey: apiKey || "" });
}

const DEFAULT_MODEL = "gemini-2.5-flash";

export async function analyseerdeTekst(listingData: any, vergelijkbareAutos: any[] = []): Promise<TextAnalysisResult | null> {
  try {
    const ai = getAIClient();

    // Limit description
    const shortBeschrijving = (listingData.beschrijving || "").substring(0, 800);

    const textPrompt = `Analyseer autorapport. JSON response ONLY:
{"dealScore": 0-100, "verdict": "vermijden" | "voorzichtig" | "redelijk" | "koopje", "eerlijkePrijs": num, "directeWinst": num, "positievePunten": [".."], "aandachtspunten": [".."], "rodeVlaggen": [{"ernst": "hoog"|"middel"|"laag", "titel": "..", "uitleg": ".."}], "advertentieAnalyse": {"taalgebruik": "..", "volledigheid": "..", "onlineSinds": "..", "prijsWijzigingen": ".."}, "onderhandelingsScript": "..", "openingsBod": num, "onderhandelingsTips": [".."], "samenvatting": [".."]}

Houd je antwoorden beknopt. Ik wil wel dat het lang is maar niet heel lang, het MAG NIET KORT ZIJN DOOR DE BOCHT MET PAAR WOORDEN PER PUNT!

Auto: ${listingData.titel}
Prijs: €${listingData.prijs}
KM: ${listingData.kilometerstand} km
Jaar: ${listingData.bouwjaar}
Online: ${listingData.dagenOnline} dgn
Verkoper: ${listingData.verkoper} (${listingData.verkoperType || 'Particulier'})
Beschrijving: ${shortBeschrijving}
Vergelijking: ${JSON.stringify(vergelijkbareAutos.slice(0, 5).map(v => ({ prijs: v.prijs, km: v.km, jaar: v.jaar })))}`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ parts: [{ text: textPrompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const textData = response.text;
    
    if (textData) {
      const cleanJson = textData.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("JSON parse failed. Raw text:", textData);
        throw parseError; // bubbles to outer catch
      }
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
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
          });
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

    const photoPrompt = `Analyseer schades/slijtage in JSON:
{"fotos": [{"url": "url", "bevinding": "korte zin", "ernst": "ok"|"waarschuwing"|"probleem", "label": "onderdeel"}], "ontbrekendeFotos": []}`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        {
          parts: [
            { text: photoPrompt },
            ...validImages.map(img => ({
              inlineData: {
                data: img.base64,
                mimeType: img.mimeType
              }
            }))
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const textData = response.text;
    
    if (textData) {
      const cleanJson = textData.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        const parsed = JSON.parse(cleanJson);
        if (parsed.fotos) {
          parsed.fotos = parsed.fotos.map((f: any, i: number) => ({
            ...f,
            url: validImages[i] ? validImages[i].url : (f.url || "")
          }));
        }
        return parsed;
      } catch (parseError) {
        console.error("JSON parse failed in analyseerFotos. Raw text:", textData);
      }
    }
    return { fotos: [], ontbrekendeFotos: ["Analyse mislukt"] };
  } catch (error) {
    console.error("Fout tijdens analyseerFotos:", error);
    return { fotos: [], ontbrekendeFotos: ["API fout tijdens foto analyse"] };
  }
}


