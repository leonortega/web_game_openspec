import * as Phaser from 'phaser';

import {
  isPlatformActive,
  isPlatformVisible,
  type ActivationNodeState,
  type PlatformState,
} from '../../../game/simulation/state';
import { getRetroMotionStep, type RetroPresentationPalette } from '../../view/retroPresentation';
import {
  getActivationNodeTraversalVisualCategory,
  getPlatformTraversalVisualCategory,
} from '../../view/traversalVisualLanguage';
import {
  drawActivationNodeGraphic,
  drawPlatformGraphic,
  drawTerrainVariantGraphic,
} from '../../view/runtimeWorldGraphics';

export type GameScenePlatformRenderingContext = Phaser.Scene & {
  bridge: {
    getSession(): {
      getState(): {
        player: {
          supportPlatformId: string | null;
          springContactPlatformId: string | null;
        };
        stageRuntime: {
          revealedPlatformIds: string[];
          temporaryBridges: Array<{ id: string; active: boolean }>;
        };
      };
    };
  };
  retroPalette: RetroPresentationPalette;
  platformSprites: Map<string, Phaser.GameObjects.Graphics>;
  platformShadowSprites: Map<string, Phaser.GameObjects.Rectangle | { layer: any; index: number }>;
  platformDetailSprites: Map<string, Phaser.GameObjects.Rectangle | { layer: any; index: number }>;
  platformCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  activationNodeSprites: Map<string, Phaser.GameObjects.Graphics>;
  activationNodeMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  terrainVariantSprites: Map<string, Phaser.GameObjects.Graphics>;
  terrainVariantShadowSprites: Map<string, Phaser.GameObjects.Rectangle | { layer: any; index: number }>;
  terrainVariantAccentSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainVariantDetailSprites: Map<string, Array<Phaser.GameObjects.Rectangle | { layer: any; index: number }>>;
  platformColor(platform: PlatformState): number;
  platformDetailColor(platform: PlatformState): number;
  activationNodeColor(node: { activated: boolean }): number;
  terrainVariantColor(platform: PlatformState): number;
  terrainVariantAlpha(platform: PlatformState): number;
  terrainVariantStrokeColor(platform: PlatformState): number;
  terrainVariantStrokeAlpha(platform: PlatformState): number;
  terrainVariantShadowAlpha(platform: PlatformState): number;
  terrainVariantAccentY(platform: PlatformState): number;
  terrainVariantAccentWidth(platform: PlatformState): number;
  terrainVariantAccentHeight(platform: PlatformState): number;
  terrainVariantAccentColor(platform: PlatformState): number;
  terrainVariantAccentAlpha(platform: PlatformState): number;
  syncStickyTerrainVariantDetails(platform: PlatformState, details: Array<Phaser.GameObjects.Rectangle | { layer: any; index: number }>): void;
  syncBrittleTerrainVariantDetails(platform: PlatformState, details: Array<Phaser.GameObjects.Rectangle | { layer: any; index: number }>): void;
};

const getPlatformTopSurfaceHeight = (platform: Pick<PlatformState, 'height'>): number => Math.min(platform.height, 8);

export function syncPlatform(scene: GameScenePlatformRenderingContext, platform: PlatformState): void {
  const sprite = scene.platformSprites.get(platform.id);
  const shadowRec = scene.platformShadowSprites.get(platform.id);
  const detailRec = scene.platformDetailSprites.get(platform.id);
  const markers = scene.platformCategoryMarkerSprites.get(platform.id);
  if (!sprite || !shadowRec || !detailRec || !markers) {
    return;
  }

  const state = scene.bridge.getSession().getState();
  const activeBridgeIds = state.stageRuntime.temporaryBridges.filter((bridge) => bridge.active).map((bridge) => bridge.id);
  const visible = isPlatformVisible(platform, state.stageRuntime.revealedPlatformIds, activeBridgeIds);
  const active = isPlatformActive(platform, state.stageRuntime.revealedPlatformIds, activeBridgeIds);

  sprite.setVisible(visible);

  const setShadowMember = (rec: any, opts: any) => {
    if (rec && rec.layer) {
      rec.layer.editMember(rec.index, opts);
    } else if (rec && typeof rec.setPosition === 'function') {
      if (opts.x !== undefined && opts.y !== undefined) {
        rec.setPosition(opts.x, opts.y);
      }
      if (opts.width !== undefined && opts.height !== undefined) {
        if (typeof rec.setDisplaySize === 'function') {
          rec.setDisplaySize(opts.width, opts.height);
        } else if (typeof rec.setSize === 'function') {
          rec.setSize(opts.width, opts.height);
        }
      }
      if (opts.alpha !== undefined) {
        rec.setAlpha(opts.alpha);
      }
    }
  };

  const setDetailMember = (rec: any, opts: any) => {
    if (rec && rec.layer) {
      rec.layer.editMember(rec.index, opts);
    } else if (rec && typeof rec.setPosition === 'function') {
      if (opts.x !== undefined && opts.y !== undefined) {
        rec.setPosition(opts.x, opts.y);
      }
      if (opts.width !== undefined && opts.height !== undefined) {
        if (typeof rec.setDisplaySize === 'function') {
          rec.setDisplaySize(opts.width, opts.height);
        } else if (typeof rec.setSize === 'function') {
          rec.setSize(opts.width, opts.height);
        }
      }
      if (opts.fill !== undefined) {
        rec.setFillStyle?.(opts.fill);
      }
      if (opts.alpha !== undefined) {
        rec.setAlpha(opts.alpha);
      }
    }
  };

  if (!visible) {
    // Hide members: for GPULayer members set alpha=0, otherwise setVisible(false)
    setShadowMember(shadowRec, { alpha: 0 });
    setDetailMember(detailRec, { alpha: 0 });
    hideTraversalMarkers(markers);
    return;
  }

  sprite.setPosition(platform.x, platform.y);

  const offsetY = Math.max(2, Math.floor(platform.height * 0.18));
  const shadowWidth = Math.max(6, platform.width - 6);
  const shadowHeight = Math.max(4, Math.floor(platform.height * 0.38));
  setShadowMember(shadowRec, {
    x: platform.x + platform.width / 2,
    y: platform.y + platform.height / 2 + offsetY,
    width: shadowWidth,
    height: shadowHeight,
    scaleX: shadowWidth / 2,
    scaleY: shadowHeight / 2,
    alpha: active ? 0.28 : 0.18,
    tintTopLeft: scene.retroPalette.ink,
    tintTopRight: scene.retroPalette.ink,
    tintBottomLeft: scene.retroPalette.ink,
    tintBottomRight: scene.retroPalette.ink,
  });

  const topSurfaceHeight = getPlatformTopSurfaceHeight(platform);
  setDetailMember(detailRec, {
    x: platform.x + platform.width / 2,
    y: platform.y + topSurfaceHeight / 2,
    width: platform.width,
    height: topSurfaceHeight,
    scaleX: platform.width / 2,
    scaleY: topSurfaceHeight / 2,
    alpha: 1,
    tintTopLeft: scene.platformDetailColor(platform),
    tintTopRight: scene.platformDetailColor(platform),
    tintBottomLeft: scene.platformDetailColor(platform),
    tintBottomRight: scene.platformDetailColor(platform),
  });

  if (platform.kind === 'magnet' || platform.kind === 'crystal') {
    sprite.setAlpha(scene.terrainVariantAlpha(platform));
    setShadowMember(shadowRec, { alpha: scene.terrainVariantShadowAlpha(platform) });
    setDetailMember(detailRec, { alpha: 0 });
    drawTerrainVariantGraphic(sprite, {
      platform,
      baseColor: scene.terrainVariantColor(platform),
      accentColor: scene.terrainVariantAccentColor(platform),
      strokeColor: scene.terrainVariantStrokeColor(platform),
      alpha: sprite.alpha,
      brightColor: scene.retroPalette.bright,
      timeMs: scene.time.now,
      playerTouching: state.player.supportPlatformId === platform.id,
    });
    syncPlatformCategoryMarkers(scene, platform, markers, active);
    return;
  }

  if (platform.brittle?.phase === 'broken') {
    sprite.setAlpha(0.16);
    setShadowMember(shadowRec, { alpha: 0.06 });
    setDetailMember(detailRec, { alpha: 0.12 });
  } else if (platform.kind === 'falling' && platform.fall) {
    const alpha = platform.fall.falling ? 0.45 : platform.fall.triggered ? 0.7 : 1;
    sprite.setAlpha(alpha);
    setShadowMember(shadowRec, { alpha: alpha * 0.28 });
    setDetailMember(detailRec, { alpha });
  } else if (platform.magnetic) {
    sprite.setAlpha(platform.magnetic.powered ? 1 : 0.46);
    setShadowMember(shadowRec, { alpha: platform.magnetic.powered ? 0.3 : 0.16 });
    setDetailMember(detailRec, { alpha: platform.magnetic.powered ? 1 : 0.46 });
  } else if (platform.temporaryBridge && platform.reveal && !active) {
    sprite.setAlpha(0.38);
    setShadowMember(shadowRec, { alpha: 0.12 });
    setDetailMember(detailRec, { alpha: 0.38 });
  } else {
    sprite.setAlpha(1);
    setShadowMember(shadowRec, { alpha: 0.28 });
    setDetailMember(detailRec, { alpha: 1 });
  }
  drawPlatformGraphic(sprite, {
    platform,
    baseColor: scene.platformColor(platform),
    detailColor: scene.platformDetailColor(platform),
    brightColor: scene.retroPalette.bright,
    borderColor: scene.retroPalette.border,
    alpha: sprite.alpha,
    active,
    timeMs: scene.time.now,
    playerTouching: state.player.supportPlatformId === platform.id,
    springEngaged: state.player.springContactPlatformId === platform.id,
  });

  syncPlatformCategoryMarkers(scene, platform, markers, active);
}

export function syncActivationNode(scene: GameScenePlatformRenderingContext, node: ActivationNodeState): void {
  const sprite = scene.activationNodeSprites.get(node.id);
  const markers = scene.activationNodeMarkerSprites.get(node.id);
  if (!sprite || !markers) {
    return;
  }

  sprite.setPosition(node.x, node.y).setVisible(true);
  drawActivationNodeGraphic(sprite, {
    width: node.width,
    height: node.height,
    color: scene.activationNodeColor(node),
    active: node.activated,
    brightColor: scene.retroPalette.bright,
    borderColor: scene.retroPalette.border,
  });
  syncActivationNodeMarkers(scene, node, markers);
}

export function syncTerrainVariantPlatform(scene: GameScenePlatformRenderingContext, platform: PlatformState): void {
  const sprite = scene.terrainVariantSprites.get(platform.id);
  const shadow = scene.terrainVariantShadowSprites.get(platform.id);
  const accent = scene.terrainVariantAccentSprites.get(platform.id);
  const details = scene.terrainVariantDetailSprites.get(platform.id);
  if (!sprite || !shadow || !accent || !details) {
    return;
  }
  const state = scene.bridge.getSession().getState();

  sprite.setPosition(platform.x, platform.y).setVisible(true);
  drawTerrainVariantGraphic(sprite, {
    platform,
    baseColor: scene.terrainVariantColor(platform),
    accentColor: scene.terrainVariantAccentColor(platform),
    strokeColor: scene.terrainVariantStrokeColor(platform),
    alpha: scene.terrainVariantAlpha(platform),
    brightColor: scene.retroPalette.bright,
    timeMs: scene.time.now,
    playerTouching: state.player.supportPlatformId === platform.id,
  });
  const setShadowMember = (rec: any, opts: any) => {
    if (!rec) return;
    if (rec.layer) {
      rec.layer.editMember(rec.index, opts);
    } else if (rec && typeof rec.setPosition === 'function') {
      if (opts.x !== undefined && opts.y !== undefined) rec.setPosition(opts.x, opts.y);
      if (opts.width !== undefined && opts.height !== undefined) {
        if (typeof rec.setDisplaySize === 'function') rec.setDisplaySize(opts.width, opts.height);
        else if (typeof rec.setSize === 'function') rec.setSize(opts.width, opts.height);
      }
      if (opts.alpha !== undefined) rec.setAlpha(opts.alpha);
      if (opts.visible !== undefined) rec.setVisible(opts.visible);
    }
  };

  setShadowMember(shadow, {
    x: platform.x + platform.width / 2,
    y: platform.y + platform.height / 2 + Math.max(2, Math.floor(platform.height * 0.16)),
    width: Math.max(8, platform.width - 8),
    height: Math.max(4, Math.floor(platform.height * 0.32)),
    alpha: scene.terrainVariantShadowAlpha(platform),
    tintTopLeft: scene.retroPalette.ink,
    tintTopRight: scene.retroPalette.ink,
    tintBottomLeft: scene.retroPalette.ink,
    tintBottomRight: scene.retroPalette.ink,
    visible: true,
  });

  accent
    .setPosition(platform.x + platform.width / 2, scene.terrainVariantAccentY(platform))
    .setSize(scene.terrainVariantAccentWidth(platform), scene.terrainVariantAccentHeight(platform))
    .setFillStyle(scene.terrainVariantAccentColor(platform), scene.terrainVariantAccentAlpha(platform))
    .setVisible(true);

  if (platform.kind === 'magnet') {
    scene.syncStickyTerrainVariantDetails(platform, details);
    return;
  }

  if (platform.kind === 'crystal') {
    scene.syncBrittleTerrainVariantDetails(platform, details);
    return;
  }

  const setDetailMember = (rec: any, opts: any) => {
    if (!rec) return;
    if (rec.layer) {
      rec.layer.editMember(rec.index, opts);
    } else if (rec && typeof rec.setPosition === 'function') {
      if (opts.x !== undefined && opts.y !== undefined) rec.setPosition(opts.x, opts.y);
      if (opts.width !== undefined && opts.height !== undefined) {
        if (typeof rec.setDisplaySize === 'function') rec.setDisplaySize(opts.width, opts.height);
        else if (typeof rec.setSize === 'function') rec.setSize(opts.width, opts.height);
      }
      if (opts.fill !== undefined) rec.setFillStyle(opts.fill, opts.alpha ?? 1);
      if (opts.alpha !== undefined) rec.setAlpha(opts.alpha);
      if (opts.visible !== undefined) rec.setVisible(opts.visible);
    }
  };

  details.forEach((detail) => setDetailMember(detail, { visible: false }));
}

function hideTraversalMarkers(markers: Phaser.GameObjects.Rectangle[]): void {
  markers.forEach((marker) => marker.setVisible(false));
}

function syncPlatformCategoryMarkers(
  scene: GameScenePlatformRenderingContext,
  platform: PlatformState,
  markers: Phaser.GameObjects.Rectangle[],
  active: boolean,
): void {
  const category = getPlatformTraversalVisualCategory(platform);
  if (category === 'neutral') {
    hideTraversalMarkers(markers);
    return;
  }

  const centerX = platform.x + platform.width / 2;
  const centerY = platform.y + platform.height / 2;
  const pulse = getRetroMotionStep(scene.time.now + centerX, 120, 3);

  if (category === 'assistedMovement') {
    if (
      platform.kind === 'spring' ||
      platform.kind === 'moving' ||
      platform.kind === 'falling' ||
      platform.kind === 'crystal'
    ) {
      hideTraversalMarkers(markers);
      return;
    }

    const drift = pulse - 1;
    markers.forEach((marker, index) => {
      marker
        .setPosition(centerX + (index - 1) * Math.max(12, platform.width * 0.18) + drift * (index - 1) * 2, centerY)
        .setSize(Math.max(8, Math.floor(platform.width * 0.12)), Math.max(8, Math.floor(platform.height * 0.52)))
        .setFillStyle(index === 1 ? scene.retroPalette.bright : scene.retroPalette.cool, active ? 0.72 : 0.56)
        .setVisible(true);
    });
    return;
  }

  if (platform.magnetic) {
    hideTraversalMarkers(markers);
    return;
  }

  const segmentWidth = Math.max(10, Math.floor(platform.width * 0.16));
  const alpha = active ? 0.82 : 0.4;
  markers.forEach((marker, index) => {
    marker
      .setPosition(centerX + (index - 1) * Math.max(14, platform.width * 0.2), centerY)
      .setSize(segmentWidth, Math.max(4, Math.floor(platform.height * 0.2)))
      .setFillStyle(index === 1 ? scene.retroPalette.bright : scene.retroPalette.cool, alpha)
      .setVisible(true);
  });
}

function syncActivationNodeMarkers(
  scene: GameScenePlatformRenderingContext,
  node: ActivationNodeState,
  markers: Phaser.GameObjects.Rectangle[],
): void {
  const category = getActivationNodeTraversalVisualCategory(node);
  if (category !== 'routeToggle') {
    hideTraversalMarkers(markers);
    return;
  }

  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  const pulse = getRetroMotionStep(scene.time.now + centerX, 100, 3);
  const alpha = node.activated ? 0.86 : 0.42;
  const widths = [Math.max(6, Math.floor(node.width * 0.22)), Math.max(10, Math.floor(node.width * 0.44)), Math.max(6, Math.floor(node.width * 0.22))];

  markers.forEach((marker, index) => {
    marker
      .setPosition(centerX, centerY + (index - 1) * Math.max(6, node.height * 0.16))
      .setSize(widths[index] + (node.activated && index === 1 ? pulse : 0), Math.max(3, Math.floor(node.height * 0.12)))
      .setFillStyle(index === 1 ? scene.retroPalette.bright : scene.retroPalette.cool, alpha)
      .setVisible(true);
  });
}
