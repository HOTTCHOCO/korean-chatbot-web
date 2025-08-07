import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Auth methods
  signUp: (email: string, password: string, nickname?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Initialize auth state
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  signUp: async (email: string, password: string, nickname?: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nickname || email.split('@')[0], // 기본 닉네임 설정
          },
        },
      });

      if (error) {
        set({ error: error.message, loading: false });
        return;
      }

      if (data.user) {
        set({ 
          user: data.user, 
          session: data.session, 
          loading: false,
          error: null 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.',
        loading: false 
      });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, loading: false });
        return;
      }

      if (data.user && data.session) {
        set({ 
          user: data.user, 
          session: data.session, 
          loading: false,
          error: null 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.',
        loading: false 
      });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        set({ error: error.message, loading: false });
        return;
      }

      set({ 
        user: null, 
        session: null, 
        loading: false,
        error: null 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다.',
        loading: false 
      });
    }
  },

  initializeAuth: async () => {
    try {
      set({ loading: true });
      
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        set({ 
          user: session.user, 
          session, 
          loading: false 
        });
      } else {
        set({ loading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          set({ 
            user: session.user, 
            session, 
            loading: false,
            error: null 
          });
        } else if (event === 'SIGNED_OUT') {
          set({ 
            user: null, 
            session: null, 
            loading: false,
            error: null 
          });
        }
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '인증 초기화 중 오류가 발생했습니다.',
        loading: false 
      });
    }
  },
}));
