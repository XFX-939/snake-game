import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameControls } from './components/GameControls';
import { GameHeader } from './components/GameHeader';
import { Leaderboard } from './components/Leaderboard';
import { GameOverlay } from './components/GameOverlay';
import { PlayerNameInput } from './components/PlayerNameInput';
import { DIFFICULTIES, STATUS_LABELS } from './game/constants';
import { useSnakeGame } from './game/useSnakeGame';
import { fetchTopScores, submitScore, type LeaderboardApiError, type SnakeScore } from './services/leaderboardApi';
import { normalizePlayerName, validatePlayerName } from './utils/validatePlayerName';

export default function App() {
  const [playerName, setPlayerName] = useState('');
  const lastValidPlayerNameRef = useRef('');
  const [leaderboardScores, setLeaderboardScores] = useState<SnakeScore[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<LeaderboardApiError | null>(null);
  const [isGameOverDialogOpen, setIsGameOverDialogOpen] = useState(false);
  const playerNameValidation = validatePlayerName(playerName);

  useEffect(() => {
    if (playerNameValidation.isValid) {
      lastValidPlayerNameRef.current = normalizePlayerName(playerName);
    }
  }, [playerName, playerNameValidation.isValid]);

  const {
    state,
    highScore,
    currentGameId,
    hasSubmittedCurrentGame,
    isSubmittingScore,
    submitError,
    lastSubmittedGameSessionId,
    start,
    restart,
    togglePause,
    changeDirection,
    changeDifficulty,
    submitCurrentScore,
  } = useSnakeGame({
    canStartGame: playerNameValidation.isValid,
  });

  const loadLeaderboard = useCallback(async () => {
    setIsLeaderboardLoading(true);
    setLeaderboardError(null);

    const result = await fetchTopScores();
    if (result.error) {
      setLeaderboardScores([]);
      setLeaderboardError(result.error);
    } else {
      setLeaderboardScores(result.data);
    }

    setIsLeaderboardLoading(false);
  }, []);

  const submitCurrentGameScore = useCallback(async () => {
    const result = await submitCurrentScore(async (payload) => {
      const submitResult = await submitScore({
        ...payload,
        player_name: lastValidPlayerNameRef.current,
      });

      if (submitResult.error && submitResult.error.type !== 'duplicate') {
        throw new Error(submitResult.error.message);
      }
    });

    if (!result.skipped) {
      await loadLeaderboard();
    }
  }, [loadLeaderboard, submitCurrentScore]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (state.status === 'gameOver') {
      setIsGameOverDialogOpen(true);
      void submitCurrentGameScore();
    }
  }, [state.status, state.score, currentGameId, submitCurrentGameScore]);

  const requiresValidName = !playerNameValidation.isValid;

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <GameHeader />

        <PlayerNameInput value={playerName} onChange={setPlayerName} />

        <section className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4">
          <StatusCard label="当前分数" value={state.score} accent="text-cyan-300" />
          <StatusCard label="历史最高" value={highScore} accent="text-orange-300" />
          <StatusCard label="当前难度" value={DIFFICULTIES[state.difficulty].label} accent="text-emerald-300" />
          <StatusCard label="游戏状态" value={STATUS_LABELS[state.status]} accent="text-sky-300" />
        </section>

        <section className="grid w-full gap-6 lg:grid-cols-[minmax(0,620px)_minmax(320px,1fr)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-5">
            <GameCanvas state={state} onDirectionChange={changeDirection} />

            <GameControls
              difficulty={state.difficulty}
              status={state.status}
              startDisabled={requiresValidName || isSubmittingScore}
              restartDisabled={requiresValidName || isSubmittingScore}
              onStart={start}
              onPause={togglePause}
              onRestart={() => restart()}
              onDifficultyChange={changeDifficulty}
              onDirectionChange={changeDirection}
            />
          </div>

          <Leaderboard
            scores={leaderboardScores}
            isLoading={isLeaderboardLoading}
            error={leaderboardError}
            highlightedGameSessionId={lastSubmittedGameSessionId}
            onRefresh={loadLeaderboard}
          />
        </section>
      </div>

      <GameOverlay
        visible={state.status === 'gameOver' && isGameOverDialogOpen}
        score={state.score}
        highScore={highScore}
        hasSubmittedCurrentGame={hasSubmittedCurrentGame}
        isSubmittingScore={isSubmittingScore}
        submitError={submitError}
        onRetrySubmit={submitCurrentGameScore}
        onRestart={() => restart()}
        onClose={() => setIsGameOverDialogOpen(false)}
      />
    </main>
  );
}

function StatusCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/72 p-4 shadow-lg shadow-slate-950/20 backdrop-blur">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-black ${accent}`}>{value}</p>
    </div>
  );
}
