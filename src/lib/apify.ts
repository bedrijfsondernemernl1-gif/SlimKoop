import { ApifyClient } from 'apify-client';

export interface MarktplaatsData {
  titel: string;
  prijs: number;
  beschrijving: string;
  fotos: string[];
  kenteken: string;
  kilometerstand: number;
  bouwjaar: number;
  brandstof: string;
  transmissie: string;
  carrosserie: string;
  merk: string;
  model: string;
  verkoper: string;
  verkoperType: string;
  verkoperSinds: string;
  aantalAdvertenties: number;
  dagenOnline: number;
  advertentieId?: string;
  variant?: string;
}

export interface VergelijkbaarResult {
  titel: string;
  prijs: number;
  km: number;
  jaar: number;
  url: string;
}

/**
 * Zorgt ervoor dat we de Apify client initialiseren.
 * Dit is server-side code en mag niet in de front-end blootgesteld worden.
 */
function getApifyClient() {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error('APIFY_TOKEN mist in environment variables');
  }
  return new ApifyClient({ token });
}

function getActorId() {
  return process.env.APIFY_ACTOR_ID || 'g1VRIdIyesUfRQs2F';
}

function extractNumber(val: any): number {
  if (!val) return 0;
  return parseInt(String(val).replace(/[^0-9]/g, '')) || 0;
}

function parseFallbackFromDescription(description: string) {
  if (!description) return { kilometerstand: 0, bouwjaar: 0, brandstof: "", transmissie: "" };
  const text = description.toLowerCase();
  let kilometerstand = 0;
  let bouwjaar = 0;
  let brandstof = "";
  let transmissie = "";
  let kenteken = "";

  // 0. Kenteken extraction
  const kentekenRegexes = [
    /\bkenteken\s*(?:is|:)?\s*([a-zA-Z0-9-]{6,10})\b/i,
    /\b([A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2})\b/i,
    /\b([A-Z0-9]{1,3}-[A-Z0-9]{1,3}-[A-Z0-9]{1,3})\b/i
  ];

  for (const regex of kentekenRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const k = match[1].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      // Basic check: must be exactly 6 chars for Dutch license plates (usually)
      if (k.length === 6) {
        kenteken = k;
        console.log(`[FALLBACK] Kenteken parsed from description: ${kenteken} (matched: "${match[0]}")`);
        break;
      }
    }
  }

  // 1. Kilometerstand extraction
  const kmRegexes = [
    // Matches "153.000 km", "153 000 kilometers", "153.000 nap km", "153.000 originele km", "153.000 km."
    /\b(\d{1,3}[\s.]\d{3})\s*(?:[a-zA-Z]{1,12}\s+){0,2}(?:km|kilometer|km\.|kilometers)\b/i,
    // Matches "stand: 153.000", "teller: 153.000", "km: 153.000", "stand op: 153.000"
    /\b(?:km|kilometerstand|stand\s+op|stand|st\.|tellerstand|teller|gelopen)\s*(?:is|:)?e?s?\s*(\d{1,3}[\s.]\d{3})\b/i,
    // Matches "slechts 153.000", "origineel 153.000"
    /\b(?:slechts|origineel|originele)\s+(\d{1,3}[\s.]\d{3})\b/i,
    // Matches "153.xxx" or "153 xxx" or "153.xxx km"
    /\b(?:km|kilometerstand|stand|st\.|tellerstand|teller)\s*(?:is|:)?\s*(\d{1,3}[\s.]*[xX]{2,3})\b/i,
    /\b(\d{1,3}[\s.]*[xX]{2,3})\b/i,
    // Matches "153k", "153k km"
    /\b(\d{1,3})\s*k\s*(?:km|kilometer|kilometers)?\b/i,
    // Matches "153000 km" or "153000 kilometers" (no dots)
    /\b(\d{5,6})\s*(?:[a-zA-Z]{1,12}\s+){0,2}(?:km|kilometer|kilometers)\b/i,
    // Matches "153.000 op de teller", "153 000 op de teller"
    /\b(\d{1,3}[\s.]\d{3})\s*(?:op de teller|op de klok|gelopen)\b/i,
    // Fallback: Default 3-digit dot 3-digit number
    /\b(\d{1,3}[.]\d{3})\b/i
  ];

  for (const regex of kmRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const matchStr = match[0].toLowerCase();
      
      // Ensure this is not a price (e.g. € 153.000 or 153.000 euro)
      const startIndex = text.indexOf(matchStr);
      const precedingText = text.substring(Math.max(0, startIndex - 10), startIndex);
      const succeedingText = text.substring(startIndex + matchStr.length, Math.min(text.length, startIndex + matchStr.length + 10));
      
      if (
        precedingText.includes('€') || 
        precedingText.includes('eur') || 
        precedingText.includes('prijs') ||
        succeedingText.includes('€') ||
        succeedingText.includes('eur') ||
        succeedingText.includes('prijs')
      ) {
        continue; // Skip this match as it is likely a price
      }

      let cleanVal = match[1].replace(/\./g, '').replace(/\s/g, '').toLowerCase();
      
      // Vervang xs door 0s
      if (cleanVal.includes('x')) {
        cleanVal = cleanVal.replace(/x/g, '0');
      }

      let val = parseInt(cleanVal) || 0;
      
      // Fix cases where 137xx could mean 137000 but was typed with two x's.
      if (matchStr.includes('x') && val >= 1000 && val < 50000) {
        val = val * 10;
      }

      const matchK = matchStr.match(/\d\s*k/);
      if (matchK || (matchStr.includes('k') && !matchStr.includes('km') && matchStr.includes('kilometer') === false)) {
        if (val < 1000) {
          val = val * 1000;
        }
      }
      
      if (val > 0) {
        kilometerstand = val;
        console.log(`[FALLBACK] Kilometerstand parsed from description: ${kilometerstand} km (matched: "${match[0]}")`);
        break;
      }
    }
  }

  // 2. Bouwjaar extraction
  const yearRegexes = [
    /\b(?:bouwjaar|bj|jaar)\s*(?:is|:)?\s*(20[0-2]\d|19[89]\d)\b/i,
    /\b(20[0-2]\d|19[89]\d)\s*(?:is het bouwjaar|bouwjaar)\b/i
  ];

  for (const regex of yearRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const yearVal = parseInt(match[1]) || 0;
      if (yearVal > 1900 && yearVal <= new Date().getFullYear()) {
        bouwjaar = yearVal;
        console.log(`[FALLBACK] Bouwjaar parsed from description: ${bouwjaar} (matched: "${match[0]}")`);
        break;
      }
    }
  }

  // 3. Brandstof extraction
  if (text.includes("benzine")) {
    brandstof = "Benzine";
  } else if (text.includes("diesel")) {
    brandstof = "Diesel";
  } else if (text.includes("hybride") || text.includes("hybrid") || text.includes("phev")) {
    brandstof = "Hybride";
  } else if (text.includes("lpg")) {
    brandstof = "LPG";
  } else if (text.includes("elektrisch") || text.includes("electric")) {
    brandstof = "Elektrisch";
  }

  // 4. Transmissie extraction
  if (text.includes("automaat") || text.includes("automatic") || text.includes("dsg") || text.includes("cvt")) {
    transmissie = "Automaat";
  } else if (text.includes("handgeschakeld") || text.includes("handbak") || text.includes("manueel") || text.includes("manual") || text.includes("5-versnellingen") || text.includes("6-versnellingen")) {
    transmissie = "Handgeschakeld";
  }

  return { kilometerstand, bouwjaar, brandstof, transmissie, kenteken };
}


/**
 * Resolves a mobile Marktplaats short-link (e.g. link.marktplaats.nl/m123456)
 * to its standard browser URL.
 */
export async function resolveMarktplaatsUrl(url: string): Promise<string> {
  if (!url || !url.includes("link.marktplaats.nl")) {
    return url;
  }

  console.log(`[RESOLVER] Marktplaats mobiele link gedetecteerd: ${url}`);
  try {
    // We let fetch automatically follow redirects (default behavior).
    // response.url will contain the final destination URL!
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (response.url && response.url !== url && (response.url.includes("marktplaats.nl") || response.url.includes("marktplaats.com"))) {
      try {
        const u = new URL(response.url);
        u.search = "";
        const cleaned = u.toString();
        console.log(`[RESOLVER] Succesvol omgeleid via HEAD naar (schoon): ${cleaned}`);
        return cleaned;
      } catch {
        console.log(`[RESOLVER] Succesvol omgeleid via HEAD naar: ${response.url}`);
        return response.url;
      }
    }

    // Try GET if HEAD didn't yield a redirect difference or failed
    const responseGet = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (responseGet.url && responseGet.url !== url && (responseGet.url.includes("marktplaats.nl") || responseGet.url.includes("marktplaats.com"))) {
      try {
        const u = new URL(responseGet.url);
        u.search = "";
        const cleaned = u.toString();
        console.log(`[RESOLVER] Succesvol omgeleid via GET naar (schoon): ${cleaned}`);
        return cleaned;
      } catch {
        console.log(`[RESOLVER] Succesvol omgeleid via GET naar: ${responseGet.url}`);
        return responseGet.url;
      }
    }
  } catch (error) {
    console.error("[RESOLVER] Fout bij het achterhalen van omleiding via fetch:", error);
  }

  // Fallback if HTTP call fails: construct a cleaner/original URL.
  // We do not change it if we can't resolve it, to let the scraper try its best, or we just remove tracking queries.
  try {
    const cleanUrl = new URL(url);
    cleanUrl.search = "";
    return cleanUrl.toString();
  } catch {
    return url;
  }
}

function getAttribute(scrapedData: any, keys: string[]): string {
  const attrs = scrapedData.attributes || scrapedData.specifications || scrapedData.properties || scrapedData.characteristics || [];
  if (Array.isArray(attrs)) {
    const attr = attrs.find((a: any) => {
      const label = (a.key || a.name || a.label || "").toLowerCase().trim();
      return keys.some(key => label.includes(key.toLowerCase()));
    });
    if (attr) return attr.value || attr.text || "";
  }
  // Check direct properties
  for (const key of keys) {
    if (scrapedData[key]) return String(scrapedData[key]);
  }
  return '';
}

function getVariantFromScrapedData(scrapedData: any): string {
  if (!scrapedData) return "";
  const attrs = scrapedData.attributes || {};
  
  // Try common keys for variant/trim/execution in attributes
  const candidateKeys = ['version', 'variant', 'trim', 'uitvoering', 'versionName', 'modelVersion', 'model_version', 'submodel'];
  
  // Check in attributes if it's an object
  if (typeof attrs === 'object' && !Array.isArray(attrs)) {
    for (const key of candidateKeys) {
      if (attrs[key]) {
        return String(attrs[key]).trim();
      }
    }
  }
  
  // Check if it's an array of attributes
  const rawAttrs = scrapedData.attributes || scrapedData.specifications || scrapedData.properties || scrapedData.characteristics || [];
  if (Array.isArray(rawAttrs)) {
    const found = rawAttrs.find((a: any) => {
      const label = (a.key || a.name || a.label || "").toLowerCase().trim();
      return candidateKeys.some(k => label === k || label.includes(k));
    });
    if (found) {
      return String(found.value || found.text || "").trim();
    }
  }

  // Also check top-level properties of scrapedData
  for (const key of candidateKeys) {
    if (scrapedData[key]) {
      return String(scrapedData[key]).trim();
    }
  }

  // If we can't find anything, let's try to extract from title by removing brand and model
  const title = (scrapedData.title || "").trim();
  const brand = (scrapedData.brand || attrs.brand?.split(' ')[0] || "").trim();
  const model = (scrapedData.model || attrs.brand?.split(' ').slice(1).join(' ') || "").trim();

  if (title && brand && model) {
    let relativeTitle = title;
    // Replace brand case-insensitively
    relativeTitle = relativeTitle.replace(new RegExp(brand.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'), '');
    // Replace model case-insensitively
    relativeTitle = relativeTitle.replace(new RegExp(model.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'), '');
    
    // Clean up multiple spaces and trim
    relativeTitle = relativeTitle.replace(/\s+/g, ' ').trim();
    
    // Let's filter out extra stuff like years
    relativeTitle = relativeTitle.replace(/\b(19\d{2}|20\d{2})\b/g, '');
    
    // Clean up spaces again
    relativeTitle = relativeTitle.replace(/\s+/g, ' ').trim();
    
    // Check if what is left is reasonable and check for submodels / motorisation
    if (relativeTitle.length > 2 && relativeTitle.length < 35) {
      return relativeTitle;
    }
  }
  
  return "";
}

function extractSpecificKeywords(variant: string, title: string, model: string): string[] {
  const words: string[] = [];
  const text = `${variant} ${title}`.toLowerCase();
  
  // Clean model lowercase
  const cleanModel = model.toLowerCase();

  // Pattern A: Displacement + Fuel/Engine (e.g., "1.8 tsi", "2.0 tdi", "1.4 tfsi", "1.6 hdi", "1.5 dci")
  const engineRegex = /\b\d\.\d\s*(?:tsi|tfsi|tdi|hdi|dci|cdti|fsi|mpi|tgdi|t-gdi|tce|g-tec|gtec|puretech|ecoboost|vti|thp)\b/g;
  const engineMatches = text.match(engineRegex);
  if (engineMatches) {
    engineMatches.forEach(m => {
      m.split(/\s+/).forEach(w => {
        const cleaned = w.trim();
        if (cleaned && !words.includes(cleaned)) {
          words.push(cleaned);
        }
      });
    });
  } else {
    // If no full motor regex matched, look for basic engine types
    const basicEngines = ['tsi', 'tfsi', 'tdi', 'hdi', 'dci', 'cdti', 'puretech', 'ecoboost', 'tce', 'tgdi', 'vti', 'thp', 'hybrid', 'phev', 'ev', 'electro', 'elektrisch', 'd4d', 'd-4d', 'g-tec', 'cng', 'lpg'];
    basicEngines.forEach(eng => {
      const regex = new RegExp(`\\b${eng}\\b`, 'i');
      if (regex.test(text)) {
        if (!words.includes(eng)) {
          words.push(eng);
        }
      }
    });
    
    // Look for basic displacements
    const dispRegex = /\b\d\.\d\b/g;
    const dispMatches = text.match(dispRegex);
    if (dispMatches) {
      dispMatches.forEach(d => {
        if (!words.includes(d)) {
          words.push(d);
        }
      });
    }
  }

  // Pattern B: Common performance, submodel, trim, or variant badges
  const terms = [
    'gti', 'gtd', 'gte', 'amg', 'm sport', 'msport', 'r-line', 'rline', 's-line', 'sline', 
    'st-line', 'stline', 'fr', 'cupra', 'rs', 'st', 'opc', 'quattro', '4motion', 'xdrive', 
    'ultra', 'allroad', 'titanium', 'tekna', 'allure', 'executive', 'business', 'sport', 
    'gt', 'avant', 'touring', 'e-tron', 'etron', 'lounge', 'pop', 'n-connecta', 'nconnecta',
    'urban', 'line', 'v6', 'v8', 'kompressor'
  ];

  terms.forEach(t => {
    const escaped = t.replace('-', '\\-');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(text)) {
      if (cleanModel.includes(t)) {
        return;
      }
      
      t.split(/[\s-]+/).forEach(w => {
        const cleaned = w.trim();
        if (cleaned && !words.includes(cleaned)) {
          words.push(cleaned);
        }
      });
    }
  });

  return words;
}

export async function scrapeMarktplaats(url: string): Promise<MarktplaatsData | null> {
  try {
    const resolvedUrl = await resolveMarktplaatsUrl(url);
    const client = getApifyClient();
    const actorId = getActorId();

    const run = await client.actor(actorId).call({
      urls: [{ url: resolvedUrl }],
      maxRecords: 5
    });

    const datasetClient = client.dataset(run.defaultDatasetId!);
    const { items } = await datasetClient.listItems();
    const scrapedData: any = items[0] || {};

    if (!scrapedData || !scrapedData.title) {
      console.log("[SCRAPER] Geen data ontvangen van Apify");
      return null;
    }

    console.log("[SCRAPER] Raw data keys:", Object.keys(scrapedData));

    const attrs = scrapedData.attributes || {};
    
    // Direct beschikbare velden uit nieuwe scraper
    const brand = scrapedData.brand || attrs.brand?.split(' ')[0] || "";
    const model = scrapedData.model || attrs.brand?.split(' ').slice(1).join(' ') || "";
    const year = parseInt(scrapedData.constructionYear || attrs.constructionYear || "0") || 0;
    
    // Kilometerstand: "13.490" -> 13490
    const mileageStr = attrs.mileage || "";
    const mileage = parseInt(mileageStr.replace(/\./g, '').replace(/\s/g, '')) || 0;
    
    // Kenteken direct beschikbaar
    let kenteken = (scrapedData.licensePlate || attrs.licensePlate || attrs.kenteken || "").replace(/[-\s]/g, '').toUpperCase();
    
    // Brandstof, transmissie, carrosserie direct uit attributes
    const brandstof = attrs.fuel || "Onbekend";
    const transmissie = attrs.transmission || "Onbekend";
    const carrosserie = attrs.vehicleType || "";
    
    // Verkoper info
    const seller = scrapedData.seller || {};
    const verkoperNaam = seller.name || "Onbekend";
    const isDealer = seller.type === 'TRADER' || seller.type === 'dealer';
    const verkoperType = isDealer ? 'Dealer' : 'Particulier';
    const lidSinds = seller.activeSince || (seller.activeYears ? `${seller.activeYears} jaar` : "Onbekend");
    const aantalAds = 0; // Niet beschikbaar in nieuwe scraper
    
    // Fotos: nieuwe scraper geeft images als array van relative URLs
    const photosRaw = scrapedData.images || [];
    const fotos = photosRaw.map((img: string) => {
      if (img.startsWith('//')) return 'https:' + img;
      if (img.startsWith('http')) return img;
      return 'https://images.marktplaats.com' + img;
    }).slice(0, 15);

    // Prijs: priceCents / 100
    let prijs = 0;
    if (scrapedData.price?.priceCents) {
      prijs = Math.round(scrapedData.price.priceCents / 100);
    }

    // Dagen online uit stats.since
    let dagenOnline = 0;
    if (scrapedData.stats?.since) {
      const sinceDate = new Date(scrapedData.stats.since);
      const now = new Date();
      dagenOnline = Math.floor((now.getTime() - sinceDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Description: gebruik plain text versie
    const beschrijving = scrapedData.description || "";

    const fallback = parseFallbackFromDescription(beschrijving);

    let finalKenteken = kenteken;
    if (!finalKenteken && fallback.kenteken) {
      finalKenteken = fallback.kenteken;
    }

    let finalMileage = mileage;
    if ((finalMileage <= 1000 || finalMileage === 0) && fallback.kilometerstand > finalMileage) {
      finalMileage = fallback.kilometerstand;
    }

    let finalYear = year;
    if (finalYear === 0 && fallback.bouwjaar > 0) {
      finalYear = fallback.bouwjaar;
    }

    let finalBrandstof = brandstof;
    if ((finalBrandstof === "Onbekend" || !finalBrandstof) && fallback.brandstof) {
      finalBrandstof = fallback.brandstof;
    }

    let finalTransmissie = transmissie;
    if ((finalTransmissie === "Onbekend" || !finalTransmissie) && fallback.transmissie) {
      finalTransmissie = fallback.transmissie;
    }

    // Extract advertentieId van URL (begint vaak met 'm' gevolgd door nummers in the path)
    let advertentieId = "Niet beschikbaar";
    const m = resolvedUrl.match(/\/([ma]\d{9,10})-/i) || resolvedUrl.match(/([ma]\d{9,10})/i);
    if (m && m[1]) {
      advertentieId = m[1];
    } else if (scrapedData.id) {
       advertentieId = scrapedData.id;
    }

    const data: MarktplaatsData = {
      titel: scrapedData.title || "",
      prijs: prijs,
      beschrijving: beschrijving,
      fotos: fotos,
      kenteken: finalKenteken,
      kilometerstand: finalMileage,
      bouwjaar: finalYear,
      brandstof: finalBrandstof,
      transmissie: finalTransmissie,
      carrosserie: carrosserie,
      merk: brand || "Onbekend",
      model: model || "Onbekend",
      verkoper: verkoperNaam,
      verkoperType: verkoperType,
      verkoperSinds: lidSinds,
      aantalAdvertenties: aantalAds,
      dagenOnline: dagenOnline,
      advertentieId: advertentieId,
      variant: getVariantFromScrapedData(scrapedData)
    };

    console.log(`[SCRAPER] Geëxtraheerd: ${data.titel} | ${data.merk} ${data.model} | ${data.bouwjaar} | ${data.kilometerstand}km | ${data.kenteken} | ${data.brandstof}`);

    return data;
  } catch (error) {
    console.error("Fout tijdens scrapeMarktplaats:", error);
    return null;
  }
}

function extractGenerationFromTitle(titel: string, model: string): string {
  const t = (titel || "").toLowerCase();
  const m = (model || "").toLowerCase();

  // 1. Audi models: look for A3 8V, A1 8X, A3 8P, A3 8Y, A4 B8, A4 B9, A6 C7, A6 C8 etc.
  if (m.includes('a1') || m.includes('a3') || m.includes('a4') || m.includes('a5') || m.includes('a6')) {
    const audiMatch = t.match(/\b(8v|8p|8y|8x|b8|b9|c7|c8)\b/i);
    if (audiMatch) return audiMatch[0].toLowerCase();
  }

  // 2. Golf models: look for Golf 5, Golf 6, Golf 7, Golf 8, Golf V, Golf VI, Golf VII, Golf VIII
  if (m.includes('golf')) {
    const golfMatch = t.match(/\bgolf\s+(3|4|5|6|7|8|iii|iv|v|vi|vii|viii)\b/i);
    if (golfMatch) return golfMatch[1].toLowerCase();
    
    const spaceMatch = t.match(/\bgolf\s+(\d+)\b/i);
    if (spaceMatch) return spaceMatch[1].toLowerCase();
  }

  // 3. Polo models: Polo 6R, Polo 6C, Polo AW, Polo 9N
  if (m.includes('polo')) {
    const poloMatch = t.match(/\b(6r|6c|aw|9n)\b/i);
    if (poloMatch) return poloMatch[0].toLowerCase();
  }

  // 4. BMW models: 1-serie/3-serie/etc: F20, F21, F30, F31, F34, F36, G20, G30, E46, E90, E91, E92, E39, E60
  const bmwMatch = t.match(/\b(f20|f21|f30|f31|f32|f33|f34|f36|f40|g20|g21|g30|g31|e46|e90|e91|e92|e39|e60)\b/i);
  if (bmwMatch) return bmwMatch[0].toLowerCase();

  // 5. Generic checks: model name + number (e.g. "clio 4", "clio iv", "leon 3")
  const escapedModel = m.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const genericModelRegex = new RegExp(`\\b${escapedModel}\\s+(1|2|3|4|5|vi|v|iv|iii|ii|i)\\b`, 'i');
  const genericModelMatch = t.match(genericModelRegex);
  if (genericModelMatch) return genericModelMatch[1].toLowerCase();

  return "";
}

function isMotorAndTrimMatch(originalText: string, candidateText: string): boolean {
  const orig = originalText.toLowerCase();
  const cand = candidateText.toLowerCase();

  const engineCodes = [
    "t2", "t3", "t4", "t5", "t6", "t8", 
    "d2", "d3", "d4", "d5", 
    "b2", "b3", "b4", "b5", "b6", 
    "p6", "p8", 
    "330e", "520d", "320i", "330i", "530e", 
    "c200", "a180", "e220", "cla200",
    "35", "40", "45", "50",
    "tdi", "tfsi", "tsi", "fsi"
  ];
  
  const hasWord = (text: string, code: string) => {
    const escaped = code.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  };

  // 1. Engine code checking: if original has any engine codes, candidate must have the exact same one.
  const origEngineCode = engineCodes.find(code => hasWord(orig, code));
  if (origEngineCode) {
    if (!hasWord(cand, origEngineCode)) {
      return false;
    }
  }

  // 2. Mutual exclusivity of electric vehicles to avoid mixing Recharge (EV) with regular/hybrid models
  const electricTerms = ["recharge", "electric", "elektrisch", "ev", "p6", "p8"];
  const isOrigElectric = electricTerms.some(term => hasWord(orig, term));
  const isCandElectric = electricTerms.some(term => hasWord(cand, term));
  if (isOrigElectric !== isCandElectric) {
    return false;
  }

  // 3. Performance trims: GTI, GTD, GTE, RS, ST, Cupra, FR, AMG
  const performanceBadges = ["gti", "gtd", "gte", "rs", "st", "cupra", "fr", "amg"];
  const origBadge = performanceBadges.find(badge => hasWord(orig, badge));
  if (origBadge) {
    if (!hasWord(cand, origBadge)) {
      return false;
    }
  }

  return true;
}

function parseKernvariant(variant: string, titel: string, model: string, merk: string): { kern: string; isGenericModelReplacement: boolean } {
  const v = (variant || "").trim().toLowerCase();
  const t = (titel || "").trim().toLowerCase();
  const m = (model || "").trim().toLowerCase();
  const brand = (merk || "").trim().toLowerCase();

  // Combine variant and title
  const combined = `${v} ${t}`.toLowerCase();

  // 1. Check for specific BMW / Mercedes / Audi code patterns
  // Pattern 1: BMW style 3 digits + letter (e.g. 330e, 520d, 320i, 118d, 530e, m340i)
  const bmwRegex = /\b(m?\d{3}[a-z]?)\b/i;
  // Pattern 2: Mercedes style letter + 3 digits (e.g. c200, a180, e220, cla180, gla200, glc250, c300e, e300de)
  const mbRegex = /\b([a-z]{1,3}\d{3}[a-z]?)\b/i;

  let bmwMatch = combined.match(bmwRegex);
  let mbMatch = combined.match(mbRegex);

  // General check for model replacement in search query
  const isGenericModel = m.includes("serie") || m.includes("series") || m.includes("klasse") || m.includes("class") || m.includes("range");

  if (brand.includes("bmw") && bmwMatch) {
    return { kern: bmwMatch[1].toLowerCase(), isGenericModelReplacement: isGenericModel };
  }
  if ((brand.includes("mercedes") || brand.includes("mb")) && mbMatch) {
    return { kern: mbMatch[1].toLowerCase(), isGenericModelReplacement: isGenericModel };
  }

  // 2. Specific known Audi engine designations (e.g., "35 tfsi", "40 tdi", "30 tfsi")
  const audiEngineRegex = /\b(\d{2}\s*(?:tfsi|tdi|fsi))\b/i;
  const audiEngineMatch = combined.match(audiEngineRegex);
  if (brand.includes("audi") && audiEngineMatch) {
    return { kern: audiEngineMatch[1].replace(/\s+/g, '+').toLowerCase(), isGenericModelReplacement: false };
  }

  // 3. Volvo core engine codes (T5, T4, T8, D4, etc.)
  const volvoEngineRegex = /\b([tbdp]\d)\b/i;
  const volvoEngineMatch = combined.match(volvoEngineRegex);
  if (brand.includes("volvo") && volvoEngineMatch) {
    return { kern: volvoEngineMatch[1].toLowerCase(), isGenericModelReplacement: false };
  }

  // 4. Sporty / Specific Badges (GTI, R, RS, Cupra, AMG, ST, GT, FR)
  const specificBadges = ["gti", "gtd", "gte", "r", "rs", "cupra", "st", "gt", "fr", "amg", "r-line", "rline", "s-line", "sline", "m-sport", "msport"];
  for (const badge of specificBadges) {
    const regex = new RegExp(`\\b${badge}\\b`, 'i');
    if (regex.test(combined)) {
      return { kern: badge, isGenericModelReplacement: false };
    }
  }

  // Fallback: If no specific kernvariant is found, look in the variant for the first 1-2 words that are not empty/common
  if (v) {
    const words = v.split(/[\s,|-]+/).map(w => w.trim().toLowerCase()).filter(w => {
      if (w.length <= 1) return false;
      const common = ["pks", "pk", "aut", "automaat", "transmissie", "nap", "bouwjaar", "kleur", "marge", "btw", "garantie", "dealer", "nieuw", "mooie", "zeer", "apk", "leder", "pano", "line", "luxe"];
      return !common.includes(w);
    });
    if (words.length > 0) {
      return { kern: words.slice(0, 2).join("+"), isGenericModelReplacement: false };
    }
  }

  return { kern: "", isGenericModelReplacement: false };
}

function isBrandMatch(itemTitle: string, brand: string): boolean {
  const titleLower = itemTitle.toLowerCase();
  const brandLower = brand.toLowerCase();
  if (titleLower.includes(brandLower)) return true;
  
  if (brandLower === 'mercedes' || brandLower === 'mercedes-benz' || brandLower === 'mercedesbenz') {
    return titleLower.includes('mercedes') || titleLower.includes('benz') || titleLower.includes('m-b');
  }
  if (brandLower === 'volkswagen' || brandLower === 'vw') {
    return titleLower.includes('volkswagen') || titleLower.includes('vw');
  }
  if (brandLower === 'alfa-romeo' || brandLower === 'alfa') {
    return titleLower.includes('alfa') || titleLower.includes('romeo');
  }
  if (brandLower === 'land-rover' || brandLower === 'landrover') {
    return titleLower.includes('land') || titleLower.includes('rover');
  }
  
  const brandWords = brandLower.split(/[\s-]+/).filter(w => w.length > 2);
  if (brandWords.length > 0 && brandWords.some(w => titleLower.includes(w))) {
    return true;
  }
  return false;
}

function isModelMatch(itemTitle: string, model: string): boolean {
  const titleLower = itemTitle.toLowerCase();
  const modelLower = model.toLowerCase();
  
  if (titleLower.includes(modelLower)) return true;
  
  const normTitle = titleLower.replace(/[^a-z0-9]/g, '');
  const normModel = modelLower.replace(/[^a-z0-9]/g, '');
  if (normTitle.includes(normModel)) return true;
  
  const modelWords = modelLower.split(/[\s-]+/).filter(w => w.length > 0 && !['serie', 'klasse', 'class'].includes(w));
  if (modelWords.length > 0) {
    if (modelWords.every(w => titleLower.includes(w))) return true;
  }
  return false;
}

function extractMotorisationKeywords(variant: string, titel: string): string[] {
  const combined = `${variant} ${titel}`.toLowerCase();
  const keywords: string[] = [];
  
  const fuelKeywords = ['phev', 'g-tron', 'e-tron', 'hybrid', 'mhev', 'gti', 'gtd', 'gte', 'gpi', 'amg', 'tdi', 'tsi', 'tfsi', 'dci', 'cdti', 'hdi', 'ecoboost', 'tce', 'puretech', 'e-tech', 'electric', 'ev', 'elektrisch', 'cng', 'lpg', 'fsi', 'vtec'];
  fuelKeywords.forEach(kw => {
    if (combined.includes(kw)) {
      keywords.push(kw);
    }
  });

  const engineMatches = combined.match(/\b\d\.\d\b/g);
  if (engineMatches) {
    engineMatches.forEach(m => keywords.push(m));
  }

  const powerMatches = combined.match(/\b\d{2,3}\s*(?:pk|hp|bhp)\b/gi);
  if (powerMatches) {
    powerMatches.forEach(m => {
      const num = m.match(/\d+/);
      if (num) {
        keywords.push(`${num[0]}pk`);
      }
    });
  }

  if (combined.includes('automaat') || combined.includes('automatic') || combined.includes('dct') || combined.includes('dsg')) {
    keywords.push('automaat');
  } else if (combined.includes('handgeschakeld') || combined.includes('manual') || combined.includes('manueel') || combined.includes('6-bak') || combined.includes('5-bak')) {
    keywords.push('handgeschakeld');
  }

  return keywords;
}

function calculateRelevanceScore(
  candTitel: string,
  candKm: number,
  candJaar: number,
  mainMerk: string,
  mainModel: string,
  mainJaar: number,
  mainKm: number,
  mainKeywords: string[]
): number {
  let score = 100;

  const titleLower = candTitel.toLowerCase();

  // 1. Brand match
  if (!isBrandMatch(candTitel, mainMerk)) {
    score -= 40;
  }

  // 2. Model match
  if (!isModelMatch(candTitel, mainModel)) {
    score -= 30;
  }

  // 3. Year closeness penalty (the larger the diff, the larger the penalty)
  const yearDiff = Math.abs(candJaar - mainJaar);
  if (yearDiff > 0) {
    score -= yearDiff * 15; // -15 for 1 year off, -30 for 2 years off
  }

  // 4. Mileage closeness penalty
  if (mainKm > 0 && candKm > 0) {
    const kmDiff = Math.abs(candKm - mainKm);
    const percentageDiff = kmDiff / mainKm;
    
    if (percentageDiff > 0.4) {
      score -= 30; // Large deviation
    } else if (percentageDiff > 0.2) {
      score -= 15; // Moderate deviation
    } else {
      score += 15; // Highly similar mileage
    }
  }

  // 5. Keyword Matches (Motorization type, transmission, trims)
  let matchingKeywordsCount = 0;
  let mismatchingEngineDisplacement = false;
  let mismatchingTransmission = false;

  mainKeywords.forEach(kw => {
    if (/\d\.\d/.test(kw)) {
      const candEngineMatches: string[] = titleLower.match(/\b\d\.\d\b/g) || [];
      if (candEngineMatches.length > 0 && !candEngineMatches.includes(kw)) {
        mismatchingEngineDisplacement = true;
      } else if (candEngineMatches.includes(kw)) {
        matchingKeywordsCount++;
      }
    } else if (kw === 'automaat') {
      const isCandAutomaat = (titleLower.includes('automaat') || titleLower.includes('automatic') || titleLower.includes('dct') || titleLower.includes('dsg'));
      const isCandManual = (titleLower.includes('handgeschakeld') || titleLower.includes('manual') || titleLower.includes('manueel') || titleLower.includes('bak'));
      if (isCandManual && !isCandAutomaat) {
        mismatchingTransmission = true;
      } else if (isCandAutomaat) {
        matchingKeywordsCount++;
      }
    } else if (kw === 'handgeschakeld') {
      const isCandAutomaat = (titleLower.includes('automaat') || titleLower.includes('automatic') || titleLower.includes('dct') || titleLower.includes('dsg'));
      const isCandManual = (titleLower.includes('handgeschakeld') || titleLower.includes('manual') || titleLower.includes('manueel') || titleLower.includes('bak'));
      if (isCandAutomaat && !isCandManual) {
        mismatchingTransmission = true;
      } else if (isCandManual) {
        matchingKeywordsCount++;
      }
    } else {
      if (titleLower.includes(kw)) {
        matchingKeywordsCount++;
      }
    }
  });

  score += matchingKeywordsCount * 8;

  if (mismatchingEngineDisplacement) {
    score -= 25; // Heavy wrong displacement penalty
  }
  if (mismatchingTransmission) {
    score -= 20; // Heavy wrong transmission penalty
  }

  return score;
}

export async function scrapeVergelijkbaar(
  merk: string,
  model: string,
  jaar: number,
  variant: string = "",
  titel: string = "",
  kilometerstand?: number
): Promise<VergelijkbaarResult[]> {
  if (!merk || !model) {
    console.log("[SCRAPER] Geen merk of model voor vergelijkbaar zoeken");
    return [];
  }

  try {
    const client = getApifyClient();
    const actorId = getActorId();
    
    // Bouw Marktplaats zoek-URL met /q/ zoekpad en merk+model als zoekterm
    const merkLower = merk.trim().toLowerCase();
    const modelLower = model.trim().toLowerCase();

    // Replace non-alphanumeric with hyphens for slug
    // Force strictly the brand word (e.g. "seat" instead of "seat-leon")
    let merkWord = merkLower.split(/\s+|-/)[0];
    let merkSlug = merkWord.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    // Brand overrides
    if (merkSlug === 'mercedes' || merkSlug === 'mercedesbenz') merkSlug = 'mercedes-benz';
    if (merkSlug === 'alfa') merkSlug = 'alfa-romeo';
    if (merkSlug === 'aston') merkSlug = 'aston-martin';
    if (merkSlug === 'land') merkSlug = 'land-rover';
    if (merkSlug === 'vw') merkSlug = 'volkswagen';

    const trimText = (variant || "").trim();
    const titleText = (titel || "").trim();
    const combinedTexts = `${trimText} ${titleText}`.toLowerCase();

    // Parse the kernvariant and model replacement strategy (e.g., replace '3-Serie' with '330e')
    const { kern, isGenericModelReplacement } = parseKernvariant(variant, titel, model, merk);

    // Build priority-based specific query term
    let queryElements: string[] = [merkSlug];
    
    if (isGenericModelReplacement && kern) {
      // Replace the generic model entirely. We just search: brand + kernvariant
      queryElements.push(kern);
    } else {
      // Include the model
      const modelWordsArr = modelLower.split(/[\s-]+/).filter(Boolean);
      modelWordsArr.forEach(w => {
        if (!queryElements.includes(w)) {
          queryElements.push(w);
        }
      });
      
      // Also include the kern if it's not already in there
      if (kern) {
        kern.split('+').forEach(part => {
          if (!queryElements.includes(part)) {
            queryElements.push(part);
          }
        });
      }
    }

    // Construct final clean term
    let queryTerm = queryElements.join('+').replace(/\++/g, '+').replace(/^\+|\+$/g, '');
    
    // Maintain extraWords array for subsequent result filtering
    const extraWords = kern ? kern.split('+') : [];

    const yearFrom = jaar > 1900 ? jaar - 2 : '';
    const yearTo = jaar > 1900 ? jaar + 2 : '';
    
    // Add dynamic mileage filters to modern SPA hash parameters if we have mileage data
    let mileageFilter = "";
    if (typeof kilometerstand === 'number' && kilometerstand > 1000) {
      const mileageFrom = Math.max(0, kilometerstand - 30000);
      const mileageTo = kilometerstand + 30000;
      mileageFilter = `|mileageFrom:${mileageFrom}|mileageTo:${mileageTo}`;
    }
    
    const searchUrl = `https://www.marktplaats.nl/l/auto-s/${merkSlug}/q/${queryTerm}/#constructionYearFrom:${yearFrom}|constructionYearTo:${yearTo}${mileageFilter}`;
    
    console.log(`[SCRAPER] Vergelijkbaar zoeken via URL: ${searchUrl}`);

    const run = await client.actor(actorId).call({
      urls: [{ url: searchUrl }],
      maxRecords: 10
    });

    const datasetClient = client.dataset(run.defaultDatasetId!);
    const { items } = await datasetClient.listItems();

    const vergelijkbaarAll: VergelijkbaarResult[] = items
      .filter((item: any) => {
        const title = (item.title || "").toLowerCase();
        if (!title) return false;

        const blacklist = ['gezocht', 'inkoop', 'onderdelen', 'demontage', 'export', 'defect', 'schade'];
        if (blacklist.some(w => title.includes(w))) return false;
        
        // Betaalde advertenties of auto's zonder prijs negeren (als prijs <= 0)
        const prijs = item.price?.priceCents ? Math.round(item.price.priceCents / 100) : 0;
        if (prijs <= 0) return false;

        return true;
      })
      .map((item: any) => {
        const attrs = item.attributes || {};
        const prijs = item.price?.priceCents ? Math.round(item.price.priceCents / 100) : 0;
        
        let km = parseInt((attrs.mileage || "0").replace(/\./g, '')) || 0;
        const beschrijving = item.description || "";
        if ((km <= 1000 || km === 0) && beschrijving) {
           const fallback = parseFallbackFromDescription(beschrijving);
           if (fallback.kilometerstand > km) km = fallback.kilometerstand;
        }

        const jaarMatch = item.title?.match(/\b(19\d{2}|20\d{2})\b/);
        let parseJaar = parseInt(item.constructionYear || attrs.constructionYear || (jaarMatch ? jaarMatch[1] : "0")) || 0;
        if (parseJaar === 0 && beschrijving) {
           const fallback = parseFallbackFromDescription(beschrijving);
           if (fallback.bouwjaar > 0) parseJaar = fallback.bouwjaar;
        }

        let fullUrl = item.url || "";
        if (fullUrl && !fullUrl.startsWith("http")) {
          fullUrl = "https://www.marktplaats.nl" + fullUrl;
        }
        return {
          titel: item.title || "",
          prijs: prijs,
          km: km,
          jaar: parseJaar,
          url: fullUrl
        };
      });

    // Extract main vehicle parameters
    const mainKeywords = extractMotorisationKeywords(variant, titel);
    console.log(`[SCRAPER] Hoofdauto trefwoorden voor vergelijking:`, mainKeywords);

    // Stricter construction year filtering
    let candidates = vergelijkbaarAll.filter(v => v.jaar > 0 && Math.abs(v.jaar - jaar) <= 2);
    
    const withinOneYear = candidates.filter(v => Math.abs(v.jaar - jaar) <= 1);
    let yearFilteredCandidates = candidates;
    if (withinOneYear.length >= 4) {
      console.log(`[SCRAPER] Strikte bouwjaar filtering: we hebben genoeg resultaten binnen ±1 jaar (${withinOneYear.length}).`);
      yearFilteredCandidates = withinOneYear;
    } else {
      console.log(`[SCRAPER] Mildere bouwjaar filtering: we staan tot ±2 jaar toe (${candidates.length} resultaten).`);
    }

    // Rank and filter candidates based on overall relevance score
    const scoredCandidates = yearFilteredCandidates.map(c => {
      const score = calculateRelevanceScore(
        c.titel,
        c.km,
        c.jaar,
        merk,
        model,
        jaar,
        kilometerstand || 0,
        mainKeywords
      );
      return { item: c, score };
    });

    console.log(`[SCRAPER] Gescoorde resultaten:`, scoredCandidates.map(sc => `${sc.item.titel} (Jaar: ${sc.item.jaar}, Km: ${sc.item.km} -> Score: ${sc.score})`).slice(0, 5));

    // Keep those with high relevance score of at least 40, sorted in descending order
    const highRelevanceCandidates = scoredCandidates
      .filter(sc => sc.score >= 40)
      .sort((a, b) => b.score - a.score)
      .map(sc => sc.item);

    // Fallback if high relevance list too short
    let vergelijkbaar = highRelevanceCandidates;
    if (vergelijkbaar.length < 3) {
      console.log(`[SCRAPER] Te weinig uiterst relevante resultaten (${vergelijkbaar.length}). Fallback naar alle gesorteerde kandidaten.`);
      vergelijkbaar = scoredCandidates
        .sort((a, b) => b.score - a.score)
        .map(sc => sc.item);
    }

    const sliced = vergelijkbaar.slice(0, 10);
    console.log(`[SCRAPER] Uiteindleijk ${sliced.length} vergelijkbare auto's geselecteerd na slimme kwaliteitschecks`);
    return sliced;
  } catch (error) {
    console.error("Fout tijdens scrapeVergelijkbaar:", error);
    return [];
  }
}

export async function scrapeAutoScout24(url: string): Promise<MarktplaatsData | null> {
  try {
    // Strip query parameters and hash to avoid proxy/routing issues with tracking parameters
    try {
      const parsedUrl = new URL(url);
      parsedUrl.search = "";
      parsedUrl.hash = "";
      url = parsedUrl.toString();
    } catch (e) {
      console.warn("[SCRAPER] Kon AutoScout24 URL niet opschonen:", e);
    }

    const client = getApifyClient();
    // Specialized listing scraper: getmediumdata AutoScout24 Scraper
    const actorId = 'H051NEDwSHfMtlc00';

    console.log(`[SCRAPER] Starten AutoScout24 listing scrape (H051NEDwSHfMtlc00) voor: ${url}`);

    const run = await client.actor(actorId).call({
      urls: [{ url }],
      maxRecords: 1
    });

    const datasetClient = client.dataset(run.defaultDatasetId!);
    const { items } = await datasetClient.listItems();
    const item: any = items[0] || {};

    if (!item || (!item.make && !item.title && !item.brand)) {
      console.log("[SCRAPER] Geen data ontvangen van AutoScout24 listing scraper");
      return null;
    }

    console.log("[SCRAPER] AutoScout24 Listing Raw data keys:", Object.keys(item));

    // Handle price robustly
    let price = 0;
    if (typeof item.price === 'number') {
      price = item.price;
    } else if (item.price) {
      price = extractNumber(item.price);
    } else if (item.price_formatted) {
      price = extractNumber(item.price_formatted);
    } else if (item.priceCents) {
      price = Math.round(item.priceCents / 100);
    }
    // Handle mileage robustly
    let rawMilage: any = "";
    if (item.milage !== undefined && item.milage !== null && item.milage !== "") {
      rawMilage = item.milage;
    } else if (item.mileage !== undefined && item.mileage !== null && item.mileage !== "") {
      rawMilage = item.mileage;
    } else if (item.mileageKm !== undefined && item.mileageKm !== null && item.mileageKm !== "") {
      rawMilage = item.mileageKm;
    } else if (item.mileage_km !== undefined && item.mileage_km !== null && item.mileage_km !== "") {
      rawMilage = item.mileage_km;
    } else if (item.mileage_formatted !== undefined && item.mileage_formatted !== null && item.mileage_formatted !== "") {
      rawMilage = item.mileage_formatted;
    }

    let mileage = 0;
    if (typeof rawMilage === 'number') {
      mileage = rawMilage;
    } else if (rawMilage) {
      mileage = extractNumber(rawMilage);
    }
    
    // Parse first registration/construction year
    let firstRegYear = 0;
    const regVal = item.firstRegistration || item.first_registration || item.registration || item.year || item.constructionYear || item.bouwjaar;
    if (typeof regVal === 'number' && regVal > 1900) {
      firstRegYear = regVal;
    } else if (typeof regVal === 'string') {
      if (regVal.includes('/')) {
        const parts = regVal.split('/');
        firstRegYear = parseInt(parts[parts.length - 1]) || 0;
      } else if (regVal.includes('-')) {
        const parts = regVal.split('-');
        const p0 = parseInt(parts[0]) || 0;
        const pN = parseInt(parts[parts.length - 1]) || 0;
        if (p0 > 1900) firstRegYear = p0;
        else if (pN > 1900) firstRegYear = pN;
      } else {
        firstRegYear = parseInt(regVal) || 0;
      }
    }

    let daysOnline = 0;
    const createdVal = item.created_at || item.createdAt || item.date_online || item.onlineSince;
    if (createdVal) {
      try {
        daysOnline = Math.floor((new Date().getTime() - new Date(createdVal).getTime()) / (1000 * 60 * 60 * 24));
      } catch (e) {
        console.warn("[SCRAPER] Kon daysOnline niet berekenen:", e);
      }
    }
    if (daysOnline < 0) daysOnline = 0;

    const description = item.description || item.notes || item.seller_notes || item.beschrijving || "";
    const fallback = parseFallbackFromDescription(description);

    let finalMileage = mileage;
    if ((finalMileage <= 1000 || finalMileage === 0) && fallback.kilometerstand > finalMileage) {
      finalMileage = fallback.kilometerstand;
    }

    let finalYear = firstRegYear;
    if (finalYear === 0 && fallback.bouwjaar > 0) {
      finalYear = fallback.bouwjaar;
    }

    let rawFuel = item.fuel || item.fuelType || item.fuel_type || item.fuel_type_formatted || item.brandstof || "Onbekend";
    let finalBrandstof = "Onbekend";
    if (rawFuel && rawFuel !== "Onbekend") {
      const fLower = String(rawFuel).toLowerCase();
      if (fLower.includes("benzin") || fLower.includes("gasoline") || fLower.includes("petrol")) finalBrandstof = "Benzine";
      else if (fLower.includes("diesel")) finalBrandstof = "Diesel";
      else if (fLower.includes("hybrid") || fLower.includes("hybride") || fLower.includes("phev")) finalBrandstof = "Hybride";
      else if (fLower.includes("electric") || fLower.includes("elektrisch")) finalBrandstof = "Elektrisch";
      else if (fLower.includes("lpg")) finalBrandstof = "LPG";
      else finalBrandstof = String(rawFuel);
    }
    if ((finalBrandstof === "Onbekend" || !finalBrandstof) && fallback.brandstof) {
      finalBrandstof = fallback.brandstof;
    }

    let rawTransmission = item.transmission || item.gearbox || "Onbekend";
    let finalTransmissie = "Onbekend";
    if (rawTransmission && rawTransmission !== "Onbekend") {
      const gLower = String(rawTransmission).toLowerCase();
      if (gLower.includes("man") || gLower.includes("hand") || gLower.includes("versnelling") || gLower.includes("shifter")) finalTransmissie = "Handgeschakeld";
      else if (gLower.includes("auto") || gLower.includes("dsg") || gLower.includes("cvt") || gLower.includes("semi")) finalTransmissie = "Automaat";
      else finalTransmissie = String(rawTransmission);
    }
    if ((finalTransmissie === "Onbekend" || !finalTransmissie) && fallback.transmissie) {
      finalTransmissie = fallback.transmissie;
    }

    let rawBodyType = item.bodyType || item.body_type || item.carrosserie || "";
    let finalCarrosserie = "";
    if (rawBodyType) {
      const bLower = String(rawBodyType).toLowerCase();
      if (bLower.includes("estate") || bLower.includes("station") || bLower.includes("combi")) finalCarrosserie = "Stationwagen";
      else if (bLower.includes("suv") || bLower.includes("offroad")) finalCarrosserie = "SUV";
      else if (bLower.includes("hatchback")) finalCarrosserie = "Hatchback";
      else if (bLower.includes("sedan") || bLower.includes("saloon") || bLower.includes("limousine")) finalCarrosserie = "Sedan";
      else if (bLower.includes("cabrio") || bLower.includes("convertible")) finalCarrosserie = "Cabriolet";
      else if (bLower.includes("coupe") || bLower.includes("coupé")) finalCarrosserie = "Coupé";
      else if (bLower.includes("mpv") || bLower.includes("multi")) finalCarrosserie = "MPV";
      else finalCarrosserie = String(rawBodyType);
    }

    // Handle images
    let fotos: string[] = [];
    const imagesVal = item.images || item.all_images || item.photos || item.gallery || item.gallery_images || [];
    if (Array.isArray(imagesVal)) {
      fotos = imagesVal.map(img => typeof img === 'string' ? img : (img.url || img.src || "")).filter(Boolean);
    } else if (item.main_image) {
      fotos = [item.main_image];
    } else if (item.image) {
      fotos = [item.image];
    }

    const brand = item.mark || item.manufacturer || item.make || item.brand || item.merk || "Onbekend";
    const model = item.model || "Onbekend";

    let sellerName = item.sellerName || item.seller_company || item.seller_contact_name || item.seller || "Onbekend";
    if (typeof sellerName === 'object' && sellerName !== null) {
      sellerName = sellerName.name || sellerName.companyName || sellerName.company || "Onbekend";
    }

    let sellerType = "Particulier";
    const sType = String(item.sellerType || item.seller_type || item.is_dealer || "").toLowerCase();
    if (sType === "dealer" || sType === "trader" || sType === "true" || item.is_dealer === true || sType.includes("dealer") || sType.includes("company") || sType.includes("commercial")) {
      sellerType = "Dealer";
    }

    const listingId = String(item.id || item.listingId || item.listing_id || item.id_raw || "Niet beschikbaar");

    // Map new scraper fields to our MarktplaatsData interface
    let parsedKenteken = String(item.licensePlate || item.license_plate || item.offerNumber || item.offer_number || "").trim();
    if (parsedKenteken) parsedKenteken = parsedKenteken.replace(/[-\s]/g, '').toUpperCase();
    if (!parsedKenteken && fallback.kenteken) {
      parsedKenteken = fallback.kenteken;
    }

    const data: MarktplaatsData = {
      titel: item.title || item.name || item.titel || `${brand} ${model} ${item.version || item.model_version || ""}`.trim(),
      prijs: price,
      beschrijving: description,
      fotos: fotos,
      kenteken: parsedKenteken,
      kilometerstand: finalMileage,
      bouwjaar: finalYear,
      brandstof: finalBrandstof,
      transmissie: finalTransmissie,
      carrosserie: finalCarrosserie,
      merk: brand,
      model: model,
      verkoper: sellerName,
      verkoperType: sellerType,
      verkoperSinds: "Onbekend",
      aantalAdvertenties: 0,
      dagenOnline: daysOnline,
      advertentieId: listingId,
      variant: getVariantFromScrapedData(item)
    };

    console.log(`[SCRAPER] Geëxtraheerd AutoScout24: ${data.titel} | ${data.merk} ${data.model} | ${data.bouwjaar} | ${data.kilometerstand}km | ${data.brandstof}`);

    return data;
  } catch (error) {
    console.error("Fout tijdens scrapeAutoScout24:", error);
    return null;
  }
}

export async function scrapeAutoScout24Vergelijkbaar(merk: string, model: string, jaar: number): Promise<VergelijkbaarResult[]> {
  if (!merk || !model) {
    console.log("[SCRAPER] Geen merk of model voor vergelijkbaar zoeken op AutoScout");
    return [];
  }

  try {
    const client = getApifyClient();
    const actorId = 'jB2a4gY2hmOvmvbSk';

    let makeSlug = merk.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const modelSlug = model.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (modelSlug && makeSlug !== modelSlug) {
      const updatedMakeSlug = makeSlug
        .replace(new RegExp(`(^|-)${modelSlug}(-|$)`, 'g'), '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (updatedMakeSlug) {
        makeSlug = updatedMakeSlug;
      }
    }

    console.log(`[SCRAPER] AutoScout24 vergelijkbaar zoeken (jB2a4gY2hmOvmvbSk) voor make: ${makeSlug}, model: ${modelSlug}`);

    const run = await client.actor(actorId).call({
      make: makeSlug,
      model: modelSlug,
      country: "NL,D",
      yearFrom: jaar > 1900 ? jaar - 2 : undefined,
      yearTo: jaar > 1900 ? jaar + 2 : undefined,
      maxResults: 10,
      sort: "standard"
    });

    const datasetClient = client.dataset(run.defaultDatasetId!);
    const { items } = await datasetClient.listItems();

    const vergelijkbaarAll: VergelijkbaarResult[] = items.map((item: any) => {
      // Parse km/milage/mileage robustly
      let rawKm: any = "";
      if (item.milage !== undefined && item.milage !== null && item.milage !== "") {
        rawKm = item.milage;
      } else if (item.mileage !== undefined && item.mileage !== null && item.mileage !== "") {
        rawKm = item.mileage;
      } else if (item.mileageKm !== undefined && item.mileageKm !== null && item.mileageKm !== "") {
        rawKm = item.mileageKm;
      }

      let km = 0;
      if (typeof rawKm === 'number') {
        km = rawKm;
      } else if (rawKm) {
        km = parseInt(String(rawKm).replace(/[^0-9]/g, '')) || 0;
      }
      
      const beschrijving = item.description || "";
      if ((km <= 1000 || km === 0) && beschrijving) {
          const fallback = parseFallbackFromDescription(beschrijving);
          if (fallback.kilometerstand > km) km = fallback.kilometerstand;
      }

      // Parse price/prijs
      const rawPrijs = item.price !== undefined ? item.price : 0;
      let prijs = 0;
      if (typeof rawPrijs === 'number') {
        prijs = rawPrijs;
      } else if (rawPrijs) {
        prijs = parseInt(String(rawPrijs).replace(/[^0-9]/g, '')) || 0;
      }

      // Parse year/jaar
      let jaarVal = 0;
      const rawYear = item.year !== undefined ? item.year : (item.bouwjaar !== undefined ? item.bouwjaar : (item.firstRegistration ? item.firstRegistration : 0));
      if (typeof rawYear === 'number') {
        jaarVal = rawYear;
      } else if (rawYear) {
        const yearStr = String(rawYear);
        if (yearStr.includes('/')) {
          const parts = yearStr.split('/');
          jaarVal = parseInt(parts[parts.length - 1]) || 0;
        } else if (yearStr.includes('-')) {
          const parts = yearStr.split('-');
          const p0 = parseInt(parts[0]) || 0;
          const pN = parseInt(parts[parts.length - 1]) || 0;
          if (p0 > 1900) jaarVal = p0;
          else if (pN > 1900) jaarVal = pN;
        } else {
          jaarVal = parseInt(yearStr.replace(/[^0-9]/g, '')) || 0;
        }
      }

      return {
        titel: item.title || item.name || item.titel || `${merk} ${model}`,
        prijs: prijs,
        km: km,
        jaar: jaarVal > 0 ? jaarVal : (item.firstRegistration ? parseInt(item.firstRegistration.split('-')[0]) || parseInt(item.firstRegistration.split('/')[1]) || 0 : 0),
        url: item.url || ""
      };
    });

    let vergelijkbaar = vergelijkbaarAll.filter(v => v.jaar === jaar);
    if (vergelijkbaar.length < 10) {
      const additional = vergelijkbaarAll.filter(v => v.jaar !== jaar && Math.abs(v.jaar - jaar) <= 1 && !vergelijkbaar.some(existing => existing.url === v.url));
      vergelijkbaar = [...vergelijkbaar, ...additional];
    }
    if (vergelijkbaar.length < 10) {
      const additional2 = vergelijkbaarAll.filter(v => v.jaar !== jaar && Math.abs(v.jaar - jaar) > 1 && !vergelijkbaar.some(existing => existing.url === v.url));
      vergelijkbaar = [...vergelijkbaar, ...additional2];
    }

    const sliced = vergelijkbaar.slice(0, 10);
    console.log(`[SCRAPER] ${sliced.length} vergelijkbare auto's gevonden via AutoScout24 (jB2a4gY2hmOvmvbSk)`);
    return sliced;
  } catch (error) {
    console.error("Fout tijdens scrapeAutoScout24Vergelijkbaar:", error);
    return [];
  }
}

