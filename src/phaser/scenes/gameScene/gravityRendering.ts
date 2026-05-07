import * as Phaser from 'phaser';

import type { GravityCapsuleState, GravityFieldState } from '../../../game/simulation/state';
import type { RetroPresentationPalette } from '../../view/retroPresentation';
import {
  drawGravityButtonGraphic,
  drawGravityCapsuleShellGraphic,
  drawGravityDoorGraphic,
  drawGravityFieldGraphic,
} from '../../view/runtimeWorldGraphics';
import {
  getGravityCapsuleButtonTraversalVisualCategory,
  getGravityCapsuleShellTraversalVisualCategory,
  getGravityFieldTraversalVisualCategory,
} from '../../view/traversalVisualLanguage';

export type GameSceneGravityRenderingContext = Phaser.Scene & {
  bridge: {
    getSession(): {
      getState(): {
        stageRuntime: {
          gravityCapsules: GravityCapsuleState[];
        };
      };
    };
  };
  retroPalette: RetroPresentationPalette;
  gravityFieldSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityFieldCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityCapsuleShellSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleEntryDoorSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleExitDoorSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleButtonSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleButtonCoreSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleShellMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityCapsuleButtonMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityFieldColor(field: GravityFieldState, capsule?: GravityCapsuleState | null): number;
  gravityFieldAlpha(field: GravityFieldState, capsule?: GravityCapsuleState | null): number;
  gravityCapsuleShellColor(capsule: GravityCapsuleState): number;
  gravityCapsuleShellAlpha(capsule: GravityCapsuleState): number;
  gravityCapsuleShellStrokeColor(capsule: GravityCapsuleState): number;
  gravityCapsuleEntryDoorColor(capsule: GravityCapsuleState): number;
  gravityCapsuleExitDoorColor(capsule: GravityCapsuleState): number;
  gravityCapsuleDoorAlpha(capsule: GravityCapsuleState): number;
  gravityCapsuleButtonColor(capsule: GravityCapsuleState): number;
  gravityCapsuleButtonCoreColor(capsule: GravityCapsuleState): number;
};

export function syncGravityField(scene: GameSceneGravityRenderingContext, field: GravityFieldState): void {
  const sprite = scene.gravityFieldSprites.get(field.id);
  const markers = scene.gravityFieldCategoryMarkerSprites.get(field.id);
  if (!sprite || !markers) {
    return;
  }

  const capsule = field.gravityCapsuleId
    ? scene.bridge.getSession().getState().stageRuntime.gravityCapsules.find((entry) => entry.id === field.gravityCapsuleId) ?? null
    : null;
  sprite.setPosition(field.x, field.y).setVisible(true);
  drawGravityFieldGraphic(sprite, {
    field,
    color: scene.gravityFieldColor(field, capsule),
    alpha: scene.gravityFieldAlpha(field, capsule),
    enabled: capsule ? capsule.enabled : true,
    brightColor: scene.retroPalette.bright,
    borderColor: scene.retroPalette.border,
    time: scene.time.now,
  });
  syncGravityFieldMarkers(scene, field, capsule, markers);
}

export function syncGravityCapsule(scene: GameSceneGravityRenderingContext, capsule: GravityCapsuleState): void {
  const shell = scene.gravityCapsuleShellSprites.get(capsule.id);
  const entryDoor = scene.gravityCapsuleEntryDoorSprites.get(capsule.id);
  const exitDoor = scene.gravityCapsuleExitDoorSprites.get(capsule.id);
  const button = scene.gravityCapsuleButtonSprites.get(capsule.id);
  const buttonCore = scene.gravityCapsuleButtonCoreSprites.get(capsule.id);
  const shellMarkers = scene.gravityCapsuleShellMarkerSprites.get(capsule.id);
  const buttonMarkers = scene.gravityCapsuleButtonMarkerSprites.get(capsule.id);
  if (!shell || !entryDoor || !exitDoor || !button || !buttonCore || !shellMarkers || !buttonMarkers) {
    return;
  }

  shell.setPosition(capsule.shell.x, capsule.shell.y).setVisible(true);
  drawGravityCapsuleShellGraphic(shell, {
    width: capsule.shell.width,
    height: capsule.shell.height,
    shellColor: scene.gravityCapsuleShellColor(capsule),
    strokeColor: scene.gravityCapsuleShellStrokeColor(capsule),
    alpha: scene.gravityCapsuleShellAlpha(capsule),
    enabled: capsule.enabled,
    brightColor: scene.retroPalette.bright,
  });
  entryDoor.setPosition(capsule.entryDoor.x, capsule.entryDoor.y).setVisible(true);
  drawGravityDoorGraphic(entryDoor, {
    width: capsule.entryDoor.width,
    height: capsule.entryDoor.height,
    color: scene.gravityCapsuleEntryDoorColor(capsule),
    alpha: scene.gravityCapsuleDoorAlpha(capsule),
    brightColor: scene.retroPalette.bright,
    borderColor: scene.retroPalette.border,
  });
  exitDoor.setPosition(capsule.exitDoor.x, capsule.exitDoor.y).setVisible(true);
  drawGravityDoorGraphic(exitDoor, {
    width: capsule.exitDoor.width,
    height: capsule.exitDoor.height,
    color: scene.gravityCapsuleExitDoorColor(capsule),
    alpha: scene.gravityCapsuleDoorAlpha(capsule),
    brightColor: scene.retroPalette.bright,
    borderColor: scene.retroPalette.border,
  });
  button.setPosition(capsule.button.x, capsule.button.y).setVisible(true);
  drawGravityButtonGraphic(button, {
    width: capsule.button.width,
    height: capsule.button.height,
    shellColor: scene.gravityCapsuleButtonColor(capsule),
    coreColor: scene.gravityCapsuleButtonCoreColor(capsule),
    alpha: 0.94,
    brightColor: scene.retroPalette.bright,
    borderColor: scene.retroPalette.border,
    activated: capsule.button.activated,
  });
  buttonCore.setPosition(capsule.button.x, capsule.button.y).setVisible(true);
  drawGravityButtonGraphic(buttonCore, {
    width: capsule.button.width,
    height: capsule.button.height,
    shellColor: scene.gravityCapsuleButtonColor(capsule),
    coreColor: scene.gravityCapsuleButtonCoreColor(capsule),
    alpha: capsule.enabled ? 1 : 0.78,
    brightColor: scene.retroPalette.bright,
    borderColor: scene.retroPalette.border,
    activated: capsule.enabled,
  });
  syncGravityCapsuleShellMarkers(scene, capsule, shellMarkers);
  syncGravityCapsuleButtonMarkers(scene, capsule, buttonMarkers);
}

function hideTraversalMarkers(markers: Phaser.GameObjects.Rectangle[]): void {
  markers.forEach((marker) => marker.setVisible(false));
}

function syncGravityFieldMarkers(
  scene: GameSceneGravityRenderingContext,
  field: GravityFieldState,
  capsule: GravityCapsuleState | null,
  markers: Phaser.GameObjects.Rectangle[],
): void {
  const category = getGravityFieldTraversalVisualCategory(field, capsule);
  const centerX = field.x + field.width / 2;
  const centerY = field.y + field.height / 2;

  if (category === 'routeToggle') {
    markers.forEach((marker, index) => {
      marker
        .setPosition(centerX + (index - 1.5) * Math.max(18, field.width * 0.16), centerY)
        .setSize(Math.max(10, Math.floor(field.width * 0.09)), Math.max(10, Math.floor(field.height * 0.14)))
        .setFillStyle(scene.retroPalette.border, 0.18 + index * 0.04)
        .setVisible(true);
    });
    return;
  }

  const drift = Math.sin((scene.time.now + field.x) / 180);
  markers.forEach((marker, index) => {
    const width = Math.max(8, Math.floor(field.width * 0.08));
    const height = Math.max(18, Math.floor(field.height * (index % 2 === 0 ? 0.44 : 0.6)));
    marker
      .setPosition(centerX + (index - 1.5) * Math.max(16, field.width * 0.14), centerY + drift * (index % 2 === 0 ? 6 : -6))
      .setSize(width, height)
      .setFillStyle(field.kind === 'anti-grav-stream' ? scene.retroPalette.bright : scene.retroPalette.ink, 0.24 + index * 0.06)
      .setVisible(true);
  });
}

function syncGravityCapsuleShellMarkers(
  scene: GameSceneGravityRenderingContext,
  capsule: GravityCapsuleState,
  markers: Phaser.GameObjects.Rectangle[],
): void {
  const category = getGravityCapsuleShellTraversalVisualCategory(capsule);
  if (category !== 'routeToggle') {
    hideTraversalMarkers(markers);
    return;
  }

  const centerX = capsule.shell.x + capsule.shell.width / 2;
  const topY = capsule.shell.y + Math.max(8, Math.floor(capsule.shell.height * 0.18));
  markers.forEach((marker, index) => {
    marker
      .setPosition(centerX + (index - 1) * Math.max(12, capsule.shell.width * 0.16), topY)
      .setSize(Math.max(8, Math.floor(capsule.shell.width * 0.1)), Math.max(4, Math.floor(capsule.shell.height * 0.08)))
      .setFillStyle(index === 1 ? scene.retroPalette.bright : scene.retroPalette.cool, capsule.enabled ? 0.84 : 0.42)
      .setVisible(true);
  });
}

function syncGravityCapsuleButtonMarkers(
  scene: GameSceneGravityRenderingContext,
  capsule: GravityCapsuleState,
  markers: Phaser.GameObjects.Rectangle[],
): void {
  const category = getGravityCapsuleButtonTraversalVisualCategory(capsule);
  if (category !== 'routeToggle') {
    hideTraversalMarkers(markers);
    return;
  }

  const centerX = capsule.button.x + capsule.button.width / 2;
  const centerY = capsule.button.y + capsule.button.height / 2;
  const alpha = capsule.button.activated ? 0.9 : 0.5;
  markers.forEach((marker, index) => {
    marker
      .setPosition(centerX, centerY + (index - 1) * Math.max(4, capsule.button.height * 0.18))
      .setSize(Math.max(8, Math.floor(capsule.button.width * (index === 1 ? 0.62 : 0.38))), Math.max(2, Math.floor(capsule.button.height * 0.1)))
      .setFillStyle(index === 1 ? scene.retroPalette.bright : scene.retroPalette.cool, alpha)
      .setVisible(true);
  });
}
