import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
      Wrap: (value: number, min: number, max: number) => {
        const range = max - min;
        return range <= 0 ? min : ((((value - min) % range) + range) % range) + min;
      },
    },
  },
}));

import { GameSession } from './GameSession';
import { defaultInputState } from '../input/actions';

const getMutableState = (session: GameSession) => session.getState() as any;

const getCoinRewardBlock = (state: any) => {
  const rewardBlock = state.stageRuntime.rewardBlocks.find((block: any) => block.reward.kind === 'coins');
  if (!rewardBlock) {
    throw new Error('Expected stage to include a coin reward block.');
  }
  return rewardBlock;
};

const getLauncher = (state: any, kind: 'bouncePod' | 'gasVent') => {
  const launcherEntry = state.stageRuntime.launchers.find((candidate: any) => candidate.kind === kind);
  if (!launcherEntry) {
    throw new Error(`Expected stage to include a ${kind} launcher.`);
  }

  const supportPlatform = state.stageRuntime.platforms.find((platform: any) => platform.id === launcherEntry.supportPlatformId);
  if (!supportPlatform) {
    throw new Error(`Expected launcher ${launcherEntry.id} to have support.`);
  }

  return { launcherEntry, supportPlatform };
};

const placePlayerAboveLauncher = (state: any, launcherEntry: any, supportPlatform: any, vy = 160) => {
  state.player.x = launcherEntry.x + Math.min(launcherEntry.width - 12, 12) - state.player.width / 2;
  state.player.y = supportPlatform.y - state.player.height - 1;
  state.player.vx = 0;
  state.player.vy = vy;
  state.player.onGround = false;
  state.player.supportPlatformId = null;
  state.player.supportTerrainSurfaceId = null;
};

const placePlayerOnSupportOutsideLauncher = (state: any, supportPlatform: any) => {
  state.player.x = supportPlatform.x + supportPlatform.width - state.player.width - 4;
  state.player.y = supportPlatform.y - state.player.height;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.onGround = true;
  state.player.supportPlatformId = supportPlatform.id;
  state.player.supportTerrainSurfaceId = null;
};

describe('GameSession regression coverage', () => {
  it('consumes non-invincible active powers without reducing health on a damaging hit', () => {
    const session = new GameSession();
    const state = getMutableState(session);

    state.player.health = 3;
    state.progress.activePowers.doubleJump = true;
    state.progress.activePowers.dash = true;

    (session as any).damagePlayer();

    expect(state.player.health).toBe(3);
    expect(state.player.invulnerableMs).toBeGreaterThan(0);
    expect(Object.values(state.progress.activePowers).every((active) => active === false)).toBe(true);
    expect(state.stageMessage).toBe('Power shield broke');
  });

  it('preserves invincibility on a damaging hit while its timer is active', () => {
    const session = new GameSession();
    const state = getMutableState(session);

    state.player.health = 3;
    state.progress.activePowers.invincible = true;
    state.progress.powerTimers.invincibleMs = 5000;

    (session as any).damagePlayer();

    expect(state.player.health).toBe(3);
    expect(state.player.invulnerableMs).toBeGreaterThan(0);
    expect(state.progress.activePowers.invincible).toBe(true);
    expect(state.progress.powerTimers.invincibleMs).toBe(5000);
    expect(state.stageMessage).toBe('Invincibility held');
  });

  it('preserves invincibility while clearing other powers on a mixed-power damaging hit', () => {
    const session = new GameSession();
    const state = getMutableState(session);

    state.player.health = 3;
    state.progress.activePowers.invincible = true;
    state.progress.powerTimers.invincibleMs = 5000;
    state.progress.activePowers.doubleJump = true;
    state.progress.activePowers.dash = true;
    state.player.airJumpsRemaining = 1;
    state.player.dashCooldownMs = 100;

    (session as any).damagePlayer();

    expect(state.player.health).toBe(3);
    expect(state.progress.activePowers.invincible).toBe(true);
    expect(state.progress.powerTimers.invincibleMs).toBe(5000);
    expect(state.progress.activePowers.doubleJump).toBe(false);
    expect(state.progress.activePowers.dash).toBe(false);
    expect(state.player.airJumpsRemaining).toBe(0);
    expect(state.player.dashCooldownMs).toBe(0);
    expect(state.stageMessage).toBe('Power shield broke - invincibility held');
  });

  it('preserves unpowered damage and death behavior', () => {
    const session = new GameSession();
    const state = getMutableState(session);

    state.player.health = 2;

    (session as any).damagePlayer();
    expect(state.player.health).toBe(1);
    expect(state.player.dead).toBe(false);
    expect(state.stageMessage).toBe('You were hit');

    state.player.invulnerableMs = 0;
    (session as any).damagePlayer();

    expect(state.player.dead).toBe(true);
    expect(state.respawnTimerMs).toBeGreaterThan(0);
    expect(state.stageMessage).toBe('Respawning...');
  });

  it('uses survey-beacon and research-sample copy without changing checkpoint or collectible progression', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const checkpoint = state.stageRuntime.checkpoints[0];
    const collectible = state.stageRuntime.collectibles[0];

    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    session.update(16, defaultInputState());

    expect(state.activeCheckpointId).toBe(checkpoint.id);
    expect(state.stageMessage).toBe('Survey beacon activated');

    state.player.x = collectible.position.x - state.player.width / 2;
    state.player.y = collectible.position.y - state.player.height / 2;
    (session as any).handleCollectibles();

    expect(state.progress.totalCoins).toBe(1);
    expect(state.stageRuntime.collectedCoins).toBe(1);
    expect(state.stageMessage).toBe('Research sample recovered');
  });

  it('preserves collected coins and blocks duplicate full-clear rewards across checkpoint respawns', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const checkpointId = state.stageRuntime.checkpoints[0]?.id;

    if (!checkpointId) {
      throw new Error('Expected stage to include a checkpoint.');
    }

    state.activeCheckpointId = checkpointId;
    for (const collectible of state.stageRuntime.collectibles) {
      collectible.collected = true;
    }
    for (const rewardBlock of state.stageRuntime.rewardBlocks) {
      if (rewardBlock.reward.kind === 'coins') {
        rewardBlock.used = true;
        rewardBlock.remainingHits = 0;
      }
    }
    state.stageRuntime.collectedCoins = state.stageRuntime.totalCoins;
    state.stageRuntime.allCoinsRecovered = true;
    state.progress.totalCoins = state.stageRuntime.totalCoins;

    (session as any).respawnPlayer();

    const respawned = getMutableState(session);
    const respawnedCoinBlock = getCoinRewardBlock(respawned);
    const coinsBefore = respawned.progress.totalCoins;
    const healthBefore = respawned.player.health;

    expect(respawned.stageRuntime.collectibles.every((collectible: any) => collectible.collected)).toBe(true);
    expect(respawned.stageRuntime.collectedCoins).toBe(respawned.stageRuntime.totalCoins);
    expect(respawned.stageRuntime.allCoinsRecovered).toBe(true);
    expect(respawnedCoinBlock.used).toBe(true);
    expect(respawnedCoinBlock.remainingHits).toBe(0);

    const firstCollectible = respawned.stageRuntime.collectibles[0];
    respawned.player.x = firstCollectible.position.x - respawned.player.width / 2;
    respawned.player.y = firstCollectible.position.y - respawned.player.height / 2;
    (session as any).handleCollectibles();
    (session as any).activateRewardBlock(respawnedCoinBlock);

    expect(respawned.progress.totalCoins).toBe(coinsBefore);
    expect(respawned.player.health).toBe(healthBefore);
  });

  it('rebuilds stage coin state on manual restart', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const coinBlock = getCoinRewardBlock(state);

    state.stageRuntime.collectibles[0].collected = true;
    state.stageRuntime.collectedCoins = 2;
    state.stageRuntime.allCoinsRecovered = true;
    coinBlock.used = true;
    coinBlock.remainingHits = 0;
    state.progress.totalCoins = 2;

    session.restartStage();

    const restarted = getMutableState(session);
    const restartedCoinBlock = getCoinRewardBlock(restarted);

    expect(restarted.stageRuntime.collectibles.every((collectible: any) => collectible.collected === false)).toBe(true);
    expect(restarted.stageRuntime.collectedCoins).toBe(0);
    expect(restarted.stageRuntime.allCoinsRecovered).toBe(false);
    expect(restartedCoinBlock.used).toBe(false);
    expect(restartedCoinBlock.remainingHits).toBe(restartedCoinBlock.reward.amount);
  });

  it('persists revealed platforms only when the checkpoint is activated after the reveal', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const revealVolume = state.stageRuntime.revealVolumes[0];
    const revealPlatform = state.stageRuntime.platforms.find((platform: any) => platform.reveal);
    const lateCheckpoint = state.stageRuntime.checkpoints[state.stageRuntime.checkpoints.length - 1];

    state.player.x = revealVolume.x + 12;
    state.player.y = revealVolume.y + 12;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.revealedPlatformIds).toContain(revealPlatform.reveal.id);

    state.player.x = lateCheckpoint.rect.x;
    state.player.y = lateCheckpoint.rect.y;
    session.update(16, defaultInputState());

    (session as any).respawnPlayer();
    state = getMutableState(session);
    expect(state.stageRuntime.revealedPlatformIds).toContain(revealPlatform.reveal.id);
  });

  it('resets revealed platforms when the reveal happens after the active checkpoint', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const earlyCheckpoint = state.stageRuntime.checkpoints[0];
    const revealVolume = state.stageRuntime.revealVolumes[0];
    const revealPlatform = state.stageRuntime.platforms.find((platform: any) => platform.reveal);

    state.player.x = earlyCheckpoint.rect.x;
    state.player.y = earlyCheckpoint.rect.y;
    session.update(16, defaultInputState());

    state.player.x = revealVolume.x + 12;
    state.player.y = revealVolume.y + 12;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.revealedPlatformIds).toContain(revealPlatform.reveal.id);

    (session as any).respawnPlayer();
    state = getMutableState(session);
    expect(state.stageRuntime.revealedPlatformIds).not.toContain(revealPlatform.reveal.id);
  });

  it('activates temporary bridges on scanner entry and refreshes them only after leaving and re-entering', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const scanner = state.stageRuntime.scannerVolumes[0];
    const bridgePlatform = state.stageRuntime.platforms.find((platform: any) => platform.temporaryBridge);
    const fullDuration = bridgePlatform.temporaryBridge.durationMs;

    expect(state.stageRuntime.temporaryBridges[0].active).toBe(false);

    state.player.x = scanner.x + 16;
    state.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.scannerVolumes[0].activated).toBe(true);
    expect(state.stageRuntime.temporaryBridges[0].active).toBe(true);
    expect(state.stageRuntime.temporaryBridges[0].remainingMs).toBe(fullDuration);

    session.update(16, defaultInputState());
    const afterStayingInside = getMutableState(session);
    expect(afterStayingInside.stageRuntime.temporaryBridges[0].remainingMs).toBe(fullDuration - 16);

    afterStayingInside.player.x = scanner.x - afterStayingInside.player.width - 24;
    afterStayingInside.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    let afterLeaving = getMutableState(session);
    const remainingAfterLeaving = afterLeaving.stageRuntime.temporaryBridges[0].remainingMs;
    expect(remainingAfterLeaving).toBeLessThan(fullDuration - 16);

    afterLeaving.player.x = scanner.x + scanner.width - 20;
    afterLeaving.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.temporaryBridges[0].remainingMs).toBe(fullDuration);
  });

  it('keeps an expired temporary bridge active until the player leaves its support surface', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const scanner = state.stageRuntime.scannerVolumes[0];
    state.player.x = scanner.x + 16;
    state.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    const bridge = state.stageRuntime.temporaryBridges[0];
    const bridgePlatform = state.stageRuntime.platforms.find((platform: any) => platform.id === bridge.id);

    bridge.remainingMs = 1;
    state.player.x = bridgePlatform.x + 24;
    state.player.y = bridgePlatform.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = bridge.id;

    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.temporaryBridges[0].active).toBe(true);
    expect(state.stageRuntime.temporaryBridges[0].pendingHide).toBe(true);
    expect(state.player.supportPlatformId).toBe(bridge.id);

    state.player.x = bridgePlatform.x + bridgePlatform.width + 36;
    state.player.y = bridgePlatform.y - state.player.height;
    state.player.onGround = true;
    state.player.supportPlatformId = bridge.id;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.temporaryBridges[0].active).toBe(false);
    expect(state.stageRuntime.temporaryBridges[0].pendingHide).toBe(false);
  });

  it('resets scanner switches and temporary bridges after death, checkpoint respawn, and manual restart', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const scanner = state.stageRuntime.scannerVolumes[0];
    const checkpoint = state.stageRuntime.checkpoints[0];

    const activateBridge = () => {
      const mutable = getMutableState(session);
      mutable.player.x = scanner.x + 16;
      mutable.player.y = scanner.y + 16;
      session.update(16, defaultInputState());
    };

    activateBridge();
    state = getMutableState(session);
    expect(state.stageRuntime.temporaryBridges[0].active).toBe(true);

    state.player.health = 1;
    (session as any).damagePlayer();
    (session as any).respawnPlayer();

    state = getMutableState(session);
    expect(state.stageRuntime.scannerVolumes.every((volume: any) => !volume.activated && !volume.playerInside)).toBe(true);
    expect(
      state.stageRuntime.temporaryBridges.every(
        (bridge: any) => !bridge.active && !bridge.pendingHide && bridge.remainingMs === 0,
      ),
    ).toBe(true);

    activateBridge();
    state = getMutableState(session);
    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    session.update(16, defaultInputState());
    (session as any).respawnPlayer();

    state = getMutableState(session);
    expect(state.stageRuntime.scannerVolumes.every((volume: any) => !volume.activated && !volume.playerInside)).toBe(true);
    expect(state.stageRuntime.temporaryBridges.every((bridge: any) => bridge.remainingMs === 0 && bridge.active === false)).toBe(
      true,
    );

    activateBridge();
    session.restartStage();
    state = getMutableState(session);
    expect(state.stageRuntime.scannerVolumes.every((volume: any) => !volume.activated && !volume.playerInside)).toBe(true);
    expect(state.stageRuntime.temporaryBridges.every((bridge: any) => bridge.remainingMs === 0 && bridge.active === false)).toBe(
      true,
    );
  });

  it('applies low gravity after jump impulses, pauses it during dash, and resumes it afterward', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const support = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'static');

    state.stageRuntime.lowGravityZones = [
      {
        id: 'test-low-gravity',
        x: support.x - 20,
        y: support.y - 220,
        width: 280,
        height: 260,
        gravityScale: 0.4,
      },
    ];
    state.player.x = support.x + 24;
    state.player.y = support.y - state.player.height;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;

    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    let next = getMutableState(session);
    expect(next.player.gravityScale).toBe(0.4);
    expect(next.player.vy).toBeLessThan(-620);

    next.progress.activePowers.dash = true;
    next.player.x = support.x + 30;
    next.player.y = support.y - 120;
    next.player.onGround = false;
    next.player.supportPlatformId = null;
    next.player.vy = 90;
    session.update(16, { ...defaultInputState(), dashPressed: true });

    next = getMutableState(session);
    expect(next.player.dashTimerMs).toBeGreaterThan(0);
    expect(next.player.vy).toBe(0);
    expect(next.player.gravityScale).toBe(1);

    next.player.dashTimerMs = 0;
    next.player.vy = 0;
    session.update(16, defaultInputState());

    next = getMutableState(session);
    expect(next.player.gravityScale).toBe(0.4);
    expect(next.player.vy).toBeCloseTo(next.stage.world.gravity * 0.4 * 0.016, 5);
  });

  it('keeps spring boosts and falling-platform escape jumps intact inside low-gravity zones', () => {
    const session = new GameSession();
    let state = getMutableState(session);
    const springPlatform = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'spring');

    state.stageRuntime.lowGravityZones = [
      {
        id: 'support-zone',
        x: springPlatform.x - 20,
        y: springPlatform.y - 220,
        width: 320,
        height: 260,
        gravityScale: 0.45,
      },
    ];
    state.player.x = springPlatform.x + 10;
    state.player.y = springPlatform.y - state.player.height;
    state.player.vy = 60;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.vy).toBe(-springPlatform.spring.boost);

    session.forceStartStage(0);
    state = getMutableState(session);
    const fallingPlatform = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'falling');
    state.stageRuntime.lowGravityZones = [
      {
        id: 'falling-zone',
        x: fallingPlatform.x - 20,
        y: fallingPlatform.y - 220,
        width: 320,
        height: 260,
        gravityScale: 0.45,
      },
    ];
    state.player.x = fallingPlatform.x + 28;
    state.player.y = fallingPlatform.y - state.player.height;
    state.player.onGround = true;
    state.player.supportPlatformId = fallingPlatform.id;

    session.update(16, defaultInputState());
    for (let index = 0; index < 48; index += 1) {
      session.update(16, defaultInputState());
    }

    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });
    state = getMutableState(session);
    expect(state.player.vy).toBeLessThan(-620);
    expect(state.player.supportPlatformId).toBeNull();
  });

  it('arms brittle floors on first support, allows an expiry jump, and breaks after contact ends', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const brittleSurface = state.stageRuntime.terrainSurfaces.find((surface: any) => surface.kind === 'brittleCrystal');
    const supportPlatform = state.stageRuntime.platforms.find((platform: any) => platform.id === brittleSurface.supportPlatformId);

    state.player.x = brittleSurface.x + 28 - state.player.width / 2;
    state.player.y = supportPlatform.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = supportPlatform.id;
    state.player.supportTerrainSurfaceId = brittleSurface.id;

    session.update(16, defaultInputState());

    state = getMutableState(session);
    const warnedSurface = state.stageRuntime.terrainSurfaces.find((surface: any) => surface.id === brittleSurface.id);
    expect(warnedSurface.brittle.phase).toBe('warning');

    warnedSurface.brittle.warningMs = 1;
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    state = getMutableState(session);
    const brokenSurface = state.stageRuntime.terrainSurfaces.find((surface: any) => surface.id === brittleSurface.id);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.supportPlatformId).toBeNull();
    expect(state.player.supportTerrainSurfaceId).toBeNull();
    expect(brokenSurface.brittle.phase).toBe('broken');
  });

  it('resets brittle floors on death respawn, checkpoint respawn, and manual restart', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const brittleSurface = state.stageRuntime.terrainSurfaces.find((surface: any) => surface.kind === 'brittleCrystal');
    const checkpoint = state.stageRuntime.checkpoints[0];

    brittleSurface.brittle.phase = 'broken';
    state.player.health = 1;
    (session as any).damagePlayer();
    (session as any).respawnPlayer();

    state = getMutableState(session);
    expect(state.stageRuntime.terrainSurfaces.find((surface: any) => surface.id === brittleSurface.id).brittle.phase).toBe('intact');

    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    session.update(16, defaultInputState());
    state.stageRuntime.terrainSurfaces.find((surface: any) => surface.id === brittleSurface.id).brittle.phase = 'broken';
    (session as any).respawnPlayer();

    state = getMutableState(session);
    expect(state.stageRuntime.terrainSurfaces.find((surface: any) => surface.id === brittleSurface.id).brittle.phase).toBe('intact');

    state.stageRuntime.terrainSurfaces.find((surface: any) => surface.id === brittleSurface.id).brittle.phase = 'broken';
    session.restartStage();
    state = getMutableState(session);
    expect(state.stageRuntime.terrainSurfaces.find((surface: any) => surface.id === brittleSurface.id).brittle.phase).toBe('intact');
  });

  it('reduces sticky grounded acceleration and keeps buffered and coyote jumps sourced from sludge reduced', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const support = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'static' && platform.width >= 180);

    state.player.x = support.x + 32;
    state.player.y = support.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;
    state.player.supportTerrainSurfaceId = null;
    for (let index = 0; index < 5; index += 1) {
      session.update(16, { ...defaultInputState(), right: true });
    }
    const normalVx = getMutableState(session).player.vx;

    session.forceStartStage(0);
    state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    state.stageRuntime.terrainSurfaces = [
      {
        id: 'sticky-ground-test',
        kind: 'stickySludge',
        x: support.x,
        y: support.y,
        width: 140,
        height: 12,
        supportPlatformId: support.id,
      },
    ];
    state.player.x = support.x + 32;
    state.player.y = support.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;
    state.player.supportTerrainSurfaceId = 'sticky-ground-test';
    for (let index = 0; index < 5; index += 1) {
      session.update(16, { ...defaultInputState(), right: true });
    }
    state = getMutableState(session);
    expect(state.player.vx).toBeLessThan(normalVx);

    session.forceStartStage(0);
    state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    state.stageRuntime.terrainSurfaces = [
      {
        id: 'sticky-buffer-test',
        kind: 'stickySludge',
        x: support.x,
        y: support.y,
        width: 140,
        height: 12,
        supportPlatformId: support.id,
      },
    ];
    state.player.x = support.x + 32;
    state.player.y = support.y - state.player.height - 8;
    state.player.vx = 0;
    state.player.vy = 160;
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });
    for (let index = 0; index < 4; index += 1) {
      session.update(16, { ...defaultInputState(), jumpHeld: true });
      if (getMutableState(session).player.vy < 0) {
        break;
      }
    }
    state = getMutableState(session);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.vy).toBeGreaterThan(-640);

    state.player.onGround = false;
    state.player.supportPlatformId = null;
    state.player.supportTerrainSurfaceId = null;
    state.player.coyoteMs = 100;
    state.player.coyoteTerrainSurfaceKind = 'stickySludge';
    state.player.vy = 0;
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });
    state = getMutableState(session);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.vy).toBeGreaterThan(-640);
  });

  it('keeps dash normal on sticky sludge and applies low gravity after the reduced jump impulse', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const stickySupport = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'static' && platform.width >= 180);

    state.progress.activePowers.dash = true;
    state.stageRuntime.terrainSurfaces = [
      {
        id: 'sticky-dash-test',
        kind: 'stickySludge',
        x: stickySupport.x,
        y: stickySupport.y,
        width: 140,
        height: 12,
        supportPlatformId: stickySupport.id,
      },
    ];
    state.player.x = stickySupport.x + 32;
    state.player.y = stickySupport.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = stickySupport.id;
    state.player.supportTerrainSurfaceId = 'sticky-dash-test';
    state.player.facing = 1;
    session.update(16, { ...defaultInputState(), dashPressed: true });
    state = getMutableState(session);
    expect(state.player.vx).toBe(520);
    expect(state.player.vy).toBe(0);

    session.forceStartStage(0);
    state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    state.stageRuntime.terrainSurfaces = [
      {
        id: 'sticky-low-gravity-test',
        kind: 'stickySludge',
        x: stickySupport.x,
        y: stickySupport.y,
        width: 140,
        height: 12,
        supportPlatformId: stickySupport.id,
      },
    ];
    state.stageRuntime.lowGravityZones = [
      {
        id: 'sticky-zone',
        x: stickySupport.x - 20,
        y: stickySupport.y - 220,
        width: 260,
        height: 260,
        gravityScale: 0.4,
      },
    ];
    const lowGravityZone = state.stageRuntime.lowGravityZones[0];
    state.player.x = stickySupport.x + 32;
    state.player.y = stickySupport.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = stickySupport.id;
    state.player.supportTerrainSurfaceId = 'sticky-low-gravity-test';
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });
    state = getMutableState(session);
    expect(state.player.gravityScale).toBe(lowGravityZone.gravityScale);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.vy).toBeGreaterThan(-640);
  });

  it('launches from bounce pods and gas vents with distinct impulse and cooldown values', () => {
    const bounceSession = new GameSession();
    bounceSession.forceStartStage(0);
    let state = getMutableState(bounceSession);
    const { launcherEntry: bouncePod, supportPlatform: bounceSupport } = getLauncher(state, 'bouncePod');

    placePlayerAboveLauncher(state, bouncePod, bounceSupport);
    bounceSession.update(16, defaultInputState());

    state = getMutableState(bounceSession);
    expect(state.player.vx).toBeCloseTo(bouncePod.direction.x * bouncePod.impulse, 5);
    expect(state.player.vy).toBeCloseTo(bouncePod.direction.y * bouncePod.impulse, 5);
    expect(state.stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id).timerMs).toBe(
      bouncePod.cooldownMs,
    );
    expect(bounceSession.consumeCues()).toContain('bounce-pod');

    const gasSession = new GameSession();
    gasSession.forceStartStage(2);
    state = getMutableState(gasSession);
    const { launcherEntry: gasVent, supportPlatform: gasSupport } = getLauncher(state, 'gasVent');

    placePlayerAboveLauncher(state, gasVent, gasSupport);
    gasSession.update(16, defaultInputState());

    state = getMutableState(gasSession);
    expect(state.player.vx).toBeCloseTo(gasVent.direction.x * gasVent.impulse, 5);
    expect(state.player.vy).toBeCloseTo(gasVent.direction.y * gasVent.impulse, 5);
    expect(state.stageRuntime.launchers.find((candidate: any) => candidate.id === gasVent.id).timerMs).toBe(
      gasVent.cooldownMs,
    );
    expect(gasSession.consumeCues()).toContain('gas-vent');
    expect(Math.abs(bouncePod.direction.y * bouncePod.impulse)).toBeGreaterThan(Math.abs(gasVent.direction.y * gasVent.impulse));
    expect(bouncePod.cooldownMs).toBeLessThan(gasVent.cooldownMs);
  });

  it('suppresses launcher auto-fire on held jump, avoids delayed launch on the same contact, and allows cooldown reuse on a fresh contact', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    const { launcherEntry: bouncePod, supportPlatform } = getLauncher(state, 'bouncePod');

    placePlayerAboveLauncher(state, bouncePod, supportPlatform);
    session.update(16, { ...defaultInputState(), jumpHeld: true });

    state = getMutableState(session);
    expect(state.player.onGround).toBe(true);
    expect(state.player.vy).toBe(0);
    expect(state.player.launcherContactId).toBe(bouncePod.id);
    expect(state.stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id).timerMs).toBe(0);

    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.vy).toBe(0);
    expect(state.stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id).timerMs).toBe(0);

    placePlayerOnSupportOutsideLauncher(state, supportPlatform);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.launcherContactId).toBeNull();

    placePlayerAboveLauncher(state, bouncePod, supportPlatform);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.vy).toBeCloseTo(bouncePod.direction.y * bouncePod.impulse, 5);

    const liveLauncher = state.stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id);
    liveLauncher.timerMs = 1;
    placePlayerOnSupportOutsideLauncher(state, supportPlatform);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id).timerMs).toBe(0);

    placePlayerAboveLauncher(state, bouncePod, supportPlatform);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.vy).toBeCloseTo(bouncePod.direction.y * bouncePod.impulse, 5);
  });

  it('composes launcher impulses with low gravity and sticky sludge without damping the initial launch', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { launcherEntry: gasVent, supportPlatform } = getLauncher(state, 'gasVent');
    const stickySurface = state.stageRuntime.terrainSurfaces.find((surface: any) => surface.kind === 'stickySludge');
    const lowGravityZone = state.stageRuntime.lowGravityZones[0];

    expect(stickySurface.supportPlatformId).toBe(gasVent.supportPlatformId);
    placePlayerAboveLauncher(state, gasVent, supportPlatform);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.gravityScale).toBe(lowGravityZone.gravityScale);
    expect(state.player.vx).toBeCloseTo(gasVent.direction.x * gasVent.impulse, 5);
    expect(state.player.vy).toBeCloseTo(gasVent.direction.y * gasVent.impulse, 5);
  });

  it('does not interrupt dash on launcher contact and does not retroactively launch until a fresh contact happens', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    const { launcherEntry: bouncePod, supportPlatform } = getLauncher(state, 'bouncePod');

    state.progress.activePowers.dash = true;
    state.player.facing = 1;
    state.player.dashTimerMs = 64;
    state.player.dashCooldownMs = 100;
    state.player.vx = 520;
    state.player.vy = 0;
    state.player.x = bouncePod.x + Math.min(bouncePod.width - 12, 12) - state.player.width / 2;
    state.player.y = supportPlatform.y - state.player.height - 8;
    state.player.onGround = false;
    state.player.supportPlatformId = null;

    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.dashTimerMs).toBeGreaterThan(0);
    expect(state.player.vx).toBe(520);
    expect(state.player.vy).toBe(0);
    expect(state.player.launcherContactId).toBe(bouncePod.id);
    expect(state.stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id).timerMs).toBe(0);

    state.player.dashTimerMs = 0;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.y = supportPlatform.y - state.player.height;
    state.player.onGround = true;
    state.player.supportPlatformId = supportPlatform.id;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.vy).toBe(0);
    expect(state.stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id).timerMs).toBe(0);
  });

  it('resets launcher readiness on respawn and manual restart', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    const { launcherEntry: bouncePod, supportPlatform } = getLauncher(state, 'bouncePod');

    placePlayerAboveLauncher(state, bouncePod, supportPlatform);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id).timerMs).toBeGreaterThan(0);

    state.player.health = 1;
    (session as any).damagePlayer();
    (session as any).respawnPlayer();

    state = getMutableState(session);
    expect(state.stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id).timerMs).toBe(0);

    placePlayerAboveLauncher(state, state.stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id), supportPlatform);
    session.update(16, defaultInputState());
    expect(getMutableState(session).stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id).timerMs).toBeGreaterThan(0);

    session.restartStage();
    state = getMutableState(session);
    expect(state.stageRuntime.launchers.find((candidate: any) => candidate.id === bouncePod.id).timerMs).toBe(0);
  });
});