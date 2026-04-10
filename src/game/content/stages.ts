import type {
  EnemyKind,
  HazardKind,
  PlatformKind,
  Rect,
  RewardDefinition,
  Vector2,
} from '../simulation/state';

export type PlatformDefinition = Rect & {
  id: string;
  kind: PlatformKind;
  move?: { axis: 'x' | 'y'; range: number; speed: number };
  fall?: { triggerDelayMs: number };
  spring?: { boost: number; cooldownMs: number };
};

export type EnemyDefinition = {
  id: string;
  kind: EnemyKind;
  position: Vector2;
  patrol?: { left: number; right: number; speed: number };
  hop?: { intervalMs: number; impulse: number; speed: number };
  turret?: { intervalMs: number };
  charger?: { left: number; right: number; patrolSpeed: number; chargeSpeed: number; windupMs: number; cooldownMs: number };
  flyer?: { left: number; right: number; speed: number; bobAmp: number; bobSpeed: number };
};

export type RewardBlockDefinition = Rect & {
  id: string;
  reward: RewardDefinition;
};

export type StageDefinition = {
  id: string;
  name: string;
  targetDurationMinutes: number;
  segments: {
    id: string;
    title: string;
    startX: number;
    endX: number;
    focus: string;
  }[];
  palette: {
    skyTop: number;
    skyBottom: number;
    accent: number;
    ground: number;
  };
  world: {
    width: number;
    height: number;
    gravity: number;
  };
  playerSpawn: Vector2;
  platforms: PlatformDefinition[];
  checkpoints: { id: string; rect: Rect }[];
  collectibles: { id: string; position: Vector2 }[];
  rewardBlocks: RewardBlockDefinition[];
  hazards: { id: string; kind: HazardKind; rect: Rect }[];
  enemies: EnemyDefinition[];
  exit: Rect;
  hint: string;
};

const ground = (x: number, y: number, width: number, height = 32): PlatformDefinition => ({
  id: `platform-${x}-${y}`,
  kind: 'static',
  x,
  y,
  width,
  height,
});

const moving = (
  x: number,
  y: number,
  width: number,
  height: number,
  axis: 'x' | 'y',
  range: number,
  speed: number,
): PlatformDefinition => ({
  id: `platform-${x}-${y}-moving`,
  kind: 'moving',
  x,
  y,
  width,
  height,
  move: { axis, range, speed },
});

const falling = (x: number, y: number, width: number, height = 32, triggerDelayMs = 650): PlatformDefinition => ({
  id: `platform-${x}-${y}-falling`,
  kind: 'falling',
  x,
  y,
  width,
  height,
  fall: { triggerDelayMs },
});

const spring = (x: number, y: number, width: number, height = 32, boost = 860): PlatformDefinition => ({
  id: `platform-${x}-${y}-spring`,
  kind: 'spring',
  x,
  y,
  width,
  height,
  spring: { boost, cooldownMs: 350 },
});

const rewardBlock = (
  id: string,
  x: number,
  y: number,
  reward: RewardDefinition,
  width = 40,
  height = 40,
): RewardBlockDefinition => ({
  id,
  x,
  y,
  width,
  height,
  reward,
});

const BLOCK_CLEARANCE_ABOVE_FLOOR = 72;
const GROUND_STOMP_ENEMY_KINDS: EnemyDefinition['kind'][] = ['walker', 'hopper', 'charger'];
const IMMEDIATE_ROUTE_ENEMY_KINDS: EnemyDefinition['kind'][] = ['walker', 'hopper', 'charger', 'turret'];
const POWER_PICKUP_ESCAPE_DISTANCE = 150;
const POWER_PICKUP_SUPPORT_GAP = 56;
const POWER_PICKUP_SUPPORT_HEIGHT_TOLERANCE = 96;

type StageExtension = {
  targetDurationMinutes: number;
  worldWidth: number;
  segments: StageDefinition['segments'];
  platforms: PlatformDefinition[];
  checkpoints: StageDefinition['checkpoints'];
  collectibles: StageDefinition['collectibles'];
  rewardBlocks: RewardBlockDefinition[];
  hazards: StageDefinition['hazards'];
  enemies: EnemyDefinition[];
  exit: Rect;
  hint: string;
};

const blockCenterX = (block: RewardBlockDefinition): number => block.x + block.width / 2;

const findSupportBelow = (
  platforms: PlatformDefinition[],
  block: RewardBlockDefinition,
): PlatformDefinition | null => {
  const centerX = blockCenterX(block);
  const blockBottom = block.y + block.height;
  return (
    platforms
      .filter(
        (platform) =>
          centerX >= platform.x &&
          centerX <= platform.x + platform.width &&
          platform.y >= blockBottom,
      )
      .sort((left, right) => left.y - right.y)[0] ?? null
  );
};

const findSupportBelowSpan = (
  platforms: PlatformDefinition[],
  x: number,
  width: number,
  bottom: number,
): PlatformDefinition | null => {
  const centerX = x + width / 2;
  return (
    platforms
      .filter(
        (platform) =>
          centerX >= platform.x &&
          centerX <= platform.x + platform.width &&
          platform.y >= bottom,
      )
      .sort((left, right) => left.y - right.y)[0] ?? null
  );
};

const repositionRewardBlock = (
  block: RewardBlockDefinition,
  platforms: PlatformDefinition[],
  fallbackY: number,
): RewardBlockDefinition => {
  const support = findSupportBelow(platforms, block);
  if (!support) {
    return block;
  }

  const targetY = support.y - block.height - BLOCK_CLEARANCE_ABOVE_FLOOR;
  return {
    ...block,
    y: fallbackY <= targetY ? fallbackY : targetY,
  };
};

const normalizeRewardBlocks = (
  platforms: PlatformDefinition[],
  blocks: RewardBlockDefinition[],
): RewardBlockDefinition[] => blocks.map((block) => repositionRewardBlock(block, platforms, block.y));

const enemyRect = (enemy: EnemyDefinition): Rect => ({
  x: enemy.position.x,
  y: enemy.position.y,
  width: enemy.kind === 'turret' ? 28 : 34,
  height: enemy.kind === 'turret' ? 38 : enemy.kind === 'flyer' ? 24 : 30,
});

const intersectsRect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

const isImmediateContinuationSupport = (
  blockSupport: PlatformDefinition,
  candidateSupport: PlatformDefinition,
): boolean => {
  if (blockSupport.id === candidateSupport.id) {
    return true;
  }

  const horizontalGap =
    candidateSupport.x > blockSupport.x + blockSupport.width
      ? candidateSupport.x - (blockSupport.x + blockSupport.width)
      : blockSupport.x > candidateSupport.x + candidateSupport.width
        ? blockSupport.x - (candidateSupport.x + candidateSupport.width)
        : 0;

  return (
    horizontalGap <= POWER_PICKUP_SUPPORT_GAP &&
    Math.abs(candidateSupport.y - blockSupport.y) <= POWER_PICKUP_SUPPORT_HEIGHT_TOLERANCE
  );
};

const isBlockingRectAheadOfRewardBlock = (
  block: RewardBlockDefinition,
  rect: Rect,
): boolean => {
  const blockRight = block.x + block.width;
  const forwardGap = rect.x - blockRight;
  return rect.x >= block.x - 16 && forwardGap <= POWER_PICKUP_ESCAPE_DISTANCE && rect.x + rect.width > block.x;
};

const isBlockingHazardRoute = (
  stage: StageDefinition,
  block: RewardBlockDefinition,
  blockSupport: PlatformDefinition,
): boolean =>
  stage.hazards.some((hazard) => {
    const hazardSupport = findSupportBelowSpan(stage.platforms, hazard.rect.x, hazard.rect.width, hazard.rect.y + hazard.rect.height);
    if (!hazardSupport || !isImmediateContinuationSupport(blockSupport, hazardSupport)) {
      return false;
    }

    return isBlockingRectAheadOfRewardBlock(block, hazard.rect);
  });

const isBlockingEnemyRoute = (
  stage: StageDefinition,
  block: RewardBlockDefinition,
  blockSupport: PlatformDefinition,
): boolean =>
  stage.enemies.some((enemy) => {
    if (!IMMEDIATE_ROUTE_ENEMY_KINDS.includes(enemy.kind)) {
      return false;
    }

    const enemyBounds = enemyRect(enemy);
    if (!isBlockingRectAheadOfRewardBlock(block, enemyBounds)) {
      return false;
    }

    const enemySupport = findSupportBelowSpan(stage.platforms, enemyBounds.x, enemyBounds.width, enemyBounds.y + enemyBounds.height);
    return Boolean(enemySupport && isImmediateContinuationSupport(blockSupport, enemySupport));
  });

const isRewardBlockLockedByEnemy = (stage: StageDefinition, block: RewardBlockDefinition): boolean => {
  const blockSupport = findSupportBelowSpan(stage.platforms, block.x, block.width, block.y + block.height);
  if (!blockSupport) {
    return false;
  }

  return stage.enemies.some((enemy) => {
    if (!GROUND_STOMP_ENEMY_KINDS.includes(enemy.kind)) {
      return false;
    }

    const enemyBounds = enemyRect(enemy);
    const enemySupport = findSupportBelowSpan(stage.platforms, enemyBounds.x, enemyBounds.width, enemyBounds.y + enemyBounds.height);
    if (!enemySupport || enemySupport.id !== blockSupport.id) {
      return false;
    }

    const horizontalOverlap = Math.min(block.x + block.width, enemyBounds.x + enemyBounds.width) - Math.max(block.x, enemyBounds.x);
    const verticalGap = Math.abs(block.y + block.height - enemyBounds.y);
    return horizontalOverlap > 0 && verticalGap <= 96;
  });
};

const isRewardBlockForcedHitRoute = (stage: StageDefinition, block: RewardBlockDefinition): boolean => {
  const blockSupport = findSupportBelowSpan(stage.platforms, block.x, block.width, block.y + block.height);
  if (!blockSupport) {
    return false;
  }

  return isBlockingEnemyRoute(stage, block, blockSupport) || isBlockingHazardRoute(stage, block, blockSupport);
};

const validateRewardBlocks = (stage: StageDefinition): StageDefinition => {
  const lockedBlocks = stage.rewardBlocks.filter((block) => isRewardBlockLockedByEnemy(stage, block));
  const forcedHitBlocks = stage.rewardBlocks.filter((block) => isRewardBlockForcedHitRoute(stage, block));
  if (lockedBlocks.length > 0) {
    throw new Error(
      `Reward blocks cannot sit over stompable grounded enemies: ${lockedBlocks.map((block) => block.id).join(', ')}`,
    );
  }
  if (forcedHitBlocks.length > 0) {
    throw new Error(
      `Reward block routes cannot force immediate enemy damage after pickup: ${forcedHitBlocks
        .map((block) => block.id)
        .join(', ')}`,
    );
  }

  return stage;
};

const authoredStaticElements = (
  stage: StageDefinition,
): { id: string; rect: Rect; category: 'checkpoint' | 'collectible' | 'rewardBlock' | 'exit' }[] => [
  ...stage.checkpoints.map((checkpoint) => ({ id: checkpoint.id, rect: checkpoint.rect, category: 'checkpoint' as const })),
  ...stage.collectibles.map((collectible) => ({
    id: collectible.id,
    rect: { x: collectible.position.x - 12, y: collectible.position.y - 12, width: 24, height: 24 },
    category: 'collectible' as const,
  })),
  ...stage.rewardBlocks.map((rewardBlock) => ({ id: rewardBlock.id, rect: rewardBlock, category: 'rewardBlock' as const })),
  { id: 'exit', rect: stage.exit, category: 'exit' as const },
];

const validateStaticElementCollisions = (stage: StageDefinition): StageDefinition => {
  const statics = authoredStaticElements(stage);
  const collisions: string[] = [];

  for (let index = 0; index < statics.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < statics.length; nextIndex += 1) {
      const current = statics[index];
      const next = statics[nextIndex];
      if (intersectsRect(current.rect, next.rect)) {
        collisions.push(`${current.id}<->${next.id}`);
      }
    }
  }

  if (collisions.length > 0) {
    throw new Error(`Static stage elements cannot overlap: ${collisions.join(', ')}`);
  }

  return stage;
};

const applyStageExtension = (stage: StageDefinition, extension: StageExtension): StageDefinition => {
  const platforms = [...stage.platforms, ...extension.platforms];
  return {
    ...stage,
    targetDurationMinutes: extension.targetDurationMinutes,
    segments: [...stage.segments, ...extension.segments],
    world: {
      ...stage.world,
      width: extension.worldWidth,
    },
    platforms,
    checkpoints: [...stage.checkpoints, ...extension.checkpoints],
    collectibles: [...stage.collectibles, ...extension.collectibles],
    rewardBlocks: normalizeRewardBlocks(platforms, [...stage.rewardBlocks, ...extension.rewardBlocks]),
    hazards: [...stage.hazards, ...extension.hazards],
    enemies: [...stage.enemies, ...extension.enemies],
    exit: extension.exit,
    hint: extension.hint,
  };
};

const baseStageDefinitions: StageDefinition[] = [
  {
    id: 'forest-ruins',
    name: 'Forest Ruins',
    targetDurationMinutes: 10,
    segments: [
      { id: 'approach', title: 'Outer Approach', startX: 0, endX: 1500, focus: 'warm-up traversal' },
      { id: 'shrine', title: 'Broken Shrine', startX: 1500, endX: 3100, focus: 'hazard ladders' },
      { id: 'aqueduct', title: 'Old Aqueduct', startX: 3100, endX: 4700, focus: 'checkpoint recovery' },
      { id: 'gauntlet', title: 'Thorn Gauntlet', startX: 4700, endX: 6500, focus: 'enemy pressure' },
      { id: 'spire', title: 'Gate Spire', startX: 6500, endX: 8100, focus: 'final ascent' },
    ],
    palette: {
      skyTop: 0x284b4f,
      skyBottom: 0x101f1d,
      accent: 0xf5cf64,
      ground: 0x4e7351,
    },
    world: { width: 8100, height: 720, gravity: 1800 },
    playerSpawn: { x: 110, y: 520 },
    platforms: [
      ground(0, 620, 420),
      ground(510, 575, 170),
      ground(760, 525, 180),
      ground(1020, 470, 190),
      ground(1290, 540, 220),
      moving(1610, 600, 240, 32, 'x', 120, 80),
      ground(1920, 540, 180),
      ground(2180, 495, 180),
      ground(2440, 450, 210),
      ground(2720, 520, 220),
      ground(3040, 590, 250),
      falling(3370, 535, 190),
      ground(3630, 470, 180),
      ground(3890, 420, 190),
      ground(4170, 485, 200),
      ground(4450, 560, 220),
      ground(4770, 610, 220),
      ground(5060, 540, 170),
      ground(5300, 470, 180),
      ground(5560, 530, 180),
      ground(5820, 450, 200),
      ground(6100, 520, 200),
      ground(6380, 590, 220),
      spring(6680, 520, 180),
      ground(6940, 460, 180),
      ground(7200, 400, 180),
      ground(7460, 470, 200),
      ground(7750, 540, 220),
    ],
    checkpoints: [
      { id: 'cp-1', rect: { x: 1420, y: 460, width: 24, height: 80 } },
      { id: 'cp-2', rect: { x: 3090, y: 510, width: 24, height: 80 } },
      { id: 'cp-3', rect: { x: 5130, y: 460, width: 24, height: 80 } },
      { id: 'cp-4', rect: { x: 6430, y: 510, width: 24, height: 80 } },
    ],
    collectibles: [
      { id: 'crystal-1', position: { x: 820, y: 470 } },
      { id: 'crystal-2', position: { x: 2470, y: 400 } },
      { id: 'crystal-3', position: { x: 3520, y: 420 } },
      { id: 'crystal-4', position: { x: 4620, y: 520 } },
      { id: 'crystal-5', position: { x: 5880, y: 400 } },
      { id: 'crystal-6', position: { x: 7240, y: 350 } },
      { id: 'crystal-7', position: { x: 7830, y: 490 } },
    ],
    rewardBlocks: [
      rewardBlock('forest-coin-1', 560, 470, { kind: 'coins', amount: 2 }),
      rewardBlock('forest-double-jump', 2190, 390, { kind: 'power', power: 'doubleJump' }),
      rewardBlock('forest-coin-2', 3435, 410, { kind: 'coins', amount: 2 }),
      rewardBlock('forest-dash', 6700, 465, { kind: 'power', power: 'dash' }),
    ],
    hazards: [
      { id: 'spikes-1', kind: 'spikes', rect: { x: 175, y: 604, width: 70, height: 16 } },
      { id: 'spikes-2', kind: 'spikes', rect: { x: 2520, y: 434, width: 40, height: 16 } },
      { id: 'spikes-3', kind: 'spikes', rect: { x: 3705, y: 454, width: 30, height: 16 } },
      { id: 'spikes-4', kind: 'spikes', rect: { x: 5860, y: 434, width: 30, height: 16 } },
      { id: 'spikes-5', kind: 'spikes', rect: { x: 7260, y: 384, width: 60, height: 16 } },
    ],
    enemies: [
      {
        id: 'walker-1',
        kind: 'walker',
        position: { x: 1030, y: 438 },
        patrol: { left: 1020, right: 1210, speed: 90 },
      },
      {
        id: 'hopper-1',
        kind: 'hopper',
        position: { x: 1930, y: 512 },
        hop: { intervalMs: 1400, impulse: 820, speed: 110 },
      },
      {
        id: 'flyer-1',
        kind: 'flyer',
        position: { x: 3530, y: 360 },
        flyer: { left: 3430, right: 3920, speed: 95, bobAmp: 22, bobSpeed: 4.2 },
      },
      {
        id: 'walker-2',
        kind: 'walker',
        position: { x: 2500, y: 418 },
        patrol: { left: 2440, right: 2650, speed: 100 },
      },
      {
        id: 'hopper-2',
        kind: 'hopper',
        position: { x: 4210, y: 453 },
        hop: { intervalMs: 1250, impulse: 860, speed: 120 },
      },
      {
        id: 'turret-1',
        kind: 'turret',
        position: { x: 5418, y: 432 },
        turret: { intervalMs: 1900 },
      },
      {
        id: 'walker-3',
        kind: 'walker',
        position: { x: 6110, y: 488 },
        patrol: { left: 6100, right: 6300, speed: 110 },
      },
      {
        id: 'charger-1',
        kind: 'charger',
        position: { x: 6980, y: 430 },
        charger: { left: 6940, right: 7120, patrolSpeed: 65, chargeSpeed: 280, windupMs: 500, cooldownMs: 900 },
      },
      {
        id: 'hopper-3',
        kind: 'hopper',
        position: { x: 7470, y: 438 },
        hop: { intervalMs: 1200, impulse: 900, speed: 130 },
      },
    ],
    exit: { x: 7990, y: 460, width: 40, height: 80 },
    hint: 'Five segments, four checkpoints. Push through the outer ruins to the gate spire.',
  },
  {
    id: 'amber-cavern',
    name: 'Amber Cavern',
    targetDurationMinutes: 10,
    segments: [
      { id: 'mouth', title: 'Cavern Mouth', startX: 0, endX: 1450, focus: 'intro hazards' },
      { id: 'lifts', title: 'Ore Lifts', startX: 1450, endX: 3050, focus: 'vertical traversal' },
      { id: 'forge', title: 'Forge Tunnels', startX: 3050, endX: 4700, focus: 'hazard timing' },
      { id: 'barracks', title: 'Stone Barracks', startX: 4700, endX: 6400, focus: 'mixed encounters' },
      { id: 'heart', title: 'Amber Heart', startX: 6400, endX: 8200, focus: 'turret gauntlet' },
    ],
    palette: {
      skyTop: 0x492f26,
      skyBottom: 0x120d0a,
      accent: 0xffac4a,
      ground: 0x755a3a,
    },
    world: { width: 8200, height: 720, gravity: 1850 },
    playerSpawn: { x: 90, y: 560 },
    platforms: [
      ground(0, 620, 420),
      ground(500, 560, 180),
      ground(760, 510, 180),
      ground(1020, 460, 180),
      ground(1280, 410, 220),
      moving(1590, 470, 180, 32, 'y', 90, 70),
      ground(1850, 540, 180),
      ground(2110, 480, 200),
      ground(2390, 420, 180),
      ground(2650, 350, 180),
      ground(2910, 430, 190),
      ground(3190, 520, 220),
      ground(3490, 580, 240),
      ground(3800, 520, 190),
      ground(4070, 450, 190),
      falling(4350, 390, 200, 32, 700),
      ground(4630, 460, 180),
      ground(4890, 530, 220),
      ground(5200, 590, 230),
      ground(5510, 520, 180),
      ground(5770, 460, 180),
      ground(6030, 400, 200),
      ground(6310, 470, 180),
      spring(6570, 540, 220, 32, 900),
      ground(6880, 600, 220),
      ground(7170, 530, 190),
      ground(7440, 470, 180),
      ground(7700, 420, 180),
      ground(7960, 500, 180),
    ],
    checkpoints: [
      { id: 'cp-1', rect: { x: 1310, y: 330, width: 24, height: 80 } },
      { id: 'cp-2', rect: { x: 3510, y: 500, width: 24, height: 80 } },
      { id: 'cp-3', rect: { x: 5200, y: 510, width: 24, height: 80 } },
      { id: 'cp-4', rect: { x: 6910, y: 520, width: 24, height: 80 } },
    ],
    collectibles: [
      { id: 'amber-1', position: { x: 530, y: 500 } },
      { id: 'amber-2', position: { x: 1280, y: 360 } },
      { id: 'amber-3', position: { x: 2650, y: 300 } },
      { id: 'amber-4', position: { x: 3570, y: 540 } },
      { id: 'amber-5', position: { x: 4360, y: 340 } },
      { id: 'amber-6', position: { x: 5510, y: 470 } },
      { id: 'amber-7', position: { x: 6325, y: 340 } },
      { id: 'amber-8', position: { x: 7730, y: 360 } },
    ],
    rewardBlocks: [
      rewardBlock('amber-coin-1', 1090, 410, { kind: 'coins', amount: 2 }),
      rewardBlock('amber-shooter', 2425, 360, { kind: 'power', power: 'shooter' }),
      rewardBlock('amber-coin-2', 4670, 395, { kind: 'coins', amount: 3 }),
    ],
    hazards: [
      { id: 'spikes-1', kind: 'spikes', rect: { x: 180, y: 604, width: 60, height: 16 } },
      { id: 'spikes-forge-1', kind: 'spikes', rect: { x: 2695, y: 334, width: 72, height: 16 } },
      { id: 'spikes-2', kind: 'spikes', rect: { x: 3880, y: 504, width: 60, height: 16 } },
      { id: 'spikes-barracks-1', kind: 'spikes', rect: { x: 4960, y: 514, width: 80, height: 16 } },
      { id: 'spikes-3', kind: 'spikes', rect: { x: 6380, y: 454, width: 40, height: 16 } },
      { id: 'spikes-heart-1', kind: 'spikes', rect: { x: 7235, y: 514, width: 60, height: 16 } },
    ],
    enemies: [
      {
        id: 'walker-1',
        kind: 'walker',
        position: { x: 540, y: 530 },
        patrol: { left: 508, right: 672, speed: 100 },
      },
      {
        id: 'hopper-1',
        kind: 'hopper',
        position: { x: 1910, y: 510 },
        hop: { intervalMs: 1250, impulse: 860, speed: 110 },
      },
      {
        id: 'turret-1',
        kind: 'turret',
        position: { x: 3338, y: 482 },
        turret: { intervalMs: 1800 },
      },
      {
        id: 'walker-2',
        kind: 'walker',
        position: { x: 4090, y: 420 },
        patrol: { left: 4082, right: 4248, speed: 105 },
      },
      {
        id: 'hopper-2',
        kind: 'hopper',
        position: { x: 4935, y: 500 },
        hop: { intervalMs: 1300, impulse: 900, speed: 120 },
      },
      {
        id: 'turret-2',
        kind: 'turret',
        position: { x: 6116, y: 362 },
        turret: { intervalMs: 1600 },
      },
      {
        id: 'charger-1',
        kind: 'charger',
        position: { x: 7460, y: 440 },
        charger: { left: 7440, right: 7620, patrolSpeed: 70, chargeSpeed: 300, windupMs: 520, cooldownMs: 950 },
      },
      {
        id: 'walker-3',
        kind: 'walker',
        position: { x: 7215, y: 500 },
        patrol: { left: 7178, right: 7352, speed: 110 },
      },
      {
        id: 'flyer-1',
        kind: 'flyer',
        position: { x: 7420, y: 360 },
        flyer: { left: 7310, right: 7950, speed: 105, bobAmp: 24, bobSpeed: 4.6 },
      },
      {
        id: 'turret-3',
        kind: 'turret',
        position: { x: 7776, y: 382 },
        turret: { intervalMs: 1400 },
      },
    ],
    exit: { x: 8090, y: 420, width: 44, height: 80 },
    hint: 'Long-form cavern run. Checkpoints divide the ore lifts, forge, barracks, and heart chamber.',
  },
  {
    id: 'sky-sanctum',
    name: 'Sky Sanctum',
    targetDurationMinutes: 11,
    segments: [
      { id: 'stairs', title: 'Cloud Stairs', startX: 0, endX: 1550, focus: 'opening precision' },
      { id: 'gallery', title: 'Wind Gallery', startX: 1550, endX: 3300, focus: 'recovery and ascent' },
      { id: 'bridges', title: 'Shattered Bridges', startX: 3300, endX: 5000, focus: 'gap pressure' },
      { id: 'orbits', title: 'Orbital Bastion', startX: 5000, endX: 6800, focus: 'turret lanes' },
      { id: 'summit', title: 'Sanctum Summit', startX: 6800, endX: 8800, focus: 'endurance finale' },
    ],
    palette: {
      skyTop: 0x476f93,
      skyBottom: 0x111827,
      accent: 0xc4f1ff,
      ground: 0x8ca6bf,
    },
    world: { width: 8800, height: 720, gravity: 1780 },
    playerSpawn: { x: 90, y: 570 },
    platforms: [
      ground(0, 630, 340),
      ground(420, 560, 170),
      ground(680, 500, 180),
      ground(950, 430, 180),
      ground(1220, 500, 170),
      ground(1480, 420, 180),
      moving(1750, 350, 180, 32, 'x', 140, 90),
      ground(2020, 430, 170),
      ground(2280, 520, 190),
      ground(2570, 450, 180),
      ground(2830, 390, 180),
      ground(3090, 470, 180),
      ground(3360, 550, 210),
      ground(3660, 490, 180),
      ground(3920, 420, 180),
      ground(4180, 350, 190),
      ground(4460, 430, 180),
      ground(4720, 520, 180),
      ground(4990, 600, 210),
      ground(5290, 530, 180),
      ground(5550, 460, 180),
      moving(5810, 390, 180, 32, 'y', 100, 80),
      ground(6070, 330, 180),
      ground(6330, 400, 180),
      ground(6590, 470, 180),
      ground(6850, 540, 200),
      ground(7140, 470, 180),
      ground(7400, 400, 180),
      falling(7660, 330, 180, 32, 650),
      ground(7920, 410, 180),
      ground(8180, 500, 190),
      ground(8460, 590, 220),
    ],
    checkpoints: [
      { id: 'cp-1', rect: { x: 1240, y: 420, width: 24, height: 80 } },
      { id: 'cp-2', rect: { x: 3380, y: 470, width: 24, height: 80 } },
      { id: 'cp-3', rect: { x: 5030, y: 520, width: 24, height: 80 } },
      { id: 'cp-4', rect: { x: 6890, y: 460, width: 24, height: 80 } },
    ],
    collectibles: [
      { id: 'sky-1', position: { x: 450, y: 500 } },
      { id: 'sky-2', position: { x: 980, y: 370 } },
      { id: 'sky-3', position: { x: 1760, y: 290 } },
      { id: 'sky-4', position: { x: 2850, y: 330 } },
      { id: 'sky-5', position: { x: 4180, y: 290 } },
      { id: 'sky-6', position: { x: 5570, y: 410 } },
      { id: 'sky-7', position: { x: 6090, y: 270 } },
      { id: 'sky-8', position: { x: 7680, y: 270 } },
      { id: 'sky-9', position: { x: 8510, y: 540 } },
    ],
    rewardBlocks: [
      rewardBlock('sky-invincible', 1740, 300, { kind: 'power', power: 'invincible' }),
      rewardBlock('sky-coin-1', 3450, 500, { kind: 'coins', amount: 2 }),
      rewardBlock('sky-coin-2', 6950, 490, { kind: 'coins', amount: 3 }),
    ],
    hazards: [
      { id: 'spikes-3', kind: 'spikes', rect: { x: 475, y: 544, width: 60, height: 16 } },
      { id: 'spikes-4', kind: 'spikes', rect: { x: 2071, y: 414, width: 68, height: 16 } },
      { id: 'spikes-5', kind: 'spikes', rect: { x: 3730, y: 474, width: 40, height: 16 } },
      { id: 'spikes-6', kind: 'spikes', rect: { x: 6400, y: 384, width: 40, height: 16 } },
      { id: 'spikes-7', kind: 'spikes', rect: { x: 7990, y: 394, width: 40, height: 16 } },
    ],
    enemies: [
      {
        id: 'walker-1',
        kind: 'walker',
        position: { x: 735, y: 468 },
        patrol: { left: 680, right: 820, speed: 100 },
      },
      {
        id: 'hopper-1',
        kind: 'hopper',
        position: { x: 1510, y: 388 },
        hop: { intervalMs: 1200, impulse: 900, speed: 130 },
      },
      {
        id: 'flyer-1',
        kind: 'flyer',
        position: { x: 1930, y: 300 },
        flyer: { left: 1770, right: 2440, speed: 110, bobAmp: 26, bobSpeed: 5.2 },
      },
      {
        id: 'turret-1',
        kind: 'turret',
        position: { x: 2646, y: 412 },
        turret: { intervalMs: 1500 },
      },
      {
        id: 'walker-2',
        kind: 'walker',
        position: { x: 3940, y: 388 },
        patrol: { left: 3920, right: 4100, speed: 110 },
      },
      {
        id: 'hopper-2',
        kind: 'hopper',
        position: { x: 5320, y: 498 },
        hop: { intervalMs: 1200, impulse: 940, speed: 135 },
      },
      {
        id: 'turret-2',
        kind: 'turret',
        position: { x: 6146, y: 292 },
        turret: { intervalMs: 1450 },
      },
      {
        id: 'turret-3',
        kind: 'turret',
        position: { x: 7216, y: 432 },
        turret: { intervalMs: 1400 },
      },
      {
        id: 'charger-1',
        kind: 'charger',
        position: { x: 8210, y: 470 },
        charger: { left: 8180, right: 8370, patrolSpeed: 72, chargeSpeed: 320, windupMs: 500, cooldownMs: 900 },
      },
      {
        id: 'walker-3',
        kind: 'walker',
        position: { x: 7420, y: 368 },
        patrol: { left: 7400, right: 7580, speed: 110 },
      },
      {
        id: 'turret-4',
        kind: 'turret',
        position: { x: 8556, y: 552 },
        turret: { intervalMs: 1400 },
      },
    ],
    exit: { x: 8600, y: 510, width: 48, height: 80 },
    hint: 'The sanctum now unfolds across five long ascent segments with repeated recovery points.',
  },
];

const forestRuinsExtension: StageExtension = {
  targetDurationMinutes: 20,
  worldWidth: 12050,
  segments: [
    { id: 'vault', title: 'Sunken Vault', startX: 8100, endX: 9280, focus: 'reset jumps and late hazards' },
    { id: 'canopy', title: 'Thorn Canopy', startX: 9280, endX: 10640, focus: 'mixed enemy pressure' },
    { id: 'citadel', title: 'Citadel Rise', startX: 10640, endX: 12050, focus: 'extended final ascent' },
  ],
  platforms: [
    ground(8060, 590, 220),
    ground(8350, 520, 180),
    moving(8610, 450, 170, 32, 'x', 110, 86),
    ground(8860, 530, 200),
    falling(9140, 470, 170),
    ground(9390, 400, 180),
    ground(9650, 470, 190),
    ground(9920, 540, 210),
    spring(10210, 610, 200, 32, 920),
    ground(10510, 520, 180),
    ground(10770, 450, 180),
    ground(11030, 380, 180),
    ground(11300, 450, 200),
    ground(11590, 530, 220),
  ],
  checkpoints: [
    { id: 'cp-5', rect: { x: 9960, y: 460, width: 24, height: 80 } },
    { id: 'cp-6', rect: { x: 11080, y: 300, width: 24, height: 80 } },
  ],
  collectibles: [
    { id: 'crystal-8', position: { x: 8420, y: 470 } },
    { id: 'crystal-9', position: { x: 8660, y: 390 } },
    { id: 'crystal-10', position: { x: 9170, y: 420 } },
    { id: 'crystal-11', position: { x: 9440, y: 350 } },
    { id: 'crystal-12', position: { x: 10020, y: 490 } },
    { id: 'crystal-13', position: { x: 10260, y: 540 } },
    { id: 'crystal-14', position: { x: 10820, y: 400 } },
    { id: 'crystal-15', position: { x: 11410, y: 320 } },
    { id: 'crystal-16', position: { x: 11720, y: 470 } },
  ],
  rewardBlocks: [
    rewardBlock('forest-coin-3', 8930, 470, { kind: 'coins', amount: 3 }),
    rewardBlock('forest-shooter', 9685, 420, { kind: 'power', power: 'shooter' }),
    rewardBlock('forest-coin-4', 10190, 470, { kind: 'coins', amount: 2 }),
    rewardBlock('forest-invincible', 11320, 380, { kind: 'power', power: 'invincible' }),
  ],
  hazards: [
    { id: 'forest-spikes-6', kind: 'spikes', rect: { x: 8140, y: 574, width: 60, height: 16 } },
    { id: 'forest-spikes-7', kind: 'spikes', rect: { x: 10560, y: 504, width: 50, height: 16 } },
    { id: 'forest-spikes-8', kind: 'spikes', rect: { x: 11630, y: 514, width: 70, height: 16 } },
  ],
  enemies: [
    {
      id: 'walker-4',
      kind: 'walker',
      position: { x: 8360, y: 490 },
      patrol: { left: 8350, right: 8510, speed: 105 },
    },
    {
      id: 'hopper-4',
      kind: 'hopper',
      position: { x: 8870, y: 500 },
      hop: { intervalMs: 1180, impulse: 900, speed: 130 },
    },
    {
      id: 'turret-2',
      kind: 'turret',
      position: { x: 9466, y: 362 },
      turret: { intervalMs: 1700 },
    },
    {
      id: 'flyer-2',
      kind: 'flyer',
      position: { x: 10020, y: 350 },
      flyer: { left: 9930, right: 10440, speed: 110, bobAmp: 24, bobSpeed: 4.8 },
    },
    {
      id: 'turret-3',
      kind: 'turret',
      position: { x: 10586, y: 482 },
      turret: { intervalMs: 1600 },
    },
    {
      id: 'charger-2',
      kind: 'charger',
      position: { x: 10820, y: 420 },
      charger: { left: 10770, right: 10950, patrolSpeed: 72, chargeSpeed: 300, windupMs: 520, cooldownMs: 900 },
    },
    {
      id: 'walker-5',
      kind: 'walker',
      position: { x: 11605, y: 500 },
      patrol: { left: 11590, right: 11780, speed: 120 },
    },
  ],
  exit: { x: 11890, y: 450, width: 40, height: 80 },
  hint: 'Eight authored segments now carry the forest run through the vault, canopy, and citadel rise.',
};

const amberCavernExtension: StageExtension = {
  targetDurationMinutes: 20,
  worldWidth: 12250,
  segments: [
    { id: 'fissure', title: 'Deep Fissure', startX: 8200, endX: 9440, focus: 'vertical recovery beats' },
    { id: 'ramparts', title: 'Molten Ramparts', startX: 9440, endX: 10880, focus: 'mixed hazard pressure' },
    { id: 'vault', title: 'Vault Approach', startX: 10880, endX: 12250, focus: 'final forge gauntlet' },
  ],
  platforms: [
    ground(8160, 520, 200),
    ground(8420, 450, 180),
    ground(8680, 380, 180),
    moving(8940, 430, 180, 32, 'y', 110, 72),
    ground(9200, 340, 180),
    ground(9460, 420, 200),
    falling(9730, 500, 180),
    ground(9990, 570, 220),
    ground(10290, 500, 180),
    spring(10550, 430, 190, 32, 930),
    ground(10830, 350, 180),
    ground(11090, 420, 190),
    ground(11370, 500, 220),
    ground(11670, 560, 220),
    ground(11960, 470, 180),
  ],
  checkpoints: [
    { id: 'cp-5', rect: { x: 9220, y: 260, width: 24, height: 80 } },
    { id: 'cp-6', rect: { x: 11710, y: 480, width: 24, height: 80 } },
  ],
  collectibles: [
    { id: 'amber-9', position: { x: 8210, y: 470 } },
    { id: 'amber-10', position: { x: 8460, y: 390 } },
    { id: 'amber-11', position: { x: 8730, y: 320 } },
    { id: 'amber-12', position: { x: 8990, y: 380 } },
    { id: 'amber-13', position: { x: 9500, y: 370 } },
    { id: 'amber-14', position: { x: 10040, y: 520 } },
    { id: 'amber-15', position: { x: 10610, y: 360 } },
    { id: 'amber-16', position: { x: 10870, y: 300 } },
    { id: 'amber-17', position: { x: 11430, y: 450 } },
    { id: 'amber-18', position: { x: 12000, y: 420 } },
  ],
  rewardBlocks: [
    rewardBlock('amber-coin-3', 8450, 390, { kind: 'coins', amount: 3 }),
    rewardBlock('amber-invincible', 10320, 430, { kind: 'power', power: 'invincible' }),
    rewardBlock('amber-coin-4', 10860, 310, { kind: 'coins', amount: 2 }),
    rewardBlock('amber-dash', 11780, 420, { kind: 'power', power: 'dash' }),
  ],
  hazards: [
    { id: 'amber-spikes-4', kind: 'spikes', rect: { x: 8220, y: 504, width: 60, height: 16 } },
    { id: 'amber-spikes-5', kind: 'spikes', rect: { x: 10050, y: 554, width: 70, height: 16 } },
    { id: 'amber-spikes-6', kind: 'spikes', rect: { x: 11420, y: 484, width: 70, height: 16 } },
  ],
  enemies: [
    {
      id: 'walker-4',
      kind: 'walker',
      position: { x: 8170, y: 490 },
      patrol: { left: 8160, right: 8340, speed: 105 },
    },
    {
      id: 'hopper-3',
      kind: 'hopper',
      position: { x: 8690, y: 350 },
      hop: { intervalMs: 1220, impulse: 900, speed: 125 },
    },
    {
      id: 'turret-4',
      kind: 'turret',
      position: { x: 9546, y: 382 },
      turret: { intervalMs: 1600 },
    },
    {
      id: 'hopper-4',
      kind: 'hopper',
      position: { x: 10000, y: 540 },
      hop: { intervalMs: 1180, impulse: 920, speed: 130 },
    },
    {
      id: 'flyer-2',
      kind: 'flyer',
      position: { x: 10630, y: 300 },
      flyer: { left: 10490, right: 10990, speed: 110, bobAmp: 26, bobSpeed: 4.8 },
    },
    {
      id: 'charger-2',
      kind: 'charger',
      position: { x: 11100, y: 390 },
      charger: { left: 11090, right: 11260, patrolSpeed: 72, chargeSpeed: 310, windupMs: 520, cooldownMs: 920 },
    },
    {
      id: 'walker-5',
      kind: 'walker',
      position: { x: 12070, y: 440 },
      patrol: { left: 12020, right: 12130, speed: 118 },
    },
  ],
  exit: { x: 12160, y: 390, width: 44, height: 80 },
  hint: 'The cavern now extends through the fissure, ramparts, and vault approach with new recovery beats.',
};

const skySanctumExtension: StageExtension = {
  targetDurationMinutes: 21,
  worldWidth: 13240,
  segments: [
    { id: 'belfry', title: 'Storm Belfry', startX: 8800, endX: 10120, focus: 'mid-air recovery' },
    { id: 'halo', title: 'Halo Ramp', startX: 10120, endX: 11640, focus: 'turret lanes and resets' },
    { id: 'crown', title: 'Crown Approach', startX: 11640, endX: 13240, focus: 'endurance finale' },
  ],
  platforms: [
    ground(8740, 560, 210),
    ground(9010, 490, 180),
    moving(9270, 420, 180, 32, 'x', 130, 88),
    ground(9540, 340, 180),
    ground(9800, 410, 190),
    falling(10080, 480, 180),
    ground(10340, 550, 210),
    ground(10640, 480, 180),
    moving(10900, 400, 180, 32, 'y', 110, 84),
    ground(11160, 320, 180),
    ground(11420, 390, 180),
    spring(11680, 460, 200, 32, 950),
    ground(11970, 380, 180),
    ground(12230, 320, 180),
    ground(12490, 400, 180),
    ground(12750, 500, 220),
    ground(13040, 430, 180),
  ],
  checkpoints: [
    { id: 'cp-5', rect: { x: 10670, y: 400, width: 24, height: 80 } },
    { id: 'cp-6', rect: { x: 12340, y: 240, width: 24, height: 80 } },
  ],
  collectibles: [
    { id: 'sky-10', position: { x: 8780, y: 510 } },
    { id: 'sky-11', position: { x: 9050, y: 440 } },
    { id: 'sky-12', position: { x: 9340, y: 360 } },
    { id: 'sky-13', position: { x: 9580, y: 280 } },
    { id: 'sky-14', position: { x: 10120, y: 430 } },
    { id: 'sky-15', position: { x: 10390, y: 500 } },
    { id: 'sky-16', position: { x: 10750, y: 430 } },
    { id: 'sky-17', position: { x: 11210, y: 260 } },
    { id: 'sky-18', position: { x: 11750, y: 410 } },
    { id: 'sky-19', position: { x: 12410, y: 270 } },
    { id: 'sky-20', position: { x: 12900, y: 450 } },
  ],
  rewardBlocks: [
    rewardBlock('sky-dash-2', 9400, 380, { kind: 'power', power: 'dash' }),
    rewardBlock('sky-coin-3', 10750, 430, { kind: 'coins', amount: 3 }),
    rewardBlock('sky-coin-4', 12260, 260, { kind: 'coins', amount: 2 }),
    rewardBlock('sky-shooter', 13060, 350, { kind: 'power', power: 'shooter' }),
  ],
  hazards: [
    { id: 'sky-spikes-8', kind: 'spikes', rect: { x: 8790, y: 544, width: 60, height: 16 } },
    { id: 'sky-spikes-9', kind: 'spikes', rect: { x: 10400, y: 534, width: 80, height: 16 } },
    { id: 'sky-spikes-10', kind: 'spikes', rect: { x: 12540, y: 384, width: 50, height: 16 } },
    { id: 'sky-spikes-11', kind: 'spikes', rect: { x: 12840, y: 484, width: 40, height: 16 } },
  ],
  enemies: [
    {
      id: 'walker-4',
      kind: 'walker',
      position: { x: 9020, y: 460 },
      patrol: { left: 9010, right: 9170, speed: 108 },
    },
    {
      id: 'flyer-2',
      kind: 'flyer',
      position: { x: 9360, y: 300 },
      flyer: { left: 9260, right: 9660, speed: 112, bobAmp: 26, bobSpeed: 5.1 },
    },
    {
      id: 'turret-5',
      kind: 'turret',
      position: { x: 9881, y: 372 },
      turret: { intervalMs: 1450 },
    },
    {
      id: 'hopper-3',
      kind: 'hopper',
      position: { x: 10350, y: 520 },
      hop: { intervalMs: 1180, impulse: 940, speed: 136 },
    },
    {
      id: 'turret-6',
      kind: 'turret',
      position: { x: 11236, y: 282 },
      turret: { intervalMs: 1400 },
    },
    {
      id: 'charger-2',
      kind: 'charger',
      position: { x: 11980, y: 350 },
      charger: { left: 11970, right: 12150, patrolSpeed: 74, chargeSpeed: 320, windupMs: 500, cooldownMs: 900 },
    },
    {
      id: 'flyer-3',
      kind: 'flyer',
      position: { x: 12540, y: 300 },
      flyer: { left: 12420, right: 12920, speed: 115, bobAmp: 28, bobSpeed: 5.3 },
    },
    {
      id: 'walker-5',
      kind: 'walker',
      position: { x: 12760, y: 470 },
      patrol: { left: 12750, right: 12940, speed: 118 },
    },
  ],
  exit: { x: 13120, y: 350, width: 48, height: 80 },
  hint: 'The sanctum now climbs through the belfry, halo ramp, and crown approach with authored recovery beats.',
};

export const stageDefinitions: StageDefinition[] = baseStageDefinitions.map((stage) => {
  switch (stage.id) {
    case 'forest-ruins':
      return validateStaticElementCollisions(validateRewardBlocks(applyStageExtension(stage, forestRuinsExtension)));
    case 'amber-cavern':
      return validateStaticElementCollisions(validateRewardBlocks(applyStageExtension(stage, amberCavernExtension)));
    case 'sky-sanctum':
      return validateStaticElementCollisions(validateRewardBlocks(applyStageExtension(stage, skySanctumExtension)));
    default:
      return validateStaticElementCollisions(
        validateRewardBlocks({
          ...stage,
          rewardBlocks: normalizeRewardBlocks(stage.platforms, stage.rewardBlocks),
        }),
      );
  }
});
