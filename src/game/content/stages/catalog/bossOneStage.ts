import { STAGE_AUDIO_METADATA } from '../../../../audio/musicThemes';
import { createBossOneEnemy } from '../../enemies/bosses';
import { ground, startCabin } from '../builders';
import type { StageDefinition } from '../types';

export const bossOneStage: StageDefinition = {
  id: 'boss-1',
  name: 'Boss 1',
  audio: STAGE_AUDIO_METADATA['sky-sanctum'],
  presentation: {
    sectorLabel: 'Survey Sector A3-B',
    biomeLabel: 'Locked boss arena',
    paletteCue: 'Cold arena glass, warning amber, and fixed viewport pressure.',
    introLine: 'Hold the arena floor and read the boss shot heights.',
    completionTitle: 'Boss 1 Cleared',
    panelColor: 0x142d3a,
  },
  targetDurationMinutes: 3,
  segments: [{ id: 'arena', title: 'Boss Arena', startX: 0, endX: 1500, focus: 'giant boss fight' }],
  emptyPlatformRuns: [],
  palette: {
    skyTop: 0x5b3c86,
    skyBottom: 0x170d2a,
    accent: 0xffd20a,
    ground: 0x6f86a5,
  },
  world: { width: 1500, height: 540, gravity: 1780 },
  playerSpawn: { x: 116, y: 458 },
  startCabin: startCabin(104, 494, 1),
  platforms: [ground(0, 500, 1500, 40)],
  lowGravityZones: [],
  gravityFields: [],
  gravityCapsules: [],
  revealVolumes: [],
  scannerVolumes: [],
  activationNodes: [],
  checkpoints: [{ id: 'cp-1', rect: { x: 180, y: 420, width: 24, height: 80 } }],
  collectibles: [],
  rewardBlocks: [],
  secretRoutes: [],
  hazards: [],
  enemies: [createBossOneEnemy()],
  exit: { x: 1410, y: 420, width: 40, height: 80 },
  hint: 'Boss 1 is a long floor arena with a giant aggressive boss that runs, jumps, fires at multiple heights, and unlocks the exit only after defeat.',
};
