import { describe, expect, it } from 'vitest';

import { AUDIO_CUES } from '../../audio/audioContract';
import { GameSession } from './GameSession';
import { defaultInputState } from '../input/actions';
import { TURRET_VARIANT_CONFIG } from './state';

const getMutableState = (session: GameSession) => session.getState() as any;

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

const getGravityField = (state: any, kind: 'anti-grav-stream' | 'gravity-inversion-column') => {
  const field = state.stageRuntime.gravityFields.find((candidate: any) => candidate.kind === kind);
  if (!field) {
    throw new Error(`Expected stage to include a ${kind} gravity field.`);
  }

  return field;
};

const placePlayerInsideField = (state: any, field: any, vy = 0) => {
  state.player.x = field.x + Math.min(field.width - state.player.width, 40);
  state.player.y = field.y + Math.min(field.height - state.player.height, 56);
  state.player.vx = 0;
  state.player.vy = vy;
  state.player.onGround = false;
  state.player.supportPlatformId = null;
  state.player.supportTerrainSurfaceId = null;
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

describe('GameSession regression coverage', () => {
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
    expect(session.consumeCues()).toEqual([AUDIO_CUES.hurt]);
    expect(state.player.health).toBe(1);
    expect(state.player.dead).toBe(false);
    expect(state.stageMessage).toBe('You were hit');

    state.player.invulnerableMs = 0;
    (session as any).damagePlayer();

    expect(session.consumeCues()).toEqual([AUDIO_CUES.death]);
    expect(state.player.dead).toBe(true);
    expect(state.respawnTimerMs).toBeGreaterThan(0);
    expect(state.stageMessage).toBe('Respawning...');
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

    (session as any).damagePlayer();

    expect(state.player.dead).toBe(false);
    expect(state.stageMessage).toBe('Power shield broke');
    expect(state.progress.activePowers.doubleJump).toBe(false);
    expect(state.progress.activePowers.dash).toBe(false);

    state.player.health = 1;
    state.player.invulnerableMs = 0;

    (session as any).damagePlayer();

    expect(state.player.dead).toBe(true);
    expect(state.stageMessage).toBe('Respawning...');

    advanceSession(session, state.respawnTimerMs);

    const respawned = getMutableState(session);
    expect(respawned.activeCheckpointId).toBe(checkpoint.id);
    expect(respawned.player.dead).toBe(false);
    expect(respawned.player.health).toBe(3);
    expect(respawned.player.x).toBe(checkpoint.rect.x + 12);
    expect(respawned.player.y).toBe(checkpoint.rect.y - respawned.player.height);
  });

  it('resolves stomp defeats immediately without delaying enemy removal', () => {
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

    expect(enemy.alive).toBe(false);
    expect(enemy.defeatCause).toBe('stomp');
    expect(state.player.dead).toBe(false);
    expect(state.stageMessage).toBe('Enemy stomped');
    expect(session.consumeCues()).toContain(AUDIO_CUES.stomp);
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
    expect(state.stageMessage).toBe('Enemy blasted');
    expect(session.consumeCues()).toContain(AUDIO_CUES.shootHit);
  });

  it('emits motion and danger cues only on authored movement beats', () => {
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
    expect(platformCues.length).toBeGreaterThan(0);
    expect(platformCues.length).toBeLessThan(8);

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

    expect(state.levelCompleted).toBe(true);
    expect(session.consumeCues()).toContain(AUDIO_CUES.stageClear);
  });

  it('gates non-turret enemy cues by the viewport while preserving the turret lead-margin exception', () => {
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

  it('starts objective-authored stages with a transient objective briefing', () => {
    const session = new GameSession();
    const state = getMutableState(session);

    expect(state.stageRuntime.objective).toEqual({
      kind: 'restoreBeacon',
      target: { kind: 'checkpoint', id: 'cp-6' },
      completed: false,
    });
    expect(state.stageMessage).toBe('Objective: restore the survey beacon');
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

    expect(state.levelCompleted).toBe(true);
    expect(state.stageRuntime.exitReached).toBe(true);
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
    expect(restarted.stageMessage).toBe('Objective: restore the survey beacon');
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

  it('keeps spring boosts, launcher impulses, sludge jumps, and falling-platform escape timing intact inside gravity fields', () => {
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
    const { launcherEntry: gasVent, supportPlatform } = getLauncher(state, 'gasVent');
    const stickySurface = state.stageRuntime.terrainSurfaces.find((surface: any) => surface.kind === 'stickySludge');
    const antiGravField = getGravityField(state, 'anti-grav-stream');

    expect(stickySurface.supportPlatformId).toBe(gasVent.supportPlatformId);
    expect(antiGravField.x).toBeLessThan(gasVent.x + gasVent.width);
    placePlayerAboveLauncher(state, gasVent, supportPlatform);
    session.update(16, defaultInputState());

    state = getMutableState(session);
    expect(state.player.vx).toBeCloseTo(gasVent.direction.x * gasVent.impulse, 5);
    expect(state.player.vy).toBeCloseTo(gasVent.direction.y * gasVent.impulse, 5);

    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBe(antiGravField.id);

    state.player.x = stickySurface.x + 20;
    state.player.y = supportPlatform.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = supportPlatform.id;
    state.player.supportTerrainSurfaceId = stickySurface.id;
    session.update(16, { ...defaultInputState(), jumpHeld: true, jumpPressed: true });

    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBe(antiGravField.id);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.vy).toBeGreaterThan(-640);

    session.forceStartStage(0);
    state = getMutableState(session);
    const fallingPlatform = state.stageRuntime.platforms.find((platform: any) => platform.kind === 'falling');
    state.stageRuntime.gravityFields = [
      {
        id: 'falling-inversion',
        kind: 'gravity-inversion-column',
        x: fallingPlatform.x - 20,
        y: fallingPlatform.y - 240,
        width: 320,
        height: 280,
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
    expect(state.player.gravityFieldKind).toBe('gravity-inversion-column');
    expect(state.player.vy).toBeLessThan(-640);
    expect(state.player.supportPlatformId).toBeNull();
  });

  it('keeps gravity fields stateless across respawn, checkpoint respawn, and manual restart', () => {
    const session = new GameSession();
    session.forceStartStage(2);

    let state = getMutableState(session);
    const antiGravField = getGravityField(state, 'anti-grav-stream');
    const checkpoint = state.stageRuntime.checkpoints.find((entry: any) => entry.id === 'cp-5');
    if (!checkpoint) {
      throw new Error('Expected Halo Spire checkpoint fixture.');
    }

    placePlayerInsideField(state, antiGravField);
    session.update(16, defaultInputState());
    state = getMutableState(session);
    expect(state.player.gravityFieldId).toBe(antiGravField.id);

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
    expect(state.player.gravityFieldId).toBeNull();
    expect(state.player.gravityFieldKind).toBeNull();
    expect(state.player.gravityScale).toBe(1);

    session.restartStage();
    state = getMutableState(session);
    expect(state.stageRuntime.gravityFields.map((field: any) => field.id)).toEqual([
      'sky-anti-grav-stream',
      'sky-gravity-inversion-column',
    ]);
    expect(state.player.gravityFieldId).toBeNull();
    expect(state.player.gravityFieldKind).toBeNull();
    expect(state.player.gravityScale).toBe(1);
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
    state.stageRuntime.lowGravityZones = [
      {
        id: 'launcher-low-gravity',
        x: gasVent.x - 80,
        y: gasVent.y - 220,
        width: 260,
        height: 260,
        gravityScale: 0.45,
      },
    ];
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