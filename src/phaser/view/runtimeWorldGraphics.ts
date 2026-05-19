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

const line = (
  graphics: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: number,
  alpha = 1,
): void => {
  graphics.lineStyle(width, color, alpha);
  graphics.beginPath();
  graphics.moveTo(x1, y1);
  graphics.lineTo(x2, y2);
  graphics.strokePath();
};

const cartoonMagnet = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  params: {
    bodyColor: number;
    capColor: number;
    innerColor: number;
    alpha: number;
    glowColor?: number;
    glowAlpha?: number;
  },
): void => {
  const outerRadius = 5 * scale;
  const innerRadius = 2.6 * scale;
  const legHeight = 8 * scale;
  const legWidth = 3.2 * scale;
  const capHeight = 2.6 * scale;
  if ((params.glowAlpha ?? 0) > 0 && params.glowColor !== undefined) {
    circle(graphics, x, y + 3 * scale, outerRadius + 2.2 * scale, params.glowColor, params.glowAlpha);
  }
  circle(graphics, x, y + 3 * scale, outerRadius, params.bodyColor, params.alpha);
  circle(graphics, x, y + 3 * scale, innerRadius, params.innerColor, params.alpha);
  rect(graphics, x - outerRadius - 1, y - outerRadius - 1, outerRadius * 2 + 2, outerRadius, params.innerColor, params.alpha);
  roundedRect(graphics, x - outerRadius, y - outerRadius, legWidth, legHeight, 1.4 * scale, params.bodyColor, params.alpha);
  roundedRect(graphics, x + outerRadius - legWidth, y - outerRadius, legWidth, legHeight, 1.4 * scale, params.bodyColor, params.alpha);
  rect(graphics, x - outerRadius, y - outerRadius, legWidth, capHeight, params.capColor, params.alpha);
  rect(graphics, x + outerRadius - legWidth, y - outerRadius, legWidth, capHeight, params.capColor, params.alpha);
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
    timeMs: number;
    playerTouching: boolean;
    springEngaged: boolean;
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
  if (platform.kind !== 'falling' && !platform.magnetic) {
    for (let index = 0; index < ribCount; index += 1) {
      const ribX = 6 + index * Math.max(10, Math.floor((width - 12) / ribCount));
      rect(graphics, ribX, topBand + 5, 3, Math.max(4, height - topBand - 9), panel.deep, 0.38);
    }
  }
  if (platform.kind === 'spring') {
    const springRatio = platform.spring ? Phaser.Math.Clamp(platform.spring.timerMs / Math.max(platform.spring.cooldownMs, 1), 0, 1) : 0;
    const boingLift = params.springEngaged ? 7 : Math.max(0, 5 - Math.round(springRatio * 6));
    const compression = params.springEngaged ? 4 : Math.round(springRatio * 3);
    const springTop = height - 13 + compression - boingLift;
    rect(graphics, 6, height - 7, Math.max(10, width - 12), 3, trim.glow, 0.9);
    rect(graphics, 8, height - 16 + compression - boingLift, Math.max(6, width - 16), 2, trim.light, params.springEngaged ? 0.92 : 0.72);
    const springStartX = 10;
    const springEndX = width - 10;
    const segments = Math.max(4, Math.floor((springEndX - springStartX) / 6));
    const step = (springEndX - springStartX) / segments;
    for (let index = 0; index < segments; index += 1) {
      const x1 = springStartX + index * step;
      const x2 = springStartX + (index + 1) * step;
      const y1 = index % 2 === 0 ? springTop : height - 8;
      const y2 = index % 2 === 0 ? height - 8 : springTop;
      line(graphics, x1, y1, x2, y2, 2, trim.base, 0.96);
    }
    if (params.springEngaged) {
      triangle(graphics, [width / 2 - 6, springTop - 2, width / 2, springTop - 10, width / 2 + 6, springTop - 2], trim.glow, 0.88);
      rect(graphics, width / 2 - 2, springTop - 14, 4, 6, params.brightColor, 0.72);
    }
  } else if (platform.kind === 'moving') {
    const spin = (params.timeMs / 280) % (Math.PI * 2);
    const gearCenters = [Math.max(10, Math.floor(width * 0.28)), Math.min(width - 10, Math.floor(width * 0.72))];
    gearCenters.forEach((centerX, index) => {
      const radius = index === 0 ? 5 : 6;
      circle(graphics, centerX, height - 11, radius + 2, trim.deep, 0.95);
      circle(graphics, centerX, height - 11, radius, trim.base, 1);
      for (let tooth = 0; tooth < 6; tooth += 1) {
        const angle = spin + tooth * (Math.PI / 3) * (index === 0 ? 1 : -1);
        const toothX = centerX + Math.cos(angle) * (radius + 3);
        const toothY = height - 11 + Math.sin(angle) * (radius + 3);
        rect(graphics, toothX - 1, toothY - 1, 2, 2, trim.light, 0.84);
      }
      circle(graphics, centerX, height - 11, 2, trim.glow, 0.9);
    });
  } else if (platform.kind === 'falling') {
    const rocketCenters = [10, width / 2, width - 10].map((centerX) =>
      Phaser.Math.Clamp(centerX, 8, Math.max(8, width - 8)),
    );
    const rocketsOffline = Boolean(platform.fall?.falling);
    const flameAlpha = rocketsOffline ? 0 : 0.72;
    rocketCenters.forEach((centerX, index) => {
      roundedRect(graphics, centerX - 4, height - 15, 8, 9, 3, trim.deep, 0.96);
      roundedRect(graphics, centerX - 3, height - 14, 6, 6, 2, trim.base, 1);
      triangle(graphics, [centerX - 4, height - 7, centerX, height - 2, centerX + 4, height - 7], trim.light, 0.86);
      rect(graphics, centerX - 2, height - 17, 4, 2, rocketsOffline ? trim.base : trim.glow, rocketsOffline ? 0.38 : 0.74);
      if (flameAlpha > 0.1) {
        triangle(graphics, [centerX - 3, height - 4, centerX, height + 4 + index % 2, centerX + 3, height - 4], trim.glow, flameAlpha);
        triangle(graphics, [centerX - 2, height - 4, centerX, height + 1 + index % 2, centerX + 2, height - 4], params.brightColor, flameAlpha * 0.9);
      }
    });
  }
  if (platform.magnetic) {
    const pulse = params.playerTouching ? 0.8 + Math.sin(params.timeMs / 90) * 0.18 : 0.34;
    const magnetColor = platform.magnetic.powered ? trim.glow : trim.base;
    const magnets = [Math.max(12, Math.floor(width * 0.28)), Math.min(width - 12, Math.floor(width * 0.72))];
    magnets.forEach((centerX) => {
      roundedRect(graphics, centerX - 5, 7, 4, 10, 2, magnetColor, pulse);
      roundedRect(graphics, centerX + 1, 7, 4, 10, 2, magnetColor, pulse);
      rect(graphics, centerX - 1, 13, 2, 4, trim.light, pulse);
      if (params.playerTouching) {
        circle(graphics, centerX, 11, 2, trim.glow, 0.7);
      }
    });
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
    timeMs: number;
    playerTouching: boolean;
  },
): void => {
  const { platform } = params;
  const width = platform.width;
  const height = platform.height;
  clearGraphics(graphics, params.alpha);
  if (platform.kind === 'magnet') {
    const shellColor = 0x57606b;
    const panelColor = 0x818b96;
    const trimColor = 0x444b55;
    const topFill = 0xff7066;
    const topLight = 0xffb08a;
    const innerBody = 0x6c0e10;
    const magnetBody = 0xff3e31;
    const magnetCap = 0xd6d8de;
    const activeGlow = 0xffd2d2;
    const topBand = Math.max(7, Math.floor(height * 0.34));
    roundedRect(graphics, 0, 4, width, Math.max(10, height - 8), 7, shellColor, 0.26);
    roundedRect(graphics, 3, 1, Math.max(10, width - 6), Math.max(12, height - 10), 6, panelColor, 0.34);
    roundedRect(graphics, 3, 1, Math.max(10, width - 6), Math.max(4, topBand - 1), 5, topFill, 0.96);
    rect(graphics, 4, topBand - 1, Math.max(8, width - 8), 2, topLight, 0.82);
    rect(graphics, 4, topBand + 1, Math.max(8, width - 8), 2, trimColor, 0.22);
    const magnetPulse = params.playerTouching ? 0.78 + Math.sin(params.timeMs / 85) * 0.14 : 0;
    const magnetCenters = [10, width / 2, width - 10].map((centerX) =>
      Phaser.Math.Clamp(centerX, 8, Math.max(8, width - 8)),
    );
    magnetCenters.forEach((centerX, index) => {
      const pulseScale = params.playerTouching ? 1.08 + Math.sin(params.timeMs / 110 + index * 0.8) * 0.08 : 1.08;
      const sparkAlpha = params.playerTouching ? 0.34 + Math.sin(params.timeMs / 100 + index) * 0.1 : 0;
      cartoonMagnet(graphics, centerX, height - 13, pulseScale * 1.12, {
        bodyColor: magnetBody,
        capColor: magnetCap,
        innerColor: innerBody,
        alpha: 0.98,
        glowColor: activeGlow,
        glowAlpha: 0.08 + magnetPulse * 0.22,
      });
      circle(graphics, centerX, height - 8, 2.2, 0xfff0ec, 0.26 + magnetPulse * 0.18);
      if (params.playerTouching) {
        circle(graphics, centerX, height - 8, 1.8, params.brightColor, 0.56);
        circle(graphics, centerX - 7, height - 4, 1.2, activeGlow, sparkAlpha);
        circle(graphics, centerX + 7, height - 4, 1.2, activeGlow, sparkAlpha);
      }
    });
    return;
  }

  const isBroken = isBrittlePlatformBroken(platform);
  const isReady = isBrittlePlatformReady(platform);
  const isWarning = isBrittlePlatformWarning(platform);
  const bodyAlpha = isBroken ? 0.18 : isReady ? 0.7 : isWarning ? 0.66 : 0.62;
  const topBand = Math.max(7, Math.floor(height * 0.34));
  roundedRect(graphics, 0, 4, width, Math.max(10, height - 8), 7, 0x535a64, bodyAlpha * 0.78);
  roundedRect(graphics, 3, 1, Math.max(10, width - 6), Math.max(12, height - 10), 6, params.baseColor, bodyAlpha);
  roundedRect(graphics, 3, 1, Math.max(10, width - 6), Math.max(4, topBand - 1), 5, params.accentColor, isBroken ? 0.3 : 0.96);
  rect(graphics, 4, topBand - 1, Math.max(8, width - 8), 2, 0xe3dcff, isBroken ? 0.12 : isReady ? 0.8 : 0.68);
  rect(graphics, 4, topBand + 1, Math.max(8, width - 8), 2, 0x5f6670, isBroken ? 0.08 : 0.34);
  const shimmer = isBroken ? 0 : 0.28 + (Math.sin((params.timeMs + width) / 120) + 1) * 0.14;
  const shineColumns = [0.22, 0.54, 0.8];
  if (!isBroken) {
    shineColumns.forEach((ratio, index) => {
      const shineX = Math.floor(width * ratio);
      const pulse = shimmer * (index === 1 ? 1 : 0.82);
      roundedRect(graphics, shineX - 3, 6, 6, Math.max(6, height - 14), 3, 0xf6f1ff, pulse);
      circle(graphics, shineX, 7, index === 1 ? 2.4 : 2, params.brightColor, pulse * 0.88);
    });
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
      circle(graphics, 10 + i * Math.max(12, Math.floor(width / 5)), Math.max(8, offset - 8), 4, fieldColors.glow, params.enabled ? 0.28 + i * 0.05 : 0.1);
      circle(graphics, 10 + i * Math.max(12, Math.floor(width / 5)), Math.max(18, offset + 8), 2, fieldColors.light, params.enabled ? 0.32 : 0.12);
    } else {
      circle(graphics, 10 + i * Math.max(10, Math.floor(width / 5)), Math.max(6, offset - 4), 3, fieldColors.glow, params.enabled ? 0.24 + i * 0.05 : 0.1);
      triangle(graphics, [width / 2, Math.max(6, offset), width / 2 - 5, Math.max(14, offset + 8), width / 2 + 5, Math.max(14, offset + 8)], fieldColors.light, params.enabled ? 0.16 : 0.08);
    }
  }
  circle(graphics, width / 2, height / 2, Math.max(6, Math.floor(Math.min(width, height) * 0.08)), fieldColors.light, 0.16);
};

export const drawGravityCapsuleShellGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { width: number; height: number; shellColor: number; strokeColor: number; alpha: number; enabled: boolean; brightColor: number },
): void => {
  const shell = colorPair(params.shellColor, params.brightColor, params.strokeColor);
  clearGraphics(graphics, params.alpha);
  roundedRect(graphics, 0, 4, params.width, Math.max(12, params.height - 8), 10, shell.deep, 0.86);
  roundedRect(graphics, 3, 0, Math.max(10, params.width - 6), Math.max(12, params.height - 10), 8, shell.base, 0.92);
  circle(graphics, Math.floor(params.width * 0.28), Math.floor(params.height * 0.24), 3, shell.light, 0.42);
  circle(graphics, Math.floor(params.width * 0.72), Math.floor(params.height * 0.24), 3, shell.light, 0.42);
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

export const drawRewardBlockIconGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: { rewardBlock: RewardBlockState; color: number; brightColor: number; borderColor: number; alpha: number },
): void => {
  const { rewardBlock } = params;
  const icon = colorPair(params.color, params.brightColor, params.borderColor);
  const centerX = rewardBlock.width / 2;
  const centerY = rewardBlock.height / 2;
  clearGraphics(graphics, params.alpha);

  if (rewardBlock.used) {
    roundedRect(graphics, centerX - 6, centerY - 4, 12, 8, 3, icon.deep, 0.42);
    rect(graphics, centerX - 4, centerY - 1, 8, 2, icon.light, 0.3);
    circle(graphics, centerX - 7, centerY + 5, 1.5, icon.deep, 0.28);
    circle(graphics, centerX + 7, centerY - 5, 1.5, icon.deep, 0.28);
    return;
  }

  if (rewardBlock.reward.kind === 'coins') {
    roundedRect(graphics, centerX - 6, centerY - 4, 12, 9, 3, icon.base, 0.96);
    rect(graphics, centerX - 6, centerY - 1, 12, 2, icon.light, 0.92);
    rect(graphics, centerX - 1, centerY - 4, 2, 9, icon.light, 0.88);
    roundedRect(graphics, centerX - 3, centerY - 8, 6, 5, 2, icon.deep, 0.96);
    roundedRect(graphics, centerX - 2, centerY - 7, 4, 3, 1, icon.glow, 0.82);
    return;
  }

  switch (rewardBlock.reward.power) {
    case 'doubleJump': {
      const rocketBody = 0x72d66f;
      const rocketNose = 0xdff7d8;
      const rocketWindow = 0x3f8fc7;
      const rocketFin = 0x2f7a38;
      const rocketFlame = 0xffd36a;
      roundedRect(graphics, centerX - 3, centerY - 6, 6, 11, 2, rocketBody, 0.98);
      triangle(graphics, [centerX - 3, centerY + 5, centerX, centerY + 10, centerX + 3, centerY + 5], rocketNose, 0.98);
      rect(graphics, centerX - 2, centerY - 8, 4, 2, rocketFlame, 0.92);
      rect(graphics, centerX - 1, centerY - 10, 2, 2, 0xff8a47, 0.96);
      circle(graphics, centerX, centerY - 2, 2, rocketWindow, 0.96);
      triangle(graphics, [centerX - 3, centerY + 1, centerX - 6, centerY + 4, centerX - 3, centerY + 4], rocketFin, 0.94);
      triangle(graphics, [centerX + 3, centerY + 1, centerX + 6, centerY + 4, centerX + 3, centerY + 4], rocketFin, 0.94);
      rect(graphics, centerX - 6, centerY - 10, 2, 2, icon.light, 0.8);
      rect(graphics, centerX + 4, centerY - 10, 2, 2, icon.light, 0.8);
      break;
    }
    case 'shooter': {
      const gunBody = 0x454c63;
      const gunGrip = 0xc67d4d;
      const gunBarrel = 0xeff5ff;
      const muzzle = 0xffcd58;
      rect(graphics, centerX - 7, centerY - 3, 11, 5, gunBody, 0.98);
      rect(graphics, centerX + 4, centerY - 2, 4, 3, gunBarrel, 0.96);
      rect(graphics, centerX - 2, centerY - 5, 4, 2, gunBarrel, 0.92);
      triangle(graphics, [centerX - 3, centerY + 2, centerX - 1, centerY + 8, centerX + 2, centerY + 2], gunGrip, 0.96);
      circle(graphics, centerX + 9, centerY - 1, 1.5, muzzle, 0.96);
      rect(graphics, centerX + 10, centerY - 2, 2, 2, 0xff8a47, 0.92);
      rect(graphics, centerX - 6, centerY - 2, 2, 1, icon.light, 0.72);
      break;
    }
    case 'invincible': {
      const orbOuter = 0x6fdcff;
      const orbMid = 0xa8efff;
      const orbCore = 0xeefcff;
      const orbGlow = 0xc9f7ff;
      circle(graphics, centerX, centerY, 7, orbOuter, 0.92);
      circle(graphics, centerX, centerY, 5.5, orbMid, 0.96);
      circle(graphics, centerX, centerY, 3, orbCore, 0.98);
      circle(graphics, centerX - 2, centerY - 2, 1.5, 0xffffff, 0.82);
      circle(graphics, centerX + 6, centerY - 5, 2, orbGlow, 0.34);
      circle(graphics, centerX - 6, centerY + 4, 1.5, orbGlow, 0.28);
      break;
    }
    case 'dash': {
      const rocketBody = 0xffc78f;
      const rocketNose = 0xfff1d8;
      const rocketWindow = 0x8f3fc7;
      const rocketFin = 0xd85a36;
      const rocketFlame = 0xff7a4f;
      roundedRect(graphics, centerX - 6, centerY - 3, 11, 6, 2, rocketBody, 0.98);
      triangle(graphics, [centerX + 5, centerY - 3, centerX + 10, centerY, centerX + 5, centerY + 3], rocketNose, 0.96);
      triangle(graphics, [centerX - 6, centerY - 3, centerX - 10, centerY - 5, centerX - 6, centerY - 1], rocketFlame, 0.94);
      triangle(graphics, [centerX - 6, centerY + 3, centerX - 10, centerY + 5, centerX - 6, centerY + 1], 0xff8a47, 0.94);
      circle(graphics, centerX - 1, centerY, 2, rocketWindow, 0.96);
      triangle(graphics, [centerX - 1, centerY - 3, centerX + 1, centerY - 7, centerX + 2, centerY - 3], rocketFin, 0.92);
      triangle(graphics, [centerX - 1, centerY + 3, centerX + 1, centerY + 7, centerX + 2, centerY + 3], rocketFin, 0.92);
      rect(graphics, centerX - 12, centerY - 1, 2, 2, icon.light, 0.76);
      rect(graphics, centerX - 15, centerY - 1, 2, 2, icon.light, 0.56);
      break;
    }
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
  if (params.projectile.power) {
    roundedRect(graphics, 0, 0, 18, 18, 3, bolt.deep, 0.95);
    roundedRect(graphics, 3, 3, 12, 12, 2, bolt.base, 1);
    rect(graphics, 5, 5, 8, 3, bolt.glow, 0.9);
    rect(graphics, 7, 9, 4, 4, params.borderColor, 0.82);
    return;
  }
  const width = params.projectile.power ? 16 : params.projectile.variant ? 14 : 12;
  const height = params.projectile.power ? 12 : params.projectile.variant ? 10 : 8;
  roundedRect(graphics, 0, 1, width, Math.max(4, height - 2), 3, bolt.deep, 0.88);
  roundedRect(graphics, 2, 2, Math.max(6, width - 4), Math.max(3, height - 4), 2, bolt.base, 1);
  rect(graphics, width - 3, 3, 2, Math.max(2, height - 6), bolt.glow, 0.84);
};
