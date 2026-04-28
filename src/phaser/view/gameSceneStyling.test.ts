import { describe, expect, it } from 'vitest';

import type {
  GravityCapsuleState,
  GravityFieldState,
  PlatformState,
  RewardBlockState,
  RewardRevealState,
} from '../../game/simulation/state';
import type { RetroPresentationPalette } from './retroPresentation';
import {
  gravityCapsuleButtonColor,
  gravityCapsuleButtonCoreColor,
  gravityCapsuleDoorAlpha,
  gravityCapsuleEntryDoorColor,
  gravityCapsuleExitDoorColor,
  gravityCapsuleShellAlpha,
  gravityCapsuleShellColor,
  gravityCapsuleShellStrokeColor,
  gravityFieldAlpha,
  gravityFieldColor,
  platformColor,
  platformDetailColor,
  rewardBlockColor,
  rewardBlockLabel,
  rewardRevealColor,
  rewardRevealText,
  terrainVariantAccentAlpha,
  terrainVariantAccentColor,
  terrainVariantAccentHeight,
  terrainVariantAccentWidth,
  terrainVariantAccentY,
  terrainVariantAlpha,
  terrainVariantColor,
  terrainVariantShadowAlpha,
  terrainVariantStrokeAlpha,
  terrainVariantStrokeColor,
} from './gameSceneStyling';

const palette = {
  panelAlt: 0x101010,
  cool: 0x202020,
  border: 0x303030,
  muted: 0x404040,
  alert: 0x505050,
  safe: 0x606060,
  warm: 0x707070,
  bright: 0x808080,
  ink: 0x909090,
} as RetroPresentationPalette;

function createPlatform(overrides: Partial<PlatformState> = {}): PlatformState {
  return {
    id: 'platform-1',
    x: 0,
    y: 0,
    width: 64,
    height: 16,
    startX: 0,
    startY: 0,
    vx: 0,
    vy: 0,
    kind: 'static',
    move: undefined,
    fall: undefined,
    spring: undefined,
    reveal: undefined,
    temporaryBridge: undefined,
    magnetic: undefined,
    ...overrides,
  };
}

function createTerrainVariantPlatform(overrides: Partial<PlatformState> = {}): PlatformState {
  return {
    id: 'platform-variant-1',
    x: 10,
    y: 20,
    width: 90,
    height: 18,
    kind: 'static',
    surfaceMechanic: { kind: 'brittleCrystal' },
    brittle: { phase: 'intact', warningMs: 0, unsupportedGapMs: 0 },
    startX: 10,
    startY: 20,
    vx: 0,
    vy: 0,
    move: undefined,
    fall: undefined,
    spring: undefined,
    reveal: undefined,
    temporaryBridge: undefined,
    magnetic: undefined,
    ...overrides,
  };
}

function createCapsule(overrides: Partial<GravityCapsuleState> = {}): GravityCapsuleState {
  return {
    id: 'capsule-1',
    fieldId: 'field-1',
    enabled: true,
    shell: { x: 0, y: 0, width: 48, height: 72 },
    entryDoor: { x: 2, y: 8, width: 12, height: 22 },
    exitDoor: { x: 34, y: 8, width: 12, height: 22 },
    button: { id: 'button-1', x: 16, y: 50, width: 16, height: 12, activated: false },
    entryRoute: { x: 0, y: 0, width: 12, height: 20 },
    buttonRoute: { x: 14, y: 22, width: 20, height: 20 },
    exitRoute: { x: 30, y: 0, width: 12, height: 20 },
    ...overrides,
  };
}

describe('gameSceneStyling', () => {
  it('prioritizes magnetic and reveal platform variants', () => {
    expect(platformColor(palette, createPlatform({ magnetic: { activationNodeId: 'node-1', powered: false } }))).toBe(palette.panelAlt);
    expect(platformColor(palette, createPlatform({ temporaryBridge: { scannerId: 'scanner-1', durationMs: 2400 } }))).toBe(palette.cool);
    expect(platformColor(palette, createPlatform({ reveal: { id: 'reveal-1' } }))).toBe(palette.border);
    expect(platformDetailColor(palette, createPlatform({ magnetic: { activationNodeId: 'node-1', powered: true } }))).toBe(palette.bright);
    expect(platformDetailColor(palette, createPlatform({ kind: 'falling' }))).toBe(palette.warm);
  });

  it('adjusts brittle and sticky terrain styling by phase', () => {
    const warning = createTerrainVariantPlatform({ brittle: { phase: 'warning', warningMs: 200, unsupportedGapMs: 0 } });
    const ready = createTerrainVariantPlatform({ brittle: { phase: 'ready', warningMs: 0, unsupportedGapMs: 0 } });
    const broken = createTerrainVariantPlatform({ brittle: { phase: 'broken', warningMs: 0, unsupportedGapMs: 0 } });
    const sticky = createTerrainVariantPlatform({ surfaceMechanic: { kind: 'stickySludge' }, brittle: undefined, height: 24 });

    expect(terrainVariantColor(palette, warning)).toBe(palette.warm);
    expect(terrainVariantAccentColor(palette, warning)).toBe(palette.bright);
    expect(terrainVariantAlpha(warning)).toBe(0.96);
    expect(terrainVariantColor(palette, ready)).toBe(palette.alert);
    expect(terrainVariantAccentColor(palette, ready)).toBe(palette.warm);
    expect(terrainVariantAlpha(ready)).toBe(0.99);
    expect(terrainVariantStrokeColor(palette, ready)).toBe(palette.alert);
    expect(terrainVariantStrokeAlpha(ready)).toBe(0.8);
    expect(terrainVariantAccentWidth(ready)).toBe(Math.max(18, Math.floor(ready.width * 0.9)));
    expect(terrainVariantAccentHeight(ready)).toBe(Math.min(ready.height, Math.max(5, Math.floor(ready.height * 0.4))));
    expect(terrainVariantAccentAlpha(ready)).toBe(1);
    expect(terrainVariantStrokeColor(palette, broken)).toBe(palette.border);
    expect(terrainVariantStrokeAlpha(broken)).toBe(0.18);
    expect(terrainVariantShadowAlpha(broken)).toBe(0.08);
    expect(terrainVariantAccentWidth(broken)).toBe(Math.max(14, Math.floor(broken.width * 0.62)));
    expect(terrainVariantAccentHeight(sticky)).toBe(Math.min(sticky.height, Math.max(5, Math.floor(sticky.height * 0.36))));
    expect(terrainVariantAccentY(sticky)).toBe(sticky.y + Math.max(3, Math.floor(sticky.height * 0.34)));
    expect(terrainVariantAccentAlpha(sticky)).toBe(0.72);
    expect(terrainVariantColor(palette, sticky)).toBe(palette.panelAlt);
    expect(terrainVariantAccentColor(palette, sticky)).toBe(palette.warm);
    expect(terrainVariantAlpha(sticky)).toBe(0.88);
  });

  it('dims gated gravity visuals until capsules are enabled', () => {
    const disabledCapsule = createCapsule({ enabled: false, button: { id: 'button-1', x: 16, y: 50, width: 16, height: 12, activated: true } });
    const field = { id: 'field-1', x: 0, y: 0, width: 40, height: 120, kind: 'anti-grav-stream', gravityCapsuleId: 'capsule-1' } as GravityFieldState;

    expect(gravityFieldColor(palette, field, disabledCapsule)).toBe(0x6f7c67);
    expect(gravityFieldAlpha(field, disabledCapsule)).toBe(0.035);
    expect(gravityCapsuleShellColor(disabledCapsule)).toBe(0x48503b);
    expect(gravityCapsuleShellAlpha(disabledCapsule)).toBe(0.11);
    expect(gravityCapsuleShellStrokeColor(disabledCapsule)).toBe(0xa6b4a0);
    expect(gravityCapsuleEntryDoorColor(disabledCapsule)).toBe(0x76806f);
    expect(gravityCapsuleExitDoorColor(disabledCapsule)).toBe(0xa6b4a0);
    expect(gravityCapsuleDoorAlpha(disabledCapsule)).toBe(0.72);
    expect(gravityCapsuleButtonColor(palette, disabledCapsule)).toBe(palette.border);
    expect(gravityCapsuleButtonCoreColor(palette, disabledCapsule)).toBe(palette.cool);
  });

  it('produces stable reward labels and reveal copy', () => {
    const usedPowerBlock = {
      id: 'reward-1',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
      used: true,
      remainingHits: 0,
      hitFlashMs: 0,
      reward: { kind: 'power', power: 'dash' },
    } as RewardBlockState;
    const coinBlock = {
      ...usedPowerBlock,
      id: 'reward-2',
      used: false,
      remainingHits: 3,
      reward: { kind: 'coins', amount: 3 },
    } as RewardBlockState;
    const powerReveal = {
      id: 'reveal-1',
      x: 0,
      y: 0,
      timerMs: 500,
      durationMs: 1000,
      reward: { kind: 'power', power: 'doubleJump' },
    } as RewardRevealState;
    const coinReveal = {
      ...powerReveal,
      id: 'reveal-2',
      reward: { kind: 'coins', amount: 5 },
    } as RewardRevealState;

    expect(rewardBlockColor(palette, coinBlock)).toBe(palette.warm);
    expect(rewardBlockLabel(usedPowerBlock)).toBe('--');
    expect(rewardBlockLabel(coinBlock)).toBe('RS3');
    expect(rewardRevealText(powerReveal)).toBe('THRUSTER BURST');
    expect(rewardRevealColor(powerReveal)).toBe('#dfe8bf');
    expect(rewardRevealText(coinReveal)).toBe('SAMPLE');
    expect(rewardRevealColor(coinReveal)).toBe('#f5cf64');
  });
});