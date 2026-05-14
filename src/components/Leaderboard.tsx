import { Crown, Loader2, Medal, Trophy } from 'lucide-react';
import { DIFFICULTIES } from '../game/constants';
import type { SnakeScore } from '../services/leaderboardApi';

interface LeaderboardProps {
  scores: SnakeScore[];
  isLoading: boolean;
  error: string | null;
  highlightedGameSessionId: string | null;
  onRefresh: () => void;
}

export function Leaderboard({ scores, isLoading, error, highlightedGameSessionId, onRefresh }: LeaderboardProps) {
  return (
    <aside className="w-full rounded-lg border border-cyan-300/20 bg-slate-950/78 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/75">TOP10</p>
          <h2 className="mt-1 text-xl font-black text-white">荣誉榜</h2>
        </div>
        <button
          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-300/70 hover:bg-slate-700 active:scale-[0.98]"
          onClick={onRefresh}
        >
          刷新
        </button>
      </div>

      {isLoading ? (
        <div className="mt-6 flex min-h-44 items-center justify-center gap-2 text-sm text-slate-300">
          <Loader2 size={18} className="animate-spin text-cyan-300" />
          loading
        </div>
      ) : error ? (
        <div className="mt-5 rounded-md border border-orange-300/30 bg-orange-500/10 p-3 text-sm text-orange-200">
          {error}
        </div>
      ) : scores.length === 0 ? (
        <div className="mt-6 flex min-h-44 items-center justify-center rounded-md border border-slate-800 bg-slate-900/60 text-sm text-slate-400">
          暂无成绩
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {scores.map((score, index) => (
            <LeaderboardRow
              key={score.id}
              score={score}
              rank={index + 1}
              highlighted={highlightedGameSessionId === score.game_session_id}
            />
          ))}
        </div>
      )}
    </aside>
  );
}

function LeaderboardRow({ score, rank, highlighted }: { score: SnakeScore; rank: number; highlighted: boolean }) {
  const rankStyle = getRankStyle(rank);

  return (
    <div
      className={[
        'grid grid-cols-[2.25rem_minmax(0,1fr)_4rem] items-center gap-2 rounded-md border p-3 text-sm transition',
        rankStyle.container,
        highlighted ? 'ring-2 ring-cyan-300/80' : '',
      ].join(' ')}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-md font-black ${rankStyle.badge}`}>
        {rank <= 3 ? rankStyle.icon : rank}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-black text-white">{score.player_name}</p>
          {highlighted ? <span className="shrink-0 rounded bg-cyan-300 px-1.5 py-0.5 text-[10px] font-black text-slate-950">本局</span> : null}
        </div>
        <p className="mt-1 truncate text-xs text-slate-400">
          {DIFFICULTIES[score.difficulty].label} · {score.duration_seconds}s · {formatCreatedAt(score.created_at)}
        </p>
      </div>
      <p className="text-right text-lg font-black text-cyan-300">{score.score}</p>
    </div>
  );
}

function getRankStyle(rank: number) {
  if (rank === 1) {
    return {
      container: 'border-yellow-300/40 bg-yellow-400/12 shadow-lg shadow-yellow-950/20',
      badge: 'bg-yellow-300 text-slate-950',
      icon: <Crown size={18} />,
    };
  }

  if (rank === 2) {
    return {
      container: 'border-slate-300/35 bg-slate-300/10',
      badge: 'bg-slate-200 text-slate-950',
      icon: <Trophy size={17} />,
    };
  }

  if (rank === 3) {
    return {
      container: 'border-orange-300/35 bg-orange-400/10',
      badge: 'bg-orange-300 text-slate-950',
      icon: <Medal size={17} />,
    };
  }

  return {
    container: 'border-slate-800 bg-slate-900/60',
    badge: 'bg-slate-800 text-slate-300',
    icon: rank,
  };
}

function formatCreatedAt(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
