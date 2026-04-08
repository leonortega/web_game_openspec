import Phaser from 'phaser';
import { stageDefinitions, type StageDefinition } from '../content/stages';
import type { InputState } from '../input/actions';
import type {
  CheckpointState,
  CollectibleState,
  EnemyState,
  HazardState,
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

export class GameSession {
  private snapshot: SessionSnapshot;

  constructor() {
    this.snapshot = this.createSnapshot(0, { unlockedStageIndex: 0, totalCrystals: 0 });
  }

  getState(): Readonly<SessionSnapshot> {
    return this.snapshot;
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
    this.snapshot = this.createSnapshot(clamped, {
      unlockedStageIndex: this.snapshot.progress.unlockedStageIndex,
      totalCrystals: this.snapshot.progress.totalCrystals,
    });
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
    const { player, stage } = this.snapshot;

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

    if (player.invulnerableMs > 0) {
      player.invulnerableMs = Math.max(0, player.invulnerableMs - deltaMs);
    }

    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (direction !== 0) {
      player.facing = direction > 0 ? 1 : -1;
    }

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
      player.coyoteMs = 0;
      player.jumpBufferMs = 0;
    }

    player.vy = Math.min(player.vy + stage.world.gravity * deltaSec, MAX_FALL_SPEED);

    let nextX = player.x + player.vx * deltaSec;
    let nextY = player.y;

    const horizontalRect: Rect = { x: nextX, y: player.y, width: player.width, height: player.height };
    for (const platform of stage.platforms) {
      if (intersectsRect(horizontalRect, platform)) {
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
    const verticalRect: Rect = { x: nextX, y: nextY, width: player.width, height: player.height };
    for (const platform of stage.platforms) {
      if (intersectsRect(verticalRect, platform)) {
        if (player.vy > 0) {
          nextY = platform.y - player.height;
          player.onGround = true;
        } else if (player.vy < 0) {
          nextY = platform.y + platform.height;
        }
        player.vy = 0;
      }
    }

    player.x = Phaser.Math.Clamp(nextX, 0, stage.world.width - player.width);
    player.y = nextY;

    this.updateCurrentSegment();
    this.updateEnemies(deltaMs, deltaSec);
    this.updateProjectiles(deltaSec);
    this.handleCheckpointInteractions();
    this.handleCollectibles();
    this.handleHazardsAndPits();
    this.handleEnemyInteractions();
    this.handleExit();
  }

  private updateEnemies(deltaMs: number, deltaSec: number): void {
    const { stage, stageRuntime } = this.snapshot;
    for (const enemy of stageRuntime.enemies) {
      if (!enemy.alive) {
        continue;
      }

      if (enemy.kind === 'walker' && enemy.patrol) {
        enemy.vx = enemy.direction * enemy.patrol.speed;
        enemy.x += enemy.vx * deltaSec;
        if (enemy.x <= enemy.patrol.left) {
          enemy.x = enemy.patrol.left;
          enemy.direction = 1;
        }
        if (enemy.x + enemy.width >= enemy.patrol.right) {
          enemy.x = enemy.patrol.right - enemy.width;
          enemy.direction = -1;
        }
      }

      if (enemy.kind === 'hopper' && enemy.hop) {
        enemy.hop.timerMs -= deltaMs;
        if (enemy.hop.timerMs <= 0) {
          enemy.hop.timerMs = enemy.hop.intervalMs;
          enemy.vy = -enemy.hop.impulse;
          enemy.vx = enemy.direction * enemy.hop.speed;
          enemy.direction = enemy.direction === 1 ? -1 : 1;
        }

        enemy.vy = Math.min(enemy.vy + stage.world.gravity * deltaSec, MAX_FALL_SPEED);
        enemy.x += enemy.vx * deltaSec;
        enemy.y += enemy.vy * deltaSec;

        let grounded = false;
        for (const platform of stage.platforms) {
          const rect = enemyRect(enemy);
          if (intersectsRect(rect, platform) && enemy.vy >= 0) {
            enemy.y = platform.y - enemy.height;
            enemy.vy = 0;
            grounded = true;
          }
        }
        if (grounded) {
          enemy.vx *= 0.85;
          if (Math.abs(enemy.vx) < 6) {
            enemy.vx = 0;
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
      for (const platform of stage.platforms) {
        if (intersectsRect(shotRect, platform)) {
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
      }
    }
  }

  private handleHazardsAndPits(): void {
    const { player, stageRuntime } = this.snapshot;
    const rect = playerRect(player);
    if (player.y > this.snapshot.stage.world.height + 120) {
      this.killPlayer();
      return;
    }

    for (const hazard of stageRuntime.hazards) {
      if (intersectsRect(rect, hazard.rect)) {
        if (hazard.kind === 'pit') {
          this.killPlayer();
        } else {
          this.damagePlayer();
        }
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
        this.snapshot.stageMessage = 'Enemy stomped';
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
      this.snapshot.stageMessage =
        this.snapshot.stageIndex === stageDefinitions.length - 1 ? 'Sanctum restored' : 'Portal restored';
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
    this.snapshot = this.createSnapshot(stageIndex, {
      unlockedStageIndex: progress.unlockedStageIndex,
      totalCrystals: this.snapshot.stageStartCrystals,
    }, this.snapshot.activeCheckpointId);
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
      dead: false,
    };

    return {
      stageIndex,
      stage,
      currentSegmentId: stage.segments[0]?.id ?? 'stage',
      player,
      progress: {
        unlockedStageIndex: progress.unlockedStageIndex,
        totalCrystals: progress.totalCrystals,
      },
      activeCheckpointId,
      stageStartCrystals: progress.totalCrystals,
      levelCompleted: false,
      levelJustCompleted: false,
      gameCompleted: false,
      stageMessage: stage.hint,
      respawnTimerMs: 0,
      stageRuntime: {
        checkpoints: stage.checkpoints.map<CheckpointState>((checkpoint) => ({
          ...checkpoint,
          activated: checkpoint.id === activeCheckpointId,
        })),
        collectibles: stage.collectibles.map<CollectibleState>((collectible) => ({
          ...collectible,
          collected: false,
        })),
        hazards: stage.hazards.map<HazardState>((hazard) => ({ ...hazard })),
        enemies: stage.enemies.map<EnemyState>((enemy) => ({
          id: enemy.id,
          kind: enemy.kind,
          x: enemy.position.x,
          y: enemy.position.y,
          vx: 0,
          vy: 0,
          width: enemy.kind === 'turret' ? 28 : 30,
          height: enemy.kind === 'turret' ? 38 : 28,
          alive: true,
          direction: -1,
          patrol: enemy.patrol,
          hop: enemy.hop
            ? {
                intervalMs: enemy.hop.intervalMs,
                timerMs: enemy.hop.intervalMs,
                impulse: enemy.hop.impulse,
                speed: enemy.hop.speed,
              }
            : undefined,
          turret: enemy.turret
            ? {
                intervalMs: enemy.turret.intervalMs,
                timerMs: enemy.turret.intervalMs,
              }
            : undefined,
        })),
        projectiles: [],
        exitReached: false,
      },
    };
  }
}
