import * as Phaser from 'phaser';

import type { GravityCapsuleState, GravityFieldState } from '../../../game/simulation/state';
import type { RetroPresentationPalette } from '../../view/retroPresentation';
import {
  drawGravityButtonGraphic,
  drawGravityCapsuleShellGraphic,
  drawGravityDoorGraphic,
  drawGravityFieldGraphic,
} from '../../view/runtimeWorldGraphics';

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
  void scene;
  void field;
  void capsule;
  hideTraversalMarkers(markers);
}

function syncGravityCapsuleShellMarkers(
  scene: GameSceneGravityRenderingContext,
  capsule: GravityCapsuleState,
  markers: Phaser.GameObjects.Rectangle[],
): void {
  void scene;
  void capsule;
  hideTraversalMarkers(markers);
}

function syncGravityCapsuleButtonMarkers(
  scene: GameSceneGravityRenderingContext,
  capsule: GravityCapsuleState,
  markers: Phaser.GameObjects.Rectangle[],
): void {
  void scene;
  void capsule;
  hideTraversalMarkers(markers);
}
