import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

interface SessionState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  signIn: async (email, password) => {
    // TODO: Implement with Supabase
  },
  signInWithGoogle: async () => {
    // TODO: Implement with Supabase
  },
  signUp: async (email, password) => {
    // TODO: Implement with Supabase
  },
  signOut: async () => {
    // TODO: Implement with Supabase
  },
}));
