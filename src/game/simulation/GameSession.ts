import { stageDefinitions, type StageDefinition } from '../content/stages';
import { gravityCapsuleShellWallThickness } from '../content/stages/builders';
import {
  findGroundedEnemySupport,
  resolveGroundedEnemyRect,
  resolveCheckpointRect,
  resolveCheckpointRespawnPoint,
  resolveHazardRect,
} from '../content/stages/builders';
import type { InputState } from '../input/actions';
import { AUDIO_CUES, type AudioCue } from '../../audio/audioContract';
import { clamp } from './math';
import {
  BRITTLE_READY_BREAK_DELAY_MS,
  BRITTLE_WARNING_MS,
  SLUDGE_GROUND_ACCEL_MULTIPLIER,
  SLUDGE_MAX_SPEED_MULTIPLIER,
  createDefaultPowerInventory,
  createDefaultPowerTimers,
  createDefaultRunSettings,
  createDefaultSessionProgress,
  getAllCollectiblesRecoveredMessage,
  getCheckpointActivatedMessage,
  getPowerGainMessage,
  getStageObjectiveBriefing,
  getStageObjectiveCompletionMessage,
  getStageObjectiveExitReminder,
  type CheckpointState,
  type CollectibleState,
  type DifficultySetting,
  type EnemyPressureSetting,
  type EnemyDefeatCause,
  type EnemyState,
  type ActivationNodeState,
  type GravityCapsuleState,
  type GravityFieldKind,
  type GravityFieldState,
  type HazardState,
  type LowGravityZoneState,
  type PlatformState,
  type PlayerState,
  type PowerType,
  type ProjectileState,
  type ScannerVolumeState,
  type TemporaryBridgeState,
  type RevealVolumeState,
  type Rect,
  type RewardBlockState,
  type RewardRevealState,
  type RunSettings,
  type SessionProgress,
  type StageObjectiveState,
  type StageRuntime,
  TURRET_VARIANT_CONFIG,
  type TurretVariantId,
  createInactiveActivationNodeState,
  createResetGravityCapsuleState,
  createInactiveScannerVolumeState,
  createInactiveTemporaryBridgeState,
  isPlatformActive,
  isPlatformTerrainSupportActive,
  isTopSurfaceOnlyPlatform,
  isTimedRevealBridgeLegible,
  normalizeRevealedPlatformIds,
} from './state';

const PLAYER_WIDTH = 26;
const PLAYER_HEIGHT = 42;
const MAX_MOVE_SPEED = 260;
const GROUND_ACCEL = 1800;
const AIR_ACCEL = 1200;
const JUMP_SPEED = 640;
const MAX_FALL_SPEED = 1100;
const COYOTE_TIME_MS = 120;
const JUMP_BUFFER_MS = 140;
const INVULNERABLE_MS = 1000;
const RESPAWN_DELAY_MS = 900;
const STOMP_BOUNCE = 360;
const DASH_SPEED = 520;
const DASH_DURATION_MS = 120;
const DASH_COOLDOWN_MS = 700;
const SHOOT_COOLDOWN_MS = 260;
const PLAYER_PROJECTILE_SPEED = 520;
const POWER_INVINCIBLE_MS = 10_000;
const REWARD_REVEAL_MS = 1000;
const REWARD_BLOCK_FLASH_MS = 180;
const EXIT_FINISH_DURATION_MS = 720;
const TURRET_VIEW_LEAD_MARGIN = 96;
const CHARGER_TRIGGER_RANGE = 220;
const ENEMY_SPACING_BUFFER = 28;
const HAZARD_SPACING_BUFFER = 52;
const HOP_HORIZONTAL_REACH = 280;
const HOP_VERTICAL_REACH = 170;
const HOP_FLIGHT_TIME_MIN = 0.42;
const HOP_FLIGHT_TIME_MAX = 0.78;
const HOP_HORIZONTAL_SPEED_LIMIT = 420;
const HOP_IMPULSE_LIMIT = 980;
const FALL_STAY_ARM_THRESHOLD_MS = 120;
const FALL_HOP_GAP_THRESHOLD_MS = 50;
const PLAYER_PRESENTATION_ORDER: PowerType[] = ['invincible', 'shooter', 'doubleJump', 'dash'];
const DEFAULT_TURRET_PROJECTILE_SPEED = 260;
const GRAVITY_FIELD_SCALE: Record<GravityFieldKind, number> = {
  'anti-grav-stream': -0.38,
  'gravity-inversion-column': -1,
};

const DIFFICULTY_CONFIG: Record<
  DifficultySetting,
  { maxHealth: number; enemySpeedMultiplier: number; enemyIntervalMultiplier: number }
> = {
  casual: { maxHealth: 4, enemySpeedMultiplier: 0.92, enemyIntervalMultiplier: 1.08 },
  standard: { maxHealth: 3, enemySpeedMultiplier: 1, enemyIntervalMultiplier: 1 },
  expert: { maxHealth: 2, enemySpeedMultiplier: 1.12, enemyIntervalMultiplier: 0.9 },
};

const ENEMY_PRESSURE_CONFIG: Record<
  EnemyPressureSetting,
  { keepEnemy: (index: number) => boolean; enemySpeedMultiplier: number; enemyIntervalMultiplier: number }
> = {
  low: {
    keepEnemy: (index) => index % 3 !== 2,
    enemySpeedMultiplier: 0.94,
    enemyIntervalMultiplier: 1.1,
  },
  normal: {
    keepEnemy: () => true,
    enemySpeedMultiplier: 1,
    enemyIntervalMultiplier: 1,
  },
  high: {
    keepEnemy: () => true,
    enemySpeedMultiplier: 1.16,
    enemyIntervalMultiplier: 0.82,
  },
};

export type SessionSnapshot = {
  stageIndex: number;
  stage: StageDefinition;
  stageRuntime: StageRuntime;
  currentSegmentId: string;
  player: PlayerState;
  progress: SessionProgress;
  activeCheckpointId: string | null;
  stageStartCoins: number;
  exitFinish: {
    active: boolean;
    timerMs: number;
    durationMs: number;
    suppressPresentation: boolean;
  };
  levelCompleted: boolean;
  levelJustCompleted: boolean;
  gameCompleted: boolean;
  stageMessage: string;
  stageMessageTimerMs: number;
  respawnTimerMs: number;
};

type CheckpointRestoreState = {
  collectedCollectibleIds: Set<string>;
  coinRewardBlocks: Map<string, { used: boolean; remainingHits: number }>;
  collectedCoins: number;
  allCoinsRecovered: boolean;
  objectiveCompleted: boolean;
};

const createStageObjectiveState = (
  stage: StageDefinition,
  completed = false,
): StageObjectiveState | null =>
  stage.stageObjective
    ? {
        kind: stage.stageObjective.kind,
        target: { ...stage.stageObjective.target },
        completed,
      }
    : null;

const EXIT_FINISH_HIDE_PROGRESS = 0.3;

type SolidSurface =
  | {
      id: string;
      kind: 'platform';
      x: number;
      y: number;
      width: number;
      height: number;
      vx: number;
      vy: number;
      platform: PlatformState;
    }
  | {
      id: string;
      kind: 'rewardBlock';
      x: number;
      y: number;
      width: number;
      height: number;
      vx: 0;
      vy: 0;
      rewardBlock: RewardBlockState;
    }
  | {
      id: string;
      kind: 'gravityCapsuleWall';
      x: number;
      y: number;
      width: number;
      height: number;
      vx: 0;
      vy: 0;
      gravityCapsuleId: string;
    };

type GravityCapsuleWallSurface = Extract<SolidSurface, { kind: 'gravityCapsuleWall' }>;

const intersectsRect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

const playerRect = (player: PlayerState): Rect => ({
  x: player.x,
  y: player.y,
  width: player.width,
  height: player.height,
});

const enemyRect = (enemy: EnemyState): Rect => ({
  x: enemy.x,
  y: enemy.y,
  width: enemy.width,
  height: enemy.height,
});

const projectileRect = (projectile: ProjectileState): Rect => ({
  x: projectile.x,
  y: projectile.y,
  width: projectile.width,
  height: projectile.height,
});

const expandRect = (rect: Rect, paddingX: number, paddingY = paddingX): Rect => ({
  x: rect.x - paddingX,
  y: rect.y - paddingY,
  width: rect.width + paddingX * 2,
  height: rect.height + paddingY * 2,
});

const groundedEnemyKinds: EnemyState['kind'][] = ['walker', 'hopper', 'turret', 'charger'];

const isGroundedEnemy = (enemy: Pick<EnemyState, 'kind'>): boolean => groundedEnemyKinds.includes(enemy.kind);

const isStableEnemySupport = (
  platform: Pick<PlatformState, 'kind' | 'reveal' | 'temporaryBridge' | 'magnetic'>,
): boolean =>
  (platform.kind === 'static' || platform.kind === 'spring') &&
  !platform.reveal &&
  !platform.temporaryBridge &&
  !platform.magnetic;

const clampLaneToSupport = (
  support: PlatformState | null,
  left: number | null,
  right: number | null,
  enemyWidth: number,
): { laneLeft: number | null; laneRight: number | null } => {
  if (!support) {
    return { laneLeft: left, laneRight: right };
  }

  const supportLeft = support.x;
  const supportRight = support.x + support.width - enemyWidth;
  const laneLeft = left == null ? supportLeft : Math.max(supportLeft, left);
  const laneRight = right == null ? supportRight : Math.min(supportRight, right - enemyWidth);

  if (laneRight < laneLeft) {
    return { laneLeft: supportLeft, laneRight: supportRight };
  }

  return { laneLeft, laneRight };
};

const isGroundedSpacingEnemy = (enemy: Pick<EnemyState, 'kind'>): boolean =>
  enemy.kind === 'walker' || enemy.kind === 'turret' || enemy.kind === 'charger';

const createTurretVariantRuntime = (
  variant: TurretVariantId,
  intervalMultiplier: number,
): { telegraphDurationMs: number; burstGapDurationMs: number } => ({
  telegraphDurationMs: TURRET_VARIANT_CONFIG[variant].telegraphMs * intervalMultiplier,
  burstGapDurationMs: TURRET_VARIANT_CONFIG[variant].burstGapMs * intervalMultiplier,
});

const resetVariantTurretCycle = (
  turret: NonNullable<EnemyState['turret']>,
  variant: TurretVariantId,
): void => {
  turret.timerMs = Math.max(0, turret.intervalMs - turret.telegraphDurationMs);
  turret.telegraphMs = 0;
  turret.burstGapMs = 0;
  turret.pendingShots = Math.max(0, TURRET_VARIANT_CONFIG[variant].burstShots - 1);
};

const resolveTurretPosition = (
  turret: EnemyState,
  enemies: EnemyState[],
  hazards: HazardState[],
  platforms: PlatformState[],
): void => {
  const support = turret.supportPlatformId
    ? platforms.find((platform) => platform.id === turret.supportPlatformId) ?? null
    : null;
  if (!support) {
    return;
  }

  const sameSupportSpike = (hazard: HazardState, candidateSupport: PlatformState): boolean =>
    hazard.kind === 'spikes' &&
    hazard.rect.y + hazard.rect.height <= candidateSupport.y + 4 &&
    hazard.rect.y >= candidateSupport.y - 28 &&
    hazard.rect.x < candidateSupport.x + candidateSupport.width &&
    hazard.rect.x + hazard.rect.width > candidateSupport.x;

  const conflictsAt = (candidateX: number, candidateSupport: PlatformState): boolean => {
    const candidateRect: Rect = {
      x: candidateX,
      y: candidateSupport.y - turret.height,
      width: turret.width,
      height: turret.height,
    };

    for (const hazard of hazards) {
      if (
        intersectsRect(expandRect(candidateRect, HAZARD_SPACING_BUFFER, 18), hazard.rect) ||
        sameSupportSpike(hazard, candidateSupport)
      ) {
        return true;
      }
    }

    for (const other of enemies) {
      if (other.id === turret.id || !other.alive || !isGroundedSpacingEnemy(other)) {
        continue;
      }
      if (intersectsRect(expandRect(candidateRect, ENEMY_SPACING_BUFFER, 12), expandRect(enemyRect(other), ENEMY_SPACING_BUFFER, 12))) {
        return true;
      }
    }

    return false;
  };

  const tryPlaceOnSupport = (candidateSupport: PlatformState, anchorX: number): boolean => {
    const laneLeft = candidateSupport.x;
    const laneRight = candidateSupport.x + candidateSupport.width - turret.width;
    if (laneRight < laneLeft) {
      return false;
    }

    if (!conflictsAt(anchorX, candidateSupport) && anchorX >= laneLeft && anchorX <= laneRight) {
      turret.x = anchorX;
      turret.y = candidateSupport.y - turret.height;
      turret.supportY = turret.y;
      turret.supportPlatformId = candidateSupport.id;
      turret.laneLeft = laneLeft;
      turret.laneRight = laneRight;
      return true;
    }

    const candidates: number[] = [];
    for (let offset = 0; offset <= laneRight - laneLeft; offset += 12) {
      const left = clamp(anchorX - offset, laneLeft, laneRight);
      const right = clamp(anchorX + offset, laneLeft, laneRight);
      candidates.push(left);
      if (right !== left) {
        candidates.push(right);
      }
    }

    const nextX = candidates.find((candidate) => !conflictsAt(candidate, candidateSupport));
    if (nextX === undefined) {
      return false;
    }

    turret.x = nextX;
    turret.y = candidateSupport.y - turret.height;
    turret.supportY = turret.y;
    turret.supportPlatformId = candidateSupport.id;
    turret.laneLeft = laneLeft;
    turret.laneRight = laneRight;
    return true;
  };

  const currentAnchorX = clamp(turret.x, support.x, support.x + support.width - turret.width);
  if (tryPlaceOnSupport(support, currentAnchorX)) {
    return;
  }

  throw new Error(`Turret cannot resolve on authored support without fallback: ${turret.id}`);
};

const getPlatformTopRect = (platform: PlatformState): Rect => ({
  x: platform.x,
  y: platform.y - 2,
  width: platform.width,
  height: 4,
});

const findReachableHopTarget = (
  enemy: EnemyState,
  platforms: PlatformState[],
  gravity: number,
  options?: { respectDirection?: boolean },
): { platform: PlatformState; landingX: number; landingY: number; vx: number; vy: number } | null => {
  const hop = enemy.hop;
  if (!hop || !enemy.supportPlatformId) {
    return null;
  }

  const currentSupport = platforms.find((platform) => platform.id === enemy.supportPlatformId);
  if (!currentSupport) {
    return null;
  }

  const desiredDirection = enemy.direction;
  const currentCenterX = enemy.x + enemy.width / 2;
  const currentY = enemy.y;
  const currentSupportCenterX = currentSupport.x + currentSupport.width / 2;
  const respectDirection = options?.respectDirection ?? true;
  const candidates = platforms
    .filter((platform) => platform.id !== currentSupport.id && isStableEnemySupport(platform))
    .map((platform) => {
      const targetLeft = platform.x;
      const targetRight = platform.x + platform.width - enemy.width;
      if (targetRight < targetLeft) {
        return null;
      }
      const landingX = clamp(currentCenterX - enemy.width / 2, targetLeft, targetRight);
      const landingCenterX = landingX + enemy.width / 2;
      const dx = landingCenterX - currentCenterX;
      const dy = platform.y - enemy.height - currentY;
      if (respectDirection && Math.sign(dx || desiredDirection) !== desiredDirection) {
        return null;
      }
      if (Math.abs(dx) > HOP_HORIZONTAL_REACH || Math.abs(dy) > HOP_VERTICAL_REACH) {
        return null;
      }

      const baseFlightTime = clamp(
        Math.abs(dx) / Math.max(hop.speed, 1),
        HOP_FLIGHT_TIME_MIN,
        HOP_FLIGHT_TIME_MAX,
      );
      const vy = (dy - 0.5 * gravity * baseFlightTime * baseFlightTime) / baseFlightTime;
      const vx = dx / baseFlightTime;
      if (vy >= -120 || Math.abs(vx) > HOP_HORIZONTAL_SPEED_LIMIT || Math.abs(vy) > HOP_IMPULSE_LIMIT) {
        return null;
      }

      const apexY = currentY + vy * (Math.abs(vy) / gravity) - 0.5 * gravity * (Math.abs(vy) / gravity) ** 2;
      if (apexY > Math.min(currentY, platform.y - enemy.height) + 24) {
        return null;
      }

      return {
        platform,
        landingX,
        landingY: platform.y - enemy.height,
        vx,
        vy,
        score: Math.abs(dx) + Math.abs(dy) * 0.75,
        laneScore: Math.abs(platform.x + platform.width / 2 - currentSupportCenterX),
        travelScore: Math.abs(landingX - enemy.x),
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => a.score - b.score || a.laneScore - b.laneScore || a.travelScore - b.travelScore || a.landingX - b.landingX);

  return candidates[0] ?? null;
};

const cloneProgress = (progress: SessionProgress): SessionProgress => ({
  unlockedStageIndex: progress.unlockedStageIndex,
  totalCoins: progress.totalCoins,
  activePowers: { ...progress.activePowers },
  powerTimers: { ...progress.powerTimers },
  runSettings: { ...progress.runSettings },
});

const getActiveTemporaryBridgeIds = (temporaryBridges: readonly TemporaryBridgeState[]): string[] =>
  temporaryBridges.filter((bridge) => bridge.active).map((bridge) => bridge.id);

const createSolidSurfaceList = (runtime: StageRuntime): SolidSurface[] => [
  ...runtime.platforms
    .filter((platform) =>
      isPlatformActive(platform, runtime.revealedPlatformIds, getActiveTemporaryBridgeIds(runtime.temporaryBridges)),
    )
    .map<SolidSurface>((platform) => ({
    id: platform.id,
    kind: 'platform',
    x: platform.x,
    y: platform.y,
    width: platform.width,
    height: platform.height,
    vx: platform.vx,
    vy: platform.vy,
    platform,
  })),
  ...runtime.rewardBlocks.map<SolidSurface>((rewardBlock) => ({
    id: rewardBlock.id,
    kind: 'rewardBlock',
    x: rewardBlock.x,
    y: rewardBlock.y,
    width: rewardBlock.width,
    height: rewardBlock.height,
    vx: 0,
    vy: 0,
    rewardBlock,
  })),
  ...runtime.gravityCapsules.flatMap<SolidSurface>((capsule) => {
    const wallThickness = gravityCapsuleShellWallThickness(capsule);
    const shellBottom = capsule.shell.y + capsule.shell.height;
    const shellRight = capsule.shell.x + capsule.shell.width;
    const segments: GravityCapsuleWallSurface[] = [
      {
        id: `${capsule.id}-wall-top`,
        kind: 'gravityCapsuleWall',
        x: capsule.shell.x,
        y: capsule.shell.y,
        width: capsule.shell.width,
        height: wallThickness,
        vx: 0,
        vy: 0,
        gravityCapsuleId: capsule.id,
      },
      {
        id: `${capsule.id}-wall-left-top`,
        kind: 'gravityCapsuleWall',
        x: capsule.shell.x,
        y: capsule.shell.y,
        width: wallThickness,
        height: capsule.entryDoor.y - capsule.shell.y,
        vx: 0,
        vy: 0,
        gravityCapsuleId: capsule.id,
      },
      {
        id: `${capsule.id}-wall-left-bottom`,
        kind: 'gravityCapsuleWall',
        x: capsule.shell.x,
        y: capsule.entryDoor.y + capsule.entryDoor.height,
        width: wallThickness,
        height: shellBottom - (capsule.entryDoor.y + capsule.entryDoor.height),
        vx: 0,
        vy: 0,
        gravityCapsuleId: capsule.id,
      },
      {
        id: `${capsule.id}-wall-right-top`,
        kind: 'gravityCapsuleWall',
        x: shellRight - wallThickness,
        y: capsule.shell.y,
        width: wallThickness,
        height: capsule.exitDoor.y - capsule.shell.y,
        vx: 0,
        vy: 0,
        gravityCapsuleId: capsule.id,
      },
      {
        id: `${capsule.id}-wall-right-bottom`,
        kind: 'gravityCapsuleWall',
        x: shellRight - wallThickness,
        y: capsule.exitDoor.y + capsule.exitDoor.height,
        width: wallThickness,
        height: shellBottom - (capsule.exitDoor.y + capsule.exitDoor.height),
        vx: 0,
        vy: 0,
        gravityCapsuleId: capsule.id,
      },
      {
        id: `${capsule.id}-wall-bottom`,
        kind: 'gravityCapsuleWall',
        x: capsule.shell.x,
        y: shellBottom - wallThickness,
        width: capsule.shell.width,
        height: wallThickness,
        vx: 0,
        vy: 0,
        gravityCapsuleId: capsule.id,
      },
    ];

    return segments.filter((segment) => segment.width > 0 && segment.height > 0);
  }),
];

const surfaceRect = (surface: SolidSurface): Rect => ({
  x: surface.x,
  y: surface.y,
  width: surface.width,
  height: surface.height,
});

type GravityCapsuleContainmentResolution = {
  x: number;
  y: number;
  hitHorizontalWall: boolean;
  hitVerticalWall: boolean;
};

type GravityCapsuleContainmentOptions = {
  allowEntryDoorPassage: boolean;
  allowExitDoorPassage: boolean;
};

const resolveGravityCapsuleContainment = (
  currentRect: Rect,
  previousRect: Rect,
  capsules: readonly GravityCapsuleState[],
  options: GravityCapsuleContainmentOptions,
): GravityCapsuleContainmentResolution => {
  let resolvedX = currentRect.x;
  let resolvedY = currentRect.y;
  let hitHorizontalWall = false;
  let hitVerticalWall = false;

  for (const capsule of capsules) {
    const shellRight = capsule.shell.x + capsule.shell.width;
    const shellBottom = capsule.shell.y + capsule.shell.height;
    const resolvedRight = resolvedX + currentRect.width;
    const resolvedBottom = resolvedY + currentRect.height;
    const overlapsShellHeight = resolvedY < shellBottom && resolvedBottom > capsule.shell.y;
    const overlapsShellWidth = resolvedX < shellRight && resolvedRight > capsule.shell.x;
    const overlapsEntryDoor = resolvedY < capsule.entryDoor.y + capsule.entryDoor.height && resolvedBottom > capsule.entryDoor.y;
    const overlapsExitDoor = resolvedY < capsule.exitDoor.y + capsule.exitDoor.height && resolvedBottom > capsule.exitDoor.y;

    if (
      overlapsShellHeight &&
      (!options.allowEntryDoorPassage || !overlapsEntryDoor) &&
      resolvedX < capsule.shell.x &&
      resolvedRight > capsule.shell.x
    ) {
      resolvedX = previousRect.x < capsule.shell.x ? capsule.shell.x - currentRect.width : capsule.shell.x;
      hitHorizontalWall = true;
    }

    if (
      overlapsShellHeight &&
      (!options.allowExitDoorPassage || !overlapsExitDoor) &&
      resolvedX < shellRight &&
      resolvedRight > shellRight
    ) {
      resolvedX = previousRect.x >= shellRight ? shellRight : shellRight - currentRect.width;
      hitHorizontalWall = true;
    }

    if (overlapsShellWidth && resolvedY < capsule.shell.y && resolvedBottom > capsule.shell.y) {
      resolvedY = previousRect.y < capsule.shell.y ? capsule.shell.y - currentRect.height : capsule.shell.y;
      hitVerticalWall = true;
    }

    if (resolvedY < shellBottom && resolvedBottom > shellBottom) {
      resolvedY = previousRect.y + previousRect.height <= shellBottom ? shellBottom - currentRect.height : shellBottom;
      hitVerticalWall = true;
    }
  }

  return {
    x: resolvedX,
    y: resolvedY,
    hitHorizontalWall,
    hitVerticalWall,
  };
};

const pointInRect = (point: { x: number; y: number }, rect: Rect): boolean =>
  point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;

const TERRAIN_SURFACE_TOP_EPSILON = 8;

const platformSupportPoint = (
  playerWidth: number,
  playerHeight: number,
  x: number,
  y: number,
): { x: number; y: number } => ({
  x: x + playerWidth / 2,
  y: y + playerHeight,
});

const activePlatforms = (
  platforms: PlatformState[],
  revealedPlatformIds: readonly string[],
  activeTemporaryBridgeIds: readonly string[],
): PlatformState[] => platforms.filter((platform) => isPlatformActive(platform, revealedPlatformIds, activeTemporaryBridgeIds));

const findPlayerLowGravityZone = (
  player: PlayerState,
  zones: LowGravityZoneState[],
): LowGravityZoneState | null => {
  const center = {
    x: player.x + player.width / 2,
    y: player.y + player.height / 2,
  };

  return zones.find((zone) => pointInRect(center, zone)) ?? null;
};

const findPlayerGravityField = (
  player: PlayerState,
  fields: GravityFieldState[],
  capsules: GravityCapsuleState[],
): GravityFieldState | null => {
  const center = {
    x: player.x + player.width / 2,
    y: player.y + player.height / 2,
  };

  return (
    fields.find((field) => {
      if (field.gravityCapsuleId) {
        const capsule = capsules.find((entry) => entry.id === field.gravityCapsuleId);
        if (!capsule?.enabled) {
          return false;
        }

        return pointInRect(center, capsule.shell);
      }

      return pointInRect(center, field);
    }) ?? null
  );
};

const findEnabledGravityCapsuleAtPoint = (
  point: { x: number; y: number },
  capsules: GravityCapsuleState[],
): GravityCapsuleState | null => capsules.find((capsule) => capsule.enabled && pointInRect(point, capsule.shell)) ?? null;

export class GameSession {
  private snapshot: SessionSnapshot;

  private cues: AudioCue[] = [];

  private cameraViewBox: Rect | null = null;

  private visibleEnemyIds = new Set<string>();

  private checkpointRevealIds: string[] = [];

  constructor() {
    this.snapshot = this.createSnapshot(0, createDefaultSessionProgress());
  }

  getState(): Readonly<SessionSnapshot> {
    return this.snapshot;
  }

  consumeCues(): AudioCue[] {
    const pending = [...this.cues];
    this.cues.length = 0;
    return pending;
  }

  restartStage(): void {
    this.checkpointRevealIds = [];
    this.cameraViewBox = null;
    this.visibleEnemyIds.clear();
    this.snapshot = this.createSnapshot(this.snapshot.stageIndex, cloneProgress(this.snapshot.progress));
  }

  startStage(index: number): void {
    const clamped = Math.max(0, Math.min(index, this.snapshot.progress.unlockedStageIndex));
    this.checkpointRevealIds = [];
    this.cameraViewBox = null;
    this.visibleEnemyIds.clear();
    this.snapshot = this.createSnapshot(clamped, cloneProgress(this.snapshot.progress));
  }

  forceStartStage(index: number): void {
    const clamped = Math.max(0, Math.min(index, stageDefinitions.length - 1));
    this.checkpointRevealIds = [];
    this.cameraViewBox = null;
    this.visibleEnemyIds.clear();
    this.snapshot = this.createSnapshot(clamped, cloneProgress(this.snapshot.progress));
  }

  advanceToNextStage(): void {
    if (this.snapshot.stageIndex >= stageDefinitions.length - 1) {
      this.snapshot.gameCompleted = true;
      return;
    }

    this.startStage(this.snapshot.stageIndex + 1);
  }

  updateRunSettings(next: Partial<RunSettings>): void {
    this.snapshot.progress.runSettings = {
      ...this.snapshot.progress.runSettings,
      ...next,
      masterVolume:
        next.masterVolume == null
          ? this.snapshot.progress.runSettings.masterVolume
          : clamp(next.masterVolume, 0, 1),
    };
  }

  setCameraViewBox(viewBox: Rect | null): void {
    this.cameraViewBox = viewBox;
  }

  updateViewBounds(viewBox: Rect | null): void {
    this.setCameraViewBox(viewBox);
  }

  update(deltaMs: number, input: InputState): void {
    const deltaSec = deltaMs / 1000;
    const { player, stage, stageRuntime } = this.snapshot;
    const wasOnGround = player.onGround;

    this.snapshot.levelJustCompleted = false;
    this.updateMessageTimer(deltaMs);
    this.updatePowerTimers(deltaMs);
    this.updateRewardFeedback(deltaMs);
    this.syncPlayerPresentationPower();

    if (player.dead) {
      this.snapshot.respawnTimerMs -= deltaMs;
      if (this.snapshot.respawnTimerMs <= 0) {
        this.respawnPlayer();
      }
      return;
    }

    if (this.snapshot.exitFinish.active) {
      this.updateExitFinish(deltaMs);
      return;
    }

    if (this.snapshot.levelCompleted) {
      this.freezePlayerForExitFinish();
      return;
    }

    this.updateTemporaryBridges(deltaMs);
    this.updatePlatforms(deltaMs, deltaSec);

    const supportSurface = player.supportPlatformId ? this.findSupportSurface(player.supportPlatformId) : null;
    let retainedSupportSurface: SolidSurface | null = null;
    let detachFrameHorizontalCollisionExemptSurfaceId: string | null = null;
    const supportTerrainPlatform =
      supportSurface?.kind === 'platform'
        ? this.findSupportingTerrainPlatform(supportSurface.platform.id, player.x, player.y)
        : null;
    if (supportSurface && player.onGround) {
        const priorSupportX = supportSurface.x - supportSurface.vx * deltaSec;
        const priorSupportY = supportSurface.y - supportSurface.vy * deltaSec;
        const wasSupportedBeforePlatformMotion =
          Math.abs(player.y + player.height - priorSupportY) <= 8 &&
          player.x + player.width > priorSupportX + 6 &&
          player.x < priorSupportX + supportSurface.width - 6;
      const nextPlayerXWithoutSupportMotion = player.x + player.vx * deltaSec;
      const wouldRemainSupportedWithoutSupportMotion =
        Math.abs(player.y + player.height - priorSupportY) <= 8 &&
        nextPlayerXWithoutSupportMotion + player.width > priorSupportX + 6 &&
        nextPlayerXWithoutSupportMotion < priorSupportX + supportSurface.width - 6;
      const stillSupported =
        Math.abs(player.y + player.height - supportSurface.y) <= 8 &&
        player.x + player.width > supportSurface.x + 6 &&
        player.x < supportSurface.x + supportSurface.width - 6;

      if (stillSupported) {
        player.x = clamp(player.x + supportSurface.vx * deltaSec, 0, stage.world.width - player.width);
        player.y += supportSurface.vy * deltaSec;
        retainedSupportSurface = supportSurface;
      } else {
          const supportMovedAwayThisFrame =
          wasSupportedBeforePlatformMotion &&
          wouldRemainSupportedWithoutSupportMotion &&
          (Math.abs(supportSurface.vx) > 0 || Math.abs(supportSurface.vy) > 0);
          if (supportMovedAwayThisFrame) {
            detachFrameHorizontalCollisionExemptSurfaceId = supportSurface.id;
          }
        player.onGround = false;
        player.supportPlatformId = null;
      }
    }

    if (player.invulnerableMs > 0) {
      player.invulnerableMs = Math.max(0, player.invulnerableMs - deltaMs);
    }
    player.dashCooldownMs = Math.max(0, player.dashCooldownMs - deltaMs);
    player.dashTimerMs = Math.max(0, player.dashTimerMs - deltaMs);
    player.shootCooldownMs = Math.max(0, player.shootCooldownMs - deltaMs);

    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (direction !== 0) {
      player.facing = direction > 0 ? 1 : -1;
    }

    if (input.shootPressed && this.snapshot.progress.activePowers.shooter && player.shootCooldownMs <= 0) {
      player.shootCooldownMs = SHOOT_COOLDOWN_MS;
      stageRuntime.projectiles.push({
        id: `player-shot-${Math.random().toString(36).slice(2, 8)}`,
        owner: 'player',
        x: player.facing === 1 ? player.x + player.width : player.x - 16,
        y: player.y + player.height / 2 - 6,
        vx: player.facing * PLAYER_PROJECTILE_SPEED,
        width: 16,
        height: 12,
        alive: true,
      });
      this.emitCue(AUDIO_CUES.shoot);
    }

    if (input.dashPressed && this.snapshot.progress.activePowers.dash && player.dashCooldownMs <= 0) {
      player.dashTimerMs = DASH_DURATION_MS;
      player.dashCooldownMs = DASH_COOLDOWN_MS;
      player.vx = player.facing * DASH_SPEED;
      player.vy = 0;
      player.supportPlatformId = null;
      this.emitCue(AUDIO_CUES.dash);
    }

    if (player.dashTimerMs <= 0) {
      const groundedOnSticky = player.onGround && supportTerrainPlatform?.surfaceMechanic?.kind === 'stickySludge';
      const groundAccel = groundedOnSticky ? GROUND_ACCEL * SLUDGE_GROUND_ACCEL_MULTIPLIER : GROUND_ACCEL;
      const groundMaxSpeed = groundedOnSticky ? MAX_MOVE_SPEED * SLUDGE_MAX_SPEED_MULTIPLIER : MAX_MOVE_SPEED;
      const accel = player.onGround ? groundAccel : AIR_ACCEL;
      if (direction !== 0) {
        player.vx = clamp(
          player.vx + direction * accel * deltaSec,
          player.onGround ? -groundMaxSpeed : -MAX_MOVE_SPEED,
          player.onGround ? groundMaxSpeed : MAX_MOVE_SPEED,
        );
      } else if (player.onGround) {
        const drag = Math.min(Math.abs(player.vx), groundAccel * deltaSec);
        player.vx -= Math.sign(player.vx) * drag;
      }

      const ceilingSupport = this.findActiveGravityRoomCeilingSupport();

      if (player.onGround) {
        player.coyoteMs = COYOTE_TIME_MS;
        player.airJumpsRemaining = this.snapshot.progress.activePowers.doubleJump ? 1 : 0;
      } else if (ceilingSupport) {
        player.coyoteMs = COYOTE_TIME_MS;
      } else {
        player.coyoteMs = Math.max(0, player.coyoteMs - deltaMs);
      }

      const supportedGravityCapsule = player.onGround ? this.findSupportedPlayerGravityCapsule() : null;
      if (supportedGravityCapsule && player.supportPlatformId) {
        player.jumpSourceGravityCapsuleId = supportedGravityCapsule.id;
        player.jumpSourceSupportPlatformId = player.supportPlatformId;
      } else if (ceilingSupport) {
        player.jumpSourceGravityCapsuleId = ceilingSupport.capsule.id;
        player.jumpSourceSupportPlatformId = ceilingSupport.phaseThroughSupportPlatformId;
      } else if (player.onGround || player.coyoteMs <= 0) {
        player.jumpSourceGravityCapsuleId = null;
        player.jumpSourceSupportPlatformId = null;
      }

      const wantsCeilingHeldJump = Boolean(ceilingSupport && input.jumpHeld && player.vy === 0);
      player.jumpBufferMs = input.jumpPressed || wantsCeilingHeldJump ? JUMP_BUFFER_MS : Math.max(0, player.jumpBufferMs - deltaMs);
      if (player.jumpBufferMs > 0) {
        if (player.coyoteMs > 0) {
          this.startSupportedPlayerJump(AUDIO_CUES.jump);
        } else if (this.snapshot.progress.activePowers.doubleJump && player.airJumpsRemaining > 0) {
          player.vy = -JUMP_SPEED;
          player.onGround = false;
          player.supportPlatformId = null;
          player.phaseThroughSupportPlatformId = null;
          player.airJumpsRemaining -= 1;
          player.jumpBufferMs = 0;
          this.emitCue(AUDIO_CUES.doubleJump);
        }
      }

      this.updatePlayerGravityState();
      player.vy = Math.min(player.vy + stage.world.gravity * player.gravityScale * deltaSec, MAX_FALL_SPEED);
    } else {
      player.vx = player.facing * DASH_SPEED;
      player.vy = 0;
      player.onGround = false;
      player.lowGravityZoneId = null;
      player.gravityFieldId = null;
      player.gravityFieldKind = null;
      player.gravityScale = 1;
    }

    let nextX = player.x + player.vx * deltaSec;
    let nextY = player.y;
    const solidSurfaces = createSolidSurfaceList(stageRuntime);

    const horizontalRect: Rect = { x: nextX, y: player.y, width: player.width, height: player.height };
    for (const surface of solidSurfaces) {
      if (player.onGround && surface.id === player.supportPlatformId) {
        continue;
      }
      if (surface.id === detachFrameHorizontalCollisionExemptSurfaceId) {
        continue;
      }
      if (surface.kind === 'platform' && isTopSurfaceOnlyPlatform(surface.platform)) {
        continue;
      }
      if (intersectsRect(horizontalRect, surfaceRect(surface))) {
        if (player.vx > 0) {
          nextX = surface.x - player.width;
        } else if (player.vx < 0) {
          nextX = surface.x + surface.width;
        }
        player.vx = 0;
      }
    }

    nextY += player.vy * deltaSec;
    player.onGround = false;
    player.supportPlatformId = null;
    let ridingSurface: SolidSurface | null = null;
    const verticalRect: Rect = { x: nextX, y: nextY, width: player.width, height: player.height };
    for (const surface of solidSurfaces) {
      if (surface.id === player.phaseThroughSupportPlatformId) {
        continue;
      }
      if (!intersectsRect(verticalRect, surfaceRect(surface))) {
        continue;
      }
      if (surface.kind === 'platform' && player.vy < 0 && isTopSurfaceOnlyPlatform(surface.platform)) {
        continue;
      }

      const wasAboveSurface = player.y + player.height <= surface.y + TERRAIN_SURFACE_TOP_EPSILON;

      if (player.vy >= 0 && wasAboveSurface) {
        const terrainPlatform =
          surface.kind === 'platform'
            ? this.findSupportingTerrainPlatform(surface.id, nextX, surface.y - player.height)
            : null;
        if (terrainPlatform && !isPlatformTerrainSupportActive(terrainPlatform)) {
          continue;
        }
        nextY = surface.y - player.height;
        player.onGround = true;
        player.supportPlatformId = surface.id;
        ridingSurface = surface;
        this.armBrittlePlatform(terrainPlatform);
      } else if (player.vy < 0) {
        nextY = surface.y + surface.height;
        if (surface.kind === 'rewardBlock') {
          this.activateRewardBlock(surface.rewardBlock);
        }
      }
      player.vy = 0;
      break;
    }

    if (!player.onGround && player.vy === 0 && wasOnGround && retainedSupportSurface) {
      nextY = retainedSupportSurface.y - player.height;
      player.onGround = true;
      player.supportPlatformId = retainedSupportSurface.id;
      ridingSurface = retainedSupportSurface;
    }

    player.x = clamp(nextX, 0, stage.world.width - player.width);
    player.y = nextY;
    if (player.phaseThroughSupportPlatformId) {
      const phaseThroughSurface = this.findSupportSurface(player.phaseThroughSupportPlatformId);
      if (!phaseThroughSurface || !intersectsRect(playerRect(player), surfaceRect(phaseThroughSurface))) {
        player.phaseThroughSupportPlatformId = null;
      }
    }
    this.handleActivationNodes();
    this.handleGravityCapsules();
    this.handleScannerVolumes();
    this.handleRevealVolumes();
    this.finalizeTemporaryBridgeExpiry();
    this.updatePlayerGravityState();
    const contactedSpringPlatform =
      player.onGround && player.supportPlatformId
        ? this.findContactedSpringPlatform(player.x, player.y, player.supportPlatformId)
        : player.dashTimerMs > 0
          ? this.findContactedSpringPlatform(player.x, player.y)
          : null;
    this.updateTerrainVariantPlatforms(deltaMs);
    this.updateFallingPlatformContactTiming(deltaMs);

    if (ridingSurface) {
      if (!wasOnGround) {
        this.emitCue(AUDIO_CUES.land);
      }
    }

    if (!contactedSpringPlatform) {
      player.springContactPlatformId = null;
    } else {
      const freshSpringContact = player.springContactPlatformId !== contactedSpringPlatform.id;
      player.springContactPlatformId = contactedSpringPlatform.id;

      if (
        freshSpringContact &&
        contactedSpringPlatform.spring &&
        contactedSpringPlatform.spring.timerMs <= 0 &&
        player.dashTimerMs <= 0 &&
        !input.jumpHeld &&
        player.jumpBufferMs <= 0
      ) {
        contactedSpringPlatform.spring.timerMs = contactedSpringPlatform.spring.cooldownMs;
        player.vy = -contactedSpringPlatform.spring.boost;
        player.onGround = false;
        player.supportPlatformId = null;
        player.phaseThroughSupportPlatformId = null;
        this.emitCue(AUDIO_CUES.spring);
      }
    }

    this.updateCurrentSegment();
    this.updateEnemies(deltaMs, deltaSec);
    this.updateProjectiles(deltaSec);
    this.handleCheckpointInteractions();
    this.handleCollectibles();
    this.handleHazards();
    this.handleEnemyInteractions();
    this.handleExit();
  }

  private updateMessageTimer(deltaMs: number): void {
    if (!this.snapshot.stageMessage || this.snapshot.stageMessageTimerMs <= 0) {
      return;
    }

    this.snapshot.stageMessageTimerMs = Math.max(0, this.snapshot.stageMessageTimerMs - deltaMs);
    if (this.snapshot.stageMessageTimerMs <= 0 && !this.snapshot.levelCompleted && !this.snapshot.player.dead) {
      this.snapshot.stageMessage = '';
    }
  }

  private updatePowerTimers(deltaMs: number): void {
    const { progress } = this.snapshot;
    if (progress.powerTimers.invincibleMs <= 0) {
      progress.powerTimers.invincibleMs = 0;
      progress.activePowers.invincible = false;
      this.syncPlayerPresentationPower();
      return;
    }

    const next = Math.max(0, progress.powerTimers.invincibleMs - deltaMs);
    progress.powerTimers.invincibleMs = next;
    progress.activePowers.invincible = next > 0;
    this.syncPlayerPresentationPower();
  }

  private updateRewardFeedback(deltaMs: number): void {
    for (const block of this.snapshot.stageRuntime.rewardBlocks) {
      block.hitFlashMs = Math.max(0, block.hitFlashMs - deltaMs);
    }

    for (const reveal of this.snapshot.stageRuntime.rewardReveals) {
      reveal.timerMs = Math.max(0, reveal.timerMs - deltaMs);
    }

    this.snapshot.stageRuntime.rewardReveals = this.snapshot.stageRuntime.rewardReveals.filter(
      (reveal) => reveal.timerMs > 0,
    );
  }

  private updatePlatforms(deltaMs: number, deltaSec: number): void {
    for (const platform of this.snapshot.stageRuntime.platforms) {
      const previousRect = { x: platform.x, y: platform.y, width: platform.width, height: platform.height };
      platform.vx = 0;
      platform.vy = 0;

      if (platform.move) {
        if (platform.move.axis === 'x') {
          platform.vx = platform.move.direction * platform.move.speed;
          platform.x += platform.vx * deltaSec;
          const minX = platform.startX;
          const maxX = platform.startX + platform.move.range;
          if (platform.x <= minX) {
            platform.x = minX;
            platform.move.direction = 1;
            this.emitCue(AUDIO_CUES.movingPlatform);
          } else if (platform.x >= maxX) {
            platform.x = maxX;
            platform.move.direction = -1;
            this.emitCue(AUDIO_CUES.movingPlatform);
          }
        } else {
          platform.vy = platform.move.direction * platform.move.speed;
          platform.y += platform.vy * deltaSec;
          const minY = platform.startY - platform.move.range;
          const maxY = platform.startY;
          if (platform.y <= minY) {
            platform.y = minY;
            platform.move.direction = 1;
            this.emitCue(AUDIO_CUES.movingPlatform);
          } else if (platform.y >= maxY) {
            platform.y = maxY;
            platform.move.direction = -1;
            this.emitCue(AUDIO_CUES.movingPlatform);
          }
        }
      }

      if (platform.spring) {
        platform.spring.timerMs = Math.max(0, platform.spring.timerMs - deltaMs);
      }

      if (platform.fall?.falling) {
        platform.vy += this.snapshot.stage.world.gravity * 0.75 * deltaSec;
        platform.y += platform.vy * deltaSec;
      }

      const containment = resolveGravityCapsuleContainment(
        { x: platform.x, y: platform.y, width: platform.width, height: platform.height },
        previousRect,
        this.snapshot.stageRuntime.gravityCapsules,
        { allowEntryDoorPassage: true, allowExitDoorPassage: true },
      );

      platform.x = containment.x;
      platform.y = containment.y;

      if (platform.move?.axis === 'x' && containment.hitHorizontalWall) {
        platform.vx = 0;
        platform.move.direction = platform.move.direction === 1 ? -1 : 1;
        this.emitCue(AUDIO_CUES.movingPlatform);
      }

      if (platform.move?.axis === 'y' && containment.hitVerticalWall) {
        platform.vy = 0;
        platform.move.direction = platform.move.direction === 1 ? -1 : 1;
        this.emitCue(AUDIO_CUES.movingPlatform);
      }
    }
  }

  private updateFallingPlatformContactTiming(deltaMs: number): void {
    const supportedPlatformId = this.snapshot.player.onGround ? this.snapshot.player.supportPlatformId : null;

    for (const platform of this.snapshot.stageRuntime.platforms) {
      if (platform.kind !== 'falling' || !platform.fall || platform.fall.falling) {
        continue;
      }

      const hasTopSupportContact = supportedPlatformId === platform.id;

      if (!platform.fall.triggered) {
        if (hasTopSupportContact) {
          if (platform.fall.unsupportedGapMs > platform.fall.hopGapThresholdMs) {
            platform.fall.accumulatedSupportMs = 0;
          }
          platform.fall.unsupportedGapMs = 0;
          platform.fall.accumulatedSupportMs += deltaMs;

          if (platform.fall.accumulatedSupportMs >= platform.fall.stayArmThresholdMs) {
            platform.fall.triggered = true;
            platform.fall.timerMs = platform.fall.triggerDelayMs;
            this.emitCue(AUDIO_CUES.collapse);
          }
        } else {
          platform.fall.unsupportedGapMs += deltaMs;
          if (platform.fall.unsupportedGapMs > platform.fall.hopGapThresholdMs) {
            platform.fall.accumulatedSupportMs = 0;
          }
        }
        continue;
      }

      if (!hasTopSupportContact) {
        continue;
      }

      platform.fall.timerMs = Math.max(0, platform.fall.timerMs - deltaMs);
      if (platform.fall.timerMs <= 0) {
        platform.fall.falling = true;
      }
    }
  }

  private updateTemporaryBridges(deltaMs: number): void {
    const { player, stageRuntime } = this.snapshot;

    for (const bridge of stageRuntime.temporaryBridges) {
      if (!bridge.active) {
        continue;
      }

      if (bridge.remainingMs > 0) {
        bridge.remainingMs = Math.max(0, bridge.remainingMs - deltaMs);
      }

      if (bridge.remainingMs > 0) {
        continue;
      }

      if (player.onGround && player.supportPlatformId === bridge.id) {
        bridge.pendingHide = true;
        continue;
      }

      bridge.active = false;
      bridge.pendingHide = false;
    }
  }

  private updateTerrainVariantPlatforms(deltaMs: number): void {
    const { player, stageRuntime } = this.snapshot;
    const supportedPlatformId = player.onGround ? player.supportPlatformId : null;

    for (const platform of stageRuntime.platforms) {
      if (platform.surfaceMechanic?.kind !== 'brittleCrystal' || !platform.brittle) {
        continue;
      }

      const brittle = platform.brittle;
      const hasTopSupportContact = supportedPlatformId === platform.id;
      const unsupportedGapMs = brittle.unsupportedGapMs ?? 0;

      if (brittle.phase === 'intact') {
        brittle.unsupportedGapMs = 0;
        if (!hasTopSupportContact) {
          continue;
        }
        this.armBrittlePlatform(platform);
      }

      if (brittle.phase === 'warning') {
        if (hasTopSupportContact) {
          brittle.unsupportedGapMs = 0;
          brittle.warningMs = Math.max(0, brittle.warningMs - deltaMs);

          if (brittle.warningMs <= 0) {
            brittle.phase = 'ready';
            brittle.warningMs = 0;
            brittle.readyElapsedMs = 0;
            brittle.readyBreakDelayMs = BRITTLE_READY_BREAK_DELAY_MS;
            brittle.readyRemainingMs = BRITTLE_READY_BREAK_DELAY_MS;
          }
          continue;
        }

        const nextGapMs = unsupportedGapMs + deltaMs;
        if (nextGapMs > FALL_HOP_GAP_THRESHOLD_MS) {
          brittle.phase = 'intact';
          brittle.warningMs = BRITTLE_WARNING_MS;
          brittle.unsupportedGapMs = 0;
          brittle.readyElapsedMs = 0;
          brittle.readyBreakDelayMs = BRITTLE_READY_BREAK_DELAY_MS;
          brittle.readyRemainingMs = BRITTLE_READY_BREAK_DELAY_MS;
          continue;
        }

        brittle.unsupportedGapMs = nextGapMs;
        continue;
      }

      if (brittle.phase === 'ready') {
        const readyBreakDelayMs = brittle.readyBreakDelayMs ?? BRITTLE_READY_BREAK_DELAY_MS;
        const readyElapsedMs = Math.min(readyBreakDelayMs, (brittle.readyElapsedMs ?? 0) + deltaMs);
        brittle.readyBreakDelayMs = readyBreakDelayMs;
        brittle.readyElapsedMs = readyElapsedMs;
        brittle.readyRemainingMs = Math.max(0, readyBreakDelayMs - readyElapsedMs);

        if (readyElapsedMs < readyBreakDelayMs) {
          brittle.unsupportedGapMs = 0;
          continue;
        }

        brittle.phase = 'broken';
        brittle.readyRemainingMs = 0;
        brittle.unsupportedGapMs = 0;
        continue;
      }

      if (hasTopSupportContact) {
        brittle.unsupportedGapMs = 0;
      }
    }
  }

  private finalizeTemporaryBridgeExpiry(): void {
    const { player, stageRuntime } = this.snapshot;

    for (const bridge of stageRuntime.temporaryBridges) {
      if (!bridge.pendingHide) {
        continue;
      }

      if (player.onGround && player.supportPlatformId === bridge.id) {
        continue;
      }

      bridge.active = false;
      bridge.pendingHide = false;
      bridge.remainingMs = 0;
    }
  }

  private updatePlayerGravityState(): void {
    if (this.snapshot.player.dashTimerMs > 0) {
      this.snapshot.player.lowGravityZoneId = null;
      this.snapshot.player.gravityFieldId = null;
      this.snapshot.player.gravityFieldKind = null;
      this.snapshot.player.gravityScale = 1;
      return;
    }

    const zone = findPlayerLowGravityZone(this.snapshot.player, this.snapshot.stageRuntime.lowGravityZones);
    const field = this.snapshot.player.onGround
      ? null
      : findPlayerGravityField(
          this.snapshot.player,
          this.snapshot.stageRuntime.gravityFields,
          this.snapshot.stageRuntime.gravityCapsules,
        );
    this.snapshot.player.lowGravityZoneId = zone?.id ?? null;
    this.snapshot.player.gravityFieldId = field?.id ?? null;
    this.snapshot.player.gravityFieldKind = field?.kind ?? null;
    this.snapshot.player.gravityScale = field ? GRAVITY_FIELD_SCALE[field.kind] : zone?.gravityScale ?? 1;
  }

  private findSupportedPlayerGravityCapsule(): GravityCapsuleState | null {
    const { player, stageRuntime } = this.snapshot;
    if (!player.onGround || !player.supportPlatformId) {
      return null;
    }

    return findEnabledGravityCapsuleAtPoint(
      {
        x: player.x + player.width / 2,
        y: player.y + player.height - 1,
      },
      stageRuntime.gravityCapsules,
    );
  }

  private findActiveGravityRoomCeilingSupport(): { capsule: GravityCapsuleState; phaseThroughSupportPlatformId: string | null } | null {
    const { player, stageRuntime } = this.snapshot;
    if (player.onGround || player.vy > 0) {
      return null;
    }

    const capsule = findEnabledGravityCapsuleAtPoint(
      {
        x: player.x + player.width / 2,
        y: player.y + 1,
      },
      stageRuntime.gravityCapsules,
    );
    if (!capsule) {
      return null;
    }

    const supportPlatform = stageRuntime.platforms.find((platform) => {
      if (isTopSurfaceOnlyPlatform(platform)) {
        return false;
      }

      const overlap = Math.min(player.x + player.width, platform.x + platform.width) - Math.max(player.x, platform.x);
      return overlap > 12 && player.y >= platform.y + platform.height - 4 && player.y <= platform.y + platform.height + 16;
    });

    if (supportPlatform) {
      return {
        capsule,
        phaseThroughSupportPlatformId: supportPlatform.id,
      };
    }

    const topWall = createSolidSurfaceList(stageRuntime).find(
      (surface) =>
        surface.kind === 'gravityCapsuleWall' &&
        surface.gravityCapsuleId === capsule.id &&
        Math.abs(surface.y - capsule.shell.y) <= 1 &&
        Math.min(player.x + player.width, surface.x + surface.width) - Math.max(player.x, surface.x) > 12 &&
        player.y >= surface.y + surface.height - 4 &&
        player.y <= surface.y + surface.height + 16,
    );

    if (!topWall) {
      return null;
    }

    return {
      capsule,
      phaseThroughSupportPlatformId: null,
    };
  }

  private resolveSupportedPlayerJumpTakeoff(): { velocityY: number; phaseThroughSupportPlatformId: string | null } {
    const { player, stageRuntime } = this.snapshot;
    const currentSupportedCapsule = this.findSupportedPlayerGravityCapsule();
    const jumpSourceCapsule = currentSupportedCapsule
      ? currentSupportedCapsule
      : player.jumpSourceGravityCapsuleId
        ? stageRuntime.gravityCapsules.find(
            (capsule) => capsule.id === player.jumpSourceGravityCapsuleId && capsule.enabled,
          ) ?? null
        : null;

    if (!jumpSourceCapsule) {
      return {
        velocityY: -JUMP_SPEED,
        phaseThroughSupportPlatformId: null,
      };
    }

    return {
      velocityY: JUMP_SPEED,
      phaseThroughSupportPlatformId: currentSupportedCapsule
        ? player.supportPlatformId
        : player.jumpSourceSupportPlatformId,
    };
  }

  private startSupportedPlayerJump(cue: AudioCue): void {
    const { player } = this.snapshot;
    const takeoff = this.resolveSupportedPlayerJumpTakeoff();
    player.vy = takeoff.velocityY;
    player.onGround = false;
    player.supportPlatformId = null;
    player.phaseThroughSupportPlatformId = takeoff.phaseThroughSupportPlatformId;
    player.coyoteMs = 0;
    player.jumpBufferMs = 0;
    player.jumpSourceGravityCapsuleId = null;
    player.jumpSourceSupportPlatformId = null;
    this.emitCue(cue);
  }

  private handleGravityCapsules(): void {
    const { player, stageRuntime } = this.snapshot;
    const playerBounds = playerRect(player);

    for (const capsule of stageRuntime.gravityCapsules) {
      if (!capsule.enabled || capsule.button.activated) {
        continue;
      }

      if (!intersectsRect(playerBounds, capsule.button)) {
        continue;
      }

      capsule.enabled = false;
      capsule.button.activated = true;
    }
  }

  private armBrittlePlatform(platform: PlatformState | null): void {
    if (!platform || platform.surfaceMechanic?.kind !== 'brittleCrystal' || !platform.brittle) {
      return;
    }

    if (platform.brittle.phase !== 'intact') {
      return;
    }

    platform.brittle.phase = 'warning';
    platform.brittle.warningMs = BRITTLE_WARNING_MS;
    platform.brittle.unsupportedGapMs = 0;
    platform.brittle.readyBreakDelayMs = BRITTLE_READY_BREAK_DELAY_MS;
    platform.brittle.readyElapsedMs = 0;
    platform.brittle.readyRemainingMs = BRITTLE_READY_BREAK_DELAY_MS;
    this.emitCue(AUDIO_CUES.danger);
  }

  private updateEnemies(deltaMs: number, deltaSec: number): void {
    const { player, stage, stageRuntime } = this.snapshot;
    const traversablePlatforms = activePlatforms(
      stageRuntime.platforms,
      stageRuntime.revealedPlatformIds,
      getActiveTemporaryBridgeIds(stageRuntime.temporaryBridges),
    );
    for (const enemy of stageRuntime.enemies) {
      if (!enemy.alive) {
        this.visibleEnemyIds.delete(enemy.id);
        continue;
      }

      const previousRect = enemyRect(enemy);

      let emittedCueThisFrame = false;
      const emitVisibleCue = (cue: AudioCue): void => {
        if (!this.isEnemyVisible(enemy)) {
          return;
        }

        this.emitCue(cue);
        emittedCueThisFrame = true;
      };

      if (isGroundedEnemy(enemy) && enemy.supportY !== null) {
        enemy.y = enemy.supportY;
      }

      if (enemy.kind === 'walker' && enemy.patrol) {
        enemy.vx = enemy.direction * enemy.patrol.speed;
        enemy.x += enemy.vx * deltaSec;
        const laneLeft = enemy.laneLeft ?? enemy.patrol.left;
        const laneRight = enemy.laneRight ?? enemy.patrol.right - enemy.width;
        if (enemy.x <= laneLeft) {
          enemy.x = laneLeft;
          enemy.direction = 1;
          emitVisibleCue(AUDIO_CUES.enemyPatrol);
        }
        if (enemy.x >= laneRight) {
          enemy.x = laneRight;
          enemy.direction = -1;
          emitVisibleCue(AUDIO_CUES.enemyPatrol);
        }
      }

      if (enemy.kind === 'hopper' && enemy.hop) {
        const hop = enemy.hop;
        const onSupport = enemy.supportPlatformId !== null && enemy.supportY !== null && Math.abs(enemy.y - enemy.supportY) <= 4;
        if (onSupport) {
          enemy.y = enemy.supportY!;
          enemy.vx = 0;
          enemy.vy = 0;
          hop.timerMs -= deltaMs;
          if (hop.timerMs <= 0) {
            const firstCommittedHop = (hop.committedHops ?? 0) === 0;
            let target = findReachableHopTarget(enemy, traversablePlatforms, stage.world.gravity, {
              respectDirection: !firstCommittedHop,
            });
            if (!target && !firstCommittedHop) {
              enemy.direction = enemy.direction === 1 ? -1 : 1;
              target = findReachableHopTarget(enemy, traversablePlatforms, stage.world.gravity);
            }

            if (target) {
              hop.timerMs = hop.intervalMs;
              hop.committedHops = (hop.committedHops ?? 0) + 1;
              hop.targetPlatformId = target.platform.id;
              hop.targetX = target.landingX;
              hop.targetY = target.landingY;
              enemy.vx = target.vx;
              enemy.vy = target.vy;
              enemy.direction = target.vx >= 0 ? 1 : -1;
              enemy.supportPlatformId = null;
              enemy.supportY = null;
              emitVisibleCue(AUDIO_CUES.enemyHop);
            } else {
              hop.timerMs = Math.min(hop.intervalMs, 220);
              if (!firstCommittedHop) {
                enemy.direction = enemy.direction === 1 ? -1 : 1;
              }
            }
          }
        }

        if (enemy.supportPlatformId === null) {
          const previousBottom = enemy.y + enemy.height;
          enemy.vy = Math.min(enemy.vy + stage.world.gravity * deltaSec, MAX_FALL_SPEED);
          enemy.x += enemy.vx * deltaSec;
          enemy.y += enemy.vy * deltaSec;

          const targetPlatform = hop.targetPlatformId
            ? traversablePlatforms.find((platform) => platform.id === hop.targetPlatformId) ?? null
            : null;
          const platformsToCheck = targetPlatform ? [targetPlatform] : traversablePlatforms.filter(isStableEnemySupport);
          for (const platform of platformsToCheck) {
            const landingZone = getPlatformTopRect(platform);
            const rect = enemyRect(enemy);
            const crossedPlatformTop =
              enemy.vy >= 0 &&
              previousBottom <= platform.y + 10 &&
              enemy.y + enemy.height >= platform.y &&
              enemy.x + enemy.width > platform.x &&
              enemy.x < platform.x + platform.width;
            if ((intersectsRect(rect, landingZone) || crossedPlatformTop) && enemy.vy >= 0) {
              enemy.y = platform.y - enemy.height;
              enemy.x = clamp(enemy.x, platform.x, platform.x + platform.width - enemy.width);
              enemy.vy = 0;
              enemy.vx = 0;
              enemy.supportY = enemy.y;
              enemy.supportPlatformId = platform.id;
              hop.targetPlatformId = null;
              hop.targetX = null;
              hop.targetY = null;
              break;
            }
          }

          if (hop.targetX !== null && Math.abs(enemy.x - hop.targetX) <= 10) {
            enemy.x = hop.targetX;
          }

          if (hop.targetY !== null && enemy.y > hop.targetY + HOP_VERTICAL_REACH) {
            hop.targetPlatformId = null;
            hop.targetX = null;
            hop.targetY = null;
          }
        }
      }

      if (enemy.kind === 'turret' && enemy.turret) {
        if (!this.isEnemyVisible(enemy)) {
          continue;
        }

        if (enemy.variant) {
          this.updateVariantTurret(enemy, stageRuntime, deltaMs);
          continue;
        }

        enemy.turret.timerMs -= deltaMs;
        if (enemy.turret.timerMs <= 0) {
          enemy.turret.timerMs = enemy.turret.intervalMs;
          this.spawnTurretProjectile(stageRuntime, enemy);
          enemy.direction = enemy.direction === 1 ? -1 : 1;
          this.emitCue(AUDIO_CUES.turretFire);
        }
      }

      if (enemy.kind === 'charger' && enemy.charger) {
        const chargerLeft = enemy.laneLeft ?? enemy.charger.left;
        const chargerRight = enemy.laneRight ?? enemy.charger.right - enemy.width;
        if (enemy.charger.state === 'patrol') {
          enemy.vx = enemy.direction * enemy.charger.patrolSpeed;
          enemy.x += enemy.vx * deltaSec;
          if (enemy.x <= chargerLeft) {
            enemy.x = chargerLeft;
            enemy.direction = 1;
          }
          if (enemy.x >= chargerRight) {
            enemy.x = chargerRight;
            enemy.direction = -1;
          }

          const withinRange = Math.abs(player.x - enemy.x) <= CHARGER_TRIGGER_RANGE && Math.abs(player.y - enemy.y) <= 80;
          if (withinRange) {
            enemy.direction = player.x >= enemy.x ? 1 : -1;
            enemy.charger.state = 'windup';
            enemy.charger.timerMs = enemy.charger.windupMs;
            enemy.vx = 0;
            emitVisibleCue(AUDIO_CUES.danger);
          }
        } else if (enemy.charger.state === 'windup') {
          enemy.charger.timerMs -= deltaMs;
          if (enemy.charger.timerMs <= 0) {
            enemy.charger.state = 'charge';
            emitVisibleCue(AUDIO_CUES.enemyCharge);
          }
        } else if (enemy.charger.state === 'charge') {
          enemy.vx = enemy.direction * enemy.charger.chargeSpeed;
          enemy.x += enemy.vx * deltaSec;
          if (enemy.x <= chargerLeft || enemy.x >= chargerRight) {
            enemy.x = clamp(enemy.x, chargerLeft, chargerRight);
            enemy.charger.state = 'cooldown';
            enemy.charger.timerMs = enemy.charger.cooldownMs;
            enemy.vx = 0;
          }
        } else {
          enemy.charger.timerMs -= deltaMs;
          if (enemy.charger.timerMs <= 0) {
            enemy.charger.state = 'patrol';
          }
        }
      }

      if (enemy.kind === 'flyer' && enemy.flyer) {
        enemy.vx = enemy.direction * enemy.flyer.speed;
        enemy.x += enemy.vx * deltaSec;
        enemy.flyer.bobPhase += enemy.flyer.bobSpeed * deltaSec;
        enemy.y = enemy.flyer.originY + Math.sin(enemy.flyer.bobPhase) * enemy.flyer.bobAmp;
        if (enemy.x <= enemy.flyer.left) {
          enemy.x = enemy.flyer.left;
          enemy.direction = 1;
          emitVisibleCue(AUDIO_CUES.enemyPatrol);
        }
        if (enemy.x + enemy.width >= enemy.flyer.right) {
          enemy.x = enemy.flyer.right - enemy.width;
          enemy.direction = -1;
          emitVisibleCue(AUDIO_CUES.enemyPatrol);
        }
      }

      const containment = resolveGravityCapsuleContainment(enemyRect(enemy), previousRect, stageRuntime.gravityCapsules, {
        allowEntryDoorPassage: false,
        allowExitDoorPassage: false,
      });
      enemy.x = containment.x;
      enemy.y = containment.y;

      if (containment.hitHorizontalWall) {
        enemy.vx = 0;
        enemy.direction = enemy.direction === 1 ? -1 : 1;
        if (enemy.kind === 'charger' && enemy.charger?.state === 'charge') {
          enemy.charger.state = 'cooldown';
          enemy.charger.timerMs = enemy.charger.cooldownMs;
        }
      }

      if (containment.hitVerticalWall) {
        enemy.vy = 0;
        if (enemy.kind === 'hopper' && enemy.hop) {
          enemy.hop.targetPlatformId = null;
          enemy.hop.targetX = null;
          enemy.hop.targetY = null;
        }
      }

      this.emitEnemyViewportEntryCue(enemy, emittedCueThisFrame);
    }
  }

  private updateProjectiles(deltaSec: number): void {
    const { player, stage, stageRuntime } = this.snapshot;
    const solidSurfaces = createSolidSurfaceList(stageRuntime);
    for (const projectile of stageRuntime.projectiles) {
      if (!projectile.alive) {
        continue;
      }

      projectile.x += projectile.vx * deltaSec;
      if (projectile.x > stage.world.width || projectile.x + projectile.width < 0) {
        projectile.alive = false;
        continue;
      }

      const shotRect = projectileRect(projectile);
      for (const surface of solidSurfaces) {
        if (surface.kind === 'platform' && isTopSurfaceOnlyPlatform(surface.platform)) {
          continue;
        }
        if (intersectsRect(shotRect, surfaceRect(surface))) {
          projectile.alive = false;
          break;
        }
      }

      if (!projectile.alive) {
        continue;
      }

      if (projectile.owner === 'enemy') {
        if (intersectsRect(shotRect, playerRect(player))) {
          projectile.alive = false;
          this.damagePlayer();
        }
        continue;
      }

      for (const enemy of stageRuntime.enemies) {
        if (!enemy.alive || !intersectsRect(shotRect, enemyRect(enemy))) {
          continue;
        }

        projectile.alive = false;
        this.defeatEnemy(enemy, 'plasma-blast', AUDIO_CUES.shootHit);
        break;
      }
    }

    stageRuntime.projectiles = stageRuntime.projectiles.filter((projectile) => projectile.alive);
  }

  private handleCheckpointInteractions(): void {
    const { player, stageRuntime } = this.snapshot;
    const rect = playerRect(player);
    for (const checkpoint of stageRuntime.checkpoints) {
      if (intersectsRect(rect, checkpoint.rect) && !checkpoint.activated) {
        for (const item of stageRuntime.checkpoints) {
          item.activated = false;
        }
        checkpoint.activated = true;
        this.snapshot.activeCheckpointId = checkpoint.id;
        this.checkpointRevealIds = [...stageRuntime.revealedPlatformIds];
        this.setStageMessage(getCheckpointActivatedMessage(), 1500);
        this.emitCue(AUDIO_CUES.checkpoint);
        this.completeStageObjective('checkpoint', checkpoint.id);
      }
    }
  }

  private handleRevealVolumes(): void {
    const { player, stageRuntime } = this.snapshot;
    const rect = playerRect(player);
    const revealedIds = new Set(stageRuntime.revealedPlatformIds);
    let changed = false;
    let objectiveCompleted = false;

    for (const volume of stageRuntime.revealVolumes) {
      if (!intersectsRect(rect, volume)) {
        continue;
      }

      objectiveCompleted = this.completeStageObjective('revealVolume', volume.id) || objectiveCompleted;

      for (const revealId of volume.revealPlatformIds) {
        if (!revealedIds.has(revealId)) {
          revealedIds.add(revealId);
          changed = true;
        }
      }
    }

    if (!changed) {
      return;
    }

    stageRuntime.revealedPlatformIds = normalizeRevealedPlatformIds(revealedIds);
    this.emitCue(AUDIO_CUES.unlock);
    if (!objectiveCompleted) {
      this.setStageMessage('Route revealed', 1400);
    }
  }

  private handleScannerVolumes(): void {
    const { player, stageRuntime } = this.snapshot;
    const rect = playerRect(player);
    let changed = false;
    let objectiveCompleted = false;

    for (const volume of stageRuntime.scannerVolumes) {
      const inside = intersectsRect(rect, volume);
      const entered = inside && !volume.playerInside;
      volume.playerInside = inside;

      if (!entered) {
        continue;
      }

      volume.activated = true;
      objectiveCompleted = this.completeStageObjective('scannerVolume', volume.id) || objectiveCompleted;
      for (const bridgeId of volume.temporaryBridgeIds) {
        const bridge = stageRuntime.temporaryBridges.find((item) => item.id === bridgeId);
        if (!bridge) {
          continue;
        }

        if (!isTimedRevealBridgeLegible(bridge, stageRuntime.revealedPlatformIds)) {
          continue;
        }

        bridge.active = true;
        bridge.pendingHide = false;
        bridge.remainingMs = bridge.durationMs;
        changed = true;
      }
    }

    if (changed && !objectiveCompleted) {
      this.emitCue(AUDIO_CUES.unlock);
      this.setStageMessage('Bridge online', 1300);
    }
  }

  private handleActivationNodes(): void {
    const { player, stageRuntime } = this.snapshot;
    const rect = playerRect(player);
    let activated = false;

    for (const node of stageRuntime.activationNodes) {
      if (node.activated || !intersectsRect(rect, node)) {
        continue;
      }

      node.activated = true;
      activated = true;

      for (const platform of stageRuntime.platforms) {
        if (platform.magnetic?.activationNodeId === node.id) {
          platform.magnetic.powered = true;
        }
      }
    }

    if (activated) {
      this.emitCue(AUDIO_CUES.unlock);
      this.setStageMessage('Platform powered', 1400);
    }
  }

  private handleCollectibles(): void {
    const { player, stageRuntime } = this.snapshot;
    const rect = playerRect(player);
    for (const coin of stageRuntime.collectibles) {
      const itemRect: Rect = {
        x: coin.position.x - 10,
        y: coin.position.y - 10,
        width: 20,
        height: 20,
      };
      if (!coin.collected && intersectsRect(rect, itemRect)) {
        coin.collected = true;
        this.awardCoins(1);
      }
    }
  }

  private handleHazards(): void {
    const { player, stageRuntime } = this.snapshot;
    const rect = playerRect(player);
    if (player.y > this.snapshot.stage.world.height + 120) {
      this.killPlayer();
      return;
    }

    for (const hazard of stageRuntime.hazards) {
      if (intersectsRect(rect, hazard.rect)) {
        this.damagePlayer();
      }
    }
  }

  private handleEnemyInteractions(): void {
    const { player, stageRuntime } = this.snapshot;
    const rect = playerRect(player);
    for (const enemy of stageRuntime.enemies) {
      if (!enemy.alive || !intersectsRect(rect, enemyRect(enemy))) {
        continue;
      }

      const stompWindow = player.vy > 100 && player.y + player.height <= enemy.y + 14;
      if (stompWindow && enemy.kind !== 'turret') {
        this.defeatEnemy(enemy, 'stomp', AUDIO_CUES.stomp);
        player.vy = -STOMP_BOUNCE;
        player.onGround = false;
        player.supportPlatformId = null;
      } else {
        this.damagePlayer();
      }
    }
  }

  private spawnTurretProjectile(
    stageRuntime: StageRuntime,
    enemy: EnemyState,
    projectileSpeed = DEFAULT_TURRET_PROJECTILE_SPEED,
  ): void {
    stageRuntime.projectiles.push({
      id: `${enemy.id}-shot-${Math.random().toString(36).slice(2, 7)}`,
      owner: 'enemy',
      variant: enemy.variant,
      x: enemy.direction === 1 ? enemy.x + enemy.width : enemy.x - 12,
      y: enemy.y + 10,
      vx: enemy.direction * projectileSpeed,
      width: 12,
      height: 12,
      alive: true,
    });
  }

  private updateVariantTurret(enemy: EnemyState, stageRuntime: StageRuntime, deltaMs: number): void {
    if (!enemy.turret || !enemy.variant) {
      return;
    }

    const turret = enemy.turret;
    const variantConfig = TURRET_VARIANT_CONFIG[enemy.variant];

    if (turret.telegraphMs > 0) {
      turret.telegraphMs = Math.max(0, turret.telegraphMs - deltaMs);
      if (turret.telegraphMs > 0) {
        return;
      }

      this.spawnTurretProjectile(stageRuntime, enemy, variantConfig.projectileSpeed);
      this.emitCue(AUDIO_CUES.turretFire);
      if (turret.pendingShots > 0) {
        turret.pendingShots -= 1;
        turret.burstGapMs = turret.burstGapDurationMs;
        return;
      }

      enemy.direction = enemy.direction === 1 ? -1 : 1;
      resetVariantTurretCycle(turret, enemy.variant);
      return;
    }

    if (turret.burstGapMs > 0) {
      turret.burstGapMs = Math.max(0, turret.burstGapMs - deltaMs);
      if (turret.burstGapMs > 0) {
        return;
      }

      this.spawnTurretProjectile(stageRuntime, enemy, variantConfig.projectileSpeed);
      this.emitCue(AUDIO_CUES.turretFire);
      enemy.direction = enemy.direction === 1 ? -1 : 1;
      resetVariantTurretCycle(turret, enemy.variant);
      return;
    }

    turret.timerMs -= deltaMs;
    if (turret.timerMs <= 0) {
      turret.telegraphMs = turret.telegraphDurationMs;
      turret.pendingShots = Math.max(0, variantConfig.burstShots - 1);
      this.emitCue(AUDIO_CUES.danger);
    }
  }

  private handleExit(): void {
    const { stage, stageRuntime } = this.snapshot;
    if (!stageRuntime.exitReached && intersectsRect(playerRect(this.snapshot.player), stage.exit)) {
      if (stageRuntime.objective && !stageRuntime.objective.completed) {
        this.setStageMessage(getStageObjectiveExitReminder(stageRuntime.objective.kind), 2200);
        return;
      }

      stageRuntime.exitReached = true;
      this.snapshot.exitFinish = {
        active: true,
        timerMs: EXIT_FINISH_DURATION_MS,
        durationMs: EXIT_FINISH_DURATION_MS,
        suppressPresentation: false,
      };
      this.freezePlayerForExitFinish();
      this.emitCue(AUDIO_CUES.capsuleTeleport);
    }
  }

  private updateExitFinish(deltaMs: number): void {
    this.freezePlayerForExitFinish();
    this.snapshot.exitFinish.timerMs = Math.max(0, this.snapshot.exitFinish.timerMs - deltaMs);
    const finishProgress =
      this.snapshot.exitFinish.durationMs <= 0
        ? 1
        : 1 - this.snapshot.exitFinish.timerMs / this.snapshot.exitFinish.durationMs;
    if (finishProgress >= EXIT_FINISH_HIDE_PROGRESS) {
      this.snapshot.exitFinish.suppressPresentation = true;
      this.snapshot.player.suppressPresentation = true;
    }
    if (this.snapshot.exitFinish.timerMs > 0) {
      return;
    }

    const { progress } = this.snapshot;
    this.snapshot.exitFinish.active = false;
    this.snapshot.levelCompleted = true;
    this.snapshot.levelJustCompleted = true;
    progress.unlockedStageIndex = Math.max(
      progress.unlockedStageIndex,
      Math.min(this.snapshot.stageIndex + 1, stageDefinitions.length - 1),
    );
    this.emitCue(AUDIO_CUES.stageClear);
  }

  private freezePlayerForExitFinish(): void {
    const { player } = this.snapshot;
    player.vx = 0;
    player.vy = 0;
    player.dashTimerMs = 0;
    player.jumpBufferMs = 0;
    player.onGround = false;
    player.supportPlatformId = null;
    player.jumpSourceGravityCapsuleId = null;
    player.jumpSourceSupportPlatformId = null;
    player.phaseThroughSupportPlatformId = null;
    player.springContactPlatformId = null;
    player.lowGravityZoneId = null;
    player.gravityFieldId = null;
    player.gravityFieldKind = null;
    player.gravityScale = 1;
  }

  private updateCurrentSegment(): void {
    const segment =
      this.snapshot.stage.segments.find(
        (item) => this.snapshot.player.x >= item.startX && this.snapshot.player.x < item.endX,
      ) ?? this.snapshot.stage.segments[this.snapshot.stage.segments.length - 1];

    if (segment.id !== this.snapshot.currentSegmentId) {
      this.snapshot.currentSegmentId = segment.id;
    }
  }

  private damagePlayer(): void {
    const { player } = this.snapshot;
    if (player.invulnerableMs > 0 || player.dead) {
      return;
    }

    const hitShieldState = this.consumeHitShield();
    if (hitShieldState !== 'none') {
      player.invulnerableMs = INVULNERABLE_MS;
      player.vy = -260;
      player.vx = player.facing === 1 ? -180 : 180;
      this.emitCue(AUDIO_CUES.hurt);
      return;
    }

    player.health -= 1;
    player.invulnerableMs = INVULNERABLE_MS;
    player.vy = -260;
    player.vx = player.facing === 1 ? -180 : 180;
    this.clearActivePowers();
    if (player.health <= 0) {
      this.killPlayer();
    } else {
      this.emitCue(AUDIO_CUES.hurt);
    }
  }

  private killPlayer(): void {
    const { player } = this.snapshot;
    if (player.dead) {
      return;
    }

    this.clearActivePowers();
    player.dead = true;
    this.snapshot.respawnTimerMs = RESPAWN_DELAY_MS;
    this.emitCue(AUDIO_CUES.death);
  }

  private defeatEnemy(
    enemy: EnemyState,
    cause: EnemyDefeatCause,
    cue: AudioCue,
  ): void {
    enemy.alive = false;
    enemy.defeatCause = cause;
    this.emitCue(cue);
  }

  private respawnPlayer(): void {
    const { progress, stageIndex } = this.snapshot;
    this.snapshot = this.createSnapshot(
      stageIndex,
      cloneProgress(progress),
      this.snapshot.activeCheckpointId,
      this.captureCheckpointRestoreState(),
      this.snapshot.activeCheckpointId ? this.checkpointRevealIds : [],
    );
  }

  private activateRewardBlock(block: RewardBlockState): void {
    if (block.remainingHits <= 0) {
      return;
    }

    block.hitFlashMs = REWARD_BLOCK_FLASH_MS;
    this.emitCue(AUDIO_CUES.block);
    if (block.reward.kind === 'coins') {
      block.remainingHits -= 1;
      block.used = block.remainingHits <= 0;
      this.spawnRewardReveal(block, { kind: 'coins', amount: 1 });
      this.awardCoins(1);
      return;
    }

    block.remainingHits = 0;
    block.used = true;
    this.spawnRewardReveal(block, block.reward);
    this.grantPower(block.reward.power);
  }

  private grantPower(power: PowerType): void {
    const { progress, player } = this.snapshot;
    progress.activePowers[power] = true;
    player.presentationPower = power;

    switch (power) {
      case 'doubleJump':
        player.airJumpsRemaining = Math.max(player.airJumpsRemaining, 1);
        this.setStageMessage(getPowerGainMessage(power), 2000);
        break;
      case 'shooter':
        this.setStageMessage(getPowerGainMessage(power), 2000);
        break;
      case 'invincible':
        progress.powerTimers.invincibleMs = POWER_INVINCIBLE_MS;
        this.setStageMessage(getPowerGainMessage(power), 2200);
        break;
      case 'dash':
        this.setStageMessage(getPowerGainMessage(power), 2000);
        break;
    }

    this.emitCue(AUDIO_CUES.power);
  }

  private awardCoins(amount: number, message?: string): void {
    const { progress, stageRuntime, player } = this.snapshot;
    progress.totalCoins += amount;
    stageRuntime.collectedCoins = Math.min(stageRuntime.totalCoins, stageRuntime.collectedCoins + amount);
    if (message) {
      this.setStageMessage(message, 1500);
    }
    this.emitCue(AUDIO_CUES.collect);

    if (
      stageRuntime.totalCoins > 0 &&
      stageRuntime.collectedCoins >= stageRuntime.totalCoins &&
      !stageRuntime.allCoinsRecovered
    ) {
      stageRuntime.allCoinsRecovered = true;
      player.health = player.maxHealth;
      this.setStageMessage(getAllCollectiblesRecoveredMessage(), 2200);
      this.emitCue(AUDIO_CUES.heal);
    }
  }

  private spawnRewardReveal(block: RewardBlockState, reward: RewardRevealState['reward']): void {
    this.emitCue(AUDIO_CUES.rewardReveal);
    this.snapshot.stageRuntime.rewardReveals.push({
      id: `${block.id}-reveal-${Math.random().toString(36).slice(2, 8)}`,
      reward,
      x: block.x + block.width / 2,
      y: block.y - 14,
      timerMs: REWARD_REVEAL_MS,
      durationMs: REWARD_REVEAL_MS,
    });
  }

  private clearActivePowers(): void {
    this.clearPowers({ preserveInvincibility: false });
  }

  private consumeHitShield(): 'none' | 'non-invincible' | 'invincible' | 'mixed' {
    const { activePowers, powerTimers } = this.snapshot.progress;
    const invincibilityActive = powerTimers.invincibleMs > 0;
    const hasNonInvinciblePowers = (Object.keys(activePowers) as PowerType[]).some(
      (power) => power !== 'invincible' && activePowers[power],
    );

    if (!invincibilityActive && !hasNonInvinciblePowers) {
      return 'none';
    }

    this.clearPowers({ preserveInvincibility: invincibilityActive });

    if (invincibilityActive && hasNonInvinciblePowers) {
      return 'mixed';
    }

    return invincibilityActive ? 'invincible' : 'non-invincible';
  }

  private clearPowers(options: { preserveInvincibility: boolean }): void {
    const { activePowers, powerTimers } = this.snapshot.progress;
    const { preserveInvincibility } = options;

    for (const key of Object.keys(activePowers) as PowerType[]) {
      if (preserveInvincibility && key === 'invincible') {
        continue;
      }
      activePowers[key] = false;
    }

    if (preserveInvincibility) {
      activePowers.invincible = powerTimers.invincibleMs > 0;
    } else {
      activePowers.invincible = false;
      powerTimers.invincibleMs = 0;
    }

    this.snapshot.player.airJumpsRemaining = 0;
    this.snapshot.player.dashTimerMs = 0;
    this.snapshot.player.dashCooldownMs = 0;
    this.snapshot.player.shootCooldownMs = 0;
    this.syncPlayerPresentationPower();
  }

  private captureCheckpointRestoreState(): CheckpointRestoreState {
    const { stageRuntime } = this.snapshot;

    return {
      collectedCollectibleIds: new Set(
        stageRuntime.collectibles.filter((collectible) => collectible.collected).map((collectible) => collectible.id),
      ),
      coinRewardBlocks: new Map(
        stageRuntime.rewardBlocks
          .filter((rewardBlock) => rewardBlock.reward.kind === 'coins')
          .map((rewardBlock) => [
            rewardBlock.id,
            {
              used: rewardBlock.used,
              remainingHits: rewardBlock.remainingHits,
            },
          ]),
      ),
      collectedCoins: stageRuntime.collectedCoins,
      allCoinsRecovered: stageRuntime.allCoinsRecovered,
      objectiveCompleted: stageRuntime.objective?.completed ?? false,
    };
  }

  private completeStageObjective(targetKind: StageObjectiveState['target']['kind'], targetId: string): boolean {
    const objective = this.snapshot.stageRuntime.objective;
    if (!objective || objective.completed) {
      return false;
    }

    if (objective.target.kind !== targetKind || objective.target.id !== targetId) {
      return false;
    }

    objective.completed = true;
    this.setStageMessage(getStageObjectiveCompletionMessage(objective.kind), 2200);
    return true;
  }

  private findSupportSurface(id: string): SolidSurface | null {
    return createSolidSurfaceList(this.snapshot.stageRuntime).find((surface) => surface.id === id) ?? null;
  }

  private findSupportingTerrainPlatform(platformId: string, playerX: number, playerY: number): PlatformState | null {
    const supportPoint = platformSupportPoint(PLAYER_WIDTH, PLAYER_HEIGHT, playerX, playerY);
    return (
      this.snapshot.stageRuntime.platforms.find(
        (platform) =>
          platform.id === platformId &&
          (platform.surfaceMechanic?.kind === 'brittleCrystal' || platform.surfaceMechanic?.kind === 'stickySludge') &&
          supportPoint.x >= platform.x &&
          supportPoint.x <= platform.x + platform.width &&
          supportPoint.y >= platform.y - TERRAIN_SURFACE_TOP_EPSILON &&
          supportPoint.y <= platform.y + platform.height + TERRAIN_SURFACE_TOP_EPSILON,
      ) ?? null
    );
  }

  private findContactedSpringPlatform(playerX: number, playerY: number, platformId?: string): PlatformState | null {
    const supportPoint = platformSupportPoint(PLAYER_WIDTH, PLAYER_HEIGHT, playerX, playerY);
    return (
      this.snapshot.stageRuntime.platforms.find(
        (platform) => {
          const overlap = Math.max(0, Math.min(playerX + PLAYER_WIDTH, platform.x + platform.width) - Math.max(playerX, platform.x));
          return (
            (!platformId || platform.id === platformId) &&
            platform.kind === 'spring' &&
            Boolean(platform.spring) &&
            overlap >= Math.min(PLAYER_WIDTH - 2, platform.width) &&
            supportPoint.x >= platform.x &&
            supportPoint.x <= platform.x + platform.width &&
            supportPoint.y >= platform.y - TERRAIN_SURFACE_TOP_EPSILON &&
            supportPoint.y <= platform.y + platform.height + TERRAIN_SURFACE_TOP_EPSILON
          );
        },
      ) ?? null
    );
  }

  private syncPlayerPresentationPower(): void {
    const { player, progress } = this.snapshot;
    const current = player.presentationPower;
    if (
      current &&
      (progress.activePowers[current] || (current === 'invincible' && progress.powerTimers.invincibleMs > 0))
    ) {
      return;
    }

    player.presentationPower =
      PLAYER_PRESENTATION_ORDER.find(
        (power) => progress.activePowers[power] || (power === 'invincible' && progress.powerTimers.invincibleMs > 0),
      ) ?? null;
  }

  private isEnemyVisible(enemy: EnemyState): boolean {
    if (!this.cameraViewBox) {
      return true;
    }

    const viewBox =
      enemy.kind === 'turret'
        ? expandRect(this.cameraViewBox, TURRET_VIEW_LEAD_MARGIN, 0)
        : this.cameraViewBox;
    return intersectsRect(viewBox, enemyRect(enemy));
  }

  private emitEnemyViewportEntryCue(enemy: EnemyState, emittedCueThisFrame: boolean): void {
    const visible = this.isEnemyVisible(enemy);
    const wasVisible = this.visibleEnemyIds.has(enemy.id);

    if (visible) {
      this.visibleEnemyIds.add(enemy.id);
    } else {
      this.visibleEnemyIds.delete(enemy.id);
    }

    if (!visible || wasVisible || emittedCueThisFrame) {
      return;
    }

    switch (enemy.kind) {
      case 'walker':
      case 'flyer':
        this.emitCue(AUDIO_CUES.enemyPatrol);
        break;
      case 'hopper':
        this.emitCue(AUDIO_CUES.enemyHop);
        break;
      case 'charger':
        this.emitCue(enemy.charger?.state === 'charge' ? AUDIO_CUES.enemyCharge : AUDIO_CUES.danger);
        break;
      default:
        break;
    }
  }

  private setStageMessage(message: string, durationMs = 1600): void {
    this.snapshot.stageMessage = message;
    this.snapshot.stageMessageTimerMs = durationMs;
  }

  private createSnapshot(
    stageIndex: number,
    progress: SessionProgress,
    activeCheckpointId: string | null = null,
    checkpointRestore: CheckpointRestoreState | null = null,
    revealedPlatformIds: string[] = [],
  ): SessionSnapshot {
    const stage = stageDefinitions[stageIndex];
    const runSettings = progress.runSettings ?? createDefaultRunSettings();
    const difficulty = DIFFICULTY_CONFIG[runSettings.difficulty];
    const pressure = ENEMY_PRESSURE_CONFIG[runSettings.enemyPressure];
    const speedMultiplier = difficulty.enemySpeedMultiplier * pressure.enemySpeedMultiplier;
    const intervalMultiplier = difficulty.enemyIntervalMultiplier * pressure.enemyIntervalMultiplier;
    const respawnCheckpoint = activeCheckpointId
      ? stage.checkpoints.find((checkpoint) => checkpoint.id === activeCheckpointId) ?? null
      : null;
    const respawnAnchor = respawnCheckpoint
      ? resolveCheckpointRespawnPoint(stage, respawnCheckpoint.rect, PLAYER_WIDTH, PLAYER_HEIGHT)
      : null;
    const spawnX = respawnAnchor?.x ?? stage.playerSpawn.x;
    const spawnY = respawnAnchor?.y ?? stage.playerSpawn.y;
    const player: PlayerState = {
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      facing: 1,
      onGround: false,
      coyoteMs: 0,
      jumpBufferMs: 0,
      health: difficulty.maxHealth,
      maxHealth: difficulty.maxHealth,
      invulnerableMs: 0,
      dashTimerMs: 0,
      dashCooldownMs: 0,
      shootCooldownMs: 0,
      airJumpsRemaining: progress.activePowers.doubleJump ? 1 : 0,
      presentationPower: null,
      supportPlatformId: null,
      jumpSourceGravityCapsuleId: null,
      jumpSourceSupportPlatformId: null,
      phaseThroughSupportPlatformId: null,
      springContactPlatformId: null,
      lowGravityZoneId: null,
      gravityFieldId: null,
      gravityFieldKind: null,
      gravityScale: 1,
      suppressPresentation: false,
      dead: false,
    };

    const platforms = stage.platforms.map<PlatformState>((platform) => ({
      id: platform.id,
      kind: platform.kind,
      surfaceMechanic: platform.surfaceMechanic ? { kind: platform.surfaceMechanic.kind } : undefined,
      brittle:
        platform.surfaceMechanic?.kind === 'brittleCrystal'
          ? {
              phase: 'intact',
              warningMs: BRITTLE_WARNING_MS,
              unsupportedGapMs: 0,
              readyBreakDelayMs: BRITTLE_READY_BREAK_DELAY_MS,
              readyElapsedMs: 0,
              readyRemainingMs: BRITTLE_READY_BREAK_DELAY_MS,
            }
          : undefined,
      x: platform.x,
      y: platform.y,
      width: platform.width,
      height: platform.height,
      startX: platform.x,
      startY: platform.y,
      vx: 0,
      vy: 0,
      move: platform.move ? { ...platform.move, direction: -1 } : undefined,
      fall: platform.fall
        ? {
            triggerDelayMs: platform.fall.triggerDelayMs,
            stayArmThresholdMs: platform.fall.stayArmThresholdMs ?? FALL_STAY_ARM_THRESHOLD_MS,
            hopGapThresholdMs: platform.fall.hopGapThresholdMs ?? FALL_HOP_GAP_THRESHOLD_MS,
            timerMs: platform.fall.triggerDelayMs,
            triggered: false,
            falling: false,
            accumulatedSupportMs: 0,
            unsupportedGapMs: 0,
          }
        : undefined,
      spring: platform.spring
        ? {
            boost: platform.spring.boost,
            cooldownMs: platform.spring.cooldownMs,
            timerMs: 0,
          }
        : undefined,
      reveal: platform.reveal ? { ...platform.reveal } : undefined,
      temporaryBridge: platform.temporaryBridge ? { ...platform.temporaryBridge } : undefined,
      magnetic: platform.magnetic ? { ...platform.magnetic, powered: false } : undefined,
    }));

    const activeRevealIds = normalizeRevealedPlatformIds(revealedPlatformIds);
      const temporaryBridges = platforms
        .filter((platform): platform is PlatformState & { temporaryBridge: NonNullable<PlatformState['temporaryBridge']> } =>
          Boolean(platform.temporaryBridge),
        )
        .map<TemporaryBridgeState>((platform) =>
          createInactiveTemporaryBridgeState({
            id: platform.id,
            scannerId: platform.temporaryBridge.scannerId,
            revealId: platform.reveal?.id ?? null,
            durationMs: platform.temporaryBridge.durationMs,
          }),
        );
      const traversablePlatforms = activePlatforms(platforms, activeRevealIds, getActiveTemporaryBridgeIds(temporaryBridges));

    const filteredEnemies = stage.enemies.filter((_, index) => pressure.keepEnemy(index));
    const enemies = filteredEnemies.map<EnemyState>((enemy) => {
      const variantRuntime = enemy.variant ? createTurretVariantRuntime(enemy.variant, intervalMultiplier) : null;
      const width = enemy.kind === 'turret' ? 28 : 34;
      const height = enemy.kind === 'turret' ? 38 : enemy.kind === 'flyer' ? 24 : 30;
      const resolvedGroundedRect = isGroundedEnemy(enemy) ? resolveGroundedEnemyRect(stage, enemy) : null;
      const authoredSupport = isGroundedEnemy(enemy) ? findGroundedEnemySupport(stage, enemy) : null;
      const support = authoredSupport
        ? traversablePlatforms.find((platform) => platform.id === authoredSupport.id) ?? null
        : null;
      const supportY = support ? support.y - height : null;
      const lane =
        enemy.kind === 'walker' && enemy.patrol
          ? clampLaneToSupport(support, enemy.patrol.left, enemy.patrol.right, width)
          : enemy.kind === 'hopper' && enemy.hop
            ? clampLaneToSupport(support, enemy.position.x - 60, enemy.position.x + 60, width)
            : enemy.kind === 'charger' && enemy.charger
              ? clampLaneToSupport(support, enemy.charger.left, enemy.charger.right, width)
              : clampLaneToSupport(support, null, null, width);
      if (isGroundedEnemy(enemy) && (!support || !resolvedGroundedRect || supportY !== resolvedGroundedRect.y)) {
        throw new Error(`Grounded enemy is missing authored flush support at runtime: ${enemy.id}`);
      }

      const initialX = resolvedGroundedRect?.x ?? enemy.position.x;
      const initialY = resolvedGroundedRect?.y ?? supportY ?? enemy.position.y;

      return {
        id: enemy.id,
        kind: enemy.kind,
        variant: enemy.variant,
        x: initialX,
        y: initialY,
        vx: 0,
        vy: 0,
        width,
        height,
        alive: true,
        defeatCause: null,
        direction: -1,
        supportY,
        supportPlatformId: support?.id ?? null,
        laneLeft: lane.laneLeft,
        laneRight: lane.laneRight,
        patrol: enemy.patrol
          ? {
              ...enemy.patrol,
              speed: enemy.patrol.speed * speedMultiplier,
              left: lane.laneLeft ?? enemy.patrol.left,
              right: lane.laneRight !== null ? lane.laneRight + width : enemy.patrol.right,
            }
          : undefined,
        hop: enemy.hop
          ? {
              intervalMs: enemy.hop.intervalMs * intervalMultiplier,
              timerMs: enemy.hop.intervalMs * intervalMultiplier,
              impulse: enemy.hop.impulse,
              speed: enemy.hop.speed * speedMultiplier,
              committedHops: 0,
              targetPlatformId: null,
              targetX: null,
              targetY: null,
            }
          : undefined,
        turret: enemy.turret
          ? {
              intervalMs: enemy.turret.intervalMs * intervalMultiplier,
              timerMs: enemy.variant
                ? Math.max(0, enemy.turret.intervalMs * intervalMultiplier - (variantRuntime?.telegraphDurationMs ?? 0))
                : enemy.turret.intervalMs * intervalMultiplier,
              telegraphMs: 0,
              telegraphDurationMs: variantRuntime?.telegraphDurationMs ?? 0,
              burstGapMs: 0,
              burstGapDurationMs: variantRuntime?.burstGapDurationMs ?? 0,
              pendingShots: enemy.variant ? TURRET_VARIANT_CONFIG[enemy.variant].burstShots - 1 : 0,
            }
          : undefined,
        charger: enemy.charger
          ? {
              ...enemy.charger,
              patrolSpeed: enemy.charger.patrolSpeed * speedMultiplier,
              chargeSpeed: enemy.charger.chargeSpeed * speedMultiplier,
              windupMs: enemy.charger.windupMs * intervalMultiplier,
              cooldownMs: enemy.charger.cooldownMs * intervalMultiplier,
              left: lane.laneLeft ?? enemy.charger.left,
              right: lane.laneRight !== null ? lane.laneRight + width : enemy.charger.right,
              timerMs: 0,
              state: 'patrol',
            }
          : undefined,
        flyer: enemy.flyer
          ? {
              ...enemy.flyer,
              speed: enemy.flyer.speed * speedMultiplier,
              bobPhase: 0,
              originY: enemy.position.y,
            }
          : undefined,
      };
    });

    const powerInventory = {
      ...createDefaultPowerInventory(),
      ...progress.activePowers,
      invincible: progress.powerTimers.invincibleMs > 0,
    };
    const powerTimers = {
      ...createDefaultPowerTimers(),
      ...progress.powerTimers,
    };
    const blockCoinTotal = stage.rewardBlocks.reduce(
      (total, block) => total + (block.reward.kind === 'coins' ? block.reward.amount : 0),
      0,
    );

    const normalizedProgress: SessionProgress = {
      unlockedStageIndex: progress.unlockedStageIndex,
      totalCoins: progress.totalCoins,
      activePowers: powerInventory,
      powerTimers,
      runSettings,
    };
    const objective = createStageObjectiveState(stage, checkpointRestore?.objectiveCompleted ?? false);

    return {
      stageIndex,
      stage,
      currentSegmentId: stage.segments[0]?.id ?? 'stage',
      player,
      progress: normalizedProgress,
      activeCheckpointId,
      stageStartCoins: progress.totalCoins,
      exitFinish: {
        active: false,
        timerMs: 0,
        durationMs: EXIT_FINISH_DURATION_MS,
        suppressPresentation: false,
      },
      levelCompleted: false,
      levelJustCompleted: false,
      gameCompleted: false,
      stageMessage: objective && !objective.completed ? getStageObjectiveBriefing(objective.kind) : '',
      stageMessageTimerMs: objective && !objective.completed ? 2600 : 0,
      respawnTimerMs: 0,
      stageRuntime: {
        platforms,
        lowGravityZones: stage.lowGravityZones.map<LowGravityZoneState>((zone) => ({ ...zone })),
        gravityFields: stage.gravityFields.map<GravityFieldState>((field) => ({
          ...field,
          gravityCapsuleId: field.gravityCapsuleId ?? null,
        })),
        gravityCapsules: stage.gravityCapsules.map<GravityCapsuleState>((capsule) =>
          createResetGravityCapsuleState(capsule),
        ),
        revealVolumes: stage.revealVolumes.map<RevealVolumeState>((volume) => ({
          ...volume,
          revealPlatformIds: [...volume.revealPlatformIds],
        })),
        scannerVolumes: stage.scannerVolumes.map<ScannerVolumeState>((volume) =>
          createInactiveScannerVolumeState(volume),
        ),
        activationNodes: stage.activationNodes.map<ActivationNodeState>((node) => createInactiveActivationNodeState(node)),
        temporaryBridges,
        revealedPlatformIds: activeRevealIds,
        checkpoints: stage.checkpoints.map<CheckpointState>((checkpoint) => {
          const checkpointRect = resolveCheckpointRect(stage, checkpoint.rect);
          const checkpointRespawn = resolveCheckpointRespawnPoint(stage, checkpoint.rect, PLAYER_WIDTH, PLAYER_HEIGHT);
          if (!checkpointRespawn || !checkpointRect) {
            throw new Error(`Checkpoint is missing grounded visible support at runtime: ${checkpoint.id}`);
          }

          return {
            ...checkpoint,
            rect: checkpointRect,
            activated: checkpoint.id === activeCheckpointId,
            supportPlatformId: checkpointRespawn.supportPlatformId,
            respawn: {
              x: checkpointRespawn.x,
              y: checkpointRespawn.y,
            },
          };
        }),
        collectibles: stage.collectibles.map<CollectibleState>((collectible) => ({
          ...collectible,
          collected: checkpointRestore?.collectedCollectibleIds.has(collectible.id) ?? false,
        })),
        rewardBlocks: stage.rewardBlocks.map<RewardBlockState>((rewardBlock) => ({
          ...rewardBlock,
          used:
            rewardBlock.reward.kind === 'coins'
              ? (checkpointRestore?.coinRewardBlocks.get(rewardBlock.id)?.used ?? false)
              : false,
          remainingHits:
            rewardBlock.reward.kind === 'coins'
              ? (checkpointRestore?.coinRewardBlocks.get(rewardBlock.id)?.remainingHits ?? rewardBlock.reward.amount)
              : 1,
          hitFlashMs: 0,
        })),
        rewardReveals: [],
        hazards: stage.hazards.map<HazardState>((hazard) => {
          const rect = resolveHazardRect(stage, hazard.rect);
          if (!rect) {
            throw new Error(`Hazard is missing grounded visible support at runtime: ${hazard.id}`);
          }

          return {
            ...hazard,
            rect,
          };
        }),
        enemies: (() => {
          const resolvedEnemies = [...enemies];
          for (const enemy of resolvedEnemies) {
            if (enemy.kind === 'turret') {
              resolveTurretPosition(enemy, resolvedEnemies, stage.hazards, platforms);
            }
          }
          return resolvedEnemies;
        })(),
        projectiles: [],
        collectedCoins: checkpointRestore?.collectedCoins ?? 0,
        totalCoins: stage.collectibles.length + blockCoinTotal,
        allCoinsRecovered: checkpointRestore?.allCoinsRecovered ?? false,
        exitReached: false,
        objective,
      },
    };
  }

  private emitCue(cue: AudioCue): void {
    this.cues.push(cue);
  }
}
