import { describe, expect, it } from 'vitest';

import { AUDIO_CUES } from '../../audio/audioContract';
import { stageDefinitions } from '../content/stages';
import { GameSession } from './GameSession';
import { defaultInputState } from '../input/actions';
import { BRITTLE_READY_BREAK_DELAY_MS, TURRET_VARIANT_CONFIG } from './state';

const getMutableState = (session: GameSession) => session.getState() as any;

const applyTerrainVariantFixture = (platform: any, kind: 'brittleCrystal' | 'stickySludge') => {
  platform.surfaceMechanic = { kind };
  platform.brittle =
    kind === 'brittleCrystal'
      ? {
          phase: 'intact',
          warningMs: 420,
          unsupportedGapMs: 0,
          readyBreakDelayMs: BRITTLE_READY_BREAK_DELAY_MS,
          readyElapsedMs: 0,
          readyRemainingMs: BRITTLE_READY_BREAK_DELAY_MS,
        }
      : undefined;
  return platform;
};

const advanceSession = (session: GameSession, totalMs: number, stepMs = 16) => {
  let remainingMs = totalMs;
  while (remainingMs > 0) {
    const deltaMs = Math.min(stepMs, remainingMs);
    session.update(deltaMs, defaultInputState());
    remainingMs -= deltaMs;
  }
};

const getCoinRewardBlock = (state: any) => {
  const rewardBlock = state.stageRuntime.rewardBlocks.find((block: any) => block.reward.kind === 'coins');
  if (!rewardBlock) {
    throw new Error('Expected stage to include a coin reward block.');
  }
  return rewardBlock;
};

const getSpringPlatform = (state: any, platformId?: string) => {
  const springPlatform = state.stageRuntime.platforms.find(
    (platform: any) => platform.kind === 'spring' && (platformId ? platform.id === platformId : true),
  );
  if (!springPlatform) {
    throw new Error(platformId ? `Expected stage to include spring platform ${platformId}.` : 'Expected stage to include a spring platform.');
  }
  return springPlatform;
};

const placePlayerAbovePlatform = (state: any, platform: any, vy = 160) => {
  state.player.x = platform.x + Math.min(platform.width - 12, 12) - state.player.width / 2;
  state.player.y = platform.y - state.player.height - 1;
  state.player.vx = 0;
  state.player.vy = vy;
  state.player.onGround = false;
  state.player.supportPlatformId = null;
};

const placePlayerPastPlatformEdge = (state: any, platform: any) => {
  state.player.x = platform.x + platform.width + 4;
  state.player.y = platform.y - state.player.height - 1;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.onGround = false;
  state.player.supportPlatformId = null;
};

const createStaticPlatformFixture = (id: string, x: number, y: number, width: number) => ({
  id,
  kind: 'static',
  x,
  y,
  width,
  height: 32,
  startX: x,
  startY: y,
  vx: 0,
  vy: 0,
});

const createSpringPlatformFixture = (id: string, x: number, y: number, width: number, boost = 900, cooldownMs = 350) => ({
  id,
  kind: 'spring',
  x,
  y,
  width,
  height: 32,
  startX: x,
  startY: y,
  vx: 0,
  vy: 0,
  spring: {
    boost,
    cooldownMs,
    timerMs: 0,
  },
});

const withStageFixture = <T>(stageIndex: number, mutate: (stage: any) => void, run: () => T): T => {
  const originalStage = stageDefinitions[stageIndex];
  const fixtureStage = JSON.parse(JSON.stringify(originalStage));
  mutate(fixtureStage);
  (stageDefinitions as any)[stageIndex] = fixtureStage;

  try {
    return run();
  } finally {
    (stageDefinitions as any)[stageIndex] = originalStage;
  }
};

const getGravityCapsuleFixture = (state: any) => {
  const capsule = state.stageRuntime.gravityCapsules.find((entry: any) => entry.id === 'sky-anti-grav-capsule');
  const antiGravField = state.stageRuntime.gravityFields.find((entry: any) => entry.id === 'sky-anti-grav-stream');

  if (!capsule || !antiGravField) {
    throw new Error('Expected sky gravity capsule fixture.');
  }

  return { capsule, antiGravField };
};

const getNamedGravityCapsuleFixture = (state: any, capsuleId: string, fieldId: string) => {
  const capsule = state.stageRuntime.gravityCapsules.find((entry: any) => entry.id === capsuleId);
  const field = state.stageRuntime.gravityFields.find((entry: any) => entry.id === fieldId);

  if (!capsule || !field) {
    throw new Error(`Expected gravity capsule fixture ${capsuleId}/${fieldId}.`);
  }

  return { capsule, field };
};

const placePlayerInsideField = (state: any, field: any, vy = 0) => {
  state.player.x = field.x + Math.min(field.width - state.player.width, 40);
  state.player.y = field.y + Math.min(field.height - state.player.height, 56);
  state.player.vx = 0;
  state.player.vy = vy;
  state.player.onGround = false;
  state.player.supportPlatformId = null;
};

const placePlayerInsideCapsuleNearLeftWall = (state: any, capsule: any, vy = 0) => {
  state.player.x = capsule.shell.x + 6;
  state.player.y = capsule.shell.y + 40;
  state.player.vx = 0;
  state.player.vy = vy;
  state.player.onGround = false;
  state.player.supportPlatformId = null;
};

const getGravityCapsuleButtonSupportPlatform = (state: any, capsule: any) => {
  const supportPlatform = state.stageRuntime.platforms.find((platform: any) => {
    const overlap = Math.max(
      0,
      Math.min(capsule.button.x + capsule.button.width, platform.x + platform.width) - Math.max(capsule.button.x, platform.x),
    );
    return overlap >= Math.min(capsule.button.width * 0.55, platform.width) && Math.abs(capsule.button.y + capsule.button.height - platform.y) <= 24;
  });

  if (!supportPlatform) {
    throw new Error('Expected grounded support beneath the sky gravity-room button.');
  }

  return supportPlatform;
};

const touchGravityCapsuleButton = (state: any, capsule: any) => {
  const supportPlatform = getGravityCapsuleButtonSupportPlatform(state, capsule);

  state.player.x = capsule.button.x + capsule.button.width / 2 - state.player.width / 2;
  state.player.y = supportPlatform.y - state.player.height;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.onGround = true;
  state.player.supportPlatformId = supportPlatform.id;
};

const getTimedRevealFixture = (state: any) => {
  const revealVolume = state.stageRuntime.revealVolumes.find((volume: any) => volume.id === 'sky-timed-route-trigger');
  const scanner = state.stageRuntime.scannerVolumes.find((volume: any) => volume.id === 'sky-halo-scanner');
  const bridge = state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === 'sky-temporary-bridge-1');
  const bridgePlatform = state.stageRuntime.platforms.find((platform: any) => platform.id === 'sky-temporary-bridge-1');

  if (!revealVolume || !scanner || !bridge || !bridgePlatform) {
    throw new Error('Expected timed-reveal route fixture in sky-sanctum.');
  }

  return { revealVolume, scanner, bridge, bridgePlatform };
};

const getMagneticFixture = (state: any) => {
  const activationNode = state.stageRuntime.activationNodes.find((node: any) => node.id === 'forest-magnetic-node-1');
  const platform = state.stageRuntime.platforms.find((entry: any) => entry.id === 'forest-magnetic-platform-1');
  const fallbackPlatform = state.stageRuntime.platforms.find((entry: any) => entry.id === 'platform-9920-540');

  if (!activationNode || !platform?.magnetic || !fallbackPlatform) {
    throw new Error('Expected forest magnetic fixture.');
  }

  return { activationNode, platform, fallbackPlatform };
};

const createRuntimeMovingPlatform = (
  id: string,
  x: number,
  y: number,
  range: number,
  speed: number,
): any => ({
  id,
  kind: 'moving',
  x,
  y,
  width: 28,
  height: 20,
  startX: x,
  startY: y,
  vx: 0,
  vy: 0,
  move: { axis: 'y', range, speed, direction: -1 },
});

const createRuntimeHorizontalMovingPlatform = (
  id: string,
  x: number,
  y: number,
  width: number,
  range: number,
  speed: number,
  direction = 1,
): any => ({
  id,
  kind: 'moving',
  x,
  y,
  width,
  height: 20,
  startX: x,
  startY: y,
  vx: 0,
  vy: 0,
  move: { axis: 'x', range, speed, direction },
});

const createRuntimeFallingPlatformFixture = (
  id: string,
  x: number,
  y: number,
  width: number,
  triggerDelayMs = 320,
  stayArmThresholdMs = 120,
  hopGapThresholdMs = 50,
): any => ({
  id,
  kind: 'falling',
  x,
  y,
  width,
  height: 32,
  startX: x,
  startY: y,
  vx: 0,
  vy: 0,
  fall: {
    triggerDelayMs,
    stayArmThresholdMs,
    hopGapThresholdMs,
    timerMs: triggerDelayMs,
    triggered: false,
    falling: false,
    accumulatedSupportMs: 0,
    unsupportedGapMs: 0,
  },
});

const createRuntimeHorizontalMovingFallingPlatform = (
  id: string,
  x: number,
  y: number,
  width: number,
  range: number,
  speed: number,
  direction = 1,
): any => ({
  ...createRuntimeFallingPlatformFixture(id, x, y, width),
  height: 20,
  move: { axis: 'x', range, speed, direction },
});

const isolatePlayerPlatformFixture = (state: any, platforms: any[]) => {
  state.stageRuntime.platforms = platforms;
  state.stageRuntime.hazards = [];
  state.stageRuntime.enemies = [];
  state.stageRuntime.rewardBlocks = [];
  state.stageRuntime.gravityCapsules = [];
  state.stageRuntime.gravityFields = [];
  state.stageRuntime.activationNodes = [];
  state.stageRuntime.scannerVolumes = [];
  state.stageRuntime.revealVolumes = [];
  state.stageRuntime.temporaryBridges = [];
};

const placePlayerOnSupportedPlatform = (state: any, platform: any) => {
  state.player.x = platform.x + 8;
  state.player.y = platform.y - state.player.height;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.onGround = true;
  state.player.supportPlatformId = platform.id;
};

const placePlayerOffPlatformSupport = (state: any, platform: any) => {
  state.player.x = platform.x + platform.width + 8;
  state.player.y = platform.y - state.player.height - 1;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.onGround = false;
  state.player.supportPlatformId = null;
};

describe('GameSession regression coverage', () => {
  it('rebuilds fresh starts and auto-advance from stage spawn while checkpoint respawn stays on the checkpoint path', () => {
    const session = new GameSession();
    const initial = getMutableState(session);
    initial.progress.unlockedStageIndex = Math.max(initial.progress.unlockedStageIndex, initial.stageIndex + 1);
    const firstCheckpoint = initial.stageRuntime.checkpoints[0];

    initial.player.x = firstCheckpoint.rect.x;
    initial.player.y = firstCheckpoint.rect.y;
    session.update(16, defaultInputState());

    expect(initial.activeCheckpointId).toBe(firstCheckpoint.id);

    const startedFromMenu = session.getState();
    session.startStage(initial.stageIndex);
    const freshStart = session.getState();
    expect(freshStart).not.toBe(startedFromMenu);
    expect(freshStart.stageIndex).toBe(initial.stageIndex);
    expect(freshStart.activeCheckpointId).toBeNull();
    expect(freshStart.player.x).toBe(freshStart.stage.playerSpawn.x);
    expect(freshStart.player.y).toBe(freshStart.stage.playerSpawn.y);

    const replaySource = session.getState();
    session.restartStage();
    const replayStart = session.getState();
    expect(replayStart).not.toBe(replaySource);
    expect(replayStart.stageIndex).toBe(initial.stageIndex);
    expect(replayStart.activeCheckpointId).toBeNull();
    expect(replayStart.player.x).toBe(replayStart.stage.playerSpawn.x);
    expect(replayStart.player.y).toBe(replayStart.stage.playerSpawn.y);

    const autoAdvanceSource = session.getState();
    session.advanceToNextStage();
    const autoAdvance = session.getState();
    expect(autoAdvance).not.toBe(autoAdvanceSource);
    expect(autoAdvance.stageIndex).toBe(initial.stageIndex + 1);
    expect(autoAdvance.activeCheckpointId).toBeNull();
    expect(autoAdvance.player.x).toBe(autoAdvance.stage.playerSpawn.x);
    expect(autoAdvance.player.y).toBe(autoAdvance.stage.playerSpawn.y);

    const respawnSession = new GameSession();
    const respawnState = getMutableState(respawnSession);
    const respawnCheckpoint = respawnState.stageRuntime.checkpoints[0];
    respawnState.player.x = respawnCheckpoint.rect.x;
    respawnState.player.y = respawnCheckpoint.rect.y;
    respawnSession.update(16, defaultInputState());
    const checkpointRun = respawnSession.getState();

    respawnState.player.health = 1;
    (respawnSession as any).damagePlayer();
    (respawnSession as any).respawnPlayer();
    const afterRespawn = respawnSession.getState();

    expect(afterRespawn).not.toBe(checkpointRun);
    expect(afterRespawn.stageIndex).toBe(checkpointRun.stageIndex);
    expect(afterRespawn.activeCheckpointId).toBe(respawnCheckpoint.id);
    expect(afterRespawn.player.dead).toBe(false);
    expect(afterRespawn.player.x).toBe(respawnCheckpoint.respawn.x);
    expect(afterRespawn.player.y).toBe(respawnCheckpoint.respawn.y);
  });

  it('powers the authored magnetic platform on activation-node contact and resets it on restart', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const { activationNode, platform } = getMagneticFixture(state);

    expect(activationNode.activated).toBe(false);
    expect(platform.magnetic.powered).toBe(false);

    state.player.x = activationNode.x + 2;
    state.player.y = activationNode.y + 2;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = false;
    state.player.supportPlatformId = null;

    session.update(16, defaultInputState());

    expect(state.stageRuntime.activationNodes.find((node: any) => node.id === activationNode.id).activated).toBe(true);
    expect(state.stageRuntime.platforms.find((entry: any) => entry.id === platform.id).magnetic.powered).toBe(true);

    session.restartStage();

    const restarted = getMutableState(session);
    const restartedFixture = getMagneticFixture(restarted);
    expect(restartedFixture.activationNode.activated).toBe(false);
    expect(restartedFixture.platform.magnetic.powered).toBe(false);
  });

  it('keeps magnetic platforms top-surface-only after activation and resets them on checkpoint respawn', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const checkpoint = state.stageRuntime.checkpoints[0];
    const { activationNode, platform } = getMagneticFixture(state);

    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    session.update(16, defaultInputState());

    state.player.x = activationNode.x + 2;
    state.player.y = activationNode.y + 2;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    session.update(16, defaultInputState());

    state.player.x = platform.x + 36;
    state.player.y = platform.y - state.player.height - 2;
    state.player.vx = 0;
    state.player.vy = 320;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    advanceSession(session, 32, 16);

    expect(state.player.onGround).toBe(true);
    expect(state.player.supportPlatformId).toBe(platform.id);
    expect(state.player.y).toBe(platform.y - state.player.height);

    state.player.x = platform.x - state.player.width - 2;
    state.player.y = platform.y - state.player.height + 8;
    state.player.vx = 180;
    state.player.vy = 0;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    session.update(16, defaultInputState());

    expect(state.player.x).toBeGreaterThan(platform.x - state.player.width);

    state.player.x = platform.x + 28;
    state.player.y = platform.y + platform.height + 2;
    state.player.vx = 0;
    state.player.vy = -220;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    session.update(16, defaultInputState());

    expect(state.player.y).toBeLessThan(platform.y + platform.height + 2);
    expect(state.player.supportPlatformId).toBeNull();

    state.player.health = 1;
    (session as any).damagePlayer();
    (session as any).respawnPlayer();

    const respawned = getMutableState(session);
    const respawnedFixture = getMagneticFixture(respawned);
    expect(respawned.activeCheckpointId).toBe(checkpoint.id);
    expect(respawnedFixture.activationNode.activated).toBe(false);
    expect(respawnedFixture.platform.magnetic.powered).toBe(false);
    expect(respawned.player.y).toBeLessThanOrEqual(respawnedFixture.fallbackPlatform.y - respawned.player.height);
  });

  it('fires resinBurst turrets with a long amber telegraph followed by a short two-shot burst', () => {
    const session = new GameSession();
    session.forceStartStage(1);

    const state = getMutableState(session);
    const turret = state.stageRuntime.enemies.find((enemy: any) => enemy.id === 'turret-2');
    if (!turret?.turret) {
      throw new Error('Expected Ember Rift resinBurst turret fixture.');
    }

    state.stageRuntime.enemies = [turret];
    state.stageRuntime.hazards = [];

    const telegraphStartMs = turret.turret.intervalMs - turret.turret.telegraphDurationMs;
    advanceSession(session, telegraphStartMs);

    expect(turret.turret.telegraphMs).toBe(TURRET_VARIANT_CONFIG.resinBurst.telegraphMs);
    expect(state.stageRuntime.projectiles).toHaveLength(0);

    advanceSession(session, TURRET_VARIANT_CONFIG.resinBurst.telegraphMs - 1);
    expect(state.stageRuntime.projectiles).toHaveLength(0);

    advanceSession(session, 1, 1);
    expect(state.stageRuntime.projectiles).toHaveLength(1);
    expect(state.stageRuntime.projectiles[0].vx).toBe(-TURRET_VARIANT_CONFIG.resinBurst.projectileSpeed);
    expect(state.stageRuntime.projectiles[0].variant).toBe('resinBurst');
    expect(turret.direction).toBe(-1);

    advanceSession(session, TURRET_VARIANT_CONFIG.resinBurst.burstGapMs - 1);
    expect(state.stageRuntime.projectiles).toHaveLength(1);

    advanceSession(session, 1, 1);
    expect(state.stageRuntime.projectiles).toHaveLength(2);
    expect(state.stageRuntime.projectiles[1].vx).toBe(-TURRET_VARIANT_CONFIG.resinBurst.projectileSpeed);
    expect(turret.direction).toBe(1);
    expect(turret.turret.telegraphMs).toBe(0);
    expect(turret.turret.timerMs).toBe(turret.turret.intervalMs - turret.turret.telegraphDurationMs);
  });

  it('fires ionPulse turrets with a long cyan telegraph into one faster pulse shot', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    const state = getMutableState(session);
    const turret = state.stageRuntime.enemies.find((enemy: any) => enemy.id === 'turret-1');
    if (!turret?.turret) {
      throw new Error('Expected Halo Spire ionPulse turret fixture.');
    }

    state.stageRuntime.enemies = [turret];
    state.stageRuntime.hazards = [];

    const telegraphStartMs = turret.turret.intervalMs - turret.turret.telegraphDurationMs;
    advanceSession(session, telegraphStartMs);

    expect(turret.turret.telegraphMs).toBe(TURRET_VARIANT_CONFIG.ionPulse.telegraphMs);
    advanceSession(session, TURRET_VARIANT_CONFIG.ionPulse.telegraphMs);

    expect(state.stageRuntime.projectiles).toHaveLength(1);
    expect(state.stageRuntime.projectiles[0].vx).toBe(-TURRET_VARIANT_CONFIG.ionPulse.projectileSpeed);
    expect(state.stageRuntime.projectiles[0].variant).toBe('ionPulse');
    expect(turret.direction).toBe(1);
    expect(turret.turret.burstGapMs).toBe(0);
    expect(turret.turret.timerMs).toBe(turret.turret.intervalMs - turret.turret.telegraphDurationMs);

    session.restartStage();
    const restartedTurret = getMutableState(session).stageRuntime.enemies.find((enemy: any) => enemy.id === 'turret-1');
    expect(restartedTurret.turret.timerMs).toBe(restartedTurret.turret.intervalMs - restartedTurret.turret.telegraphDurationMs);
  });

  it('consumes non-invincible active powers without reducing health on a damaging hit', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const initialMessage = state.stageMessage;

    state.player.health = 3;
    state.progress.activePowers.doubleJump = true;
    state.progress.activePowers.dash = true;

    (session as any).damagePlayer();

    expect(state.player.health).toBe(3);
    expect(state.player.invulnerableMs).toBeGreaterThan(0);
    expect(Object.values(state.progress.activePowers).every((active) => active === false)).toBe(true);
    expect(state.stageMessage).toBe(initialMessage);
  });

  it('preserves invincibility on a damaging hit while its timer is active', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const initialMessage = state.stageMessage;

    state.player.health = 3;
    state.progress.activePowers.invincible = true;
    state.progress.powerTimers.invincibleMs = 5000;

    (session as any).damagePlayer();

    expect(state.player.health).toBe(3);
    expect(state.player.invulnerableMs).toBeGreaterThan(0);
    expect(state.progress.activePowers.invincible).toBe(true);
    expect(state.progress.powerTimers.invincibleMs).toBe(5000);
    expect(state.stageMessage).toBe(initialMessage);
  });

  it('preserves invincibility while clearing other powers on a mixed-power damaging hit', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const initialMessage = state.stageMessage;

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
    expect(state.stageMessage).toBe(initialMessage);
  });

  it('preserves unpowered damage and death behavior', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const initialMessage = state.stageMessage;

    state.player.health = 2;

    (session as any).damagePlayer();
    expect(session.consumeCues()).toEqual([AUDIO_CUES.hurt]);
    expect(state.player.health).toBe(1);
    expect(state.player.dead).toBe(false);
    expect(state.stageMessage).toBe(initialMessage);

    state.player.invulnerableMs = 0;
    (session as any).damagePlayer();

    expect(session.consumeCues()).toEqual([AUDIO_CUES.death]);
    expect(state.player.dead).toBe(true);
    expect(state.respawnTimerMs).toBe(900);
    expect(state.stageMessage).toBe(initialMessage);

    session.update(120, defaultInputState());

    expect(state.player.dead).toBe(true);
    expect(state.respawnTimerMs).toBe(780);
  });

  it('respawns from the active checkpoint after defeat while keeping death semantics and clearing powers', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const checkpoint = state.stageRuntime.checkpoints[0];

    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    session.update(16, defaultInputState());

    state.progress.activePowers.doubleJump = true;
    state.progress.activePowers.dash = true;
    state.player.health = 1;
    state.player.invulnerableMs = 0;
    const checkpointMessage = state.stageMessage;

    (session as any).damagePlayer();

    expect(state.player.dead).toBe(false);
    expect(state.stageMessage).toBe(checkpointMessage);
    expect(state.progress.activePowers.doubleJump).toBe(false);
    expect(state.progress.activePowers.dash).toBe(false);

    state.player.health = 1;
    state.player.invulnerableMs = 0;

    (session as any).damagePlayer();

    expect(state.player.dead).toBe(true);
    expect(state.stageMessage).toBe(checkpointMessage);

    advanceSession(session, state.respawnTimerMs);

    const respawned = getMutableState(session);
    expect(respawned.activeCheckpointId).toBe(checkpoint.id);
    expect(respawned.player.dead).toBe(false);
    expect(respawned.player.health).toBe(3);
    expect(respawned.player.x).toBe(checkpoint.respawn.x);
    expect(respawned.player.y).toBe(checkpoint.respawn.y);
  });

  it('respawns from the checkpoint grounded support instead of applying a respawn-only Y bandaid', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const checkpoint = state.stageRuntime.checkpoints[0];

    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    session.update(16, defaultInputState());

    expect(state.activeCheckpointId).toBe(checkpoint.id);

    state.player.health = 1;
    (session as any).damagePlayer();
    (session as any).respawnPlayer();

    const respawned = getMutableState(session);
    const support = respawned.stageRuntime.platforms.find((platform: any) => platform.id === checkpoint.supportPlatformId);
    expect(support).toBeDefined();
    expect(respawned.player.x).toBe(checkpoint.respawn.x);
    expect(respawned.player.y).toBe(support.y - respawned.player.height);
  });

  it('keeps late-stage checkpoint respawn grounded on its authored support', () => {
    const session = new GameSession();
    session.forceStartStage(1);

    const state = getMutableState(session);
    const checkpoint = state.stageRuntime.checkpoints[state.stageRuntime.checkpoints.length - 1];

    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    session.update(16, defaultInputState());

    state.player.health = 1;
    (session as any).damagePlayer();
    (session as any).respawnPlayer();

    const respawned = getMutableState(session);
    const support = respawned.stageRuntime.platforms.find((platform: any) => platform.id === checkpoint.supportPlatformId);
    expect(respawned.activeCheckpointId).toBe(checkpoint.id);
    expect(support).toBeDefined();
    expect(respawned.player.y).toBe(support.y - respawned.player.height);
    expect(respawned.player.x).toBeGreaterThanOrEqual(support.x);
    expect(respawned.player.x + respawned.player.width).toBeLessThanOrEqual(support.x + support.width);
  });

  it('rejects checkpoint and hazard fixtures that depend on runtime normalization', () => {
    withStageFixture(
      0,
      (stage) => {
        const checkpoint = stage.checkpoints.find((entry: any) => entry.id === 'cp-1');
        const hazard = stage.hazards.find((entry: any) => entry.id === 'spikes-1');
        if (!checkpoint || !hazard) {
          throw new Error('Expected forest checkpoint and hazard fixtures.');
        }

        checkpoint.rect.y += 4;
        hazard.rect.y -= 4;
      },
      () => {
        expect(() => new GameSession()).toThrow('Checkpoint is missing grounded visible support at runtime: cp-1');
      },
    );
  });

  it('rejects hazard fixtures that depend on runtime normalization even when checkpoints stay valid', () => {
    withStageFixture(
      0,
      (stage) => {
        const hazard = stage.hazards.find((entry: any) => entry.id === 'spikes-1');
        if (!hazard) {
          throw new Error('Expected forest hazard fixture.');
        }

        hazard.rect.y -= 4;
      },
      () => {
        expect(() => new GameSession()).toThrow('Hazard is missing grounded visible support at runtime: spikes-1');
      },
    );
  });

  it('rejects grounded enemies that depend on runtime snap-to-support while keeping flyers exempt', () => {
    withStageFixture(
      0,
      (stage) => {
        const walker = stage.enemies.find((entry: any) => entry.id === 'walker-1');
        const flyer = stage.enemies.find((entry: any) => entry.id === 'flyer-1');
        if (!walker || !flyer) {
          throw new Error('Expected forest walker and flyer fixtures.');
        }

        walker.position.y += 6;
        flyer.position.y += 24;
      },
      () => {
        expect(() => new GameSession()).toThrow('Grounded enemy is missing authored flush support at runtime: walker-1');
      },
    );
  });

  it('canonicalizes minor grounded enemy authored drift to resolved support before spawn', () => {
    withStageFixture(
      0,
      (stage) => {
        const walker = stage.enemies.find((entry: any) => entry.id === 'walker-1');
        if (!walker) {
          throw new Error('Expected forest walker fixture.');
        }

        walker.position.y += 2;
      },
      () => {
        const session = new GameSession();
        const state = getMutableState(session);
        const walker = state.stageRuntime.enemies.find((entry: any) => entry.id === 'walker-1');
        if (!walker) {
          throw new Error('Expected runtime walker fixture.');
        }

        expect(walker.supportPlatformId).toBeTruthy();
        expect(walker.supportY).not.toBeNull();
        expect(walker.y).toBe(walker.supportY);
      },
    );
  });

  it('rejects turrets that only fit after moving to alternate support', () => {
    withStageFixture(
      0,
      (stage) => {
        stage.platforms.push({
          id: 'turret-fallback-support',
          kind: 'static',
          x: 5580,
          y: 470,
          width: 180,
          height: 32,
        });
        stage.hazards.push({
          id: 'turret-authored-support-spikes',
          kind: 'spikes',
          rect: { x: 5300, y: 454, width: 180, height: 16 },
        });
      },
      () => {
        expect(() => new GameSession()).toThrow('Turret cannot resolve on authored support without fallback: turret-1');
      },
    );
  });

  it('resolves thruster-impact defeats immediately without delaying enemy removal', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const enemy = state.stageRuntime.enemies.find((entry: any) => entry.kind === 'hopper');
    if (!enemy) {
      throw new Error('Expected a hopper fixture.');
    }

    state.stageRuntime.enemies = [enemy];
    state.stageRuntime.hazards = [];
    state.player.x = enemy.x;
    state.player.y = enemy.y - state.player.height - 2;
    state.player.vx = 0;
    state.player.vy = 320;
    state.player.onGround = false;
    state.player.supportPlatformId = null;

    session.update(16, { ...defaultInputState(), thrusterPressed: true });

    expect(enemy.alive).toBe(false);
    expect(enemy.defeatCause).toBe('thruster-impact');
    expect(state.player.dead).toBe(false);
    expect(state.stageMessage).toBe('Restore survey beacon');
    const cues = session.consumeCues();
    expect(cues).toContain(AUDIO_CUES.thrusterPulse);
    expect(cues).toContain(AUDIO_CUES.thrusterImpact);
    expect(cues).not.toContain(AUDIO_CUES.shootHit);
    expect(cues).not.toContain(AUDIO_CUES.death);
  });

  it('does not defeat enemies from above without an active thruster pulse', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const enemy = state.stageRuntime.enemies.find((entry: any) => entry.kind === 'hopper');
    if (!enemy) {
      throw new Error('Expected a hopper fixture.');
    }

    state.stageRuntime.enemies = [enemy];
    state.stageRuntime.hazards = [];
    state.player.x = enemy.x;
    state.player.y = enemy.y - state.player.height - 2;
    state.player.vx = 0;
    state.player.vy = 320;
    state.player.onGround = false;
    state.player.supportPlatformId = null;

    session.update(16, defaultInputState());

    expect(enemy.alive).toBe(true);
    expect(state.player.health).toBeLessThan(state.player.maxHealth);
  });

  it('enforces airborne thruster fuel and cooldown, then refreshes fuel on grounded recovery', () => {
    const session = new GameSession();
    const state = getMutableState(session);

    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    state.player.y = 100;
    state.player.vy = 0;

    session.update(16, { ...defaultInputState(), thrusterPressed: true });
    expect(state.player.thrusterPulseFuel).toBe(1);

    session.update(16, { ...defaultInputState(), thrusterPressed: true });
    expect(state.player.thrusterPulseFuel).toBe(1);

    session.update(280, defaultInputState());
    session.update(16, { ...defaultInputState(), thrusterPressed: true });
    expect(state.player.thrusterPulseFuel).toBe(0);

    session.update(280, defaultInputState());
    session.update(16, { ...defaultInputState(), thrusterPressed: true });
    expect(state.player.thrusterPulseFuel).toBe(0);

    state.player.onGround = true;
    state.player.vy = 0;
    session.update(16, defaultInputState());
    expect(state.player.thrusterPulseFuel).toBe(2);
  });

  it('marks player projectile defeats as plasma blaster kills without delaying enemy removal', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const enemy = state.stageRuntime.enemies.find((entry: any) => entry.kind === 'walker');
    if (!enemy) {
      throw new Error('Expected a walker fixture.');
    }

    state.stageRuntime.enemies = [enemy];
    state.stageRuntime.hazards = [];
    state.stageRuntime.projectiles = [
      {
        id: 'player-shot-fixture',
        owner: 'player',
        x: enemy.x + 4,
        y: enemy.y + 4,
        vx: 0,
        width: 12,
        height: 12,
        alive: true,
      },
    ];

    session.update(16, defaultInputState());

    expect(enemy.alive).toBe(false);
    expect(enemy.defeatCause).toBe('plasma-blast');
    expect(state.stageRuntime.projectiles).toHaveLength(0);
    expect(state.stageMessage).toBe('Restore survey beacon');
    const cues = session.consumeCues();
    expect(cues).toContain(AUDIO_CUES.shootHit);
    expect(cues).not.toContain(AUDIO_CUES.thrusterImpact);
    expect(cues).not.toContain(AUDIO_CUES.death);
  });

  it('does not emit moving-platform cue and still emits authored enemy movement cues', () => {
    const session = new GameSession();
    let state = getMutableState(session);

    const movingPlatform = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'moving');
    if (!movingPlatform?.move) {
      throw new Error('Expected a moving platform fixture.');
    }

    state.stageRuntime.platforms = [movingPlatform];
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    advanceSession(session, Math.ceil((movingPlatform.move.range / movingPlatform.move.speed) * 1000) + 32);
    const platformCues = session.consumeCues().filter((cue) => cue === AUDIO_CUES.movingPlatform);
    expect(platformCues).toHaveLength(0);

    session.restartStage();
    state = getMutableState(session);
    const walker = state.stageRuntime.enemies.find((enemy: any) => enemy.kind === 'walker');
    if (!walker?.patrol) {
      throw new Error('Expected a walker fixture.');
    }

    state.stageRuntime.enemies = [walker];
    state.stageRuntime.hazards = [];
    advanceSession(session, 1700);
    expect(session.consumeCues()).toContain(AUDIO_CUES.enemyPatrol);

    session.restartStage();
    state = getMutableState(session);
    const hopper = state.stageRuntime.enemies.find((enemy: any) => enemy.kind === 'hopper');
    if (!hopper?.hop) {
      throw new Error('Expected a hopper fixture.');
    }

    state.stageRuntime.enemies = [hopper];
    state.stageRuntime.hazards = [];
    advanceSession(session, hopper.hop.intervalMs + 32);
    expect(session.consumeCues()).toContain(AUDIO_CUES.enemyHop);

    session.forceStartStage(1);
    state = getMutableState(session);
    const charger = state.stageRuntime.enemies.find((enemy: any) => enemy.kind === 'charger');
    if (!charger?.charger) {
      throw new Error('Expected a charger fixture.');
    }

    state.stageRuntime.enemies = [charger];
    state.stageRuntime.hazards = [];
    state.player.x = charger.x + 10;
    state.player.y = charger.y;
    state.player.vx = 0;
    state.player.vy = 0;

    session.update(16, defaultInputState());
    expect(session.consumeCues()).toContain(AUDIO_CUES.danger);

    advanceSession(session, charger.charger.windupMs + 16);
    expect(session.consumeCues()).toContain(AUDIO_CUES.enemyCharge);

    session.update(16, defaultInputState());
    expect(session.consumeCues()).not.toContain(AUDIO_CUES.enemyCharge);
  });

  it('emits reward reveal and stage clear cues for authored progression beats', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const coinBlock = getCoinRewardBlock(state);

    (session as any).activateRewardBlock(coinBlock);

    const rewardCues = session.consumeCues();
    expect(rewardCues).toContain(AUDIO_CUES.block);
    expect(rewardCues).toContain(AUDIO_CUES.rewardReveal);
    expect(rewardCues).toContain(AUDIO_CUES.collect);

    state.stageRuntime.platforms = [];
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    state.stageRuntime.objective = null;
    state.stageRuntime.exitReached = false;
    state.player.x = state.stage.exit.x + 4;
    state.player.y = state.stage.exit.y;
    state.player.vx = 0;
    state.player.vy = 0;

    (session as any).handleExit();

    expect(state.levelCompleted).toBe(false);
    expect(state.exitFinish.active).toBe(true);
    expect(session.consumeCues()).toContain(AUDIO_CUES.capsuleTeleport);

    advanceSession(session, state.exitFinish.durationMs);

    expect(state.levelCompleted).toBe(true);
    expect(session.consumeCues()).toContain(AUDIO_CUES.stageClear);
  });

  it('gates enemy cues by strict viewport visibility', () => {
    const session = new GameSession();
    let state = getMutableState(session);
    const walker = state.stageRuntime.enemies.find((enemy: any) => enemy.kind === 'walker');
    const turret = state.stageRuntime.enemies.find((enemy: any) => enemy.kind === 'turret');
    if (!walker?.patrol || !turret?.turret) {
      throw new Error('Expected walker and turret fixtures for viewport cue checks.');
    }

    state.stageRuntime.enemies = [walker];
    state.stageRuntime.hazards = [];
    session.setCameraViewBox({ x: walker.x + 420, y: Math.max(0, walker.y - 120), width: 320, height: 240 });
    advanceSession(session, 1700);
    expect(session.consumeCues()).not.toContain(AUDIO_CUES.enemyPatrol);

    session.restartStage();
    state = getMutableState(session);
    const visibleWalker = state.stageRuntime.enemies.find((enemy: any) => enemy.kind === 'walker');
    if (!visibleWalker?.patrol) {
      throw new Error('Expected walker fixture after restart.');
    }
    state.stageRuntime.enemies = [visibleWalker];
    state.stageRuntime.hazards = [];
    session.setCameraViewBox({ x: visibleWalker.x - 96, y: Math.max(0, visibleWalker.y - 120), width: 320, height: 240 });
    advanceSession(session, 1700);
    expect(session.consumeCues()).toContain(AUDIO_CUES.enemyPatrol);

    session.forceStartStage(1);
    state = getMutableState(session);
    const charger = state.stageRuntime.enemies.find((enemy: any) => enemy.kind === 'charger');
    if (!charger?.charger) {
      throw new Error('Expected charger fixture for viewport cue checks.');
    }
    state.stageRuntime.enemies = [charger];
    state.stageRuntime.hazards = [];
    state.player.x = charger.x + 12;
    state.player.y = charger.y;
    state.player.vx = 0;
    state.player.vy = 0;
    session.setCameraViewBox({ x: charger.x + 420, y: Math.max(0, charger.y - 120), width: 320, height: 240 });
    session.update(16, defaultInputState());
    expect(session.consumeCues()).not.toContain(AUDIO_CUES.danger);
    advanceSession(session, charger.charger.windupMs + 16);
    expect(session.consumeCues()).not.toContain(AUDIO_CUES.enemyCharge);

    session.forceStartStage(0);
    state = getMutableState(session);
    const leadMarginTurret = state.stageRuntime.enemies.find((enemy: any) => enemy.kind === 'turret');
    if (!leadMarginTurret?.turret) {
      throw new Error('Expected turret fixture after restart.');
    }
    state.stageRuntime.enemies = [leadMarginTurret];
    state.stageRuntime.hazards = [];
    session.setCameraViewBox({ x: leadMarginTurret.x - 1040, y: Math.max(0, leadMarginTurret.y - 160), width: 960, height: 540 });
    advanceSession(session, leadMarginTurret.turret.intervalMs + 32);
    expect(session.consumeCues()).not.toContain(AUDIO_CUES.turretFire);

    session.setCameraViewBox({
      x: leadMarginTurret.x - 120,
      y: Math.max(0, leadMarginTurret.y - 160),
      width: 960,
      height: 540,
    });
    advanceSession(session, leadMarginTurret.turret.intervalMs + 32);
    expect(session.consumeCues()).toContain(AUDIO_CUES.turretFire);
  });

  it('emits unlock feedback for activation and reveal interactions', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const { activationNode } = getMagneticFixture(state);

    state.player.x = activationNode.x + 2;
    state.player.y = activationNode.y + 2;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    session.update(16, defaultInputState());

    expect(session.consumeCues()).toContain(AUDIO_CUES.unlock);

    session.forceStartStage(2);
    const revealState = getMutableState(session);
    const { revealVolume } = getTimedRevealFixture(revealState);

    revealState.player.x = revealVolume.x + 8;
    revealState.player.y = revealVolume.y + 8;
    revealState.player.vx = 0;
    revealState.player.vy = 0;
    revealState.player.onGround = false;
    revealState.player.supportPlatformId = null;
    session.update(16, defaultInputState());

    expect(session.consumeCues()).toContain(AUDIO_CUES.unlock);
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
    expect(state.stageMessage).toBe('Survey beacon activated');
  });

  it('does not shift unrelated stage 0 platforms when first checkpoint activates', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    const checkpoint = state.stageRuntime.checkpoints.find((entry: any) => entry.id === 'cp-1');

    expect(checkpoint).toBeTruthy();
    expect(state.stageRuntime.platforms.find((entry: any) => entry.id === 'platform-1290-540')?.y).toBe(540);
    expect(state.stageRuntime.platforms.find((entry: any) => entry.id === 'platform-1920-540')?.y).toBe(540);

    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.activeCheckpointId).toBe('cp-1');
    expect(state.stageRuntime.platforms.find((entry: any) => entry.id === 'platform-1290-540')?.y).toBe(540);
    expect(state.stageRuntime.platforms.find((entry: any) => entry.id === 'platform-1920-540')?.y).toBe(540);
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

  it('starts objective-authored stages with a transient objective briefing', () => {
    const session = new GameSession();
    const state = getMutableState(session);

    expect(state.stageRuntime.objective).toEqual({
      kind: 'restoreBeacon',
      target: { kind: 'checkpoint', id: 'cp-6' },
      completed: false,
    });
    expect(state.stageMessage).toBe('Restore survey beacon');
  });

  it('completes checkpoint-authored objectives when the authored beacon checkpoint activates', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const objectiveCheckpoint = state.stageRuntime.checkpoints.find((checkpoint: any) => checkpoint.id === 'cp-6');

    state.player.x = objectiveCheckpoint.rect.x;
    state.player.y = objectiveCheckpoint.rect.y;
    session.update(16, defaultInputState());

    expect(state.stageRuntime.objective.completed).toBe(true);
    expect(state.stageMessage).toBe('Survey beacon restored');
  });

  it('blocks exit completion on objective-authored stages until the authored relay is reactivated', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    const state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];

    state.player.x = state.stage.exit.x + 4;
    state.player.y = state.stage.exit.y;
    state.player.vx = 0;
    state.player.vy = 0;
    session.update(16, defaultInputState());

    expect(state.levelCompleted).toBe(false);
    expect(state.stageRuntime.exitReached).toBe(false);
    expect(state.stageMessage).toBe('Reactivate the relay before exit');

    const scanner = state.stageRuntime.scannerVolumes.find((volume: any) => volume.id === 'sky-halo-scanner');
    state.player.x = scanner.x + 16;
    state.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    expect(state.stageRuntime.objective.completed).toBe(true);
    expect(state.stageMessage).toBe('Relay reactivated');

    state.player.x = state.stage.exit.x + 4;
    state.player.y = state.stage.exit.y;
    session.update(16, defaultInputState());

    expect(state.levelCompleted).toBe(false);
    expect(state.stageRuntime.exitReached).toBe(true);
    expect(state.exitFinish.active).toBe(true);

    advanceSession(session, state.exitFinish.durationMs);

    expect(state.levelCompleted).toBe(true);
  });

  it('ignores repeated exit overlap while the capsule finish is already running', () => {
    const session = new GameSession();
    const state = getMutableState(session);

    state.stageRuntime.platforms = [];
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    state.stageRuntime.objective = null;
    state.player.x = state.stage.exit.x + 4;
    state.player.y = state.stage.exit.y;

    session.update(16, defaultInputState());
    const initialCues = session.consumeCues();

    expect(state.exitFinish.active).toBe(true);
    expect(initialCues.filter((cue: string) => cue === AUDIO_CUES.capsuleTeleport)).toHaveLength(1);

    session.update(16, defaultInputState());

    expect(session.consumeCues()).toEqual([]);
    expect(state.exitFinish.active).toBe(true);
  });

  it('hands off to level completion only after the capsule finish window elapses', () => {
    const session = new GameSession();
    const state = getMutableState(session);

    state.stageRuntime.platforms = [];
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    state.stageRuntime.objective = null;
    state.player.x = state.stage.exit.x + 4;
    state.player.y = state.stage.exit.y;
    state.player.vx = 140;
    state.player.vy = -48;

    session.update(16, defaultInputState());
    session.consumeCues();

    expect(state.levelCompleted).toBe(false);
    expect(state.exitFinish.active).toBe(true);
    expect(state.player.vx).toBe(0);
    expect(state.player.vy).toBe(0);

    const hideAdvanceMs = Math.ceil(state.exitFinish.durationMs * 0.35);
    advanceSession(session, hideAdvanceMs);

    expect(state.exitFinish.suppressPresentation).toBe(true);
    expect(state.player.suppressPresentation).toBe(true);

    advanceSession(session, state.exitFinish.durationMs - 16 - hideAdvanceMs);

    expect(state.levelCompleted).toBe(false);
    expect(state.exitFinish.active).toBe(true);
    expect(session.consumeCues()).toEqual([]);

    session.update(16, defaultInputState());

    expect(state.exitFinish.active).toBe(false);
    expect(state.levelCompleted).toBe(true);
    expect(state.levelJustCompleted).toBe(true);
    expect(state.exitFinish.suppressPresentation).toBe(true);
    expect(state.player.suppressPresentation).toBe(true);
    expect(session.consumeCues()).toContain(AUDIO_CUES.stageClear);
  });

  it('persists completed stage objectives through same-attempt checkpoint respawns', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];

    const checkpoint = state.stageRuntime.checkpoints.find((entry: any) => entry.id === 'cp-5');
    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    const scanner = state.stageRuntime.scannerVolumes.find((volume: any) => volume.id === 'sky-halo-scanner');
    state.player.x = scanner.x + 16;
    state.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.objective.completed).toBe(true);

    state.player.health = 1;
    (session as any).damagePlayer();
    (session as any).respawnPlayer();

    const respawned = getMutableState(session);
    expect(respawned.activeCheckpointId).toBe('cp-5');
    expect(respawned.stageRuntime.objective.completed).toBe(true);
  });

  it('resets stage objectives on manual restart and fresh attempts', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const objectiveCheckpoint = state.stageRuntime.checkpoints.find((checkpoint: any) => checkpoint.id === 'cp-6');

    state.player.x = objectiveCheckpoint.rect.x;
    state.player.y = objectiveCheckpoint.rect.y;
    session.update(16, defaultInputState());
    expect(state.stageRuntime.objective.completed).toBe(true);

    session.restartStage();

    const restarted = getMutableState(session);
    expect(restarted.stageRuntime.objective.completed).toBe(false);
    expect(restarted.stageMessage).toBe('Restore survey beacon');
  });

  it('starts non-objective stages without a long transient route summary', () => {
    const session = new GameSession();

    session.forceStartStage(1);

    const state = getMutableState(session);
    expect(state.stageRuntime.objective).toBeNull();
    expect(state.stageMessage).toBe('');
    expect(state.stageMessageTimerMs).toBe(0);
  });

  it('updates the persistent segment id without showing a separate transient segment banner', () => {
    const session = new GameSession();

    session.forceStartStage(1);

    const state = getMutableState(session);
    expect(state.currentSegmentId).toBe('mouth');

    state.player.x = 1500;
    (session as any).updateCurrentSegment();

    expect(state.currentSegmentId).toBe('lifts');
    expect(state.stageMessage).toBe('');
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

  it('does not start a timed-reveal bridge until the linked reveal cue has made the route legible', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { revealVolume, scanner, bridge } = getTimedRevealFixture(state);

    state.player.x = scanner.x + 16;
    state.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.scannerVolumes.find((volume: any) => volume.id === scanner.id).activated).toBe(true);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).active).toBe(false);

    state.player.x = scanner.x - state.player.width - 24;
    state.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    state.player.x = revealVolume.x + 16;
    state.player.y = revealVolume.y + 16;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.revealedPlatformIds).toContain(bridge.revealId);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).active).toBe(false);
  });

  it('activates timed-reveal bridges on scanner entry only after reveal, then refreshes them only after leaving and re-entering', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { revealVolume, scanner, bridge, bridgePlatform } = getTimedRevealFixture(state);
    const fullDuration = bridgePlatform.temporaryBridge.durationMs;

    expect(bridge.active).toBe(false);

    state.player.x = revealVolume.x + 16;
    state.player.y = revealVolume.y + 16;
    session.update(16, defaultInputState());

    state.player.x = scanner.x + 16;
    state.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.scannerVolumes.find((volume: any) => volume.id === scanner.id).activated).toBe(true);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).active).toBe(true);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).remainingMs).toBe(fullDuration);

    session.update(16, defaultInputState());
    const afterStayingInside = getMutableState(session);
    expect(afterStayingInside.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).remainingMs).toBe(
      fullDuration - 16,
    );

    afterStayingInside.player.x = scanner.x - afterStayingInside.player.width - 24;
    afterStayingInside.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    let afterLeaving = getMutableState(session);
    const remainingAfterLeaving = afterLeaving.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).remainingMs;
    expect(remainingAfterLeaving).toBeLessThan(fullDuration - 16);

    afterLeaving.player.x = scanner.x + scanner.width - 20;
    afterLeaving.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).remainingMs).toBe(fullDuration);
  });

  it('keeps an expired timed-reveal bridge active until the player leaves its support surface', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { revealVolume, scanner, bridge } = getTimedRevealFixture(state);
    state.player.x = revealVolume.x + 16;
    state.player.y = revealVolume.y + 16;
    session.update(16, defaultInputState());

    state.player.x = scanner.x + 16;
    state.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    state = getMutableState(session);
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
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).active).toBe(true);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).pendingHide).toBe(true);
    expect(state.player.supportPlatformId).toBe(bridge.id);

    state.player.x = bridgePlatform.x + bridgePlatform.width + 36;
    state.player.y = bridgePlatform.y - state.player.height;
    state.player.onGround = true;
    state.player.supportPlatformId = bridge.id;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).active).toBe(false);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).pendingHide).toBe(false);
  });

  it('persists timed-reveal discovery across checkpoint respawn only when the checkpoint was activated after reveal, while timer state still resets', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { revealVolume, scanner, bridge } = getTimedRevealFixture(state);
    const lateCheckpoint = state.stageRuntime.checkpoints[state.stageRuntime.checkpoints.length - 1];

    state.player.x = revealVolume.x + 16;
    state.player.y = revealVolume.y + 16;
    session.update(16, defaultInputState());

    state.player.x = lateCheckpoint.rect.x;
    state.player.y = lateCheckpoint.rect.y;
    session.update(16, defaultInputState());

    state.player.x = scanner.x + 16;
    state.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).active).toBe(true);

    state.player.health = 1;
    (session as any).damagePlayer();
    (session as any).respawnPlayer();

    state = getMutableState(session);
    expect(state.stageRuntime.revealedPlatformIds).toContain(bridge.revealId);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).active).toBe(false);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).remainingMs).toBe(0);
  });

  it('resets timed-reveal discovery when the reveal happened after the active checkpoint and still clears the active timer on respawn', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { revealVolume, scanner, bridge } = getTimedRevealFixture(state);
    const earlyCheckpoint = state.stageRuntime.checkpoints[0];

    state.player.x = earlyCheckpoint.rect.x;
    state.player.y = earlyCheckpoint.rect.y;
    session.update(16, defaultInputState());

    state.player.x = revealVolume.x + 16;
    state.player.y = revealVolume.y + 16;
    session.update(16, defaultInputState());

    state.player.x = scanner.x + 16;
    state.player.y = scanner.y + 16;
    session.update(16, defaultInputState());

    state.player.health = 1;
    (session as any).damagePlayer();
    (session as any).respawnPlayer();

    state = getMutableState(session);
    expect(state.stageRuntime.revealedPlatformIds).not.toContain(bridge.revealId);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).active).toBe(false);
  });

  it('resets scanner switches and timed-reveal bridges after death, checkpoint respawn, manual restart, and fresh attempts', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { revealVolume, scanner, bridge } = getTimedRevealFixture(state);
    const checkpoint = state.stageRuntime.checkpoints[0];

    const activateBridge = () => {
      const mutable = getMutableState(session);
      mutable.player.x = revealVolume.x + 16;
      mutable.player.y = revealVolume.y + 16;
      session.update(16, defaultInputState());
      mutable.player.x = scanner.x + 16;
      mutable.player.y = scanner.y + 16;
      session.update(16, defaultInputState());
    };

    activateBridge();
    state = getMutableState(session);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).active).toBe(true);

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

    session.forceStartStage(2);
    state = getMutableState(session);
    expect(state.stageRuntime.revealedPlatformIds).not.toContain(bridge.revealId);
    expect(state.stageRuntime.temporaryBridges.find((entry: any) => entry.id === bridge.id).active).toBe(false);
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

  it('applies anti-grav streams and gravity inversion after impulses, suppresses them during dash, and restores normal gravity on exit', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const support = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'static' && platform.width >= 180);

    state.stageRuntime.gravityFields = [
      {
        id: 'test-anti-grav',
        kind: 'anti-grav-stream',
        x: support.x - 20,
        y: support.y - 220,
        width: 280,
        height: 260,
      },
      {
        id: 'test-inversion',
        kind: 'gravity-inversion-column',
        x: support.x + 320,
        y: support.y - 240,
        width: 220,
        height: 280,
      },
    ];
    state.player.x = support.x + 24;
    state.player.y = support.y - state.player.height;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;

    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    let next = getMutableState(session);
    expect(next.player.gravityFieldId).toBe('test-anti-grav');
    expect(next.player.gravityFieldKind).toBe('anti-grav-stream');
    expect(next.player.gravityScale).toBeLessThan(0);
    expect(next.player.vy).toBeLessThan(-640);

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
    expect(next.player.gravityFieldId).toBeNull();
    expect(next.player.gravityScale).toBe(1);

    next.player.dashTimerMs = 0;
    next.player.vy = 0;
    next.player.onGround = false;
    next.player.supportPlatformId = null;
    session.update(16, defaultInputState());

    next = getMutableState(session);
    expect(next.player.gravityFieldId).toBe('test-anti-grav');
    expect(next.player.vy).toBeLessThan(0);

    placePlayerInsideField(next, state.stageRuntime.gravityFields[1]);
    session.update(16, defaultInputState());

    next = getMutableState(session);
    expect(next.player.gravityFieldId).toBe('test-inversion');
    expect(next.player.gravityFieldKind).toBe('gravity-inversion-column');
    expect(next.player.gravityScale).toBe(-1);
    expect(next.player.vy).toBeCloseTo(-next.stage.world.gravity * 0.016, 5);

    next.player.x = state.stageRuntime.gravityFields[1].x + state.stageRuntime.gravityFields[1].width + 80;
    next.player.y = support.y - 120;
    next.player.vx = 0;
    next.player.vy = 0;
    next.player.onGround = false;
    next.player.supportPlatformId = null;
    session.update(16, defaultInputState());

    next = getMutableState(session);
    expect(next.player.gravityFieldId).toBeNull();
    expect(next.player.gravityFieldKind).toBeNull();
    expect(next.player.gravityScale).toBe(1);
    expect(next.player.vy).toBeCloseTo(next.stage.world.gravity * 0.016, 5);
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

  it('keeps skim contact under 120ms from arming falling-platform collapse', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const fallingPlatform = createRuntimeFallingPlatformFixture('timing-skim', 2000, 520, 160, 300, 120, 50);
    isolatePlayerPlatformFixture(state, [fallingPlatform]);
    placePlayerOnSupportedPlatform(state, fallingPlatform);

    session.update(112, defaultInputState());
    placePlayerOffPlatformSupport(state, fallingPlatform);
    session.update(16, defaultInputState());

    expect(fallingPlatform.fall.triggered).toBe(false);
    expect(fallingPlatform.fall.falling).toBe(false);
  });

  it('arms falling-platform collapse after accumulating 120ms of top support contact', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const fallingPlatform = createRuntimeFallingPlatformFixture('timing-arm', 2000, 520, 160, 300, 120, 50);
    isolatePlayerPlatformFixture(state, [fallingPlatform]);
    placePlayerOnSupportedPlatform(state, fallingPlatform);

    session.update(120, defaultInputState());

    expect(fallingPlatform.fall.triggered).toBe(true);
    expect(fallingPlatform.fall.timerMs).toBe(300);
    expect(fallingPlatform.fall.falling).toBe(false);
  });

  it('preserves pre-arm support accumulation across unsupported gaps of 50ms or less', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const fallingPlatform = createRuntimeFallingPlatformFixture('timing-hop-small-gap', 2000, 520, 160, 300, 120, 50);
    isolatePlayerPlatformFixture(state, [fallingPlatform]);
    placePlayerOnSupportedPlatform(state, fallingPlatform);

    session.update(80, defaultInputState());
    placePlayerOffPlatformSupport(state, fallingPlatform);
    session.update(40, defaultInputState());
    placePlayerOnSupportedPlatform(state, fallingPlatform);
    session.update(40, defaultInputState());

    expect(fallingPlatform.fall.triggered).toBe(true);
    expect(fallingPlatform.fall.timerMs).toBe(300);
  });

  it('resets pre-arm support accumulation after unsupported gaps longer than 50ms', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const fallingPlatform = createRuntimeFallingPlatformFixture('timing-hop-long-gap', 2000, 520, 160, 300, 120, 50);
    isolatePlayerPlatformFixture(state, [fallingPlatform]);
    placePlayerOnSupportedPlatform(state, fallingPlatform);

    session.update(80, defaultInputState());
    placePlayerOffPlatformSupport(state, fallingPlatform);
    session.update(64, defaultInputState());
    placePlayerOnSupportedPlatform(state, fallingPlatform);
    session.update(40, defaultInputState());

    expect(fallingPlatform.fall.triggered).toBe(false);
    expect(fallingPlatform.fall.accumulatedSupportMs).toBe(40);
  });

  it('decrements armed collapse timer only while top-surface support contact stays active', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const fallingPlatform = createRuntimeFallingPlatformFixture('timing-armed-pause', 2000, 520, 160, 300, 120, 50);
    isolatePlayerPlatformFixture(state, [fallingPlatform]);
    placePlayerOnSupportedPlatform(state, fallingPlatform);

    advanceSession(session, 120, 16);
    advanceSession(session, 40, 16);
    expect(fallingPlatform.fall.timerMs).toBe(260);

    placePlayerOffPlatformSupport(state, fallingPlatform);
    advanceSession(session, 100, 16);
    expect(fallingPlatform.fall.timerMs).toBe(260);

    placePlayerOnSupportedPlatform(state, fallingPlatform);
    advanceSession(session, 260, 16);
    expect(fallingPlatform.fall.falling).toBe(true);
  });

  it('keeps jump initiation valid while top support remains active on an armed falling platform', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const fallingPlatform = createRuntimeFallingPlatformFixture('timing-jump-valid', 2000, 520, 160, 320, 120, 50);
    isolatePlayerPlatformFixture(state, [fallingPlatform]);
    placePlayerOnSupportedPlatform(state, fallingPlatform);

    session.update(120, defaultInputState());
    session.update(32, defaultInputState());
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.supportPlatformId).toBeNull();
    expect(fallingPlatform.fall.triggered).toBe(true);
  });

  it('keeps gravity-room fields active until button contact disables them without changing dash priority', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { capsule, antiGravField } = getGravityCapsuleFixture(state);

    placePlayerInsideField(state, antiGravField);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.gravityCapsules[0].enabled).toBe(true);
    expect(state.player.gravityFieldId).toBe(antiGravField.id);
    expect(state.player.gravityFieldKind).toBe('anti-grav-stream');

    touchGravityCapsuleButton(state, capsule);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.gravityCapsules[0].enabled).toBe(false);
    expect(state.stageRuntime.gravityCapsules[0].button.activated).toBe(true);

    placePlayerInsideField(state, antiGravField, 0);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBeNull();
    expect(state.player.gravityFieldKind).toBeNull();
    expect(state.player.gravityScale).toBe(1);

    state.progress.activePowers.dash = true;
    placePlayerInsideField(state, antiGravField, 60);
    session.update(16, { ...defaultInputState(), dashPressed: true });

    state = getMutableState(session);
    expect(state.player.dashTimerMs).toBeGreaterThan(0);
    expect(state.player.gravityFieldId).toBeNull();
    expect(state.player.gravityScale).toBe(1);
  });

  it('blocks the sealed gravity room bottom edge while leaving side-wall door openings traversable', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { capsule } = getGravityCapsuleFixture(state);
    const shellBottom = capsule.shell.y + capsule.shell.height;
    const sealedBottomMidpoint = capsule.shell.x + capsule.shell.width / 2;
    const shellRight = capsule.shell.x + capsule.shell.width;
    const initialEntryX = capsule.shell.x - state.player.width + 2;

    state.player.x = sealedBottomMidpoint - state.player.width / 2;
    state.player.y = shellBottom + 2;
    state.player.vx = 0;
    state.player.vy = -400;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.y).toBeGreaterThanOrEqual(shellBottom);
    expect(state.player.vy).toBe(0);

    state.player.x = initialEntryX;
    state.player.y = capsule.entryDoor.y + capsule.entryDoor.height / 2 - state.player.height / 2;
    state.player.vx = 420;
    state.player.vy = 0;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    advanceSession(session, 96);

    state = getMutableState(session);
    expect(state.player.x).toBeGreaterThan(initialEntryX + 24);

    const initialExitX = shellRight - 2;
    state.player.x = initialExitX;
    state.player.y = capsule.exitDoor.y + capsule.exitDoor.height / 2 - state.player.height / 2;
    state.player.vx = 420;
    state.player.vy = 0;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    advanceSession(session, 96);

    state = getMutableState(session);
    expect(state.player.x).toBeGreaterThan(initialExitX + 24);
  });

  it('contains moving platforms at sealed shell bands while still allowing passage through side-wall door openings', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { capsule } = getGravityCapsuleFixture(state);
    const shellRight = capsule.shell.x + capsule.shell.width;
    const shellBottom = capsule.shell.y + capsule.shell.height;
    const blockedPlatformId = 'gravity-shell-blocked-platform';
    const allowedPlatformId = 'gravity-door-open-platform';

    state.stageRuntime.platforms.push(
      createRuntimeMovingPlatform(
        blockedPlatformId,
        capsule.shell.x + capsule.shell.width / 2,
        shellBottom + 56,
        140,
        220,
      ),
      {
        ...createRuntimeMovingPlatform(allowedPlatformId, shellRight + 24, capsule.exitDoor.y + 28, 112, 220),
        startX: shellRight - 24,
        move: { axis: 'x', range: 48, speed: 220, direction: -1 },
      },
    );

    advanceSession(session, 700);

    state = getMutableState(session);
    const blockedPlatform = state.stageRuntime.platforms.find((platform: any) => platform.id === blockedPlatformId);
    const allowedPlatform = state.stageRuntime.platforms.find((platform: any) => platform.id === allowedPlatformId);

    expect(blockedPlatform).toBeTruthy();
    expect(allowedPlatform).toBeTruthy();
    expect(blockedPlatform.y).toBeGreaterThanOrEqual(shellBottom);
    expect(blockedPlatform.y).toBeLessThanOrEqual(capsule.shell.y + capsule.shell.height + 56);
    expect(allowedPlatform.x).toBeLessThan(shellRight);
  });

  it('applies active gravity across the full room interior while keeping enemy gravity unchanged', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { capsule, antiGravField } = getGravityCapsuleFixture(state);

    state.stageRuntime.enemies.push({
      id: 'gravity-room-hopper-test',
      kind: 'hopper',
      x: capsule.shell.x + 120,
      y: capsule.shell.y + 84,
      vx: 0,
      vy: 0,
      width: 34,
      height: 30,
      alive: true,
      defeatCause: null,
      direction: 1,
      supportY: null,
      supportPlatformId: null,
      laneLeft: null,
      laneRight: null,
      hop: { intervalMs: 1200, timerMs: 800, impulse: 900, speed: 120, targetPlatformId: null, targetX: null, targetY: null },
    });

    placePlayerInsideCapsuleNearLeftWall(state, capsule, 220);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    const enemy = state.stageRuntime.enemies.find((entry: any) => entry.id === 'gravity-room-hopper-test');
    expect(state.player.gravityFieldId).toBe(antiGravField.id);
    expect(state.player.gravityFieldKind).toBe('anti-grav-stream');
    expect(state.player.x).toBeLessThan(antiGravField.x + 40);
    expect(enemy.vy).toBeGreaterThan(0);
  });

  it('chooses reachable supported first-hop landing from authored lane instead of defaulting left', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const support = createStaticPlatformFixture('hopper-support', 1920, 540, 180);
    const leftLanding = createStaticPlatformFixture('hopper-left-landing', 1510, 495, 180);
    const rightLanding = createStaticPlatformFixture('hopper-right-landing', 2180, 495, 180);

    state.stageRuntime.platforms = [leftLanding, support, rightLanding];
    state.stageRuntime.hazards = [];
    state.stageRuntime.enemies = [
      {
        id: 'first-hop-hopper',
        kind: 'hopper',
        x: 1930,
        y: support.y - 30,
        vx: 0,
        vy: 0,
        width: 34,
        height: 30,
        alive: true,
        defeatCause: null,
        direction: -1,
        supportY: support.y - 30,
        supportPlatformId: support.id,
        laneLeft: support.x,
        laneRight: support.x + support.width - 34,
        hop: {
          intervalMs: 1200,
          timerMs: 1,
          impulse: 860,
          speed: 120,
          committedHops: 0,
          targetPlatformId: null,
          targetX: null,
          targetY: null,
        },
      },
    ];

    session.update(16, defaultInputState());

    const hopper = state.stageRuntime.enemies[0];
    expect(hopper.hop?.targetPlatformId).toBe(rightLanding.id);
    expect(hopper.direction).toBe(1);
    expect(hopper.supportPlatformId).toBeNull();
  });

  it('keeps grounded hoppers waiting on support when no valid initial landing exists while flyers keep hover behavior', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const support = createStaticPlatformFixture('isolated-support', 1920, 540, 180);
    state.stageRuntime.platforms = [support];
    state.stageRuntime.hazards = [];
    state.stageRuntime.enemies = [
      {
        id: 'isolated-hopper',
        kind: 'hopper',
        x: 1930,
        y: support.y - 30,
        vx: 0,
        vy: 0,
        width: 34,
        height: 30,
        alive: true,
        defeatCause: null,
        direction: -1,
        supportY: support.y - 30,
        supportPlatformId: support.id,
        laneLeft: support.x,
        laneRight: support.x + support.width - 34,
        hop: {
          intervalMs: 1200,
          timerMs: 1,
          impulse: 860,
          speed: 120,
          committedHops: 0,
          targetPlatformId: null,
          targetX: null,
          targetY: null,
        },
      },
      {
        id: 'control-flyer',
        kind: 'flyer',
        x: 2200,
        y: 320,
        vx: 0,
        vy: 0,
        width: 34,
        height: 24,
        alive: true,
        defeatCause: null,
        direction: 1,
        supportY: null,
        supportPlatformId: null,
        laneLeft: null,
        laneRight: null,
        flyer: {
          left: 2200,
          right: 2360,
          speed: 90,
          bobAmp: 12,
          bobSpeed: 4,
          bobPhase: 0,
          originY: 320,
        },
      },
    ];

    advanceSession(session, 160);

    const hopper = state.stageRuntime.enemies.find((enemy: any) => enemy.id === 'isolated-hopper');
    const flyer = state.stageRuntime.enemies.find((enemy: any) => enemy.id === 'control-flyer');

    expect(hopper.supportPlatformId).toBe(support.id);
    expect(hopper.y).toBe(hopper.supportY);
    expect(hopper.vx).toBe(0);
    expect(hopper.vy).toBe(0);
    expect(hopper.hop?.targetPlatformId).toBeNull();
    expect(flyer.supportPlatformId).toBeNull();
    expect(flyer.y).not.toBe(flyer.flyer.originY);
  });

  it('keeps first-stage hopper grounded across first checkpoint respawn', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    const checkpoint = state.stageRuntime.checkpoints.find((entry: any) => entry.id === 'cp-1');
    expect(checkpoint).toBeTruthy();

    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    session.update(16, defaultInputState());

    expect(getMutableState(session).activeCheckpointId).toBe('cp-1');

    (session as any).respawnPlayer();

    state = getMutableState(session);
    const hopper = state.stageRuntime.enemies.find((entry: any) => entry.id === 'hopper-1');
    expect(hopper).toBeTruthy();
    expect(hopper.supportPlatformId).toBeTruthy();
    expect(hopper.supportY).not.toBeNull();
    expect(hopper.y).toBe(hopper.supportY);

    session.update(16, defaultInputState());

    state = getMutableState(session);
    const hopperAfterTick = state.stageRuntime.enemies.find((entry: any) => entry.id === 'hopper-1');
    expect(hopperAfterTick.supportPlatformId).toBeTruthy();
    expect(hopperAfterTick.supportY).not.toBeNull();
    expect(hopperAfterTick.y).toBe(hopperAfterTick.supportY);
  });

  it('lets grounded hoppers keep falling when a missed landing would otherwise need rescue snap', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const targetPlatform = createStaticPlatformFixture('hopper-target', 2180, 495, 180);
    state.stageRuntime.platforms = [targetPlatform];
    state.stageRuntime.hazards = [];
    state.stageRuntime.enemies = [
      {
        id: 'falling-hopper',
        kind: 'hopper',
        x: 2190,
        y: 760,
        vx: 40,
        vy: 320,
        width: 34,
        height: 30,
        alive: true,
        defeatCause: null,
        direction: 1,
        supportY: null,
        supportPlatformId: null,
        laneLeft: null,
        laneRight: null,
        hop: {
          intervalMs: 1200,
          timerMs: 600,
          impulse: 860,
          speed: 120,
          committedHops: 1,
          targetPlatformId: targetPlatform.id,
          targetX: targetPlatform.x + 24,
          targetY: targetPlatform.y - 30,
        },
      },
    ];

    session.update(16, defaultInputState());

    const hopper = state.stageRuntime.enemies[0];
    expect(hopper.supportPlatformId).toBeNull();
    expect(hopper.supportY).toBeNull();
    expect(hopper.hop?.targetPlatformId).toBeNull();
    expect(hopper.hop?.targetX).toBeNull();
    expect(hopper.hop?.targetY).toBeNull();
    expect(hopper.y).toBeGreaterThan(760);
    expect(hopper.vy).toBeGreaterThan(320);
  });

  it('falls from occupied position when authored support motion ends top-surface contact', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const support = createRuntimeHorizontalMovingPlatform('detach-support', 2000, 520, 128, 96, 2250);
    isolatePlayerPlatformFixture(state, [support]);

    const occupiedX = support.x + 8;
    state.player.x = occupiedX;
    state.player.y = support.y - state.player.height + 8;
    state.player.vx = 1;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;

    session.update(16, defaultInputState());

    expect(state.player.onGround).toBe(false);
    expect(state.player.supportPlatformId).toBeNull();
    expect(state.player.x).toBeCloseTo(occupiedX + 0.016, 2);
  });

  it('preserves occupied fall position when support-driven detach happens with held horizontal input', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const support = createRuntimeHorizontalMovingPlatform('detach-support', 2000, 520, 128, 96, 2250);
    isolatePlayerPlatformFixture(state, [support]);

    const occupiedX = support.x + 8;
    state.player.x = occupiedX;
    state.player.y = support.y - state.player.height + 8;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;

    session.update(16, { ...defaultInputState(), right: true });

    expect(state.player.onGround).toBe(false);
    expect(state.player.supportPlatformId).toBeNull();
    expect(state.player.x).toBeGreaterThan(occupiedX);
  });

  it('still blocks against nearby non-support walls on detach frame', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const support = createRuntimeHorizontalMovingPlatform('detach-support', 2000, 520, 128, 96, 2250);
    const wall = {
      ...createStaticPlatformFixture('detach-wall', 2040, support.y - state.player.height + 6, 24),
      height: state.player.height + 72,
    };
    isolatePlayerPlatformFixture(state, [support, wall]);

    state.player.x = support.x + 8;
    state.player.y = support.y - state.player.height - 4;
    state.player.vx = 400;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;

    session.update(16, defaultInputState());

    expect(state.player.onGround).toBe(false);
    expect(state.player.x).toBe(wall.x - state.player.width);
  });

  it('keeps detach-frame former-support exemption narrow when detaching from a moving falling platform', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const support = createRuntimeHorizontalMovingFallingPlatform('detach-falling-support', 2000, 520, 128, 96, 2250);
    const wall = {
      ...createStaticPlatformFixture('detach-falling-wall', 2040, support.y - state.player.height + 6, 24),
      height: state.player.height + 72,
    };
    isolatePlayerPlatformFixture(state, [support, wall]);

    state.player.x = support.x + 8;
    state.player.y = support.y - state.player.height - 4;
    state.player.vx = 400;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;

    session.update(16, defaultInputState());

    expect(state.player.onGround).toBe(false);
    expect(state.player.x).toBe(wall.x - state.player.width);
  });

  it('restores former-support side collisions after detach frame expires', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const support = createRuntimeHorizontalMovingPlatform('detach-support', 2000, 520, 128, 96, 2250);
    isolatePlayerPlatformFixture(state, [support]);

    state.player.x = support.x + 8;
    state.player.y = support.y - state.player.height + 8;
    state.player.vx = 1;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;

    session.update(16, defaultInputState());

    support.move.speed = 0;
    support.vx = 0;
    state.player.x = support.x - state.player.width - 3;
    state.player.y = support.y - state.player.height + 8;
    state.player.vx = 260;
    state.player.vy = 0;
    state.player.onGround = false;
    state.player.supportPlatformId = null;

    session.update(16, defaultInputState());

    expect(state.player.x).toBe(support.x - state.player.width);
  });

  it('keeps former-support side collisions active for non-motion edge detach', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const support = createRuntimeHorizontalMovingPlatform('detach-support', 2000, 520, 128, 0, 2000);
    isolatePlayerPlatformFixture(state, [support]);

    state.player.x = support.x + support.width - 6;
    state.player.y = support.y - state.player.height + 8;
    state.player.vx = -180;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;

    session.update(16, defaultInputState());

    expect(state.player.onGround).toBe(false);
    expect(state.player.x).toBe(support.x + support.width);
  });

  it('keeps coyote timing unchanged after support-driven detach', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    const support = createRuntimeHorizontalMovingPlatform('detach-support', 2000, 520, 128, 96, 2250);
    isolatePlayerPlatformFixture(state, [support]);

    state.player.x = support.x + 8;
    state.player.y = support.y - state.player.height + 8;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;
    state.player.coyoteMs = 120;

    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.onGround).toBe(false);
    expect(state.player.coyoteMs).toBe(104);

    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    state = getMutableState(session);
    expect(state.player.vy).toBeLessThan(0);
  });

  it('keeps enemies trapped at gravity-room side-wall doors in active and disabled states', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { capsule } = getGravityCapsuleFixture(state);
    const shellRight = capsule.shell.x + capsule.shell.width;

    state.stageRuntime.enemies.push(
      {
        id: 'gravity-room-inside-flyer',
        kind: 'flyer',
        x: shellRight - 44,
        y: capsule.exitDoor.y + 20,
        vx: 0,
        vy: 0,
        width: 34,
        height: 24,
        alive: true,
        defeatCause: null,
        direction: 1,
        supportY: null,
        supportPlatformId: null,
        laneLeft: null,
        laneRight: null,
        flyer: {
          left: shellRight - 80,
          right: shellRight + 90,
          speed: 120,
          bobAmp: 0,
          bobSpeed: 0,
          bobPhase: 0,
          originY: capsule.exitDoor.y + 20,
        },
      },
      {
        id: 'gravity-room-outside-flyer',
        kind: 'flyer',
        x: capsule.shell.x - 34,
        y: capsule.entryDoor.y + 20,
        vx: 0,
        vy: 0,
        width: 34,
        height: 24,
        alive: true,
        defeatCause: null,
        direction: 1,
        supportY: null,
        supportPlatformId: null,
        laneLeft: null,
        laneRight: null,
        flyer: {
          left: capsule.shell.x - 70,
          right: capsule.shell.x + 70,
          speed: 120,
          bobAmp: 0,
          bobSpeed: 0,
          bobPhase: 0,
          originY: capsule.entryDoor.y + 20,
        },
      },
    );

    advanceSession(session, 16);

    state = getMutableState(session);
    let insideFlyer = state.stageRuntime.enemies.find((entry: any) => entry.id === 'gravity-room-inside-flyer');
    let outsideFlyer = state.stageRuntime.enemies.find((entry: any) => entry.id === 'gravity-room-outside-flyer');
    expect(insideFlyer.x + insideFlyer.width).toBeLessThanOrEqual(shellRight);
    expect(outsideFlyer.x + outsideFlyer.width).toBeLessThanOrEqual(capsule.shell.x);

    state.stageRuntime.gravityCapsules[0].enabled = false;
    state.stageRuntime.gravityCapsules[0].button.activated = true;
    insideFlyer.x = shellRight - 40;
    insideFlyer.direction = 1;
    outsideFlyer.x = capsule.shell.x - 34;
    outsideFlyer.direction = 1;

    advanceSession(session, 16);

    state = getMutableState(session);
    insideFlyer = state.stageRuntime.enemies.find((entry: any) => entry.id === 'gravity-room-inside-flyer');
    outsideFlyer = state.stageRuntime.enemies.find((entry: any) => entry.id === 'gravity-room-outside-flyer');
    expect(insideFlyer.x + insideFlyer.width).toBeLessThanOrEqual(shellRight);
    expect(outsideFlyer.x + outsideFlyer.width).toBeLessThanOrEqual(capsule.shell.x);
  });

  it('uses inverse jump takeoff while the player hits an active gravity-room button with contained enemies present', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { capsule, antiGravField } = getGravityCapsuleFixture(state);
    const buttonSupport = getGravityCapsuleButtonSupportPlatform(state, capsule);
    const buttonLaneLeft = Math.min(capsule.button.x, capsule.buttonRoute.x) - 36;
    const containedEnemyId = 'sky-room-walker-1';

    if (!state.stageRuntime.enemies.find((enemy: any) => enemy.id === containedEnemyId)) {
      throw new Error('Expected authored interior gravity-room enemy fixture.');
    }

    state.player.x = capsule.button.x - state.player.width - 8;
    state.player.y = buttonSupport.y - state.player.height;
    state.player.vx = 180;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = buttonSupport.id;

    session.update(16, { ...defaultInputState(), right: true, jumpHeld: true, jumpPressed: true });

    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBe(antiGravField.id);
    expect(state.player.gravityFieldKind).toBe('anti-grav-stream');
    expect(state.player.vy).toBeCloseTo(640 + state.stage.world.gravity * state.player.gravityScale * 0.016, 4);
    expect(state.stageRuntime.enemies.find((enemy: any) => enemy.id === containedEnemyId).x + 34).toBeLessThan(buttonLaneLeft);

    state.player.x = capsule.button.x + capsule.button.width / 2 - state.player.width / 2;
    state.player.y = capsule.button.y + capsule.button.height / 2 - state.player.height / 2;
    state.player.vx = 0;
    state.player.vy = 0;
    (session as any).handleGravityCapsules();

    state = getMutableState(session);
    expect(state.stageRuntime.gravityCapsules.find((entry: any) => entry.id === capsule.id).enabled).toBe(false);
    expect(state.stageRuntime.gravityCapsules.find((entry: any) => entry.id === capsule.id).button.activated).toBe(true);

    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBeNull();
    expect(state.stageRuntime.enemies.find((enemy: any) => enemy.id === containedEnemyId).x + 34).toBeLessThanOrEqual(
      capsule.shell.x + capsule.shell.width,
    );
  });

  it('keeps flyers on their authored side of sealed gravity room shell bands', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { capsule } = getGravityCapsuleFixture(state);

    state.stageRuntime.enemies.push({
      id: 'runtime-gravity-shell-flyer',
      kind: 'flyer',
      x: capsule.shell.x - 26,
      y: capsule.shell.y + 132,
      vx: 0,
      vy: 0,
      width: 34,
      height: 24,
      alive: true,
      defeatCause: null,
      direction: 1,
      supportY: null,
      supportPlatformId: null,
      laneLeft: null,
      laneRight: null,
      flyer: {
        left: capsule.shell.x - 38,
        right: capsule.shell.x + 32,
        speed: 120,
        bobAmp: 0,
        bobSpeed: 0,
        bobPhase: 0,
        originY: capsule.shell.y + 132,
      },
    });

    session.update(16, defaultInputState());

    state = getMutableState(session);
    const flyer = state.stageRuntime.enemies.find((enemy: any) => enemy.id === 'runtime-gravity-shell-flyer');

    expect(flyer.x + flyer.width).toBeLessThanOrEqual(capsule.shell.x);
    expect(flyer.direction).toBe(-1);
  });

  it('keeps spring boosts, full sticky jumps, and falling-platform escape timing intact inside gravity fields', () => {
    const session = new GameSession();
    let state = getMutableState(session);
    const springPlatform = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'spring');

    state.stageRuntime.gravityFields = [
      {
        id: 'spring-stream',
        kind: 'anti-grav-stream',
        x: springPlatform.x - 20,
        y: springPlatform.y - 220,
        width: 320,
        height: 260,
      },
    ];
    state.player.x = springPlatform.x + 10;
    state.player.y = springPlatform.y - state.player.height;
    state.player.vy = 60;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.vy).toBe(-springPlatform.spring.boost);

    session.forceStartStage(2);
    state = getMutableState(session);
    const stickyPlatform = applyTerrainVariantFixture(createStaticPlatformFixture('gravity-sticky-support', 10520, 480, 180), 'stickySludge');
    state.stageRuntime.platforms.push(stickyPlatform);
    const { capsule, antiGravField } = getGravityCapsuleFixture(state);

    expect(antiGravField.x).toBeLessThan(stickyPlatform.x + stickyPlatform.width);

    placePlayerInsideField(state, antiGravField);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBe(antiGravField.id);

    touchGravityCapsuleButton(state, capsule);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.stageRuntime.gravityCapsules[0].enabled).toBe(false);

    placePlayerInsideField(state, antiGravField);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBeNull();

  state.player.x = stickyPlatform.x + 20;
  state.player.y = stickyPlatform.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
  state.player.supportPlatformId = stickyPlatform.id;
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBeNull();
    expect(state.player.vy).toBeCloseTo(-640 + state.stage.world.gravity * 0.016, 4);

    session.forceStartStage(0);
    state = getMutableState(session);
    const fallingPlatform = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'falling');
    state.stageRuntime.gravityFields = [
      {
        id: 'falling-inversion',
        kind: 'gravity-inversion-column',
        x: fallingPlatform.x - 20,
        y: fallingPlatform.y - 320,
        width: 320,
        height: 360,
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

  it('resets gravity capsule activation on respawn, checkpoint respawn, and manual restart', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const { capsule, antiGravField } = getGravityCapsuleFixture(state);
    const { capsule: inversionCapsule, field: inversionField } = getNamedGravityCapsuleFixture(
      state,
      'sky-gravity-inversion-capsule',
      'sky-gravity-inversion-column',
    );
    const checkpoint = state.stageRuntime.checkpoints.find((entry: any) => entry.id === 'cp-5');
    if (!checkpoint) {
      throw new Error('Expected Halo Spire checkpoint fixture.');
    }

    placePlayerInsideField(state, antiGravField);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBe(antiGravField.id);

    touchGravityCapsuleButton(state, capsule);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.stageRuntime.gravityCapsules.find((entry: any) => entry.id === capsule.id).enabled).toBe(false);

    placePlayerInsideField(state, antiGravField);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBeNull();

    touchGravityCapsuleButton(state, inversionCapsule);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.stageRuntime.gravityCapsules.find((entry: any) => entry.id === inversionCapsule.id).enabled).toBe(false);

    placePlayerInsideField(state, inversionField);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBeNull();

    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    state.player.vx = 0;
    state.player.vy = 0;
    session.update(16, defaultInputState());
    expect(getMutableState(session).activeCheckpointId).toBe(checkpoint.id);

    placePlayerInsideField(getMutableState(session), antiGravField);
    session.update(16, defaultInputState());
    getMutableState(session).player.health = 1;
    (session as any).damagePlayer();
    (session as any).respawnPlayer();

    state = getMutableState(session);
    expect(state.activeCheckpointId).toBe(checkpoint.id);
    expect(state.stageRuntime.gravityFields.map((field: any) => field.id)).toEqual([
      'sky-anti-grav-stream',
      'sky-gravity-inversion-column',
    ]);
    expect(state.stageRuntime.gravityCapsules.map((entry: any) => ({ id: entry.id, enabled: entry.enabled, button: entry.button.activated }))).toEqual([
      { id: 'sky-anti-grav-capsule', enabled: true, button: false },
      { id: 'sky-gravity-inversion-capsule', enabled: true, button: false },
    ]);
    expect(state.player.gravityFieldId).toBeNull();
    expect(state.player.gravityFieldKind).toBeNull();
    expect(state.player.gravityScale).toBe(1);

    session.restartStage();
    state = getMutableState(session);
    expect(state.stageRuntime.gravityFields.map((field: any) => field.id)).toEqual([
      'sky-anti-grav-stream',
      'sky-gravity-inversion-column',
    ]);
    expect(state.stageRuntime.gravityCapsules.map((entry: any) => ({ id: entry.id, enabled: entry.enabled, button: entry.button.activated }))).toEqual([
      { id: 'sky-anti-grav-capsule', enabled: true, button: false },
      { id: 'sky-gravity-inversion-capsule', enabled: true, button: false },
    ]);
    expect(state.player.gravityFieldId).toBeNull();
    expect(state.player.gravityFieldKind).toBeNull();
    expect(state.player.gravityScale).toBe(1);
  });

  it('keeps every sky gravity field mapped to its own room controller after stage load', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    const state = getMutableState(session);
    expect(state.stageRuntime.gravityFields.map((field: any) => ({ id: field.id, gravityCapsuleId: field.gravityCapsuleId }))).toEqual([
      { id: 'sky-anti-grav-stream', gravityCapsuleId: 'sky-anti-grav-capsule' },
      { id: 'sky-gravity-inversion-column', gravityCapsuleId: 'sky-gravity-inversion-capsule' },
    ]);
    expect(state.stageRuntime.gravityCapsules.map((capsule: any) => capsule.fieldId).sort()).toEqual([
      'sky-anti-grav-stream',
      'sky-gravity-inversion-column',
    ]);
  });

  it('uses inverse takeoff for grounded, buffered, and coyote jumps sourced from active gravity-room support', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const support = state.stageRuntime.platforms.find((platform: any) => platform.id === 'platform-9010-480');
    const activeJumpVy = 640 + state.stage.world.gravity * -0.38 * 0.016;

    state.player.x = support.x + 20;
    state.player.y = support.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    state = getMutableState(session);
    expect(state.player.vy).toBeGreaterThan(0);
    expect(state.player.vy).toBeCloseTo(activeJumpVy, 4);
    expect(state.player.onGround).toBe(false);

    session.forceStartStage(2);
    state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const bufferedSupport = state.stageRuntime.platforms.find((platform: any) => platform.id === 'platform-9010-480');
    state.player.x = bufferedSupport.x + 20;
    state.player.y = bufferedSupport.y - state.player.height - 8;
    state.player.vx = 0;
    state.player.vy = 160;
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });
    for (let index = 0; index < 20; index += 1) {
      session.update(16, { ...defaultInputState(), jumpHeld: true });
      if (getMutableState(session).player.phaseThroughSupportPlatformId === bufferedSupport.id) {
        break;
      }
    }

    state = getMutableState(session);
    expect(state.player.vy).toBeGreaterThan(0);
    expect(state.player.vy).toBeCloseTo(activeJumpVy, 4);

    session.forceStartStage(2);
    state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const coyoteSupport = state.stageRuntime.platforms.find((platform: any) => platform.id === 'platform-9010-480');
    state.player.x = coyoteSupport.x + 20;
    state.player.y = coyoteSupport.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = coyoteSupport.id;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    state.player.y -= 6;
    state.player.vy = 0;
    state.player.coyoteMs = 100;
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    state = getMutableState(session);
    expect(state.player.vy).toBeGreaterThan(0);
    expect(state.player.vy).toBeCloseTo(activeJumpVy, 4);
  });

  it('lets the player jump downward after active anti-grav carries them onto ceiling support in forest room', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const { field } = getNamedGravityCapsuleFixture(state, 'forest-anti-grav-canopy-room', 'forest-anti-grav-canopy-lift');
    const ceilingSupport = state.stageRuntime.platforms.find((platform: any) => platform.id === 'platform-8990-250-moving');

    if (!ceilingSupport) {
      throw new Error('Expected forest gravity-room ceiling support fixture.');
    }

    state.player.x = ceilingSupport.x + 24;
    state.player.y = ceilingSupport.y + ceilingSupport.height + 2;
    state.player.vx = 0;
    state.player.vy = -120;
    state.player.onGround = false;
    state.player.supportPlatformId = null;

    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBe(field.id);
    expect(state.player.y).toBe(ceilingSupport.y + ceilingSupport.height);
    expect(state.player.vy).toBe(0);

    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    state = getMutableState(session);
    expect(state.player.vy).toBeGreaterThan(0);
    expect(state.player.gravityFieldId).toBe(field.id);
    expect(state.player.y).toBeGreaterThan(ceilingSupport.y + ceilingSupport.height);
  });

  it('still inverse-jumps in forest room when the player is slightly below ceiling support', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const { field } = getNamedGravityCapsuleFixture(state, 'forest-anti-grav-canopy-room', 'forest-anti-grav-canopy-lift');
    const ceilingSupport = state.stageRuntime.platforms.find((platform: any) => platform.id === 'platform-8990-250-moving');

    if (!ceilingSupport) {
      throw new Error('Expected forest gravity-room ceiling support fixture.');
    }

    state.player.x = ceilingSupport.x + 24;
    state.player.y = ceilingSupport.y + ceilingSupport.height + 12;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = false;
    state.player.supportPlatformId = null;

    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    state = getMutableState(session);
    expect(state.player.vy).toBeGreaterThan(0);
    expect(state.player.gravityFieldId).toBe(field.id);
  });

  it('does not require a second fresh jump press after anti-grav carries the held-jump player into forest ceiling support', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const ceilingSupport = state.stageRuntime.platforms.find((platform: any) => platform.id === 'platform-8990-250-moving');

    if (!ceilingSupport) {
      throw new Error('Expected forest gravity-room ceiling support fixture.');
    }

    state.player.x = ceilingSupport.x + 24;
    state.player.y = ceilingSupport.y + ceilingSupport.height + 2;
    state.player.vx = 0;
    state.player.vy = -120;
    state.player.onGround = false;
    state.player.supportPlatformId = null;

    session.update(16, { ...defaultInputState(), jumpHeld: true });
    session.update(16, { ...defaultInputState(), jumpHeld: true });

    state = getMutableState(session);
    expect(state.player.vy).toBeGreaterThan(0);
  });

  it('inverse-jumps from forest room top shell when the player is pinned to the room roof', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const { capsule, field } = getNamedGravityCapsuleFixture(state, 'forest-anti-grav-canopy-room', 'forest-anti-grav-canopy-lift');

    state.player.x = capsule.shell.x + 40;
    state.player.y = capsule.shell.y + 4;
    state.player.vx = 0;
    state.player.vy = -120;
    state.player.onGround = false;
    state.player.supportPlatformId = null;

    session.update(16, { ...defaultInputState(), jumpHeld: true });
    session.update(16, { ...defaultInputState(), jumpHeld: true });

    state = getMutableState(session);
    expect(state.player.vy).toBeGreaterThan(0);
    expect(state.player.gravityFieldId).toBe(field.id);
    expect(state.player.y).toBeGreaterThan(capsule.shell.y + 20);
  });

  it('restores normal jumps inside disabled gravity rooms and leaves contained room walkers on normal patrol', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const support = state.stageRuntime.platforms.find((platform: any) => platform.id === 'platform-9010-480');
    const capsule = state.stageRuntime.gravityCapsules.find((entry: any) => entry.id === 'sky-anti-grav-capsule');
    const roomWalker = state.stageRuntime.enemies.find((enemy: any) => enemy.id === 'sky-room-walker-1');
    const startWalkerX = roomWalker.x;
    const startWalkerY = roomWalker.y;

    session.update(16, defaultInputState());
    state = getMutableState(session);
    const updatedWalker = state.stageRuntime.enemies.find((enemy: any) => enemy.id === 'sky-room-walker-1');
    expect(updatedWalker.x).not.toBe(startWalkerX);
    expect(updatedWalker.y).toBe(startWalkerY);

    capsule.enabled = false;
    capsule.button.activated = true;
    state.stageRuntime.enemies = [];
    state.player.x = support.x + 20;
    state.player.y = support.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    state = getMutableState(session);
    const normalJumpVy = -(640 - state.stage.world.gravity * 0.016);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.vy).toBeCloseTo(normalJumpVy, 4);
    expect(state.player.gravityFieldId).toBeNull();
  });

  it('progresses brittle warning only during occupied top support and keeps short hop gaps in one occupancy window', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const brittlePlatform = applyTerrainVariantFixture(createStaticPlatformFixture('brittle-occupancy', 2000, 520, 180), 'brittleCrystal');
    isolatePlayerPlatformFixture(state, [brittlePlatform]);

    placePlayerOnSupportedPlatform(state, brittlePlatform);
    session.update(80, defaultInputState());

    expect(brittlePlatform.brittle.phase).toBe('warning');
    const warningAfterStay = brittlePlatform.brittle.warningMs;

    session.update(80, { ...defaultInputState(), right: true });
    expect(brittlePlatform.brittle.phase).toBe('warning');
    expect(brittlePlatform.brittle.warningMs).toBeLessThan(warningAfterStay);

    const warningBeforeGap = brittlePlatform.brittle.warningMs;
    placePlayerOffPlatformSupport(state, brittlePlatform);
    session.update(40, defaultInputState());
    expect(brittlePlatform.brittle.phase).toBe('warning');
    expect(brittlePlatform.brittle.warningMs).toBe(warningBeforeGap);

    placePlayerOnSupportedPlatform(state, brittlePlatform);
    session.update(40, defaultInputState());

    expect(brittlePlatform.brittle.phase).toBe('warning');
    expect(brittlePlatform.brittle.warningMs).toBeLessThan(warningBeforeGap);
  });

  it('resets brittle warning to intact after unsupported gaps longer than hop-gap threshold before readiness', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const brittlePlatform = applyTerrainVariantFixture(createStaticPlatformFixture('brittle-reset', 2000, 520, 180), 'brittleCrystal');
    isolatePlayerPlatformFixture(state, [brittlePlatform]);

    placePlayerOnSupportedPlatform(state, brittlePlatform);
    session.update(80, defaultInputState());
    expect(brittlePlatform.brittle.phase).toBe('warning');

    placePlayerOffPlatformSupport(state, brittlePlatform);
    session.update(64, defaultInputState());

    expect(brittlePlatform.brittle.phase).toBe('intact');
    expect(brittlePlatform.brittle.warningMs).toBe(420);

    placePlayerOnSupportedPlatform(state, brittlePlatform);
    session.update(16, defaultInputState());

    expect(brittlePlatform.brittle.phase).toBe('warning');
    expect(brittlePlatform.brittle.warningMs).toBeLessThan(420);
  });

  it('starts brittle ready timer exactly when warning reaches completion', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const brittlePlatform = applyTerrainVariantFixture(createStaticPlatformFixture('brittle-ready', 2000, 520, 180), 'brittleCrystal');
    isolatePlayerPlatformFixture(state, [brittlePlatform]);

    placePlayerOnSupportedPlatform(state, brittlePlatform);
    session.update(16, defaultInputState());
    brittlePlatform.brittle.warningMs = 8;

    session.update(8, defaultInputState());
    expect(brittlePlatform.brittle.phase).toBe('ready');
    expect(brittlePlatform.brittle.readyBreakDelayMs).toBe(BRITTLE_READY_BREAK_DELAY_MS);
    expect(brittlePlatform.brittle.readyElapsedMs).toBe(0);
    expect(brittlePlatform.brittle.readyRemainingMs).toBe(BRITTLE_READY_BREAK_DELAY_MS);
  });

  it('continues brittle ready countdown while player remains supported on the same platform', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const brittlePlatform = applyTerrainVariantFixture(createStaticPlatformFixture('brittle-ready-supported', 2000, 520, 180), 'brittleCrystal');
    isolatePlayerPlatformFixture(state, [brittlePlatform]);

    placePlayerOnSupportedPlatform(state, brittlePlatform);
    session.update(16, defaultInputState());
    brittlePlatform.brittle.warningMs = 1;

    session.update(1, defaultInputState());
    expect(brittlePlatform.brittle.phase).toBe('ready');
    expect(state.player.supportPlatformId).toBe(brittlePlatform.id);

    session.update(64, defaultInputState());
    expect(brittlePlatform.brittle.phase).toBe('ready');
    expect(brittlePlatform.brittle.readyElapsedMs).toBe(64);
    expect(brittlePlatform.brittle.readyRemainingMs).toBe(BRITTLE_READY_BREAK_DELAY_MS - 64);
    expect(state.player.supportPlatformId).toBe(brittlePlatform.id);
  });

  it('breaks brittle platform on ready timer expiry without requiring leave input', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const brittlePlatform = applyTerrainVariantFixture(createStaticPlatformFixture('brittle-ready-expiry', 2000, 520, 180), 'brittleCrystal');
    isolatePlayerPlatformFixture(state, [brittlePlatform]);

    placePlayerOnSupportedPlatform(state, brittlePlatform);
    session.update(16, defaultInputState());
    brittlePlatform.brittle.warningMs = 1;

    session.update(1, defaultInputState());
    expect(brittlePlatform.brittle.phase).toBe('ready');
    expect(state.player.supportPlatformId).toBe(brittlePlatform.id);

    session.update(BRITTLE_READY_BREAK_DELAY_MS, defaultInputState());
    expect(brittlePlatform.brittle.phase).toBe('broken');
  });

  it('keeps ready brittle solid and jumpable before expiry, including landing from adjacent platform', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const sourcePlatform = createStaticPlatformFixture('brittle-ready-source', 1840, 520, 140);
    const brittlePlatform = applyTerrainVariantFixture(createStaticPlatformFixture('brittle-ready-landable', 2020, 520, 160), 'brittleCrystal');
    isolatePlayerPlatformFixture(state, [sourcePlatform, brittlePlatform]);

    placePlayerOnSupportedPlatform(state, brittlePlatform);
    session.update(16, defaultInputState());
    brittlePlatform.brittle.warningMs = 1;
    session.update(1, defaultInputState());
    expect(brittlePlatform.brittle.phase).toBe('ready');

    placePlayerOnSupportedPlatform(state, sourcePlatform);
    session.update(80, defaultInputState());
    expect(brittlePlatform.brittle.phase).toBe('ready');
    expect(brittlePlatform.brittle.readyRemainingMs).toBe(BRITTLE_READY_BREAK_DELAY_MS - 80);

    placePlayerAbovePlatform(state, brittlePlatform, 260);
    advanceSession(session, 32, 8);
    expect(state.player.onGround).toBe(true);
    expect(state.player.supportPlatformId).toBe(brittlePlatform.id);
    expect(brittlePlatform.brittle.phase).toBe('ready');

    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });
    expect(state.player.vy).toBeLessThan(0);
    expect(brittlePlatform.brittle.phase).toBe('ready');
    expect(brittlePlatform.brittle.readyRemainingMs).toBeGreaterThan(0);
  });

  it('keeps falling-platform contact-aware timing unchanged when brittle platforms are present', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    const state = getMutableState(session);
    const fallingPlatform = createRuntimeFallingPlatformFixture('falling-with-brittle', 2000, 520, 160, 300, 120, 50);
    const brittlePlatform = applyTerrainVariantFixture(createStaticPlatformFixture('brittle-sidecar', 2300, 520, 180), 'brittleCrystal');
    isolatePlayerPlatformFixture(state, [fallingPlatform, brittlePlatform]);

    placePlayerOnSupportedPlatform(state, fallingPlatform);
    session.update(120, defaultInputState());
    expect(fallingPlatform.fall.triggered).toBe(true);
    expect(fallingPlatform.fall.timerMs).toBe(300);

    placePlayerOnSupportedPlatform(state, brittlePlatform);
    session.update(64, defaultInputState());
    expect(fallingPlatform.fall.timerMs).toBe(300);

    placePlayerOnSupportedPlatform(state, fallingPlatform);
    session.update(40, defaultInputState());
    expect(fallingPlatform.fall.timerMs).toBe(260);
  });

  it('resets brittle floors from warning or broken back to the intact baseline on death respawn, checkpoint respawn, and manual restart', () => {
    const originalStage = stageDefinitions[2];
    const stageFixture = JSON.parse(JSON.stringify(originalStage));
    const fixturePlatform = stageFixture.platforms.find((platform: any) => platform.id === 'platform-10340-550');
    fixturePlatform.surfaceMechanic = { kind: 'brittleCrystal' };
    (stageDefinitions as any)[2] = stageFixture;

    try {
      const session = new GameSession();
      session.forceStartStage(2);

      let state = getMutableState(session);
      const brittlePlatform = state.stageRuntime.platforms.find((platform: any) => platform.id === 'platform-10340-550');
      const checkpoint = state.stageRuntime.checkpoints[0];

      brittlePlatform.brittle.phase = 'warning';
      brittlePlatform.brittle.warningMs = 1;
      state.player.health = 1;
      (session as any).damagePlayer();
      (session as any).respawnPlayer();

      state = getMutableState(session);
      expect(state.stageRuntime.platforms.find((platform: any) => platform.id === brittlePlatform.id).brittle.phase).toBe('intact');
      expect(state.stageRuntime.platforms.find((platform: any) => platform.id === brittlePlatform.id).brittle.warningMs).toBeGreaterThan(1);

      state.player.x = checkpoint.rect.x;
      state.player.y = checkpoint.rect.y;
      session.update(16, defaultInputState());
      state.stageRuntime.platforms.find((platform: any) => platform.id === brittlePlatform.id).brittle.phase = 'warning';
      state.stageRuntime.platforms.find((platform: any) => platform.id === brittlePlatform.id).brittle.warningMs = 1;
      (session as any).respawnPlayer();

      state = getMutableState(session);
      expect(state.stageRuntime.platforms.find((platform: any) => platform.id === brittlePlatform.id).brittle.phase).toBe('intact');
      expect(state.stageRuntime.platforms.find((platform: any) => platform.id === brittlePlatform.id).brittle.warningMs).toBeGreaterThan(1);

      state.stageRuntime.platforms.find((platform: any) => platform.id === brittlePlatform.id).brittle.phase = 'broken';
      session.restartStage();
      state = getMutableState(session);
      expect(state.stageRuntime.platforms.find((platform: any) => platform.id === brittlePlatform.id).brittle.phase).toBe('intact');
      expect(state.stageRuntime.platforms.find((platform: any) => platform.id === brittlePlatform.id).brittle.warningMs).toBeGreaterThan(1);
    } finally {
      (stageDefinitions as any)[2] = originalStage;
    }
  });

  it('reduces sticky grounded acceleration while leaving buffered and coyote jumps unchanged', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const support = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'static' && platform.width >= 180);
    const supportId = support.id;

    state.player.x = support.x + 32;
    state.player.y = support.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;
    for (let index = 0; index < 5; index += 1) {
      session.update(16, { ...defaultInputState(), right: true });
    }
    const normalVx = getMutableState(session).player.vx;

    session.forceStartStage(0);
    state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const stickySupport = state.stageRuntime.platforms.find((platform: any) => platform.id === supportId);
    applyTerrainVariantFixture(stickySupport, 'stickySludge');
    state.player.x = stickySupport.x + 32;
    state.player.y = stickySupport.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = stickySupport.id;
    for (let index = 0; index < 5; index += 1) {
      session.update(16, { ...defaultInputState(), right: true });
    }
    state = getMutableState(session);
    expect(state.player.vx).toBeLessThan(normalVx);

    session.forceStartStage(0);
    state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const bufferedStickySupport = state.stageRuntime.platforms.find((platform: any) => platform.id === supportId);
    applyTerrainVariantFixture(bufferedStickySupport, 'stickySludge');
    state.player.x = bufferedStickySupport.x + 32;
    state.player.y = bufferedStickySupport.y - state.player.height - 8;
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
    const expectedBufferedJumpVy = -(640 - state.stage.world.gravity * 0.016);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.vy).toBeCloseTo(expectedBufferedJumpVy, 4);

    state.player.onGround = false;
    state.player.supportPlatformId = null;
    state.player.coyoteMs = 100;
    state.player.vy = 0;
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });
    state = getMutableState(session);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.vy).toBeCloseTo(expectedBufferedJumpVy, 4);
  });

  it('keeps dash normal on sticky sludge and applies low gravity after the normal jump impulse', () => {
    const session = new GameSession();
    session.forceStartStage(0);

    let state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const stickySupport = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'static' && platform.width >= 180);
    const stickySupportId = stickySupport.id;

    state.progress.activePowers.dash = true;
    applyTerrainVariantFixture(stickySupport, 'stickySludge');
    state.player.x = stickySupport.x + 32;
    state.player.y = stickySupport.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = stickySupport.id;
    state.player.facing = 1;
    session.update(16, { ...defaultInputState(), dashPressed: true });
    state = getMutableState(session);
    expect(state.player.vx).toBe(520);
    expect(state.player.vy).toBe(0);

    session.forceStartStage(0);
    state = getMutableState(session);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    const lowGravityStickySupport = state.stageRuntime.platforms.find((platform: any) => platform.id === stickySupportId);
    applyTerrainVariantFixture(lowGravityStickySupport, 'stickySludge');
    state.stageRuntime.lowGravityZones = [
      {
        id: 'sticky-zone',
        x: lowGravityStickySupport.x - 20,
        y: lowGravityStickySupport.y - 220,
        width: 260,
        height: 260,
        gravityScale: 0.4,
      },
    ];
    const lowGravityZone = state.stageRuntime.lowGravityZones[0];
    state.player.x = lowGravityStickySupport.x + 32;
    state.player.y = lowGravityStickySupport.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = lowGravityStickySupport.id;
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });
    state = getMutableState(session);
    expect(state.player.gravityScale).toBe(lowGravityZone.gravityScale);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.vy).toBeCloseTo(-(640 - state.stage.world.gravity * lowGravityZone.gravityScale * 0.016), 4);
  });

  it('launches from spring platforms with authored boost, cooldown, and cue values', () => {
    const session = new GameSession();
    let state = getMutableState(session);
    const springPlatform = createSpringPlatformFixture('fixture-spring', 7240, 400, 96, 980, 260);
    isolatePlayerPlatformFixture(state, [springPlatform]);

    placePlayerAbovePlatform(state, springPlatform);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    const liveSpring = getSpringPlatform(state, springPlatform.id);
    expect(state.player.vx).toBe(0);
    expect(state.player.vy).toBe(-springPlatform.spring.boost);
    expect(liveSpring.spring.timerMs).toBe(springPlatform.spring.cooldownMs);
    expect(session.consumeCues()).toContain('spring');
  });

  it('suppresses spring auto-fire on held jump and buffered jump until a fresh contact happens', () => {
    const session = new GameSession();
    let state = getMutableState(session);
    const springPlatform = createSpringPlatformFixture('fixture-spring', 7200, 400, 180, 900, 260);
    isolatePlayerPlatformFixture(state, [springPlatform]);

    placePlayerAbovePlatform(state, springPlatform);
    session.update(16, { ...defaultInputState(), jumpHeld: true });

    state = getMutableState(session);
    expect(state.player.onGround).toBe(true);
    expect(state.player.vy).toBe(0);
    expect(state.player.springContactPlatformId).toBe(springPlatform.id);
    expect(getSpringPlatform(state, springPlatform.id).spring.timerMs).toBe(0);

    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.vy).toBe(0);
    expect(getSpringPlatform(state, springPlatform.id).spring.timerMs).toBe(0);

    placePlayerPastPlatformEdge(state, springPlatform);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.springContactPlatformId).toBeNull();

    placePlayerAbovePlatform(state, springPlatform);
    state.player.jumpBufferMs = 120;
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.springContactPlatformId).toBeNull();
    expect(getSpringPlatform(state, springPlatform.id).spring.timerMs).toBe(0);

    placePlayerPastPlatformEdge(state, springPlatform);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.springContactPlatformId).toBeNull();

    placePlayerAbovePlatform(state, springPlatform);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.vy).toBe(-springPlatform.spring.boost);
    expect(getSpringPlatform(state, springPlatform.id).spring.timerMs).toBe(springPlatform.spring.cooldownMs);
  });

  it('composes spring boosts with low gravity without damping the initial launch', () => {
    const session = new GameSession();
    let state = getMutableState(session);
    const springPlatform = createSpringPlatformFixture('fixture-spring', 9040, 480, 220, 820, 520);
    isolatePlayerPlatformFixture(state, [springPlatform]);
    state.stageRuntime.lowGravityZones = [
      {
        id: 'spring-low-gravity',
        x: springPlatform.x - 80,
        y: springPlatform.y - 220,
        width: 260,
        height: 260,
        gravityScale: 0.45,
      },
    ];
    const lowGravityZone = state.stageRuntime.lowGravityZones[0];

    placePlayerAbovePlatform(state, springPlatform);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.gravityScale).toBe(lowGravityZone.gravityScale);
    expect(state.player.vx).toBe(0);
    expect(state.player.vy).toBe(-springPlatform.spring.boost);
  });

  it('does not interrupt dash on spring contact and does not retroactively launch until a fresh contact happens', () => {
    const session = new GameSession();
    let state = getMutableState(session);
    const springPlatform = createSpringPlatformFixture('fixture-spring', 7200, 400, 180, 900, 260);
    isolatePlayerPlatformFixture(state, [springPlatform]);

    state.progress.activePowers.dash = true;
    state.player.facing = 1;
    state.player.dashTimerMs = 64;
    state.player.dashCooldownMs = 100;
    state.player.vx = 520;
    state.player.vy = 0;
    state.player.x = springPlatform.x + Math.min(springPlatform.width - 12, 12) - state.player.width / 2;
    state.player.y = springPlatform.y - state.player.height - 8;
    state.player.onGround = false;
    state.player.supportPlatformId = null;

    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.dashTimerMs).toBeGreaterThan(0);
    expect(state.player.vx).toBe(520);
    expect(state.player.vy).toBe(0);
    expect(state.player.springContactPlatformId).toBe(springPlatform.id);
    expect(getSpringPlatform(state, springPlatform.id).spring.timerMs).toBe(0);

    state.player.dashTimerMs = 0;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.y = springPlatform.y - state.player.height;
    state.player.onGround = true;
    state.player.supportPlatformId = springPlatform.id;
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.vy).toBe(0);
    expect(getSpringPlatform(state, springPlatform.id).spring.timerMs).toBe(0);

    placePlayerPastPlatformEdge(state, springPlatform);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.springContactPlatformId).toBeNull();

    placePlayerAbovePlatform(state, springPlatform);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.vy).toBe(-springPlatform.spring.boost);
  });

  it('resets spring readiness on respawn and manual restart', () => {
    withStageFixture(
      0,
      (stage) => {
        stage.platforms = [
          {
            id: 'fixture-spring',
            kind: 'spring',
            x: 7200,
            y: 400,
            width: 180,
            height: 32,
            spring: {
              boost: 900,
              cooldownMs: 260,
            },
          },
        ];
        stage.enemies = [];
        stage.checkpoints = [];
        stage.hazards = [];
      },
      () => {
        const session = new GameSession();
        session.forceStartStage(0);

        let state = getMutableState(session);
        let springPlatform = getSpringPlatform(state, 'fixture-spring');

        placePlayerAbovePlatform(state, springPlatform);
        session.update(16, defaultInputState());

        state = getMutableState(session);
        expect(getSpringPlatform(state, 'fixture-spring').spring.timerMs).toBeGreaterThan(0);

        state.player.health = 1;
        (session as any).damagePlayer();
        (session as any).respawnPlayer();

        state = getMutableState(session);
        springPlatform = getSpringPlatform(state, 'fixture-spring');
        expect(springPlatform.spring.timerMs).toBe(0);
        expect(state.player.springContactPlatformId).toBeNull();

        placePlayerAbovePlatform(state, springPlatform);
        session.update(16, defaultInputState());
        expect(getSpringPlatform(getMutableState(session), 'fixture-spring').spring.timerMs).toBeGreaterThan(0);

        session.restartStage();
        state = getMutableState(session);
        expect(getSpringPlatform(state, 'fixture-spring').spring.timerMs).toBe(0);
        expect(state.player.springContactPlatformId).toBeNull();
      },
    );
  });
});