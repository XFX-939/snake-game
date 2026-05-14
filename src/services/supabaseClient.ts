import { createClient } from '@supabase/supabase-js';
import type { Difficulty } from '../game/types';

interface Database {
  public: {
    Tables: {
      snake_scores: {
        Row: {
          id: string;
          game_session_id: string;
          player_name: string;
          score: number;
          difficulty: Difficulty;
          snake_length: number;
          duration_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_session_id: string;
          player_name: string;
          score: number;
          difficulty: Difficulty;
          snake_length?: number;
          duration_seconds?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_session_id?: string;
          player_name?: string;
          score?: number;
          difficulty?: Difficulty;
          snake_length?: number;
          duration_seconds?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

let client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      '缺少 Supabase 环境变量：请在 .env.local 中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。',
    );
  }

  if (!client) {
    client = createClient<Database>(supabaseUrl, supabasePublishableKey);
  }

  return client;
}
