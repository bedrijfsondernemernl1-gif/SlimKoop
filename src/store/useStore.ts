import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, query, collection, where } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Don't throw to avoid crashing the auth listener
  // throw new Error(JSON.stringify(errInfo));
}

interface StoreState {
  isLoggedIn: boolean;
  isPremium: boolean;
  subscriptionPlan: string | null;
  permissies: string;
  scansGebruikt: number;
  scanLimiet: number;
  scansOver: number;
  isAuthModalOpen: boolean;
  user: User | null;
  authLoading: boolean;
  login: () => void;
  logout: () => void;
  upgrade: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

let unsubUserDoc: (() => void) | null = null;
let unsubSub: (() => void) | null = null;
let unsubPayment: (() => void) | null = null;

export const useStore = create<StoreState>((set) => {
  // Listen to Firebase auth state
  onAuthStateChanged(auth, async (user) => {
    let isValidLogin = !!user;
    
    if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }
    
    if (user) {
      try {
        const userRef = doc(db, 'gebruikers', user.uid);
        // Initial check/create
        const userSnap = await getDoc(userRef).catch(err => handleFirestoreError(err, OperationType.GET, `gebruikers/${user.uid}`));
        if (userSnap && !userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email,
            uid: user.uid,
            aanmaakdatum: new Date().toISOString(),
            subscriptionStatus: 'free',
            pakket: 'free',
            permissies: 'free',
          }).catch(err => handleFirestoreError(err, OperationType.WRITE, `gebruikers/${user.uid}`));
        }
        
        unsubUserDoc = onSnapshot(userRef, (docSnap) => {
           if (docSnap.exists()) {
               const data = docSnap.data();
               const adminEmails = ['ibrahimdiscord675@gmail.com', 'sblzakelijk@gmail.com', 'bedrijfsondernemernl1@gmail.com', 'admin_server_bot@occasionscan.nl'];
               const isAdmin = adminEmails.includes((user.email || '').toLowerCase());
               const plan = data.pakket || 'free';
               const perms = data.permissies || 'free';
               const sG = Number(data.scansGebruikt || 0);
               const sL = Number(data.scanLimiet || 0);
               const sO = data.scansOver !== undefined ? Number(data.scansOver) : Math.max(0, sL - sG);

               let computedIsPremium = perms !== 'free';
               let computedPerms = perms;



               set({ 
                   isPremium: isAdmin ? true : computedIsPremium,
                   subscriptionPlan: isAdmin ? 'Autohandelaar' : plan,
                   permissies: isAdmin ? 'autohandelaar' : computedPerms,
                   scansGebruikt: sG,
                   scanLimiet: isAdmin ? 999 : sL,
                   scansOver: isAdmin ? 999 : sO
               });
           }
        }, (err) => handleFirestoreError(err, OperationType.GET, `gebruikers/${user.uid}`));

      } catch (err) {
        console.error("Failed to sync user doc:", err);
      }

      // Proactively sync subscription with Stripe
      try {
        await fetch('/api/sync-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid })
        });
      } catch(e) {
        console.error("Failed to sync Stripe subscription:", e);
      }
    }

    set({ 
      user: isValidLogin ? user : null,
      isLoggedIn: isValidLogin,
      authLoading: false
    });
  });

  return {
    isLoggedIn: false, // Default freemium user not logged in
    isPremium: false,
    subscriptionPlan: null,
    permissies: 'free',
    scansGebruikt: 0,
    scanLimiet: 0,
    scansOver: 0,
    isAuthModalOpen: false,
    user: null,
    authLoading: true,
    login: () => set({ isLoggedIn: true }), // Keeping this for manual overrides if needed
    logout: async () => {
      if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }
      await signOut(auth);
      set({ 
        isLoggedIn: false, 
        isPremium: false, 
        subscriptionPlan: null, 
        permissies: 'free', 
        scansGebruikt: 0,
        scanLimiet: 0,
        scansOver: 0, 
        user: null 
      });
    },
    upgrade: () => set({ isPremium: true, isLoggedIn: true }),
    openAuthModal: () => set({ isAuthModalOpen: true }),
    closeAuthModal: () => set({ isAuthModalOpen: false }),
  };
});
