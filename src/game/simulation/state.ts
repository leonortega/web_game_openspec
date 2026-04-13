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
export type LauncherKind = 'bouncePod' | 'gasVent';
export type TerrainSurfaceKind = 'brittleCrystal' | 'stickySludge';
export type BrittleSurfacePhase = 'intact' | 'warning' | 'expired' | 'broken';
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
export type PowerPresentation = {
  label: string;
  shortLabel: string;
  revealLabel: string;
  helpSummary: string;
  gainMessage: string;
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

export type PlatformRevealState = {
  id: string;
};

export type LowGravityZoneState = Rect & {
  id: string;
  gravityScale: number;
};

export type RevealVolumeState = Rect & {
  id: string;
  revealPlatformIds: string[];
};

export type ScannerVolumeState = Rect & {
  id: string;
  temporaryBridgeIds: string[];
  activated: boolean;
  playerInside: boolean;
};

export type TemporaryBridgeState = {
  id: string;
  scannerId: string;
  durationMs: number;
  remainingMs: number;
  active: boolean;
  pendingHide: boolean;
};

export type TerrainSurfaceState = Rect & {
  id: string;
  kind: TerrainSurfaceKind;
  supportPlatformId: string;
  brittle?: {
    phase: BrittleSurfacePhase;
    warningMs: number;
  };
};

export type LauncherState = Rect & {
  id: string;
  kind: LauncherKind;
  supportPlatformId: string;
  direction: Vector2;
  impulse: number;
  cooldownMs: number;
  timerMs: number;
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
  reveal?: PlatformRevealState;
  temporaryBridge?: { scannerId: string; durationMs: number };
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
  supportTerrainSurfaceId: string | null;
  coyoteTerrainSurfaceKind: TerrainSurfaceKind | null;
  launcherContactId: string | null;
  lowGravityZoneId: string | null;
  gravityScale: number;
  dead: boolean;
};

export type StageRuntime = {
  platforms: PlatformState[];
  terrainSurfaces: TerrainSurfaceState[];
  launchers: LauncherState[];
  lowGravityZones: LowGravityZoneState[];
  revealVolumes: RevealVolumeState[];
  scannerVolumes: ScannerVolumeState[];
  temporaryBridges: TemporaryBridgeState[];
  revealedPlatformIds: string[];
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

export const POWER_PRESENTATION: Record<PowerType, PowerPresentation> = {
  doubleJump: {
    label: 'Thruster Burst',
    shortLabel: 'TB',
    revealLabel: 'THRUSTER BURST',
    helpSummary: 'Grants one extra mid-air burn for course correction or a late recovery jump.',
    gainMessage: 'Power gained: Thruster Burst',
  },
  shooter: {
    label: 'Plasma Blaster',
    shortLabel: 'PB',
    revealLabel: 'PLASMA BLASTER',
    helpSummary: 'Fires forward plasma shots that clear a lane before you commit to the approach.',
    gainMessage: 'Power gained: Plasma Blaster',
  },
  invincible: {
    label: 'Shield Field',
    shortLabel: 'SF',
    revealLabel: 'SHIELD FIELD',
    helpSummary: 'Projects a 10 second shield field that ignores hit loss while the timer is live.',
    gainMessage: 'Power gained: Shield Field for 10s',
  },
  dash: {
    label: 'Booster Dash',
    shortLabel: 'BD',
    revealLabel: 'BOOSTER DASH',
    helpSummary: 'Triggers a fast booster surge that helps clear long gaps and timing windows.',
    gainMessage: 'Power gained: Booster Dash',
  },
};

export const POWER_LABELS: Record<PowerType, string> = Object.fromEntries(
  Object.entries(POWER_PRESENTATION).map(([power, presentation]) => [power, presentation.label]),
) as Record<PowerType, string>;

export const PLAYER_POWER_VARIANTS: Record<'base' | PowerType, PlayerPowerVariant> = {
  base: {
    bodyColor: 0xe7edf5,
    detailColor: 0x284257,
    accentColor: 0x9ed6ff,
    auraColor: null,
  },
  doubleJump: {
    bodyColor: 0xe3f8f2,
    detailColor: 0x2a7b68,
    accentColor: 0x7ff0cb,
    auraColor: null,
  },
  shooter: {
    bodyColor: 0xf8d8bf,
    detailColor: 0x7d3d14,
    accentColor: 0xff8f45,
    auraColor: null,
  },
  invincible: {
    bodyColor: 0xd8fbff,
    detailColor: 0x17657d,
    accentColor: 0xffffff,
    auraColor: 0x8ae9ff,
  },
  dash: {
    bodyColor: 0xeaf1f8,
    detailColor: 0x365f9f,
    accentColor: 0x7eb7ff,
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

export const LAUNCHER_KINDS: LauncherKind[] = ['bouncePod', 'gasVent'];
export const TERRAIN_SURFACE_KINDS: TerrainSurfaceKind[] = ['brittleCrystal', 'stickySludge'];
export const BRITTLE_WARNING_MS = 420;
export const SLUDGE_GROUND_ACCEL_MULTIPLIER = 0.48;
export const SLUDGE_MAX_SPEED_MULTIPLIER = 0.58;
export const SLUDGE_JUMP_MULTIPLIER = 0.84;

export const COLLECTIBLE_PRESENTATION = {
  singular: 'research sample',
  plural: 'research samples',
  hudLabel: 'Research Samples',
  rewardRevealLabel: 'SAMPLE',
  rewardBlockPrefix: 'RS',
} as const;

export const CHECKPOINT_PRESENTATION = {
  singular: 'survey beacon',
  plural: 'survey beacons',
} as const;

const capitalize = (value: string): string => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

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

export const getPowerLabel = (power: PowerType): string => POWER_PRESENTATION[power].label;

export const getPowerShortLabel = (power: PowerType): string => POWER_PRESENTATION[power].shortLabel;

export const getPowerRevealLabel = (power: PowerType): string => POWER_PRESENTATION[power].revealLabel;

export const getPowerHelpSummary = (power: PowerType): string => POWER_PRESENTATION[power].helpSummary;

export const getPowerGainMessage = (power: PowerType): string => POWER_PRESENTATION[power].gainMessage;

export const formatCollectibleNoun = (count: number): string =>
  count === 1 ? COLLECTIBLE_PRESENTATION.singular : COLLECTIBLE_PRESENTATION.plural;

export const formatCheckpointNoun = (count: number): string =>
  count === 1 ? CHECKPOINT_PRESENTATION.singular : CHECKPOINT_PRESENTATION.plural;

export const formatCollectibleCount = (count: number): string => `${count} ${formatCollectibleNoun(count)}`;

export const formatHudCollectibleSummary = (
  stageCollected: number,
  stageTotal: number,
  runTotal: number,
): string => `${stageCollected}/${stageTotal} in sector (${formatCollectibleCount(runTotal)} total)`;

export const formatRunCollectibleSummary = (runTotal: number): string => `Run research samples: ${runTotal}`;

export const formatStageCollectibleSummary = (stageCollected: number, stageTotal: number): string =>
  `Sector research samples: ${stageCollected}/${stageTotal}`;

export const formatStageCollectibleTarget = (stageTotal: number): string => `Sector research samples: ${stageTotal}`;

export const formatCheckpointStatus = (activated: number, total: number): string =>
  `${capitalize(formatCheckpointNoun(total))} online: ${activated}/${total}`;

export const getCheckpointActivatedMessage = (): string => `${capitalize(CHECKPOINT_PRESENTATION.singular)} activated`;

export const getCollectibleRecoveredMessage = (): string => `${capitalize(COLLECTIBLE_PRESENTATION.singular)} recovered`;

export const getCollectibleRewardMessage = (remainingHits: number): string =>
  remainingHits > 0
    ? `${capitalize(COLLECTIBLE_PRESENTATION.singular)} gained - ${remainingHits} left`
    : `${capitalize(COLLECTIBLE_PRESENTATION.singular)} gained`;

export const getAllCollectiblesRecoveredMessage = (): string =>
  `All ${COLLECTIBLE_PRESENTATION.plural} recovered - energy restored`;

export const getCollectibleRewardRevealLabel = (): string => COLLECTIBLE_PRESENTATION.rewardRevealLabel;

export const getCollectibleRewardBlockLabel = (remainingHits: number): string =>
  remainingHits > 0 ? `${COLLECTIBLE_PRESENTATION.rewardBlockPrefix}${remainingHits}` : '--';

export const normalizeRevealedPlatformIds = (ids: Iterable<string>): string[] => [...new Set(ids)].sort();

export const normalizeTemporaryBridgeIds = (ids: Iterable<string>): string[] => [...new Set(ids)].sort();

export const isPlatformRevealed = (
  platform: Pick<PlatformState, 'reveal'>,
  revealedPlatformIds: readonly string[],
): boolean => !platform.reveal || revealedPlatformIds.includes(platform.reveal.id);

export const isPlatformActive = (
  platform: Pick<PlatformState, 'reveal' | 'temporaryBridge' | 'id'>,
  revealedPlatformIds: readonly string[],
  activeTemporaryBridgeIds: readonly string[] = [],
): boolean =>
  isPlatformRevealed(platform, revealedPlatformIds) &&
  (!platform.temporaryBridge || activeTemporaryBridgeIds.includes(platform.id));

export const createInactiveScannerVolumeState = (
  volume: Pick<ScannerVolumeState, 'id' | 'x' | 'y' | 'width' | 'height' | 'temporaryBridgeIds'>,
): ScannerVolumeState => ({
  ...volume,
  temporaryBridgeIds: [...volume.temporaryBridgeIds],
  activated: false,
  playerInside: false,
});

export const createInactiveTemporaryBridgeState = (
  bridge: Pick<TemporaryBridgeState, 'id' | 'scannerId' | 'durationMs'>,
): TemporaryBridgeState => ({
  ...bridge,
  remainingMs: 0,
  active: false,
  pendingHide: false,
});

export const isBrittleSurfaceBroken = (
  surface: Pick<TerrainSurfaceState, 'kind' | 'brittle'>,
): boolean => surface.kind === 'brittleCrystal' && surface.brittle?.phase === 'broken';

export const isBrittleSurfaceWarning = (
  surface: Pick<TerrainSurfaceState, 'kind' | 'brittle'>,
): boolean => surface.kind === 'brittleCrystal' && surface.brittle?.phase === 'warning';

export const isTerrainSurfaceSupportActive = (
  surface: Pick<TerrainSurfaceState, 'kind' | 'brittle'>,
): boolean => !isBrittleSurfaceBroken(surface);

export const formatActivePowerSummary = (powers: PowerInventory, timers: PowerTimers): string => {
  const activeLabels = getActivePowerLabels(powers, timers);
  if (activeLabels.length === 0) {
    return 'None';
  }

  return `${activeLabels.join(', ')}${timers.invincibleMs > 0 ? ` (${Math.ceil(timers.invincibleMs / 1000)}s)` : ''}`;
};

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
