import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  Math: {
    Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
  },
}));

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
      enemyHitFlashUntilMs: new Map(),
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
      enemyHitFlashUntilMs: new Map(),
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

  it('drops expired enemy hit flashes and keeps palette-ramp accents local to turret variants', () => {
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
    const accentA = {
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
    };
    const accentB = {
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
    };

    const scene = {
      enemySprites: new Map([['turret-1', sprite]]),
      enemyContactStrips: new Map(),
      enemyAccentSprites: new Map([['turret-1', [accentA, accentB]]]),
      enemyDefeatVisibleUntilMs: new Map(),
      enemyHitFlashUntilMs: new Map([['turret-1', 20]]),
      retroPalette: {
        alert: 0xff0000,
        cool: 0x00aaff,
        safe: 0x00ff00,
        warm: 0xffaa00,
        bright: 0xffffff,
        border: 0xf7f3d6,
        ink: 0x101010,
      },
      time: {
        now: 40,
      },
    } as any;

    syncEnemy(scene, {
      id: 'turret-1',
      alive: true,
      defeatCause: null,
      x: 300,
      y: 160,
      width: 24,
      height: 30,
      direction: 1,
      supportY: 160,
      kind: 'turret',
      variant: 'ionPulse',
      vx: 0,
      vy: 0,
      turret: { intervalMs: 980, timerMs: 0, telegraphMs: 0, telegraphDurationMs: 980, burstGapMs: 0, burstGapDurationMs: 0, pendingShots: 0 },
    } as any);

    expect(scene.enemyHitFlashUntilMs.has('turret-1')).toBe(false);
    expect(accentA.setVisible).toHaveBeenCalledWith(true);
    expect(accentB.setVisible).toHaveBeenCalledWith(true);
    expect(sprite.setTint).toHaveBeenCalled();
  });
});