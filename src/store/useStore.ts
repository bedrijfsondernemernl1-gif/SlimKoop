import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  user: User | null;
  authLoading: boolean;
  login: () => void;
  logout: () => void;
  upgrade: () => void;
}

export const useStore = create<StoreState>((set) => {
  // Listen to Firebase auth state
  onAuthStateChanged(auth, async (user) => {
    let isValidLogin = false;
    
    if (user) {
      if (user.providerData.some(p => p.providerId === 'google.com') || user.emailVerified) {
         isValidLogin = true;
      }
      
      if (isValidLogin) {
        try {
          const userRef = doc(db, 'gebruikers', user.uid);
          const userSnap = await getDoc(userRef).catch(err => handleFirestoreError(err, OperationType.GET, `gebruikers/${user.uid}`));
          if (userSnap && !userSnap.exists()) {
            await setDoc(userRef, {
              email: user.email,
              uid: user.uid,
              aanmaakdatum: new Date().toISOString()
            }).catch(err => handleFirestoreError(err, OperationType.WRITE, `gebruikers/${user.uid}`));
          }
        } catch (err) {
          console.error("Failed to sync user doc:", err);
        }
      }
    }

    let isPremiumAccount = false;
    if (user && user.email === 'ibrahimdiscord675@gmail.com') {
      isPremiumAccount = true;
    }

    set({ 
      user: isValidLogin ? user : null,
      isLoggedIn: isValidLogin,
      isPremium: isPremiumAccount,
      authLoading: false
    });
  });

  return {
    isLoggedIn: false, // Default freemium user not logged in
    isPremium: false,
    user: null,
    authLoading: true,
    login: () => set({ isLoggedIn: true }), // Keeping this for manual overrides if needed
    logout: async () => {
      await signOut(auth);
      set({ isLoggedIn: false, isPremium: false, user: null });
    },
    upgrade: () => set({ isPremium: true, isLoggedIn: true }),
  };
});
