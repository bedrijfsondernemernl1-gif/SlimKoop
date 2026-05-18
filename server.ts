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
signInWithEmailAndPassword(auth, "admin_server_bot@occasionscan.nl", "ServerSuperPassword123!")
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
            scansGebruikt: 0,
            scanLimiet: permissies === 'losse_scan' ? 1 : (permissies === 'slimme_koper' ? 3 : 999),
            scansOver: permissies === 'losse_scan' ? 1 : (permissies === 'slimme_koper' ? 3 : 999)
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

  app.post("/api/sync-subscription", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    
    try {
      const userRef = doc(adminDb, "gebruikers", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return res.status(404).json({ error: "User not found" });

      const userData = userSnap.data();
      const subId = userData.stripeSubscriptionId;
      if (!subId) return res.json({ status: 'no_subscription', user: userData });

      const subscription = await stripe.subscriptions.retrieve(subId);
      const isCanceledOrDeleted = subscription.status === "canceled" || subscription.status === "unpaid" || subscription.cancel_at_period_end;
      
      if (isCanceledOrDeleted && userData.pakket !== 'free') {
        await setDoc(userRef, {
          subscriptionStatus: 'free',
          pakket: 'free',
          permissies: 'free',
          stripeSubscriptionId: null
        }, { merge: true });
        return res.json({ status: 'downgraded' });
      }

      res.json({ status: 'active', subscription: subscription.status });
    } catch (error: any) {
      console.error("[SERVER] Sync subscription error:", error);
      res.status(500).json({ error: error.message });
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
        if (userDoc.exists()) {
          const data = userDoc.data() as any;
          const adminEmails = ['ibrahimdiscord675@gmail.com', 'sblzakelijk@gmail.com', 'bedrijfsondernemernl1@gmail.com', 'admin_server_bot@occasionscan.nl'];
          isAdmin = adminEmails.includes((data.email || '').toLowerCase());
          
          if (isAdmin) {
            reportTier = 'autohandelaar';
          } else {
            const scansGebruikt = data.scansGebruikt || 0;
            const scanLimiet = data.scanLimiet || 0;
            const permissies = data.permissies || 'free';
            const pakket = data.pakket || 'free';

            // Check if limit is reached
            if (pakket !== 'free') {
              if (scansGebruikt >= scanLimiet && scanLimiet < 999) {
                // If limit reached, downgrade to free tier for this scan
                reportTier = 'free';
                limitReached = true;
              } else {
                // Determine tier based on permissies
                reportTier = permissies;
                
                // Increment scansGebruikt only if it's a premium scan
                await setDoc(userRef, { 
                  scansGebruikt: scansGebruikt + 1,
                  scansOver: Math.max(0, scanLimiet - (scansGebruikt + 1))
                }, { merge: true });
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

    // IP-based limit for free/anonymous users (1 scan per IP)
    if (reportTier === 'free' && !isAdmin) {
      try {
        const ipRef = doc(adminDb, "limited_ips", ipString); 
        const ipDoc = await getDoc(ipRef);
        
        if (ipDoc.exists()) {
          const ipData = ipDoc.data();
          const count = typeof ipData.usageCount === 'number' ? ipData.usageCount : 1; 
          
          if (count >= 1) {
            console.log(`[LIMIT] IP ${clientIp} blocked. Usage: ${count}`);
            return res.status(403).json({ 
              error: "Je hebt je gratis limiet van 1 scan per IP bereikt op dit toestel. Maak een account aan of upgrade om meer auto's te analyseren." 
            });
          }
        }
      } catch (ipError) {
        console.error("IP limit check failed:", ipError);
      }
    }

    // Mark IP as used if they are on free tier (logged in or not)
    const markIpAsUsed = async () => {
      if (reportTier === 'free' && !isAdmin) {
        try {
          const ipRef = doc(adminDb, "limited_ips", ipString);
          await setDoc(ipRef, { 
            usageCount: 1, 
            lastUsed: serverTimestamp(), 
            userId: userId || 'anonymous' 
          }, { merge: true });
        } catch (err) {
          console.error("Failed to mark IP as used:", err);
        }
      }
    };

    // URL Caching: Check if this URL was already analyzed successfully
    try {
      const q = query(
        collection(adminDb, 'rapporten'), 
        where('url', '==', url), 
        where('status', '==', 'compleet')
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Reuse the most recent completed report
        const existingReport = querySnapshot.docs[0];
        console.log(`[CACHE] Reusing existing report ${existingReport.id} for URL: ${url}`);
        
        await markIpAsUsed();
        
        return res.json({
          success: true,
          rapportId: existingReport.id,
          cached: true
        });
      }
    } catch (cacheError) {
      console.error("Cache check failed:", cacheError);
    }

    try {
      await markIpAsUsed();

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
        limitReached: (typeof limitReached !== 'undefined' ? true : false)
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

  app.get("/api/rapport/:id", async (req, res) => {
    try {
      const rapportId = req.params.id;
      const { isBetaald, permissies } = req.query;
      const isPaidUser = isBetaald === 'true';
      const userPerms = (permissies as string) || 'free';

      const docSnap = await getDoc(doc(adminDb, 'rapporten', rapportId));
      if (!docSnap.exists()) {
        return res.status(404).json({ error: "Rapport niet gevonden" });
      }

      const rawData = docSnap.data() as any;
      const reportTier = rawData.tier || 'free';
      const userEmail = (req.query.email as string) || ''; // Wait, we should probably check admin by email if possible

      const adminEmails = ['ibrahimdiscord675@gmail.com', 'sblzakelijk@gmail.com', 'bedrijfsondernemernl1@gmail.com', 'admin_server_bot@occasionscan.nl'];
      const isAdmin = adminEmails.includes(userEmail.toLowerCase());

      // Access is granted if:
      // 1. Report itself was generated with a paid tier
      // 2. User has unlimited access (autohandelaar)
      // 3. User is admin
      const isUnlimited = isAdmin || userPerms === 'autohandelaar';
      const isPremiumReport = reportTier !== 'free';
      
      const hasFullAccess = isUnlimited || isPremiumReport;
      
      // Tier determines features shown
      const tier = isUnlimited ? 'autohandelaar' : (isPremiumReport ? reportTier : 'free');

      if (!hasFullAccess && rawData.status === 'compleet') {
        // Redact premium fields for users without access to this report's tier
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

      if (tier === 'losse_scan' && rawData.status === 'compleet') {
        // Losse scan user: Has Prijs & Risico's, but NO Foto Analyse or Script.
        return res.json({
          ...rawData,
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

    // Redact AutoScout24 seller info if needed
    const isAutoScout = url.includes('autoscout24');
    const verkoperInfo = isAutoScout ? {
      naam: 'Niet beschikbaar',
      sinds: 'Onbekend',
      aantalAdvertenties: 0,
      type: 'Onbekend'
    } : {
      naam: listing.verkoper,
      sinds: listing.verkoperSinds,
      aantalAdvertenties: listing.aantalAdvertenties,
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
      fotos: listing.fotos,
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
      // Skip AI photo analysis for free tier to save costs
      reportTier === 'free' ? Promise.resolve(null) : analyseerFotos(listing.fotos)
    ]);
    
    const vergelijkbareAutos = vergelijkbaar.status === 'fulfilled' ? vergelijkbaar.value : [];
    const rdw = rdwData.status === 'fulfilled' ? rdwData.value : null;
    const fotos = (fotoAnalyse.status === 'fulfilled' && fotoAnalyse.value) ? fotoAnalyse.value : { fotos: [], ontbrekendeFotos: [] };
    
    console.log(`[PARALLEL] Collected data: ${vergelijkbareAutos.length} parallels, RDW: ${!!rdw}, Fotos: ${fotos?.fotos?.length || 0}`);

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
