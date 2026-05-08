import * as Phaser from 'phaser';

import type { EnemyState, PlayerPowerVariant } from '../../game/simulation/state';
import type { RetroEnemyPose } from './retroPresentation';
import { mixColor } from './retroPresentation';

type PlayerDrawParams = {
  variantKey: 'base' | 'doubleJump' | 'shooter' | 'invincible' | 'dash';
  width: number;
  height: number;
  facing: 1 | -1;
  variant: PlayerPowerVariant;
  pose: string;
  alpha: number;
  hitFlashBlend: number;
  defeat: boolean;
  brightColor: number;
  alertColor: number;
};

type EnemyDrawParams = {
  enemy: EnemyState;
  pose: RetroEnemyPose;
  tint: number;
  alpha: number;
  hitFlashBlend: number;
  brightColor: number;
  borderColor: number;
};

const OUTLINE = 0x161127;
const SPACE_SHADOW = 0x060914;

const clearGraphics = (graphics: Phaser.GameObjects.Graphics, alpha: number, tint: number): void => {
  graphics.clear();
  graphics.setAlpha(alpha);
  graphics.setData('renderTint', tint);
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

const mirroredX = (x: number, width: number, totalWidth: number, facing: 1 | -1): number =>
  facing === 1 ? x : totalWidth - x - width;

const colorPair = (base: number, brightColor: number, borderColor = OUTLINE) => ({
  base,
  light: mixColor(base, 0xffffff, 0.3),
  deep: mixColor(base, borderColor, 0.34),
  glow: mixColor(base, brightColor, 0.52),
});

export const drawAstronautGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: PlayerDrawParams,
): void => {
  const baseBody = params.defeat ? mixColor(params.variant.bodyColor, 0xffb39f, 0.5) : params.variant.bodyColor;
  const baseDetail = params.defeat ? mixColor(params.variant.detailColor, params.brightColor, 0.4) : params.variant.detailColor;
  const baseAccent = params.defeat ? mixColor(params.variant.accentColor, params.brightColor, 0.68) : params.variant.accentColor;
  const bodyColor = mixColor(baseBody, params.brightColor, params.hitFlashBlend * 0.7);
  const detailColor = mixColor(baseDetail, params.brightColor, params.hitFlashBlend * 0.38);
  const accentColor = mixColor(baseAccent, params.brightColor, params.hitFlashBlend * 0.84);
  const shadowColor = mixColor(detailColor, SPACE_SHADOW, 0.55);
  const suit = colorPair(bodyColor, params.brightColor, params.alertColor);
  const trim = colorPair(detailColor, params.brightColor, params.alertColor);
  const visor = colorPair(accentColor, params.brightColor, params.alertColor);
  const width = params.width;
  const jumpPose = params.pose === 'jump';
  const fallPose = params.pose === 'fall';
  const dashPose = params.pose === 'dash';
  const runA = params.pose === 'run-a';
  const runB = params.pose === 'run-b';
  const torsoY = dashPose ? 12 : jumpPose ? 9 : fallPose ? 14 : 11;
  const torsoH = dashPose ? 14 : fallPose ? 18 : 16;
  const helmetY = jumpPose ? 0 : fallPose ? 4 : 2;
  const backpackY = jumpPose ? 11 : fallPose ? 15 : 13;
  const frontArmLift = jumpPose ? -8 : dashPose ? -2 : fallPose ? 2 : runA ? -2 : runB ? 2 : 0;
  const backArmLift = jumpPose ? 4 : dashPose ? 3 : fallPose ? -1 : runA ? 2 : runB ? -2 : 0;
  const leftLegLift = jumpPose ? -6 : dashPose ? -3 : runA ? -2 : runB ? 2 : 0;
  const rightLegLift = jumpPose ? -3 : dashPose ? -1 : runA ? 2 : runB ? -2 : 0;
  const forwardFacing = params.facing === 1;

  clearGraphics(graphics, params.alpha, bodyColor);

  roundedRect(graphics, mirroredX(3, 6, width, params.facing), backpackY, 6, 14, 3, trim.deep, 0.72);
  roundedRect(graphics, mirroredX(4, 4, width, params.facing), backpackY + 2, 4, 9, 2, trim.base, 0.9);

  const backArmX = mirroredX(forwardFacing ? 2 : width - 6, 4, width, params.facing);
  roundedRect(graphics, backArmX, torsoY + 2 + backArmLift, 4, jumpPose ? 12 : 11, 2, suit.deep, 0.9);

  roundedRect(graphics, 5, torsoY, 14, torsoH, 5, suit.base);
  roundedRect(graphics, 6, torsoY + 2, 12, 4, 3, suit.light, 0.58);
  roundedRect(graphics, 7, torsoY + 7, 10, 5, 2, trim.base, 0.95);
  roundedRect(graphics, 8, torsoY + 14, 8, 3, 2, trim.deep, 0.88);
  roundedRect(graphics, 10, torsoY + 8, 4, 4, 2, visor.glow, 0.5);

  roundedRect(graphics, 4, helmetY, 16, 12, 6, suit.deep, 0.92);
  roundedRect(graphics, 5, helmetY + 1, 14, 10, 5, suit.base);
  roundedRect(graphics, 6, helmetY + 2, 12, 2, 2, suit.light, 0.72);
  const visorWidth = 8;
  const visorLocalX = mirroredX(forwardFacing ? 9 : 7, visorWidth, width, params.facing);
  roundedRect(graphics, visorLocalX, helmetY + 4, visorWidth, 5, 2, visor.deep, 1);
  roundedRect(graphics, visorLocalX + (params.facing === 1 ? 1 : 2), helmetY + 5, 4, 2, 1, visor.glow, 0.72);
  roundedRect(graphics, mirroredX(6, 2, width, params.facing), helmetY + 5, 2, 3, 1, trim.glow, 0.8);

  const frontArmX = mirroredX(forwardFacing ? width - 6 : 2, 4, width, params.facing);
  roundedRect(graphics, frontArmX, torsoY + 1 + frontArmLift, 4, jumpPose ? 11 : 12, 2, suit.base, 1);
  roundedRect(graphics, frontArmX, torsoY + 9 + frontArmLift, 4, 3, 1, trim.base, 0.9);

  const leftLegX = mirroredX(7, 4, width, params.facing);
  const rightLegX = mirroredX(13, 4, width, params.facing);
  roundedRect(graphics, leftLegX, 28 + leftLegLift, 4, 9, 2, suit.base);
  roundedRect(graphics, rightLegX, 28 + rightLegLift, 4, 9, 2, suit.base);
  roundedRect(graphics, leftLegX - 1, 37 + leftLegLift, 6, 4, 2, shadowColor, 1);
  roundedRect(graphics, rightLegX - 1, 37 + rightLegLift, 6, 4, 2, shadowColor, 1);
  roundedRect(graphics, leftLegX - 1, 37 + leftLegLift, 6, 2, 1, trim.base, 0.9);
  roundedRect(graphics, rightLegX - 1, 37 + rightLegLift, 6, 2, 1, trim.base, 0.9);

  switch (params.variantKey) {
    case 'doubleJump':
      roundedRect(graphics, mirroredX(1, 7, width, params.facing), backpackY + 2, 7, 10, 3, trim.base, 0.98);
      roundedRect(graphics, mirroredX(0, 3, width, params.facing), backpackY + 4, 3, 4, 2, visor.glow, 0.88);
      roundedRect(graphics, mirroredX(8, 2, width, params.facing), backpackY + 4, 2, 4, 1, visor.glow, 0.88);
      roundedRect(graphics, mirroredX(1, 3, width, params.facing), backpackY + 12, 3, 3, 1, visor.glow, 0.72);
      roundedRect(graphics, mirroredX(6, 3, width, params.facing), backpackY + 12, 3, 3, 1, visor.glow, 0.72);
      break;
    case 'shooter':
      roundedRect(graphics, mirroredX(forwardFacing ? width - 5 : 1, 5, width, params.facing), torsoY + 5 + frontArmLift, 5, 10, 2, trim.deep, 1);
      roundedRect(graphics, mirroredX(forwardFacing ? width - 7 : 0, 7, width, params.facing), torsoY + 9 + frontArmLift, 7, 4, 2, trim.base, 1);
      roundedRect(graphics, mirroredX(forwardFacing ? width - 2 : 0, 2, width, params.facing), torsoY + 10 + frontArmLift, 2, 2, 1, visor.glow, 0.9);
      roundedRect(graphics, mirroredX(forwardFacing ? 1 : width - 8, 7, width, params.facing), backpackY + 3, 7, 8, 3, trim.base, 0.94);
      break;
    case 'invincible':
      roundedRect(graphics, mirroredX(1, 3, width, params.facing), torsoY + 7, 3, 8, 2, visor.glow, 0.26);
      roundedRect(graphics, mirroredX(20, 3, width, params.facing), torsoY + 7, 3, 8, 2, visor.glow, 0.26);
      roundedRect(graphics, 5, 11, 3, 3, 2, visor.glow, 0.7);
      roundedRect(graphics, 16, 11, 3, 3, 2, visor.glow, 0.7);
      break;
    case 'dash':
      roundedRect(graphics, mirroredX(1, 7, width, params.facing), backpackY + 2, 7, 11, 3, trim.base, 0.96);
      roundedRect(graphics, mirroredX(0, 10, width, params.facing), torsoY + 9, 10, 3, 2, visor.glow, dashPose ? 0.88 : 0.52);
      roundedRect(graphics, mirroredX(0, 8, width, params.facing), torsoY + 14, 8, 2, 1, trim.glow, dashPose ? 0.9 : 0.45);
      break;
    default:
      roundedRect(graphics, mirroredX(4, 4, width, params.facing), backpackY + 4, 4, 6, 2, trim.base, 0.8);
      break;
  }

  if (dashPose) {
    roundedRect(graphics, mirroredX(0, 4, width, params.facing), 18, 4, 7, 2, visor.glow, 0.65);
    roundedRect(graphics, mirroredX(1, 2, width, params.facing), 20, 2, 3, 1, trim.glow, 0.72);
  }
};

const drawAlienCoreEye = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  brightColor: number,
  borderColor: number,
): void => {
  roundedRect(graphics, x, y, width, 7, 3, mixColor(brightColor, 0x001822, 0.55), 1);
  roundedRect(graphics, x + 2, y + 2, width - 4, 3, 2, brightColor, 0.78);
  roundedRect(graphics, x + Math.max(2, Math.floor(width / 2) - 1), y + 2, 2, 3, 1, borderColor, 0.9);
};

const drawWalkerAlien = (graphics: Phaser.GameObjects.Graphics, params: EnemyDrawParams, tint: number): void => {
  const shell = colorPair(tint, params.brightColor, params.borderColor);
  const acid = colorPair(mixColor(tint, 0x9ff8c7, 0.4), params.brightColor, params.borderColor);
  roundedRect(graphics, 4, 8, 22, 12, 5, shell.base);
  roundedRect(graphics, 6, 10, 18, 4, 3, shell.light, 0.6);
  roundedRect(graphics, 8, 2, 14, 10, 5, acid.base);
  drawAlienCoreEye(graphics, 10, 4, 10, acid.glow, params.borderColor);
  roundedRect(graphics, 3, 12, 4, 7, 2, shell.deep, 0.95);
  roundedRect(graphics, 23, 12, 4, 7, 2, shell.deep, 0.95);
  roundedRect(graphics, 7, 20, 4, 7, 2, acid.deep, 1);
  roundedRect(graphics, 19, 20, 4, 7, 2, acid.deep, 1);
  roundedRect(graphics, 6, 25, 6, 3, 2, SPACE_SHADOW, 1);
  roundedRect(graphics, 18, 25, 6, 3, 2, SPACE_SHADOW, 1);
};

const drawHopperAlien = (graphics: Phaser.GameObjects.Graphics, params: EnemyDrawParams, tint: number): void => {
  const body = colorPair(tint, params.brightColor, params.borderColor);
  const glow = colorPair(mixColor(tint, 0xd8ff8f, 0.45), params.brightColor, params.borderColor);
  roundedRect(graphics, 5, 9, 20, 10, 6, body.base);
  roundedRect(graphics, 7, 4, 16, 9, 5, body.light);
  drawAlienCoreEye(graphics, 11, 6, 8, glow.glow, params.borderColor);
  roundedRect(graphics, 8, 17, 14, 6, 4, glow.base, 0.9);
  roundedRect(graphics, 4, 20, 6, 8, 3, glow.deep, 1);
  roundedRect(graphics, 20, 20, 6, 8, 3, glow.deep, 1);
  roundedRect(graphics, 5, 26, 7, 2, 1, SPACE_SHADOW, 1);
  roundedRect(graphics, 18, 26, 7, 2, 1, SPACE_SHADOW, 1);
};

const drawTurretAlien = (graphics: Phaser.GameObjects.Graphics, params: EnemyDrawParams, tint: number): void => {
  const pod = colorPair(tint, params.brightColor, params.borderColor);
  const plasma = colorPair(mixColor(tint, 0xffd97c, 0.5), params.brightColor, params.borderColor);
  const facing = params.enemy.direction >= 0 ? 1 : -1;
  const mx = (x: number, width: number) => mirroredX(x, width, 34, facing);
  roundedRect(graphics, mx(7, 14), 18, 14, 15, 5, pod.deep, 1);
  roundedRect(graphics, mx(5, 16), 8, 16, 14, 6, pod.base);
  roundedRect(graphics, mx(7, 12), 11, 12, 5, 3, pod.light, 0.65);
  drawAlienCoreEye(graphics, mx(8, 10), 12, 10, plasma.glow, params.borderColor);
  roundedRect(graphics, mx(19, 10), 12, 10, 4, 2, pod.deep, 1);
  roundedRect(graphics, mx(26, 6), 11, 6, 6, 2, plasma.base, 1);
  roundedRect(graphics, mx(28, 4), 12, 4, 4, 2, plasma.glow, 0.9);
  roundedRect(graphics, mx(22, 3), 24, 3, 10, 2, pod.deep, 1);
  roundedRect(graphics, mx(8, 12), 33, 12, 4, 2, SPACE_SHADOW, 1);
};

const drawChargerAlien = (graphics: Phaser.GameObjects.Graphics, params: EnemyDrawParams, tint: number): void => {
  const shell = colorPair(tint, params.brightColor, params.borderColor);
  const venom = colorPair(mixColor(tint, 0xff8b66, 0.36), params.brightColor, params.borderColor);
  roundedRect(graphics, 5, 10, 24, 12, 6, shell.base);
  roundedRect(graphics, 8, 4, 18, 9, 5, shell.light);
  drawAlienCoreEye(graphics, 11, 7, 10, venom.glow, params.borderColor);
  roundedRect(graphics, 4, 8, 3, 7, 2, venom.base, 1);
  roundedRect(graphics, 27, 8, 3, 7, 2, venom.base, 1);
  roundedRect(graphics, 7, 21, 6, 8, 3, shell.deep, 1);
  roundedRect(graphics, 21, 21, 6, 8, 3, shell.deep, 1);
  roundedRect(graphics, 6, 27, 8, 3, 2, SPACE_SHADOW, 1);
  roundedRect(graphics, 20, 27, 8, 3, 2, SPACE_SHADOW, 1);
};

const drawFlyerAlien = (graphics: Phaser.GameObjects.Graphics, params: EnemyDrawParams, tint: number): void => {
  const manta = colorPair(tint, params.brightColor, params.borderColor);
  const nebula = colorPair(mixColor(tint, 0x8ffcff, 0.5), params.brightColor, params.borderColor);
  roundedRect(graphics, 9, 4, 16, 8, 4, nebula.base);
  drawAlienCoreEye(graphics, 12, 5, 10, nebula.glow, params.borderColor);
  roundedRect(graphics, 4, 11, 26, 5, 3, manta.light, 0.98);
  roundedRect(graphics, 1, 12, 8, 3, 2, nebula.base, 0.9);
  roundedRect(graphics, 25, 12, 8, 3, 2, nebula.base, 0.9);
  roundedRect(graphics, 8, 16, 18, 4, 2, manta.base, 0.96);
  roundedRect(graphics, 12, 20, 10, 2, 1, nebula.glow, 0.72);
  roundedRect(graphics, 11, 20, 2, 4, 1, manta.deep, 0.9);
  roundedRect(graphics, 21, 20, 2, 4, 1, manta.deep, 0.9);
};

export const drawEnemyGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: EnemyDrawParams,
): void => {
  const baseTint = mixColor(params.tint, params.brightColor, params.hitFlashBlend * 0.82);
  clearGraphics(graphics, params.alpha, baseTint);

  switch (params.enemy.kind) {
    case 'walker':
      drawWalkerAlien(graphics, params, baseTint);
      break;
    case 'hopper':
      drawHopperAlien(graphics, params, mixColor(baseTint, 0xbaff8e, 0.18));
      break;
    case 'turret':
      drawTurretAlien(graphics, params, baseTint);
      break;
    case 'charger':
      drawChargerAlien(graphics, params, mixColor(baseTint, 0xff8e63, params.enemy.charger?.state === 'charge' ? 0.35 : 0.12));
      break;
    case 'flyer':
      drawFlyerAlien(graphics, params, mixColor(baseTint, 0x92f0ff, 0.24));
      break;
    default:
      drawWalkerAlien(graphics, params, baseTint);
      break;
  }
};
