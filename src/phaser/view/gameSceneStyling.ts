import {
  getCollectibleRewardBlockLabel,
  getCollectibleRewardRevealLabel,
  getPowerRevealLabel,
  getPowerShortLabel,
  isBrittleSurfaceBroken,
  isBrittleSurfaceWarning,
  type GravityCapsuleState,
  type GravityFieldState,
  type LauncherState,
  type PlatformState,
  type RewardBlockState,
  type RewardRevealState,
  type TerrainSurfaceState,
} from '../../game/simulation/state';
import type { RetroPresentationPalette } from './retroPresentation';

const GRAVITY_ROOM_SHELL_COLOR = 0x2f6f91;
const GRAVITY_ROOM_SHELL_OUTLINE_COLOR = 0x8fdff2;
const GRAVITY_ROOM_BUTTON_COLOR = 0xf2c94c;

export function platformColor(retroPalette: RetroPresentationPalette, platform: PlatformState): number {
  if (platform.magnetic) {
    return platform.magnetic.powered ? retroPalette.cool : retroPalette.panelAlt;
  }

  if (platform.temporaryBridge) {
    return retroPalette.cool;
  }

  if (platform.reveal) {
    return retroPalette.border;
  }

  switch (platform.kind) {
    case 'moving':
      return retroPalette.muted;
    case 'falling':
      return retroPalette.alert;
    case 'spring':
      return retroPalette.safe;
    default:
      return retroPalette.panelAlt;
  }
}

export function platformDetailColor(retroPalette: RetroPresentationPalette, platform: PlatformState): number {
  if (platform.magnetic) {
    return platform.magnetic.powered ? retroPalette.bright : retroPalette.cool;
  }

  if (platform.temporaryBridge) {
    return retroPalette.bright;
  }

  if (platform.reveal) {
    return retroPalette.cool;
  }

  switch (platform.kind) {
    case 'moving':
      return retroPalette.cool;
    case 'falling':
      return retroPalette.warm;
    case 'spring':
      return retroPalette.border;
    default:
      return retroPalette.muted;
  }
}

export function activationNodeColor(retroPalette: RetroPresentationPalette, node: { activated: boolean }): number {
  return node.activated ? retroPalette.safe : retroPalette.muted;
}

export function terrainSurfaceColor(retroPalette: RetroPresentationPalette, surface: TerrainSurfaceState): number {
  if (surface.kind === 'stickySludge') {
    return retroPalette.panelAlt;
  }

  if (isBrittleSurfaceBroken(surface)) {
    return retroPalette.muted;
  }

  if (isBrittleSurfaceWarning(surface)) {
    return retroPalette.warm;
  }

  return retroPalette.cool;
}

export function terrainSurfaceAccentColor(retroPalette: RetroPresentationPalette, surface: TerrainSurfaceState): number {
  if (surface.kind === 'stickySludge') {
    return retroPalette.warm;
  }

  if (isBrittleSurfaceBroken(surface)) {
    return retroPalette.ink;
  }

  if (isBrittleSurfaceWarning(surface)) {
    return retroPalette.bright;
  }

  return retroPalette.border;
}

export function launcherColor(retroPalette: RetroPresentationPalette, launcherEntry: LauncherState): number {
  return launcherEntry.kind === 'bouncePod' ? retroPalette.safe : retroPalette.warm;
}

export function terrainSurfaceAlpha(surface: TerrainSurfaceState): number {
  if (surface.kind === 'stickySludge') {
    return 0.88;
  }

  return isBrittleSurfaceBroken(surface) ? 0.34 : isBrittleSurfaceWarning(surface) ? 0.96 : 0.82;
}

export function terrainSurfaceStrokeColor(retroPalette: RetroPresentationPalette, surface: TerrainSurfaceState): number {
  if (surface.kind === 'stickySludge') {
    return retroPalette.alert;
  }

  return isBrittleSurfaceBroken(surface)
    ? retroPalette.border
    : isBrittleSurfaceWarning(surface)
      ? retroPalette.bright
      : retroPalette.cool;
}

export function terrainSurfaceStrokeAlpha(surface: TerrainSurfaceState): number {
  if (surface.kind === 'stickySludge') {
    return 0.42;
  }

  return isBrittleSurfaceBroken(surface) ? 0.18 : isBrittleSurfaceWarning(surface) ? 0.62 : 0.42;
}

export function terrainSurfaceShadowAlpha(surface: TerrainSurfaceState): number {
  if (surface.kind === 'stickySludge') {
    return 0.2;
  }

  return isBrittleSurfaceBroken(surface) ? 0.08 : 0.2;
}

export function terrainSurfaceAccentY(surface: TerrainSurfaceState): number {
  if (surface.kind === 'stickySludge') {
    return surface.y + Math.max(3, Math.floor(surface.height * 0.34));
  }

  return isBrittleSurfaceBroken(surface)
    ? surface.y + surface.height / 2
    : surface.y + Math.max(2, Math.floor(surface.height / 2));
}

export function terrainSurfaceAccentWidth(surface: TerrainSurfaceState): number {
  if (surface.kind === 'stickySludge') {
    return Math.max(18, surface.width - 10);
  }

  return isBrittleSurfaceBroken(surface) ? Math.max(14, Math.floor(surface.width * 0.62)) : surface.width;
}

export function terrainSurfaceAccentHeight(surface: TerrainSurfaceState): number {
  if (surface.kind === 'stickySludge') {
    return Math.min(surface.height, Math.max(5, Math.floor(surface.height * 0.36)));
  }

  return isBrittleSurfaceBroken(surface)
    ? Math.min(surface.height, Math.max(3, Math.floor(surface.height * 0.24)))
    : Math.min(surface.height, 4);
}

export function terrainSurfaceAccentAlpha(surface: TerrainSurfaceState): number {
  if (surface.kind === 'stickySludge') {
    return 0.72;
  }

  return isBrittleSurfaceBroken(surface) ? 0.22 : isBrittleSurfaceWarning(surface) ? 0.96 : 0.82;
}

export function gravityFieldColor(
  retroPalette: RetroPresentationPalette,
  field: GravityFieldState,
  capsule: GravityCapsuleState | null = null,
): number {
  if (capsule && !capsule.enabled) {
    return 0x6f7c67;
  }

  return field.kind === 'anti-grav-stream' ? retroPalette.cool : retroPalette.warm;
}

export function gravityFieldAlpha(field: GravityFieldState, capsule: GravityCapsuleState | null = null): number {
  if (capsule && !capsule.enabled) {
    return 0.035;
  }

  return field.kind === 'anti-grav-stream' ? 0.13 : 0.11;
}

export function gravityCapsuleShellColor(capsule: GravityCapsuleState): number {
  return capsule.enabled ? GRAVITY_ROOM_SHELL_COLOR : 0x48503b;
}

export function gravityCapsuleShellAlpha(capsule: GravityCapsuleState): number {
  return capsule.enabled ? 0.16 : 0.11;
}

export function gravityCapsuleShellStrokeColor(capsule: GravityCapsuleState): number {
  return capsule.enabled ? GRAVITY_ROOM_SHELL_OUTLINE_COLOR : 0xa6b4a0;
}

export function gravityCapsuleEntryDoorColor(capsule: GravityCapsuleState): number {
  return capsule.enabled ? 0xf5cf64 : 0x76806f;
}

export function gravityCapsuleExitDoorColor(capsule: GravityCapsuleState): number {
  return capsule.enabled ? 0x8fdff2 : 0xa6b4a0;
}

export function gravityCapsuleDoorAlpha(capsule: GravityCapsuleState): number {
  return capsule.enabled ? 0.94 : 0.72;
}

export function gravityCapsuleButtonColor(retroPalette: RetroPresentationPalette, capsule: GravityCapsuleState): number {
  return capsule.button.activated ? retroPalette.border : GRAVITY_ROOM_BUTTON_COLOR;
}

export function gravityCapsuleButtonCoreColor(retroPalette: RetroPresentationPalette, capsule: GravityCapsuleState): number {
  return capsule.enabled ? 0x5a2c20 : retroPalette.cool;
}

export function rewardBlockColor(retroPalette: RetroPresentationPalette, rewardBlock: RewardBlockState): number {
  if (rewardBlock.reward.kind === 'coins') {
    return retroPalette.warm;
  }

  switch (rewardBlock.reward.power) {
    case 'doubleJump':
      return 0xdfe8bf;
    case 'shooter':
      return 0xf0c6a1;
    case 'invincible':
      return retroPalette.cool;
    case 'dash':
      return retroPalette.border;
  }
}

export function rewardBlockLabel(rewardBlock: RewardBlockState): string {
  if (rewardBlock.reward.kind === 'coins') {
    return getCollectibleRewardBlockLabel(rewardBlock.remainingHits);
  }

  if (rewardBlock.used) {
    return '--';
  }

  return getPowerShortLabel(rewardBlock.reward.power);
}

export function rewardRevealText(rewardReveal: RewardRevealState): string {
  if (rewardReveal.reward.kind === 'coins') {
    return getCollectibleRewardRevealLabel();
  }

  return getPowerRevealLabel(rewardReveal.reward.power);
}

export function rewardRevealColor(rewardReveal: RewardRevealState): string {
  if (rewardReveal.reward.kind === 'coins') {
    return '#f5cf64';
  }

  switch (rewardReveal.reward.power) {
    case 'doubleJump':
      return '#dfe8bf';
    case 'shooter':
      return '#f0c6a1';
    case 'invincible':
      return '#8fdff2';
    case 'dash':
      return '#f7f3d6';
  }
}