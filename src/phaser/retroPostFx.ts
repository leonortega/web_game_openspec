import * as Phaser from 'phaser';

const RETRO_POST_FX_OWNED_KEY = '__retroPostFxOwned';
const RETRO_SCANLINE_OVERLAY_KEY = '__retroScanlineOverlay';
const RETRO_SCANLINE_TEXTURE_KEY = '__retroScanlineTexture';
const RETRO_SCANLINE_RESIZE_BOUND_KEY = '__retroScanlineResizeBound';
const RETRO_SCANLINE_ALPHA = 0.3;
const RETRO_SCANLINE_DEPTH = 1000;

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

export const applyRetroOverlayToScene = (scene: Phaser.Scene): void => {
  const sceneAny = scene as Phaser.Scene & {
    [RETRO_SCANLINE_OVERLAY_KEY]?: Phaser.GameObjects.TileSprite;
    [RETRO_SCANLINE_RESIZE_BOUND_KEY]?: boolean;
  };

  ensureScanlineTexture(scene);

  const width = scene.scale.width;
  const height = scene.scale.height;

  if (!sceneAny[RETRO_SCANLINE_OVERLAY_KEY]) {
    sceneAny[RETRO_SCANLINE_OVERLAY_KEY] = scene.add
      .tileSprite(width / 2, height / 2, width, height, RETRO_SCANLINE_TEXTURE_KEY)
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setDepth(RETRO_SCANLINE_DEPTH)
      .setAlpha(RETRO_SCANLINE_ALPHA);

    if (!sceneAny[RETRO_SCANLINE_RESIZE_BOUND_KEY]) {
      const syncOverlaySize = ({ width: nextWidth, height: nextHeight }: { width: number; height: number }): void => {
        const overlay = sceneAny[RETRO_SCANLINE_OVERLAY_KEY];
        if (!overlay) {
          return;
        }
        overlay.setPosition(nextWidth / 2, nextHeight / 2);
        overlay.setSize(nextWidth, nextHeight);
        overlay.setDisplaySize(nextWidth, nextHeight);
      };

      scene.scale.on(Phaser.Scale.Events.RESIZE, syncOverlaySize);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.scale.off(Phaser.Scale.Events.RESIZE, syncOverlaySize);
        sceneAny[RETRO_SCANLINE_OVERLAY_KEY]?.destroy();
        delete sceneAny[RETRO_SCANLINE_OVERLAY_KEY];
        sceneAny[RETRO_SCANLINE_RESIZE_BOUND_KEY] = false;
      });
      sceneAny[RETRO_SCANLINE_RESIZE_BOUND_KEY] = true;
    }
  }

  sceneAny[RETRO_SCANLINE_OVERLAY_KEY]
    ?.setPosition(width / 2, height / 2)
    .setSize(width, height)
    .setDisplaySize(width, height)
    .setDepth(RETRO_SCANLINE_DEPTH)
    .setAlpha(RETRO_SCANLINE_ALPHA)
    .setVisible(true);
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
        filterList.addVignette(0.5, 0.5, 0.82, 0.1);
      }
    } else if (typeof filterList.addVignette === 'function') {
      filterList.addVignette(0.5, 0.5, 0.82, 0.1);
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

function ensureScanlineTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(RETRO_SCANLINE_TEXTURE_KEY)) {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 3;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create scanline texture');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(0, 0, 0, 0.42)';
  context.fillRect(0, 0, canvas.width, 1);
  context.fillStyle = 'rgba(0, 0, 0, 0.12)';
  context.fillRect(0, 1, canvas.width, 1);
  context.fillStyle = 'rgba(130, 190, 210, 0.06)';
  context.fillRect(0, 2, canvas.width, 1);
  scene.textures.addCanvas(RETRO_SCANLINE_TEXTURE_KEY, canvas);
}
