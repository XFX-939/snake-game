import { Trophy } from 'lucide-react';

interface GameOverlayProps {
  score: number;
  highScore: number;
  visible: boolean;
  hasSubmittedCurrentGame: boolean;
  isSubmittingScore: boolean;
  submitError: string | null;
  onRestart: () => void;
  onRetrySubmit: () => void;
}

export function GameOverlay({
  score,
  highScore,
  visible,
  hasSubmittedCurrentGame,
  isSubmittingScore,
  submitError,
  onRestart,
  onRetrySubmit,
}: GameOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/78 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border border-orange-300/30 bg-slate-900 p-6 text-center shadow-2xl shadow-orange-950/40">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-400 text-slate-950 shadow-lg shadow-orange-500/30">
          <Trophy size={28} />
        </div>
        <h2 className="mt-4 text-2xl font-black text-white">游戏结束</h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-slate-700 bg-slate-950/70 p-4">
            <p className="text-xs text-slate-400">本局分数</p>
            <p className="mt-1 text-3xl font-black text-cyan-300">{score}</p>
          </div>
          <div className="rounded-md border border-slate-700 bg-slate-950/70 p-4">
            <p className="text-xs text-slate-400">历史最高</p>
            <p className="mt-1 text-3xl font-black text-orange-300">{highScore}</p>
          </div>
        </div>
        <div className="mt-4 rounded-md border border-slate-700 bg-slate-950/60 p-3 text-sm">
          {score <= 0 ? (
            <p className="text-slate-400">0 分不会提交到荣誉榜</p>
          ) : isSubmittingScore ? (
            <p className="text-cyan-300">成绩提交中...</p>
          ) : submitError ? (
            <div className="space-y-3">
              <p className="text-orange-300">{submitError}</p>
              <button
                className="h-10 w-full rounded-md border border-orange-300/50 bg-orange-400/10 font-bold text-orange-100 transition hover:bg-orange-400/20 active:scale-[0.98]"
                onClick={onRetrySubmit}
              >
                重试提交
              </button>
            </div>
          ) : hasSubmittedCurrentGame ? (
            <p className="text-emerald-300">成绩已提交</p>
          ) : (
            <p className="text-slate-400">等待提交成绩</p>
          )}
        </div>
        <button
          className="mt-6 h-12 w-full rounded-md bg-emerald-500 font-black text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          disabled={isSubmittingScore}
          onClick={onRestart}
        >
          再来一局
        </button>
      </div>
    </div>
  );
}
