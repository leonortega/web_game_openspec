import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  Math: {
    Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
  },
}));

import {
  CHARGER_TEXTURE_SIZE,
  CHECKPOINT_TEXTURE_SIZE,
  FLYER_TEXTURE_SIZE,
  HOPPER_TEXTURE_SIZE,
  TURRET_TEXTURE_SIZE,
  WALKER_TEXTURE_SIZE,
  drawChargerTextureArt,
  drawCheckpointTextureArt,
  drawFlyerTextureArt,
  drawHopperTextureArt,
  drawTurretTextureArt,
  drawWalkerTextureArt,
} from './bootTextures';
import { getSpikeHazardToothRects } from '../scenes/gameScene/enemyRendering';

type DrawOp = {
  kind: 'fill' | 'outlined';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

const collectOps = (draw: (artist: {
  outlinedRect: (x: number, y: number, width: number, height: number, fill: string) => void;
  fillRect: (x: number, y: number, width: number, height: number, fill: string) => void;
}) => void): DrawOp[] => {
  const ops: DrawOp[] = [];

  draw({
    outlinedRect: (x, y, width, height, fill) => ops.push({ kind: 'outlined', x, y, width, height, fill }),
    fillRect: (x, y, width, height, fill) => ops.push({ kind: 'fill', x, y, width, height, fill }),
  });

  return ops;
};

describe('drawFlyerTextureArt', () => {
  it('keeps flyer art inside the existing texture footprint while reading as a centered ovni', () => {
    const ops = collectOps(drawFlyerTextureArt);

    const canopy = ops.find((op) => op.kind === 'outlined' && op.x === 12 && op.y === 4 && op.width === 10 && op.height === 4);
    const hull = ops.find((op) => op.kind === 'outlined' && op.x === 7 && op.y === 9 && op.width === 20 && op.height === 4);
    const leftWing = ops.find((op) => op.kind === 'fill' && op.x === 3 && op.y === 12 && op.width === 6 && op.height === 2);
    const rightWing = ops.find((op) => op.kind === 'fill' && op.x === 25 && op.y === 12 && op.width === 6 && op.height === 2);
    const undersideBand = ops.find((op) => op.kind === 'fill' && op.x === 10 && op.y === 16 && op.width === 14 && op.height === 2);
    const bellyLamp = ops.find((op) => op.kind === 'fill' && op.x === 13 && op.y === 18 && op.width === 8 && op.height === 2);

    expect(FLYER_TEXTURE_SIZE).toEqual({ width: 34, height: 24 });
    expect(Math.min(...ops.map((op) => op.y))).toBe(4);
    expect(canopy).toBeDefined();
    expect(hull).toBeDefined();
    expect(leftWing).toBeDefined();
    expect(rightWing).toBeDefined();
    expect(undersideBand).toBeDefined();
    expect(bellyLamp).toBeDefined();
    expect(canopy?.x).toBe(FLYER_TEXTURE_SIZE.width - (canopy?.x ?? 0) - (canopy?.width ?? 0));
    expect((leftWing?.x ?? 0) + (leftWing?.width ?? 0)).toBe(FLYER_TEXTURE_SIZE.width - (rightWing?.x ?? 0));
    expect((undersideBand?.x ?? 0) + (undersideBand?.width ?? 0) / 2).toBe(17);
    expect((bellyLamp?.x ?? 0) + (bellyLamp?.width ?? 0) / 2).toBe(17);
    expect((hull?.width ?? 0)).toBeGreaterThan(canopy?.width ?? 0);
  });
});

describe('floored texture art', () => {
  it.each([
    ['walker', WALKER_TEXTURE_SIZE.height, drawWalkerTextureArt],
    ['hopper', HOPPER_TEXTURE_SIZE.height, drawHopperTextureArt],
    ['turret', TURRET_TEXTURE_SIZE.height, drawTurretTextureArt],
    ['charger', CHARGER_TEXTURE_SIZE.height, drawChargerTextureArt],
    ['checkpoint', CHECKPOINT_TEXTURE_SIZE.height, drawCheckpointTextureArt],
  ])('keeps %s art flush with texture bottom edge', (_name, textureHeight, draw) => {
    const ops = collectOps(draw);
    const bottom = Math.max(...ops.map((op) => op.y + op.height));

    expect(bottom).toBe(textureHeight);
  });

  it('keeps grounded art bottom-flush while flyer art stays elevated for hover read', () => {
    const groundedBottoms = [
      [WALKER_TEXTURE_SIZE.height, collectOps(drawWalkerTextureArt)],
      [HOPPER_TEXTURE_SIZE.height, collectOps(drawHopperTextureArt)],
      [TURRET_TEXTURE_SIZE.height, collectOps(drawTurretTextureArt)],
      [CHARGER_TEXTURE_SIZE.height, collectOps(drawChargerTextureArt)],
      [CHECKPOINT_TEXTURE_SIZE.height, collectOps(drawCheckpointTextureArt)],
    ] as const;
    const flyerBottom = Math.max(...collectOps(drawFlyerTextureArt).map((op) => op.y + op.height));

    expect(groundedBottoms.every(([textureHeight, ops]) => Math.max(...ops.map((op) => op.y + op.height)) === textureHeight)).toBe(true);
    expect(flyerBottom).toBeLessThan(FLYER_TEXTURE_SIZE.height);
  });

  it('keeps checkpoint base fill touching the texture bottom edge for planted read', () => {
    const checkpointOps = collectOps(drawCheckpointTextureArt);
    const filledBottom = Math.max(...checkpointOps.filter((op) => op.kind === 'fill').map((op) => op.y + op.height));
    const plantedBase = checkpointOps.find(
      (op) => op.kind === 'outlined' && op.x === 1 && op.y === 68 && op.width === 22 && op.height === 12,
    );

    expect(plantedBase).toBeDefined();
    expect(filledBottom).toBe(CHECKPOINT_TEXTURE_SIZE.height);
  });
});

describe('spike hazard art', () => {
  it('keeps procedural spike teeth inside hazard bounds and anchored to floor-facing top edge', () => {
    const hazardRect = { x: 180, y: 604, width: 60, height: 16 };
    const teeth = getSpikeHazardToothRects(hazardRect);

    expect(teeth.length).toBeGreaterThanOrEqual(2);
    expect(teeth.every((tooth) => tooth.y >= hazardRect.y)).toBe(true);
    expect(teeth.every((tooth) => tooth.y + tooth.height <= hazardRect.y + hazardRect.height)).toBe(true);
    expect(teeth.every((tooth) => tooth.x - tooth.width / 2 >= hazardRect.x)).toBe(true);
    expect(teeth.every((tooth) => tooth.x + tooth.width / 2 <= hazardRect.x + hazardRect.width)).toBe(true);
    expect(teeth.every((tooth) => tooth.y === hazardRect.y + 2)).toBe(true);
  });
});
