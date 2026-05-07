import * as Phaser from 'phaser';

type MenuAstronautHandle = {
  root: Phaser.GameObjects.Container;
};

const COLORS = {
  outline: 0x1a1630,
  suitDark: 0x2d3f93,
  suitMid: 0x4b68e0,
  suitLight: 0x7f98ff,
  visorDark: 0x0d1e46,
  visorLight: 0x84dbff,
  skin: 0xf1c0a7,
  skinShadow: 0xc99781,
  accent: 0xff6f61,
  glow: 0x8fdff2,
  shadow: 0x06080d,
} as const;

const drawRoundedPanel = (
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

export const createMenuAstronautGraphics = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1,
): MenuAstronautHandle => {
  const root = scene.add.container(x, y).setDepth(2.8).setScale(scale);

  const shadow = scene.add.graphics();
  shadow.fillStyle(COLORS.shadow, 0.42);
  shadow.fillEllipse(0, 128, 132, 28);

  const glow = scene.add.graphics();
  glow.fillStyle(COLORS.glow, 0.16);
  glow.fillCircle(12, 2, 88);

  const backpack = scene.add.graphics();
  drawRoundedPanel(backpack, -52, -24, 28, 76, 10, COLORS.accent);
  drawRoundedPanel(backpack, -50, -18, 20, 60, 8, 0xff96a0, 0.5);

  const body = scene.add.graphics();
  body.lineStyle(6, COLORS.outline, 1);
  drawRoundedPanel(body, -56, -48, 112, 112, 18, COLORS.suitMid);
  drawRoundedPanel(body, -50, -42, 100, 100, 16, COLORS.suitLight);
  drawRoundedPanel(body, -42, 0, 84, 52, 12, 0xaec0ff);
  drawRoundedPanel(body, -42, -6, 84, 18, 8, COLORS.accent);
  body.fillStyle(0xdfe6ff, 0.65);
  body.fillRect(-34, 16, 10, 10);
  body.fillRect(-10, 16, 10, 10);
  body.fillRect(14, 16, 10, 10);
  body.fillRect(-22, 34, 44, 8);

  const helmet = scene.add.graphics();
  helmet.lineStyle(6, COLORS.outline, 1);
  drawRoundedPanel(helmet, -48, -120, 96, 92, 24, COLORS.suitMid);
  drawRoundedPanel(helmet, -40, -112, 80, 76, 18, COLORS.suitLight);
  drawRoundedPanel(helmet, -28, -96, 56, 50, 16, COLORS.visorDark);
  drawRoundedPanel(helmet, -24, -92, 48, 18, 10, 0xbdeeff, 0.3);
  drawRoundedPanel(helmet, -12, -78, 32, 28, 10, COLORS.skin);
  drawRoundedPanel(helmet, 2, -76, 14, 14, 4, COLORS.skinShadow);
  helmet.fillStyle(0xffffff, 0.9);
  helmet.fillRect(-22, -86, 10, 10);
  helmet.fillStyle(0xffffff, 0.32);
  helmet.fillRect(18, -102, 12, 44);

  const leftArm = scene.add.graphics();
  leftArm.lineStyle(6, COLORS.outline, 1);
  drawRoundedPanel(leftArm, -78, -16, 26, 82, 10, COLORS.suitMid);
  drawRoundedPanel(leftArm, -74, -10, 18, 66, 8, COLORS.suitLight);
  drawRoundedPanel(leftArm, -82, 54, 30, 18, 8, COLORS.suitDark);

  const rightArm = scene.add.graphics();
  rightArm.lineStyle(6, COLORS.outline, 1);
  drawRoundedPanel(rightArm, 52, -16, 26, 82, 10, COLORS.suitMid);
  drawRoundedPanel(rightArm, 56, -10, 18, 66, 8, COLORS.suitLight);
  drawRoundedPanel(rightArm, 52, 54, 30, 18, 8, COLORS.suitDark);

  const leftLeg = scene.add.graphics();
  leftLeg.lineStyle(6, COLORS.outline, 1);
  drawRoundedPanel(leftLeg, -34, 60, 28, 90, 10, COLORS.suitMid);
  drawRoundedPanel(leftLeg, -30, 66, 20, 74, 8, COLORS.suitLight);
  drawRoundedPanel(leftLeg, -38, 142, 36, 20, 8, COLORS.suitDark);

  const rightLeg = scene.add.graphics();
  rightLeg.lineStyle(6, COLORS.outline, 1);
  drawRoundedPanel(rightLeg, 6, 60, 28, 90, 10, COLORS.suitMid);
  drawRoundedPanel(rightLeg, 10, 66, 20, 74, 8, COLORS.suitLight);
  drawRoundedPanel(rightLeg, 2, 142, 36, 20, 8, COLORS.suitDark);

  const chestLight = scene.add.graphics();
  chestLight.fillStyle(COLORS.glow, 0.75);
  chestLight.fillCircle(28, 8, 7);
  chestLight.fillStyle(0xffffff, 0.8);
  chestLight.fillCircle(28, 8, 3);

  root.add([shadow, glow, backpack, leftArm, rightArm, leftLeg, rightLeg, body, helmet, chestLight]);

  scene.tweens.add({
    targets: root,
    y: y - 8,
    duration: 1600,
    ease: 'Sine.InOut',
    yoyo: true,
    repeat: -1,
  });

  scene.tweens.add({
    targets: [leftArm, rightArm],
    angle: {
      from: -2,
      to: 2,
    },
    duration: 1100,
    ease: 'Sine.InOut',
    yoyo: true,
    repeat: -1,
  });

  scene.tweens.add({
    targets: chestLight,
    alpha: 0.35,
    duration: 450,
    ease: 'Sine.InOut',
    yoyo: true,
    repeat: -1,
  });

  return { root };
};
