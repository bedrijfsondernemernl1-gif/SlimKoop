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

export async function scrapeMarktplaats(url: string): Promise<MarktplaatsData | null> {
  try {
    const client = getApifyClient();
    const actorId = getActorId();

    const run = await client.actor(actorId).call({
      urls: [{ url }],
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
    const kenteken = (scrapedData.licensePlate || "").replace(/[-\s]/g, '').toUpperCase();
    
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

    // Extract advertentieId van URL (begint vaak met 'm' gevolgd door nummers in the path)
    let advertentieId = "Niet beschikbaar";
    const m = url.match(/\/([ma]\d{9,10})-/i) || url.match(/([ma]\d{9,10})/i);
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
      kenteken: kenteken,
      kilometerstand: mileage,
      bouwjaar: year,
      brandstof: brandstof,
      transmissie: transmissie,
      carrosserie: carrosserie,
      merk: brand || "Onbekend",
      model: model || "Onbekend",
      verkoper: verkoperNaam,
      verkoperType: verkoperType,
      verkoperSinds: lidSinds,
      aantalAdvertenties: aantalAds,
      dagenOnline: dagenOnline,
      advertentieId: advertentieId
    };

    console.log(`[SCRAPER] Geëxtraheerd: ${data.titel} | ${data.merk} ${data.model} | ${data.bouwjaar} | ${data.kilometerstand}km | ${data.kenteken} | ${data.brandstof}`);
    return data;
  } catch (error) {
    console.error("Fout tijdens scrapeMarktplaats:", error);
    return null;
  }
}

export async function scrapeVergelijkbaar(merk: string, model: string, jaar: number): Promise<VergelijkbaarResult[]> {
  if (!merk || !model) {
    console.log("[SCRAPER] Geen merk of model voor vergelijkbaar zoeken");
    return [];
  }

  try {
    const client = getApifyClient();
    const actorId = getActorId();
    
    // Bouw Marktplaats zoek-URL
    const merkSlug = merk.toLowerCase().replace(/\s+/g, '-');
    const modelSearch = encodeURIComponent(model.toLowerCase());
    const yearFrom = jaar > 1900 ? jaar - 1 : '';
    const yearTo = jaar > 1900 ? jaar + 1 : '';
    
    const searchUrl = `https://www.marktplaats.nl/l/auto-s/${merkSlug}/#f:10882|offeredSince:Altijd|constructionYearFrom:${yearFrom}|constructionYearTo:${yearTo}|searchInTitleAndDescription:true|searchQuery:${modelSearch}`;
    
    console.log(`[SCRAPER] Vergelijkbaar zoeken via URL: ${searchUrl}`);

    const run = await client.actor(actorId).call({
      urls: [{ url: searchUrl }],
      maxRecords: 10
    });

    const datasetClient = client.dataset(run.defaultDatasetId!);
    const { items } = await datasetClient.listItems();

    const modelWords = model.toLowerCase().split(' ').filter(w => w.length > 1);

    const vergelijkbaar: VergelijkbaarResult[] = items
      .filter((item: any) => {
        // Filter niet-relevante items
        const title = (item.title || "").toLowerCase();
        
        // Moet modelnaam bevatten (om brede Marktplaats zoekresultaten af te vangen)
        const cleanTitle = title.replace(/-/g, ' ');
        if (modelWords.length > 0 && !modelWords.every(w => cleanTitle.includes(w))) {
            return false;
        }

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
        const km = parseInt((attrs.mileage || "0").replace(/\./g, '')) || 0;
        const jaarMatch = item.title?.match(/\b(19\d{2}|20\d{2})\b/);
        const parseJaar = parseInt(item.constructionYear || attrs.constructionYear || (jaarMatch ? jaarMatch[1] : "0")) || 0;
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

    const sliced = vergelijkbaar.slice(0, 10);
    console.log(`[SCRAPER] ${sliced.length} vergelijkbare auto's gevonden`);
    return sliced;
  } catch (error) {
    console.error("Fout tijdens scrapeVergelijkbaar:", error);
    return [];
  }
}

export async function scrapeAutoScout24(url: string): Promise<MarktplaatsData | null> {
  try {
    const client = getApifyClient();
    // Specialized listing scraper: fayoussef/autoscout24
    const actorId = 'kxvqbfZknFYLcVyfx';

    console.log(`[SCRAPER] Starten AutoScout24 listing scrape voor: ${url}`);

    const run = await client.actor(actorId).call({
      start_urls: [{ url }],
      max_concurrency: 1,
      proxy_url: ""
    });

    const datasetClient = client.dataset(run.defaultDatasetId!);
    const { items } = await datasetClient.listItems();
    const item: any = items[0] || {};

    if (!item || (!item.make && !item.title)) {
      console.log("[SCRAPER] Geen data ontvangen van AutoScout24 listing scraper");
      return null;
    }

    console.log("[SCRAPER] AutoScout24 Listing Raw data keys:", Object.keys(item));

    const price = item.price || 0;
    const mileage = extractNumber(item.mileage_formatted || item.mileage_km) || 0;
    
    // Parse first registration (format usually "MM/YYYY")
    let firstRegYear = 0;
    if (item.first_registration) {
      const parts = item.first_registration.split('/');
      firstRegYear = parseInt(parts[parts.length - 1]) || 0;
    }

    let daysOnline = 0;
    if (item.created_at) {
       daysOnline = Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
    }

    // Map new scraper fields to our MarktplaatsData interface
    const data: MarktplaatsData = {
      titel: `${item.make} ${item.model} ${item.model_version || ""}`.trim(),
      prijs: price,
      beschrijving: item.description || "",
      fotos: item.all_images || (item.main_image ? [item.main_image] : []),
      kenteken: "", // AutoScout has no license plate
      kilometerstand: mileage,
      bouwjaar: firstRegYear,
      brandstof: item.fuel_type_formatted || item.fuel_type || "Onbekend",
      transmissie: item.transmission === "Manual" ? "Handgeschakeld" : (item.transmission === "Automatic" ? "Automaat" : item.transmission || "Onbekend"),
      carrosserie: item.body_type || "",
      merk: item.make || "Onbekend",
      model: item.model || "Onbekend",
      verkoper: item.seller_company || item.seller_contact_name || "Onbekend",
      verkoperType: item.seller_type === "Dealer" || item.is_dealer ? "Dealer" : "Particulier",
      verkoperSinds: "Onbekend",
      aantalAdvertenties: 0,
      dagenOnline: daysOnline,
      advertentieId: String(item.listing_id || "Niet beschikbaar")
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
    const actorId = 'Dckez3uXbF6dh6dMe';

    const makeSlug = merk.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = model.toLowerCase().replace(/\s+/g, '-');

    const run = await client.actor(actorId).call({
      make: makeSlug,
      model: modelSlug,
      countries: ["NL"],
      yearFrom: jaar > 1900 ? jaar - 1 : undefined,
      yearTo: jaar > 1900 ? jaar + 1 : undefined,
      maxResults: 10,
      compact: true
    });

    const datasetClient = client.dataset(run.defaultDatasetId!);
    const { items } = await datasetClient.listItems();

    const vergelijkbaar: VergelijkbaarResult[] = items.map((item: any) => ({
      titel: item.title || "",
      prijs: parseInt(item.price) || 0,
      km: parseInt(item.mileageKm) || 0,
      jaar: item.firstRegistration ? parseInt(item.firstRegistration.split('-')[0]) || parseInt(item.firstRegistration.split('/')[1]) || 0 : 0,
      url: item.url || ""
    }));

    const sliced = vergelijkbaar.slice(0, 10);
    console.log(`[SCRAPER] ${sliced.length} vergelijkbare auto's gevonden via AutoScout24`);
    return sliced;
  } catch (error) {
    console.error("Fout tijdens scrapeAutoScout24Vergelijkbaar:", error);
    return [];
  }
}
