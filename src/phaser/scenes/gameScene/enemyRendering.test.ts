import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({}));

import { syncEnemy } from './enemyRendering';

describe('syncEnemy', () => {
  it('keeps grounded hoppers visually planted on support instead of lifting with pose offsets', () => {
    const sprite = {
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setFlipX: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setAngle: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
    };
    
    const stripMethods = {
      setPosition: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };
    
    const scene = {
      enemySprites: new Map([['hopper-1', sprite]]),
      enemyContactStrips: new Map(),
      enemyAccentSprites: new Map(),
      enemyDefeatVisibleUntilMs: new Map(),
      retroPalette: {
        alert: 0xff0000,
        cool: 0x00aaff,
        safe: 0x00ff00,
        warm: 0xffaa00,
        bright: 0xffffff,
      },
      time: {
        now: 0,
      },
      add: {
        rectangle: vi.fn().mockReturnValue(stripMethods),
      },
    } as any;

    syncEnemy(scene, {
      id: 'hopper-1',
      alive: true,
      defeatCause: null,
      x: 1930,
      y: 510,
      width: 24,
      height: 30,
      direction: 1,
      supportY: 510,
      kind: 'hopper',
      vx: 0,
      vy: 0,
      hop: {
        intervalMs: 1400,
        timerMs: 0,
        impulse: 820,
        speed: 110,
        targetPlatformId: null,
        targetX: null,
        targetY: null,
      },
    } as any);

    const lastCall = sprite.setPosition.mock.calls[sprite.setPosition.mock.calls.length - 1] ?? [];
    const [, renderY] = lastCall;

    expect(renderY).toBeCloseTo(510 + 30 - 28 * 0.86, 5);
  });

  it('still allows airborne hoppers to use pose offsets during jump arc', () => {
    const sprite = {
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setFlipX: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setAngle: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
    };
    
    const stripMethods = {
      setPosition: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };
    
    const scene = {
      enemySprites: new Map([['hopper-1', sprite]]),
      enemyContactStrips: new Map(),
      enemyAccentSprites: new Map(),
      enemyDefeatVisibleUntilMs: new Map(),
      retroPalette: {
        alert: 0xff0000,
        cool: 0x00aaff,
        safe: 0x00ff00,
        warm: 0xffaa00,
        bright: 0xffffff,
      },
      time: {
        now: 0,
      },
      add: {
        rectangle: vi.fn().mockReturnValue(stripMethods),
      },
    } as any;

    syncEnemy(scene, {
      id: 'hopper-1',
      alive: true,
      defeatCause: null,
      x: 1930,
      y: 480,
      width: 24,
      height: 30,
      direction: 1,
      supportY: null,
      kind: 'hopper',
      vx: 0,
      vy: -220,
      hop: {
        intervalMs: 1400,
        timerMs: 700,
        impulse: 820,
        speed: 110,
        targetPlatformId: null,
        targetX: null,
        targetY: null,
      },
    } as any);

    const lastCall = sprite.setPosition.mock.calls[sprite.setPosition.mock.calls.length - 1] ?? [];
    const [, renderY] = lastCall;

    expect(renderY).toBeCloseTo(480 + 30 - 28 * 1.12 - 2, 5);
  });
});