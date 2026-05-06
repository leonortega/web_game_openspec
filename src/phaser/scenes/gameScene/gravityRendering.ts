import * as Phaser from 'phaser';

import type { GravityCapsuleState, GravityFieldState } from '../../../game/simulation/state';
import type { RetroPresentationPalette } from '../../view/retroPresentation';
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
  gravityFieldSprites: Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.TileSprite>;
  gravityFieldCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityCapsuleShellSprites: Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image>;
  gravityCapsuleEntryDoorSprites: Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image>;
  gravityCapsuleExitDoorSprites: Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image>;
  gravityCapsuleButtonSprites: Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image>;
  gravityCapsuleButtonCoreSprites: Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image>;
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
  const fieldSprite = sprite as any;
  fieldSprite
    .setPosition(field.x + field.width / 2, field.y + field.height / 2)
    .setVisible(true);
  if (typeof fieldSprite.setDisplaySize === 'function') {
    fieldSprite.setDisplaySize(field.width, field.height);
  } else if (typeof fieldSprite.setSize === 'function') {
    fieldSprite.setSize(field.width, field.height);
  }
  if (typeof fieldSprite.setFillStyle === 'function') {
    fieldSprite
      .setFillStyle(scene.gravityFieldColor(field, capsule), scene.gravityFieldAlpha(field, capsule))
      .setStrokeStyle(2, scene.gravityFieldColor(field, capsule), capsule?.enabled ? 0.42 : 0.2);
  } else {
    fieldSprite.setTint(scene.gravityFieldColor(field, capsule));
    fieldSprite.setAlpha(scene.gravityFieldAlpha(field, capsule));
    if (field.kind === 'anti-grav-stream') {
      fieldSprite.setTexture?.('gravity-field-stream');
    } else {
      fieldSprite.setTexture?.('gravity-field-invert');
    }
  }
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

  const shellSprite = shell as any;
  shellSprite
    .setPosition(capsule.shell.x + capsule.shell.width / 2, capsule.shell.y + capsule.shell.height / 2)
    .setVisible(true);
  if (typeof shellSprite.setDisplaySize === 'function') {
    shellSprite.setDisplaySize(capsule.shell.width, capsule.shell.height);
  } else if (typeof shellSprite.setSize === 'function') {
    shellSprite.setSize(capsule.shell.width, capsule.shell.height);
  }
  if (typeof shellSprite.setFillStyle === 'function') {
    shellSprite
      .setFillStyle(scene.gravityCapsuleShellColor(capsule), scene.gravityCapsuleShellAlpha(capsule))
      .setStrokeStyle(2, scene.gravityCapsuleShellStrokeColor(capsule), capsule.enabled ? 0.72 : 0.44);
  } else {
    shellSprite.setTexture?.('gravity-capsule-shell');
    shellSprite.setTint(scene.gravityCapsuleShellColor(capsule));
    shellSprite.setAlpha(scene.gravityCapsuleShellAlpha(capsule));
  }
  const entryDoorSprite = entryDoor as any;
  entryDoorSprite
    .setPosition(capsule.entryDoor.x + capsule.entryDoor.width / 2, capsule.entryDoor.y + capsule.entryDoor.height / 2)
    .setVisible(true);
  if (typeof entryDoorSprite.setDisplaySize === 'function') {
    entryDoorSprite.setDisplaySize(capsule.entryDoor.width, capsule.entryDoor.height);
  } else if (typeof entryDoorSprite.setSize === 'function') {
    entryDoorSprite.setSize(capsule.entryDoor.width, capsule.entryDoor.height);
  }
  if (typeof entryDoorSprite.setFillStyle === 'function') {
    entryDoorSprite.setFillStyle(scene.gravityCapsuleEntryDoorColor(capsule), scene.gravityCapsuleDoorAlpha(capsule));
  } else {
    entryDoorSprite.setTexture?.('gravity-capsule-entry-door');
    entryDoorSprite.setTint(scene.gravityCapsuleEntryDoorColor(capsule));
    entryDoorSprite.setAlpha(scene.gravityCapsuleDoorAlpha(capsule));
  }
  const exitDoorSprite = exitDoor as any;
  exitDoorSprite
    .setPosition(capsule.exitDoor.x + capsule.exitDoor.width / 2, capsule.exitDoor.y + capsule.exitDoor.height / 2)
    .setVisible(true);
  if (typeof exitDoorSprite.setDisplaySize === 'function') {
    exitDoorSprite.setDisplaySize(capsule.exitDoor.width, capsule.exitDoor.height);
  } else if (typeof exitDoorSprite.setSize === 'function') {
    exitDoorSprite.setSize(capsule.exitDoor.width, capsule.exitDoor.height);
  }
  if (typeof exitDoorSprite.setFillStyle === 'function') {
    exitDoorSprite.setFillStyle(scene.gravityCapsuleExitDoorColor(capsule), scene.gravityCapsuleDoorAlpha(capsule));
  } else {
    exitDoorSprite.setTexture?.('gravity-capsule-exit-door');
    exitDoorSprite.setTint(scene.gravityCapsuleExitDoorColor(capsule));
    exitDoorSprite.setAlpha(scene.gravityCapsuleDoorAlpha(capsule));
  }
  const buttonSprite = button as any;
  buttonSprite
    .setPosition(capsule.button.x + capsule.button.width / 2, capsule.button.y + capsule.button.height / 2)
    .setVisible(true);
  if (typeof buttonSprite.setDisplaySize === 'function') {
    buttonSprite.setDisplaySize(capsule.button.width, capsule.button.height);
  } else if (typeof buttonSprite.setSize === 'function') {
    buttonSprite.setSize(capsule.button.width, capsule.button.height);
  }
  if (typeof buttonSprite.setFillStyle === 'function') {
    buttonSprite
      .setFillStyle(scene.gravityCapsuleButtonColor(capsule), 0.94)
      .setStrokeStyle(2, scene.gravityCapsuleShellStrokeColor(capsule), capsule.enabled ? 0.72 : 0.5);
  } else {
    buttonSprite.setTexture?.('gravity-capsule-button');
    buttonSprite.setTint(scene.gravityCapsuleButtonColor(capsule));
    buttonSprite.setAlpha(0.94);
  }
  const buttonCoreSprite = buttonCore as any;
  buttonCoreSprite
    .setPosition(capsule.button.x + capsule.button.width / 2, capsule.button.y + capsule.button.height / 2)
    .setVisible(true);
  if (typeof buttonCoreSprite.setDisplaySize === 'function') {
    buttonCoreSprite.setDisplaySize(Math.max(8, capsule.button.width - 12), Math.max(8, capsule.button.height - 12));
  } else if (typeof buttonCoreSprite.setSize === 'function') {
    buttonCoreSprite.setSize(Math.max(8, capsule.button.width - 12), Math.max(8, capsule.button.height - 12));
  }
  if (typeof buttonCoreSprite.setFillStyle === 'function') {
    buttonCoreSprite.setFillStyle(scene.gravityCapsuleButtonCoreColor(capsule), capsule.enabled ? 1 : 0.78);
  } else {
    buttonCoreSprite.setTexture?.('gravity-capsule-button-core');
    buttonCoreSprite.setTint(scene.gravityCapsuleButtonCoreColor(capsule));
    buttonCoreSprite.setAlpha(capsule.enabled ? 1 : 0.78);
  }
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
