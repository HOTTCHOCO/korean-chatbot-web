import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nickname?: string | null;
          updated_at?: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
        };
      };
    };
  };
}
