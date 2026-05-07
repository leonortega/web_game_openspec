import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({}));

import { resolveBottomAmbientBand } from './bootstrap';

describe('resolveBottomAmbientBand', () => {
  it('places bottom mist below the lowest gameplay element with clearance', () => {
    const state = {
      player: { y: 140, height: 42 },
      stage: {
        world: { width: 960, height: 720 },
        exit: { x: 0, y: 240, width: 32, height: 64 },
      },
      stageRuntime: {
        platforms: [{ y: 520, height: 24 }],
        hazards: [{ rect: { y: 560, height: 20 } }],
        checkpoints: [{ rect: { y: 480, height: 42 } }],
        rewardBlocks: [{ y: 350, height: 32 }],
        activationNodes: [{ y: 300, height: 28 }],
        gravityCapsules: [
          {
            shell: { y: 400, height: 48 },
            entryDoor: { y: 408, height: 16 },
            exitDoor: { y: 408, height: 16 },
            button: { y: 452, height: 16 },
            entryRoute: { y: 430, height: 10 },
            buttonRoute: { y: 438, height: 10 },
            exitRoute: { y: 446, height: 10 },
          },
        ],
        collectibles: [{ position: { y: 260 } }],
        enemies: [{ y: 500, height: 36 }],
      },
    } as any;

    expect(resolveBottomAmbientBand(state)).toEqual({
      topY: 578,
      height: 120,
    });
  });

  it('skips bottom mist when there is not enough empty space', () => {
    const state = {
      player: { y: 620, height: 42 },
      stage: {
        world: { width: 960, height: 720 },
        exit: { x: 0, y: 640, width: 32, height: 48 },
      },
      stageRuntime: {
        platforms: [{ y: 610, height: 42 }],
        hazards: [],
        checkpoints: [],
        rewardBlocks: [],
        activationNodes: [],
        gravityCapsules: [],
        collectibles: [],
        enemies: [],
      },
    } as any;

    expect(resolveBottomAmbientBand(state)).toBeNull();
  });
});
