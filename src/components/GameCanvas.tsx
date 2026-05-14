import { useEffect, useRef, useState } from 'react';
import { BOARD_SIZE } from '../game/constants';
import type { Direction, GameState } from '../game/types';

interface GameCanvasProps {
  state: GameState;
  onDirectionChange: (direction: Direction) => void;
}

const MIN_SWIPE_DISTANCE = 24;

export function GameCanvas({ state, onDirectionChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      setCanvasSize(entry.contentRect.width);
    });
    resizeObserver.observe(canvas);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize === 0) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const cellSize = rect.width / BOARD_SIZE;
    const radius = Math.max(4, cellSize * 0.22);

    ctx.fillStyle = '#07131a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let index = 0; index <= BOARD_SIZE; index += 1) {
      const offset = index * cellSize;
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset, rect.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, offset);
      ctx.lineTo(rect.width, offset);
      ctx.stroke();
    }

    state.snake.forEach((segment, index) => {
      const inset = cellSize * 0.12;
      const x = segment.x * cellSize + inset;
      const y = segment.y * cellSize + inset;
      const size = cellSize - inset * 2;
      const gradient = ctx.createLinearGradient(x, y, x + size, y + size);

      if (index === 0) {
        gradient.addColorStop(0, '#67e8f9');
        gradient.addColorStop(1, '#22c55e');
      } else {
        gradient.addColorStop(0, '#2dd4bf');
        gradient.addColorStop(1, '#16a34a');
      }

      ctx.fillStyle = gradient;
      ctx.shadowColor = index === 0 ? 'rgba(103, 232, 249, 0.55)' : 'rgba(34, 197, 94, 0.25)';
      ctx.shadowBlur = index === 0 ? 16 : 8;
      roundRect(ctx, x, y, size, size, radius);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    const foodCenterX = state.food.x * cellSize + cellSize / 2;
    const foodCenterY = state.food.y * cellSize + cellSize / 2;
    const foodRadius = cellSize * 0.32;
    const foodGradient = ctx.createRadialGradient(
      foodCenterX,
      foodCenterY,
      foodRadius * 0.2,
      foodCenterX,
      foodCenterY,
      foodRadius,
    );
    foodGradient.addColorStop(0, '#fed7aa');
    foodGradient.addColorStop(0.42, '#fb923c');
    foodGradient.addColorStop(1, '#ef4444');
    ctx.fillStyle = foodGradient;
    ctx.shadowColor = 'rgba(251, 146, 60, 0.7)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(foodCenterX, foodCenterY, foodRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [canvasSize, state]);

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;

    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < MIN_SWIPE_DISTANCE) {
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      onDirectionChange(deltaX > 0 ? 'RIGHT' : 'LEFT');
    } else {
      onDirectionChange(deltaY > 0 ? 'DOWN' : 'UP');
    }
  };

  return (
    <section className="mx-auto w-full max-w-[min(92vw,620px)] rounded-lg border border-cyan-300/20 bg-slate-950/78 p-3 shadow-2xl shadow-cyan-950/40 backdrop-blur sm:p-5">
      <canvas
        ref={canvasRef}
        className="touch-game-control block aspect-square w-full rounded-md border border-slate-700/70 bg-slate-950 shadow-glow"
        aria-label="贪吃蛇游戏棋盘"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </section>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
