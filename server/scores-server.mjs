import { createServer } from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8787);
const SCORES_FILE = process.env.SNAKE_SCORES_FILE ?? '/var/www/snake-game-data/scores.json';
const MAX_BODY_BYTES = 32 * 1024;
const DIFFICULTIES = new Set(['normal', 'hard', 'hell']);
const NAME_PATTERN = /^[\u4e00-\u9fa5A-Za-z0-9_]{1,12}$/u;

const server = createServer(async (req, res) => {
  try {
    if (!req.url) {
      sendJson(res, 400, { error: 'Bad request' });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/api/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/scores') {
      const scores = await readScores();
      sendJson(res, 200, topScores(scores));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/scores') {
      const payload = await readJsonBody(req);
      const validation = validateScorePayload(payload);

      if (!validation.ok) {
        sendJson(res, 400, { error: validation.message });
        return;
      }

      const scores = await readScores();
      const existing = scores.find((score) => score.game_session_id === validation.score.game_session_id);

      if (existing) {
        sendJson(res, 409, { error: '本局成绩已提交', score: existing });
        return;
      }

      const score = {
        id: randomUUID(),
        ...validation.score,
        created_at: new Date().toISOString(),
      };

      scores.push(score);
      await writeScores(scores);
      sendJson(res, 201, score);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('scores api error', error);
    sendJson(res, 500, { error: '服务器排行榜服务异常' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`snake scores api listening on 127.0.0.1:${PORT}`);
});

async function readScores() {
  try {
    const content = await readFile(SCORES_FILE, 'utf8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data.filter(isStoredScore) : [];
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeScores(scores) {
  await mkdir(dirname(SCORES_FILE), { recursive: true });
  const tempFile = `${SCORES_FILE}.${process.pid}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(scores, null, 2)}\n`, 'utf8');
  await rename(tempFile, SCORES_FILE);
}

function topScores(scores) {
  return [...bestScoresByPlayer(scores)]
    .sort((a, b) => b.score - a.score || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 10);
}

function bestScoresByPlayer(scores) {
  const bestByPlayer = new Map();

  for (const score of scores) {
    const playerKey = score.player_name.trim().toLocaleLowerCase();
    const currentBest = bestByPlayer.get(playerKey);

    if (!currentBest || isBetterScore(score, currentBest)) {
      bestByPlayer.set(playerKey, score);
    }
  }

  return bestByPlayer.values();
}

function isBetterScore(candidate, currentBest) {
  if (candidate.score !== currentBest.score) {
    return candidate.score > currentBest.score;
  }

  return parseCreatedAt(candidate.created_at) < parseCreatedAt(currentBest.created_at);
}

function parseCreatedAt(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = '';

    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function validateScorePayload(payload) {
  const playerName = typeof payload?.player_name === 'string' ? payload.player_name.trim() : '';
  const score = Number(payload?.score);
  const snakeLength = Number(payload?.snake_length);
  const durationSeconds = Number(payload?.duration_seconds);
  const difficulty = payload?.difficulty;
  const gameSessionId = payload?.game_session_id;

  if (typeof gameSessionId !== 'string' || !isUuid(gameSessionId)) {
    return { ok: false, message: 'game_session_id 无效' };
  }

  if (!NAME_PATTERN.test(playerName)) {
    return { ok: false, message: '昵称无效' };
  }

  if (!Number.isInteger(score) || score <= 0 || score > 99999) {
    return { ok: false, message: '分数无效' };
  }

  if (!DIFFICULTIES.has(difficulty)) {
    return { ok: false, message: '难度无效' };
  }

  if (!Number.isInteger(snakeLength) || snakeLength < 3) {
    return { ok: false, message: '蛇身长度无效' };
  }

  if (!Number.isInteger(durationSeconds) || durationSeconds < 0) {
    return { ok: false, message: '用时无效' };
  }

  return {
    ok: true,
    score: {
      game_session_id: gameSessionId,
      player_name: playerName,
      score,
      difficulty,
      snake_length: snakeLength,
      duration_seconds: durationSeconds,
    },
  };
}

function isStoredScore(value) {
  return (
    value &&
    typeof value.id === 'string' &&
    typeof value.game_session_id === 'string' &&
    typeof value.player_name === 'string' &&
    Number.isInteger(value.score) &&
    DIFFICULTIES.has(value.difficulty) &&
    Number.isInteger(value.snake_length) &&
    Number.isInteger(value.duration_seconds) &&
    typeof value.created_at === 'string'
  );
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(data));
}
