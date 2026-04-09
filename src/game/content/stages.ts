import type {
  EnemyKind,
  HazardKind,
  PlatformKind,
  Rect,
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

export const stageDefinitions: StageDefinition[] = [
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
    hazards: [
      { id: 'spikes-1', kind: 'spikes', rect: { x: 175, y: 604, width: 70, height: 16 } },
      { id: 'spikes-2', kind: 'spikes', rect: { x: 2250, y: 479, width: 40, height: 16 } },
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
      { id: 'amber-4', position: { x: 3500, y: 540 } },
      { id: 'amber-5', position: { x: 4360, y: 340 } },
      { id: 'amber-6', position: { x: 5510, y: 470 } },
      { id: 'amber-7', position: { x: 6325, y: 340 } },
      { id: 'amber-8', position: { x: 7730, y: 360 } },
    ],
    hazards: [
      { id: 'spikes-1', kind: 'spikes', rect: { x: 180, y: 604, width: 60, height: 16 } },
      { id: 'spikes-forge-1', kind: 'spikes', rect: { x: 2440, y: 404, width: 72, height: 16 } },
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
