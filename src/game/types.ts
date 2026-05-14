export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameStatus = 'idle' | 'running' | 'paused' | 'gameOver';

export type Difficulty = 'normal' | 'hard' | 'hell';

export interface Position {
  x: number;
  y: number;
}

export interface DifficultyConfig {
  label: string;
  speed: number;
}

export interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  status: GameStatus;
  difficulty: Difficulty;
}

export interface MoveResult {
  state: GameState;
  ateFood: boolean;
  gameOver: boolean;
}
