import { STAGE_AUDIO_METADATA } from '../../../../audio/musicThemes';
import { createBossTwoEnemy } from '../../enemies/bosses';
import { ground, startCabin } from '../builders';
import type { StageDefinition } from '../types';

export const bossTwoStage: StageDefinition = {
  id: 'boss-2',
  name: 'Boss 2',
  audio: STAGE_AUDIO_METADATA['sky-sanctum'],
  presentation: {
    sectorLabel: 'Survey Sector A6-B',
    biomeLabel: 'Brood boss arena',
    paletteCue: 'Grey glass, red shell, black eye, and compressed arena pressure.',
    introLine: 'Stomp the walkers released under the boss to crack its shell.',
    completionTitle: 'Boss 2 Cleared',
    panelColor: 0x3a1820,
  },
  targetDurationMinutes: 3,
  segments: [{ id: 'arena', title: 'Boss Arena', startX: 0, endX: 1500, focus: 'walker-stomp boss fight' }],
  emptyPlatformRuns: [],
  palette: {
    skyTop: 0xd8d8d8,
    skyBottom: 0x9eabb4,
    accent: 0xd52a32,
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
  enemies: [createBossTwoEnemy()],
  exit: { x: 1410, y: 420, width: 40, height: 80 },
  hint: 'Boss 2 does not shoot. It releases walkers from under its body, and each stomped walker removes one point of boss energy.',
};
