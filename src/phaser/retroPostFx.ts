import * as Phaser from 'phaser';

const RETRO_POST_FX_OWNED_KEY = '__retroPostFxOwned';

export type RetroWorldLocalEffectKind = 'palette-ramp' | 'hit-flash' | 'distortion';

export type RetroWorldLocalEffectRegionConfig = {
  kind: RetroWorldLocalEffectKind;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  alpha: number;
  depth?: number;
  visible?: boolean;
  scrollFactor?: number;
};

export type RetroWorldLocalEffectRegion = Phaser.GameObjects.Rectangle & {
  __retroWorldLocalEffectKind?: RetroWorldLocalEffectKind;
  __retroWorldLocalEffectScope?: 'world-local';
  __retroHudExcluded?: true;
  __retroOverlayExcluded?: true;
};

export const annotateRetroWorldLocalRegion = <T extends Phaser.GameObjects.Rectangle>(
  region: T,
  kind: RetroWorldLocalEffectKind,
): T & RetroWorldLocalEffectRegion => {
  const taggedRegion = region as T & RetroWorldLocalEffectRegion;
  taggedRegion.__retroWorldLocalEffectKind = kind;
  taggedRegion.__retroWorldLocalEffectScope = 'world-local';
  taggedRegion.__retroHudExcluded = true;
  taggedRegion.__retroOverlayExcluded = true;
  return taggedRegion;
};

export const createWorldLocalRetroRegion = (
  scene: Phaser.Scene,
  config: RetroWorldLocalEffectRegionConfig,
): RetroWorldLocalEffectRegion => {
  const factory = (scene as Phaser.Scene & { enhanced?: { createWorldLocalRetroRegion?: (opts: RetroWorldLocalEffectRegionConfig) => RetroWorldLocalEffectRegion } }).enhanced
    ?.createWorldLocalRetroRegion;
  if (typeof factory === 'function') {
    return factory(config);
  }

  const region = annotateRetroWorldLocalRegion(
    scene.add
      .rectangle(config.x, config.y, config.width, config.height, config.color, config.alpha)
      .setOrigin(0.5)
      .setDepth(config.depth ?? 2)
      .setVisible(config.visible ?? true),
    config.kind,
  );

  if (typeof region.setScrollFactor === 'function') {
    region.setScrollFactor(config.scrollFactor ?? 1);
  }

  return region;
};

export const getCrtFilterEnabled = (game: Phaser.Game, fallback = false): boolean => {
  const value = (game.registry as any)?.get?.('crtFilterEnabled');
  if (typeof value === 'boolean') {
    return value;
  }

  try {
    (game.registry as any)?.set?.('crtFilterEnabled', fallback);
  } catch (e) {
    // ignore
  }

  return fallback;
};

export const setCrtFilterEnabled = (game: Phaser.Game, enabled: boolean): void => {
  try {
    (game.registry as any).set('crtFilterEnabled', enabled);
  } catch (e) {
    // ignore
  }
};

export const applyConfiguredRetroPostFxToCamera = (
  game: Phaser.Game,
  camera: Phaser.Cameras.Scene2D.Camera,
): void => {
  applyRetroPostFxToCamera(camera, getCrtFilterEnabled(game, false));
};

export const toggleCrtFilterForCamera = (
  game: Phaser.Game,
  camera: Phaser.Cameras.Scene2D.Camera,
): boolean => {
  const nextEnabled = !getCrtFilterEnabled(game, false);
  setCrtFilterEnabled(game, nextEnabled);
  applyRetroPostFxToCamera(camera, nextEnabled);
  return nextEnabled;
};

export const applyRetroPostFxToCamera = (
  camera: Phaser.Cameras.Scene2D.Camera,
  crtFilterEnabled: boolean,
): void => {
  type RexCrtPlugin = {
    add?: (target: unknown, config?: object) => unknown;
    get?: (target: unknown) => unknown[];
    remove?: (target: unknown) => void;
  };
  const scene = (camera as Phaser.Cameras.Scene2D.Camera & { scene?: Phaser.Scene }).scene;
  const crtPlugin = ((scene as Phaser.Scene & {
    plugins?: { get?: (key: string) => unknown };
  })?.plugins?.get?.('rexCrtFilter') ?? undefined) as RexCrtPlugin | undefined;
  if (!crtPlugin) {
    return;
  }
  const existingControllers = crtPlugin.get?.(camera) ?? [];
  if (existingControllers.length > 0) {
    crtPlugin.remove?.(camera);
  }

  if (crtFilterEnabled) {
    camera.setZoom(1.035);
    crtPlugin.add?.(camera, {
      warpX: 0.18,
      warpY: 0.14,
      scanLineStrength: 0.08,
      scanLineWidth: 768,
      name: 'rexCrtPostFx',
    });
  } else {
    camera.setZoom(1);
  }

  (camera as any)[RETRO_POST_FX_OWNED_KEY] = crtFilterEnabled;
};
