import * as Phaser from 'phaser';

import {
  isBrittlePlatformBroken,
  isBrittlePlatformReady,
  isBrittlePlatformWarning,
  type GravityFieldState,
  type HazardState,
  type PlatformState,
  type ProjectileState,
  type RewardBlockState,
} from '../../game/simulation/state';

const OUTLINE = 0x13213b;
const SHADOW = 0x0a1224;

const clearGraphics = (graphics: Phaser.GameObjects.Graphics, alpha = 1): void => {
  graphics.clear();
  graphics.setAlpha(alpha);
};

const roundedRect = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: number,
  alpha = 1,
): void => {
  graphics.fillStyle(fill, alpha);
  graphics.fillRoundedRect(x, y, width, height, radius);
};

const rect = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number,
  alpha = 1,
): void => {
  graphics.fillStyle(fill, alpha);
  graphics.fillRect(x, y, width, height);
};

const circle = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  fill: number,
  alpha = 1,
): void => {
  graphics.fillStyle(fill, alpha);
  graphics.fillCircle(x, y, radius);
};

const triangle = (
  graphics: Phaser.GameObjects.Graphics,
  points: [number, number, number, number, number, number],
  fill: number,
  alpha = 1,
): void => {
  graphics.fillStyle(fill, alpha);
  graphics.fillTriangle(...points);
};

const colorPair = (base: number, bright: number, border = OUTLINE) => ({
  base,
  light: Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.ValueToColor(base),
    Phaser.Display.Color.ValueToColor(0xffffff),
    100,
    28,
  ).color,
  deep: Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.ValueToColor(base),
    Phaser.Display.Color.ValueToColor(border),
    100,
    34,
  ).color,
  glow: Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.ValueToColor(base),
    Phaser.Display.Color.ValueToColor(bright),
    100,
    52,
  ).color,
});

export const drawPlatformGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: {
    platform: PlatformState;
    baseColor: number;
    detailColor: number;
    brightColor: number;
    borderColor: number;
    alpha: number;
    active: boolean;
  },
): void => {
  const { platform } = params;
  const width = platform.width;
  const height = platform.height;
  const topBand = Math.min(height, 8);
  const panel = colorPair(params.baseColor, params.brightColor, params.borderColor);
  const trim = colorPair(params.detailColor, params.brightColor, params.borderColor);
  clearGraphics(graphics, params.alpha);
  rect(graphics, 6, height - Math.max(4, Math.floor(height * 0.22)), Math.max(8, width - 12), 5, SHADOW, params.active ? 0.34 : 0.2);
  roundedRect(graphics, 0, 2, width, Math.max(8, height - 2), 4, panel.deep, 0.96);
  roundedRect(graphics, 1, 0, width - 2, Math.max(7, height - 4), 4, panel.base, 1);
  roundedRect(graphics, 3, 2, Math.max(10, width - 6), Math.max(3, topBand - 1), 3, trim.light, 0.9);
  rect(graphics, 4, topBand + 1, Math.max(8, width - 8), 2, trim.base, 0.65);
  const ribCount = Math.max(2, Math.floor(width / 20));
  for (let index = 0; index < ribCount; index += 1) {
    const ribX = 6 + index * Math.max(10, Math.floor((width - 12) / ribCount));
    rect(graphics, ribX, topBand + 5, 3, Math.max(4, height - topBand - 9), panel.deep, 0.38);
  }
  if (platform.kind === 'spring') {
    rect(graphics, 6, height - 10, Math.max(10, width - 12), 3, trim.glow, 0.82);
    for (let x = 8; x < width - 10; x += 10) {
      triangle(graphics, [x, height - 7, x + 4, height - 13, x + 8, height - 7], trim.glow, 0.8);
    }
  } else if (platform.kind === 'moving') {
    rect(graphics, 6, height - 8, Math.max(12, width - 12), 2, trim.base, 0.82);
    triangle(graphics, [width - 14, height / 2, width - 6, height / 2 - 4, width - 6, height / 2 + 4], trim.glow, 0.88);
  } else if (platform.kind === 'falling') {
    rect(graphics, 4, 2, Math.max(10, width - 8), 2, trim.glow, 0.72);
    for (let x = 10; x < width - 4; x += 12) {
      rect(graphics, x, height - 9, 2, 5, trim.deep, 0.66);
    }
  }
  if (platform.magnetic) {
    rect(graphics, 2, 4, 3, Math.max(6, height - 8), params.borderColor, platform.magnetic.powered ? 0.7 : 0.34);
    rect(graphics, width - 5, 4, 3, Math.max(6, height - 8), params.borderColor, platform.magnetic.powered ? 0.7 : 0.34);
  }
  if (platform.temporaryBridge && !params.active) {
    rect(graphics, 2, 2, width - 4, Math.max(4, height - 6), params.brightColor, 0.14);
  }
};

export const drawTerrainVariantGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: {
    platform: PlatformState;
    baseColor: number;
    accentColor: number;
    strokeColor: number;
    alpha: number;
    brightColor: number;
  },
): void => {
  const { platform } = params;
  const width = platform.width;
  const height = platform.height;
  clearGraphics(graphics, params.alpha);
  if (platform.surfaceMechanic?.kind === 'stickySludge') {
    roundedRect(graphics, 3, Math.max(2, Math.floor(height * 0.28)), Math.max(12, width - 6), Math.max(5, Math.floor(height * 0.42)), 4, params.baseColor, 0.86);
    rect(graphics, 5, Math.max(2, Math.floor(height * 0.32)), Math.max(10, width - 10), 3, params.accentColor, 0.88);
    for (let x = 8; x < width - 6; x += 12) {
      rect(graphics, x, height - 5, 3, 5, params.strokeColor, 0.42);
    }
    return;
  }

  roundedRect(graphics, 3, 2, Math.max(12, width - 6), Math.max(6, height - 4), 4, params.baseColor, 0.72);
  rect(graphics, 5, 4, Math.max(10, width - 10), 2, params.brightColor, 0.34);
  const shardAlpha = isBrittlePlatformBroken(platform) ? 0.24 : isBrittlePlatformReady(platform) ? 0.9 : isBrittlePlatformWarning(platform) ? 0.66 : 0.48;
  const crackColor = params.strokeColor;
  for (let x = 8; x < width - 10; x += 14) {
    triangle(graphics, [x, 7, x + 4, height - 6, x + 8, 8], crackColor, shardAlpha);
  }
};

export const drawActivationNodeGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { width: number; height: number; color: number; active: boolean; brightColor: number; borderColor: number },
): void => {
  const core = colorPair(params.color, params.brightColor, params.borderColor);
  clearGraphics(graphics);
  roundedRect(graphics, 0, 0, params.width, params.height, 6, core.deep, 0.95);
  roundedRect(graphics, 3, 3, Math.max(8, params.width - 6), Math.max(8, params.height - 6), 5, core.base, 1);
  circle(graphics, params.width / 2, params.height / 2, Math.max(5, Math.floor(Math.min(params.width, params.height) * 0.18)), core.glow, params.active ? 0.95 : 0.52);
  rect(graphics, 6, params.height / 2 - 1, Math.max(8, params.width - 12), 2, core.light, 0.72);
  rect(graphics, params.width / 2 - 1, 6, 2, Math.max(8, params.height - 12), core.light, 0.72);
};

export const drawGravityFieldGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { field: GravityFieldState; color: number; alpha: number; enabled: boolean; brightColor: number; borderColor: number; time: number },
): void => {
  const { field } = params;
  const width = field.width;
  const height = field.height;
  const fieldColors = colorPair(params.color, params.brightColor, params.borderColor);
  clearGraphics(graphics, params.alpha);
  roundedRect(graphics, 0, 0, width, height, 8, fieldColors.base, field.kind === 'anti-grav-stream' ? 0.18 : 0.14);
  for (let i = 0; i < 4; i += 1) {
    const offset = ((params.time / 120) + i * 9) % Math.max(16, height + 18);
    if (field.kind === 'anti-grav-stream') {
      rect(graphics, 8 + i * Math.max(12, Math.floor(width / 5)), Math.max(-6, offset - 14), 4, Math.max(18, Math.floor(height * 0.4)), fieldColors.glow, params.enabled ? 0.22 + i * 0.04 : 0.08);
    } else {
      rect(graphics, 6, Math.max(-4, offset - 12), Math.max(10, width - 12), 3, fieldColors.glow, params.enabled ? 0.18 + i * 0.04 : 0.08);
    }
  }
  rect(graphics, 2, 2, width - 4, 2, fieldColors.light, 0.36);
};

export const drawGravityCapsuleShellGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { width: number; height: number; shellColor: number; strokeColor: number; alpha: number; enabled: boolean; brightColor: number },
): void => {
  const shell = colorPair(params.shellColor, params.brightColor, params.strokeColor);
  clearGraphics(graphics, params.alpha);
  roundedRect(graphics, 0, 4, params.width, Math.max(12, params.height - 8), 10, shell.deep, 0.86);
  roundedRect(graphics, 3, 0, Math.max(10, params.width - 6), Math.max(12, params.height - 10), 8, shell.base, 0.92);
  roundedRect(graphics, 6, 5, Math.max(8, params.width - 12), Math.max(6, Math.floor(params.height * 0.2)), 4, shell.light, 0.42);
  roundedRect(graphics, 8, Math.floor(params.height * 0.28), Math.max(6, params.width - 16), Math.max(10, Math.floor(params.height * 0.46)), 6, shell.glow, params.enabled ? 0.16 : 0.08);
};

export const drawGravityDoorGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { width: number; height: number; color: number; alpha: number; brightColor: number; borderColor: number },
): void => {
  const door = colorPair(params.color, params.brightColor, params.borderColor);
  clearGraphics(graphics, params.alpha);
  roundedRect(graphics, 0, 0, params.width, params.height, 4, door.deep, 1);
  roundedRect(graphics, 2, 2, Math.max(4, params.width - 4), Math.max(6, params.height - 4), 3, door.base, 0.96);
  rect(graphics, 3, 4, Math.max(3, params.width - 6), 2, door.light, 0.56);
};

export const drawGravityButtonGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { width: number; height: number; shellColor: number; coreColor: number; alpha: number; brightColor: number; borderColor: number; activated: boolean },
): void => {
  const shell = colorPair(params.shellColor, params.brightColor, params.borderColor);
  const core = colorPair(params.coreColor, params.brightColor, params.borderColor);
  clearGraphics(graphics, params.alpha);
  roundedRect(graphics, 0, 0, params.width, params.height, 7, shell.deep, 1);
  roundedRect(graphics, 3, 3, Math.max(8, params.width - 6), Math.max(8, params.height - 6), 5, shell.base, 1);
  roundedRect(graphics, 8, 8, Math.max(6, params.width - 16), Math.max(6, params.height - 16), 4, core.base, params.activated ? 1 : 0.74);
  circle(graphics, params.width / 2, params.height / 2, Math.max(4, Math.floor(Math.min(params.width, params.height) * 0.16)), core.glow, params.activated ? 0.84 : 0.42);
};

export const drawCheckpointGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { width: number; height: number; color: number; activated: boolean; brightColor: number; borderColor: number },
): void => {
  const beacon = colorPair(params.color, params.brightColor, params.borderColor);
  clearGraphics(graphics);
  rect(graphics, Math.floor(params.width / 2) - 2, 18, 4, Math.max(12, params.height - 26), SHADOW, 0.76);
  rect(graphics, Math.floor(params.width / 2) - 1, 10, 2, Math.max(18, params.height - 14), beacon.deep, 1);
  roundedRect(graphics, 3, 0, Math.max(12, params.width - 6), 18, 6, beacon.deep, 0.94);
  roundedRect(graphics, 5, 3, Math.max(8, params.width - 10), 11, 5, beacon.base, 1);
  circle(graphics, params.width / 2, 9, Math.max(4, Math.floor(params.width * 0.16)), beacon.glow, params.activated ? 0.96 : 0.54);
  rect(graphics, 7, 14, Math.max(8, params.width - 14), 2, beacon.light, 0.52);
};

export const drawCollectibleGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { color: number; brightColor: number; borderColor: number; alpha: number; scale: number },
): void => {
  const coin = colorPair(params.color, params.brightColor, params.borderColor);
  clearGraphics(graphics, params.alpha);
  graphics.scale = params.scale;
  circle(graphics, 8, 8, 8, coin.deep, 0.95);
  circle(graphics, 8, 8, 6, coin.base, 1);
  circle(graphics, 8, 8, 3, coin.glow, 0.84);
  rect(graphics, 7, 3, 2, 10, coin.light, 0.6);
};

export const drawRewardBlockGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { rewardBlock: RewardBlockState; color: number; borderColor: number; brightColor: number; flashProgress: number; alpha: number },
): void => {
  const { rewardBlock } = params;
  const block = colorPair(params.color, params.brightColor, params.borderColor);
  clearGraphics(graphics, params.alpha);
  roundedRect(graphics, 0, 2, rewardBlock.width, Math.max(10, rewardBlock.height - 2), 4, block.deep, 1);
  roundedRect(graphics, 1, 0, Math.max(8, rewardBlock.width - 2), Math.max(10, rewardBlock.height - 4), 4, block.base, 1);
  rect(graphics, 4, 3, Math.max(8, rewardBlock.width - 8), 3, block.light, 0.64);
  rect(graphics, 5, rewardBlock.height - 8, Math.max(6, rewardBlock.width - 10), 3, block.deep, 0.5);
  if (params.flashProgress > 0) {
    roundedRect(graphics, 2, 2, rewardBlock.width - 4, rewardBlock.height - 8, 4, 0xffffff, params.flashProgress * 0.38);
  }
  if (rewardBlock.used) {
    rect(graphics, 5, 5, rewardBlock.width - 10, rewardBlock.height - 12, OUTLINE, 0.24);
  }
};

export const drawHazardGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { hazard: HazardState; color: number; brightColor: number; borderColor: number },
): void => {
  const width = params.hazard.rect.width;
  const height = params.hazard.rect.height;
  const spikes = colorPair(params.color, params.brightColor, params.borderColor);
  clearGraphics(graphics);
  rect(graphics, 0, Math.max(2, height - 5), width, 5, spikes.deep, 0.92);
  const toothWidth = Math.max(8, Math.floor(width / 3));
  const count = Math.max(2, Math.floor(width / toothWidth));
  for (let i = 0; i < count; i += 1) {
    const x = i * toothWidth;
    triangle(graphics, [x + 1, height - 3, x + toothWidth / 2, 0, x + toothWidth - 1, height - 3], spikes.base, 1);
    triangle(graphics, [x + toothWidth / 2, 1, x + toothWidth / 2 + 3, height - 6, x + toothWidth - 3, height - 4], spikes.light, 0.44);
  }
};

export const drawProjectileGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { projectile: ProjectileState; color: number; brightColor: number; borderColor: number; alpha: number },
): void => {
  const bolt = colorPair(params.color, params.brightColor, params.borderColor);
  clearGraphics(graphics, params.alpha);
  const width = params.projectile.variant ? 14 : 12;
  const height = params.projectile.variant ? 10 : 8;
  roundedRect(graphics, 0, 1, width, Math.max(4, height - 2), 3, bolt.deep, 0.88);
  roundedRect(graphics, 2, 2, Math.max(6, width - 4), Math.max(3, height - 4), 2, bolt.base, 1);
  rect(graphics, width - 3, 3, 2, Math.max(2, height - 6), bolt.glow, 0.84);
};
