import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import { scrapeMarktplaats, scrapeVergelijkbaar } from './src/lib/apify';
import { checkRDW } from './src/lib/rdw';
import { analyseerdeTekst, analyseerFotos } from './src/lib/ai';

import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json" with { type: 'json' };

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    credential: admin.credential.applicationDefault()
  });
}
const adminDb = admin.firestore();
adminDb.settings({ databaseId: firebaseConfig.firestoreDatabaseId });

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

  app.get("/api/verify-checkout-session", async (req, res) => {
    const { session_id } = req.query;
    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ error: "Missing session_id" });
    }
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid") {
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          let pakket = "free";
          let permissies = "free";

          if (priceId === "price_1TWzIHRsJS7Vz7uquwItCZSP") {
            pakket = "Losse Scan";
            permissies = "losse_scan";
          } else if (priceId === "price_1TWzJoRsJS7Vz7uq0sMvxaLG") {
            pakket = "Slimme Koper";
            permissies = "slimme_koper";
          } else if (priceId === "price_1TWzLoRsJS7Vz7uqcB7DF5qQ") {
            pakket = "Autohandelaar";
            permissies = "autohandelaar";
          }

          const userRef = adminDb.collection("gebruikers").doc(userId);
          await userRef.set({
            subscriptionStatus: "active",
            pakket: pakket,
            permissies: permissies,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId || null,
            betaalstatus: session.payment_status,
            laatsteBetaling: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          
          return res.json({ success: true, updated: true, pakket });
        }
      }
      res.json({ success: true, updated: false });
    } catch (err: any) {
      console.error("[SERVER] Verify session error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    const { priceId, userId, userEmail, mode } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // 1. Get or create customer in Stripe
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      let customerId = customers.data.length > 0 ? customers.data[0].id : null;

      if (!customerId) {
        const newCustomer = await stripe.customers.create({
          email: userEmail,
          metadata: { userId },
        });
        customerId = newCustomer.id;
      }

      // 2. Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "ideal"],
        mode: mode === "subscription" ? "subscription" : "payment",
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${req.headers.origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/#prijzen`,
        allow_promotion_codes: true,
        metadata: {
          userId,
          priceId,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("[SERVER] Stripe checkout error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;
    let event;

    try {
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(
          (req as any).rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } else {
        // Fallback if no webhook secret (not recommended for production)
        event = JSON.parse((req as any).rawBody.toString());
      }
    } catch (err: any) {
      console.error("[SERVER] Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          let pakket = "free";
          let permissies = "free";

          if (priceId === "price_1TWzIHRsJS7Vz7uquwItCZSP") {
            pakket = "Losse Scan";
            permissies = "losse_scan";
          } else if (priceId === "price_1TWzJoRsJS7Vz7uq0sMvxaLG") {
            pakket = "Slimme Koper";
            permissies = "slimme_koper";
          } else if (priceId === "price_1TWzLoRsJS7Vz7uqcB7DF5qQ") {
            pakket = "Autohandelaar";
            permissies = "autohandelaar";
          }

          const userRef = adminDb.collection("gebruikers").doc(userId);
          await userRef.set({
            subscriptionStatus: session.payment_status === "paid" ? "active" : "pending",
            pakket: pakket,
            permissies: permissies,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId || null,
            betaalstatus: session.payment_status,
            laatsteBetaling: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          
          console.log(`[SERVER] Successfully updated user ${userId} to ${pakket}`);
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("[SERVER] Webhook error:", error);
      res.status(500).json({ error: "Webhook handler failed" });
    }
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
      const rapportRef = adminDb.collection('rapporten').doc(rapportId);
      await rapportRef.update({
        ...data,
        ...analyses,
        status: 'compleet',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Sync to analyses collection for dashboard if user is not admin
      if (userId && userId !== "anonymous") {
        await adminDb.collection('analyses').add({
          userId: userId,
          rapportId: rapportId,
          title: data.autoNaam || data.titel,
          price: typeof data.vraagprijs === 'number' ? `€ ${data.vraagprijs.toLocaleString('nl-NL')}` : data.vraagprijs,
          score: analyses?.dealScore || 0,
          img: data.fotos?.[0] || '',
          url: data.url,
          status: 'Voltooid',
          statusColor: 'text-accent-green',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
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
    
    // Check permissions / deduct single scans
    if (userId && userId !== "anonymous") {
      try {
        const userDoc = await adminDb.collection("gebruikers").doc(userId).get();
        if (userDoc.exists) {
          const data = userDoc.data() as any;
          const adminEmails = ['ibrahimdiscord675@gmail.com', 'sblzakelijk@gmail.com'];
          const isAdmin = adminEmails.includes(data.email || '');
          const pakket = data.pakket || 'free';
          
          if (pakket === "Losse Scan" && !isAdmin) {
            // Revert back to free after using the single scan
            await adminDb.collection("gebruikers").doc(userId).set({ 
              pakket: 'free', 
              permissies: 'free', 
              subscriptionStatus: 'free' 
            }, { merge: true });
          }
        }
      } catch (e) {
        console.error("Error checking permissions", e);
      }
    }

    try {
      const docRef = await adminDb.collection('rapporten').add({
        userId: userId || "anonymous",
        url: url,
        status: "verwerking",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
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

      const docSnap = await adminDb.collection('rapporten').doc(rapportId).get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Rapport niet gevonden" });
      }

      const rawData = docSnap.data() as any;

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
    const rapportRef = adminDb.collection('rapporten').doc(rapportId);
    await rapportRef.update({ status: 'scraping' });
    console.log(`[SCRAPING] Listing at URL: ${url}`);
    
    const listing = await scrapeMarktplaats(url);
    if (!listing) {
      console.error(`[SCRAPING] Failed for URL: ${url}`);
      await rapportRef.update({ status: 'fout', error: 'Kon de advertentie niet ophalen.' });
      return;
    }
    
    console.log(`[SCRAPING] Success: ${listing.titel} (${listing.kenteken})`);

    await rapportRef.update({ 
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
      advertentieId: listing.advertentieId,
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
    await rapportRef.update({ status: 'vergelijken' });
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
    await rapportRef.update({ status: 'analyseren' });
    
    let analyse;
    try {
      console.log("[GEMINI] Calling with key:", process.env.GEMINI_API_KEY ? "SET (" + process.env.GEMINI_API_KEY.substring(0,8) + "...)" : "NOT SET");
      analyse = await analyseerdeTekst(listing, vergelijkbareAutos || []);
      console.log("[GEMINI] Result:", analyse ? `Score: ${analyse.dealScore}` : "NULL - GEEN RESULTAAT");
    } catch (e: any) {
      console.error("[GEMINI] EXCEPTION:", e.message);
      await rapportRef.update({ 
        status: 'fout', 
        error: `AI Analyse fout: ${e.message}` 
      });
      return;
    }

    if (!analyse) {
      console.error("[GEMINI] No result returned.");
      await rapportRef.update({ 
        status: 'fout', 
        error: 'Gemini retourneerde geen resultaat. Check API key.' 
      });
      return;
    }

    // ── FASE 4: ALLES OPSLAAN ──
    await rapportRef.update({ status: 'afronden' });

    await rapportRef.update({
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
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Sync to analyses collection for dashboard if user is not anonymous
    if (userId && userId !== "anonymous") {
        await adminDb.collection('analyses').add({
            userId: userId,
            rapportId: rapportId,
            title: listing.titel,
            price: `€ ${listing.prijs.toLocaleString('nl-NL')}`,
            score: analyse.dealScore || 0,
            img: listing.fotos?.[0] || '',
            url: url,
            status: 'Voltooid',
            statusColor: 'text-accent-green',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    
    console.log(`[FINISH] Rapport ${rapportId} succesvol afgerond.`);

  } catch (error: any) {
    console.error("[ERROR] In background task:", error);
    await adminDb.collection('rapporten').doc(rapportId).update({ 
        status: 'fout', 
        error: error.message || 'Onbekende fout' 
    });
  }
}

startServer();
