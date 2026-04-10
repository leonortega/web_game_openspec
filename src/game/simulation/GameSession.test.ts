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

const getMutableState = (session: GameSession) => session.getState() as any;

const getCoinRewardBlock = (state: any) => {
  const rewardBlock = state.stageRuntime.rewardBlocks.find((block: any) => block.reward.kind === 'coins');
  if (!rewardBlock) {
    throw new Error('Expected stage to include a coin reward block.');
  }
  return rewardBlock;
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
});