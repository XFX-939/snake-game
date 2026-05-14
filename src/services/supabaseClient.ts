import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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

export type SnakeSupabaseClient = SupabaseClient<Database>;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUnavailableMessage = '荣誉榜暂不可用：缺少 Supabase 环境变量';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    'Supabase 配置缺失：请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。荣誉榜会暂不可用，但游戏本体仍可运行。',
  );
}

export const supabase: SnakeSupabaseClient | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;
