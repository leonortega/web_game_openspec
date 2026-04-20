import * as Phaser from 'phaser';

import {
  isPlatformActive,
  isPlatformVisible,
  type ActivationNodeState,
  type LauncherState,
  type PlatformState,
  type TerrainSurfaceState,
} from '../../../game/simulation/state';
import { getRetroMotionStep, type RetroPresentationPalette } from '../../view/retroPresentation';
import {
  getActivationNodeTraversalVisualCategory,
  getLauncherTraversalVisualCategory,
  getPlatformTraversalVisualCategory,
} from '../../view/traversalVisualLanguage';

export type GameScenePlatformRenderingContext = Phaser.Scene & {
  bridge: {
    getSession(): {
      getState(): {
        stageRuntime: {
          revealedPlatformIds: string[];
          temporaryBridges: Array<{ id: string; active: boolean }>;
        };
      };
    };
  };
  retroPalette: RetroPresentationPalette;
  platformSprites: Map<string, Phaser.GameObjects.Rectangle>;
  platformShadowSprites: Map<string, Phaser.GameObjects.Rectangle>;
  platformDetailSprites: Map<string, Phaser.GameObjects.Rectangle>;
  platformCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  launcherSprites: Map<string, Phaser.GameObjects.Rectangle>;
  launcherCoreSprites: Map<string, Phaser.GameObjects.Rectangle>;
  launcherCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  activationNodeSprites: Map<string, Phaser.GameObjects.Rectangle>;
  activationNodeMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  terrainSurfaceSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainSurfaceShadowSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainSurfaceAccentSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainSurfaceDetailSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  platformColor(platform: PlatformState): number;
  platformDetailColor(platform: PlatformState): number;
  launcherColor(launcherEntry: LauncherState): number;
  activationNodeColor(node: { activated: boolean }): number;
  terrainSurfaceColor(surface: TerrainSurfaceState): number;
  terrainSurfaceAlpha(surface: TerrainSurfaceState): number;
  terrainSurfaceStrokeColor(surface: TerrainSurfaceState): number;
  terrainSurfaceStrokeAlpha(surface: TerrainSurfaceState): number;
  terrainSurfaceShadowAlpha(surface: TerrainSurfaceState): number;
  terrainSurfaceAccentY(surface: TerrainSurfaceState): number;
  terrainSurfaceAccentWidth(surface: TerrainSurfaceState): number;
  terrainSurfaceAccentHeight(surface: TerrainSurfaceState): number;
  terrainSurfaceAccentColor(surface: TerrainSurfaceState): number;
  terrainSurfaceAccentAlpha(surface: TerrainSurfaceState): number;
  syncStickySurfaceDetails(surface: TerrainSurfaceState, details: Phaser.GameObjects.Rectangle[]): void;
  syncBrittleSurfaceDetails(surface: TerrainSurfaceState, details: Phaser.GameObjects.Rectangle[]): void;
};

export function syncPlatform(scene: GameScenePlatformRenderingContext, platform: PlatformState): void {
  const sprite = scene.platformSprites.get(platform.id);
  const shadow = scene.platformShadowSprites.get(platform.id);
  const detail = scene.platformDetailSprites.get(platform.id);
  const markers = scene.platformCategoryMarkerSprites.get(platform.id);
  if (!sprite || !shadow || !detail || !markers) {
    return;
  }

  const state = scene.bridge.getSession().getState();
  const activeBridgeIds = state.stageRuntime.temporaryBridges.filter((bridge) => bridge.active).map((bridge) => bridge.id);
  const visible = isPlatformVisible(platform, state.stageRuntime.revealedPlatformIds, activeBridgeIds);
  const active = isPlatformActive(platform, state.stageRuntime.revealedPlatformIds, activeBridgeIds);
  sprite.setVisible(visible);
  shadow.setVisible(visible);
  detail.setVisible(visible);
  if (!visible) {
    hideTraversalMarkers(markers);
    return;
  }

  sprite.setPosition(platform.x + platform.width / 2, platform.y + platform.height / 2);
  sprite.setFillStyle(scene.platformColor(platform));
  sprite.setStrokeStyle(0);
  shadow
    .setPosition(platform.x + platform.width / 2, platform.y + platform.height / 2 + Math.max(2, Math.floor(platform.height * 0.18)))
    .setSize(Math.max(6, platform.width - 6), Math.max(4, Math.floor(platform.height * 0.38)))
    .setAlpha(active ? 0.28 : 0.18);
  detail
    .setPosition(platform.x + platform.width / 2, platform.y + Math.min(platform.height / 2, 4))
    .setSize(platform.width, Math.min(platform.height, 6))
    .setFillStyle(scene.platformDetailColor(platform));

  if (platform.kind === 'falling' && platform.fall) {
    const alpha = platform.fall.falling ? 0.45 : platform.fall.triggered ? 0.7 : 1;
    sprite.setAlpha(alpha);
    shadow.setAlpha(alpha * 0.28);
    detail.setAlpha(alpha);
  } else if (platform.magnetic) {
    sprite.setAlpha(platform.magnetic.powered ? 1 : 0.46);
    sprite.setStrokeStyle(2, platform.magnetic.powered ? 0xd6fff6 : 0x90a6bf, 0.48);
    shadow.setAlpha(platform.magnetic.powered ? 0.3 : 0.16);
    detail.setAlpha(platform.magnetic.powered ? 1 : 0.46);
  } else if (platform.temporaryBridge && platform.reveal && !active) {
    sprite.setAlpha(0.38);
    sprite.setStrokeStyle(2, 0xf7f3d6, 0.2);
    shadow.setAlpha(0.12);
    detail.setAlpha(0.38);
  } else {
    sprite.setAlpha(1);
    shadow.setAlpha(0.28);
    detail.setAlpha(1);
  }

  syncPlatformCategoryMarkers(scene, platform, markers, active);
}

export function syncLauncher(scene: GameScenePlatformRenderingContext, launcherEntry: LauncherState): void {
  const sprite = scene.launcherSprites.get(launcherEntry.id);
  const core = scene.launcherCoreSprites.get(launcherEntry.id);
  const markers = scene.launcherCategoryMarkerSprites.get(launcherEntry.id);
  if (!sprite || !core || !markers) {
    return;
  }

  sprite
    .setPosition(launcherEntry.x + launcherEntry.width / 2, launcherEntry.y + launcherEntry.height / 2)
    .setSize(launcherEntry.width, launcherEntry.height)
    .setFillStyle(scene.launcherColor(launcherEntry), launcherEntry.timerMs > 0 ? 0.5 : 0.86)
    .setVisible(true);
  core
    .setPosition(launcherEntry.x + launcherEntry.width / 2, launcherEntry.y + launcherEntry.height / 2)
    .setSize(Math.max(6, launcherEntry.width - 8), Math.max(6, launcherEntry.height - 8))
    .setFillStyle(launcherEntry.timerMs > 0 ? scene.retroPalette.bright : scene.retroPalette.cool, launcherEntry.timerMs > 0 ? 0.2 : 0.48)
    .setVisible(true);
  syncLauncherCategoryMarkers(scene, launcherEntry, markers);
}

export function syncActivationNode(scene: GameScenePlatformRenderingContext, node: ActivationNodeState): void {
  const sprite = scene.activationNodeSprites.get(node.id);
  const markers = scene.activationNodeMarkerSprites.get(node.id);
  if (!sprite || !markers) {
    return;
  }

  sprite
    .setPosition(node.x + node.width / 2, node.y + node.height / 2)
    .setSize(node.width, node.height)
    .setFillStyle(scene.activationNodeColor(node), node.activated ? 0.98 : 0.9)
    .setStrokeStyle(2, node.activated ? scene.retroPalette.bright : scene.retroPalette.border, node.activated ? 0.52 : 0.4)
    .setVisible(true);
  syncActivationNodeMarkers(scene, node, markers);
}

export function syncTerrainSurface(scene: GameScenePlatformRenderingContext, surface: TerrainSurfaceState): void {
  const sprite = scene.terrainSurfaceSprites.get(surface.id);
  const shadow = scene.terrainSurfaceShadowSprites.get(surface.id);
  const accent = scene.terrainSurfaceAccentSprites.get(surface.id);
  const details = scene.terrainSurfaceDetailSprites.get(surface.id);
  if (!sprite || !shadow || !accent || !details) {
    return;
  }

  sprite.setPosition(surface.x + surface.width / 2, surface.y + surface.height / 2);
  sprite.setSize(surface.width, surface.height);
  sprite.setVisible(true);
  sprite.setFillStyle(scene.terrainSurfaceColor(surface), scene.terrainSurfaceAlpha(surface));
  sprite.setStrokeStyle(2, scene.terrainSurfaceStrokeColor(surface), scene.terrainSurfaceStrokeAlpha(surface));
  shadow
    .setPosition(surface.x + surface.width / 2, surface.y + surface.height / 2 + Math.max(2, Math.floor(surface.height * 0.16)))
    .setSize(Math.max(8, surface.width - 8), Math.max(4, Math.floor(surface.height * 0.32)))
    .setVisible(true)
    .setAlpha(scene.terrainSurfaceShadowAlpha(surface));

  accent
    .setPosition(surface.x + surface.width / 2, scene.terrainSurfaceAccentY(surface))
    .setSize(scene.terrainSurfaceAccentWidth(surface), scene.terrainSurfaceAccentHeight(surface))
    .setFillStyle(scene.terrainSurfaceAccentColor(surface), scene.terrainSurfaceAccentAlpha(surface))
    .setVisible(true);

  if (surface.kind === 'stickySludge') {
    scene.syncStickySurfaceDetails(surface, details);
    return;
  }

  scene.syncBrittleSurfaceDetails(surface, details);
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
    if (platform.kind === 'spring') {
      const alpha = 0.82;
      const heights = [Math.max(8, platform.height - 8), Math.max(12, platform.height - 2), Math.max(8, platform.height - 8)];
      const xOffsets = [-0.24, 0, 0.24];
      markers.forEach((marker, index) => {
        marker
          .setPosition(centerX + platform.width * xOffsets[index], centerY + (index === 1 ? -2 : 0))
          .setSize(Math.max(6, Math.floor(platform.width * 0.08)), heights[index])
          .setFillStyle(index === 1 ? scene.retroPalette.bright : scene.retroPalette.border, alpha)
          .setVisible(true);
      });
      return;
    }

    if (platform.kind === 'falling' && platform.fall) {
      const alpha = platform.fall.falling ? 0.36 : platform.fall.triggered ? 0.72 : 0.58;
      const yOffsets = [-0.16, 0.04, 0.2];
      markers.forEach((marker, index) => {
        marker
          .setPosition(centerX + (index - 1) * Math.max(10, platform.width * 0.12), centerY + platform.height * yOffsets[index])
          .setSize(Math.max(10, Math.floor(platform.width * (index === 1 ? 0.18 : 0.14))), Math.max(3, Math.floor(platform.height * 0.18)))
          .setFillStyle(index === 1 ? scene.retroPalette.bright : scene.retroPalette.warm, alpha)
          .setVisible(true);
      });
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
    markers.forEach((marker, index) => {
      marker
        .setPosition(centerX + (index - 1) * Math.max(14, platform.width * 0.18), platform.y + Math.max(5, Math.floor(platform.height * 0.26)))
        .setSize(Math.max(8, Math.floor(platform.width * 0.1)), Math.max(3, Math.floor(platform.height * 0.16)))
        .setFillStyle(platform.magnetic?.powered ? scene.retroPalette.bright : scene.retroPalette.cool, platform.magnetic?.powered ? 0.82 : 0.34)
        .setVisible(true);
    });
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

function syncLauncherCategoryMarkers(
  scene: GameScenePlatformRenderingContext,
  launcherEntry: LauncherState,
  markers: Phaser.GameObjects.Rectangle[],
): void {
  const category = getLauncherTraversalVisualCategory(launcherEntry);
  if (category !== 'assistedMovement') {
    hideTraversalMarkers(markers);
    return;
  }

  const centerX = launcherEntry.x + launcherEntry.width / 2;
  const centerY = launcherEntry.y + launcherEntry.height / 2;
  const dirX = launcherEntry.direction.x;
  const dirY = launcherEntry.direction.y;
  const length = Math.max(10, Math.floor(Math.max(launcherEntry.width, launcherEntry.height) * 0.18));
  const alpha = launcherEntry.timerMs > 0 ? 0.28 : 0.74;

  markers.forEach((marker, index) => {
    const lane = index - 1;
    marker
      .setPosition(centerX + lane * Math.max(8, launcherEntry.width * 0.14) + dirX * 5, centerY + dirY * 5 - Math.abs(dirY) * index * 2)
      .setSize(Math.max(4, Math.floor(launcherEntry.width * 0.08)), length)
      .setFillStyle(
        launcherEntry.kind === 'bouncePod' ? (index === 1 ? scene.retroPalette.bright : scene.retroPalette.border) : scene.retroPalette.ink,
        alpha,
      )
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
