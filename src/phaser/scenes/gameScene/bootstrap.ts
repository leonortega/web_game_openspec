import * as Phaser from 'phaser';

import type { SessionSnapshot } from '../../../game/simulation/GameSession';
import { isPlatformVisible } from '../../../game/simulation/state';
import type {
  GravityCapsuleState,
  GravityFieldState,
  PlatformState,
  RewardBlockState,
} from '../../../game/simulation/state';
import { runUnlockedAudioAction } from '../../audio/sceneAudio';
import { EXIT_CAPSULE_ART_BOUNDS } from '../../view/capsulePresentation';
import { configureCamera } from '../../view/camera/configureCamera';
import { drawRetroBackdrop, RETRO_FONT_FAMILY, type RetroPresentationPalette } from '../../view/retroPresentation';
import { createWorldLocalRetroRegion } from '../../retroPostFx';
import { createRexHud, type RexHudBindings } from '../../ui/rexHud';
import { getViewportMetrics } from '../../ui/rexUiTheme';
import { drawAstronautGraphic } from '../../view/runtimeCharacterGraphics';
import { drawCollectibleGraphic } from '../../view/runtimeWorldGraphics';

export type GameSceneHudSetupContext = Phaser.Scene & {
  hud: RexHudBindings;
};

export type GameSceneInputContext = Phaser.Scene & {
  audio: { stopMusic(): void; unlock(): Promise<boolean> };
  bridge: {
    setLeft(value: boolean): void;
    setRight(value: boolean): void;
    setJumpHeld(value: boolean): void;
    pressJump(): void;
    pressThruster(): void;
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
  hud: RexHudBindings;
  bottomMistSprites: Phaser.GameObjects.Shape[];
  platformSprites: Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.TileSprite>;
  platformShadowSprites: Map<string, Phaser.GameObjects.Rectangle>;
  platformDetailSprites: Map<string, Phaser.GameObjects.Rectangle>;
  platformCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  terrainVariantSprites: Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.TileSprite>;
  terrainVariantShadowSprites: Map<string, Phaser.GameObjects.Rectangle | { layer: any; index: number }>;
  terrainVariantAccentSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainVariantDetailSprites: Map<string, Array<Phaser.GameObjects.Rectangle | { layer: any; index: number }>>;
  gravityZoneSprites: Phaser.GameObjects.Rectangle[];
  gravityFieldSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityFieldCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityCapsuleShellSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleEntryDoorSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleExitDoorSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleButtonSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleButtonCoreSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleShellMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityCapsuleButtonMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  activationNodeSprites: Map<string, Phaser.GameObjects.Graphics>;
  activationNodeMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  enemySprites: Map<string, Phaser.GameObjects.Graphics>;
  enemyAccentSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  checkpointSprites: Map<string, Phaser.GameObjects.Graphics>;
  collectibleSprites: Map<string, Phaser.GameObjects.Graphics>;
  projectileSprites: Map<string, Phaser.GameObjects.Graphics>;
  rewardBlockSprites: Map<string, Phaser.GameObjects.Graphics>;
  rewardBlockIcons: Map<string, Phaser.GameObjects.Graphics>;
  rewardRevealTexts: Map<string, Phaser.GameObjects.Text>;
  hazardSprites: Map<string, Phaser.GameObjects.Graphics>;
  enemyDefeatVisibleUntilMs: Map<string, number>;
  playerDefeatVisibleUntilMs: number;
  playerDefeatResetPending: boolean;
  feedbackCounts: Record<string, number>;
  setPauseOverlayVisible(visible: boolean): void;
  setStageStartArrivalVisible(visible: boolean): void;
};

export type GameSceneBaseDisplayContext = Phaser.Scene & {
  retroPalette: RetroPresentationPalette;
  bottomMistSprites: Phaser.GameObjects.Shape[];
  gravityZoneSprites: Phaser.GameObjects.Rectangle[];
  gravityFieldSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityFieldCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityCapsuleShellSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleEntryDoorSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleExitDoorSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleButtonSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleButtonCoreSprites: Map<string, Phaser.GameObjects.Graphics>;
  gravityCapsuleShellMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  gravityCapsuleButtonMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  activationNodeSprites: Map<string, Phaser.GameObjects.Graphics>;
  activationNodeMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  platformSprites: Map<string, Phaser.GameObjects.Graphics>;
  platformShadowSprites: Map<string, Phaser.GameObjects.Rectangle | { layer: any; index: number }>;
  platformDetailSprites: Map<string, Phaser.GameObjects.Rectangle | { layer: any; index: number }>;
  platformCategoryMarkerSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  terrainVariantSprites: Map<string, Phaser.GameObjects.Graphics>;
  terrainVariantShadowSprites: Map<string, Phaser.GameObjects.Rectangle | { layer: any; index: number }>;
  terrainVariantAccentSprites: Map<string, Phaser.GameObjects.Rectangle>;
  terrainVariantDetailSprites: Map<string, Array<Phaser.GameObjects.Rectangle | { layer: any; index: number }>>;
  checkpointSprites: Map<string, Phaser.GameObjects.Graphics>;
  collectibleSprites: Map<string, Phaser.GameObjects.Graphics>;
  rewardBlockSprites: Map<string, Phaser.GameObjects.Graphics>;
  rewardBlockIcons: Map<string, Phaser.GameObjects.Graphics>;
  enemySprites: Map<string, Phaser.GameObjects.Graphics>;
  enemyAccentSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  playerAnchor: Phaser.GameObjects.Rectangle;
  playerSprite: Phaser.GameObjects.Graphics;
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
  exitShell: Phaser.GameObjects.Graphics;
  exitDoor: Phaser.GameObjects.Graphics;
  exitBase: Phaser.GameObjects.Image;
  exitBaseShadow: Phaser.GameObjects.Rectangle;
  exitBeacon: Phaser.GameObjects.Image;
  arrivalBaseShadow: Phaser.GameObjects.Rectangle;
  arrivalShell: Phaser.GameObjects.Graphics;
  arrivalDoor: Phaser.GameObjects.Graphics;
  arrivalAura: Phaser.GameObjects.Ellipse;
  arrivalPlayer: Phaser.GameObjects.Graphics;
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
  createTraversalMarkerRects(count: number, depth: number): Phaser.GameObjects.Rectangle[];
  drawHazard(hazard: SessionSnapshot['stageRuntime']['hazards'][number]): void;
};

export function setupGameSceneHud(scene: GameSceneHudSetupContext): void {
  scene.hud.root.destroy(true);
  scene.hud = createRexHud(scene);
}

export function setupGameSceneInput(scene: GameSceneInputContext): void {
  const cursors = scene.input.keyboard?.createCursorKeys();
  const left = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  const right = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  const up = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  const down = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
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
  for (const key of [cursors?.down, down]) {
    key?.on('down', () => scene.bridge.pressThruster());
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
  scene.hud.root.destroy(true);
  // Destroy any GPU layers created at runtime.
  try {
    (scene as any).tileGPULayer?.destroy?.();
  } catch (e) {
    // ignore
  }
  try {
    (scene as any).tileGPUMap?.destroy?.();
  } catch (e) {
    // ignore
  }
  try {
    (scene as any).collectibleGPULayer?.destroy?.();
  } catch (e) {
    // ignore
  }
  try {
    (scene as any).platformShadowGPULayer?.destroy?.();
  } catch (e) {
    // ignore
  }
  try {
    (scene as any).platformDetailGPULayer?.destroy?.();
  } catch (e) {
    // ignore
  }
  try {
    (scene as any).terrainVariantShadowGPULayer?.destroy?.();
  } catch (e) {
    // ignore
  }
  try {
    (scene as any).terrainVariantDetailGPULayer?.destroy?.();
  } catch (e) {
    // ignore
  }

  scene.platformSprites.clear();
  scene.bottomMistSprites = [];
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
  scene.rewardBlockIcons.clear();
  scene.rewardRevealTexts.clear();
  scene.hazardSprites.clear();
  scene.enemyDefeatVisibleUntilMs.clear();
  scene.playerDefeatVisibleUntilMs = Number.NEGATIVE_INFINITY;
  scene.playerDefeatResetPending = false;
  scene.feedbackCounts = {};
  scene.setStageStartArrivalVisible(false);
}

type BottomAmbientBand = {
  topY: number;
  height: number;
};

const BOTTOM_MIST_CLEARANCE = 18;
const BOTTOM_MIST_MIN_HEIGHT = 46;
const BOTTOM_MIST_MAX_HEIGHT = 120;

export function resolveBottomAmbientBand(state: Readonly<SessionSnapshot>): BottomAmbientBand | null {
  const worldBottom = state.stage.world.height;
  const ambientFloorY = Math.max(
    state.player.y + state.player.height,
    state.stage.exit.y,
    ...state.stageRuntime.platforms.map((platform) => platform.y),
    ...state.stageRuntime.hazards.map((hazard) => hazard.rect.y),
    ...state.stageRuntime.checkpoints.map((checkpoint) => checkpoint.rect.y),
    ...state.stageRuntime.rewardBlocks.map((rewardBlock) => rewardBlock.y),
    ...state.stageRuntime.activationNodes.map((node) => node.y),
    ...state.stageRuntime.gravityCapsules.flatMap((capsule) => [
      capsule.shell.y,
      capsule.entryDoor.y,
      capsule.exitDoor.y,
      capsule.button.y,
      capsule.entryRoute.y,
      capsule.buttonRoute.y,
      capsule.exitRoute.y,
    ]),
    ...state.stageRuntime.collectibles.map((collectible) => collectible.position.y),
    ...state.stageRuntime.enemies.map((enemy) => enemy.y),
  );
  const topY = Math.ceil(ambientFloorY + BOTTOM_MIST_CLEARANCE);
  const availableHeight = Math.floor(worldBottom - topY);
  if (availableHeight < BOTTOM_MIST_MIN_HEIGHT) {
    return null;
  }
  return {
    topY,
    height: Math.min(BOTTOM_MIST_MAX_HEIGHT, availableHeight),
  };
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
  scene.bottomMistSprites = [];

  const bottomAmbientBand = resolveBottomAmbientBand(state);
  if (bottomAmbientBand) {
    const centerX = stage.world.width / 2;
    const bandBottomY = bottomAmbientBand.topY + bottomAmbientBand.height;
    const hazeBase = scene.add
      .rectangle(
        centerX,
        bottomAmbientBand.topY + bottomAmbientBand.height / 2,
        stage.world.width + 96,
        bottomAmbientBand.height,
        scene.retroPalette.border,
        0.2,
      )
      .setOrigin(0.5)
      .setDepth(0.35);
    const hazeGlow = scene.add
      .ellipse(
        centerX,
        bandBottomY - Math.max(12, Math.floor(bottomAmbientBand.height * 0.28)),
        Math.max(260, Math.floor(stage.world.width * 0.92)),
        Math.max(44, Math.floor(bottomAmbientBand.height * 0.8)),
        scene.retroPalette.border,
        0.14,
      )
      .setOrigin(0.5)
      .setDepth(0.36);
    scene.tweens.add({
      targets: hazeGlow,
      x: centerX + 28,
      alpha: 0.19,
      duration: 6200,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
    const plumeCount = Math.max(4, Math.min(9, Math.floor(stage.world.width / 180)));
    const plumeStep = stage.world.width / plumeCount;
    const plumes = Array.from({ length: plumeCount }, (_, index) => {
      const x = plumeStep * index + plumeStep / 2 + ((index % 2 === 0 ? -1 : 1) * plumeStep * 0.12);
      const width = plumeStep * 1.35;
      const height = Math.max(34, bottomAmbientBand.height * (0.56 + (index % 3) * 0.08));
      return scene.add
        .ellipse(
          x,
          bandBottomY - height * 0.42,
          width,
          height,
          scene.retroPalette.border,
          index % 2 === 0 ? 0.14 : 0.11,
        )
        .setOrigin(0.5)
        .setDepth(0.37 + index * 0.001);
    });
    plumes.forEach((plume, index) => {
      const baseX = plume.x;
      const baseY = plume.y;
      const driftX = 16 + (index % 3) * 7;
      const liftY = 5 + (index % 2) * 4;
      const targetAlpha = 0.18 - (index % 3) * 0.015;
      scene.tweens.add({
        targets: plume,
        x: baseX + (index % 2 === 0 ? driftX : -driftX),
        y: baseY - liftY,
        alpha: targetAlpha,
        duration: 4200 + index * 520,
        ease: 'Sine.InOut',
        yoyo: true,
        repeat: -1,
      });
    });
    scene.bottomMistSprites.push(hazeBase, hazeGlow, ...plumes);
  }

  // Create GPULayers for platform shadows and platform details when available.
  try {
    if ((scene as any).add && typeof (scene as any).add.spriteGPULayer === 'function') {
      const platformCount = (state.stageRuntime.platforms && state.stageRuntime.platforms.length) || 0;
      const size = Math.max(16, platformCount * 2);
      try {
        const shadowLayer = (scene as any).add.spriteGPULayer('gpuPixel', size) as any;
        shadowLayer.setDepth(0.5);
        (scene as any).platformShadowGPULayer = shadowLayer;
      } catch (e) {
        // ignore per-layer
      }
      try {
        const detailLayer = (scene as any).add.spriteGPULayer('gpuPixel', size) as any;
        detailLayer.setDepth(1);
        (scene as any).platformDetailGPULayer = detailLayer;
      } catch (e) {
        // ignore per-layer
      }
      // Terrain variant GPULayers (shadows + details)
      try {
        const terrainCount = state.stageRuntime.platforms.filter((p) => p.kind === 'magnet' || p.kind === 'crystal').length;
        const terrainSize = Math.max(16, terrainCount * 3);
        try {
          const terrainShadowLayer = (scene as any).add.spriteGPULayer('gpuPixel', terrainSize) as any;
          terrainShadowLayer.setDepth(2.5);
          (scene as any).terrainVariantShadowGPULayer = terrainShadowLayer;
        } catch (e) {
          // ignore per-layer
        }
        try {
          const terrainDetailLayer = (scene as any).add.spriteGPULayer('gpuPixel', terrainSize) as any;
          terrainDetailLayer.setDepth(3.2);
          (scene as any).terrainVariantDetailGPULayer = terrainDetailLayer;
        } catch (e) {
          // ignore per-layer
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore
  }

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
    const overlay = scene.add.graphics().setDepth(1);
    scene.gravityFieldSprites.set(field.id, overlay);
    scene.gravityFieldCategoryMarkerSprites.set(field.id, scene.createTraversalMarkerRects(4, 1.2));
  }

  for (const capsule of state.stageRuntime.gravityCapsules) {
    const shell = scene.add.graphics().setDepth(1.4);
    const door = scene.add.graphics().setDepth(1.6);
    const exitDoor = scene.add.graphics().setDepth(1.65);
    const button = scene.add.graphics().setDepth(3.1);
    const buttonCore = scene.add.graphics().setDepth(3.2);
    scene.gravityCapsuleShellSprites.set(capsule.id, shell);
    scene.gravityCapsuleEntryDoorSprites.set(capsule.id, door);
    scene.gravityCapsuleExitDoorSprites.set(capsule.id, exitDoor);
    scene.gravityCapsuleButtonSprites.set(capsule.id, button);
    scene.gravityCapsuleButtonCoreSprites.set(capsule.id, buttonCore);
    scene.gravityCapsuleShellMarkerSprites.set(capsule.id, scene.createTraversalMarkerRects(3, 1.55));
    scene.gravityCapsuleButtonMarkerSprites.set(capsule.id, scene.createTraversalMarkerRects(3, 3.25));
  }

  for (const node of state.stageRuntime.activationNodes) {
    const sprite = scene.add.graphics().setDepth(3);
    scene.activationNodeSprites.set(node.id, sprite);
    scene.activationNodeMarkerSprites.set(node.id, scene.createTraversalMarkerRects(3, 3.1));
  }

  for (const platform of state.stageRuntime.platforms) {
    const topSurfaceHeight = Math.min(platform.height, 8);
    const sprite = scene.add.graphics().setDepth(1);
    // Shadow and detail may be GPULayer members when supported; otherwise fallback to rectangles.
    const shadowLayer = (scene as any).platformShadowGPULayer as any | undefined;
    const detailLayer = (scene as any).platformDetailGPULayer as any | undefined;

    // Shadow: add to GPULayer or create rectangle
    let shadowRec: Phaser.GameObjects.Rectangle | { layer: any; index: number };
    if (shadowLayer) {
      const offsetY = Math.max(2, Math.floor(platform.height * 0.18));
      const width = Math.max(6, platform.width - 6);
      const height = Math.max(4, Math.floor(platform.height * 0.38));
      const idx = shadowLayer.memberCount;
      shadowLayer.addMember({
        x: platform.x + platform.width / 2,
        y: platform.y + platform.height / 2 + offsetY,
        scaleX: width / 2,
        scaleY: height / 2,
        alpha: 0.28,
        tintTopLeft: scene.retroPalette.ink,
        tintTopRight: scene.retroPalette.ink,
        tintBottomLeft: scene.retroPalette.ink,
        tintBottomRight: scene.retroPalette.ink,
      });
      shadowRec = { layer: shadowLayer, index: idx };
    } else {
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
      shadowRec = shadow;
    }

    // Detail: add to GPULayer or create rectangle
    let detailRec: Phaser.GameObjects.Rectangle | { layer: any; index: number };
    if (detailLayer) {
      const idx = detailLayer.memberCount;
      detailLayer.addMember({
        x: platform.x + platform.width / 2,
        y: platform.y + topSurfaceHeight / 2,
        scaleX: platform.width / 2,
        scaleY: topSurfaceHeight / 2,
        alpha: 1,
        tintTopLeft: scene.platformDetailColor(platform),
        tintTopRight: scene.platformDetailColor(platform),
        tintBottomLeft: scene.platformDetailColor(platform),
        tintBottomRight: scene.platformDetailColor(platform),
      });
      detailRec = { layer: detailLayer, index: idx };
    } else {
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
      detailRec = detail;
    }

    sprite.setVisible(
      isPlatformVisible(
        platform,
        state.stageRuntime.revealedPlatformIds,
        state.stageRuntime.temporaryBridges.filter((bridge) => bridge.active).map((bridge) => bridge.id),
      ),
    );
    scene.platformSprites.set(platform.id, sprite);
    scene.platformShadowSprites.set(platform.id, shadowRec as any);
    scene.platformDetailSprites.set(platform.id, detailRec as any);
    scene.platformCategoryMarkerSprites.set(platform.id, scene.createTraversalMarkerRects(3, 1.1));
  }

  for (const terrainVariantPlatform of state.stageRuntime.platforms.filter((platform) => platform.kind === 'magnet' || platform.kind === 'crystal')) {
    const sprite = scene.add.graphics().setDepth(2).setVisible(false);
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
      .setDepth(2.5)
      .setVisible(false);
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
      .setDepth(3)
      .setVisible(false);
    const details = Array.from({ length: 3 }, () =>
      createWorldLocalRetroRegion(scene, {
        kind: 'distortion',
        x: terrainVariantPlatform.x,
        y: terrainVariantPlatform.y,
        width: 8,
        height: 8,
        color: scene.retroPalette.bright,
        alpha: 0.5,
        depth: 3.2,
      }).setOrigin(0.5).setVisible(false),
    );
    const terrainSpriteAny = sprite as any;
    terrainSpriteAny.setStrokeStyle?.(
      2,
      scene.retroPalette.border,
      terrainVariantPlatform.kind === 'magnet' ? 0.24 : 0.38,
    );
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
  scene.playerSprite = scene.add.graphics().setDepth(6).setVisible(false);
  drawAstronautGraphic(scene.playerSprite, {
    variantKey: 'base',
    width: 24,
    height: 40,
    facing: 1,
    variant: { bodyColor: 0xeff5ff, detailColor: 0x4060cf, accentColor: 0x8fe8ff, auraColor: null },
    pose: 'idle',
    alpha: 1,
    hitFlashBlend: 0,
    defeat: false,
    brightColor: scene.retroPalette.bright,
    alertColor: scene.retroPalette.alert,
  });
  scene.playerAura = scene.add.ellipse(0, 0, 46, 60, scene.retroPalette.cool, 0.18).setVisible(false).setDepth(5);
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
    const sprite = scene.add.graphics().setDepth(4.2);
    scene.checkpointSprites.set(checkpoint.id, sprite);
  }

  for (const collectible of state.stageRuntime.collectibles) {
    const sprite = scene.add.graphics().setDepth(4.05);
    drawCollectibleGraphic(sprite, {
      color: scene.retroPalette.warm,
      brightColor: scene.retroPalette.bright,
      borderColor: scene.retroPalette.border,
      alpha: collectible.collected ? 0 : 1,
      scale: 1,
    });
    scene.collectibleSprites.set(collectible.id, sprite);
  }

  for (const rewardBlock of state.stageRuntime.rewardBlocks) {
    const blockSprite = scene.add.graphics();
    const icon = scene.add.graphics().setDepth(4.15);
    scene.rewardBlockSprites.set(rewardBlock.id, blockSprite);
    scene.rewardBlockIcons.set(rewardBlock.id, icon);
  }
}

function createEnemyRenderables(scene: GameSceneBaseDisplayContext, state: Readonly<SessionSnapshot>): void {
  for (const enemy of state.stageRuntime.enemies) {
    const sprite = scene.add.graphics().setDepth(0);
    scene.enemySprites.set(enemy.id, sprite);
    scene.enemyAccentSprites.set(enemy.id, []);
  }
}

function createExitAndArrivalRenderables(scene: GameSceneBaseDisplayContext, stage: SessionSnapshot['stage']): void {
  scene.exitBaseShadow = scene.add
    .rectangle(stage.exit.x + stage.exit.width / 2, stage.exit.y + stage.exit.height + 10, stage.exit.width + 28, 10, scene.retroPalette.ink, 0.26)
    .setOrigin(0.5)
    .setDepth(1.1);
  scene.exitBase = scene.add
    .image(stage.exit.x + stage.exit.width / 2, stage.exit.y + stage.exit.height + 4, 'exit-base')
    .setDisplaySize(stage.exit.width + 24, 12)
    .setTint(scene.retroPalette.panelAlt)
    .setAlpha(0.94)
    .setOrigin(0.5)
    .setDepth(1.2);
  scene.exitBeacon = scene.add
    .image(stage.exit.x + stage.exit.width / 2, stage.exit.y + 18, 'exit-beacon')
    .setDisplaySize(14, 8)
    .setTint(scene.retroPalette.bright)
    .setAlpha(0.82)
    .setOrigin(0.5)
    .setDepth(2.2);
  scene.exitShell = scene.add
    .graphics()
    .setPosition(
      stage.exit.x + EXIT_CAPSULE_ART_BOUNDS.shell.x + EXIT_CAPSULE_ART_BOUNDS.shell.width / 2,
      stage.exit.y + EXIT_CAPSULE_ART_BOUNDS.shell.y + EXIT_CAPSULE_ART_BOUNDS.shell.height / 2,
    )
    .setDepth(1.25);
  scene.exitShell.setData('debugWidth', EXIT_CAPSULE_ART_BOUNDS.shell.width);
  scene.exitShell.setData('debugTextureKey', 'shared-teleport-machine');
  scene.exitDoor = scene.add
    .graphics()
    .setPosition(
      stage.exit.x + EXIT_CAPSULE_ART_BOUNDS.door.x + EXIT_CAPSULE_ART_BOUNDS.door.width / 2,
      stage.exit.y + EXIT_CAPSULE_ART_BOUNDS.door.y + EXIT_CAPSULE_ART_BOUNDS.door.height / 2,
    )
    .setDepth(1.3);
  scene.exitDoor.setData('debugWidth', EXIT_CAPSULE_ART_BOUNDS.door.width);
  scene.exitDoor.setData('debugTextureKey', 'shared-teleport-shutter');
    
  scene.arrivalBaseShadow = scene.add
    .rectangle(0, 0, 12, 6, scene.retroPalette.ink, 0.22)
    .setOrigin(0.5)
    .setDepth(9.1)
    .setVisible(false);
  scene.arrivalShell = scene.add.graphics().setDepth(9.4).setVisible(false);
  scene.arrivalDoor = scene.add.graphics().setDepth(9.5).setVisible(false);
  scene.arrivalShell.setData('debugWidth', EXIT_CAPSULE_ART_BOUNDS.shell.width);
  scene.arrivalShell.setData('debugTextureKey', 'arrival-teleport-machine');
  scene.arrivalDoor.setData('debugWidth', EXIT_CAPSULE_ART_BOUNDS.door.width);
  scene.arrivalDoor.setData('debugTextureKey', 'arrival-teleport-shutter');
  scene.arrivalAura = scene.add.ellipse(0, 0, 46, 62, scene.retroPalette.cool, 0.2).setDepth(9.6).setVisible(false);
  scene.arrivalPlayer = scene.add.graphics().setDepth(9.7).setVisible(false);
}

function createPauseOverlay(scene: GameSceneBaseDisplayContext): void {
  const { centerX, centerY, width, height } = getViewportMetrics(scene);
  scene.pauseOverlay = scene.add
    .rectangle(centerX, centerY, width, height, scene.retroPalette.ink, 0.8)
    .setDepth(100)
    .setScrollFactor(0)
    .setVisible(false);
  scene.pauseText = scene.add
    .text(centerX, centerY, 'PAUSED', {
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
