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
export type TurretVariantId = 'resinBurst' | 'ionPulse';
export type PlatformKind = 'static' | 'moving' | 'falling' | 'spring';
export type PlatformSurfaceTerrainKind = 'brittleCrystal' | 'stickySludge';
export type PlatformSurfaceKind = PlatformSurfaceTerrainKind;
export type PlatformSurfaceMechanic = {
  kind: PlatformSurfaceTerrainKind;
};
export type GravityFieldKind = 'anti-grav-stream' | 'gravity-inversion-column';
export type StageObjectiveKind = 'restoreBeacon' | 'reactivateRelay' | 'powerLiftTower';
export type StageObjectiveTargetKind = 'checkpoint' | 'revealVolume' | 'scannerVolume';
export type BrittleSurfacePhase = 'intact' | 'warning' | 'ready' | 'broken';
export type PowerType = 'doubleJump' | 'shooter' | 'invincible' | 'dash';
export type DifficultySetting = 'casual' | 'standard' | 'expert';
export type EnemyPressureSetting = 'low' | 'normal' | 'high';

export type RunSettings = {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
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

export type GravityFieldState = Rect & {
  id: string;
  kind: GravityFieldKind;
  gravityCapsuleId: string | null;
};

export type GravityCapsuleButtonState = Rect & {
  id: string;
  activated: boolean;
};

export type GravityCapsuleState = {
  id: string;
  fieldId: string;
  shell: Rect;
  entryDoor: Rect;
  exitDoor: Rect;
  button: GravityCapsuleButtonState;
  entryRoute: Rect;
  buttonRoute: Rect;
  exitRoute: Rect;
  enabled: boolean;
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

export type ActivationNodeState = Rect & {
  id: string;
  activated: boolean;
};

export type TemporaryBridgeState = {
  id: string;
  scannerId: string;
  revealId: string | null;
  durationMs: number;
  remainingMs: number;
  active: boolean;
  pendingHide: boolean;
};

export type BrittlePlatformState = {
  phase: BrittleSurfacePhase;
  warningMs: number;
  unsupportedGapMs?: number;
  readyBreakDelayMs?: number;
  readyElapsedMs?: number;
  readyRemainingMs?: number;
};

export type PlatformState = {
  id: string;
  kind: PlatformKind;
  surfaceMechanic?: PlatformSurfaceMechanic;
  brittle?: BrittlePlatformState;
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  vx: number;
  vy: number;
  move?: { axis: 'x' | 'y'; range: number; speed: number; direction: 1 | -1 };
  fall?: {
    triggerDelayMs: number;
    stayArmThresholdMs: number;
    hopGapThresholdMs: number;
    timerMs: number;
    triggered: boolean;
    falling: boolean;
    accumulatedSupportMs: number;
    unsupportedGapMs: number;
  };
  spring?: { boost: number; cooldownMs: number; timerMs: number };
  reveal?: PlatformRevealState;
  temporaryBridge?: { scannerId: string; durationMs: number };
  magnetic?: { activationNodeId: string; powered: boolean };
};

export type CheckpointState = {
  id: string;
  rect: Rect;
  activated: boolean;
  supportPlatformId: string;
  respawn: Vector2;
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

export type StageObjectiveState = {
  kind: StageObjectiveKind;
  target: {
    kind: StageObjectiveTargetKind;
    id: string;
  };
  completed: boolean;
};

export type HazardState = {
  id: string;
  kind: HazardKind;
  rect: Rect;
};

export type EnemyDefeatCause = 'stomp' | 'thruster-impact' | 'plasma-blast';

export type EnemyState = {
  id: string;
  kind: EnemyKind;
  variant?: TurretVariantId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  alive: boolean;
  defeatCause: EnemyDefeatCause | null;
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
    committedHops?: number;
    targetPlatformId: string | null;
    targetX: number | null;
    targetY: number | null;
  };
  turret?: {
    intervalMs: number;
    timerMs: number;
    telegraphMs: number;
    telegraphDurationMs: number;
    burstGapMs: number;
    burstGapDurationMs: number;
    pendingShots: number;
  };
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
  variant?: TurretVariantId;
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
  thrusterPulseCooldownMs: number;
  thrusterPulseFuel: number;
  thrusterImpactWindowMs: number;
  airJumpsRemaining: number;
  presentationPower: PowerType | null;
  supportPlatformId: string | null;
  jumpSourceGravityCapsuleId: string | null;
  jumpSourceSupportPlatformId: string | null;
  phaseThroughSupportPlatformId: string | null;
  springContactPlatformId: string | null;
  lowGravityZoneId: string | null;
  gravityFieldId: string | null;
  gravityFieldKind: GravityFieldKind | null;
  gravityScale: number;
  suppressPresentation: boolean;
  dead: boolean;
};

export type StageRuntime = {
  platforms: PlatformState[];
  lowGravityZones: LowGravityZoneState[];
  gravityFields: GravityFieldState[];
  gravityCapsules: GravityCapsuleState[];
  revealVolumes: RevealVolumeState[];
  scannerVolumes: ScannerVolumeState[];
  activationNodes: ActivationNodeState[];
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
  objective: StageObjectiveState | null;
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
    gainMessage: 'Thruster Burst online',
  },
  shooter: {
    label: 'Plasma Blaster',
    shortLabel: 'PB',
    revealLabel: 'PLASMA BLASTER',
    helpSummary: 'Fires forward plasma shots that clear a lane before you commit to the approach.',
    gainMessage: 'Plasma Blaster online',
  },
  invincible: {
    label: 'Shield Field',
    shortLabel: 'SF',
    revealLabel: 'SHIELD FIELD',
    helpSummary: 'Projects a 10 second shield field that ignores hit loss while the timer is live.',
    gainMessage: 'Shield Field online',
  },
  dash: {
    label: 'Booster Dash',
    shortLabel: 'BD',
    revealLabel: 'BOOSTER DASH',
    helpSummary: 'Triggers a fast booster surge that helps clear long gaps and timing windows.',
    gainMessage: 'Booster Dash online',
  },
};

export const POWER_LABELS: Record<PowerType, string> = Object.fromEntries(
  Object.entries(POWER_PRESENTATION).map(([power, presentation]) => [power, presentation.label]),
) as Record<PowerType, string>;

export const PLAYER_POWER_VARIANTS: Record<'base' | PowerType, PlayerPowerVariant> = {
  base: {
    bodyColor: 0xf7f3d6,
    detailColor: 0x11141b,
    accentColor: 0x8fdff2,
    auraColor: null,
  },
  doubleJump: {
    bodyColor: 0xdfe8bf,
    detailColor: 0x31451d,
    accentColor: 0xf5cf64,
    auraColor: null,
  },
  shooter: {
    bodyColor: 0xf0c6a1,
    detailColor: 0x4d2312,
    accentColor: 0xe97652,
    auraColor: null,
  },
  invincible: {
    bodyColor: 0x9fdae8,
    detailColor: 0x173848,
    accentColor: 0xe9fff7,
    auraColor: 0x8fdff2,
  },
  dash: {
    bodyColor: 0xc6d2bf,
    detailColor: 0x263140,
    accentColor: 0xf5cf64,
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

export const TURRET_VARIANT_CONFIG: Record<
  TurretVariantId,
  {
    supportedStageId: 'amber-cavern' | 'sky-sanctum';
    telegraphMs: number;
    burstShots: number;
    burstGapMs: number;
    projectileSpeed: number;
    baseColor: number;
    telegraphColor: number;
    projectileColor: number;
  }
> = {
  resinBurst: {
    supportedStageId: 'amber-cavern',
    telegraphMs: 900,
    burstShots: 2,
    burstGapMs: 180,
    projectileSpeed: 260,
    baseColor: 0xf2b060,
    telegraphColor: 0xffd978,
    projectileColor: 0xffb34e,
  },
  ionPulse: {
    supportedStageId: 'sky-sanctum',
    telegraphMs: 980,
    burstShots: 1,
    burstGapMs: 0,
    projectileSpeed: 360,
    baseColor: 0x97ddff,
    telegraphColor: 0xb8f6ff,
    projectileColor: 0x7cefff,
  },
};

export const GRAVITY_FIELD_KINDS: GravityFieldKind[] = ['anti-grav-stream', 'gravity-inversion-column'];
export const PLATFORM_SURFACE_TERRAIN_KINDS: PlatformSurfaceTerrainKind[] = ['brittleCrystal', 'stickySludge'];
export const BRITTLE_WARNING_MS = 420;
export const BRITTLE_READY_BREAK_DELAY_MS = 220;
export const SLUDGE_GROUND_ACCEL_MULTIPLIER = 0.48;
export const SLUDGE_MAX_SPEED_MULTIPLIER = 0.58;

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

const STAGE_OBJECTIVE_PRESENTATION: Record<
  StageObjectiveKind,
  { briefing: string; completion: string; reminder: string }
> = {
  restoreBeacon: {
    briefing: 'Restore survey beacon',
    completion: 'Survey beacon restored',
    reminder: 'Restore survey beacon before exit',
  },
  reactivateRelay: {
    briefing: 'Reactivate relay',
    completion: 'Relay reactivated',
    reminder: 'Reactivate the relay before exit',
  },
  powerLiftTower: {
    briefing: 'Power lift tower',
    completion: 'Lift tower powered',
    reminder: 'Power the lift tower before exit',
  },
};

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
  musicVolume: 0.7,
  sfxVolume: 0.8,
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
  `All ${COLLECTIBLE_PRESENTATION.plural} recovered. Health restored`;

export const getCollectibleRewardRevealLabel = (): string => COLLECTIBLE_PRESENTATION.rewardRevealLabel;

export const getCollectibleRewardBlockLabel = (remainingHits: number): string =>
  remainingHits > 0 ? `${COLLECTIBLE_PRESENTATION.rewardBlockPrefix}${remainingHits}` : '--';

export const getStageObjectiveBriefing = (kind: StageObjectiveKind): string =>
  STAGE_OBJECTIVE_PRESENTATION[kind].briefing;

export const getStageObjectiveCompletionMessage = (kind: StageObjectiveKind): string =>
  STAGE_OBJECTIVE_PRESENTATION[kind].completion;

export const getStageObjectiveExitReminder = (kind: StageObjectiveKind): string =>
  STAGE_OBJECTIVE_PRESENTATION[kind].reminder;

export const normalizeRevealedPlatformIds = (ids: Iterable<string>): string[] => [...new Set(ids)].sort();

export const normalizeTemporaryBridgeIds = (ids: Iterable<string>): string[] => [...new Set(ids)].sort();

export const isPlatformRevealed = (
  platform: Pick<PlatformState, 'reveal'>,
  revealedPlatformIds: readonly string[],
): boolean => !platform.reveal || revealedPlatformIds.includes(platform.reveal.id);

export const isPlatformActive = (
  platform: Pick<PlatformState, 'reveal' | 'temporaryBridge' | 'magnetic' | 'id'>,
  revealedPlatformIds: readonly string[],
  activeTemporaryBridgeIds: readonly string[] = [],
): boolean =>
  isPlatformRevealed(platform, revealedPlatformIds) &&
  (!platform.temporaryBridge || activeTemporaryBridgeIds.includes(platform.id)) &&
  (!platform.magnetic || platform.magnetic.powered);

export const isPlatformVisible = (
  platform: Pick<PlatformState, 'reveal' | 'temporaryBridge' | 'magnetic' | 'id'>,
  revealedPlatformIds: readonly string[],
  activeTemporaryBridgeIds: readonly string[] = [],
): boolean =>
  isPlatformActive(platform, revealedPlatformIds, activeTemporaryBridgeIds) ||
  Boolean(platform.magnetic) ||
  Boolean(platform.reveal && platform.temporaryBridge && isPlatformRevealed(platform, revealedPlatformIds));

export const isTopSurfaceOnlyPlatform = (
  platform: Pick<PlatformState, 'magnetic'>,
): boolean => Boolean(platform.magnetic);

export const isTimedRevealBridgeLegible = (
  bridge: Pick<TemporaryBridgeState, 'revealId'>,
  revealedPlatformIds: readonly string[],
): boolean => bridge.revealId === null || revealedPlatformIds.includes(bridge.revealId);

export const createInactiveScannerVolumeState = (
  volume: Pick<ScannerVolumeState, 'id' | 'x' | 'y' | 'width' | 'height' | 'temporaryBridgeIds'>,
): ScannerVolumeState => ({
  ...volume,
  temporaryBridgeIds: [...volume.temporaryBridgeIds],
  activated: false,
  playerInside: false,
});

export const createInactiveActivationNodeState = (
  node: Pick<ActivationNodeState, 'id' | 'x' | 'y' | 'width' | 'height'>,
): ActivationNodeState => ({
  ...node,
  activated: false,
});

export const createResetGravityCapsuleState = (
  capsule: Pick<GravityCapsuleState, 'id' | 'fieldId' | 'shell' | 'entryDoor' | 'exitDoor' | 'entryRoute' | 'buttonRoute' | 'exitRoute'> & {
    button: Pick<GravityCapsuleButtonState, 'id' | 'x' | 'y' | 'width' | 'height'>;
  },
): GravityCapsuleState => ({
  ...capsule,
  shell: { ...capsule.shell },
  entryDoor: { ...capsule.entryDoor },
  exitDoor: { ...capsule.exitDoor },
  entryRoute: { ...capsule.entryRoute },
  buttonRoute: { ...capsule.buttonRoute },
  exitRoute: { ...capsule.exitRoute },
  button: {
    ...capsule.button,
    activated: false,
  },
  enabled: true,
});

export const createInactiveTemporaryBridgeState = (
  bridge: Pick<TemporaryBridgeState, 'id' | 'scannerId' | 'durationMs' | 'revealId'>,
): TemporaryBridgeState => ({
  ...bridge,
  remainingMs: 0,
  active: false,
  pendingHide: false,
});

export const isBrittlePlatformBroken = (
  platform: Pick<PlatformState, 'surfaceMechanic' | 'brittle'>,
): boolean => platform.surfaceMechanic?.kind === 'brittleCrystal' && platform.brittle?.phase === 'broken';

export const isBrittlePlatformWarning = (
  platform: Pick<PlatformState, 'surfaceMechanic' | 'brittle'>,
): boolean => platform.surfaceMechanic?.kind === 'brittleCrystal' && platform.brittle?.phase === 'warning';

export const isBrittlePlatformReady = (
  platform: Pick<PlatformState, 'surfaceMechanic' | 'brittle'>,
): boolean => platform.surfaceMechanic?.kind === 'brittleCrystal' && platform.brittle?.phase === 'ready';

export const isPlatformTerrainSupportActive = (
  platform: Pick<PlatformState, 'surfaceMechanic' | 'brittle'>,
): boolean => !isBrittlePlatformBroken(platform);

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
  `${DIFFICULTY_LABELS[settings.difficulty]} | ${ENEMY_PRESSURE_LABELS[settings.enemyPressure]} Enemies | Vol M${Math.round(
    settings.musicVolume * 100,
  )}%/S${Math.round(settings.sfxVolume * 100)}%`;
