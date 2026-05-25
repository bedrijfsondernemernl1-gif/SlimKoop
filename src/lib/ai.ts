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
  
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const DEFAULT_MODEL = "gemini-2.5-flash";

function cleanScrapedText(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Filter out raw HTML and scripts/style blocks first
  cleaned = cleaned.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');

  // 2. Remove URLs, links and image links (which fully cleans up header/footer links, tracking params like UTMs, etc.)
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');
  cleaned = cleaned.replace(/www\.[^\s]+/gi, '');

  // 3. Clean up typical tracking params or query sequences in text
  cleaned = cleaned.replace(/\?[a-zA-Z0-9_]+=[^&\s]+/g, '');
  cleaned = cleaned.replace(/&[a-zA-Z0-9_]+=[^&\s]+/g, '');

  // 4. Line by line sentence splitting & keyword checking for:
  // - Openingstijden (e.g. maandag, dinsdag, geopend van, t/m, openingstijden)
  // - Garantievoorwaarden (e.g. garantie, bovag, garantievoorwaarden, garantiepakket, afleverpakket)
  // - Bel ons / contact (e.g. bel ons, bellen, telefoonnummer, mobiel, contact, tel, whats*app, mail ons, email, e-mail)
  // - Privacybeleid (e.g. privacybeleid, privacy policy, cookiestatement, persoonsgegevens)
  
  // Clean multiple whitespace to single space for uniform processing
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Split into segments by punctuation (. ! ? ; \n) to analyze context chunks
  const segments = cleaned.split(/([.!?;\n])/);
  const keptSegments: string[] = [];

  const forbiddenTerms = [
    // Privacybeleid
    /privacybeleid|privacy\s+policy|privacy\s+verklaring|cookiestatement|persoonsgegevens/i,
    // Openingstijden
    /openingstijd|geopend\s+van|koopavond|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|gesloten/i,
    // Garantievoorwaarden
    /garantievoorwaarden|garantiepakket|afleverpakket|bovag\s*-*\s*garantie|garantie\s+van\s+\d+|maanden\s+garantie|jaar\s+garantie/i,
    // Bel ons
    /bel\s+ons|bellen|telefoon|mobiel|contact\s+opnemen|tel:|whats\s*app|e-mail|mail\s+ons|stuur\s+een\s+bericht|neem\s+contact|vrijblijvend|06\s*-\s*[0-9]{8}/i
  ];

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) {
      keptSegments.push(seg);
      continue;
    }
    const isForbidden = forbiddenTerms.some(regex => regex.test(trimmed));
    if (!isForbidden) {
      keptSegments.push(seg);
    }
  }

  cleaned = keptSegments.join("");

  // Fix up excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export async function analyseerdeTekst(
  listingData: any,
  vergelijkbareAutos: any[] = [],
  rdwData: any = null
): Promise<TextAnalysisResult | null> {
  try {
    const ai = getAIClient();

    // Clean and limit description to save tokens and costs
    const cleanedBeschrijving = cleanScrapedText(listingData.beschrijving || "");
    const shortBeschrijving = cleanedBeschrijving.substring(0, 800);

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const longDateStr = currentDate.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const rdwInfo = rdwData ? `
RDW Gegevens:
- Kenteken: ${rdwData.kenteken || 'onbekend'}
- APK Vervaldatum: ${rdwData.apkVervaldatum || 'onbekend'}
- Aantal Eigenaren: ${rdwData.aantalEigenaren || 'onbekend'}
- Gestolen: ${rdwData.isGestolen ? 'Ja' : 'Nee'}
` : '';

    const systemInstruction = `Je bent een auto-expert die autorapporten analyseert en een gedetailleerde DealScore en onderhandelingsadvies geeft.
Je antwoordt ALTIJD in het Nederlands en genereert uitsluitend een correct geformatteerde JSON.

JSON response template:
{
  "dealScore": 0-100, 
  "verdict": "vermijden" | "voorzichtig" | "redelijk" | "koopje", 
  "eerlijkePrijs": number, 
  "directeWinst": number, 
  "positievePunten": [".."], 
  "aandachtspunten": [".."], 
  "rodeVlaggen": [{"ernst": "hoog"|"middel"|"laag", "titel": "..", "uitleg": ".."}], 
  "advertentieAnalyse": {"taalgebruik": "..", "volledigheid": "..", "onlineSinds": "..", "prijsWijzigingen": ".."}, 
  "onderhandelingsScript": "..", 
  "openingsBod": number, 
  "onderhandelingsTips": [".."], 
  "samenvatting": [".."]
}

Wees beknopt voor lijsten. Max 1-2 zinnen per punt. Geen lange paragrafen.

Richtlijnen voor de lengte en structuur van de JSON velden:
- positievePunten: max 4-5 bullets, elk 1 concreet geformuleerde zin (NIET TE LANG).
- aandachtspunten: max 4-5 bullets, elk 1 concreet geformuleerde zin (NIET TE LANG).
- rodeVlaggen: GENEREER ALTIJD MINIMAAL 1 OF MEER RODE VLAGGEN/RISICO'S. max 3-4 items met korte titel + uitleg van max 2 zinnen.
- onderhandelingsScript: Schrijf een krachtig, persoonlijk maar beknopt onderhandelingsbericht van EXACT 3-4 sterke zinnen dat de koper direct kan kopiëren en sturen (NIET te kort met 1-2 zinnen, en NIET te lang met 10+ zinnen of losse bullets). Het moet klinken als een zelfverzekerd maar beleefd gesprek waarin de vraagprijs, het marktgemiddelde en één concreet argument of gebrek uit de advertentie worden benoemd, eindigend met een openingsbod.
- onderhandelingsTips: max 3 bullets, elk 1 zin.
- advertentieAnalyse: elk veld (taalgebruik, volledigheid, onlineSinds, prijsWijzigingen) mag maximaal 1-2 korte zinnen bevatten.
- samenvatting: max 3-4 bullets, elk 1-2 korte zinnen.

KWALITEITS- EN INHOUDSLOGICA RICHTLIJNEN:
1. SPECIFIEKERE AANDACHTSPUNTEN (AANDACHTSPUNTEN LOGICA): Let bij de aandachtspunten absoluut NIET alleen op generieke aspecten zoals een onvolledige of korte beschrijving in de advertentie (dit is te generiek en oninteressant voor de koper) of een kilometerstand op zichzelf. De kilometerstand mag ALLEEN als nadeel/aandachtspunt worden vermeld als deze daadwerkelijk te hoog is voor de leeftijd van de auto (belangrijk als die te hoog is, moet dat wel worden vermeld). Richt je juist op specifiekere en relevantere aandachtspunten: analyseer de specifieke opties en uitrusting, eventuele schade-indicaties of vage beschrijvingen in de advertentietekst, de leeftijd van het voertuig, specifieke bekende technische kwetsbaarheden van het desbetreffende merk/model/brandstoftype, of de RDW-registratiehistorie (zoals een ongewoon hoog aantal eigenaren of kortere bezitsperiodes).
2. BELANGRIJK VOOR AUTOSCOUT24 EN APK: Indien het platform AutoScout24 is en er is via de RDW-kentekencheck een geldige APK-vervaldatum opgehaald (de APK vervaldatum is bekend en niet 'onbekend'), dan mag je onder "aandachtspunten" absoluut NIET vermelden dat de APK-geldigheidsdatum of APK-vervaldatum ontbreekt in de advertentie. Omdat deze succesvol via het kenteken is opgehaald, is deze informatie immers voor de koper beschikbaar gedocumenteerd.
3. LOGICA VOOR DEALSCORE BEREKENING: Bereken de DealScore (dealScore) van 0-100 uiterst zorgvuldig en exact op basis van de volgende rationale en logica:
- Startpunt is een neutrale basis van 70 punten.
- Optellen (maximaal +30 punten):
  * Prijsvoordeel (vraagprijs ligt onder het marktgemiddelde voor vergelijkbare auto's): +10 tot +15 punten.
  * Uitzonderlijk lage kilometerstand voor autoleeftijd: +5 tot +10 punten.
  * Gunstige RDW-gegevens (bijvoorbeeld een lange APK van >6 maanden, of slechts 1-2 eerdere eigenaren): +5 tot +10 punten.
  * Recent online geplaatst (beperkte kans om gekaapt te worden): +5 punten.
- Aftrekken (maximaal -70 punten):
  * Prijsnadeel (vraagprijs ligt boven de marktwaarde/vergelijkbare autos): -10 tot -20 punten.
  * Uitzonderlijk hoge kilometerstand (kilometers veel hoger dan gemiddeld voor leeftijd): -10 tot -15 punten (vermeld dit indien van toepassing ook in aandachtspunten).
  * APK vervalt zeer binnenkort (<2 maanden) of is al verlopen: -10 tot -15 punten.
  * Hoog aantal eigenaren (>4 eigenaren): -5 tot -10 punten.
  * Aanwezigheid van rode vlaggen (rodeVlaggen): -5 tot -10 punten per medium rode vlag, en -20 tot -30 punten per hoge rode vlag. (Indien een hoge rode vlag van ernst "hoog" aanwezig is, zoals indicator gestolen of zware structurele of juridische risico's, mag de uiteindelijke DealScore nooit hoger zijn dan 50!).
4. REGELS VOOR HET OPENINGSBOD: Zorg ervoor dat het aanbevolen openingsbod (openingsBod) niet te ver onder de vraagprijs ligt, om een onrealistisch of beledigend bod te voorkomen. Het openingsbod moet een serieus, scherp maar reëel startpunt zijn voor onderhandeling, typisch tussen 85% en 95% van de vraagprijs (minimaal 85%), afhankelijk van de DealScore en de risico's/aandachtspunten. Stel het openingsbod NOOIT lager vast dan 85% van de vraagprijs.

CRITICAL TIJD- EN DATUMCONTEXT RICHTLIJNEN:
1. Gebruik de huidige datum van 'Vandaag' (meegegeven in de gebruikersprompt) voor alle berekeningen over APK geldigheid, leeftijd van de auto, dagen online, en alle andere tijdgerelateerde of kalender-gerelateerde analyses. We zitten definitief in het jaar 2026.
2. Indien er een APK vervaldatum bekend is in de RDW gegevens uit de prompt, vergelijk deze dan exact met de 'Vandaag' datum. Als de APK binnenkort of zeer binnenkort verloopt (zoals over enkele dagen of weken na Vandaag), noem dat dan ALTIJD als een nadeel, risico of rode vlag en zeg NOOIT dat de auto een 'lange APK' of 'ruime geldigheid' heeft. Doe dit ook als de verkoper dat in de beschrijving claimt (bijv. "APK tot 2026" is bijvoorbeeld heel kort als we al in de zomer of het najaar van 2026 zitten!).
3. Bereken de leeftijd van de auto nauwkeurig op basis van het huidige jaar 2026 en het opgegeven bouwjaar van de auto. Zoek ook in de verstrekte advertentiebeschrijving naar data om mee te wegen.`;

    const userPrompt = `Analyseer de onderstaande autogegevens volgens je systeeminstructies en retourneer de JSON.

Vandaag: ${longDateStr} (${formattedDate}). Huidig jaar: 2026.

GEGEVENS:
Platform: ${listingData.isAutoScout ? 'AutoScout24' : 'Marktplaats'}
Auto: ${listingData.titel}
Prijs: €${listingData.prijs}
KM: ${listingData.kilometerstand} km
Jaar: ${listingData.bouwjaar}
Online: ${listingData.dagenOnline} dgn
Verkoper: ${listingData.verkoper} (${listingData.verkoperType || 'Particulier'})
${rdwInfo}
Beschrijving: ${shortBeschrijving}
Vergelijking: ${JSON.stringify(vergelijkbareAutos.slice(0, 5).map(v => ({ prijs: v.prijs, km: v.km, jaar: v.jaar })))}`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });
    
    const textData = response.text;
    
    if (textData) {
      const cleanJson = textData.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        const result = JSON.parse(cleanJson);
        const vraagprijs = Number(listingData.prijs) || 0;

        // Programmatische bewaker: Het openingsbod niet te ver onder de vraagprijs (minimaal 85%, maximaal 95%)
        if (vraagprijs > 0 && typeof result.openingsBod === 'number' && result.openingsBod > 0) {
          const minBod = Math.round(vraagprijs * 0.85);
          const maxBod = Math.round(vraagprijs * 0.95);
          if (result.openingsBod < minBod) {
            result.openingsBod = minBod;
          } else if (result.openingsBod > maxBod) {
            result.openingsBod = maxBod;
          }
        } else if (vraagprijs > 0) {
          result.openingsBod = Math.round(vraagprijs * 0.90);
        }

        // Programmatische bewaker: DealScore binnen 0-100 en begrensd bij zware rode vlaggen
        if (typeof result.dealScore === 'number') {
          result.dealScore = Math.max(0, Math.min(100, Math.round(result.dealScore)));
          const heeftHogeRodeVlag = Array.isArray(result.rodeVlaggen) && result.rodeVlaggen.some((v: any) => v.ernst === 'hoog');
          if (heeftHogeRodeVlag && result.dealScore > 50) {
            result.dealScore = 50;
          }
        }

        return result;
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

    const photoPrompt = `Je krijgt nu ${validImages.length} verschillende foto's van hetzelfde voertuig meegestuurd.
Analyseer de ${validImages.length} foto's en geef voor ELKE foto afzonderlijk een analyse terug van de zichtbare staat (bijvoorbeeld exterieur, carrosserie, lak, koplampen, banden, velgen, interieur, stuurwiel, knoppen of bekleding).

Belangrijk: De "fotos" array in het JSON-antwoord MOET exact en minimaal ${validImages.length} afzonderlijke objecten bevatten (één element voor elke meegestuurde foto, exact in dezelfde volgorde als de meegestuurde afbeeldingen).

JSON response format:
{
  "fotos": [
    {
      "url": "url",
      "label": "Korte concrete beschrijving van wat er op de betreffende foto staat (bijv. 'Zijaanzicht linkerzijde', 'Banden & Velgen check', 'Stuurwiel & Dashboard inspectie')",
      "ernst": "ok" | "waarschuwing" | "probleem",
      "bevinding": "Een beknopte, professionele Nederlandse zin met de specifieke analyse of waarneming voor deze specifieke foto."
    }
  ],
  "ontbrekendeFotos": []
}

Geef de resultaten ALTIJD in het Nederlands.`;

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


