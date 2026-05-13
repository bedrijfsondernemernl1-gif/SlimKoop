import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { scrapeMarktplaats, scrapeVergelijkbaar } from './src/lib/apify';
import { checkRDW } from './src/lib/rdw';
import { analyseerdeTekst, analyseerFotos } from './src/lib/ai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/analyze", async (req, res) => {
    const { url, userId } = req.body;

    if (!url || !url.includes("marktplaats.nl")) {
      return res.status(400).json({ error: "Geldige Marktplaats URL is vereist" });
    }

    try {
      console.log(`Scraping listing at URL: ${url}`);
      const scrapedData = await scrapeMarktplaats(url);
      if (!scrapedData) {
        return res.status(404).json({ error: "Kon de advertentie niet ophalen." });
      }

      console.log(`Scraping comparables for: ${scrapedData.merk} ${scrapedData.model} (${scrapedData.bouwjaar})`);
      let comparables: any[] = [];
      if (scrapedData.merk && scrapedData.model) {
        comparables = await scrapeVergelijkbaar(scrapedData.merk, scrapedData.model, scrapedData.bouwjaar);
      }

      console.log(`Checking RDW for: ${scrapedData.kenteken}`);
      let rdwData: any = null;
      if (scrapedData.kenteken) {
        const rdwRes = await checkRDW(scrapedData.kenteken);
        if (rdwRes && rdwRes.succes) {
          rdwData = rdwRes;
        }
      }

      console.log(`Running AI Analysis...`);
      const [aiTextResult, aiPhotoResult] = await Promise.all([
        analyseerdeTekst(scrapedData, comparables),
        analyseerFotos(scrapedData.fotos)
      ]);

      return res.json({
        success: true,
        data: scrapedData,
        photoUrls: scrapedData.fotos,
        comparables: comparables, 
        analyse: aiTextResult || {},
        fotoAnalyse: aiPhotoResult || { fotos: [], ontbrekendeFootos: [] },
        rdwData: rdwData,
        kenteken: scrapedData.kenteken
      });

    } catch (error: any) {
      console.error("Server processing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
