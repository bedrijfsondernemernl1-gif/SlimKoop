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
  if (apiKey === "MY_GEMINI_API_KEY" || !apiKey) {
    try {
      const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
      const match = envContent.match(/GEMINI_API_KEY=(.*)/);
      if (match && match[1]) {
        apiKey = match[1].trim();
      }
    } catch(e) {}
  }
  return new GoogleGenAI({ apiKey });
}

export async function analyseerdeTekst(listingData: any, vergelijkbareAutos: any[] = []): Promise<TextAnalysisResult | null> {
  try {
    const ai = getAIClient();

    const textPrompt = `Je bent een Nederlandse expert in tweedehands auto's en marktplaats advertenties.
Analyseer de advertentie en bereken de waarden nauwkeurig. 

Advertentie:
Titel: ${listingData.titel}
Prijs: €${listingData.prijs}
Kilometerstand: ${listingData.kilometerstand} km
Bouwjaar: ${listingData.bouwjaar}
Dagen online: ${listingData.dagenOnline}
Verkoper: ${listingData.verkoper} (Type: ${listingData.verkoperType || 'Particulier'}, Lid sinds: ${listingData.verkoperSinds}, Advertenties: ${listingData.aantalAdvertenties})
Beschrijving: ${listingData.beschrijving}

Vergelijkbare auto's (gebruikt voor marktgemiddelde):
${JSON.stringify(vergelijkbareAutos.map(v => ({ prijs: v.prijs, km: v.km, jaar: v.jaar })))}

INSTRUCTIES VOOR SCORE BEREKENING (dealScore):
Bereken de dealScore op basis van de volgende vier gewogen factoren (totaal 100 punten):
1. Prijs ten opzichte van markt (max 40 punten): Hoe lager de prijs t.o.v. vergelijkbare auto's, hoe meer punten.
2. Rode vlaggen (max 30 punten): Geen rode vlaggen = 30 punten. Elke vlag kost punten afhankelijk van ernst.
3. Kwaliteit van de advertentie (max 15 punten): Volledigheid en professionaliteit van beschrijving.
4. Kilometerstand (max 15 punten): Lage km-stand t.o.v. leeftijd geeft meer punten.
Tel deze scores op voor de definitieve 'dealScore'. Wees streng en realistisch.

INSTRUCTIES VOOR BEREKENING:
- 'eerlijkePrijs': Neem het gemiddelde van de vergelijkbare auto's. Corrigeer voor KM-stand (+/- €0,10 per km verschil) en Bouwjaar (+/- €1000 per jaar verschil).
- 'directeWinst': eerlijkePrijs - vraagprijs.
- 'verdict': 'koopje' als winst > 1500, 'redelijk' als winst > 0, 'voorzichtig' bij rode vlaggen, 'vermijden' bij grote problemen.
- 'advertentieAnalyse': 
    - taalgebruik: Hoe komt de tekst over? (Professioneel, haastig, eerlijk?)
    - volledigheid: Mist er belangrijke info? (Onderhoud, schade, herkomst?)
    - onlineSinds: Analyseer herplaatsingen op basis van dagen online (${listingData.dagenOnline}).
    - prijsWijzigingen: Analyseer of de prijs aantrekkelijk is of te vaak aangepast lijkt.
- 'onderhandelingsScript': Schrijf een krachtig script. Gebruik de vraagprijs (€${listingData.prijs}), marktgegevens en rode vlaggen.
- 'samenvatting': 3 korte bullets met de essentie.

Geef exact dit JSON formaat terug:
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

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: textPrompt
    });
    const textData = result.text;
    
    if (textData) {
      let cleanedText = textData.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    }
    return null;
  } catch (error) {
    console.error("Fout tijdens analyseerdeTekst:", error);
    return null;
  }
}

export async function analyseerFotos(fotoUrls: string[]): Promise<PhotoAnalysisResult | null> {
  try {
    const ai = getAIClient();
    const urlsToUse = (fotoUrls || []).slice(0, 6);

    const fetchedImages = await Promise.all(
      urlsToUse.map(async (url) => {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': 'https://www.marktplaats.nl/'
            }
          });
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const mimeType = res.headers.get("content-type") || "image/jpeg";
          return { url, base64, mimeType };
        } catch (e) {
          console.warn(`Kon foto niet ophalen via fetch op server: ${url}`, e);
          return null;
        }
      })
    );

    const validImages = fetchedImages.filter(Boolean) as any[];

    if (validImages.length === 0) {
      return { fotos: [], ontbrekendeFotos: ["Alle foto's"] };
    }

    const photoPrompt = `Je bent een expert in het optisch keuren van tweedehands auto's op basis van foto's.
Analyseer de bijgevoegde foto's van de auto zeer kritisch. 

Let specifiek op:
1. Carrosserie: Deuken, krassen, kleurverschil tussen panelen (duidt op schadeherstel).
2. Interieur: Slijtage aan stuur, pook of instapwang (komt dit overeen met de KM-stand?), status van de bekleding.
3. Motorruimte: Sporen van lekkage, missende afdekkappen.
4. Banden/Velgen: Stoeprandschade, profieldiepte indicatie.

Geef voor ELKE foto een specifieke bevinding.
De 'ernst' moet 'ok', 'waarschuwing' (bijv. lichte kras) of 'probleem' (bijv. flinke deuk of kleurverschil) zijn.

Response JSON formaat:
{
  "fotos": [
    {
      "url": "de_exacte_url_van_de_geanalyseerde_foto",
      "bevinding": "Specifieke observatie in het Nederlands",
      "ernst": "ok" | "waarschuwing" | "probleem",
      "label": "Bijv: Linksvoor, Interieur stuur, Motorblok"
    }
  ],
  "ontbrekendeFotos": ["Welke specifieke foto's ontbreken nog om een goed beeld te krijgen?"]
}`;

    const contents = {
        parts: [
          { text: photoPrompt },
          ...validImages.map(img => ({
            inlineData: {
              data: img.base64,
              mimeType: img.mimeType
            }
          }))
        ]
    };

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents
    });
    const photoData = result.text;
    
    if (photoData) {
      let cleaned = photoData.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      // Map URLs back if Gemini forgot them or got them wrong
      if (parsed.fotos) {
        parsed.fotos = parsed.fotos.map((f: any, i: number) => ({
          ...f,
          url: f.url || (validImages[i] ? validImages[i].url : "")
        }));
      }
      
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Fout tijdens analyseerFotos:", error);
    return null;
  }
}
