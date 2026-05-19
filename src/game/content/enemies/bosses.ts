import type { EnemyDefinition } from '../stages/types';

export const createBossOneEnemy = (): EnemyDefinition => ({
  id: 'boss-1-core',
  kind: 'boss',
  position: { x: 560, y: 240 },
  boss: {
    health: 50,
    minIntervalMs: 520,
    maxIntervalMs: 1180,
    minMoveIntervalMs: 420,
    maxMoveIntervalMs: 980,
    runSpeed: 210,
    jumpImpulse: 980,
    left: 360,
    right: 1260,
    projectileSpeed: 390,
    shotHeights: [50, 108, 166, 220],
    powerShotChance: 0.08,
    powerShots: ['shooter', 'doubleJump'],
  },
});

export const createBossTwoEnemy = (): EnemyDefinition => ({
  id: 'boss-2-crab',
  kind: 'boss',
  position: { x: 840, y: 240 },
  boss: {
    health: 50,
    visualStyle: 'crab',
    minIntervalMs: 720,
    maxIntervalMs: 1180,
    minMoveIntervalMs: 520,
    maxMoveIntervalMs: 1120,
    runSpeed: 190,
    jumpImpulse: 900,
    left: 80,
    right: 1480,
    projectileSpeed: 0,
    shotHeights: [],
    powerShotChance: 0,
    powerShots: [],
    walkerSpawn: {
      speed: 135,
      maxAlive: 5,
      damageOnStomp: 1,
    },
  },
});
