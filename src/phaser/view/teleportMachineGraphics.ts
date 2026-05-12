import * as Phaser from 'phaser';

type TeleportMachinePalette = {
  podDark: number;
  podMid: number;
  podLight: number;
  beam: number;
  beamGlow: number;
  indicator: number;
};

export type TeleportMachineDrawParams = {
  width: number;
  height: number;
  ringPhase: number;
  ringAlpha: number;
  beamAlpha: number;
  podAlpha: number;
  palette: TeleportMachinePalette;
};

export type TeleportShutterDrawParams = {
  width: number;
  height: number;
  closedProgress: number;
  color: number;
  alpha: number;
};

const clamp01 = (value: number): number => Phaser.Math.Clamp(value, 0, 1);

export const drawTeleportMachineGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: TeleportMachineDrawParams,
): void => {
  const halfHeight = params.height / 2;
  const podWidth = params.width;
  const beamHeight = params.height - 26;
  const ringCount = 6;
  const ringSpanTop = -halfHeight + 18;
  const ringSpanBottom = halfHeight - 14;
  const beamWidth = Math.max(18, params.width * 0.28);

  graphics.clear();
  graphics.setData('debugWidth', podWidth);
  graphics.setData('debugTextureKey', 'arrival-teleport-machine');

  graphics.fillStyle(params.palette.beamGlow, 0.12 * params.beamAlpha);
  graphics.fillEllipse(0, 2, beamWidth + 14, beamHeight);
  graphics.fillStyle(params.palette.beam, 0.18 * params.beamAlpha);
  graphics.fillRoundedRect(-beamWidth / 2, -beamHeight / 2 + 3, beamWidth, beamHeight - 6, 10);

  for (let index = 0; index < ringCount; index += 1) {
    const progress = (params.ringPhase + index / ringCount) % 1;
    const y = Phaser.Math.Linear(ringSpanBottom, ringSpanTop, progress);
    const width = Phaser.Math.Linear(params.width * 0.72, params.width * 0.88, 1 - Math.abs(progress - 0.5) * 1.35);
    const height = Phaser.Math.Linear(7, 10, progress);
    graphics.lineStyle(3, params.palette.beam, params.ringAlpha * (0.46 + index * 0.06));
    graphics.strokeEllipse(0, y, width, height);
    graphics.lineStyle(1.5, params.palette.beamGlow, params.ringAlpha * 0.34);
    graphics.strokeEllipse(0, y, width * 0.88, Math.max(4, height - 2));
  }

  const drawPod = (centerY: number, inverted = false) => {
    graphics.fillStyle(params.palette.podDark, 0.94 * params.podAlpha);
    graphics.fillEllipse(0, centerY, podWidth, 16);
    graphics.fillStyle(params.palette.podMid, 0.98 * params.podAlpha);
    graphics.fillEllipse(0, centerY + (inverted ? -1 : 1), podWidth * 0.9, 11);
    graphics.fillStyle(params.palette.podLight, 0.92 * params.podAlpha);
    graphics.fillEllipse(0, centerY + (inverted ? -2 : 0), podWidth * 0.66, 5);
    graphics.fillStyle(params.palette.beamGlow, 0.44 * params.podAlpha);
    graphics.fillEllipse(0, centerY + (inverted ? 3 : -3), podWidth * 0.52, 3);
  };

  drawPod(-halfHeight + 8, true);
  drawPod(halfHeight - 8);

  graphics.fillStyle(params.palette.podMid, 0.98 * params.podAlpha);
  graphics.fillRoundedRect(-podWidth * 0.34, -halfHeight + 3, podWidth * 0.68, 10, 5);
  const lightStartX = -podWidth * 0.18;
  for (let index = 0; index < 3; index += 1) {
    graphics.fillStyle(index === 1 ? params.palette.beamGlow : params.palette.indicator, 0.95 * params.podAlpha);
    graphics.fillCircle(lightStartX + index * 9, -halfHeight + 8, 2.2);
  }
};

export const drawTeleportShutterGraphic = (
  graphics: Phaser.GameObjects.Graphics,
  params: TeleportShutterDrawParams,
): void => {
  const progress = clamp01(params.closedProgress);
  const shutterWidth = Math.max(0, params.width * progress);

  graphics.clear();
  graphics.setData('debugWidth', shutterWidth);
  graphics.setData('debugTextureKey', 'arrival-teleport-shutter');

  if (progress <= 0.01 || shutterWidth <= 0.5) {
    return;
  }

  graphics.fillStyle(params.color, params.alpha * progress);
  graphics.fillRoundedRect(-shutterWidth / 2, -params.height / 2, shutterWidth, params.height, Math.min(12, shutterWidth * 0.28));
  graphics.fillStyle(0xffffff, params.alpha * 0.08 * progress);
  graphics.fillRoundedRect(-Math.max(2, shutterWidth * 0.1), -params.height / 2 + 3, Math.max(3, shutterWidth * 0.18), params.height - 6, 4);
};
