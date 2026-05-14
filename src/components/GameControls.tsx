import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { DIFFICULTIES } from '../game/constants';
import type { Difficulty, Direction, GameStatus } from '../game/types';

interface GameControlsProps {
  difficulty: Difficulty;
  status: GameStatus;
  startDisabled: boolean;
  restartDisabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onRestart: () => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onDirectionChange: (direction: Direction) => void;
}

export function GameControls({
  difficulty,
  status,
  startDisabled,
  restartDisabled,
  onStart,
  onPause,
  onRestart,
  onDifficultyChange,
  onDirectionChange,
}: GameControlsProps) {
  const isRunning = status === 'running';

  return (
    <section className="mx-auto grid w-full gap-5 lg:grid-cols-[1fr_auto]">
      <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/30">
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            className="control-button bg-emerald-500/90 text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            disabled={startDisabled || status === 'running'}
            onClick={onStart}
          >
            <Play size={18} />
            开始
          </button>
          <button
            className="control-button bg-cyan-500/90 text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            disabled={status !== 'running' && status !== 'paused'}
            onClick={onPause}
          >
            <Pause size={18} />
            {status === 'paused' ? '继续' : '暂停'}
          </button>
          <button
            className="control-button bg-slate-700 text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={restartDisabled}
            onClick={onRestart}
          >
            <RotateCcw size={18} />
            重新开始
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3" role="group" aria-label="难度选择">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((key) => (
            <button
              key={key}
              className={[
                'min-h-12 rounded-md border px-4 text-sm font-bold transition active:scale-[0.98]',
                difficulty === key
                  ? 'border-orange-300 bg-orange-400 text-slate-950 shadow-lg shadow-orange-500/20'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-cyan-300/70 hover:bg-slate-700',
              ].join(' ')}
              onClick={() => onDifficultyChange(key)}
            >
              {DIFFICULTIES[key].label}
              <span className="ml-2 text-xs opacity-70">{DIFFICULTIES[key].speed}ms</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid w-48 grid-cols-3 gap-2 lg:mx-0" aria-label="虚拟方向键">
        <span />
        <DirectionButton label="上" onClick={() => onDirectionChange('UP')}>
          <ArrowUp size={24} />
        </DirectionButton>
        <span />
        <DirectionButton label="左" onClick={() => onDirectionChange('LEFT')}>
          <ArrowLeft size={24} />
        </DirectionButton>
        <DirectionButton label="下" onClick={() => onDirectionChange('DOWN')}>
          <ArrowDown size={24} />
        </DirectionButton>
        <DirectionButton label="右" onClick={() => onDirectionChange('RIGHT')}>
          <ArrowRight size={24} />
        </DirectionButton>
      </div>
    </section>
  );
}

function DirectionButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="touch-game-control flex h-14 w-14 items-center justify-center rounded-md border border-cyan-300/25 bg-slate-800 text-cyan-100 shadow-lg shadow-slate-950/30 transition hover:bg-slate-700 active:scale-95 active:bg-cyan-500 active:text-slate-950 sm:h-16 sm:w-16"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
