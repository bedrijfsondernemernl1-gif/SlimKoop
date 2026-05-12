import { create } from 'zustand';

interface StoreState {
  isLoggedIn: boolean;
  isPremium: boolean;
  login: () => void;
  logout: () => void;
  upgrade: () => void;
}

export const useStore = create<StoreState>((set) => ({
  isLoggedIn: false, // Default freemium user not logged in
  isPremium: false,
  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false, isPremium: false }),
  upgrade: () => set({ isPremium: true, isLoggedIn: true }),
}));
