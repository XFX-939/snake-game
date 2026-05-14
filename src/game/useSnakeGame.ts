import { useCallback, useEffect, useRef, useState } from 'react';
import { DIFFICULTIES, HIGH_SCORE_KEY } from './constants';
import { applyDirection, createInitialState, moveSnake } from './gameLogic';
import type { Difficulty, Direction, GameState } from './types';

interface UseSnakeGameOptions {
  canStartGame: boolean;
  onGameSessionStart?: () => void;
}

interface SubmitCurrentScorePayload {
  game_session_id: string;
  score: number;
  difficulty: Difficulty;
  snake_length: number;
  duration_seconds: number;
}

type SubmitCurrentScoreHandler = (payload: SubmitCurrentScorePayload) => Promise<void>;

interface SubmitCurrentScoreResult {
  skipped: boolean;
  gameSessionId: string | null;
}

function readHighScore(): number {
  const stored = window.localStorage.getItem(HIGH_SCORE_KEY);
  const value = stored ? Number(stored) : 0;
  return Number.isFinite(value) ? value : 0;
}

export function useSnakeGame({ canStartGame, onGameSessionStart }: UseSnakeGameOptions) {
  const [state, setState] = useState<GameState>(() => createInitialState('normal'));
  const [highScore, setHighScore] = useState<number>(() => readHighScore());
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [hasSubmittedCurrentGame, setHasSubmittedCurrentGame] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSubmittedGameSessionId, setLastSubmittedGameSessionId] = useState<string | null>(null);
  const stateRef = useRef(state);
  const canStartGameRef = useRef(canStartGame);
  const onGameSessionStartRef = useRef(onGameSessionStart);
  const currentGameIdRef = useRef(currentGameId);
  const startedAtRef = useRef(startedAt);
  const endedAtRef = useRef(endedAt);
  const hasSubmittedCurrentGameRef = useRef(hasSubmittedCurrentGame);
  const isSubmittingScoreRef = useRef(isSubmittingScore);
  const lastSubmittedGameSessionIdRef = useRef(lastSubmittedGameSessionId);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    canStartGameRef.current = canStartGame;
  }, [canStartGame]);

  useEffect(() => {
    onGameSessionStartRef.current = onGameSessionStart;
  }, [onGameSessionStart]);

  useEffect(() => {
    currentGameIdRef.current = currentGameId;
  }, [currentGameId]);

  useEffect(() => {
    startedAtRef.current = startedAt;
  }, [startedAt]);

  useEffect(() => {
    endedAtRef.current = endedAt;
  }, [endedAt]);

  useEffect(() => {
    hasSubmittedCurrentGameRef.current = hasSubmittedCurrentGame;
  }, [hasSubmittedCurrentGame]);

  useEffect(() => {
    isSubmittingScoreRef.current = isSubmittingScore;
  }, [isSubmittingScore]);

  useEffect(() => {
    lastSubmittedGameSessionIdRef.current = lastSubmittedGameSessionId;
  }, [lastSubmittedGameSessionId]);

  const persistHighScore = useCallback((score: number) => {
    setHighScore((current) => {
      if (score <= current) {
        return current;
      }

      window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
      return score;
    });
  }, []);

  const resetSubmissionState = useCallback(() => {
    hasSubmittedCurrentGameRef.current = false;
    isSubmittingScoreRef.current = false;
    setHasSubmittedCurrentGame(false);
    setIsSubmittingScore(false);
    setSubmitError(null);
  }, []);

  const beginNewSession = useCallback((difficulty: Difficulty) => {
    if (!canStartGameRef.current || isSubmittingScoreRef.current) {
      return false;
    }

    const now = Date.now();
    const nextGameId = crypto.randomUUID();
    onGameSessionStartRef.current?.();
    setCurrentGameId(nextGameId);
    setStartedAt(now);
    setEndedAt(null);
    resetSubmissionState();
    setState({
      ...createInitialState(difficulty),
      status: 'running',
    });
    return true;
  }, [resetSubmissionState]);

  const restart = useCallback((difficulty = stateRef.current.difficulty) => {
    return beginNewSession(difficulty);
  }, [beginNewSession]);

  const start = useCallback(() => {
    const current = stateRef.current;

    if (current.status === 'running') {
      return false;
    }

    if (current.status === 'paused') {
      setState((prev) => ({ ...prev, status: 'running' }));
      return true;
    }

    return beginNewSession(current.difficulty);
  }, [beginNewSession]);

  const pause = useCallback(() => {
    setState((current) => (current.status === 'running' ? { ...current, status: 'paused' } : current));
  }, []);

  const togglePause = useCallback(() => {
    setState((current) => {
      if (current.status === 'running') {
        return { ...current, status: 'paused' };
      }

      if (current.status === 'paused') {
        return { ...current, status: 'running' };
      }

      return current;
    });
  }, []);

  const changeDirection = useCallback((direction: Direction) => {
    setState((current) => {
      if (current.status !== 'running') {
        return current;
      }

      return applyDirection(current, direction);
    });
  }, []);

  const changeDifficulty = useCallback((difficulty: Difficulty) => {
    if (isSubmittingScoreRef.current) {
      return;
    }

    setCurrentGameId(null);
    setStartedAt(null);
    setEndedAt(null);
    resetSubmissionState();
    setState({
      ...createInitialState(difficulty),
      status: 'idle',
    });
  }, [resetSubmissionState]);

  const submitCurrentScore = useCallback(
    async (handler: SubmitCurrentScoreHandler): Promise<SubmitCurrentScoreResult> => {
      const current = stateRef.current;
      const gameSessionId = currentGameIdRef.current;
      const started = startedAtRef.current;
      const ended = endedAtRef.current ?? Date.now();

      if (
        current.status !== 'gameOver' ||
        !gameSessionId ||
        !started ||
        current.score <= 0 ||
        hasSubmittedCurrentGameRef.current ||
        isSubmittingScoreRef.current ||
        lastSubmittedGameSessionIdRef.current === gameSessionId
      ) {
        return { skipped: true, gameSessionId };
      }

      const durationSeconds = Math.max(0, Math.floor((ended - started) / 1000));
      isSubmittingScoreRef.current = true;
      setIsSubmittingScore(true);
      setSubmitError(null);

      try {
        await handler({
          game_session_id: gameSessionId,
          score: current.score,
          difficulty: current.difficulty,
          snake_length: current.snake.length,
          duration_seconds: durationSeconds,
        });
        hasSubmittedCurrentGameRef.current = true;
        lastSubmittedGameSessionIdRef.current = gameSessionId;
        setHasSubmittedCurrentGame(true);
        setLastSubmittedGameSessionId(gameSessionId);
        return { skipped: false, gameSessionId };
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : '提交成绩失败，请稍后重试。');
        return { skipped: false, gameSessionId };
      } finally {
        isSubmittingScoreRef.current = false;
        setIsSubmittingScore(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (state.status !== 'running') {
      return;
    }

    const timer = window.setInterval(() => {
      setState((current) => {
        if (current.status !== 'running') {
          return current;
        }

        const result = moveSnake(current);
        if (result.gameOver || result.state.score > highScore) {
          persistHighScore(result.state.score);
        }
        if (result.gameOver) {
          setEndedAt(Date.now());
        }

        return result.state;
      });
    }, DIFFICULTIES[state.difficulty].speed);

    return () => window.clearInterval(timer);
  }, [highScore, persistHighScore, state.difficulty, state.status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, Direction | undefined> = {
        ArrowUp: 'UP',
        w: 'UP',
        W: 'UP',
        ArrowDown: 'DOWN',
        s: 'DOWN',
        S: 'DOWN',
        ArrowLeft: 'LEFT',
        a: 'LEFT',
        A: 'LEFT',
        ArrowRight: 'RIGHT',
        d: 'RIGHT',
        D: 'RIGHT',
      };

      const direction = keyMap[event.key];
      if (direction) {
        event.preventDefault();
        changeDirection(direction);
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        if (stateRef.current.status === 'idle' || stateRef.current.status === 'gameOver') {
          start();
        } else {
          togglePause();
        }
      }

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        restart();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, restart, start, togglePause]);

  return {
    state,
    highScore,
    currentGameId,
    startedAt,
    endedAt,
    hasSubmittedCurrentGame,
    isSubmittingScore,
    submitError,
    lastSubmittedGameSessionId,
    start,
    pause,
    restart,
    togglePause,
    changeDirection,
    changeDifficulty,
    submitCurrentScore,
  };
}
