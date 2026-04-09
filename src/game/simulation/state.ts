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

export type HazardKind = 'spikes';
export type EnemyKind = 'walker' | 'hopper' | 'turret' | 'charger' | 'flyer';
export type PlatformKind = 'static' | 'moving' | 'falling' | 'spring';

export type PlatformState = {
  id: string;
  kind: PlatformKind;
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  vx: number;
  vy: number;
  move?: { axis: 'x' | 'y'; range: number; speed: number; direction: 1 | -1 };
  fall?: { triggerDelayMs: number; timerMs: number; triggered: boolean; falling: boolean };
  spring?: { boost: number; cooldownMs: number; timerMs: number };
};

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
  supportY: number | null;
  supportPlatformId: string | null;
  laneLeft: number | null;
  laneRight: number | null;
  patrol?: { left: number; right: number; speed: number };
  hop?: {
    intervalMs: number;
    timerMs: number;
    impulse: number;
    speed: number;
    targetPlatformId: string | null;
    targetX: number | null;
    targetY: number | null;
  };
  turret?: { intervalMs: number; timerMs: number };
  charger?: {
    left: number;
    right: number;
    patrolSpeed: number;
    chargeSpeed: number;
    windupMs: number;
    cooldownMs: number;
    timerMs: number;
    state: 'patrol' | 'windup' | 'charge' | 'cooldown';
  };
  flyer?: {
    left: number;
    right: number;
    speed: number;
    bobAmp: number;
    bobSpeed: number;
    bobPhase: number;
    originY: number;
  };
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
  dashTimerMs: number;
  dashCooldownMs: number;
  supportPlatformId: string | null;
  dead: boolean;
};

export type StageRuntime = {
  platforms: PlatformState[];
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
  unlockedPowers: {
    dash: boolean;
  };
};
