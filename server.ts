import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import { scrapeMarktplaats, scrapeVergelijkbaar, scrapeAutoScout24, scrapeAutoScout24Vergelijkbaar } from './src/lib/apify';
import { checkRDW } from './src/lib/rdw';
import { analyseerdeTekst, analyseerFotos } from './src/lib/ai';

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, updateDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: 'json' };

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const adminDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Sign in server bot
signInWithEmailAndPassword(auth, "admin_server_bot@slimkoop.nl", "ServerSuperPassword123!")
  .then(() => console.log("[SERVER] Logged in as Server Bot for Firestore access."))
  .catch((err) => console.error("[SERVER] Failed to login Server Bot:", err));

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

          const userRef = doc(adminDb, "gebruikers", userId);
          await setDoc(userRef, {
            subscriptionStatus: "active",
            pakket: pakket,
            permissies: permissies,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId || null,
            betaalstatus: session.payment_status,
            laatsteBetaling: serverTimestamp(),
          }, { merge: true }).catch(err => console.error("Admin DB set failed:", err));
          
          return res.json({ success: true, updated: true, pakket, permissies });
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

          const userRef = doc(adminDb, "gebruikers", userId);
          await setDoc(userRef, {
            subscriptionStatus: session.payment_status === "paid" ? "active" : "pending",
            pakket: pakket,
            permissies: permissies,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId || null,
            betaalstatus: session.payment_status,
            laatsteBetaling: serverTimestamp(),
          }, { merge: true });
          
          console.log(`[SERVER] Successfully updated user ${userId} to ${pakket}`);
        }
      } else if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const isCanceledOrDeleted = event.type === "customer.subscription.deleted" || subscription.status === "canceled" || subscription.status === "unpaid" || subscription.cancel_at_period_end;
        
        if (isCanceledOrDeleted) {
          try {
            const q = query(collection(adminDb, "gebruikers"), where("stripeCustomerId", "==", customerId));
            const usersSnapshot = await getDocs(q);
            if (!usersSnapshot.empty) {
              const userDocRef = usersSnapshot.docs[0].ref;
              await setDoc(userDocRef, {
                subscriptionStatus: 'free',
                pakket: 'free',
                permissies: 'free',
                stripeSubscriptionId: null
              }, { merge: true });
              console.log(`[SERVER] Successfully downgraded user ${usersSnapshot.docs[0].id} to free layout because subscription was canceled/deleted`);
            }
          } catch (error) {
             console.error("[SERVER] Error downgrading user after subscription cancel:", error);
          }
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
    if (!url || (!url.includes("marktplaats.nl") && !url.includes("autoscout24"))) {
      return res.status(400).json({ error: "Geldige Marktplaats of AutoScout24 URL is vereist" });
    }

    try {
      console.log(`[SERVER] Start scraping for URL: ${url}`);
      
      let listing;
      let vergelijkbaarPromise;

      if (url.includes('autoscout24')) {
        listing = await scrapeAutoScout24(url);
        if (listing) vergelijkbaarPromise = scrapeAutoScout24Vergelijkbaar(listing.merk, listing.model, listing.bouwjaar);
      } else {
        listing = await scrapeMarktplaats(url);
        if (listing) vergelijkbaarPromise = scrapeVergelijkbaar(listing.merk, listing.model, listing.bouwjaar);
      }

      if (!listing) {
        return res.status(404).json({ error: 'Kon de advertentie niet ophalen.' });
      }

      console.log(`[SERVER] Scraped listing: ${listing.titel}, fetching parallels...`);
      
      const [vergelijkbaar, rdw] = await Promise.all([
        vergelijkbaarPromise || Promise.resolve([]),
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
      const rapportRef = doc(adminDb, 'rapporten', rapportId);
      await updateDoc(rapportRef, {
        ...data,
        ...analyses,
        status: 'compleet',
        updatedAt: serverTimestamp()
      });

      // Sync to analyses collection for dashboard if user is not admin
      if (userId && userId !== "anonymous") {
        await addDoc(collection(adminDb, 'analyses'), {
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

    if (!url || (!url.includes("marktplaats.nl") && !url.includes("autoscout24"))) {
      return res.status(400).json({ error: "Geldige Marktplaats of AutoScout24 URL is vereist" });
    }
    
    // Check permissions / deduct single scans
    if (userId && userId !== "anonymous") {
      try {
        const userDoc = await getDoc(doc(adminDb, "gebruikers", userId));
        if (userDoc.exists()) {
          const data = userDoc.data() as any;
          const adminEmails = ['ibrahimdiscord675@gmail.com', 'sblzakelijk@gmail.com'];
          const isAdmin = adminEmails.includes(data.email || '');
          const pakket = data.pakket || 'free';
          
          if (pakket === "Losse Scan" && !isAdmin) {
            // Revert back to free after using the single scan
            await setDoc(doc(adminDb, "gebruikers", userId), { 
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
      const docRef = await addDoc(collection(adminDb, 'rapporten'), {
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

      const docSnap = await getDoc(doc(adminDb, 'rapporten', rapportId));
      if (!docSnap.exists()) {
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
    const rapportRef = doc(adminDb, 'rapporten', rapportId);
    await updateDoc(rapportRef, { status: 'scraping' });
    console.log(`[SCRAPING] Listing at URL: ${url}`);
    
    let listing;
    let vergelijkbaarPromise;

    if (url.includes('autoscout24')) {
      listing = await scrapeAutoScout24(url);
      if (listing) vergelijkbaarPromise = scrapeAutoScout24Vergelijkbaar(listing.merk, listing.model, listing.bouwjaar);
    } else {
      listing = await scrapeMarktplaats(url);
      if (listing) vergelijkbaarPromise = scrapeVergelijkbaar(listing.merk, listing.model, listing.bouwjaar);
    }

    if (!listing) {
      console.error(`[SCRAPING] Failed for URL: ${url}`);
    await updateDoc(rapportRef, { status: 'fout', error: 'Kon de advertentie niet ophalen.' });
      return;
    }
    
    console.log(`[SCRAPING] Success: ${listing.titel} (${listing.kenteken})`);

    await updateDoc(rapportRef, { 
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
    await updateDoc(rapportRef, { status: 'vergelijken' });
    console.log(`[PARALLEL] Start tasks voor ${listing.kenteken}`);

    const [vergelijkbaar, rdwData, fotoAnalyse] = await Promise.allSettled([
      vergelijkbaarPromise || Promise.resolve([]),
      checkRDW(listing.kenteken),
      analyseerFotos(listing.fotos)
    ]);
    
    const vergelijkbareAutos = vergelijkbaar.status === 'fulfilled' ? vergelijkbaar.value : [];
    const rdw = rdwData.status === 'fulfilled' ? rdwData.value : null;
    const fotos = (fotoAnalyse.status === 'fulfilled' && fotoAnalyse.value) ? fotoAnalyse.value : { fotos: [], ontbrekendeFotos: [] };
    
    console.log(`[PARALLEL] Collected data: ${vergelijkbareAutos.length} parallels, RDW: ${!!rdw}, Fotos: ${fotos.fotos?.length || 0}`);

    // ── FASE 3: GEMINI ANALYSE ──
    await updateDoc(rapportRef, { status: 'analyseren' });
    
    let analyse;
    try {
      console.log("[GEMINI] Calling with key:", process.env.GEMINI_API_KEY ? "SET (" + process.env.GEMINI_API_KEY.substring(0,8) + "...)" : "NOT SET");
      analyse = await analyseerdeTekst(listing, vergelijkbareAutos || []);
      console.log("[GEMINI] Result:", analyse ? `Score: ${analyse.dealScore}` : "NULL - GEEN RESULTAAT");
    } catch (e: any) {
      console.error("[GEMINI] EXCEPTION:", e.message);
      await updateDoc(rapportRef, { 
        status: 'fout', 
        error: `AI Analyse fout: ${e.message}` 
      });
      return;
    }

    if (!analyse) {
      console.error("[GEMINI] No result returned.");
      await updateDoc(rapportRef, { 
        status: 'fout', 
        error: 'Gemini retourneerde geen resultaat. Check API key.' 
      });
      return;
    }

    // ── FASE 4: ALLES OPSLAAN ──
    await updateDoc(rapportRef, { status: 'afronden' });

    await updateDoc(rapportRef, {
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
        await addDoc(collection(adminDb, 'analyses'), {
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
    await updateDoc(doc(adminDb, 'rapporten', rapportId), { 
        status: 'fout', 
        error: error.message || 'Onbekende fout' 
    });
  }
}

startServer();
