import type { Difficulty } from '../game/types';
import { getSupabaseClient } from './supabaseClient';

export interface SnakeScore {
  id: string;
  game_session_id: string;
  player_name: string;
  score: number;
  difficulty: Difficulty;
  snake_length: number;
  duration_seconds: number;
  created_at: string;
}

export interface SubmitScorePayload {
  game_session_id: string;
  player_name: string;
  score: number;
  difficulty: Difficulty;
  snake_length: number;
  duration_seconds: number;
}

export async function fetchTopScores(): Promise<SnakeScore[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('snake_scores')
    .select('id, game_session_id, player_name, score, difficulty, snake_length, duration_seconds, created_at')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    throw new Error(`读取 TOP10 失败：${error.message}`);
  }

  return (data ?? []) as SnakeScore[];
}

export async function submitScore(payload: SubmitScorePayload): Promise<SnakeScore> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('snake_scores')
    .insert(payload)
    .select('id, game_session_id, player_name, score, difficulty, snake_length, duration_seconds, created_at')
    .single();

  if (error) {
    throw new Error(`提交成绩失败：${error.message}`);
  }

  return data as SnakeScore;
}
