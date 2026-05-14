export function GameHeader() {
  return (
    <header className="mx-auto max-w-4xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Arcade Lab</p>
      <h1 className="text-3xl font-black text-white sm:text-5xl">贪吃蛇 Snake Game</h1>
      <p className="mt-3 text-sm text-slate-300 sm:text-base">方向键 / WASD 控制移动，空格开始或暂停</p>
    </header>
  );
}
