export type Vector2 = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HazardKind = 'spikes' | 'lava' | 'pit';
export type EnemyKind = 'walker' | 'hopper' | 'turret';

export type CheckpointState = {
  id: string;
  rect: Rect;
  activated: boolean;
};

export type CollectibleState = {
  id: string;
  position: Vector2;
  collected: boolean;
};

export type HazardState = {
  id: string;
  kind: HazardKind;
  rect: Rect;
};

export type EnemyState = {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  alive: boolean;
  direction: 1 | -1;
  patrol?: { left: number; right: number; speed: number };
  hop?: { intervalMs: number; timerMs: number; impulse: number; speed: number };
  turret?: { intervalMs: number; timerMs: number };
};

export type ProjectileState = {
  id: string;
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  alive: boolean;
};

export type PlayerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  onGround: boolean;
  coyoteMs: number;
  jumpBufferMs: number;
  health: number;
  maxHealth: number;
  invulnerableMs: number;
  dead: boolean;
};

export type StageRuntime = {
  checkpoints: CheckpointState[];
  collectibles: CollectibleState[];
  hazards: HazardState[];
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  exitReached: boolean;
};

export type SessionProgress = {
  unlockedStageIndex: number;
  totalCrystals: number;
};
