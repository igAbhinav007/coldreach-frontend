import { create } from 'zustand';

interface GmailAccount {
  id: string;
  gmail_address: string;
  connected_at: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  subscriptionTier: 'free' | 'starter' | 'pro' | 'enterprise';
  subscriptionStatus: string;
  hasGmailConnection: boolean;
  gmailAccounts: GmailAccount[];
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
