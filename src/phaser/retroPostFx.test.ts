import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({}));

import {
  annotateRetroWorldLocalRegion,
  applyConfiguredRetroPostFxToCamera,
  createWorldLocalRetroRegion,
  getCrtFilterEnabled,
  toggleCrtFilterForCamera,
} from './retroPostFx';

describe('retroPostFx world-local helpers', () => {
  it('tags local retro regions as world-only so HUD and overlays stay excluded', () => {
    const region = annotateRetroWorldLocalRegion({} as any, 'distortion');

    expect(region.__retroWorldLocalEffectKind).toBe('distortion');
    expect(region.__retroWorldLocalEffectScope).toBe('world-local');
    expect(region.__retroHudExcluded).toBe(true);
    expect(region.__retroOverlayExcluded).toBe(true);
  });

  it('falls back to scene rectangles when the enhanced plugin helper is unavailable', () => {
    const rectangle = {
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
    };
    const scene = {
      add: {
        rectangle: vi.fn().mockReturnValue(rectangle),
      },
    } as any;

    const region = createWorldLocalRetroRegion(scene, {
      kind: 'palette-ramp',
      x: 10,
      y: 12,
      width: 16,
      height: 4,
      color: 0xffffff,
      alpha: 0.5,
      depth: 9,
    });

    expect(scene.add.rectangle).toHaveBeenCalledWith(10, 12, 16, 4, 0xffffff, 0.5);
    expect(region.__retroHudExcluded).toBe(true);
    expect(rectangle.setDepth).toHaveBeenCalledWith(9);
  });

  it('applies the configured CRT state from the registry to a camera', () => {
    const filterList = {
      addCRT: vi.fn(),
      addQuantize: vi.fn(),
    };
    const camera = {
      filters: { external: filterList },
      setRenderFilters: vi.fn(),
      setFiltersForceComposite: vi.fn(),
      setForceComposite: vi.fn(),
    } as any;
    const registry = new Map<string, unknown>([['crtFilterEnabled', true]]);
    const game = {
      registry: {
        get: (key: string) => registry.get(key),
        set: (key: string, value: unknown) => registry.set(key, value),
      },
    } as any;

    applyConfiguredRetroPostFxToCamera(game, camera);

    expect(camera.setRenderFilters).toHaveBeenCalledWith(true);
    expect(filterList.addCRT).toHaveBeenCalledTimes(1);
    expect(filterList.addQuantize).toHaveBeenCalledTimes(1);
  });

  it('toggles the CRT option and reapplies the camera postfx path', () => {
    const filterList = {
      addCRT: vi.fn(),
      addQuantize: vi.fn(),
      clear: vi.fn(),
    };
    const camera = {
      filters: { external: filterList },
      setRenderFilters: vi.fn(),
      setFiltersForceComposite: vi.fn(),
      setForceComposite: vi.fn(),
    } as any;
    const registry = new Map<string, unknown>([['crtFilterEnabled', true]]);
    const game = {
      registry: {
        get: (key: string) => registry.get(key),
        set: (key: string, value: unknown) => registry.set(key, value),
      },
    } as any;

    const nextEnabled = toggleCrtFilterForCamera(game, camera);

    expect(nextEnabled).toBe(false);
    expect(getCrtFilterEnabled(game, true)).toBe(false);
    expect(filterList.addCRT).not.toHaveBeenCalled();
    expect(filterList.addQuantize).toHaveBeenCalledTimes(1);
  });
});