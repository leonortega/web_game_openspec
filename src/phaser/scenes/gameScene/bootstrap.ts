import * as Phaser from 'phaser';

import type { SessionSnapshot } from '../../../game/simulation/GameSession';
import { isPlatformVisible } from '../../../game/simulation/state';
import type {
  GravityCapsuleState,
  GravityFieldState,
  PlatformState,
  RewardBlockState,
} from '../../../game/simulation/state';
import { createHud } from '../../../ui/hud/hud';
import { runUnlockedAudioAction } from '../../audio/sceneAudio';
import {
  CAPSULE_PRESENTATION,
  EXIT_CAPSULE_ART_BOUNDS,
  EXIT_CAPSULE_TEXTURE_KEYS,
} from '../../view/capsulePresentation';
import { configureCamera } from '../../view/camera/configureCamera';
import { drawRetroBackdrop, RETRO_FONT_FAMILY, type RetroPresentationPalette } from '../../view/retroPresentation';

export type GameSceneHudSetupContext = Phaser.Scene & {
  hud: ReturnType<typeof createHud>;
};

export type GameSceneInputContext = Phaser.Scene & {
  audio: { stopMusic(): void; unlock(): Promise<boolean> };
  bridge: {
    setLeft(value: boolean): void;
    setRight(value: boolean): void;
    setJumpHeld(value: boolean): void;
    pressJump(): void;
    pressDash(): void;
    pressShoot(): void;
    restartStage(): void;
    isRunPaused(): boolean;
    resumeRun(): boolean;
    pauseRun(): boolean;
  };
  startGameplayMusicIfReady(): void;
  setPauseOverlayVisible(visible: boolean): void;
};

export type GameSceneCleanupContext = Phaser.Scene & {
  completeTransitionEvent?: Phaser.Time.TimerEvent;
  audio: { stopMusic(): void };
  hud: ReturnType<typeof createHud>;
  platformSprites: Map<string, Phaser.GameObjects.Rectangle>;
  platformShadowSprites: Map<string, Phaser.GameObjects.Rectangle>;
  platformDetailSprites: Map<string, Phaser.GameObjects.Rectangle>;
  platformCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  terrainVariantSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainVariantShadowSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainVariantAccentSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainVariantDetailSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityZoneSprites: Phaser.GameObjects.Rectangle[];
  gravityFieldSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityFieldCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityCapsuleShellSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityCapsuleEntryDoorSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityCapsuleExitDoorSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityCapsuleButtonSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityCapsuleButtonCoreSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityCapsuleShellMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityCapsuleButtonMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  activationNodeSprites: Map<string, Phaser.GameObjects.Rectangle>;
  activationNodeMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  enemySprites: Map<string, Phaser.GameObjects.Sprite>;
  enemyAccentSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  checkpointSprites: Map<string, Phaser.GameObjects.Sprite>;
  collectibleSprites: Map<string, Phaser.GameObjects.Sprite>;
  projectileSprites: Map<string, Phaser.GameObjects.Sprite>;
  rewardBlockSprites: Map<string, Phaser.GameObjects.Rectangle>;
  rewardBlockLabels: Map<string, Phaser.GameObjects.Text>;
  rewardRevealTexts: Map<string, Phaser.GameObjects.Text>;
  hazardSprites: Map<string, Phaser.GameObjects.Rectangle>;
  enemyDefeatVisibleUntilMs: Map<string, number>;
  playerDefeatVisibleUntilMs: number;
  playerDefeatResetPending: boolean;
  feedbackCounts: Record<string, number>;
  setPauseOverlayVisible(visible: boolean): void;
  setStageStartArrivalVisible(visible: boolean): void;
};

export type GameSceneBaseDisplayContext = Phaser.Scene & {
  retroPalette: RetroPresentationPalette;
  gravityZoneSprites: Phaser.GameObjects.Rectangle[];
  gravityFieldSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityFieldCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityCapsuleShellSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityCapsuleEntryDoorSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityCapsuleExitDoorSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityCapsuleButtonSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityCapsuleButtonCoreSprites: Map<string, Phaser.GameObjects.Rectangle>;
  gravityCapsuleShellMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityCapsuleButtonMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  activationNodeSprites: Map<string, Phaser.GameObjects.Rectangle>;
  activationNodeMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  platformSprites: Map<string, Phaser.GameObjects.Rectangle>;
  platformShadowSprites: Map<string, Phaser.GameObjects.Rectangle>;
  platformDetailSprites: Map<string, Phaser.GameObjects.Rectangle>;
  platformCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  terrainVariantSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainVariantShadowSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainVariantAccentSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainVariantDetailSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  checkpointSprites: Map<string, Phaser.GameObjects.Sprite>;
  collectibleSprites: Map<string, Phaser.GameObjects.Sprite>;
  rewardBlockSprites: Map<string, Phaser.GameObjects.Rectangle>;
  rewardBlockLabels: Map<string, Phaser.GameObjects.Text>;
  enemySprites: Map<string, Phaser.GameObjects.Sprite>;
  enemyAccentSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  playerAnchor: Phaser.GameObjects.Rectangle;
  playerAura: Phaser.GameObjects.Ellipse;
  player: Phaser.GameObjects.Rectangle;
  playerHelmet: Phaser.GameObjects.Rectangle;
  playerVisor: Phaser.GameObjects.Rectangle;
  playerChest: Phaser.GameObjects.Rectangle;
  playerBelt: Phaser.GameObjects.Rectangle;
  playerPack: Phaser.GameObjects.Rectangle;
  playerArmLeft: Phaser.GameObjects.Rectangle;
  playerArmRight: Phaser.GameObjects.Rectangle;
  playerBootLeft: Phaser.GameObjects.Rectangle;
  playerBootRight: Phaser.GameObjects.Rectangle;
  playerKneeLeft: Phaser.GameObjects.Rectangle;
  playerKneeRight: Phaser.GameObjects.Rectangle;
  playerHeadband: Phaser.GameObjects.Rectangle;
  playerAccent: Phaser.GameObjects.Rectangle;
  playerWingLeft: Phaser.GameObjects.Rectangle;
  playerWingRight: Phaser.GameObjects.Rectangle;
  exitShell: Phaser.GameObjects.Image;
  exitDoor: Phaser.GameObjects.Image;
  exitBase: Phaser.GameObjects.Rectangle;
  exitBaseShadow: Phaser.GameObjects.Rectangle;
  exitBeacon: Phaser.GameObjects.Rectangle;
  arrivalBase: Phaser.GameObjects.Rectangle;
  arrivalBaseShadow: Phaser.GameObjects.Rectangle;
  arrivalBeacon: Phaser.GameObjects.Rectangle;
  arrivalShell: Phaser.GameObjects.Image;
  arrivalDoor: Phaser.GameObjects.Image;
  arrivalAura: Phaser.GameObjects.Ellipse;
  arrivalPlayer: Phaser.GameObjects.Sprite;
  pauseOverlay: Phaser.GameObjects.Rectangle;
  pauseText: Phaser.GameObjects.Text;
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
  activationNodeColor(node: { activated: boolean }): number;
  platformColor(platform: PlatformState): number;
  platformDetailColor(platform: PlatformState): number;
  terrainVariantColor(platform: PlatformState): number;
  terrainVariantAlpha(platform: PlatformState): number;
  terrainVariantAccentColor(platform: PlatformState): number;
  rewardBlockColor(rewardBlock: RewardBlockState): number;
  rewardBlockLabel(rewardBlock: RewardBlockState): string;
  createTraversalMarkerRects(count: number, depth: number): Phaser.GameObjects.Rectangle[];
  drawHazard(hazard: SessionSnapshot['stageRuntime']['hazards'][number]): void;
};

export function setupGameSceneHud(scene: GameSceneHudSetupContext): void {
  const mount = scene.game.canvas.parentElement as HTMLElement;
  scene.hud.root.remove();
  scene.hud = createHud(mount);
}

export function setupGameSceneInput(scene: GameSceneInputContext): void {
  const cursors = scene.input.keyboard?.createCursorKeys();
  const left = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  const right = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  const up = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  const shift = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  const space = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  const f = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F);
  const r = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  const esc = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

  const unlockAudio = () => {
    void runUnlockedAudioAction(scene.audio, () => {
      scene.startGameplayMusicIfReady();
    });
  };
  scene.input.keyboard?.once('keydown', unlockAudio);
  scene.input.once('pointerdown', unlockAudio);

  const updateInput = () => {
    const moveLeft = Boolean(cursors?.left.isDown || left?.isDown);
    const moveRight = Boolean(cursors?.right.isDown || right?.isDown);
    const jumpHeld = Boolean(cursors?.up.isDown || up?.isDown || space?.isDown);

    scene.bridge.setLeft(moveLeft);
    scene.bridge.setRight(moveRight);
    scene.bridge.setJumpHeld(jumpHeld);
  };

  scene.events.on(Phaser.Scenes.Events.UPDATE, updateInput);

  for (const key of [cursors?.up, up, space]) {
    key?.on('down', () => scene.bridge.pressJump());
  }
  shift?.on('down', () => scene.bridge.pressDash());
  f?.on('down', () => scene.bridge.pressShoot());

  r?.on('down', () => {
    scene.bridge.restartStage();
    scene.setPauseOverlayVisible(false);
    scene.scene.restart();
  });

  esc?.on('down', () => {
    if (scene.bridge.isRunPaused()) {
      if (!scene.bridge.resumeRun()) {
        return;
      }

      scene.setPauseOverlayVisible(false);
      return;
    }

    if (!scene.bridge.pauseRun()) {
      return;
    }

    scene.setPauseOverlayVisible(true);
  });

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, updateInput);
  });
}

export function cleanupGameScene(scene: GameSceneCleanupContext): void {
  scene.completeTransitionEvent?.remove(false);
  scene.completeTransitionEvent = undefined;
  scene.audio.stopMusic();
  scene.setPauseOverlayVisible(false);
  scene.hud.root.remove();
  scene.platformSprites.clear();
  scene.platformShadowSprites.clear();
  scene.platformDetailSprites.clear();
  scene.platformCategoryMarkerSprites.clear();
  scene.terrainVariantSprites.clear();
  scene.terrainVariantShadowSprites.clear();
  scene.terrainVariantAccentSprites.clear();
  scene.terrainVariantDetailSprites.clear();
  scene.gravityZoneSprites = [];
  scene.gravityFieldSprites.clear();
  scene.gravityFieldCategoryMarkerSprites.clear();
  scene.gravityCapsuleShellSprites.clear();
  scene.gravityCapsuleEntryDoorSprites.clear();
  scene.gravityCapsuleExitDoorSprites.clear();
  scene.gravityCapsuleButtonSprites.clear();
  scene.gravityCapsuleButtonCoreSprites.clear();
  scene.gravityCapsuleShellMarkerSprites.clear();
  scene.gravityCapsuleButtonMarkerSprites.clear();
  scene.activationNodeSprites.clear();
  scene.activationNodeMarkerSprites.clear();
  scene.enemySprites.clear();
  scene.enemyAccentSprites.clear();
  scene.checkpointSprites.clear();
  scene.collectibleSprites.clear();
  scene.projectileSprites.clear();
  scene.rewardBlockSprites.clear();
  scene.rewardBlockLabels.clear();
  scene.rewardRevealTexts.clear();
  scene.hazardSprites.clear();
  scene.enemyDefeatVisibleUntilMs.clear();
  scene.playerDefeatVisibleUntilMs = Number.NEGATIVE_INFINITY;
  scene.playerDefeatResetPending = false;
  scene.feedbackCounts = {};
  scene.setStageStartArrivalVisible(false);
}

export function createBaseDisplayObjects(scene: GameSceneBaseDisplayContext, state: Readonly<SessionSnapshot>): void {
  const { stage } = state;

  scene.cameras.main.fadeIn(150);
  configureCamera(
    scene.cameras.main,
    stage.world.width,
    stage.world.height,
    `#${scene.retroPalette.background.toString(16).padStart(6, '0')}`,
  );

  drawRetroBackdrop(scene, 0, 0, stage.world.width, stage.world.height, scene.retroPalette, 'gameplay');

  createEnvironmentRenderables(scene, state);
  createPlayerRenderables(scene);
  createRewardRenderables(scene, state);
  createEnemyRenderables(scene, state);
  createExitAndArrivalRenderables(scene, stage);
  createPauseOverlay(scene);
}

function createEnvironmentRenderables(scene: GameSceneBaseDisplayContext, state: Readonly<SessionSnapshot>): void {
  for (const zone of state.stageRuntime.lowGravityZones) {
    const overlay = scene.add
      .rectangle(zone.x + zone.width / 2, zone.y + zone.height / 2, zone.width, zone.height, scene.retroPalette.cool, 0.11)
      .setStrokeStyle(2, scene.retroPalette.cool, 0.4)
      .setOrigin(0.5);
    scene.gravityZoneSprites.push(overlay);
  }

  for (const field of state.stageRuntime.gravityFields) {
    const overlay = scene.add
      .rectangle(
        field.x + field.width / 2,
        field.y + field.height / 2,
        field.width,
        field.height,
        scene.gravityFieldColor(field),
        scene.gravityFieldAlpha(field),
      )
      .setStrokeStyle(2, scene.gravityFieldColor(field), 0.42)
      .setOrigin(0.5)
      .setDepth(1);
    scene.gravityFieldSprites.set(field.id, overlay);
    scene.gravityFieldCategoryMarkerSprites.set(field.id, scene.createTraversalMarkerRects(4, 1.2));
  }

  for (const capsule of state.stageRuntime.gravityCapsules) {
    const shell = scene.add
      .rectangle(
        capsule.shell.x + capsule.shell.width / 2,
        capsule.shell.y + capsule.shell.height / 2,
        capsule.shell.width,
        capsule.shell.height,
        scene.gravityCapsuleShellColor(capsule),
        scene.gravityCapsuleShellAlpha(capsule),
      )
      .setOrigin(0.5)
      .setStrokeStyle(2, scene.gravityCapsuleShellStrokeColor(capsule), 0.55)
      .setDepth(1.4);
    const door = scene.add
      .rectangle(
        capsule.entryDoor.x + capsule.entryDoor.width / 2,
        capsule.entryDoor.y + capsule.entryDoor.height / 2,
        capsule.entryDoor.width,
        capsule.entryDoor.height,
        scene.gravityCapsuleEntryDoorColor(capsule),
        scene.gravityCapsuleDoorAlpha(capsule),
      )
      .setOrigin(0.5)
      .setDepth(1.6);
    const exitDoor = scene.add
      .rectangle(
        capsule.exitDoor.x + capsule.exitDoor.width / 2,
        capsule.exitDoor.y + capsule.exitDoor.height / 2,
        capsule.exitDoor.width,
        capsule.exitDoor.height,
        scene.gravityCapsuleExitDoorColor(capsule),
        scene.gravityCapsuleDoorAlpha(capsule),
      )
      .setOrigin(0.5)
      .setDepth(1.65);
    const button = scene.add
      .rectangle(
        capsule.button.x + capsule.button.width / 2,
        capsule.button.y + capsule.button.height / 2,
        capsule.button.width,
        capsule.button.height,
        scene.gravityCapsuleButtonColor(capsule),
        0.92,
      )
      .setOrigin(0.5)
      .setStrokeStyle(2, scene.gravityCapsuleShellStrokeColor(capsule), 0.5)
      .setDepth(3.1);
    const buttonCore = scene.add
      .rectangle(
        capsule.button.x + capsule.button.width / 2,
        capsule.button.y + capsule.button.height / 2,
        Math.max(8, capsule.button.width - 12),
        Math.max(8, capsule.button.height - 12),
        scene.gravityCapsuleButtonCoreColor(capsule),
        0.95,
      )
      .setOrigin(0.5)
      .setDepth(3.2);
    scene.gravityCapsuleShellSprites.set(capsule.id, shell);
    scene.gravityCapsuleEntryDoorSprites.set(capsule.id, door);
    scene.gravityCapsuleExitDoorSprites.set(capsule.id, exitDoor);
    scene.gravityCapsuleButtonSprites.set(capsule.id, button);
    scene.gravityCapsuleButtonCoreSprites.set(capsule.id, buttonCore);
    scene.gravityCapsuleShellMarkerSprites.set(capsule.id, scene.createTraversalMarkerRects(3, 1.55));
    scene.gravityCapsuleButtonMarkerSprites.set(capsule.id, scene.createTraversalMarkerRects(3, 3.25));
  }

  for (const node of state.stageRuntime.activationNodes) {
    const sprite = scene.add
      .rectangle(node.x + node.width / 2, node.y + node.height / 2, node.width, node.height, scene.activationNodeColor(node), 0.9)
      .setStrokeStyle(2, scene.retroPalette.border, 0.48)
      .setOrigin(0.5)
      .setDepth(3);
    scene.activationNodeSprites.set(node.id, sprite);
    scene.activationNodeMarkerSprites.set(node.id, scene.createTraversalMarkerRects(3, 3.1));
  }

  for (const platform of state.stageRuntime.platforms) {
    const topSurfaceHeight = Math.min(platform.height, 8);
    const sprite = scene.add
      .rectangle(platform.x + platform.width / 2, platform.y + platform.height / 2, platform.width, platform.height, scene.platformColor(platform))
      .setOrigin(0.5);
    const shadow = scene.add
      .rectangle(
        platform.x + platform.width / 2,
        platform.y + platform.height / 2 + Math.max(2, Math.floor(platform.height * 0.18)),
        Math.max(6, platform.width - 6),
        Math.max(4, Math.floor(platform.height * 0.38)),
        scene.retroPalette.ink,
        0.3,
      )
      .setOrigin(0.5)
      .setDepth(0.5);
    const detail = scene.add
      .rectangle(
        platform.x + platform.width / 2,
        platform.y + topSurfaceHeight / 2,
        platform.width,
        topSurfaceHeight,
        scene.platformDetailColor(platform),
      )
      .setOrigin(0.5)
      .setDepth(1);
    sprite.setVisible(
      isPlatformVisible(
        platform,
        state.stageRuntime.revealedPlatformIds,
        state.stageRuntime.temporaryBridges.filter((bridge) => bridge.active).map((bridge) => bridge.id),
      ),
    );
    scene.platformSprites.set(platform.id, sprite);
    scene.platformShadowSprites.set(platform.id, shadow);
    scene.platformDetailSprites.set(platform.id, detail);
    scene.platformCategoryMarkerSprites.set(platform.id, scene.createTraversalMarkerRects(3, 1.1));
  }

  for (const terrainVariantPlatform of state.stageRuntime.platforms.filter((platform) => platform.surfaceMechanic)) {
    const sprite = scene.add
      .rectangle(
        terrainVariantPlatform.x + terrainVariantPlatform.width / 2,
        terrainVariantPlatform.y + terrainVariantPlatform.height / 2,
        terrainVariantPlatform.width,
        terrainVariantPlatform.height,
        scene.terrainVariantColor(terrainVariantPlatform),
        scene.terrainVariantAlpha(terrainVariantPlatform),
      )
      .setOrigin(0.5)
      .setDepth(2);
    const shadow = scene.add
      .rectangle(
        terrainVariantPlatform.x + terrainVariantPlatform.width / 2,
        terrainVariantPlatform.y + terrainVariantPlatform.height / 2 + Math.max(2, Math.floor(terrainVariantPlatform.height * 0.16)),
        Math.max(8, terrainVariantPlatform.width - 8),
        Math.max(4, Math.floor(terrainVariantPlatform.height * 0.32)),
        scene.retroPalette.ink,
        0.2,
      )
      .setOrigin(0.5)
      .setDepth(2.5);
    const accent = scene.add
      .rectangle(
        terrainVariantPlatform.x + terrainVariantPlatform.width / 2,
        terrainVariantPlatform.y + Math.max(2, Math.floor(terrainVariantPlatform.height / 2)),
        terrainVariantPlatform.width,
        Math.min(terrainVariantPlatform.height, 4),
        scene.terrainVariantAccentColor(terrainVariantPlatform),
        0.9,
      )
      .setOrigin(0.5)
      .setDepth(3);
    const details = Array.from({ length: 3 }, () =>
      scene.add.rectangle(terrainVariantPlatform.x, terrainVariantPlatform.y, 8, 8, scene.retroPalette.bright, 0.5).setOrigin(0.5).setDepth(3.2),
    );
    sprite.setStrokeStyle(2, scene.retroPalette.border, terrainVariantPlatform.surfaceMechanic?.kind === 'stickySludge' ? 0.24 : 0.38);
    scene.terrainVariantSprites.set(terrainVariantPlatform.id, sprite);
    scene.terrainVariantShadowSprites.set(terrainVariantPlatform.id, shadow);
    scene.terrainVariantAccentSprites.set(terrainVariantPlatform.id, accent);
    scene.terrainVariantDetailSprites.set(terrainVariantPlatform.id, details);
  }

  for (const hazard of state.stageRuntime.hazards) {
    scene.drawHazard(hazard);
  }
}

function createPlayerRenderables(scene: GameSceneBaseDisplayContext): void {
  scene.playerAnchor = scene.add.rectangle(0, 0, 24, 40, scene.retroPalette.ink, 0).setOrigin(0, 0).setVisible(false);
  scene.playerAura = scene.add.ellipse(0, 0, 40, 52, scene.retroPalette.cool, 0.18).setVisible(false).setDepth(5);
  scene.playerPack = scene.add.rectangle(0, 0, 6, 14, scene.retroPalette.ink).setOrigin(0, 0).setDepth(5);
  scene.playerArmLeft = scene.add.rectangle(0, 0, 4, 12, scene.retroPalette.border).setOrigin(0, 0).setDepth(7);
  scene.playerArmRight = scene.add.rectangle(0, 0, 4, 12, scene.retroPalette.border).setOrigin(0, 0).setDepth(7);
  scene.player = scene.add.rectangle(0, 0, 14, 18, scene.retroPalette.warm).setOrigin(0, 0).setDepth(6);
  scene.playerHelmet = scene.add.rectangle(0, 0, 16, 11, scene.retroPalette.border).setOrigin(0, 0).setDepth(7);
  scene.playerVisor = scene.add.rectangle(0, 0, 8, 5, scene.retroPalette.cool).setOrigin(0, 0).setDepth(8);
  scene.playerChest = scene.add.rectangle(0, 0, 8, 6, scene.retroPalette.cool).setOrigin(0, 0).setDepth(7);
  scene.playerBelt = scene.add.rectangle(0, 0, 12, 3, scene.retroPalette.ink).setOrigin(0, 0).setDepth(7);
  scene.playerBootLeft = scene.add.rectangle(0, 0, 6, 6, scene.retroPalette.ink).setOrigin(0, 0).setDepth(7);
  scene.playerBootRight = scene.add.rectangle(0, 0, 6, 6, scene.retroPalette.ink).setOrigin(0, 0).setDepth(7);
  scene.playerKneeLeft = scene.add.rectangle(0, 0, 4, 5, scene.retroPalette.border).setOrigin(0, 0).setDepth(7);
  scene.playerKneeRight = scene.add.rectangle(0, 0, 4, 5, scene.retroPalette.border).setOrigin(0, 0).setDepth(7);
  scene.playerHeadband = scene.add.rectangle(0, 0, 18, 6, scene.retroPalette.border).setVisible(false).setDepth(7);
  scene.playerAccent = scene.add.rectangle(0, 0, 10, 8, scene.retroPalette.border).setVisible(false).setDepth(7);
  scene.playerWingLeft = scene.add.rectangle(0, 0, 6, 14, scene.retroPalette.bright).setVisible(false).setDepth(7);
  scene.playerWingRight = scene.add.rectangle(0, 0, 6, 14, scene.retroPalette.bright).setVisible(false).setDepth(7);
}

function createRewardRenderables(scene: GameSceneBaseDisplayContext, state: Readonly<SessionSnapshot>): void {
  for (const checkpoint of state.stageRuntime.checkpoints) {
    const sprite = scene.add
      .sprite(checkpoint.rect.x, checkpoint.rect.y, 'checkpoint')
      .setOrigin(0, 0)
      .setDisplaySize(checkpoint.rect.width, checkpoint.rect.height);
    scene.checkpointSprites.set(checkpoint.id, sprite);
  }

  for (const collectible of state.stageRuntime.collectibles) {
    const sprite = scene.add.sprite(collectible.position.x, collectible.position.y, 'collectible');
    scene.collectibleSprites.set(collectible.id, sprite);
  }

  for (const rewardBlock of state.stageRuntime.rewardBlocks) {
    const blockSprite = scene.add
      .rectangle(
        rewardBlock.x + rewardBlock.width / 2,
        rewardBlock.y + rewardBlock.height / 2,
        rewardBlock.width,
        rewardBlock.height,
        scene.rewardBlockColor(rewardBlock),
      )
      .setStrokeStyle(2, scene.retroPalette.border, 0.55)
      .setOrigin(0.5);
    const label = scene.add
      .text(rewardBlock.x + rewardBlock.width / 2, rewardBlock.y + rewardBlock.height / 2, scene.rewardBlockLabel(rewardBlock), {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '14px',
        color: scene.retroPalette.shadow,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    scene.rewardBlockSprites.set(rewardBlock.id, blockSprite);
    scene.rewardBlockLabels.set(rewardBlock.id, label);
  }
}

function createEnemyRenderables(scene: GameSceneBaseDisplayContext, state: Readonly<SessionSnapshot>): void {
  for (const enemy of state.stageRuntime.enemies) {
    const sprite = scene.add.sprite(enemy.x, enemy.y, enemy.kind).setOrigin(0, 0);
    scene.enemySprites.set(enemy.id, sprite);
    if (enemy.kind === 'flyer') {
      const accents = [
        scene.add.rectangle(enemy.x + 14, enemy.y + 7, 6, 2, scene.retroPalette.cool, 0).setOrigin(0, 0).setDepth(10),
        scene.add.rectangle(enemy.x + 10, enemy.y + 16, 14, 2, scene.retroPalette.bright, 0).setOrigin(0, 0).setDepth(10),
      ];
      scene.enemyAccentSprites.set(enemy.id, accents);
    }
  }
}

function createExitAndArrivalRenderables(scene: GameSceneBaseDisplayContext, stage: SessionSnapshot['stage']): void {
  scene.exitBaseShadow = scene.add
    .rectangle(stage.exit.x + stage.exit.width / 2, stage.exit.y + stage.exit.height + 10, stage.exit.width + 28, 10, scene.retroPalette.ink, 0.26)
    .setOrigin(0.5)
    .setDepth(1.1);
  scene.exitBase = scene.add
    .rectangle(stage.exit.x + stage.exit.width / 2, stage.exit.y + stage.exit.height + 4, stage.exit.width + 24, 12, scene.retroPalette.panelAlt, 0.94)
    .setStrokeStyle(2, scene.retroPalette.border, 0.5)
    .setOrigin(0.5)
    .setDepth(1.2);
  scene.exitBeacon = scene.add
    .rectangle(stage.exit.x + stage.exit.width / 2, stage.exit.y + 18, 14, 8, scene.retroPalette.bright, 0.82)
    .setOrigin(0.5)
    .setDepth(2.2);
  scene.exitShell = scene.add
    .image(
      stage.exit.x + EXIT_CAPSULE_ART_BOUNDS.shell.x + EXIT_CAPSULE_ART_BOUNDS.shell.width / 2,
      stage.exit.y + EXIT_CAPSULE_ART_BOUNDS.shell.y + EXIT_CAPSULE_ART_BOUNDS.shell.height / 2,
      EXIT_CAPSULE_TEXTURE_KEYS.shell,
    )
    .setDisplaySize(EXIT_CAPSULE_ART_BOUNDS.shell.width, EXIT_CAPSULE_ART_BOUNDS.shell.height)
    .setOrigin(0.5)
    .setTint(scene.retroPalette.warm)
    .setDepth(2);
  scene.exitDoor = scene.add
    .image(
      stage.exit.x + EXIT_CAPSULE_ART_BOUNDS.door.x + EXIT_CAPSULE_ART_BOUNDS.door.width / 2,
      stage.exit.y + EXIT_CAPSULE_ART_BOUNDS.door.y + EXIT_CAPSULE_ART_BOUNDS.door.height / 2,
      EXIT_CAPSULE_TEXTURE_KEYS.door,
    )
    .setDisplaySize(EXIT_CAPSULE_ART_BOUNDS.door.width, EXIT_CAPSULE_ART_BOUNDS.door.height)
    .setOrigin(0.5)
    .setTint(scene.retroPalette.ink)
    .setDepth(2.1);
  scene.arrivalBaseShadow = scene.add
    .rectangle(0, 0, CAPSULE_PRESENTATION.baseShadowWidth, CAPSULE_PRESENTATION.baseShadowHeight, scene.retroPalette.ink, 0.24)
    .setOrigin(0.5)
    .setDepth(8.8)
    .setVisible(false);
  scene.arrivalBase = scene.add
    .rectangle(0, 0, CAPSULE_PRESENTATION.baseWidth, CAPSULE_PRESENTATION.baseHeight, scene.retroPalette.panelAlt, 0.9)
    .setStrokeStyle(2, scene.retroPalette.border, 0.45)
    .setOrigin(0.5)
    .setDepth(8.9)
    .setVisible(false);
  scene.arrivalBeacon = scene.add
    .rectangle(0, 0, CAPSULE_PRESENTATION.beaconWidth, CAPSULE_PRESENTATION.beaconHeight, scene.retroPalette.bright, 0.8)
    .setOrigin(0.5)
    .setDepth(9.2)
    .setVisible(false);
  scene.arrivalShell = scene.add
    .image(0, 0, EXIT_CAPSULE_TEXTURE_KEYS.shell)
    .setDisplaySize(EXIT_CAPSULE_ART_BOUNDS.shell.width, EXIT_CAPSULE_ART_BOUNDS.shell.height)
    .setOrigin(0.5)
    .setDepth(9.4)
    .setVisible(false);
  scene.arrivalDoor = scene.add
    .image(0, 0, EXIT_CAPSULE_TEXTURE_KEYS.door)
    .setDisplaySize(EXIT_CAPSULE_ART_BOUNDS.door.width, EXIT_CAPSULE_ART_BOUNDS.door.height)
    .setOrigin(0.5)
    .setDepth(9.5)
    .setVisible(false);
  scene.arrivalAura = scene.add.ellipse(0, 0, 46, 62, scene.retroPalette.cool, 0.2).setDepth(9.6).setVisible(false);
  scene.arrivalPlayer = scene.add.sprite(0, 0, 'player').setOrigin(0, 0).setDepth(9.7).setTint(scene.retroPalette.cool).setVisible(false);
}

function createPauseOverlay(scene: GameSceneBaseDisplayContext): void {
  scene.pauseOverlay = scene.add
    .rectangle(scene.scale.width / 2, scene.scale.height / 2, scene.scale.width, scene.scale.height, scene.retroPalette.ink, 0.8)
    .setDepth(100)
    .setScrollFactor(0)
    .setVisible(false);
  scene.pauseText = scene.add
    .text(scene.scale.width / 2, scene.scale.height / 2, 'PAUSED', {
      fontFamily: RETRO_FONT_FAMILY,
      fontSize: '40px',
      color: scene.retroPalette.text,
      fontStyle: 'bold',
      letterSpacing: 4,
    })
    .setOrigin(0.5)
    .setDepth(101)
    .setScrollFactor(0)
    .setVisible(false);
}