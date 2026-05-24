import { useStore } from '@/src/store/useStore';

export function useAuth() {
  const user = useStore((state) => state.user);
  const loading = useStore((state) => state.authLoading);
  const logout = useStore((state) => state.logout);
  const isLoggedIn = useStore((state) => state.isLoggedIn);

  return { user, loading, logout, isLoggedIn };
}
