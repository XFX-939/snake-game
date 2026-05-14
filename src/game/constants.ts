import type { Difficulty, DifficultyConfig, Direction, Position } from './types';

export const BOARD_SIZE = 20;
export const INITIAL_SNAKE_LENGTH = 3;
export const POINTS_PER_FOOD = 10;
export const HIGH_SCORE_KEY = 'snake-game-high-score';

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  normal: { label: '普通', speed: 160 },
  hard: { label: '困难', speed: 110 },
  hell: { label: '地狱', speed: 75 },
};

export const STATUS_LABELS = {
  idle: '未开始',
  running: '进行中',
  paused: '暂停',
  gameOver: '已结束',
} as const;

export const DIRECTION_VECTORS: Record<Direction, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const INITIAL_DIRECTION: Direction = 'RIGHT';
