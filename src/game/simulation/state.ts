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
export type PowerType = 'doubleJump' | 'shooter' | 'invincible' | 'dash';
export type DifficultySetting = 'casual' | 'standard' | 'expert';
export type EnemyPressureSetting = 'low' | 'normal' | 'high';

export type RunSettings = {
  masterVolume: number;
  difficulty: DifficultySetting;
  enemyPressure: EnemyPressureSetting;
};

export type PowerInventory = Record<PowerType, boolean>;
export type PowerTimers = {
  invincibleMs: number;
};
export type PlayerPowerVariant = {
  bodyColor: number;
  detailColor: number;
  accentColor: number;
  auraColor: number | null;
};

export type RewardDefinition =
  | {
      kind: 'coins';
      amount: number;
    }
  | {
      kind: 'power';
      power: PowerType;
    };

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

export type RewardBlockState = Rect & {
  id: string;
  used: boolean;
  remainingHits: number;
  hitFlashMs: number;
  reward: RewardDefinition;
};

export type RewardRevealState = {
  id: string;
  reward: RewardDefinition;
  x: number;
  y: number;
  timerMs: number;
  durationMs: number;
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
  owner: 'enemy' | 'player';
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
  shootCooldownMs: number;
  airJumpsRemaining: number;
  presentationPower: PowerType | null;
  supportPlatformId: string | null;
  dead: boolean;
};

export type StageRuntime = {
  platforms: PlatformState[];
  checkpoints: CheckpointState[];
  collectibles: CollectibleState[];
  rewardBlocks: RewardBlockState[];
  rewardReveals: RewardRevealState[];
  hazards: HazardState[];
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  collectedCoins: number;
  totalCoins: number;
  allCoinsRecovered: boolean;
  exitReached: boolean;
};

export type SessionProgress = {
  unlockedStageIndex: number;
  totalCoins: number;
  activePowers: PowerInventory;
  powerTimers: PowerTimers;
  runSettings: RunSettings;
};

export const POWER_ORDER: PowerType[] = ['doubleJump', 'shooter', 'invincible', 'dash'];

export const POWER_LABELS: Record<PowerType, string> = {
  doubleJump: 'Double Jump',
  shooter: 'Shooter',
  invincible: 'Invincible',
  dash: 'Dash',
};

export const PLAYER_POWER_VARIANTS: Record<'base' | PowerType, PlayerPowerVariant> = {
  base: {
    bodyColor: 0xf5cf64,
    detailColor: 0x3f2412,
    accentColor: 0xf7f3d6,
    auraColor: null,
  },
  doubleJump: {
    bodyColor: 0x9df4b4,
    detailColor: 0x134a2a,
    accentColor: 0xeafff0,
    auraColor: null,
  },
  shooter: {
    bodyColor: 0xffb56f,
    detailColor: 0x51260d,
    accentColor: 0xffedc8,
    auraColor: null,
  },
  invincible: {
    bodyColor: 0x92f7ff,
    detailColor: 0x0b4254,
    accentColor: 0xf7f3d6,
    auraColor: 0x92f7ff,
  },
  dash: {
    bodyColor: 0xf7f3d6,
    detailColor: 0x445b9f,
    accentColor: 0xaec8ff,
    auraColor: null,
  },
};

export const DIFFICULTY_LABELS: Record<DifficultySetting, string> = {
  casual: 'Casual',
  standard: 'Standard',
  expert: 'Expert',
};

export const ENEMY_PRESSURE_LABELS: Record<EnemyPressureSetting, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
};

export const createDefaultPowerInventory = (): PowerInventory => ({
  doubleJump: false,
  shooter: false,
  invincible: false,
  dash: false,
});

export const createDefaultPowerTimers = (): PowerTimers => ({
  invincibleMs: 0,
});

export const createDefaultRunSettings = (): RunSettings => ({
  masterVolume: 0.7,
  difficulty: 'standard',
  enemyPressure: 'normal',
});

export const createDefaultSessionProgress = (): SessionProgress => ({
  unlockedStageIndex: 0,
  totalCoins: 0,
  activePowers: createDefaultPowerInventory(),
  powerTimers: createDefaultPowerTimers(),
  runSettings: createDefaultRunSettings(),
});

export const getActivePowerLabels = (powers: PowerInventory, timers: PowerTimers): string[] =>
  POWER_ORDER.filter((power) => powers[power] || (power === 'invincible' && timers.invincibleMs > 0)).map(
    (power) => POWER_LABELS[power],
  );

export const getPrimaryPowerVariant = (
  powers: PowerInventory,
  timers: PowerTimers,
): keyof typeof PLAYER_POWER_VARIANTS => {
  if (timers.invincibleMs > 0 || powers.invincible) {
    return 'invincible';
  }
  if (powers.shooter) {
    return 'shooter';
  }
  if (powers.doubleJump) {
    return 'doubleJump';
  }
  if (powers.dash) {
    return 'dash';
  }
  return 'base';
};

export const formatRunSettings = (settings: RunSettings): string =>
  `${DIFFICULTY_LABELS[settings.difficulty]} | ${ENEMY_PRESSURE_LABELS[settings.enemyPressure]} Enemies | Vol ${Math.round(settings.masterVolume * 100)}%`;
