import Phaser from 'phaser';
import { stageDefinitions, type StageDefinition } from '../content/stages';
import type { InputState } from '../input/actions';
import {
  createDefaultPowerInventory,
  createDefaultPowerTimers,
  createDefaultRunSettings,
  createDefaultSessionProgress,
  type CheckpointState,
  type CollectibleState,
  type DifficultySetting,
  type EnemyPressureSetting,
  type EnemyState,
  type HazardState,
  type PlatformState,
  type PlayerState,
  type PowerType,
  type ProjectileState,
  type Rect,
  type RewardBlockState,
  type RewardRevealState,
  type RunSettings,
  type SessionProgress,
  type StageRuntime,
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
const PLAYER_PRESENTATION_ORDER: PowerType[] = ['invincible', 'shooter', 'doubleJump', 'dash'];

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
};

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
    };

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

const isStableEnemySupport = (platform: Pick<PlatformState, 'kind'>): boolean =>
  platform.kind === 'static' || platform.kind === 'spring';

const findStableSupportForSpan = (
  platforms: PlatformState[],
  left: number,
  right: number,
  expectedTop: number,
): PlatformState | null =>
  platforms.find((platform) => {
    if (!isStableEnemySupport(platform)) {
      return false;
    }

    const overlap = Math.min(right, platform.x + platform.width) - Math.max(left, platform.x);
    return overlap >= Math.min(right - left, platform.width) * 0.55 && Math.abs(platform.y - expectedTop) <= 40;
  }) ?? null;

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
      const left = Phaser.Math.Clamp(anchorX - offset, laneLeft, laneRight);
      const right = Phaser.Math.Clamp(anchorX + offset, laneLeft, laneRight);
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

  const currentAnchorX = Phaser.Math.Clamp(turret.x, support.x, support.x + support.width - turret.width);
  if (tryPlaceOnSupport(support, currentAnchorX)) {
    return;
  }

  const supportCenterX = support.x + support.width / 2;
  const fallbackSupports = platforms
    .filter(
      (platform) =>
        platform.id !== support.id &&
        isStableEnemySupport(platform) &&
        Math.abs(platform.y - support.y) <= 120 &&
        Math.abs(platform.x + platform.width / 2 - supportCenterX) <= 360,
    )
    .sort(
      (a, b) =>
        Math.abs(a.x + a.width / 2 - supportCenterX) - Math.abs(b.x + b.width / 2 - supportCenterX),
    );

  for (const fallbackSupport of fallbackSupports) {
    const anchorX = Phaser.Math.Clamp(turret.x, fallbackSupport.x, fallbackSupport.x + fallbackSupport.width - turret.width);
    if (tryPlaceOnSupport(fallbackSupport, anchorX)) {
      return;
    }
  }
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
  const candidates = platforms
    .filter((platform) => platform.id !== currentSupport.id && isStableEnemySupport(platform))
    .map((platform) => {
      const targetLeft = platform.x;
      const targetRight = platform.x + platform.width - enemy.width;
      const landingX = Phaser.Math.Clamp(currentCenterX - enemy.width / 2, targetLeft, targetRight);
      const landingCenterX = landingX + enemy.width / 2;
      const dx = landingCenterX - currentCenterX;
      const dy = platform.y - enemy.height - currentY;
      if (Math.sign(dx || desiredDirection) !== desiredDirection) {
        return null;
      }
      if (Math.abs(dx) > HOP_HORIZONTAL_REACH || Math.abs(dy) > HOP_VERTICAL_REACH) {
        return null;
      }

      const baseFlightTime = Phaser.Math.Clamp(
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
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => a.score - b.score);

  return candidates[0] ?? null;
};

const cloneProgress = (progress: SessionProgress): SessionProgress => ({
  unlockedStageIndex: progress.unlockedStageIndex,
  totalCoins: progress.totalCoins,
  activePowers: { ...progress.activePowers },
  powerTimers: { ...progress.powerTimers },
  runSettings: { ...progress.runSettings },
});

const createSolidSurfaceList = (runtime: StageRuntime): SolidSurface[] => [
  ...runtime.platforms.map<SolidSurface>((platform) => ({
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
];

const surfaceRect = (surface: SolidSurface): Rect => ({
  x: surface.x,
  y: surface.y,
  width: surface.width,
  height: surface.height,
});

export class GameSession {
  private snapshot: SessionSnapshot;

  private cues: string[] = [];

  private cameraViewBox: Rect | null = null;

  constructor() {
    this.snapshot = this.createSnapshot(0, createDefaultSessionProgress());
  }

  getState(): Readonly<SessionSnapshot> {
    return this.snapshot;
  }

  consumeCues(): string[] {
    const pending = [...this.cues];
    this.cues.length = 0;
    return pending;
  }

  restartStage(): void {
    this.snapshot = this.createSnapshot(this.snapshot.stageIndex, cloneProgress(this.snapshot.progress));
  }

  startStage(index: number): void {
    const clamped = Math.max(0, Math.min(index, this.snapshot.progress.unlockedStageIndex));
    this.snapshot = this.createSnapshot(clamped, cloneProgress(this.snapshot.progress));
  }

  forceStartStage(index: number): void {
    const clamped = Math.max(0, Math.min(index, stageDefinitions.length - 1));
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
          : Phaser.Math.Clamp(next.masterVolume, 0, 1),
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

    this.updatePlatforms(deltaMs, deltaSec);

    const supportSurface = player.supportPlatformId ? this.findSupportSurface(player.supportPlatformId) : null;
    if (supportSurface && player.onGround) {
      const stillSupported =
        Math.abs(player.y + player.height - supportSurface.y) <= 8 &&
        player.x + player.width > supportSurface.x + 6 &&
        player.x < supportSurface.x + supportSurface.width - 6;

      if (stillSupported) {
        player.x = Phaser.Math.Clamp(player.x + supportSurface.vx * deltaSec, 0, stage.world.width - player.width);
        player.y += supportSurface.vy * deltaSec;
      } else {
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
      this.emitCue('shoot');
    }

    if (input.dashPressed && this.snapshot.progress.activePowers.dash && player.dashCooldownMs <= 0) {
      player.dashTimerMs = DASH_DURATION_MS;
      player.dashCooldownMs = DASH_COOLDOWN_MS;
      player.vx = player.facing * DASH_SPEED;
      player.vy = 0;
      player.supportPlatformId = null;
      this.emitCue('dash');
    }

    if (player.dashTimerMs <= 0) {
      const accel = player.onGround ? GROUND_ACCEL : AIR_ACCEL;
      if (direction !== 0) {
        player.vx = Phaser.Math.Clamp(player.vx + direction * accel * deltaSec, -MAX_MOVE_SPEED, MAX_MOVE_SPEED);
      } else if (player.onGround) {
        const drag = Math.min(Math.abs(player.vx), GROUND_ACCEL * deltaSec);
        player.vx -= Math.sign(player.vx) * drag;
      }

      if (player.onGround) {
        player.coyoteMs = COYOTE_TIME_MS;
        player.airJumpsRemaining = this.snapshot.progress.activePowers.doubleJump ? 1 : 0;
      } else {
        player.coyoteMs = Math.max(0, player.coyoteMs - deltaMs);
      }

      player.jumpBufferMs = input.jumpPressed ? JUMP_BUFFER_MS : Math.max(0, player.jumpBufferMs - deltaMs);
      if (player.jumpBufferMs > 0) {
        if (player.coyoteMs > 0) {
          player.vy = -JUMP_SPEED;
          player.onGround = false;
          player.supportPlatformId = null;
          player.coyoteMs = 0;
          player.jumpBufferMs = 0;
          this.emitCue('jump');
        } else if (this.snapshot.progress.activePowers.doubleJump && player.airJumpsRemaining > 0) {
          player.vy = -JUMP_SPEED;
          player.onGround = false;
          player.supportPlatformId = null;
          player.airJumpsRemaining -= 1;
          player.jumpBufferMs = 0;
          this.emitCue('double-jump');
        }
      }

      player.vy = Math.min(player.vy + stage.world.gravity * deltaSec, MAX_FALL_SPEED);
    } else {
      player.vx = player.facing * DASH_SPEED;
      player.vy = 0;
      player.onGround = false;
    }

    let nextX = player.x + player.vx * deltaSec;
    let nextY = player.y;
    const solidSurfaces = createSolidSurfaceList(stageRuntime);

    const horizontalRect: Rect = { x: nextX, y: player.y, width: player.width, height: player.height };
    for (const surface of solidSurfaces) {
      if (player.onGround && surface.id === player.supportPlatformId) {
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
      if (!intersectsRect(verticalRect, surfaceRect(surface))) {
        continue;
      }

      if (player.vy > 0) {
        nextY = surface.y - player.height;
        player.onGround = true;
        player.supportPlatformId = surface.id;
        ridingSurface = surface;
      } else if (player.vy < 0) {
        nextY = surface.y + surface.height;
        if (surface.kind === 'rewardBlock') {
          this.activateRewardBlock(surface.rewardBlock);
        }
      }
      player.vy = 0;
      break;
    }

    player.x = Phaser.Math.Clamp(nextX, 0, stage.world.width - player.width);
    player.y = nextY;

    if (ridingSurface) {
      if (!wasOnGround) {
        this.emitCue('land');
      }

      if (ridingSurface.kind === 'platform' && ridingSurface.platform.kind === 'falling' && ridingSurface.platform.fall && !ridingSurface.platform.fall.triggered) {
        ridingSurface.platform.fall.triggered = true;
        ridingSurface.platform.fall.timerMs = ridingSurface.platform.fall.triggerDelayMs;
        this.emitCue('collapse');
      }

      if (
        ridingSurface.kind === 'platform' &&
        ridingSurface.platform.kind === 'spring' &&
        ridingSurface.platform.spring &&
        ridingSurface.platform.spring.timerMs <= 0 &&
        !input.jumpHeld
      ) {
        ridingSurface.platform.spring.timerMs = ridingSurface.platform.spring.cooldownMs;
        player.vy = -ridingSurface.platform.spring.boost;
        player.onGround = false;
        player.supportPlatformId = null;
        this.emitCue('spring');
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
    if (next === 0) {
      this.setStageMessage('Invincibility faded', 1400);
    }
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
          } else if (platform.x >= maxX) {
            platform.x = maxX;
            platform.move.direction = -1;
          }
        } else {
          platform.vy = platform.move.direction * platform.move.speed;
          platform.y += platform.vy * deltaSec;
          const minY = platform.startY - platform.move.range;
          const maxY = platform.startY;
          if (platform.y <= minY) {
            platform.y = minY;
            platform.move.direction = 1;
          } else if (platform.y >= maxY) {
            platform.y = maxY;
            platform.move.direction = -1;
          }
        }
      }

      if (platform.spring) {
        platform.spring.timerMs = Math.max(0, platform.spring.timerMs - deltaMs);
      }

      if (platform.fall?.triggered && !platform.fall.falling) {
        platform.fall.timerMs -= deltaMs;
        if (platform.fall.timerMs <= 0) {
          platform.fall.falling = true;
        }
      }

      if (platform.fall?.falling) {
        platform.vy += this.snapshot.stage.world.gravity * 0.75 * deltaSec;
        platform.y += platform.vy * deltaSec;
      }
    }
  }

  private updateEnemies(deltaMs: number, deltaSec: number): void {
    const { player, stage, stageRuntime } = this.snapshot;
    for (const enemy of stageRuntime.enemies) {
      if (!enemy.alive) {
        continue;
      }

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
        }
        if (enemy.x >= laneRight) {
          enemy.x = laneRight;
          enemy.direction = -1;
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
            let target = findReachableHopTarget(enemy, stageRuntime.platforms, stage.world.gravity);
            if (!target) {
              enemy.direction = enemy.direction === 1 ? -1 : 1;
              target = findReachableHopTarget(enemy, stageRuntime.platforms, stage.world.gravity);
            }

            if (target) {
              hop.timerMs = hop.intervalMs;
              hop.targetPlatformId = target.platform.id;
              hop.targetX = target.landingX;
              hop.targetY = target.landingY;
              enemy.vx = target.vx;
              enemy.vy = target.vy;
              enemy.direction = target.vx >= 0 ? 1 : -1;
              enemy.supportPlatformId = null;
              enemy.supportY = null;
            } else {
              hop.timerMs = Math.min(hop.intervalMs, 220);
              enemy.direction = enemy.direction === 1 ? -1 : 1;
            }
          }
        }

        if (enemy.supportPlatformId === null) {
          const previousBottom = enemy.y + enemy.height;
          enemy.vy = Math.min(enemy.vy + stage.world.gravity * deltaSec, MAX_FALL_SPEED);
          enemy.x += enemy.vx * deltaSec;
          enemy.y += enemy.vy * deltaSec;

          const targetPlatform = hop.targetPlatformId
            ? stageRuntime.platforms.find((platform) => platform.id === hop.targetPlatformId) ?? null
            : null;
          const platformsToCheck = targetPlatform ? [targetPlatform] : stageRuntime.platforms.filter(isStableEnemySupport);
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
              enemy.x = Phaser.Math.Clamp(enemy.x, platform.x, platform.x + platform.width - enemy.width);
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
            const rescuePlatform = hop.targetPlatformId
              ? stageRuntime.platforms.find((platform) => platform.id === hop.targetPlatformId) ?? null
              : null;
            if (rescuePlatform) {
              enemy.y = rescuePlatform.y - enemy.height;
              enemy.x = Phaser.Math.Clamp(enemy.x, rescuePlatform.x, rescuePlatform.x + rescuePlatform.width - enemy.width);
              enemy.supportY = enemy.y;
              enemy.supportPlatformId = rescuePlatform.id;
              enemy.vx = 0;
              enemy.vy = 0;
            }
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

        enemy.turret.timerMs -= deltaMs;
        if (enemy.turret.timerMs <= 0) {
          enemy.turret.timerMs = enemy.turret.intervalMs;
          stageRuntime.projectiles.push({
            id: `${enemy.id}-shot-${Math.random().toString(36).slice(2, 7)}`,
            owner: 'enemy',
            x: enemy.direction === 1 ? enemy.x + enemy.width : enemy.x - 12,
            y: enemy.y + 10,
            vx: enemy.direction * 260,
            width: 12,
            height: 12,
            alive: true,
          });
          enemy.direction = enemy.direction === 1 ? -1 : 1;
          this.emitCue('turret-fire');
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
          }
        } else if (enemy.charger.state === 'windup') {
          enemy.charger.timerMs -= deltaMs;
          if (enemy.charger.timerMs <= 0) {
            enemy.charger.state = 'charge';
          }
        } else if (enemy.charger.state === 'charge') {
          enemy.vx = enemy.direction * enemy.charger.chargeSpeed;
          enemy.x += enemy.vx * deltaSec;
          if (enemy.x <= chargerLeft || enemy.x >= chargerRight) {
            enemy.x = Phaser.Math.Clamp(enemy.x, chargerLeft, chargerRight);
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
        }
        if (enemy.x + enemy.width >= enemy.flyer.right) {
          enemy.x = enemy.flyer.right - enemy.width;
          enemy.direction = -1;
        }
      }
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

        enemy.alive = false;
        projectile.alive = false;
        this.setStageMessage('Enemy blasted', 1300);
        this.emitCue('shoot-hit');
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
        this.setStageMessage('Checkpoint activated', 1500);
        this.emitCue('checkpoint');
      }
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
        this.awardCoins(1, 'Coin recovered');
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
        enemy.alive = false;
        player.vy = -STOMP_BOUNCE;
        player.onGround = false;
        player.supportPlatformId = null;
        this.setStageMessage('Enemy stomped', 1200);
        this.emitCue('stomp');
      } else {
        this.damagePlayer();
      }
    }
  }

  private handleExit(): void {
    const { progress, stage, stageRuntime } = this.snapshot;
    if (!stageRuntime.exitReached && intersectsRect(playerRect(this.snapshot.player), stage.exit)) {
      stageRuntime.exitReached = true;
      this.snapshot.levelCompleted = true;
      this.snapshot.levelJustCompleted = true;
      progress.unlockedStageIndex = Math.max(
        progress.unlockedStageIndex,
        Math.min(this.snapshot.stageIndex + 1, stageDefinitions.length - 1),
      );
      this.setStageMessage(
        this.snapshot.stageIndex === stageDefinitions.length - 1
          ? 'Sanctum restored'
          : this.hasActivePowers()
            ? 'Portal restored - powers retained'
            : 'Portal restored',
        2600,
      );
      this.emitCue('exit');
    }
  }

  private updateCurrentSegment(): void {
    const segment =
      this.snapshot.stage.segments.find(
        (item) => this.snapshot.player.x >= item.startX && this.snapshot.player.x < item.endX,
      ) ?? this.snapshot.stage.segments[this.snapshot.stage.segments.length - 1];

    if (segment.id !== this.snapshot.currentSegmentId) {
      this.snapshot.currentSegmentId = segment.id;
      this.setStageMessage(`${segment.title}: ${segment.focus}`, 2400);
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
      this.emitCue('hurt');
      this.setStageMessage(
        hitShieldState === 'mixed'
          ? 'Power shield broke - invincibility held'
          : hitShieldState === 'invincible'
            ? 'Invincibility held'
            : 'Power shield broke',
        1800,
      );
      return;
    }

    player.health -= 1;
    player.invulnerableMs = INVULNERABLE_MS;
    player.vy = -260;
    player.vx = player.facing === 1 ? -180 : 180;
    this.clearActivePowers();
    this.emitCue('hurt');
    if (player.health <= 0) {
      this.killPlayer();
    } else {
      this.setStageMessage('You were hit', 1800);
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
    this.setStageMessage('Respawning...', RESPAWN_DELAY_MS);
  }

  private respawnPlayer(): void {
    const { progress, stageIndex } = this.snapshot;
    this.snapshot = this.createSnapshot(
      stageIndex,
      cloneProgress(progress),
      this.snapshot.activeCheckpointId,
      this.captureCheckpointRestoreState(),
    );
  }

  private activateRewardBlock(block: RewardBlockState): void {
    if (block.remainingHits <= 0) {
      return;
    }

    block.hitFlashMs = REWARD_BLOCK_FLASH_MS;
    this.emitCue('block');
    if (block.reward.kind === 'coins') {
      block.remainingHits -= 1;
      block.used = block.remainingHits <= 0;
      this.spawnRewardReveal(block, { kind: 'coins', amount: 1 });
      this.awardCoins(1, block.remainingHits > 0 ? `Coin gained - ${block.remainingHits} left` : 'Coin gained');
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
        this.setStageMessage('Power gained: Double Jump', 2000);
        break;
      case 'shooter':
        this.setStageMessage('Power gained: Shooter', 2000);
        break;
      case 'invincible':
        progress.powerTimers.invincibleMs = POWER_INVINCIBLE_MS;
        this.setStageMessage('Power gained: Invincible for 10s', 2200);
        break;
      case 'dash':
        this.setStageMessage('Power gained: Dash', 2000);
        break;
    }

    this.emitCue('power');
  }

  private awardCoins(amount: number, message: string): void {
    const { progress, stageRuntime, player } = this.snapshot;
    progress.totalCoins += amount;
    stageRuntime.collectedCoins = Math.min(stageRuntime.totalCoins, stageRuntime.collectedCoins + amount);
    this.setStageMessage(message, 1500);
    this.emitCue('collect');

    if (
      stageRuntime.totalCoins > 0 &&
      stageRuntime.collectedCoins >= stageRuntime.totalCoins &&
      !stageRuntime.allCoinsRecovered
    ) {
      stageRuntime.allCoinsRecovered = true;
      player.health = player.maxHealth;
      this.setStageMessage('All coins recovered - energy restored', 2200);
      this.emitCue('heal');
    }
  }

  private spawnRewardReveal(block: RewardBlockState, reward: RewardRevealState['reward']): void {
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

  private hasActivePowers(): boolean {
    return (
      Object.values(this.snapshot.progress.activePowers).some(Boolean) ||
      this.snapshot.progress.powerTimers.invincibleMs > 0
    );
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
    };
  }

  private findSupportSurface(id: string): SolidSurface | null {
    return createSolidSurfaceList(this.snapshot.stageRuntime).find((surface) => surface.id === id) ?? null;
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

  private setStageMessage(message: string, durationMs = 1600): void {
    this.snapshot.stageMessage = message;
    this.snapshot.stageMessageTimerMs = durationMs;
  }

  private createSnapshot(
    stageIndex: number,
    progress: SessionProgress,
    activeCheckpointId: string | null = null,
    checkpointRestore: CheckpointRestoreState | null = null,
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
    const spawnX = respawnCheckpoint ? respawnCheckpoint.rect.x + 12 : stage.playerSpawn.x;
    const spawnY = respawnCheckpoint ? respawnCheckpoint.rect.y - PLAYER_HEIGHT : stage.playerSpawn.y;
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
      dead: false,
    };

    const platforms = stage.platforms.map<PlatformState>((platform) => ({
      id: platform.id,
      kind: platform.kind,
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
            timerMs: platform.fall.triggerDelayMs,
            triggered: false,
            falling: false,
          }
        : undefined,
      spring: platform.spring
        ? {
            boost: platform.spring.boost,
            cooldownMs: platform.spring.cooldownMs,
            timerMs: 0,
          }
        : undefined,
    }));

    const filteredEnemies = stage.enemies.filter((_, index) => pressure.keepEnemy(index));
    const enemies = filteredEnemies.map<EnemyState>((enemy) => {
      const width = enemy.kind === 'turret' ? 28 : 34;
      const height = enemy.kind === 'turret' ? 38 : enemy.kind === 'flyer' ? 24 : 30;
      const support = isGroundedEnemy(enemy)
        ? findStableSupportForSpan(platforms, enemy.position.x, enemy.position.x + width, enemy.position.y + height)
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
      const initialX =
        lane.laneLeft !== null && lane.laneRight !== null
          ? Phaser.Math.Clamp(enemy.position.x, lane.laneLeft, lane.laneRight)
          : enemy.position.x;

      return {
        id: enemy.id,
        kind: enemy.kind,
        x: initialX,
        y: supportY ?? enemy.position.y,
        vx: 0,
        vy: 0,
        width,
        height,
        alive: true,
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
              targetPlatformId: null,
              targetX: null,
              targetY: null,
            }
          : undefined,
        turret: enemy.turret
          ? {
              intervalMs: enemy.turret.intervalMs * intervalMultiplier,
              timerMs: enemy.turret.intervalMs * intervalMultiplier,
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

    return {
      stageIndex,
      stage,
      currentSegmentId: stage.segments[0]?.id ?? 'stage',
      player,
      progress: normalizedProgress,
      activeCheckpointId,
      stageStartCoins: progress.totalCoins,
      levelCompleted: false,
      levelJustCompleted: false,
      gameCompleted: false,
      stageMessage: stage.hint,
      stageMessageTimerMs: 2600,
      respawnTimerMs: 0,
      stageRuntime: {
        platforms,
        checkpoints: stage.checkpoints.map<CheckpointState>((checkpoint) => ({
          ...checkpoint,
          activated: checkpoint.id === activeCheckpointId,
        })),
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
        hazards: stage.hazards.map<HazardState>((hazard) => ({ ...hazard })),
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
      },
    };
  }

  private emitCue(cue: string): void {
    this.cues.push(cue);
  }
}
