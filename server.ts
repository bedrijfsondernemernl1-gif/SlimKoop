import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import { scrapeMarktplaats, scrapeVergelijkbaar } from './src/lib/apify';
import { checkRDW } from './src/lib/rdw';
import { analyseerdeTekst, analyseerFotos } from './src/lib/ai';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, doc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: 'json' };

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const PRICE_IDS = {
  losse_scan: "price_1TWzIHRsJS7Vz7uquwItCZSP",
  slimme_koper: "price_1TWzJoRsJS7Vz7uq0sMvxaLG",
  autohandelaar: "price_1TWzLoRsJS7Vz7uqcB7DF5qQ",
};

async function startServer() {
  const app = express();
  const PORT = 3000;


  app.use(express.json({
    verify: (req, res, buf) => {
        if ((req as any).originalUrl.startsWith('/api/stripe-webhook')) {
            (req as any).rawBody = buf;
        }
    }
  }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/scrape-marktplaats", async (req, res) => {
    const { url } = req.body;
    if (!url || !url.includes("marktplaats.nl")) {
      return res.status(400).json({ error: "Geldige Marktplaats URL is vereist" });
    }

    try {
      console.log(`[SERVER] Start scraping for URL: ${url}`);
      const listing = await scrapeMarktplaats(url);
      if (!listing) {
        return res.status(404).json({ error: 'Kon de advertentie niet ophalen.' });
      }

      console.log(`[SERVER] Scraped listing: ${listing.titel}, fetching parallels...`);
      
      const [vergelijkbaar, rdw] = await Promise.all([
        scrapeVergelijkbaar(listing.merk, listing.model, listing.bouwjaar).catch(() => []),
        checkRDW(listing.kenteken).catch(() => null)
      ]);

      res.json({
        listing,
        vergelijkbareAutos: vergelijkbaar,
        rdwData: rdw
      });

    } catch (error: any) {
      console.error("[SERVER] Scrape error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/save-rapport", async (req, res) => {
    const { rapportId, userId, data, analyses } = req.body;
    
    if (!rapportId) return res.status(400).json({ error: "rapportId is vereist" });

    try {
      const rapportRef = doc(db, 'rapporten', rapportId);
      await updateDoc(rapportRef, {
        ...data,
        ...analyses,
        status: 'compleet',
        updatedAt: serverTimestamp()
      });

      // Sync to analyses collection for dashboard if user is not anonymous
      if (userId && userId !== "anonymous") {
        await addDoc(collection(db, 'analyses'), {
          userId: userId,
          rapportId: rapportId,
          title: data.autoNaam || data.titel,
          price: typeof data.vraagprijs === 'number' ? `€ ${data.vraagprijs.toLocaleString('nl-NL')}` : data.vraagprijs,
          score: analyses?.dealScore || 0,
          img: data.fotos?.[0] || '',
          url: data.url,
          status: 'Voltooid',
          statusColor: 'text-accent-green',
          createdAt: serverTimestamp()
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("[SERVER] Save error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/analyseer", async (req, res) => {
    const { url, userId } = req.body;

    if (!url || !url.includes("marktplaats.nl")) {
      return res.status(400).json({ error: "Geldige Marktplaats URL is vereist" });
    }

    try {
      const docRef = await addDoc(collection(db, 'rapporten'), {
        userId: userId || "anonymous",
        url: url,
        status: "verwerking",
        createdAt: serverTimestamp()
      });

      // Start background process
      voerAnalyseUit(docRef.id, url, userId || "anonymous").catch(console.error);

      return res.json({
        success: true,
        rapportId: docRef.id
      });

    } catch (error: any) {
      console.error("Server processing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/rapport/:id
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url;
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).send("Geen geldige URL");
      }
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(response.status).send("Kan afbeelding niet ophalen");
      }
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", response.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.status(200).send(Buffer.from(buffer));
    } catch (e) {
      console.error(e);
      res.status(500).send("Server fout");
    }
  });

  app.get("/api/rapport/:id", async (req, res) => {
    try {
      const rapportId = req.params.id;
      const { isBetaald } = req.query;
      const isPaid = isBetaald === 'true';

      const docSnap = await getDoc(doc(db, 'rapporten', rapportId));
      if (!docSnap.exists()) {
        return res.status(404).json({ error: "Rapport niet gevonden" });
      }

      const rawData = docSnap.data();

      // Ensure some base fields are always returned, mostly for loading screen
      if (!['verwerking', 'scraping', 'vergelijken', 'analyseren', 'afronden', 'ai_analyseren', 'compleet', 'fout'].includes(rawData.status)) {
        return res.status(400).json({ error: "Ongeldige status" });
      }

      if (!isPaid && rawData.status === 'compleet') {
        // Redact premium fields
        return res.json({
          ...rawData,
          rodeVlaggen: rawData.rodeVlaggen ? rawData.rodeVlaggen.slice(0, 1) : [],
          vergelijkbareAutos: [],
          fotoAnalyse: [],
          onderhandelingsScript: null,
          openingsBod: null,
          onderhandelingsTips: []
        });
      }

      return res.json(rawData);

    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Interne fout" });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
      console.log("Stripe checkout session creation requested:", req.body);
      const { priceId, userId, successUrl, cancelUrl } = req.body;
      
      if (!userId) return res.status(401).json({ error: "Gebruiker niet ingelogd" });
      
      const validPriceIds = Object.values(PRICE_IDS);
      console.log("Valid price IDs:", validPriceIds);
      console.log("Received priceId:", priceId);
      
      if (!priceId || !validPriceIds.includes(priceId)) {
        console.log("Ongeldig pakket:", priceId);
        return res.status(400).json({ error: "Ongeldig pakket" });
      }

      try {
          const session = await stripe.checkout.sessions.create({
              line_items: [{ price: priceId, quantity: 1 }],
              mode: priceId === PRICE_IDS.autohandelaar ? 'subscription' : 'payment',
              payment_method_types: ['card', 'ideal'],
              success_url: successUrl + '?success=true',
              cancel_url: cancelUrl,
              client_reference_id: userId,
              allow_promotion_codes: true,
          });
          console.log("Checkout session created:", session.id);
          res.json({ url: session.url });
      } catch (e: any) {
          console.error("Stripe Checkout Error:", e);
          res.status(500).json({ error: e.message });
      }
  });

  app.post("/api/stripe-webhook", async (req, res) => {
      const sig = req.headers['stripe-signature'];
      let event;
      try {
          event = stripe.webhooks.constructEvent((req as any).rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
      } catch (err: any) {
          return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === 'checkout.session.completed') {
          console.log("Stripe webhook: session completed.");
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id;
          console.log("Stripe webhook: userId from session:", userId);

          if (userId) {
             // Retrieve line items to identify the purchased price
             try {
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                console.log("Stripe webhook: lineItems retrieved:", lineItems.data.length);
                const priceId = lineItems.data[0]?.price?.id;
                console.log("Stripe webhook: priceId:", priceId);
                
                let plan = 'unknown';
                if (priceId === PRICE_IDS.losse_scan) plan = 'Losse Scan';
                if (priceId === PRICE_IDS.slimme_koper) plan = 'Slimme Koper';
                if (priceId === PRICE_IDS.autohandelaar) plan = 'Autohandelaar';
                
                // Update user document to trigger re-fetch and UI change
                console.log("Stripe webhook: Updating user document for:", userId, plan);
                await setDoc(doc(db, 'gebruikers', userId), { 
                    subscriptionPlan: plan,
                    isPremium: true,
                    updatedAt: serverTimestamp()
                }, { merge: true });
                console.log("Stripe webhook: User document updated successfully.");
             } catch (error) {
                 console.error("Stripe webhook error processing session:", error);
             }
          } else {
              console.log("Stripe webhook: userId missing in session.");
          }
      }

      res.json({ received: true });
  });



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

async function voerAnalyseUit(rapportId: string, url: string, userId: string) {
  try {
    // ── FASE 1: SCRAPING ──
    await updateDoc(doc(db, 'rapporten', rapportId), { status: 'scraping' });
    console.log(`[SCRAPING] Listing at URL: ${url}`);
    
    const listing = await scrapeMarktplaats(url);
    if (!listing) {
      console.error(`[SCRAPING] Failed for URL: ${url}`);
      await updateDoc(doc(db, 'rapporten', rapportId), { status: 'fout', error: 'Kon de advertentie niet ophalen.' });
      return;
    }
    
    console.log(`[SCRAPING] Success: ${listing.titel} (${listing.kenteken})`);

    await updateDoc(doc(db, 'rapporten', rapportId), { 
      autoNaam: listing.titel,
      vraagprijs: listing.prijs,
      kilometerstand: listing.kilometerstand,
      bouwjaar: listing.bouwjaar,
      brandstof: listing.brandstof,
      transmissie: listing.transmissie,
      carrosserie: listing.carrosserie,
      merk: listing.merk,
      model: listing.model,
      fotos: listing.fotos,
      verkoper: {
        naam: listing.verkoper,
        sinds: listing.verkoperSinds,
        aantalAdvertenties: listing.aantalAdvertenties,
        type: listing.verkoperType || 'Particulier'
      },
      dagenOnline: listing.dagenOnline,
      kenteken: listing.kenteken
    });

    // ── FASE 2: PARALLEL OPHALEN ──
    await updateDoc(doc(db, 'rapporten', rapportId), { status: 'vergelijken' });
    console.log(`[PARALLEL] Start tasks voor ${listing.kenteken}`);

    const [vergelijkbaar, rdwData, fotoAnalyse] = await Promise.allSettled([
      scrapeVergelijkbaar(listing.merk, listing.model, listing.bouwjaar),
      checkRDW(listing.kenteken),
      analyseerFotos(listing.fotos)
    ]);
    
    const vergelijkbareAutos = vergelijkbaar.status === 'fulfilled' ? vergelijkbaar.value : [];
    const rdw = rdwData.status === 'fulfilled' ? rdwData.value : null;
    const fotos = (fotoAnalyse.status === 'fulfilled' && fotoAnalyse.value) ? fotoAnalyse.value : { fotos: [], ontbrekendeFotos: [] };
    
    console.log(`[PARALLEL] Collected data: ${vergelijkbareAutos.length} parallels, RDW: ${!!rdw}, Fotos: ${fotos.fotos?.length || 0}`);

    // ── FASE 3: GEMINI ANALYSE ──
    await updateDoc(doc(db, 'rapporten', rapportId), { status: 'analyseren' });
    
    let analyse;
    try {
      console.log("[GEMINI] Calling with key:", process.env.GEMINI_API_KEY ? "SET (" + process.env.GEMINI_API_KEY.substring(0,8) + "...)" : "NOT SET");
      analyse = await analyseerdeTekst(listing, vergelijkbareAutos || []);
      console.log("[GEMINI] Result:", analyse ? `Score: ${analyse.dealScore}` : "NULL - GEEN RESULTAAT");
    } catch (e: any) {
      console.error("[GEMINI] EXCEPTION:", e.message);
      await updateDoc(doc(db, 'rapporten', rapportId), { 
        status: 'fout', 
        error: `AI Analyse fout: ${e.message}` 
      });
      return;
    }

    if (!analyse) {
      console.error("[GEMINI] No result returned.");
      await updateDoc(doc(db, 'rapporten', rapportId), { 
        status: 'fout', 
        error: 'Gemini retourneerde geen resultaat. Check API key.' 
      });
      return;
    }

    // ── FASE 4: ALLES OPSLAAN ──
    await updateDoc(doc(db, 'rapporten', rapportId), { status: 'afronden' });

    await updateDoc(doc(db, 'rapporten', rapportId), {
        dealScore: analyse.dealScore || 0,
        verdict: analyse.verdict || 'onbekend',
        eerlijkePrijs: analyse.eerlijkePrijs || 0,
        directeWinst: analyse.directeWinst || 0,
        positievePunten: analyse.positievePunten || [],
        aandachtspunten: analyse.aandachtspunten || [],
        rodeVlaggen: analyse.rodeVlaggen || [],
        advertentieAnalyse: analyse.advertentieAnalyse || null,
        onderhandelingsScript: analyse.onderhandelingsScript || '',
        openingsBod: analyse.openingsBod || 0,
        onderhandelingsTips: analyse.onderhandelingsTips || [],
        samenvatting: analyse.samenvatting || [],
        vergelijkbareAutos: vergelijkbareAutos,
        rdwData: rdw,
        fotoAnalyse: fotos.fotos || [],
        ontbrekendeFotos: fotos.ontbrekendeFotos || [],
        status: 'compleet',
        updatedAt: serverTimestamp()
    });
    
    // Sync to analyses collection for dashboard if user is not anonymous
    if (userId && userId !== "anonymous") {
        await addDoc(collection(db, 'analyses'), {
            userId: userId,
            rapportId: rapportId,
            title: listing.titel,
            price: `€ ${listing.prijs.toLocaleString('nl-NL')}`,
            score: analyse.dealScore || 0,
            img: listing.fotos?.[0] || '',
            url: url,
            status: 'Voltooid',
            statusColor: 'text-accent-green',
            createdAt: serverTimestamp()
        });
    }
    
    console.log(`[FINISH] Rapport ${rapportId} succesvol afgerond.`);

  } catch (error: any) {
    console.error("[ERROR] In background task:", error);
    await updateDoc(doc(db, 'rapporten', rapportId), { 
        status: 'fout', 
        error: error.message || 'Onbekende fout' 
    });
  }
}

startServer();
