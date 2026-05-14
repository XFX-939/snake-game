import type { PostgrestError } from '@supabase/supabase-js';
import type { Difficulty } from '../game/types';
import { supabase, supabaseUnavailableMessage } from './supabaseClient';

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

export type LeaderboardErrorType =
  | 'missing-env'
  | 'connection'
  | 'permission'
  | 'schema'
  | 'duplicate'
  | 'validation'
  | 'unknown';

export interface LeaderboardApiError {
  type: LeaderboardErrorType;
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export type LeaderboardResult<T> =
  | { data: T; error: null }
  | { data: null; error: LeaderboardApiError };

const SCORE_COLUMNS = 'id, game_session_id, player_name, score, difficulty, snake_length, duration_seconds, created_at';

export async function fetchTopScores(): Promise<LeaderboardResult<SnakeScore[]>> {
  if (!supabase) {
    return { data: null, error: { type: 'missing-env', message: supabaseUnavailableMessage } };
  }

  let response;
  try {
    response = await supabase
      .from('snake_scores')
      .select(SCORE_COLUMNS)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10);
  } catch (error) {
    console.error('读取 TOP10 网络异常', error);
    return {
      data: null,
      error: {
        type: 'connection',
        message: '数据库连接失败：请检查 Supabase URL、Anon Key 和网络状态',
      },
    };
  }

  const { data, error } = response;

  if (error) {
    logSupabaseError('读取 TOP10 失败', error);
    return { data: null, error: normalizeSupabaseError(error, '读取 TOP10 失败') };
  }

  return { data: data ?? [], error: null };
}

export async function submitScore(payload: SubmitScorePayload): Promise<LeaderboardResult<SnakeScore | null>> {
  if (payload.score <= 0) {
    return { data: null, error: null };
  }

  if (!supabase) {
    return { data: null, error: { type: 'missing-env', message: supabaseUnavailableMessage } };
  }

  let response;
  try {
    response = await supabase.from('snake_scores').insert({
      game_session_id: payload.game_session_id,
      player_name: payload.player_name,
      score: payload.score,
      difficulty: payload.difficulty,
      snake_length: payload.snake_length,
      duration_seconds: payload.duration_seconds,
    }).select(SCORE_COLUMNS).single();
  } catch (error) {
    console.error('提交成绩网络异常', error);
    return {
      data: null,
      error: {
        type: 'connection',
        message: '数据库连接失败：请检查 Supabase URL、Anon Key 和网络状态',
      },
    };
  }

  const { data, error } = response;

  if (error) {
    logSupabaseError('提交成绩失败', error);

    if (isDuplicateKeyError(error)) {
      return {
        data: null,
        error: {
          type: 'duplicate',
          message: '本局成绩已提交',
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      };
    }

    return { data: null, error: normalizeSupabaseError(error, '提交成绩失败') };
  }

  return { data, error: null };
}

function logSupabaseError(context: string, error: PostgrestError) {
  console.error(context, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

function normalizeSupabaseError(error: PostgrestError, fallback: string): LeaderboardApiError {
  const message = error.message || fallback;

  if (error.code === '42501' || /permission|rls|row-level security/i.test(message)) {
    return withSupabaseMeta(error, 'permission', '权限不足：Supabase RLS 策略拒绝了本次操作');
  }

  if (
    error.code === '42P01' ||
    error.code === '42703' ||
    /relation .* does not exist|column .* does not exist|schema/i.test(message)
  ) {
    return withSupabaseMeta(error, 'schema', '表不存在或字段不存在：请执行 supabase/schema.sql 初始化数据库');
  }

  if (error.code === '23505') {
    return withSupabaseMeta(error, 'duplicate', '本局成绩已提交');
  }

  if (error.code === '23514' || error.code === '23502' || error.code === '22P02') {
    return withSupabaseMeta(error, 'validation', `数据校验失败：${message}`);
  }

  if (/failed to fetch|network|fetch/i.test(message)) {
    return withSupabaseMeta(error, 'connection', '数据库连接失败：请检查 Supabase URL、Anon Key 和网络状态');
  }

  return withSupabaseMeta(error, 'unknown', `未知错误：${message}`);
}

function withSupabaseMeta(error: PostgrestError, type: LeaderboardErrorType, message: string): LeaderboardApiError {
  return {
    type,
    message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  };
}

function isDuplicateKeyError(error: PostgrestError): boolean {
  return error.code === '23505' || /duplicate key/i.test(error.message);
}
