import type { PostgrestError } from '@supabase/supabase-js';
import type { Difficulty } from '../game/types';
import { isSupabaseConfigured, supabase } from './supabaseClient';

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
  | 'server-api'
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
    return fetchTopScoresFromServer();
  }

  let response;
  try {
    response = await supabase
      .from('snake_scores')
      .select(SCORE_COLUMNS)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1000);
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
    console.error('Supabase 荣誉榜不可用，尝试备用排行榜 API。');
    return fetchTopScoresFromServer(normalizeSupabaseError(error, '读取 TOP10 失败'));
  }

  return { data: rankBestScoreByPlayer(data ?? []), error: null };
}

export async function submitScore(payload: SubmitScorePayload): Promise<LeaderboardResult<SnakeScore | null>> {
  if (payload.score <= 0) {
    return { data: null, error: null };
  }

  if (!supabase) {
    return submitScoreToServer(payload);
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

    console.error('Supabase 成绩提交不可用，尝试备用排行榜 API。');
    return submitScoreToServer(payload, normalizeSupabaseError(error, '提交成绩失败'));
  }

  return { data, error: null };
}

async function fetchTopScoresFromServer(fallbackError?: LeaderboardApiError): Promise<LeaderboardResult<SnakeScore[]>> {
  try {
    const response = await fetch('/api/scores', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      const message = await readServerError(response);
      console.error('备用排行榜 API 读取失败', { status: response.status, message, fallbackError });
      return {
        data: null,
        error: {
          type: 'server-api',
          message: `${fallbackError?.message ?? '荣誉榜暂不可用'}；备用排行榜服务读取失败：${message}`,
        },
      };
    }

    const data = await response.json();
    return { data: normalizeServerScores(data), error: null };
  } catch (error) {
    console.error('备用排行榜 API 连接失败', { error, fallbackError });
    return {
      data: null,
      error: {
        type: isSupabaseConfigured ? 'connection' : 'server-api',
        message: `${fallbackError?.message ?? '荣誉榜暂不可用'}；备用排行榜服务连接失败`,
      },
    };
  }
}

async function submitScoreToServer(
  payload: SubmitScorePayload,
  fallbackError?: LeaderboardApiError,
): Promise<LeaderboardResult<SnakeScore | null>> {
  try {
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        game_session_id: payload.game_session_id,
        player_name: payload.player_name,
        score: payload.score,
        difficulty: payload.difficulty,
        snake_length: payload.snake_length,
        duration_seconds: payload.duration_seconds,
      }),
    });

    if (response.status === 409) {
      return { data: null, error: { type: 'duplicate', message: '本局成绩已提交' } };
    }

    if (!response.ok) {
      const message = await readServerError(response);
      console.error('备用排行榜 API 提交失败', { status: response.status, message, fallbackError });
      return {
        data: null,
        error: {
          type: 'server-api',
          message: `${fallbackError?.message ?? '提交成绩失败'}；备用排行榜服务提交失败：${message}`,
        },
      };
    }

    const data = await response.json();
    return { data: normalizeServerScore(data), error: null };
  } catch (error) {
    console.error('备用排行榜 API 提交连接失败', { error, fallbackError });
    return {
      data: null,
      error: {
        type: isSupabaseConfigured ? 'connection' : 'server-api',
        message: `${fallbackError?.message ?? '提交成绩失败'}；备用排行榜服务连接失败`,
      },
    };
  }
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

function rankBestScoreByPlayer(scores: SnakeScore[]): SnakeScore[] {
  const bestByPlayer = new Map<string, SnakeScore>();

  for (const score of scores) {
    const playerKey = score.player_name.trim().toLocaleLowerCase();
    const currentBest = bestByPlayer.get(playerKey);

    if (!currentBest || isBetterLeaderboardScore(score, currentBest)) {
      bestByPlayer.set(playerKey, score);
    }
  }

  return [...bestByPlayer.values()]
    .sort((a, b) => b.score - a.score || parseCreatedAt(a.created_at) - parseCreatedAt(b.created_at))
    .slice(0, 10);
}

function isBetterLeaderboardScore(candidate: SnakeScore, currentBest: SnakeScore): boolean {
  if (candidate.score !== currentBest.score) {
    return candidate.score > currentBest.score;
  }

  return parseCreatedAt(candidate.created_at) < parseCreatedAt(currentBest.created_at);
}

function parseCreatedAt(value: string): number {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

async function readServerError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === 'string' ? body.error : response.statusText;
  } catch {
    return response.statusText || '未知错误';
  }
}

function normalizeServerScores(data: unknown): SnakeScore[] {
  const scores = Array.isArray(data) ? data.map(normalizeServerScore).filter(Boolean) : [];
  return rankBestScoreByPlayer(scores);
}

function normalizeServerScore(data: unknown): SnakeScore {
  const score = data as Partial<SnakeScore>;

  return {
    id: String(score.id ?? ''),
    game_session_id: String(score.game_session_id ?? ''),
    player_name: String(score.player_name ?? '玩家'),
    score: Number(score.score ?? 0),
    difficulty: isDifficulty(score.difficulty) ? score.difficulty : 'normal',
    snake_length: Number(score.snake_length ?? 3),
    duration_seconds: Number(score.duration_seconds ?? 0),
    created_at: String(score.created_at ?? new Date().toISOString()),
  };
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'normal' || value === 'hard' || value === 'hell';
}
