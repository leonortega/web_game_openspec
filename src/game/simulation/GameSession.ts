import Phaser from 'phaser';
import { stageDefinitions, type StageDefinition } from '../content/stages';
import type { InputState } from '../input/actions';
import type {
  CheckpointState,
  CollectibleState,
  EnemyState,
  HazardState,
  PlatformState,
  PlayerState,
  ProjectileState,
  Rect,
  SessionProgress,
  StageRuntime,
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
const CHARGER_TRIGGER_RANGE = 220;
const ENEMY_SPACING_BUFFER = 28;
const HAZARD_SPACING_BUFFER = 52;
const HOP_HORIZONTAL_REACH = 280;
const HOP_VERTICAL_REACH = 170;
const HOP_FLIGHT_TIME_MIN = 0.42;
const HOP_FLIGHT_TIME_MAX = 0.78;
const HOP_HORIZONTAL_SPEED_LIMIT = 420;
const HOP_IMPULSE_LIMIT = 980;

export type SessionSnapshot = {
  stageIndex: number;
  stage: StageDefinition;
  stageRuntime: StageRuntime;
  currentSegmentId: string;
  player: PlayerState;
  progress: SessionProgress;
  activeCheckpointId: string | null;
  stageStartCrystals: number;
  levelCompleted: boolean;
  levelJustCompleted: boolean;
  gameCompleted: boolean;
  stageMessage: string;
  respawnTimerMs: number;
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

const platformRect = (platform: PlatformState): Rect => ({
  x: platform.x,
  y: platform.y,
  width: platform.width,
  height: platform.height,
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

const expandRect = (rect: Rect, paddingX: number, paddingY = paddingX): Rect => ({
  x: rect.x - paddingX,
  y: rect.y - paddingY,
  width: rect.width + paddingX * 2,
  height: rect.height + paddingY * 2,
});

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

export class GameSession {
  private snapshot: SessionSnapshot;

  private cues: string[] = [];

  constructor() {
    this.snapshot = this.createSnapshot(0, {
      unlockedStageIndex: 0,
      totalCrystals: 0,
      unlockedPowers: { dash: false },
    });
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
    this.snapshot = this.createSnapshot(this.snapshot.stageIndex, this.snapshot.progress);
  }

  startStage(index: number): void {
    const clamped = Math.max(0, Math.min(index, this.snapshot.progress.unlockedStageIndex));
    this.snapshot = this.createSnapshot(clamped, this.snapshot.progress);
  }

  forceStartStage(index: number): void {
    const clamped = Math.max(0, Math.min(index, stageDefinitions.length - 1));
    this.snapshot = this.createSnapshot(clamped, this.snapshot.progress);
  }

  advanceToNextStage(): void {
    if (this.snapshot.stageIndex >= stageDefinitions.length - 1) {
      this.snapshot.gameCompleted = true;
      return;
    }

    this.startStage(this.snapshot.stageIndex + 1);
  }

  update(deltaMs: number, input: InputState): void {
    const deltaSec = deltaMs / 1000;
    const { player, stage, stageRuntime } = this.snapshot;
    const wasOnGround = player.onGround;

    this.snapshot.levelJustCompleted = false;
    if (this.snapshot.stageMessage && !player.dead && !this.snapshot.levelCompleted) {
      this.snapshot.stageMessage = '';
    }

    if (player.dead) {
      this.snapshot.respawnTimerMs -= deltaMs;
      if (this.snapshot.respawnTimerMs <= 0) {
        this.respawnPlayer();
      }
      return;
    }

    this.updatePlatforms(deltaMs, deltaSec);

    const supportPlatform = player.supportPlatformId
      ? stageRuntime.platforms.find((platform) => platform.id === player.supportPlatformId) ?? null
      : null;
    if (supportPlatform && player.onGround) {
      const stillSupported =
        Math.abs(player.y + player.height - supportPlatform.y) <= 8 &&
        player.x + player.width > supportPlatform.x + 6 &&
        player.x < supportPlatform.x + supportPlatform.width - 6;

      if (stillSupported) {
        player.x = Phaser.Math.Clamp(player.x + supportPlatform.vx * deltaSec, 0, stage.world.width - player.width);
        player.y += supportPlatform.vy * deltaSec;
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

    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (direction !== 0) {
      player.facing = direction > 0 ? 1 : -1;
    }

    if (input.dashPressed && this.snapshot.progress.unlockedPowers.dash && player.dashCooldownMs <= 0) {
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
      } else {
        player.coyoteMs = Math.max(0, player.coyoteMs - deltaMs);
      }

      player.jumpBufferMs = input.jumpPressed ? JUMP_BUFFER_MS : Math.max(0, player.jumpBufferMs - deltaMs);
      if (player.jumpBufferMs > 0 && player.coyoteMs > 0) {
        player.vy = -JUMP_SPEED;
        player.onGround = false;
        player.supportPlatformId = null;
        player.coyoteMs = 0;
        player.jumpBufferMs = 0;
        this.emitCue('jump');
      }

      player.vy = Math.min(player.vy + stage.world.gravity * deltaSec, MAX_FALL_SPEED);
    } else {
      player.vx = player.facing * DASH_SPEED;
      player.vy = 0;
      player.onGround = false;
    }

    let nextX = player.x + player.vx * deltaSec;
    let nextY = player.y;

    const horizontalRect: Rect = { x: nextX, y: player.y, width: player.width, height: player.height };
    for (const platform of stageRuntime.platforms) {
      if (player.onGround && platform.id === player.supportPlatformId) {
        continue;
      }
      if (intersectsRect(horizontalRect, platformRect(platform))) {
        if (player.vx > 0) {
          nextX = platform.x - player.width;
        } else if (player.vx < 0) {
          nextX = platform.x + platform.width;
        }
        player.vx = 0;
      }
    }

    nextY += player.vy * deltaSec;
    player.onGround = false;
    player.supportPlatformId = null;
    let ridingPlatform: PlatformState | null = null;
    const verticalRect: Rect = { x: nextX, y: nextY, width: player.width, height: player.height };
    for (const platform of stageRuntime.platforms) {
      const rect = platformRect(platform);
      if (!intersectsRect(verticalRect, rect)) {
        continue;
      }

      if (player.vy > 0) {
        nextY = platform.y - player.height;
        player.onGround = true;
        player.supportPlatformId = platform.id;
        ridingPlatform = platform;
      } else if (player.vy < 0) {
        nextY = platform.y + platform.height;
      }
      player.vy = 0;
    }

    player.x = Phaser.Math.Clamp(nextX, 0, stage.world.width - player.width);
    player.y = nextY;

    if (ridingPlatform) {
      if (!wasOnGround) {
        this.emitCue('land');
      }

      if (ridingPlatform.kind === 'falling' && ridingPlatform.fall && !ridingPlatform.fall.triggered) {
        ridingPlatform.fall.triggered = true;
        ridingPlatform.fall.timerMs = ridingPlatform.fall.triggerDelayMs;
        this.emitCue('collapse');
      }

      if (
        ridingPlatform.kind === 'spring' &&
        ridingPlatform.spring &&
        ridingPlatform.spring.timerMs <= 0 &&
        !input.jumpHeld
      ) {
        ridingPlatform.spring.timerMs = ridingPlatform.spring.cooldownMs;
        player.vy = -ridingPlatform.spring.boost;
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
        enemy.turret.timerMs -= deltaMs;
        if (enemy.turret.timerMs <= 0) {
          enemy.turret.timerMs = enemy.turret.intervalMs;
          stageRuntime.projectiles.push({
            id: `${enemy.id}-shot-${Math.random().toString(36).slice(2, 7)}`,
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
      for (const platform of stageRuntime.platforms) {
        if (intersectsRect(shotRect, platformRect(platform))) {
          projectile.alive = false;
          break;
        }
      }

      if (projectile.alive && intersectsRect(shotRect, playerRect(player))) {
        projectile.alive = false;
        this.damagePlayer();
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
        this.snapshot.stageMessage = 'Checkpoint activated';
        this.emitCue('checkpoint');
      }
    }
  }

  private handleCollectibles(): void {
    const { player, progress, stageRuntime } = this.snapshot;
    const rect = playerRect(player);
    for (const crystal of stageRuntime.collectibles) {
      const itemRect: Rect = {
        x: crystal.position.x - 10,
        y: crystal.position.y - 10,
        width: 20,
        height: 20,
      };
      if (!crystal.collected && intersectsRect(rect, itemRect)) {
        crystal.collected = true;
        progress.totalCrystals += 1;
        this.snapshot.stageMessage = 'Crystal recovered';
        this.emitCue('collect');
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
        this.snapshot.stageMessage = 'Enemy stomped';
        this.emitCue('stomp');
      } else {
        this.damagePlayer();
      }
    }
  }

  private handleExit(): void {
    const { player, progress, stage, stageRuntime } = this.snapshot;
    if (!stageRuntime.exitReached && intersectsRect(playerRect(player), stage.exit)) {
      stageRuntime.exitReached = true;
      this.snapshot.levelCompleted = true;
      this.snapshot.levelJustCompleted = true;
      progress.unlockedStageIndex = Math.max(
        progress.unlockedStageIndex,
        Math.min(this.snapshot.stageIndex + 1, stageDefinitions.length - 1),
      );
      if (this.snapshot.stageIndex === 0 && !progress.unlockedPowers.dash) {
        progress.unlockedPowers.dash = true;
        this.snapshot.stageMessage = 'Portal restored - Air Dash awakened';
        this.emitCue('unlock');
      } else {
        this.snapshot.stageMessage =
          this.snapshot.stageIndex === stageDefinitions.length - 1 ? 'Sanctum restored' : 'Portal restored';
      }
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
      this.snapshot.stageMessage = `${segment.title}: ${segment.focus}`;
    }
  }

  private damagePlayer(): void {
    const { player } = this.snapshot;
    if (player.invulnerableMs > 0 || player.dead) {
      return;
    }

    player.health -= 1;
    player.invulnerableMs = INVULNERABLE_MS;
    player.vy = -260;
    player.vx = player.facing === 1 ? -180 : 180;
    this.emitCue('hurt');
    if (player.health <= 0) {
      this.killPlayer();
    } else {
      this.snapshot.stageMessage = 'You were hit';
    }
  }

  private killPlayer(): void {
    const { player } = this.snapshot;
    if (player.dead) {
      return;
    }

    player.dead = true;
    this.snapshot.respawnTimerMs = RESPAWN_DELAY_MS;
    this.snapshot.stageMessage = 'Respawning...';
  }

  private respawnPlayer(): void {
    const { progress, stageIndex } = this.snapshot;
    this.snapshot = this.createSnapshot(
      stageIndex,
      {
        unlockedStageIndex: progress.unlockedStageIndex,
        totalCrystals: this.snapshot.stageStartCrystals,
        unlockedPowers: { ...progress.unlockedPowers },
      },
      this.snapshot.activeCheckpointId,
    );
  }

  private createSnapshot(stageIndex: number, progress: SessionProgress, activeCheckpointId: string | null = null): SessionSnapshot {
    const stage = stageDefinitions[stageIndex];
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
      health: 3,
      maxHealth: 3,
      invulnerableMs: 0,
      dashTimerMs: 0,
      dashCooldownMs: 0,
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

    const enemies = stage.enemies.map<EnemyState>((enemy) => {
      const width = enemy.kind === 'turret' ? 28 : enemy.kind === 'flyer' ? 34 : 34;
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
              left: lane.laneLeft ?? enemy.patrol.left,
              right: lane.laneRight !== null ? lane.laneRight + width : enemy.patrol.right,
            }
          : undefined,
        hop: enemy.hop
          ? {
              intervalMs: enemy.hop.intervalMs,
              timerMs: enemy.hop.intervalMs,
              impulse: enemy.hop.impulse,
              speed: enemy.hop.speed,
              targetPlatformId: null,
              targetX: null,
              targetY: null,
            }
          : undefined,
        turret: enemy.turret
          ? {
              intervalMs: enemy.turret.intervalMs,
              timerMs: enemy.turret.intervalMs,
            }
          : undefined,
        charger: enemy.charger
          ? {
              ...enemy.charger,
              left: lane.laneLeft ?? enemy.charger.left,
              right: lane.laneRight !== null ? lane.laneRight + width : enemy.charger.right,
              timerMs: 0,
              state: 'patrol',
            }
          : undefined,
        flyer: enemy.flyer
          ? {
              ...enemy.flyer,
              bobPhase: 0,
              originY: enemy.position.y,
            }
          : undefined,
      };
    });

    return {
      stageIndex,
      stage,
      currentSegmentId: stage.segments[0]?.id ?? 'stage',
      player,
      progress: {
        unlockedStageIndex: progress.unlockedStageIndex,
        totalCrystals: progress.totalCrystals,
        unlockedPowers: { ...progress.unlockedPowers },
      },
      activeCheckpointId,
      stageStartCrystals: progress.totalCrystals,
      levelCompleted: false,
      levelJustCompleted: false,
      gameCompleted: false,
      stageMessage: stage.hint,
      respawnTimerMs: 0,
      stageRuntime: {
        platforms,
        checkpoints: stage.checkpoints.map<CheckpointState>((checkpoint) => ({
          ...checkpoint,
          activated: checkpoint.id === activeCheckpointId,
        })),
        collectibles: stage.collectibles.map<CollectibleState>((collectible) => ({
          ...collectible,
          collected: false,
        })),
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
        exitReached: false,
      },
    };
  }

  private emitCue(cue: string): void {
    this.cues.push(cue);
  }
}
