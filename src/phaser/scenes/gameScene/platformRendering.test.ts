import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({}));

import { syncPlatform } from './platformRendering';

describe('syncPlatform', () => {
  it('anchors the visible top surface flush to the platform top edge', () => {
    const sprite = {
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setStrokeStyle: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
    };
    const shadow = {
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
    };
    const detail = {
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
    };
    const markers = [{ setVisible: vi.fn().mockReturnThis() }, { setVisible: vi.fn().mockReturnThis() }, { setVisible: vi.fn().mockReturnThis() }];

    const scene = {
      bridge: {
        getSession: () => ({
          getState: () => ({
            stageRuntime: {
              revealedPlatformIds: [],
              temporaryBridges: [],
            },
          }),
        }),
      },
      platformSprites: new Map([['platform-1', sprite]]),
      platformShadowSprites: new Map([['platform-1', shadow]]),
      platformDetailSprites: new Map([['platform-1', detail]]),
      platformCategoryMarkerSprites: new Map([['platform-1', markers as any]]),
      retroPalette: { bright: 0xffffff, border: 0x111111, warm: 0xffaa00, cool: 0x66ccff } as any,
      platformColor: vi.fn().mockReturnValue(0x333333),
      platformDetailColor: vi.fn().mockReturnValue(0x777777),
    } as any;

    syncPlatform(scene, {
      id: 'platform-1',
      kind: 'static',
      x: 640,
      y: 540,
      width: 220,
      height: 32,
      startX: 640,
      startY: 540,
      vx: 0,
      vy: 0,
    } as any);

    expect(detail.setPosition).toHaveBeenCalledWith(750, 544);
    expect(detail.setSize).toHaveBeenCalledWith(220, 8);
  });
});