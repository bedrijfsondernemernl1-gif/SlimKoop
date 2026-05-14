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
  verkoperSinds: string;
  aantalAdvertenties: number;
  dagenOnline: number;
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
  return process.env.APIFY_ACTOR_ID || 'daddyapi/marktplaats-scraper';
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
      startUrls: [{ url }],
      olxDomain: "marktplaats.nl",
      maxRequestsPerCrawl: 20,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"]
      }
    });

    const datasetClient = client.dataset(run.defaultDatasetId!);
    const { items } = await datasetClient.listItems();
    const scrapedData: any = items[0] || {};

    if (!scrapedData || (!scrapedData.title && !scrapedData.name)) {
        return null;
    }

    let brand = (scrapedData.brand || getAttribute(scrapedData, ['merk', 'brand']) || "").toString();
    let model = (scrapedData.model || getAttribute(scrapedData, ['model']) || "").toString();
    
    // Fallback naar titel als merk/model ontbreken
    const title = (scrapedData.title || scrapedData.name || "").toLowerCase();
    if (!brand || !model) {
      const commonBrands = ['volkswagen', 'bmw', 'audi', 'mercedes', 'opel', 'ford', 'peugeot', 'renault', 'toyota', 'volvo', 'fiat', 'citroen', 'hyundai', 'kia', 'mazda', 'nissan', 'seat', 'skoda', 'suzuki', 'tesla'];
      
      const foundBrand = commonBrands.find(b => title.includes(b));
      if (foundBrand && !brand) {
        brand = foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1);
      }
    }

    let yearString = scrapedData.year || getAttribute(scrapedData, ['bouwjaar', 'year', 'datum eerste toelating']) || "0";
    const year = extractNumber(yearString);
    
    let mileageString = scrapedData.mileage || getAttribute(scrapedData, ['kilometerstand', 'km', 'odo', 'tellerstand']) || "0";
    const mileage = extractNumber(mileageString);

    const kentekenString = scrapedData.kenteken || getAttribute(scrapedData, ['kenteken', 'license plate', 'kentekenbewijs', 'plaat']) || "";
    const kentekenStr = kentekenString.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    const transmissie = getAttribute(scrapedData, ['transmissie', 'transmission', 'geschakeld', 'bak', 'automaat', 'handgeschakeld']) || "Onbekend";
    const brandstof = getAttribute(scrapedData, ['brandstof', 'fuel', 'benzine', 'diesel', 'hybride', 'elektrisch']) || "Onbekend";
    const carrosserie = getAttribute(scrapedData, ['carrosserie', 'body', 'carrosserievorm', 'type', 'vkv']) || "Onbekend";

    // Verkoper info
    const seller = scrapedData.seller || {};
    const verkoperNaam = seller.name || scrapedData.sellerName || getAttribute(scrapedData, ['verkoper', 'seller', 'naam', 'handelsnaam']) || "Onbekend";
    const verkoperTypeRaw = (seller.type || getAttribute(scrapedData, ['type', 'soort', 'verkopertype']) || "").toLowerCase();
    
    // Verbeterde dealer check
    const isDealer = verkoperTypeRaw.includes('dealer') || 
                     verkoperTypeRaw.includes('bedrijf') || 
                     scrapedData.description?.toLowerCase().includes('garantie') || 
                     scrapedData.description?.toLowerCase().includes('showroom') ||
                     title.includes('dealer');
                     
    const verkoperType = isDealer ? 'Dealer' : 'Particulier';
    const lidSinds = seller.activeYears || seller.memberSince || getAttribute(scrapedData, ['lid sinds', 'actief sinds', 'member since']) || "Onbekend";
    const aantalAds = extractNumber(seller.numberOfAds || scrapedData.sellerAdsCount || getAttribute(scrapedData, ['aantal advertenties', 'actieve advertenties']));

    const photosRaw = scrapedData.photos || scrapedData.images || [];
    const fotos = (Array.isArray(photosRaw) ? photosRaw.map(p => typeof p === 'string' ? p : (p.url || p.original || p.large)) : []).filter(Boolean).slice(0, 15);

    const data: MarktplaatsData = {
      titel: scrapedData.title || scrapedData.name || "",
      prijs: extractNumber(scrapedData.price?.amount || scrapedData.price?.display || scrapedData.price || "0"),
      beschrijving: scrapedData.description || "",
      fotos: fotos,
      kenteken: kentekenStr,
      kilometerstand: mileage,
      bouwjaar: year,
      brandstof: brandstof,
      transmissie: transmissie,
      carrosserie: carrosserie,
      merk: brand || "Onbekend",
      model: model || "Onbekend",
      verkoper: verkoperNaam,
      verkoperSinds: lidSinds,
      aantalAdvertenties: aantalAds,
      dagenOnline: extractNumber(scrapedData.daysOnline || getAttribute(scrapedData, ['dagen online'])) || 0
    };

    console.log(`[SCRAPER] Gegevens geëxtraheerd voor: ${data.titel} (${data.kenteken})`);
    return data;
  } catch (error) {
    console.error("Fout tijdens scrapeMarktplaats:", error);
    return null;
  }
}

export async function scrapeVergelijkbaar(merk: string, model: string, jaar: number): Promise<VergelijkbaarResult[]> {
  const query = `${merk || ""} ${model || ""}`.trim();
  if (!query) {
    console.log("Geen merk of model gevonden voor vergelijkbaar zoeken, sla over.");
    return [];
  }

  try {
    const client = getApifyClient();
    const actorId = getActorId();
    // Zorg voor strikte zoekopdracht: Merk + Model
    const searchQuery = `${merk} ${model}`;
    
    console.log(`[SCRAPER] Strikt zoeken naar vergelijkbare auto's: "${searchQuery}"`);

    const searchRun = await client.actor(actorId).call({
      searchQuery: searchQuery,
      olxDomain: "marktplaats.nl",
      sortBy: "relevance",
      maxPages: 1,
      maxRequestsPerCrawl: 40,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"]
      }
    });

    const datasetClient = client.dataset(searchRun.defaultDatasetId!);
    const { items } = await datasetClient.listItems();

    // Filteren op echte advertenties en jaar én merk/model in titel
    const filteredItems = items.filter((item: any) => {
      const title = (item.title || item.name || "").toLowerCase();
      const merkLower = (merk || "").toLowerCase();
      const modelLower = (model || "").toLowerCase();

      // Moet merk en model bevatten (of op zijn minst model als merk te generiek is)
      if (merkLower && !title.includes(merkLower)) return false;
      if (modelLower && !title.includes(modelLower)) return false;
      
      // Filter "Van je ... af?" advertenties en andere onzin
      const blacklist = ['af?', 'inkoop', 'gezocht', 'verkopen', 'gezocht', 'onderdelen', 'auto inkoop', 'demontage'];
      if (blacklist.some(word => title.includes(word))) {
        return false;
      }
      
      if (jaar > 1900) {
        let itemYearStr = item.year || getAttribute(item, ['bouwjaar', 'year']) || "0";
        let itemYear = extractNumber(itemYearStr);
        if (itemYear === 0) return true;
        // Strict jaar bereik
        return itemYear >= jaar - 2 && itemYear <= jaar + 2;
      }
      return true;
    });

    const vergelijkbaarResult: VergelijkbaarResult[] = filteredItems.slice(0, 10).map((item: any) => {
      let itemMileageStr = item.mileage || getAttribute(item, ['kilometerstand', 'km']);
      let itemYearStr = item.year || getAttribute(item, ['bouwjaar', 'year']);

      let fullUrl = item.url || "";
      if (fullUrl && !fullUrl.startsWith("http")) {
        fullUrl = "https://www.marktplaats.nl" + (fullUrl.startsWith("/") ? "" : "/") + fullUrl;
      }
      return {
        titel: item.title || item.name || "",
        prijs: extractNumber(item.price?.amount || item.price?.display || item.price),
        km: extractNumber(itemMileageStr),
        jaar: extractNumber(itemYearStr),
        url: fullUrl
      };
    });

    return vergelijkbaarResult;
  } catch (error) {
    console.error("Fout tijdens scrapeVergelijkbaar:", error);
    return [];
  }
}
