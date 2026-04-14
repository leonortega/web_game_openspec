import * as Phaser from 'phaser';
import {
  getCollectibleRewardBlockLabel,
  getCollectibleRewardRevealLabel,
  PLAYER_POWER_VARIANTS,
  TURRET_VARIANT_CONFIG,
  getPowerRevealLabel,
  getPowerShortLabel,
  isBrittleSurfaceBroken,
  isBrittleSurfaceWarning,
  isPlatformActive,
  isPlatformVisible,
  type CheckpointState,
  type CollectibleState,
  type EnemyState,
  type GravityFieldState,
  type LauncherState,
  type PlatformState,
  type ProjectileState,
  type RewardBlockState,
  type RewardRevealState,
  type TerrainSurfaceState,
} from '../../game/simulation/state';
import { createHud } from '../../ui/hud/hud';
import { SceneBridge } from '../adapters/sceneBridge';
import { SynthAudio } from '../audio/SynthAudio';
import { configureCamera } from '../view/camera/configureCamera';
import {
  RETRO_FONT_FAMILY,
  createRetroPresentationPalette,
  drawRetroBackdrop,
  getRetroMotionStep,
  snapRetroValue,
  type RetroPresentationPalette,
} from '../view/retroPresentation';

export class GameScene extends Phaser.Scene {
  private bridge!: SceneBridge;

  private audio!: SynthAudio;

  private playerAura!: Phaser.GameObjects.Ellipse;

  private player!: Phaser.GameObjects.Rectangle;

  private playerHeadband!: Phaser.GameObjects.Rectangle;

  private playerAccent!: Phaser.GameObjects.Rectangle;

  private playerWingLeft!: Phaser.GameObjects.Rectangle;

  private playerWingRight!: Phaser.GameObjects.Rectangle;

  private retroPalette!: RetroPresentationPalette;

  private platformSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private terrainSurfaceSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private launcherSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private hazardSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private gravityZoneSprites: Phaser.GameObjects.Rectangle[] = [];

  private gravityFieldSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private activationNodeSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private enemySprites = new Map<string, Phaser.GameObjects.Sprite>();

  private checkpointSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private collectibleSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private rewardBlockSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private rewardBlockLabels = new Map<string, Phaser.GameObjects.Text>();

  private rewardRevealTexts = new Map<string, Phaser.GameObjects.Text>();

  private projectileSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private exitSprite!: Phaser.GameObjects.Sprite;

  private pauseOverlay!: Phaser.GameObjects.Rectangle;

  private pauseText!: Phaser.GameObjects.Text;

  private hud = createHud(document.createElement('div'));

  private completeTransitionEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super('game');
  }

  create(): void {
    this.bridge = this.registry.get('bridge') as SceneBridge;
    this.audio = new SynthAudio(this, () => this.bridge.getSession().getState().progress.runSettings.masterVolume);
    this.completeTransitionEvent = undefined;
    const mount = this.game.canvas.parentElement as HTMLElement;
    this.hud.root.remove();
    this.hud = createHud(mount);

    const state = this.bridge.getSession().getState();
    const { stage } = state;
    this.retroPalette = createRetroPresentationPalette(stage.palette);

    this.cameras.main.fadeIn(150);
    configureCamera(this.cameras.main, stage.world.width, stage.world.height);

    drawRetroBackdrop(this, 0, 0, stage.world.width, stage.world.height, this.retroPalette, 'gameplay');

    for (const zone of state.stageRuntime.lowGravityZones) {
      const overlay = this.add
        .rectangle(
          zone.x + zone.width / 2,
          zone.y + zone.height / 2,
          zone.width,
          zone.height,
          this.retroPalette.cool,
          0.11,
        )
        .setStrokeStyle(2, this.retroPalette.cool, 0.4)
        .setOrigin(0.5);
      this.gravityZoneSprites.push(overlay);
    }

    for (const field of state.stageRuntime.gravityFields) {
      const overlay = this.add
        .rectangle(
          field.x + field.width / 2,
          field.y + field.height / 2,
          field.width,
          field.height,
          this.gravityFieldColor(field),
          this.gravityFieldAlpha(field),
        )
        .setStrokeStyle(2, this.gravityFieldColor(field), 0.42)
        .setOrigin(0.5)
        .setDepth(1);
      this.gravityFieldSprites.set(field.id, overlay);
    }

    for (const node of state.stageRuntime.activationNodes) {
      const sprite = this.add
        .rectangle(
          node.x + node.width / 2,
          node.y + node.height / 2,
          node.width,
          node.height,
          this.activationNodeColor(node),
          0.9,
        )
        .setStrokeStyle(2, this.retroPalette.border, 0.48)
        .setOrigin(0.5)
        .setDepth(3);
      this.activationNodeSprites.set(node.id, sprite);
    }

    for (const platform of state.stageRuntime.platforms) {
      const sprite = this.add
        .rectangle(
          platform.x + platform.width / 2,
          platform.y + platform.height / 2,
          platform.width,
          platform.height,
          this.platformColor(platform),
        )
        .setOrigin(0.5);
      sprite.setVisible(
        isPlatformVisible(
          platform,
          state.stageRuntime.revealedPlatformIds,
          state.stageRuntime.temporaryBridges.filter((bridge) => bridge.active).map((bridge) => bridge.id),
        ),
      );
      this.platformSprites.set(platform.id, sprite);
    }

    for (const terrainSurface of state.stageRuntime.terrainSurfaces) {
      const sprite = this.add
        .rectangle(
          terrainSurface.x + terrainSurface.width / 2,
          terrainSurface.y + terrainSurface.height / 2,
          terrainSurface.width,
          terrainSurface.height,
          this.terrainSurfaceColor(terrainSurface),
          this.terrainSurfaceAlpha(terrainSurface),
        )
        .setOrigin(0.5)
        .setDepth(2);
      sprite.setStrokeStyle(2, this.retroPalette.border, terrainSurface.kind === 'stickySludge' ? 0.24 : 0.38);
      this.terrainSurfaceSprites.set(terrainSurface.id, sprite);
    }

    for (const launcherEntry of state.stageRuntime.launchers) {
      const sprite = this.add
        .rectangle(
          launcherEntry.x + launcherEntry.width / 2,
          launcherEntry.y + launcherEntry.height / 2,
          launcherEntry.width,
          launcherEntry.height,
          this.launcherColor(launcherEntry),
          0.86,
        )
        .setOrigin(0.5)
        .setDepth(3);
      sprite.setStrokeStyle(2, this.retroPalette.border, 0.5);
      this.launcherSprites.set(launcherEntry.id, sprite);
    }

    for (const hazard of state.stageRuntime.hazards) {
      this.drawHazard(hazard);
    }

    this.playerAura = this.add.ellipse(0, 0, 40, 52, this.retroPalette.cool, 0.18).setVisible(false).setDepth(5);
    this.player = this.add.rectangle(0, 0, 24, 40, this.retroPalette.warm).setOrigin(0, 0).setDepth(6);
    this.playerHeadband = this.add.rectangle(0, 0, 18, 6, this.retroPalette.border).setVisible(false).setDepth(7);
    this.playerAccent = this.add.rectangle(0, 0, 10, 8, this.retroPalette.border).setVisible(false).setDepth(7);
    this.playerWingLeft = this.add.rectangle(0, 0, 8, 16, this.retroPalette.bright).setVisible(false).setDepth(7);
    this.playerWingRight = this.add.rectangle(0, 0, 8, 16, this.retroPalette.bright).setVisible(false).setDepth(7);

    for (const checkpoint of state.stageRuntime.checkpoints) {
      const sprite = this.add.sprite(checkpoint.rect.x, checkpoint.rect.y, 'checkpoint').setOrigin(0, 0);
      this.checkpointSprites.set(checkpoint.id, sprite);
    }

    for (const collectible of state.stageRuntime.collectibles) {
      const sprite = this.add.sprite(collectible.position.x, collectible.position.y, 'collectible');
      this.collectibleSprites.set(collectible.id, sprite);
    }

    for (const rewardBlock of state.stageRuntime.rewardBlocks) {
      const blockSprite = this.add
        .rectangle(
          rewardBlock.x + rewardBlock.width / 2,
          rewardBlock.y + rewardBlock.height / 2,
          rewardBlock.width,
          rewardBlock.height,
          this.rewardBlockColor(rewardBlock),
        )
        .setStrokeStyle(2, this.retroPalette.border, 0.55)
        .setOrigin(0.5);
      const label = this.add
        .text(rewardBlock.x + rewardBlock.width / 2, rewardBlock.y + rewardBlock.height / 2, this.rewardBlockLabel(rewardBlock), {
          fontFamily: RETRO_FONT_FAMILY,
          fontSize: '14px',
          color: this.retroPalette.shadow,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.rewardBlockSprites.set(rewardBlock.id, blockSprite);
      this.rewardBlockLabels.set(rewardBlock.id, label);
    }

    for (const enemy of state.stageRuntime.enemies) {
      const sprite = this.add.sprite(enemy.x, enemy.y, enemy.kind).setOrigin(0, 0);
      this.enemySprites.set(enemy.id, sprite);
    }

    this.exitSprite = this.add.sprite(stage.exit.x, stage.exit.y, 'exit').setOrigin(0, 0).setTint(this.retroPalette.warm);

    this.pauseOverlay = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, this.retroPalette.ink, 0.8)
      .setDepth(100)
      .setScrollFactor(0)
      .setVisible(false);
    this.pauseText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'PAUSED', {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '40px',
        color: this.retroPalette.text,
        fontStyle: 'bold',
        letterSpacing: 4,
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setScrollFactor(0)
      .setVisible(false);

    this.setupInput();
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.syncView();
    this.bridge.syncHud(this.hud);
    this.audio.startStageMusic(stage.id);

    const syncPauseOverlayLayout = ({ width, height }: { width: number; height: number }): void => {
      this.pauseOverlay.setPosition(width / 2, height / 2).setSize(width, height);
      this.pauseText.setPosition(width / 2, height / 2);
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, syncPauseOverlayLayout);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, syncPauseOverlayLayout);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.handleShutdown();
    });
  }

  update(_: number, delta: number): void {
    const view = this.cameras.main.worldView;
    this.bridge.setCameraViewBox({ x: view.x, y: view.y, width: view.width, height: view.height });
    this.bridge.consumeFrame(delta);
    const cues = this.bridge.drainCues();
    for (const cue of cues) {
      this.audio.playCue(cue);
    }

    const state = this.bridge.getSession().getState();
    this.syncView();
    this.bridge.syncHud(this.hud);

    if (state.levelJustCompleted && !this.completeTransitionEvent) {
      this.completeTransitionEvent = this.time.delayedCall(350, () => {
        this.completeTransitionEvent = undefined;
        this.scene.start('complete');
      });
    }
  }

  private handleShutdown(): void {
    this.completeTransitionEvent?.remove(false);
    this.completeTransitionEvent = undefined;
    this.audio.stopMusic();
    this.setPauseOverlayVisible(false);
    this.hud.root.remove();
    this.platformSprites.clear();
    this.terrainSurfaceSprites.clear();
    this.launcherSprites.clear();
    this.gravityZoneSprites = [];
    this.gravityFieldSprites.clear();
    this.activationNodeSprites.clear();
    this.enemySprites.clear();
    this.checkpointSprites.clear();
    this.collectibleSprites.clear();
    this.projectileSprites.clear();
    this.rewardBlockSprites.clear();
    this.rewardBlockLabels.clear();
    this.rewardRevealTexts.clear();
    this.hazardSprites.clear();
  }

  private setupInput(): void {
    const cursors = this.input.keyboard?.createCursorKeys();
    const left = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    const right = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    const up = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    const shift = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    const space = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const f = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    const r = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const esc = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    const unlockAudio = () => this.audio.unlock();
    this.input.keyboard?.once('keydown', unlockAudio);
    this.input.once('pointerdown', unlockAudio);

    const updateInput = () => {
      const moveLeft = Boolean(cursors?.left.isDown || left?.isDown);
      const moveRight = Boolean(cursors?.right.isDown || right?.isDown);
      const jumpHeld = Boolean(cursors?.up.isDown || up?.isDown || space?.isDown);

      this.bridge.setLeft(moveLeft);
      this.bridge.setRight(moveRight);
      this.bridge.setJumpHeld(jumpHeld);
    };

    this.events.on(Phaser.Scenes.Events.UPDATE, updateInput);

    for (const key of [cursors?.up, up, space]) {
      key?.on('down', () => this.bridge.pressJump());
    }
    shift?.on('down', () => this.bridge.pressDash());
    f?.on('down', () => this.bridge.pressShoot());

    r?.on('down', () => {
      this.bridge.restartStage();
      this.setPauseOverlayVisible(false);
      this.scene.restart();
    });

    esc?.on('down', () => {
      if (this.bridge.isRunPaused()) {
        if (!this.bridge.resumeRun()) {
          return;
        }

        this.setPauseOverlayVisible(false);
        return;
      }

      if (!this.bridge.pauseRun()) {
        return;
      }

      this.setPauseOverlayVisible(true);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.UPDATE, updateInput);
    });
  }

  private drawHazard(hazard: { id?: string; kind: string; rect: { x: number; y: number; width: number; height: number } }): void {
    const base = this.add
      .rectangle(
        hazard.rect.x + hazard.rect.width / 2,
        hazard.rect.y + hazard.rect.height / 2,
        hazard.rect.width,
        hazard.rect.height,
        this.retroPalette.alert,
      )
      .setOrigin(0.5)
      .setDepth(4)
      .setStrokeStyle(2, this.retroPalette.ink, 1);

    const toothWidth = Math.max(8, Math.floor(hazard.rect.width / 3));
    for (let index = 0; index < Math.max(2, Math.floor(hazard.rect.width / toothWidth)); index += 1) {
      this.add
        .rectangle(
          hazard.rect.x + toothWidth / 2 + toothWidth * index,
          hazard.rect.y + 2,
          Math.max(4, toothWidth - 2),
          Math.max(4, Math.floor(hazard.rect.height / 2)),
          this.retroPalette.warm,
        )
        .setOrigin(0.5, 0)
        .setDepth(5);
    }

    if (hazard.id) {
      this.hazardSprites.set(hazard.id, base);
    }
  }

  private syncView(): void {
    const state = this.bridge.getSession().getState();
    const { player } = state;
    const variantKey = state.player.presentationPower ?? 'base';
    const variant = PLAYER_POWER_VARIANTS[variantKey];
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    this.player.setPosition(player.x, player.y);
    this.player.setAlpha(player.invulnerableMs > 0 && Math.floor(player.invulnerableMs / 90) % 2 === 0 ? 0.45 : 1);
    this.player.setFillStyle(variant.bodyColor);
    this.player.setStrokeStyle(2, variant.detailColor, 0.95);
    const auraStep = getRetroMotionStep(this.time.now + centerX, 110, 3);
    const auraAlpha = [0.14, 0.2, 0.28][auraStep] ?? 0.14;
    this.playerAura
      .setPosition(centerX, centerY)
      .setFillStyle(variant.auraColor ?? variant.accentColor, variant.auraColor ? 0.24 : 0.12)
      .setVisible(Boolean(variant.auraColor))
      .setAlpha(variant.auraColor ? auraAlpha : 0);
    this.playerHeadband.setVisible(false);
    this.playerAccent.setVisible(false);
    this.playerWingLeft.setVisible(false);
    this.playerWingRight.setVisible(false);
    this.syncPlayerAccessories(variantKey, variant, player);

    for (const platform of state.stageRuntime.platforms) {
      this.syncPlatform(platform);
    }

    for (const terrainSurface of state.stageRuntime.terrainSurfaces) {
      this.syncTerrainSurface(terrainSurface);
    }

    for (const launcherEntry of state.stageRuntime.launchers) {
      this.syncLauncher(launcherEntry);
    }

    for (const activationNode of state.stageRuntime.activationNodes) {
      this.syncActivationNode(activationNode);
    }

    for (const checkpoint of state.stageRuntime.checkpoints) {
      this.syncCheckpoint(checkpoint);
    }

    for (const collectible of state.stageRuntime.collectibles) {
      this.syncCollectible(collectible);
    }

    for (const rewardBlock of state.stageRuntime.rewardBlocks) {
      this.syncRewardBlock(rewardBlock);
    }

    for (const rewardReveal of state.stageRuntime.rewardReveals) {
      this.syncRewardReveal(rewardReveal);
    }

    for (const enemy of state.stageRuntime.enemies) {
      this.syncEnemy(enemy);
    }

    for (const projectile of state.stageRuntime.projectiles) {
      this.syncProjectile(projectile);
    }

    for (const [id, sprite] of this.projectileSprites.entries()) {
      if (!state.stageRuntime.projectiles.find((projectile) => projectile.id === id && projectile.alive)) {
        sprite.destroy();
        this.projectileSprites.delete(id);
      }
    }

    for (const [id, text] of this.rewardRevealTexts.entries()) {
      if (!state.stageRuntime.rewardReveals.find((rewardReveal) => rewardReveal.id === id)) {
        text.destroy();
        this.rewardRevealTexts.delete(id);
      }
    }

    this.exitSprite.setAlpha(state.stageRuntime.exitReached ? 0.55 : 1);
  }

  getDebugSnapshot(): {
    runPaused: boolean;
    pauseOverlayVisible: boolean;
    pauseText: string | null;
    hudVisible: boolean;
    terrainSurfaceVisuals: {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      visible: boolean;
    }[];
    launcherVisuals: {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      visible: boolean;
    }[];
    gravityFieldVisuals: {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      visible: boolean;
      fillColor: number;
    }[];
    activationNodeVisuals: {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      visible: boolean;
      fillColor: number;
    }[];
    magneticPlatformVisuals: {
      id: string;
      powered: boolean;
      visible: boolean;
      fillColor: number;
      alpha: number;
    }[];
  } {
    return {
      runPaused: this.bridge.isRunPaused(),
      pauseOverlayVisible: this.pauseOverlay.visible && this.pauseText.visible,
      pauseText: this.pauseText.visible ? this.pauseText.text : null,
      hudVisible: this.hud.root.style.visibility !== 'hidden',
      terrainSurfaceVisuals: this.bridge
        .getSession()
        .getState()
        .stageRuntime.terrainSurfaces.map((surface) => ({
          id: surface.id,
          x: surface.x,
          y: surface.y,
          width: surface.width,
          height: surface.height,
          visible: this.terrainSurfaceSprites.get(surface.id)?.visible ?? false,
        })),
      launcherVisuals: this.bridge
        .getSession()
        .getState()
        .stageRuntime.launchers.map((launcherEntry) => ({
          id: launcherEntry.id,
          x: launcherEntry.x,
          y: launcherEntry.y,
          width: launcherEntry.width,
          height: launcherEntry.height,
          visible: this.launcherSprites.get(launcherEntry.id)?.visible ?? false,
        })),
      gravityFieldVisuals: this.bridge
        .getSession()
        .getState()
        .stageRuntime.gravityFields.map((field) => ({
          id: field.id,
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          visible: this.gravityFieldSprites.get(field.id)?.visible ?? false,
          fillColor: this.gravityFieldSprites.get(field.id)?.fillColor ?? 0,
        })),
      activationNodeVisuals: this.bridge
        .getSession()
        .getState()
        .stageRuntime.activationNodes.map((node) => ({
          id: node.id,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          visible: this.activationNodeSprites.get(node.id)?.visible ?? false,
          fillColor: this.activationNodeSprites.get(node.id)?.fillColor ?? 0,
        })),
      magneticPlatformVisuals: this.bridge
        .getSession()
        .getState()
        .stageRuntime.platforms.filter((platform) => platform.magnetic).map((platform) => ({
          id: platform.id,
          powered: platform.magnetic?.powered ?? false,
          visible: this.platformSprites.get(platform.id)?.visible ?? false,
          fillColor: this.platformSprites.get(platform.id)?.fillColor ?? 0,
          alpha: this.platformSprites.get(platform.id)?.alpha ?? 0,
        })),
    };
  }

  private setPauseOverlayVisible(visible: boolean): void {
    this.pauseOverlay.setVisible(visible);
    this.pauseText.setVisible(visible);
    this.hud.root.style.visibility = visible ? 'hidden' : 'visible';
  }

  private syncPlatform(platform: PlatformState): void {
    const sprite = this.platformSprites.get(platform.id);
    if (!sprite) {
      return;
    }

    const state = this.bridge.getSession().getState();
    const visible = isPlatformVisible(
      platform,
      state.stageRuntime.revealedPlatformIds,
      state.stageRuntime.temporaryBridges.filter((bridge) => bridge.active).map((bridge) => bridge.id),
    );
    const active = isPlatformActive(
      platform,
      state.stageRuntime.revealedPlatformIds,
      state.stageRuntime.temporaryBridges.filter((bridge) => bridge.active).map((bridge) => bridge.id),
    );
    sprite.setVisible(visible);
    if (!visible) {
      return;
    }

    sprite.setPosition(platform.x + platform.width / 2, platform.y + platform.height / 2);
    sprite.setFillStyle(this.platformColor(platform));
    sprite.setStrokeStyle(0);

    if (platform.kind === 'falling' && platform.fall) {
      const alpha = platform.fall.falling ? 0.45 : platform.fall.triggered ? 0.7 : 1;
      sprite.setAlpha(alpha);
    } else if (platform.magnetic) {
      sprite.setAlpha(platform.magnetic.powered ? 1 : 0.46);
      sprite.setStrokeStyle(2, platform.magnetic.powered ? 0xd6fff6 : 0x90a6bf, 0.48);
    } else if (platform.temporaryBridge && platform.reveal && !active) {
      sprite.setAlpha(0.38);
      sprite.setStrokeStyle(2, 0xf7f3d6, 0.2);
    } else {
      sprite.setAlpha(1);
    }
  }

  private syncLauncher(launcherEntry: LauncherState): void {
    const sprite = this.launcherSprites.get(launcherEntry.id);
    if (!sprite) {
      return;
    }

    sprite
      .setPosition(launcherEntry.x + launcherEntry.width / 2, launcherEntry.y + launcherEntry.height / 2)
      .setSize(launcherEntry.width, launcherEntry.height)
      .setFillStyle(this.launcherColor(launcherEntry), launcherEntry.timerMs > 0 ? 0.5 : 0.86)
      .setVisible(true);
  }

  private syncActivationNode(node: { id: string; x: number; y: number; width: number; height: number; activated: boolean }): void {
    const sprite = this.activationNodeSprites.get(node.id);
    if (!sprite) {
      return;
    }

    sprite
      .setPosition(node.x + node.width / 2, node.y + node.height / 2)
      .setSize(node.width, node.height)
      .setFillStyle(this.activationNodeColor(node), node.activated ? 0.98 : 0.9)
      .setStrokeStyle(2, node.activated ? this.retroPalette.bright : this.retroPalette.border, node.activated ? 0.52 : 0.4)
      .setVisible(true);
  }

  private syncTerrainSurface(surface: TerrainSurfaceState): void {
    const sprite = this.terrainSurfaceSprites.get(surface.id);
    if (!sprite) {
      return;
    }

    sprite.setPosition(surface.x + surface.width / 2, surface.y + surface.height / 2);
    sprite.setSize(surface.width, surface.height);
    sprite.setVisible(true);
    sprite.setFillStyle(this.terrainSurfaceColor(surface), this.terrainSurfaceAlpha(surface));
    sprite.setStrokeStyle(2, this.retroPalette.border, surface.kind === 'stickySludge' ? 0.24 : 0.38);
  }

  private syncCheckpoint(checkpoint: CheckpointState): void {
    const sprite = this.checkpointSprites.get(checkpoint.id);
    sprite
      ?.setTint(checkpoint.activated ? this.retroPalette.safe : this.retroPalette.cool)
      .setScale(checkpoint.activated ? 1.12 : 1);
  }

  private syncCollectible(collectible: CollectibleState): void {
    const sprite = this.collectibleSprites.get(collectible.id);
    if (!sprite) {
      return;
    }
    sprite.setVisible(!collectible.collected);
    if (!collectible.collected) {
      const collectibleStep = getRetroMotionStep(this.time.now + collectible.position.x, 140, 2);
      sprite.setPosition(collectible.position.x, collectible.position.y);
      sprite.setTint(this.retroPalette.warm);
      sprite.setScale(collectibleStep === 0 ? 1 : 1.12);
      sprite.setAlpha(collectibleStep === 0 ? 1 : 0.86);
    }
  }

  private syncRewardBlock(rewardBlock: RewardBlockState): void {
    const sprite = this.rewardBlockSprites.get(rewardBlock.id);
    const label = this.rewardBlockLabels.get(rewardBlock.id);
    if (!sprite || !label) {
      return;
    }

    const flashProgress = Phaser.Math.Clamp(rewardBlock.hitFlashMs / 180, 0, 1);
    const bumpOffset = flashProgress > 0 ? snapRetroValue(10 * flashProgress, 2) : 0;
    const alpha = rewardBlock.used ? 0.35 : 1;

    sprite.setPosition(rewardBlock.x + rewardBlock.width / 2, rewardBlock.y + rewardBlock.height / 2 - bumpOffset);
    sprite.setFillStyle(this.rewardBlockColor(rewardBlock));
    sprite.setStrokeStyle(2, flashProgress > 0 ? 0xffffff : this.retroPalette.border, flashProgress > 0 ? 0.8 : 0.55);
    sprite.setAlpha(alpha);
    label.setPosition(rewardBlock.x + rewardBlock.width / 2, rewardBlock.y + rewardBlock.height / 2 - bumpOffset);
    label.setText(this.rewardBlockLabel(rewardBlock));
    label.setAlpha(alpha);
  }

  private syncRewardReveal(rewardReveal: RewardRevealState): void {
    let text = this.rewardRevealTexts.get(rewardReveal.id);
    if (!text) {
      text = this.add
        .text(rewardReveal.x, rewardReveal.y, this.rewardRevealText(rewardReveal), {
          fontFamily: RETRO_FONT_FAMILY,
          fontSize: '18px',
          color: this.rewardRevealColor(rewardReveal),
          fontStyle: 'bold',
          stroke: this.retroPalette.shadow,
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(12);
      this.rewardRevealTexts.set(rewardReveal.id, text);
    }

    const alpha = Phaser.Math.Clamp(rewardReveal.timerMs / rewardReveal.durationMs, 0, 1);
  const floatOffset = snapRetroValue((1 - alpha) * 24, 3);
    text.setText(this.rewardRevealText(rewardReveal));
    text.setColor(this.rewardRevealColor(rewardReveal));
    text.setPosition(rewardReveal.x, rewardReveal.y - floatOffset);
    text.setAlpha(alpha);
  }

  private syncEnemy(enemy: EnemyState): void {
    const sprite = this.enemySprites.get(enemy.id);
    if (!sprite) {
      return;
    }
    sprite.setVisible(enemy.alive);
    if (enemy.alive) {
      sprite.setPosition(enemy.x, enemy.y);
      sprite.setFlipX(enemy.direction < 0);
      sprite.setScale(1);
      sprite.setAlpha(1);
      const turretVariant = enemy.variant ? TURRET_VARIANT_CONFIG[enemy.variant] : null;
      sprite.setTint(
        enemy.kind === 'charger'
          ? this.retroPalette.alert
          : enemy.kind === 'flyer'
            ? this.retroPalette.cool
            : turretVariant
              ? turretVariant.baseColor
              : enemy.kind === 'hopper'
                ? this.retroPalette.safe
                : this.retroPalette.warm,
      );
      if (enemy.kind === 'charger' && enemy.charger?.state === 'windup') {
        sprite.setTint(this.retroPalette.warm);
        sprite.setScale(1.1);
      }
      if (enemy.kind === 'turret' && turretVariant && enemy.turret?.telegraphMs) {
        const progress = 1 - enemy.turret.telegraphMs / Math.max(enemy.turret.telegraphDurationMs, 1);
        const telegraphStep = Math.min(2, Math.floor(progress * 3));
        sprite.setTint(turretVariant.telegraphColor);
        sprite.setScale([1, 1.06, 1.12][telegraphStep] ?? 1);
        sprite.setAlpha([0.8, 0.9, 1][telegraphStep] ?? 0.8);
      }
    }
  }

  private syncProjectile(projectile: ProjectileState): void {
    let sprite = this.projectileSprites.get(projectile.id);
    if (!projectile.alive) {
      sprite?.destroy();
      this.projectileSprites.delete(projectile.id);
      return;
    }

    if (!sprite) {
      sprite = this.add.sprite(projectile.x, projectile.y, 'projectile').setOrigin(0, 0);
      this.projectileSprites.set(projectile.id, sprite);
    }

    sprite.setPosition(projectile.x, projectile.y);
    sprite.setTint(projectile.variant ? TURRET_VARIANT_CONFIG[projectile.variant].projectileColor : 0xffc15b);
    sprite.setScale(projectile.variant ? 1.18 : 1.06);
    sprite.setAlpha(projectile.variant ? 0.96 : 0.9);
  }

  private platformColor(platform: PlatformState): number {
    if (platform.magnetic) {
      return platform.magnetic.powered ? this.retroPalette.cool : this.retroPalette.muted;
    }

    if (platform.temporaryBridge) {
      return this.retroPalette.cool;
    }

    if (platform.reveal) {
      return this.retroPalette.border;
    }

    switch (platform.kind) {
      case 'moving':
        return this.retroPalette.muted;
      case 'falling':
        return this.retroPalette.alert;
      case 'spring':
        return this.retroPalette.safe;
      default:
        return this.retroPalette.panelAlt;
    }
  }

  private activationNodeColor(node: { activated: boolean }): number {
    return node.activated ? this.retroPalette.safe : this.retroPalette.muted;
  }

  private terrainSurfaceColor(surface: TerrainSurfaceState): number {
    if (surface.kind === 'stickySludge') {
      return this.retroPalette.panelAlt;
    }

    if (isBrittleSurfaceBroken(surface)) {
      return this.retroPalette.muted;
    }

    if (isBrittleSurfaceWarning(surface)) {
      return this.retroPalette.warm;
    }

    return this.retroPalette.cool;
  }

  private launcherColor(launcherEntry: LauncherState): number {
    return launcherEntry.kind === 'bouncePod' ? this.retroPalette.safe : this.retroPalette.warm;
  }

  private terrainSurfaceAlpha(surface: TerrainSurfaceState): number {
    if (surface.kind === 'stickySludge') {
      return 0.78;
    }

    return isBrittleSurfaceBroken(surface) ? 0.34 : isBrittleSurfaceWarning(surface) ? 0.92 : 0.8;
  }

  private gravityFieldColor(field: GravityFieldState): number {
    return field.kind === 'anti-grav-stream' ? this.retroPalette.cool : this.retroPalette.warm;
  }

  private gravityFieldAlpha(field: GravityFieldState): number {
    return field.kind === 'anti-grav-stream' ? 0.13 : 0.11;
  }

  private rewardBlockColor(rewardBlock: RewardBlockState): number {
    if (rewardBlock.reward.kind === 'coins') {
      return this.retroPalette.warm;
    }

    switch (rewardBlock.reward.power) {
      case 'doubleJump':
        return 0xdfe8bf;
      case 'shooter':
        return 0xf0c6a1;
      case 'invincible':
        return this.retroPalette.cool;
      case 'dash':
        return this.retroPalette.border;
    }
  }

  private rewardBlockLabel(rewardBlock: RewardBlockState): string {
    if (rewardBlock.reward.kind === 'coins') {
      return getCollectibleRewardBlockLabel(rewardBlock.remainingHits);
    }

    if (rewardBlock.used) {
      return '--';
    }

    return getPowerShortLabel(rewardBlock.reward.power);
  }

  private rewardRevealText(rewardReveal: RewardRevealState): string {
    if (rewardReveal.reward.kind === 'coins') {
      return getCollectibleRewardRevealLabel();
    }

    return getPowerRevealLabel(rewardReveal.reward.power);
  }

  private rewardRevealColor(rewardReveal: RewardRevealState): string {
    if (rewardReveal.reward.kind === 'coins') {
      return '#f5cf64';
    }

    switch (rewardReveal.reward.power) {
      case 'doubleJump':
        return '#dfe8bf';
      case 'shooter':
        return '#f0c6a1';
      case 'invincible':
        return '#8fdff2';
      case 'dash':
        return '#f7f3d6';
    }
  }

  private syncPlayerAccessories(
    variantKey: keyof typeof PLAYER_POWER_VARIANTS,
    variant: (typeof PLAYER_POWER_VARIANTS)[keyof typeof PLAYER_POWER_VARIANTS],
    player: { x: number; y: number; width: number; height: number; facing: 1 | -1; dashTimerMs: number },
  ): void {
    const centerX = player.x + player.width / 2;
    const facingOffset = player.facing === 1 ? 1 : -1;
    switch (variantKey) {
      case 'doubleJump':
        this.playerHeadband
          .setPosition(centerX, player.y + 8)
          .setSize(20, 8)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerWingLeft
          .setPosition(player.x - 4, player.y + 19)
          .setSize(10, 20)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        this.playerWingRight
          .setPosition(player.x + player.width + 4, player.y + 19)
          .setSize(10, 20)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      case 'shooter':
        this.playerHeadband
          .setPosition(centerX, player.y + 13)
          .setSize(18, 8)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX + facingOffset * 14, player.y + 22)
          .setSize(16, 10)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      case 'invincible':
        this.playerHeadband
          .setPosition(centerX, player.y + 6)
          .setSize(22, 8)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX, player.y - 1)
          .setSize(12, 8)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        break;
      case 'dash':
        this.playerHeadband
          .setPosition(centerX, player.y + player.height - 7)
          .setSize(20, 6)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX - facingOffset * 14, player.y + 20)
          .setSize(player.dashTimerMs > 0 ? 18 : 12, 10)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      default:
        this.playerHeadband
          .setPosition(centerX, player.y + 11)
          .setSize(18, 5)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        break;
    }
  }
}
