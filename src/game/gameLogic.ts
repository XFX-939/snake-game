import {
  BOARD_SIZE,
  DIRECTION_VECTORS,
  INITIAL_DIRECTION,
  INITIAL_SNAKE_LENGTH,
  POINTS_PER_FOOD,
} from './constants';
import type { Difficulty, Direction, GameState, MoveResult, Position } from './types';

export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function isOppositeDirection(current: Direction, next: Direction): boolean {
  return (
    (current === 'UP' && next === 'DOWN') ||
    (current === 'DOWN' && next === 'UP') ||
    (current === 'LEFT' && next === 'RIGHT') ||
    (current === 'RIGHT' && next === 'LEFT')
  );
}

export function createInitialSnake(): Position[] {
  const centerY = Math.floor(BOARD_SIZE / 2);
  const centerX = Math.floor(BOARD_SIZE / 2);

  return Array.from({ length: INITIAL_SNAKE_LENGTH }, (_, index) => ({
    x: centerX - index,
    y: centerY,
  }));
}

export function isInsideBoard(position: Position): boolean {
  return position.x >= 0 && position.x < BOARD_SIZE && position.y >= 0 && position.y < BOARD_SIZE;
}

export function isOnSnake(position: Position, snake: Position[]): boolean {
  return snake.some((segment) => positionsEqual(segment, position));
}

export function generateFood(snake: Position[]): Position {
  const availableCells: Position[] = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const position = { x, y };
      if (!isOnSnake(position, snake)) {
        availableCells.push(position);
      }
    }
  }

  if (availableCells.length === 0) {
    return snake[0] ?? { x: 0, y: 0 };
  }

  return availableCells[Math.floor(Math.random() * availableCells.length)];
}

export function createInitialState(difficulty: Difficulty): GameState {
  const snake = createInitialSnake();

  return {
    snake,
    food: generateFood(snake),
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    score: 0,
    status: 'idle',
    difficulty,
  };
}

export function resolveDirection(current: Direction, next: Direction): Direction {
  return isOppositeDirection(current, next) ? current : next;
}

export function moveSnake(state: GameState): MoveResult {
  const direction = resolveDirection(state.direction, state.nextDirection);
  const vector = DIRECTION_VECTORS[direction];
  const currentHead = state.snake[0];
  const nextHead = {
    x: currentHead.x + vector.x,
    y: currentHead.y + vector.y,
  };

  const ateFood = positionsEqual(nextHead, state.food);
  const nextSnake = ateFood ? [nextHead, ...state.snake] : [nextHead, ...state.snake.slice(0, -1)];
  const bodyToCheck = ateFood ? state.snake : state.snake.slice(0, -1);
  const gameOver = !isInsideBoard(nextHead) || isOnSnake(nextHead, bodyToCheck);

  if (gameOver) {
    return {
      ateFood,
      gameOver,
      state: {
        ...state,
        direction,
        nextDirection: direction,
        status: 'gameOver',
      },
    };
  }

  return {
    ateFood,
    gameOver,
    state: {
      ...state,
      snake: nextSnake,
      food: ateFood ? generateFood(nextSnake) : state.food,
      direction,
      nextDirection: direction,
      score: ateFood ? state.score + POINTS_PER_FOOD : state.score,
    },
  };
}

export function applyDirection(state: GameState, direction: Direction): GameState {
  if (state.status === 'gameOver' || isOppositeDirection(state.direction, direction)) {
    return state;
  }

  return {
    ...state,
    nextDirection: direction,
  };
}
