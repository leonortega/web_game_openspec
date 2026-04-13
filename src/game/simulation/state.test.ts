import { describe, expect, it } from 'vitest';

import {
  COLLECTIBLE_PRESENTATION,
  CHECKPOINT_PRESENTATION,
  createInactiveScannerVolumeState,
  createInactiveTemporaryBridgeState,
  formatActivePowerSummary,
  formatCheckpointStatus,
  formatCollectibleCount,
  formatHudCollectibleSummary,
  formatRunCollectibleSummary,
  formatStageCollectibleSummary,
  formatStageCollectibleTarget,
  getAllCollectiblesRecoveredMessage,
  getCheckpointActivatedMessage,
  getCollectibleRecoveredMessage,
  getCollectibleRewardBlockLabel,
  getCollectibleRewardMessage,
  getCollectibleRewardRevealLabel,
  getPowerGainMessage,
  getPowerHelpSummary,
  getPowerLabel,
  getPowerRevealLabel,
  getPowerShortLabel,
  isBrittleSurfaceBroken,
  isBrittleSurfaceWarning,
  isPlatformActive,
  isPlatformRevealed,
  isTerrainSurfaceSupportActive,
  normalizeRevealedPlatformIds,
} from './state';

describe('astronaut presentation mappings', () => {
  it('maps the four supported powers to astronaut-facing labels and summaries', () => {
    expect(getPowerLabel('doubleJump')).toBe('Thruster Burst');
    expect(getPowerLabel('shooter')).toBe('Plasma Blaster');
    expect(getPowerLabel('invincible')).toBe('Shield Field');
    expect(getPowerLabel('dash')).toBe('Booster Dash');

    expect(getPowerShortLabel('doubleJump')).toBe('TB');
    expect(getPowerShortLabel('shooter')).toBe('PB');
    expect(getPowerShortLabel('invincible')).toBe('SF');
    expect(getPowerShortLabel('dash')).toBe('BD');

    expect(getPowerRevealLabel('invincible')).toBe('SHIELD FIELD');
    expect(getPowerGainMessage('dash')).toBe('Power gained: Booster Dash');
    expect(getPowerHelpSummary('shooter')).toContain('plasma shots');
  });

  it('formats active power summaries without changing the underlying mechanics', () => {
    expect(
      formatActivePowerSummary(
        { doubleJump: true, shooter: false, invincible: false, dash: true },
        { invincibleMs: 0 },
      ),
    ).toBe('Thruster Burst, Booster Dash');

    expect(
      formatActivePowerSummary(
        { doubleJump: false, shooter: false, invincible: true, dash: false },
        { invincibleMs: 4500 },
      ),
    ).toBe('Shield Field (5s)');

    expect(
      formatActivePowerSummary(
        { doubleJump: false, shooter: false, invincible: false, dash: false },
        { invincibleMs: 0 },
      ),
    ).toBe('None');
  });

  it('formats research-sample and survey-beacon presentation strings consistently', () => {
    expect(COLLECTIBLE_PRESENTATION.hudLabel).toBe('Research Samples');
    expect(CHECKPOINT_PRESENTATION.plural).toBe('survey beacons');
    expect(formatCollectibleCount(1)).toBe('1 research sample');
    expect(formatCollectibleCount(4)).toBe('4 research samples');
    expect(formatHudCollectibleSummary(2, 7, 11)).toBe('2/7 in sector (11 research samples total)');
    expect(formatRunCollectibleSummary(11)).toBe('Run research samples: 11');
    expect(formatStageCollectibleTarget(7)).toBe('Sector research samples: 7');
    expect(formatStageCollectibleSummary(2, 7)).toBe('Sector research samples: 2/7');
    expect(formatCheckpointStatus(1, 3)).toBe('Survey beacons online: 1/3');
    expect(getCheckpointActivatedMessage()).toBe('Survey beacon activated');
    expect(getCollectibleRecoveredMessage()).toBe('Research sample recovered');
    expect(getCollectibleRewardMessage(2)).toBe('Research sample gained - 2 left');
    expect(getCollectibleRewardMessage(0)).toBe('Research sample gained');
    expect(getAllCollectiblesRecoveredMessage()).toBe('All research samples recovered - energy restored');
    expect(getCollectibleRewardRevealLabel()).toBe('SAMPLE');
    expect(getCollectibleRewardBlockLabel(2)).toBe('RS2');
  });

  it('normalizes revealed platform ids for deterministic checkpoint snapshots', () => {
    expect(normalizeRevealedPlatformIds(['bridge-b', 'bridge-a', 'bridge-b'])).toEqual(['bridge-a', 'bridge-b']);
  });

  it('treats reveal platforms as solid only after their authored reveal id is active', () => {
    expect(isPlatformRevealed({ reveal: undefined }, [])).toBe(true);
    expect(isPlatformRevealed({ reveal: { id: 'bridge-a' } }, [])).toBe(false);
    expect(isPlatformRevealed({ reveal: { id: 'bridge-a' } }, ['bridge-a'])).toBe(true);
  });

  it('treats temporary bridges as solid only while their runtime state is active', () => {
    expect(isPlatformActive({ id: 'bridge-a', reveal: undefined, temporaryBridge: { scannerId: 'scan-a', durationMs: 2000 } }, [], [])).toBe(false);
    expect(
      isPlatformActive(
        { id: 'bridge-a', reveal: undefined, temporaryBridge: { scannerId: 'scan-a', durationMs: 2000 } },
        [],
        ['bridge-a'],
      ),
    ).toBe(true);
  });

  it('creates inactive scanner and bridge runtime state for fresh attempts and respawns', () => {
    expect(
      createInactiveScannerVolumeState({
        id: 'scanner-a',
        x: 10,
        y: 20,
        width: 30,
        height: 40,
        temporaryBridgeIds: ['bridge-a'],
      }),
    ).toEqual({
      id: 'scanner-a',
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      temporaryBridgeIds: ['bridge-a'],
      activated: false,
      playerInside: false,
    });

    expect(createInactiveTemporaryBridgeState({ id: 'bridge-a', scannerId: 'scanner-a', durationMs: 2400 })).toEqual({
      id: 'bridge-a',
      scannerId: 'scanner-a',
      durationMs: 2400,
      remainingMs: 0,
      active: false,
      pendingHide: false,
    });
  });

  it('treats brittle terrain support as active until the broken phase and keeps sludge always supporting', () => {
    expect(
      isTerrainSurfaceSupportActive({
        kind: 'brittleCrystal',
        brittle: { phase: 'intact', warningMs: 420 },
      }),
    ).toBe(true);
    expect(
      isTerrainSurfaceSupportActive({
        kind: 'brittleCrystal',
        brittle: { phase: 'warning', warningMs: 120 },
      }),
    ).toBe(true);
    expect(
      isTerrainSurfaceSupportActive({
        kind: 'brittleCrystal',
        brittle: { phase: 'expired', warningMs: 0 },
      }),
    ).toBe(true);
    expect(
      isTerrainSurfaceSupportActive({
        kind: 'brittleCrystal',
        brittle: { phase: 'broken', warningMs: 0 },
      }),
    ).toBe(false);
    expect(isTerrainSurfaceSupportActive({ kind: 'stickySludge', brittle: undefined })).toBe(true);
  });

  it('distinguishes brittle warning and broken phases for rendering and runtime checks', () => {
    expect(
      isBrittleSurfaceWarning({
        kind: 'brittleCrystal',
        brittle: { phase: 'warning', warningMs: 120 },
      }),
    ).toBe(true);
    expect(
      isBrittleSurfaceBroken({
        kind: 'brittleCrystal',
        brittle: { phase: 'warning', warningMs: 120 },
      }),
    ).toBe(false);
    expect(
      isBrittleSurfaceBroken({
        kind: 'brittleCrystal',
        brittle: { phase: 'broken', warningMs: 0 },
      }),
    ).toBe(true);
  });
});