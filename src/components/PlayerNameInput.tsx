import { UserRound } from 'lucide-react';
import { validatePlayerName } from '../utils/validatePlayerName';

interface PlayerNameInputProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function PlayerNameInput({ value, disabled, onChange }: PlayerNameInputProps) {
  const validation = validatePlayerName(value);

  return (
    <section className="mx-auto w-full max-w-4xl rounded-lg border border-slate-700/70 bg-slate-900/72 p-4 shadow-lg shadow-slate-950/20 backdrop-blur">
      <label className="flex flex-col gap-2 text-sm font-bold text-slate-200 sm:flex-row sm:items-center">
        <span className="flex items-center gap-2">
          <UserRound size={18} className="text-cyan-300" />
          昵称
        </span>
        <input
          className="min-h-12 flex-1 rounded-md border border-slate-700 bg-slate-950/70 px-4 text-base font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 disabled:cursor-not-allowed disabled:text-slate-400"
          value={value}
          disabled={disabled}
          maxLength={12}
          placeholder="2-12 位中文、英文、数字或下划线"
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <p className={`mt-2 text-xs ${validation.isValid ? 'text-cyan-300/80' : 'text-orange-300'}`}>
        {disabled ? '本局昵称已锁定' : validation.message}
      </p>
    </section>
  );
}
