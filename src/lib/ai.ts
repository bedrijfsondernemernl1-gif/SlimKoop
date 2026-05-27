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
  onderhandelingsScript?: string | {
    openingsbod: string;
    tegenbod: string;
    weglopen: string;
  };
  onderhandelingsScriptVriendelijk?: {
    openingsbod: string;
    tegenbod: string;
    weglopen: string;
  };
  onderhandelingsScriptAggressief?: {
    openingsbod: string;
    tegenbod: string;
    weglopen: string;
  };
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
    const shortBeschrijving = cleanedBeschrijving.substring(0, 1500);

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
- Tellerstandoordeel: ${rdwData.tellerstandoordeel || 'onbekend'}
- Catalogusprijs: ${rdwData.catalogusprijs || 'onbekend'}
- Laatste tenaamstelling: ${rdwData.datumTenaamstelling || 'onbekend'}
- WAM Verzekerd: ${rdwData.wamVerzekerd || 'onbekend'}
` : '';

    const systemInstruction = `Je bent een doorgewinterde auto-expert en commercieel/technisch inspecteur. Geef diepe, concrete en waardevolle inzichten die niet direct voor de hand liggen.
Antwoord ALTIJD in het Nederlands en uitsluitend in JSON-formaat.

EIS VOOR ANALYSE DIVERSITEIT & BALANS:
Leg ABSOLUUT NIET de focus alleen op mechanische of technische risico's (zoals DSG-remmen, distributieketting, motor)! Verdeel je analyses, aandachtspunten en positieve punten evenredig over de volgende 5 gebieden:
1. Technisch/Mechanische staat: Motor, transmissie, ophanging, remmen, verwachte beurten, banden.
2. Cosmetisch/Optisch/Comfort: Krassen, deuken, interieurslijtage, lakconditie, steenslag, rookvrij, bekleding.
3. Commercieel/Markt/Prijs: Marktpopulariteit, afschrijving, courantheid van kleur/model, vergelijking met soortgelijke concurrenten.
4. Verkoper/Advertentie indicatoren: Betrouwbaarheid of volledigheid van de advertentietekst, verkoper history, aantal/kwaliteit foto's, openheid van communicatie.
5. Historisch/RDW aspect: Aantal eigenaren, resterende APK, importstatus (met risico's), kilometerstand oordeel, mogelijke schadehistorie.

TAALEISEN (Uiterst simpel Nederlands voor de gemiddelde koper):
- Schrijf in begrijpelijk, eenvoudig en vlot Nederlands. ABSOLUUT GEEN technisch jargon of ingewikkelde autotermen zonder direct een hele simpele uitleg te geven! De koper moet je rapport volledig begrijpen zonder Google te gebruiken.
- Zeg NOOIT alleen "DSG-7 mechatronic" of "DSG-versnellingsbak". Schrijf in plaats daarvan bijvoorbeeld: "de automatische versnellingsbak (DSG) die bekend staat om dure reparaties" of "het elektronische brein van de automatische versnellingsbak".
- Zeg NOOIT "EA111 distributieketting" of "EA211 distributieriem" zonder simpele uitleg. Schrijf bijvoorbeeld: "de distributieketting (die de motor draaiende houdt) van dit oudere motortype (EA111) die kan uitrekken, wat leidt tot een zeer dure motorreparatie".
- Zeg NOOIT "VIN check" of "optiecodelijst check via VIN". Schrijf bijvoorbeeld: "het unieke chassisnummer (VIN) om te controleren welke fabrieksopties er echt op zitten".
- Vertaal ingewikkelde technische termen of leg ze direct kort en simpel uit (bijvoorbeeld: koppelingsplaten, vliegwiel, mechatronic, EGR-klep, roetfilter, turbo, enz.).

JSON response template:
{
  "dealScore": 0-100, 
  "verdict": "vermijden" | "voorzichtig" | "redelijk" | "koopje", 
  "eerlijkePrijs": number, 
  "directeWinst": number, 
  "positievePunten": string[], 
  "aandachtspunten": string[], 
  "rodeVlaggen": [{"ernst": "hoog"|"middel"|"laag", "titel": "..", "uitleg": ".."}], 
  "advertentieAnalyse": {"taalgebruik": "..", "volledigheid": "..", "onlineSinds": "..", "prijsWijzigingen": ".."}, 
  "onderhandelingsScript": {
    "openingsbod": "Persuasief en goed doordacht openingsbod bericht",
    "tegenbod": "Sterk, meegaand doch standvastig reactiebericht op een tegenvoorstel",
    "weglopen": "Uiterst overtuigend weglopend bericht dat subtiele druk en angst om te missen (FOMO) activeert"
  }, 
  "openingsBod": number, 
  "onderhandelingsTips": string[], 
  "samenvatting": string[]
}

STRICTE LENGTE- EN INHOUDSEISEN:
1. positievePunten: exact/max 4 korte bullets. Elke bullet MOET ABSOLUUT uiterst kort zijn en uit MAXIMAAL 1-2 korte, simpele zinnen bestaan (totaal maximaal 25-30 woorden per bullet). Verdeel ze over bovengenoemde 5 gebieden voor maximale diversiteit!
2. aandachtspunten: exact/max 4 korte bullets. Elke bullet MOET ABSOLUUT uiterst kort zijn en uit MAXIMAAL 1-2 korte, simpele zinnen bestaan (totaal maximaal 25-30 woorden per bullet). Verdeel ze over bovengenoemde 5 gebieden voor maximale diversiteit!
3. rodeVlaggen: max 3 stuks. Korte titel + MAX 1-2 KORTE ZINNEN feitelijke en simpele uitleg inclusief een concrete actie voor de koper.
4. onderhandelingsScript: een object met exact drie scenarios (openingsbod, tegenbod, weglopen).
   - Het openingsbod mag rond de 80-85% van de vraagprijs liggen bij uitzonderingen zoals zichtbare schade of duur naderend onderhoud. Zonder zware gebreken rond de 90%.
   - DE BERICHTEN MOETEN UITGEBREID, POLITE, MAAR PERSUASIVE EN REALISTISCH ZIJN. Exact 4 tot 5 zinnen per scenario! Dit is lang genoeg om overtuigend en inhoudelijk sterk te zijn (bijvoorbeeld door specifieke marktargumenten of cosmetische/onderhoudskosten te noemen), maar kort en overzichtelijk genoeg dat de verkoper het graag doorleest. Nooit te overweldigend lang.
   - Zorg dat het openingsBod-getal exact consistent hierin terugkomt.
5. onderhandelingsTips: max 4 bullets. Elke bullet MOET uiterst kort, bondig en to-the-point zijn (maximaal 1-2 zinnen / 10-15 words per bullet) als pure, simpele bullet-point tips voor tijdens de bezichtiging of online onderhandeling. Geen lange paragrafen!
6. samenvatting: exact/max 3 bullets (staat auto, marktwaarde analyse, eindadvies).

DEALSCORE LOGICA:
De DealScore (0-100) is een weging over het hele spectrum gebaseerd op een startpunt van 70.
1. Prijs vs Markt (grootste factor - gunstige prijs t.o.v. de markt verhoogt score; hogere prijs verlaagt score)
2. Rode Vlaggen (middelmatige vlaggen verlagen score met 5-10, hoge/ernstige vlaggen verlagen score met 15-20)
3. Advertentie Kwaliteit (duidelijke beschrijving, goed taalgebruik geeft bonus van +5 tot +10)
4. Kilometerstand & Leeftijd (extreem hoge km-stand of onlogische stand verlaagt score met 10-15; zeer gunstige kilometerstand geeft bonus tot +10)

- Basis: startpunt van 70.
- Plus (max +30): prijsvoordeel t.o.v. de markt (+10 tot +20), zeer gunstige kilometerstand (+5 tot +10), uitstekende advertentietekst (+5).
- Min (max -70): prijsnadeel (-10 tot -20), hoge km t.o.v. bouwjaar (-5 tot -10), korte APK < 2m (-5 tot -10), rode vlaggen (-5 tot -15 per vlag).
- Noot: Zorg voor een realistische verdeling over het 0-100 spectrum. Een perfecte auto zonder minpunten hoort een score tussen 80 en 95 te krijgen. Slechts bij extreem zware problemen mag de score onder de 40 of 50 dalen. Begrens de score niet kunstmatig laag als de rest van de auto in goede orde is.`;

    const vergelijkingCSV = vergelijkbareAutos.slice(0, 5).map(v => `${v.prijs}|${v.km}|${v.jaar}`).join(',');

    const kmStr = (listingData.kilometerstand && Number(listingData.kilometerstand) > 0)
      ? `${listingData.kilometerstand} km`
      : 'Niet vermeld';

    const userPrompt = `Analyseer de onderstaande autogegevens volgens je systeeminstructies en retourneer de JSON.

Vandaag: ${longDateStr} (${formattedDate}). Huidig jaar: 2026.

GEGEVENS:
Platform: ${listingData.isAutoScout ? 'AutoScout24' : 'Marktplaats'}
Auto: ${listingData.titel}
Prijs: €${listingData.prijs}
KM: ${kmStr}
Jaar: ${listingData.bouwjaar}
Brandstof: ${listingData.brandstof || 'Onbekend'}
Transmissie: ${listingData.transmissie || 'Onbekend'}
Carrosserie: ${listingData.carrosserie || 'Onbekend'}
Online: ${listingData.dagenOnline} dgn
Verkoper: ${listingData.verkoper} (${listingData.verkoperType || 'Particulier'})
${rdwInfo}
Beschrijving: ${shortBeschrijving}
Vergelijking (prijs|km|jaar): ${vergelijkingCSV}`;

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

        const origineelBod = result.openingsBod;

        // Programmatische bewaker: Het openingsbod niet te ver onder de vraagprijs (minimaal 80%, maximaal 95%)
        if (vraagprijs > 0 && typeof result.openingsBod === 'number' && result.openingsBod > 0) {
          const minBod = Math.round(vraagprijs * 0.80);
          const maxBod = Math.round(vraagprijs * 0.95);
          if (result.openingsBod < minBod) {
            result.openingsBod = minBod;
          } else if (result.openingsBod > maxBod) {
            result.openingsBod = maxBod;
          }
        } else if (vraagprijs > 0) {
          result.openingsBod = Math.round(vraagprijs * 0.90);
        }

        if (origineelBod && origineelBod !== result.openingsBod && result.onderhandelingsScript) {
          const origPlain = origineelBod.toString();
          const origDot = origineelBod.toLocaleString('nl-NL');
          
          if (typeof result.onderhandelingsScript === 'string') {
            result.onderhandelingsScript = result.onderhandelingsScript
              .replace(new RegExp(origPlain, 'g'), result.openingsBod.toString())
              .replace(new RegExp(origDot.replace(/\./g, '\\.'), 'g'), result.openingsBod.toLocaleString('nl-NL'));
          } else if (typeof result.onderhandelingsScript === 'object') {
            const keys = ['openingsbod', 'tegenbod', 'weglopen'] as const;
            keys.forEach(key => {
              if (result.onderhandelingsScript[key] && typeof result.onderhandelingsScript[key] === 'string') {
                result.onderhandelingsScript[key] = result.onderhandelingsScript[key]
                  .replace(new RegExp(origPlain, 'g'), result.openingsBod.toString())
                  .replace(new RegExp(origDot.replace(/\./g, '\\.'), 'g'), result.openingsBod.toLocaleString('nl-NL'));
              }
            });
          }
        }

        // Programmatische bewaker: Korte bullets van max 1-2 zinnen per punt, en simpele taal
        const translateAndShorten = (punt: string, isAandachtspunt: boolean): string => {
          let clean = String(punt || "").trim();
          if (!clean) return "";

          // Safe translations for key terms
          clean = clean.replace(/\bDSG-?[67]\s+mechatronic\b/gi, 'de automatische versnellingsbak (DSG) die bekend staat om dure reparaties');
          clean = clean.replace(/\bDSG-?[67]\b/gi, 'de automatische versnellingsbak (DSG)');
          clean = clean.replace(/\bmechatronic\b/gi, 'het elektronische brein van de versnellingsbak (de mechatronic)');
          clean = clean.replace(/\bmechatronica\b/gi, 'het elektronische brein van de versnellingsbak (de mechatronic)');
          clean = clean.replace(/\bEA111\b/gi, 'het oudere motortype met bekende kettingproblemen (EA111)');
          clean = clean.replace(/\bEA211\b/gi, 'het nieuwere en betrouwbaardere motortype (EA211)');
          clean = clean.replace(/\bVIN\b/gi, 'het chassisnummer (VIN)');
          clean = clean.replace(/\boptiecodelijst\b/gi, 'lijst met fabrieksopties');

          if (isAandachtspunt) {
            clean = clean.replace(/\bdistributieketting\b/gi, 'de distributieketting (die de motor draaiende houdt maar kan uitrekken)');
            clean = clean.replace(/\bdistributieriem\b/gi, 'de distributieriem (die regelmatig vervangen moet worden om motorschade te voorkomen)');
          }

          // Force 1-2 sentences maximum
          const rawSentences = clean.split('.');
          const nonEmptySentences = rawSentences.map(s => s.trim()).filter(Boolean);
          if (nonEmptySentences.length > 2) {
            return nonEmptySentences.slice(0, 2).join('. ') + '.';
          }
          if (nonEmptySentences.length > 0) {
            return nonEmptySentences.join('. ') + '.';
          }
          return clean;
        };

        if (Array.isArray(result.positievePunten)) {
          result.positievePunten = result.positievePunten.map((p: any) => translateAndShorten(p, false)).filter(Boolean);
        }
        if (Array.isArray(result.aandachtspunten)) {
          result.aandachtspunten = result.aandachtspunten.map((p: any) => translateAndShorten(p, true)).filter(Boolean);
        }

        // Programmatische bewaker: DealScore binnen 0-100 en begrensd bij zware rode vlaggen
        if (typeof result.dealScore === 'number') {
          result.dealScore = Math.max(0, Math.min(100, Math.round(result.dealScore)));
          const heeftHogeRodeVlag = Array.isArray(result.rodeVlaggen) && result.rodeVlaggen.some((v: any) => v.ernst === 'hoog');
          if (heeftHogeRodeVlag && result.dealScore > 65) {
            result.dealScore = 65;
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
        responseMimeType: "application/json",
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


