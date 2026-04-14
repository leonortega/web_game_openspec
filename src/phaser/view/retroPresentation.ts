import * as Phaser from 'phaser';

type StagePalette = {
  accent: number;
};

export type RetroPresentationPalette = {
  background: number;
  skyline: number;
  groundBand: number;
  panel: number;
  panelAlt: number;
  border: number;
  ink: number;
  warm: number;
  cool: number;
  safe: number;
  alert: number;
  muted: number;
  bright: number;
  stageAccent: number;
  text: string;
  dimText: string;
  shadow: string;
};

export const RETRO_FONT_FAMILY = '"Courier New", monospace';

// Optional analog overlays stay disabled in the required baseline.
export const RETRO_ANALOG_TREATMENT_ENABLED = false;

export const RETRO_MOTION_STEP_MS = 120;

export const createRetroPresentationPalette = (stagePalette: StagePalette): RetroPresentationPalette => ({
  background: 0x0b0d11,
  skyline: 0x1d2731,
  groundBand: 0x312c1d,
  panel: 0x11161c,
  panelAlt: 0x27301c,
  border: 0xf7f3d6,
  ink: 0x080a0d,
  warm: 0xf0b84b,
  cool: 0x79c8d6,
  safe: 0x9fcf54,
  alert: 0xe05b3d,
  muted: 0x5d6655,
  bright: 0xfff7d8,
  stageAccent: stagePalette.accent,
  text: '#f7f3d6',
  dimText: '#aab197',
  shadow: '#080a0d',
});

export const createRetroMenuPalette = (): RetroPresentationPalette =>
  createRetroPresentationPalette({ accent: 0xe05b3d });

export const getRetroMotionStep = (
  timeMs: number,
  frameMs = RETRO_MOTION_STEP_MS,
  frameCount = 2,
): number => {
  if (frameCount <= 1) {
    return 0;
  }

  return Math.floor(timeMs / Math.max(frameMs, 1)) % frameCount;
};

export const snapRetroValue = (value: number, step = 2): number => {
  if (step <= 1) {
    return value;
  }

  return Math.round(value / step) * step;
};

export const drawRetroBackdrop = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: RetroPresentationPalette,
  variant: 'gameplay' | 'transition' = 'gameplay',
): Phaser.GameObjects.Graphics => {
  const backdrop = scene.add.graphics().setDepth(0);
  const horizonY = y + Math.floor(height * (variant === 'gameplay' ? 0.68 : 0.62));
  const skylineY = y + Math.floor(height * (variant === 'gameplay' ? 0.52 : 0.48));
  const stepWidth = variant === 'gameplay' ? 120 : 76;
  const columnCount = Math.ceil(width / stepWidth) + 1;

  backdrop.fillStyle(palette.background, 1);
  backdrop.fillRect(x, y, width, height);

  backdrop.fillStyle(palette.ink, 1);
  backdrop.fillRect(x, y, width, Math.max(18, Math.floor(height * 0.08)));

  backdrop.fillStyle(palette.skyline, 1);
  backdrop.fillRect(x, skylineY, width, Math.max(36, horizonY - skylineY));

  backdrop.fillStyle(palette.groundBand, 1);
  backdrop.fillRect(x, horizonY, width, y + height - horizonY);

  backdrop.fillStyle(palette.panel, 1);
  backdrop.fillRect(x, horizonY - 16, width, 8);

  for (let index = 0; index < columnCount; index += 1) {
    const columnX = x + index * stepWidth;
    if (columnX >= x + width) {
      break;
    }
    const isAccentColumn = index % 4 === 1;
    const columnHeight = variant === 'gameplay' ? 32 + (index % 4) * 16 : 48 + (index % 3) * 20;
    const columnWidth = Math.min(stepWidth - 12, width - (columnX - x));
    backdrop.fillStyle(isAccentColumn ? palette.stageAccent : palette.panelAlt, 1);
    backdrop.fillRect(columnX, horizonY - columnHeight, columnWidth, columnHeight);
    backdrop.fillStyle(palette.ink, 1);
    backdrop.fillRect(columnX, horizonY - columnHeight, columnWidth, 4);
  }

  const starCount = variant === 'gameplay' ? 14 : 10;
  for (let index = 0; index < starCount; index += 1) {
    const starX = x + 18 + ((index * 73) % Math.max(width - 36, 1));
    const starY = y + 18 + ((index * 41) % Math.max(Math.floor(height * 0.34), 24));
    const starSize = index % 3 === 0 ? 4 : 2;
    backdrop.fillStyle(index % 4 === 0 ? palette.warm : palette.border, 1);
    backdrop.fillRect(starX, starY, starSize, starSize);
  }

  if (variant === 'transition') {
    backdrop.fillStyle(palette.ink, 1);
    backdrop.fillRect(x, y + height - 22, width, 22);
  }

  return backdrop;
};