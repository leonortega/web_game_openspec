import {
  getCollectibleRewardBlockLabel,
  getCollectibleRewardRevealLabel,
  getPowerRevealLabel,
  getPowerShortLabel,
  isBrittlePlatformBroken,
  isBrittlePlatformReady,
  isBrittlePlatformWarning,
  type GravityCapsuleState,
  type GravityFieldState,
  type PlatformState,
  type RewardBlockState,
  type RewardRevealState,
} from '../../game/simulation/state';
import type { RetroPresentationPalette } from './retroPresentation';

const GRAVITY_ROOM_SHELL_COLOR = 0x2f6f91;
const GRAVITY_ROOM_SHELL_OUTLINE_COLOR = 0x8fdff2;
const GRAVITY_ROOM_BUTTON_COLOR = 0xf2c94c;

const surfaceKind = (platform: PlatformState): NonNullable<PlatformState['surfaceMechanic']>['kind'] | undefined =>
  platform.surfaceMechanic?.kind;

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

export function terrainVariantColor(retroPalette: RetroPresentationPalette, platform: PlatformState): number {
  if (surfaceKind(platform) === 'stickySludge') {
    return retroPalette.panelAlt;
  }

  if (isBrittlePlatformBroken(platform)) {
    return retroPalette.muted;
  }

  if (isBrittlePlatformReady(platform)) {
    return retroPalette.alert;
  }

  if (isBrittlePlatformWarning(platform)) {
    return retroPalette.warm;
  }

  return retroPalette.cool;
}

export function terrainVariantAccentColor(retroPalette: RetroPresentationPalette, platform: PlatformState): number {
  if (surfaceKind(platform) === 'stickySludge') {
    return retroPalette.warm;
  }

  if (isBrittlePlatformBroken(platform)) {
    return retroPalette.ink;
  }

  if (isBrittlePlatformReady(platform)) {
    return retroPalette.warm;
  }

  if (isBrittlePlatformWarning(platform)) {
    return retroPalette.bright;
  }

  return retroPalette.border;
}

export function terrainVariantAlpha(platform: PlatformState): number {
  if (surfaceKind(platform) === 'stickySludge') {
    return 0.88;
  }

  return isBrittlePlatformBroken(platform) ? 0.34 : isBrittlePlatformReady(platform) ? 0.99 : isBrittlePlatformWarning(platform) ? 0.96 : 0.82;
}

export function terrainVariantStrokeColor(retroPalette: RetroPresentationPalette, platform: PlatformState): number {
  if (surfaceKind(platform) === 'stickySludge') {
    return retroPalette.alert;
  }

  return isBrittlePlatformBroken(platform)
    ? retroPalette.border
    : isBrittlePlatformReady(platform)
      ? retroPalette.alert
      : isBrittlePlatformWarning(platform)
        ? retroPalette.bright
        : retroPalette.cool;
}

export function terrainVariantStrokeAlpha(platform: PlatformState): number {
  if (surfaceKind(platform) === 'stickySludge') {
    return 0.42;
  }

  return isBrittlePlatformBroken(platform) ? 0.18 : isBrittlePlatformReady(platform) ? 0.8 : isBrittlePlatformWarning(platform) ? 0.62 : 0.42;
}

export function terrainVariantShadowAlpha(platform: PlatformState): number {
  if (surfaceKind(platform) === 'stickySludge') {
    return 0.2;
  }

  return isBrittlePlatformBroken(platform) ? 0.08 : 0.2;
}

export function terrainVariantAccentY(platform: PlatformState): number {
  if (surfaceKind(platform) === 'stickySludge') {
    return platform.y + Math.max(3, Math.floor(platform.height * 0.34));
  }

  return isBrittlePlatformBroken(platform)
    ? platform.y + platform.height / 2
    : isBrittlePlatformReady(platform)
      ? platform.y + Math.max(1, Math.floor(platform.height * 0.42))
      : platform.y + Math.max(2, Math.floor(platform.height / 2));
}

export function terrainVariantAccentWidth(platform: PlatformState): number {
  if (surfaceKind(platform) === 'stickySludge') {
    return Math.max(18, platform.width - 10);
  }

  return isBrittlePlatformBroken(platform)
    ? Math.max(14, Math.floor(platform.width * 0.62))
    : isBrittlePlatformReady(platform)
      ? Math.max(18, Math.floor(platform.width * 0.9))
      : platform.width;
}

export function terrainVariantAccentHeight(platform: PlatformState): number {
  if (surfaceKind(platform) === 'stickySludge') {
    return Math.min(platform.height, Math.max(5, Math.floor(platform.height * 0.36)));
  }

  return isBrittlePlatformBroken(platform)
    ? Math.min(platform.height, Math.max(3, Math.floor(platform.height * 0.24)))
    : isBrittlePlatformReady(platform)
      ? Math.min(platform.height, Math.max(5, Math.floor(platform.height * 0.4)))
      : Math.min(platform.height, 4);
}

export function terrainVariantAccentAlpha(platform: PlatformState): number {
  if (surfaceKind(platform) === 'stickySludge') {
    return 0.72;
  }

  return isBrittlePlatformBroken(platform)
    ? 0.22
    : isBrittlePlatformReady(platform)
      ? 1
      : isBrittlePlatformWarning(platform)
        ? 0.96
        : 0.82;
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