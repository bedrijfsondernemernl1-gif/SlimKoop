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
  if (scrapedData.attributes && Array.isArray(scrapedData.attributes)) {
    const attr = scrapedData.attributes.find((a: any) => keys.includes(a.key?.toLowerCase()));
    if (attr) return attr.value;
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
      maxRequestsPerCrawl: 5,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"]
      }
    });

    const datasetClient = client.dataset(run.defaultDatasetId!);
    const { items } = await datasetClient.listItems();
    const scrapedData: any = items[0] || {};

    if (!scrapedData || !scrapedData.title) {
        return null;
    }

    const brand = (scrapedData.brand || getAttribute(scrapedData, ['merk', 'brand']) || "").toString();
    const model = (scrapedData.model || getAttribute(scrapedData, ['model']) || "").toString();
    
    let yearString = scrapedData.year || getAttribute(scrapedData, ['bouwjaar', 'year']) || "0";
    const year = extractNumber(yearString);
    
    let mileageString = scrapedData.mileage || getAttribute(scrapedData, ['kilometerstand', 'km']) || "0";
    const mileage = extractNumber(mileageString);

    const kentekenString = scrapedData.kenteken || getAttribute(scrapedData, ['kenteken']) || "";
    const kentekenStr = kentekenString.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    const transmissie = getAttribute(scrapedData, ['transmissie']) || "";
    const brandstof = getAttribute(scrapedData, ['brandstof']) || "";

    const data: MarktplaatsData = {
      titel: scrapedData.title || "",
      prijs: extractNumber(scrapedData.price?.amount || scrapedData.price || "0"),
      beschrijving: scrapedData.description || "",
      fotos: scrapedData.photos || scrapedData.images || [],
      kenteken: kentekenStr,
      kilometerstand: mileage,
      bouwjaar: year,
      brandstof: brandstof,
      transmissie: transmissie,
      merk: brand,
      model: model,
      verkoper: scrapedData.seller?.name || scrapedData.sellerName || "",
      verkoperSinds: scrapedData.seller?.activeYears || "",
      aantalAdvertenties: extractNumber(scrapedData.seller?.numberOfAds),
      dagenOnline: extractNumber(scrapedData.daysOnline) || 0
    };

    return data;
  } catch (error) {
    console.error("Fout tijdens scrapeMarktplaats:", error);
    return null;
  }
}

export async function scrapeVergelijkbaar(merk: string, model: string, jaar: number): Promise<VergelijkbaarResult[]> {
  try {
    const client = getApifyClient();
    const actorId = getActorId();
    const searchQuery = `${merk} ${model}`;

    const searchRun = await client.actor(actorId).call({
      searchQuery: searchQuery,
      olxDomain: "marktplaats.nl",
      sortBy: "newest",
      maxPages: 1,
      maxRequestsPerCrawl: 5,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"]
      }
    });

    const datasetClient = client.dataset(searchRun.defaultDatasetId!);
    const { items } = await datasetClient.listItems();

    let filteredItems = items;
    if (jaar > 1900) {
      filteredItems = items.filter((item: any) => {
        let itemYearStr = item.year || getAttribute(item, ['bouwjaar', 'year']) || "0";
        let itemYear = extractNumber(itemYearStr);
        if (itemYear === 0) return true;
        return itemYear >= jaar - 2 && itemYear <= jaar + 2;
      });
    }

    const vergelijkbaarResult: VergelijkbaarResult[] = filteredItems.slice(0, 10).map((item: any) => {
      let itemMileageStr = item.mileage || getAttribute(item, ['kilometerstand', 'km']);
      let itemYearStr = item.year || getAttribute(item, ['bouwjaar', 'year']);

      return {
        titel: item.title || item.name || "",
        prijs: extractNumber(item.price?.amount || item.price?.display || item.price),
        km: extractNumber(itemMileageStr),
        jaar: extractNumber(itemYearStr),
        url: item.url || ""
      };
    });

    return vergelijkbaarResult;
  } catch (error) {
    console.error("Fout tijdens scrapeVergelijkbaar:", error);
    return [];
  }
}
