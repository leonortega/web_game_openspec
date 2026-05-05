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

export const getCrtFilterEnabled = (game: Phaser.Game, fallback = true): boolean => {
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
  applyRetroPostFxToCamera(game, camera, getCrtFilterEnabled(game, true));
};

export const toggleCrtFilterForCamera = (
  game: Phaser.Game,
  camera: Phaser.Cameras.Scene2D.Camera,
): boolean => {
  const nextEnabled = !getCrtFilterEnabled(game, true);
  setCrtFilterEnabled(game, nextEnabled);
  applyRetroPostFxToCamera(game, camera, nextEnabled);
  return nextEnabled;
};

export const applyRetroPostFxToCamera = (
  game: Phaser.Game,
  camera: Phaser.Cameras.Scene2D.Camera,
  crtFilterEnabled: boolean,
): void => {
  try {
    (camera as any)?.setRenderFilters?.(true);
    (camera as any)?.setFiltersForceComposite?.(true);
    (camera as any)?.setForceComposite?.(true);
  } catch (e) {
    // ignore
  }

  const filterList = (camera as any)?.filters?.external ?? (camera as any)?.filters?.internal;
  if (!filterList) {
    return;
  }

  // Clear only if this camera was previously managed by this helper.
  if ((camera as any)[RETRO_POST_FX_OWNED_KEY] && typeof filterList.clear === 'function') {
    filterList.clear();
  }

  let quantizeEnabled = false;

  if (crtFilterEnabled) {
    if (typeof filterList.addCRT === 'function') {
      filterList.addCRT();
    } else if (typeof filterList.addBarrel === 'function') {
      // Phaser barrel amount: 1 = no distortion. Use a light curve plus vignette for a visible CRT-like fallback.
      filterList.addBarrel(1.035);
      if (typeof filterList.addVignette === 'function') {
        filterList.addVignette(0.5, 0.5, 0.72, 0.34);
      }
    } else if (typeof filterList.addVignette === 'function') {
      filterList.addVignette(0.5, 0.5, 0.72, 0.34);
    }
  }

  if (typeof filterList.addQuantize === 'function') {
    filterList.addQuantize({ steps: [32, 64, 32, 1], dither: true, mode: 0 });
    quantizeEnabled = true;
  }

  (camera as any)[RETRO_POST_FX_OWNED_KEY] = true;

  try {
    (game.registry as any).set('globalQuantizeEnabled', quantizeEnabled);
  } catch (e) {
    // ignore
  }
};
