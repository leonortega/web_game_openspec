import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  Math: {
    Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
  },
}));

import { syncCheckpoint } from './rewardRendering';

describe('syncCheckpoint', () => {
  it('sizes the checkpoint sprite to the grounded checkpoint rect', () => {
    const sprite = {
      setOrigin: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
    };

    const stripMethods = {
      setOrigin: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };

    const scene = {
      checkpointSprites: new Map([['cp-1', sprite]]),
      checkpointContactStrips: new Map(),
      retroPalette: {
        safe: 0x00ff00,
        cool: 0x0000ff,
        warm: 0xffaa00,
        border: 0x111111,
        shadow: '#000000',
      },
      add: {
        rectangle: vi.fn().mockReturnValue(stripMethods),
      },
    } as any;

    syncCheckpoint(scene, {
      id: 'cp-1',
      activated: false,
      rect: { x: 1420, y: 460, width: 24, height: 80 },
    } as any);

    expect(sprite.setOrigin).toHaveBeenCalledWith(0.5, 1);
    expect(sprite.setPosition).toHaveBeenCalledWith(1432, 550);
    expect(sprite.setDisplaySize).toHaveBeenCalledWith(24, 80);
    expect(sprite.setDepth).toHaveBeenCalledWith(4.2);
    expect(sprite.setTint).toHaveBeenCalledWith(0x0000ff);
  });

  it('expands activated checkpoints from the grounded base instead of shrinking to the texture frame', () => {
    const sprite = {
      setOrigin: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
    };

    const stripMethods = {
      setOrigin: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };

    const scene = {
      checkpointSprites: new Map([['cp-2', sprite]]),
      checkpointContactStrips: new Map(),
      retroPalette: {
        safe: 0x00ff00,
        cool: 0x0000ff,
        warm: 0xffaa00,
        border: 0x111111,
        shadow: '#000000',
      },
      add: {
        rectangle: vi.fn().mockReturnValue(stripMethods),
      },
    } as any;

    syncCheckpoint(scene, {
      id: 'cp-2',
      activated: true,
      rect: { x: 3090, y: 510, width: 24, height: 80 },
    } as any);

    expect(sprite.setOrigin).toHaveBeenCalledWith(0.5, 1);
    expect(sprite.setPosition).toHaveBeenCalledWith(3102, 600);
    expect(sprite.setDisplaySize).toHaveBeenCalledWith(24, 80);
    expect(sprite.setDepth).toHaveBeenCalledWith(4.2);
    expect(sprite.setTint).toHaveBeenCalledWith(0x00ff00);
  });
});
