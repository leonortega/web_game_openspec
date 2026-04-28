import { describe, expect, it } from 'vitest';
import {
  getActivationNodeTraversalVisualCategory,
  getGravityCapsuleButtonTraversalVisualCategory,
  getGravityCapsuleShellTraversalVisualCategory,
  getGravityFieldTraversalVisualCategory,
  getPlatformTraversalVisualCategory,
  getTerrainTraversalVisualCategory,
} from './traversalVisualLanguage';

describe('traversalVisualLanguage', () => {
  it('maps terrain variants to terrain category', () => {
    expect(getTerrainTraversalVisualCategory({ surfaceMechanic: { kind: 'brittleCrystal' } })).toBe('terrain');
    expect(getTerrainTraversalVisualCategory({ surfaceMechanic: { kind: 'stickySludge' } })).toBe('terrain');
  });

  it('maps assisted-movement supports to assisted movement category', () => {
    expect(getPlatformTraversalVisualCategory({ kind: 'moving', reveal: undefined, temporaryBridge: undefined, magnetic: undefined })).toBe(
      'assistedMovement',
    );
    expect(getPlatformTraversalVisualCategory({ kind: 'falling', reveal: undefined, temporaryBridge: undefined, magnetic: undefined })).toBe(
      'assistedMovement',
    );
    expect(getPlatformTraversalVisualCategory({ kind: 'spring', reveal: undefined, temporaryBridge: undefined, magnetic: undefined })).toBe(
      'assistedMovement',
    );
  });

  it('maps route-toggle supports and controls to route toggle category', () => {
    expect(getPlatformTraversalVisualCategory({ kind: 'static', reveal: { id: 'reveal-1' }, temporaryBridge: undefined, magnetic: undefined })).toBe(
      'routeToggle',
    );
    expect(
      getPlatformTraversalVisualCategory({
        kind: 'static',
        reveal: undefined,
        temporaryBridge: { scannerId: 'scanner-1', durationMs: 2400 },
        magnetic: undefined,
      }),
    ).toBe('routeToggle');
    expect(
      getPlatformTraversalVisualCategory({
        kind: 'static',
        reveal: undefined,
        temporaryBridge: undefined,
        magnetic: { activationNodeId: 'node-1', powered: false },
      }),
    ).toBe('routeToggle');
    expect(getActivationNodeTraversalVisualCategory({ activated: false })).toBe('routeToggle');
    expect(getGravityCapsuleShellTraversalVisualCategory({ enabled: false })).toBe('routeToggle');
    expect(
      getGravityCapsuleButtonTraversalVisualCategory({
        enabled: true,
        button: { id: 'button-1', x: 0, y: 0, width: 12, height: 12, activated: true },
      }),
    ).toBe('routeToggle');
  });

  it('keeps gated gravity fields as route toggles until enabled and then as gravity modifiers', () => {
    expect(getGravityFieldTraversalVisualCategory({ gravityCapsuleId: null }, null)).toBe('gravityModifier');
    expect(getGravityFieldTraversalVisualCategory({ gravityCapsuleId: 'capsule-1' }, { enabled: false })).toBe('routeToggle');
    expect(getGravityFieldTraversalVisualCategory({ gravityCapsuleId: 'capsule-1' }, { enabled: true })).toBe('gravityModifier');
  });

  it('leaves ordinary static supports neutral', () => {
    expect(getPlatformTraversalVisualCategory({ kind: 'static', reveal: undefined, temporaryBridge: undefined, magnetic: undefined })).toBe(
      'neutral',
    );
  });
});