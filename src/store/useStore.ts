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
  throw new Error(JSON.stringify(errInfo));
}

interface StoreState {
  isLoggedIn: boolean;
  isPremium: boolean;
  subscriptionPlan: string | null;
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
    let isValidLogin = false;
    
    if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }
    if (unsubSub) { unsubSub(); unsubSub = null; }
    if (unsubPayment) { unsubPayment(); unsubPayment = null; }
    
    if (user) {
      if (user.providerData.some(p => p.providerId === 'google.com') || user.emailVerified) {
         isValidLogin = true;
      }
      
      if (isValidLogin) {
        try {
          const userRef = doc(db, 'gebruikers', user.uid);
          // Initial check/create
          const userSnap = await getDoc(userRef).catch(err => handleFirestoreError(err, OperationType.GET, `gebruikers/${user.uid}`));
          if (userSnap && !userSnap.exists()) {
            await setDoc(userRef, {
              email: user.email,
              uid: user.uid,
              aanmaakdatum: new Date().toISOString()
            }).catch(err => handleFirestoreError(err, OperationType.WRITE, `gebruikers/${user.uid}`));
          }
          
          unsubUserDoc = onSnapshot(userRef, (docSnap) => {
             if (docSnap.exists()) {
                 const data = docSnap.data();
                 const adminPremium = user.email === 'ibrahimdiscord675@gmail.com';
                 const plan = data.subscriptionPlan || null;
                 set({ 
                     isPremium: Boolean(data.isPremium) || adminPremium,
                     subscriptionPlan: plan
                 });
             }
          }, (err) => handleFirestoreError(err, OperationType.GET, `gebruikers/${user.uid}`));

          const subsQuery = query(
            collection(db, 'customers', user.uid, 'subscriptions'),
            where('status', 'in', ['active', 'trialing'])
          );
          
          unsubSub = onSnapshot(subsQuery, (snapshot) => {
            if (!snapshot.empty) {
              const plan = snapshot.docs[0].data()?.items?.[0]?.price?.product?.name || 'Premium';
              set({ isPremium: true, subscriptionPlan: plan });
            }
          });
          
          const paymentsQuery = query(
            collection(db, 'customers', user.uid, 'payments'),
            where('status', '==', 'succeeded')
          );
          
          unsubPayment = onSnapshot(paymentsQuery, (snapshot) => {
            if (!snapshot.empty) {
              set({ isPremium: true, subscriptionPlan: 'Losse Scan' });
            }
          });

        } catch (err) {
          console.error("Failed to sync user doc:", err);
        }
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
    isAuthModalOpen: false,
    user: null,
    authLoading: true,
    login: () => set({ isLoggedIn: true }), // Keeping this for manual overrides if needed
    logout: async () => {
      if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }
      if (unsubSub) { unsubSub(); unsubSub = null; }
      if (unsubPayment) { unsubPayment(); unsubPayment = null; }
      await signOut(auth);
      set({ isLoggedIn: false, isPremium: false, subscriptionPlan: null, user: null });
    },
    upgrade: () => set({ isPremium: true, isLoggedIn: true }),
    openAuthModal: () => set({ isAuthModalOpen: true }),
    closeAuthModal: () => set({ isAuthModalOpen: false }),
  };
});
