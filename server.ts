import "dotenv/config";
import express from "express";
import path from "path";
import Stripe from "stripe";
import { scrapeMarktplaats, scrapeVergelijkbaar, scrapeAutoScout24, scrapeAutoScout24Vergelijkbaar } from './src/lib/apify';
import { checkRDW } from './src/lib/rdw';
import { analyseerdeTekst, analyseerFotos } from './src/lib/ai';

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, updateDoc, query, where, getDocs, serverTimestamp, increment } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: 'json' };

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const adminDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Sign in server bot
import { createUserWithEmailAndPassword } from "firebase/auth";

signInWithEmailAndPassword(auth, "admin_server_bot@occasionscan.nl", "ServerSuperPassword123!")
  .then(() => console.log("[SERVER] Logged in as Server Bot for Firestore access."))
  .catch((err) => {
    console.error("[SERVER] Failed to login Server Bot, attempting to create...", err.message);
    createUserWithEmailAndPassword(auth, "admin_server_bot@occasionscan.nl", "ServerSuperPassword123!")
      .then(() => console.log("[SERVER] Created and logged in as Server Bot."))
      .catch(createErr => console.error("[SERVER] Could not create Server Bot:", createErr.message));
  });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const PRICE_IDS = {
  losse_scan: "price_1TWzIHRsJS7Vz7uquwItCZSP",
  slimme_koper: "price_1TWzJoRsJS7Vz7uq0sMvxaLG",
  autohandelaar: "price_1TWzLoRsJS7Vz7uqcB7DF5qQ",
};

const app = express();

const PORT = Number(process.env.PORT) || 3000;


  app.use(express.json({
    verify: (req, res, buf) => {
        if ((req as any).originalUrl.startsWith('/api/stripe-webhook')) {
            (req as any).rawBody = buf;
        }
    }
  }));

  app.get(["/api/verify-checkout-session", "/verify-checkout-session"], async (req, res) => {
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
            scansGebruikt: 0,
            scanLimiet: permissies === 'losse_scan' ? 1 : (permissies === 'slimme_koper' ? 3 : 999),
            scansOver: permissies === 'losse_scan' ? 1 : (permissies === 'slimme_koper' ? 3 : 999)
          }, { merge: true });
          
          return res.json({ success: true, updated: true, pakket, permissies });
        }
      }
      res.json({ success: true, updated: false });
    } catch (err: any) {
      console.error("[SERVER] Verify session error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post(["/api/create-checkout-session", "/create-checkout-session"], async (req, res) => {
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

  app.post(["/api/stripe-webhook", "/stripe-webhook"], express.raw({ type: "application/json" }), async (req, res) => {
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
            scansGebruikt: 0,
            scanLimiet: permissies === 'losse_scan' ? 1 : (permissies === 'slimme_koper' ? 3 : 999),
            scansOver: permissies === 'losse_scan' ? 1 : (permissies === 'slimme_koper' ? 3 : 999)
          }, { merge: true });
          
          console.log(`[SERVER] Successfully updated user ${userId} to ${pakket}`);
        }
      } else if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const isCanceledOrDeleted = event.type === "customer.subscription.deleted" || subscription.status === "canceled" || subscription.status === "unpaid" || subscription.cancel_at_period_end;
        
        if (isCanceledOrDeleted) {
          try {
            const q = query(collection(adminDb, 'gebruikers'), where('stripeCustomerId', '==', customerId));
            const usersSnapshot = await getDocs(q);
            if (!usersSnapshot.empty) {
              const userRef = usersSnapshot.docs[0].ref;
              await updateDoc(userRef, {
                subscriptionStatus: 'free',
                pakket: 'free',
                permissies: 'free',
                stripeSubscriptionId: null,
                updatedAt: serverTimestamp()
              });
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

  app.post(["/api/sync-subscription", "/sync-subscription"], async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    
    try {
      const userRef = doc(adminDb, "gebruikers", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return res.status(404).json({ error: "User not found" });

      const userData = userSnap.data() as any;
      const subId = userData.stripeSubscriptionId;
      if (!subId) return res.json({ status: 'no_subscription', user: userData });

      const subscription = await stripe.subscriptions.retrieve(subId);
      const isCanceledOrDeleted = subscription.status === "canceled" || subscription.status === "unpaid" || subscription.cancel_at_period_end;
      
      if (isCanceledOrDeleted && userData.pakket !== 'free') {
        await updateDoc(userRef, {
          subscriptionStatus: 'free',
          pakket: 'free',
          permissies: 'free',
          stripeSubscriptionId: null,
          updatedAt: serverTimestamp()
        });
        return res.json({ status: 'downgraded' });
      }

      res.json({ status: 'active', subscription: subscription.status });
    } catch (error: any) {
      console.error("[SERVER] Sync subscription error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post(["/api/scrape-marktplaats", "/scrape-marktplaats"], async (req, res) => {
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
        url.includes('autoscout24') ? Promise.resolve(null) : checkRDW(listing.kenteken).catch(() => null)
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

  app.post(["/api/save-rapport", "/save-rapport"], async (req, res) => {
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

  app.post(["/api/analyseer", "/analyseer"], async (req, res) => {
    const { url, userId } = req.body;
    const xff = req.headers['x-forwarded-for'];
    const clientIp = typeof xff === 'string' ? xff.split(',')[0].trim() : (Array.isArray(xff) ? xff[0] : req.socket.remoteAddress);
    // Replace dots and colons for firestore ID safety (IPv4 and IPv6)
    const ipString = (clientIp || 'unknown').replace('::ffff:', '').replace(/[\.\:]/g, '_'); 

    if (!url || (!url.includes("marktplaats.nl") && !url.includes("autoscout24"))) {
      return res.status(400).json({ error: "Geldige Marktplaats of AutoScout24 URL is vereist" });
    }
    
    // Check permissions / deduct scans
    let reportTier = 'free';
    let isAdmin = false;
    let limitReached = false;
    
    if (userId && userId !== "anonymous") {
      try {
        const userRef = doc(adminDb, "gebruikers", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists) {
          const data = userDoc.data() as any;
          const adminEmails = ['ibrahimdiscord675@gmail.com', 'sblzakelijk@gmail.com', 'bedrijfsondernemernl1@gmail.com', 'admin_server_bot@occasionscan.nl'];
          isAdmin = adminEmails.includes((data.email || '').toLowerCase());
          
          if (isAdmin) {
            reportTier = 'autohandelaar';
          } else {
            const scansGebruikt = Number(data.scansGebruikt || 0);
            const scanLimiet = Number(data.scanLimiet || 0);
            const permissies = data.permissies || 'free';
            const pakket = data.pakket || 'free';

            if (pakket !== 'free') {
              if (scansGebruikt >= scanLimiet && scanLimiet < 999) {
                // Limit reached, fallback to free
                reportTier = 'free';
                limitReached = true;
                console.log(`[SUBSCRIPTION] User ${userId} has reached limit (${scansGebruikt}/${scanLimiet}). Falling back to free.`);
              } else {
                // Use paid tier
                reportTier = permissies;
                
                // Real-time deduction
                await updateDoc(userRef, { 
                  scansGebruikt: increment(1),
                  scansOver: increment(-1),
                  lastScanAt: serverTimestamp()
                });
                console.log(`[SUBSCRIPTION] User ${userId} used premium scan (${reportTier}). New count: ${scansGebruikt + 1}`);
              }
            } else {
              reportTier = 'free';
            }
          }
        }
      } catch (e) {
        console.error("Error checking permissions", e);
      }
    }

    // URL Caching: Voorkom dubbele AI calls als recent nog gedaan
    try {
      const qReport = query(collection(adminDb, 'rapporten'), where('url', '==', url));
      const querySnapshot = await getDocs(qReport);
      
      if (!querySnapshot.empty) {
        const existingReport = querySnapshot.docs.sort((a,b) => {
          const tA = (a.data().createdAt?.toDate && a.data().createdAt.toDate().getTime()) || 0;
          const tB = (b.data().createdAt?.toDate && b.data().createdAt.toDate().getTime()) || 0;
          return tB - tA;
        })[0];
        
        const data = existingReport.data();
        if (data.status === 'compleet' || data.status === 'verwerking' || data.status === 'analyseren' || data.status === 'vergelijken') {
          console.log(`[CACHE] Reusing report ${existingReport.id} for URL: ${url}`);
          return res.json({
            success: true,
            rapportId: existingReport.id,
            cached: true
          });
        }
      }
    } catch (cacheError) {
      console.error("Cache check failed:", cacheError);
    }


    try {
      const docRef = await addDoc(collection(adminDb, 'rapporten'), {
        userId: userId || "anonymous",
        url: url,
        status: "verwerking",
        tier: reportTier,
        limitReached: limitReached,
        createdAt: serverTimestamp()
      });

      // Start background process
      voerAnalyseUit(docRef.id, url, userId || "anonymous", reportTier).catch(console.error);

      return res.json({
        success: true,
        rapportId: docRef.id,
        limitReached: limitReached
      });

    } catch (error: any) {
      console.error("Server processing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/rapport/:id
  app.get(["/api/proxy-image", "/proxy-image"], async (req, res) => {
    try {
      const imageUrl = req.query.url;
      if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
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

  app.get(["/api/rapport/:id", "/rapport/:id"], async (req, res) => {
    try {
      const rapportId = req.params.id;
      const { isBetaald, permissies } = req.query;
      const isPaidUser = isBetaald === 'true';
      const userPerms = (permissies as string) || 'free';

      const docRef = doc(adminDb, 'rapporten', rapportId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return res.status(404).json({ error: "Rapport niet gevonden" });
      }

      const rawData = docSnap.data() as any;
      const reportTier = rawData.tier || 'free';
      const userEmail = (req.query.email as string) || ''; 

      const adminEmails = ['ibrahimdiscord675@gmail.com', 'sblzakelijk@gmail.com', 'bedrijfsondernemernl1@gmail.com', 'admin_server_bot@occasionscan.nl'];
      const isAdmin = adminEmails.includes(userEmail.toLowerCase());

      // Access logic:
      // Reports carry their generation tier (which affects what data is actually present in DB).
      // However, even if a report was generated as 'free', a viewing user with a paid plan should see 
      // whatever premium data IS available (Price, Risks, RDW).
      
      let effectiveTier = reportTier; 
      
      // Upgrade view based on WHO is looking
      if (isAdmin || userPerms === 'autohandelaar') {
        effectiveTier = 'autohandelaar';
      } else if (userPerms === 'slimme_koper') {
        if (effectiveTier === 'free' || effectiveTier === 'losse_scan') {
          effectiveTier = 'slimme_koper';
        }
      } else if (userPerms === 'losse_scan') {
        if (effectiveTier === 'free') {
          effectiveTier = 'losse_scan';
        }
      }

      // ── REDACTION LOGIC ──
      
      // If it's a free report and user is not admin/dealer
      if (effectiveTier === 'free') {
        return res.json({
          ...rawData,
          tier: 'free',
          rodeVlaggen: rawData.rodeVlaggen ? rawData.rodeVlaggen.slice(0, 1) : [],
          vergelijkbareAutos: [],
          fotoAnalyse: [],
          onderhandelingsScript: null,
          openingsBod: null,
          onderhandelingsTips: [],
          eerlijkePrijs: 0, // Hide price for free
          directeWinst: 0
        });
      }

      // Losse Scan: Full analysis (DealScore, Risks, RDW), but NO Photo Analysis or Script
      if (effectiveTier === 'losse_scan') {
        return res.json({
          ...rawData,
          tier: 'losse_scan',
          fotoAnalyse: [],
          onderhandelingsScript: null,
          openingsBod: null,
          onderhandelingsTips: []
        });
      }

      // Slimme Koper & Autohandelaar: Everything
      return res.json({ ...rawData, tier: effectiveTier });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Interne fout" });
    }
  });





  if (!process.env.VERCEL) {
    (async () => {
      if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
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
    })();
  }

async function voerAnalyseUit(rapportId: string, url: string, userId: string, reportTier: string = 'free') {
  try {
    // ── FASE 1: SCRAPING ──
    const rapportRef = doc(adminDb, 'rapporten', rapportId);
    await updateDoc(rapportRef, { status: 'scraping' });
    console.log(`[SCRAPING] Listing at URL: ${url} (Tier: ${reportTier})`);
    
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

    // Redact Seller Info for AutoScout24 per request (unreliable data)
    const isAutoScout = url.includes('autoscout24');
    const verkoperInfo = isAutoScout ? {
      naam: 'Verborgen voor AutoScout24',
      sinds: 'Onbekend',
      aantalAdvertenties: 0,
      type: 'Onbekend'
    } : {
      naam: listing.verkoper || 'Onbekend',
      sinds: listing.verkoperSinds || 'Onbekend',
      aantalAdvertenties: listing.aantalAdvertenties || 0,
      type: listing.verkoperType || 'Particulier'
    };

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
      fotos: (listing.fotos || []).slice(0, 6), // Keep up to 6 in DB but analyze 3
      advertentieId: listing.advertentieId,
      verkoper: verkoperInfo,
      dagenOnline: listing.dagenOnline,
      kenteken: listing.kenteken
    });

    // ── FASE 2: PARALLEL OPHALEN ──
    await updateDoc(rapportRef, { status: 'vergelijken' });
    console.log(`[PARALLEL] Start tasks voor ${listing.kenteken}`);

    const [vergelijkbaar, rdwData, fotoAnalyse] = await Promise.allSettled([
      vergelijkbaarPromise || Promise.resolve([]),
      url.includes('autoscout24') ? Promise.resolve(null) : checkRDW(listing.kenteken),
      // Skip AI photo analysis for free and losse_scan tier to save costs/limit features
      (reportTier === 'free' || reportTier === 'losse_scan') ? Promise.resolve(null) : analyseerFotos((listing.fotos || []).slice(0, 3))
    ]);
    
    const vergelijkbareAutos = vergelijkbaar.status === 'fulfilled' ? vergelijkbaar.value : [];
    const rdw = rdwData.status === 'fulfilled' ? rdwData.value : null;
    const fotos = (fotoAnalyse.status === 'fulfilled' && fotoAnalyse.value) ? fotoAnalyse.value : { fotos: [], ontbrekendeFotos: [] };
    
    console.log(`[PARALLEL] Collected data: ${vergelijkbareAutos.length} parallels, RDW: ${!!rdw}, Fotos: ${fotos?.fotos?.length || 0}`);

    // ── FASE 3: GEMINI ANALYSE ──
    await updateDoc(rapportRef, { status: 'analyseren' });
    
    let analyse;
    try {
      console.log("[GEMINI] Calling with model: gemini-3-flash-preview");
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

export default app;