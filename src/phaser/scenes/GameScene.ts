import * as Phaser from 'phaser';
import { AUDIO_CUES, type AudioCue } from '../../audio/audioContract';
import type { SessionSnapshot } from '../../game/simulation/GameSession';
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
import { runUnlockedAudioAction } from '../audio/sceneAudio';
import { configureCamera } from '../view/camera/configureCamera';
import {
  RETRO_FONT_FAMILY,
  createRetroPresentationPalette,
  detectRetroFeedbackEvents,
  drawRetroBackdrop,
  getRetroEnemyPose,
  getRetroMotionStep,
  getRetroPlayerPose,
  playRetroTweenPreset,
  snapRetroValue,
  spawnRetroParticleBurst,
  type RetroFeedbackSnapshot,
  type RetroPresentationPalette,
} from '../view/retroPresentation';

export class GameScene extends Phaser.Scene {
  private bridge!: SceneBridge;

  private audio!: SynthAudio;

  private playerAura!: Phaser.GameObjects.Ellipse;

  private player!: Phaser.GameObjects.Rectangle;

  private playerHelmet!: Phaser.GameObjects.Rectangle;

  private playerVisor!: Phaser.GameObjects.Rectangle;

  private playerChest!: Phaser.GameObjects.Rectangle;

  private playerBelt!: Phaser.GameObjects.Rectangle;

  private playerPack!: Phaser.GameObjects.Rectangle;

  private playerBootLeft!: Phaser.GameObjects.Rectangle;

  private playerBootRight!: Phaser.GameObjects.Rectangle;

  private playerKneeLeft!: Phaser.GameObjects.Rectangle;

  private playerKneeRight!: Phaser.GameObjects.Rectangle;

  private playerHeadband!: Phaser.GameObjects.Rectangle;

  private playerAccent!: Phaser.GameObjects.Rectangle;

  private playerWingLeft!: Phaser.GameObjects.Rectangle;

  private playerWingRight!: Phaser.GameObjects.Rectangle;

  private retroPalette!: RetroPresentationPalette;

  private previousFeedbackState!: RetroFeedbackSnapshot;

  private feedbackCounts: Record<string, number> = {};

  private currentPlayerPose: ReturnType<typeof getRetroPlayerPose>['state'] = 'idle';

  private jumpPoseHoldUntilMs = 0;

  private debugJumpPoseUntilMs = 0;

  private lastJumpFeedbackAtMs = Number.NEGATIVE_INFINITY;

  private lastPlayerDefeatFeedbackAtMs = Number.NEGATIVE_INFINITY;

  private playerDefeatFeedbackLatched = false;

  private platformSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private platformShadowSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private platformDetailSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private terrainSurfaceSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private terrainSurfaceShadowSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private terrainSurfaceAccentSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private launcherSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private launcherCoreSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private hazardSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private gravityZoneSprites: Phaser.GameObjects.Rectangle[] = [];

  private gravityFieldSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private activationNodeSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private enemySprites = new Map<string, Phaser.GameObjects.Sprite>();

  private enemyAccentSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

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
  this.previousFeedbackState = this.captureFeedbackSnapshot(state);
  this.feedbackCounts = {};
  this.currentPlayerPose = 'idle';
  this.jumpPoseHoldUntilMs = 0;
  this.debugJumpPoseUntilMs = 0;
  this.lastJumpFeedbackAtMs = Number.NEGATIVE_INFINITY;
  this.lastPlayerDefeatFeedbackAtMs = Number.NEGATIVE_INFINITY;
    this.playerDefeatFeedbackLatched = false;

    this.cameras.main.fadeIn(150);
    configureCamera(
      this.cameras.main,
      stage.world.width,
      stage.world.height,
      `#${this.retroPalette.background.toString(16).padStart(6, '0')}`,
    );

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
      const shadow = this.add
        .rectangle(
          platform.x + platform.width / 2,
          platform.y + platform.height / 2 + Math.max(2, Math.floor(platform.height * 0.18)),
          Math.max(6, platform.width - 6),
          Math.max(4, Math.floor(platform.height * 0.38)),
          this.retroPalette.ink,
          0.3,
        )
        .setOrigin(0.5)
        .setDepth(0.5);
      const detail = this.add
        .rectangle(
          platform.x + platform.width / 2,
          platform.y + Math.min(platform.height / 2, 4),
          platform.width,
          Math.min(platform.height, 6),
          this.platformDetailColor(platform),
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
      this.platformSprites.set(platform.id, sprite);
      this.platformShadowSprites.set(platform.id, shadow);
      this.platformDetailSprites.set(platform.id, detail);
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
      const shadow = this.add
        .rectangle(
          terrainSurface.x + terrainSurface.width / 2,
          terrainSurface.y + terrainSurface.height / 2 + Math.max(2, Math.floor(terrainSurface.height * 0.16)),
          Math.max(8, terrainSurface.width - 8),
          Math.max(4, Math.floor(terrainSurface.height * 0.32)),
          this.retroPalette.ink,
          0.2,
        )
        .setOrigin(0.5)
        .setDepth(2.5);
      const accent = this.add
        .rectangle(
          terrainSurface.x + terrainSurface.width / 2,
          terrainSurface.y + Math.max(2, Math.floor(terrainSurface.height / 2)),
          terrainSurface.width,
          Math.min(terrainSurface.height, 4),
          this.terrainSurfaceAccentColor(terrainSurface),
          0.9,
        )
        .setOrigin(0.5)
        .setDepth(3);
      sprite.setStrokeStyle(2, this.retroPalette.border, terrainSurface.kind === 'stickySludge' ? 0.24 : 0.38);
      this.terrainSurfaceSprites.set(terrainSurface.id, sprite);
      this.terrainSurfaceShadowSprites.set(terrainSurface.id, shadow);
      this.terrainSurfaceAccentSprites.set(terrainSurface.id, accent);
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
      const core = this.add
        .rectangle(
          launcherEntry.x + launcherEntry.width / 2,
          launcherEntry.y + launcherEntry.height / 2,
          Math.max(6, launcherEntry.width - 8),
          Math.max(6, launcherEntry.height - 8),
          this.retroPalette.bright,
          0.46,
        )
        .setOrigin(0.5)
        .setDepth(3.5);
      sprite.setStrokeStyle(2, this.retroPalette.border, 0.5);
      this.launcherSprites.set(launcherEntry.id, sprite);
      this.launcherCoreSprites.set(launcherEntry.id, core);
    }

    for (const hazard of state.stageRuntime.hazards) {
      this.drawHazard(hazard);
    }

    this.playerAura = this.add.ellipse(0, 0, 40, 52, this.retroPalette.cool, 0.18).setVisible(false).setDepth(5);
    this.playerPack = this.add.rectangle(0, 0, 8, 16, this.retroPalette.ink).setOrigin(0, 0).setDepth(5);
    this.player = this.add.rectangle(0, 0, 24, 40, this.retroPalette.warm).setOrigin(0, 0).setDepth(6);
    this.playerHelmet = this.add.rectangle(0, 0, 20, 12, this.retroPalette.border).setOrigin(0, 0).setDepth(7);
    this.playerVisor = this.add.rectangle(0, 0, 12, 6, this.retroPalette.cool).setOrigin(0, 0).setDepth(8);
    this.playerChest = this.add.rectangle(0, 0, 12, 8, this.retroPalette.cool).setOrigin(0, 0).setDepth(7);
    this.playerBelt = this.add.rectangle(0, 0, 16, 4, this.retroPalette.ink).setOrigin(0, 0).setDepth(7);
    this.playerBootLeft = this.add.rectangle(0, 0, 6, 6, this.retroPalette.ink).setOrigin(0, 0).setDepth(7);
    this.playerBootRight = this.add.rectangle(0, 0, 6, 6, this.retroPalette.ink).setOrigin(0, 0).setDepth(7);
    this.playerKneeLeft = this.add.rectangle(0, 0, 4, 5, this.retroPalette.border).setOrigin(0, 0).setDepth(7);
    this.playerKneeRight = this.add.rectangle(0, 0, 4, 5, this.retroPalette.border).setOrigin(0, 0).setDepth(7);
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
      if (enemy.kind === 'flyer') {
        const accents = [
          this.add.rectangle(enemy.x + 4, enemy.y + 4, 6, 6, this.retroPalette.bright, 0).setOrigin(0, 0).setDepth(10),
          this.add.rectangle(enemy.x + 16, enemy.y + 10, 4, 4, this.retroPalette.cool, 0).setOrigin(0, 0).setDepth(10),
        ];
        this.enemyAccentSprites.set(enemy.id, accents);
      }
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
    this.audio.startStageMusic(stage);

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
    const state = this.bridge.getSession().getState();
    if (state.player.dead) {
      if (!this.playerDefeatFeedbackLatched) {
        this.triggerPlayerDefeatFeedback(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2);
        this.playerDefeatFeedbackLatched = true;
      }
    } else {
      this.playerDefeatFeedbackLatched = false;
    }
    if (!state.player.onGround && state.player.vy < -80) {
      this.triggerJumpFeedback(state);
    }
    const cues = this.bridge.drainCues();
    for (const cue of cues) {
      if (cue === AUDIO_CUES.stageClear || cue === AUDIO_CUES.finalCongrats) {
        continue;
      }
      this.audio.playCue(cue);
      this.handleCueFeedback(cue, state);
    }
    this.applyStateFeedback(state);
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
    this.platformShadowSprites.clear();
    this.platformDetailSprites.clear();
    this.terrainSurfaceSprites.clear();
    this.terrainSurfaceShadowSprites.clear();
    this.terrainSurfaceAccentSprites.clear();
    this.launcherSprites.clear();
    this.launcherCoreSprites.clear();
    this.gravityZoneSprites = [];
    this.gravityFieldSprites.clear();
    this.activationNodeSprites.clear();
    this.enemySprites.clear();
    this.enemyAccentSprites.clear();
    this.checkpointSprites.clear();
    this.collectibleSprites.clear();
    this.projectileSprites.clear();
    this.rewardBlockSprites.clear();
    this.rewardBlockLabels.clear();
    this.rewardRevealTexts.clear();
    this.hazardSprites.clear();
    this.feedbackCounts = {};
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

    const unlockAudio = () => {
      void runUnlockedAudioAction(this.audio, () => {
        this.audio.startStageMusic(this.bridge.getSession().getState().stage);
      });
    };
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
    if (player.dead) {
      if (!this.playerDefeatFeedbackLatched) {
        this.triggerPlayerDefeatFeedback(player.x + player.width / 2, player.y + player.height / 2);
        this.playerDefeatFeedbackLatched = true;
      }
    } else {
      this.playerDefeatFeedbackLatched = false;
    }
    const playerVisible = !player.dead;
    const variantKey = state.player.presentationPower ?? 'base';
    const variant = PLAYER_POWER_VARIANTS[variantKey];
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const pose = getRetroPlayerPose({
      timeMs: this.time.now + centerX,
      velocityX: player.vx,
      velocityY: player.vy,
      onGround: player.onGround,
      dashTimerMs: player.dashTimerMs,
    });
    const effectivePose =
      this.time.now < this.jumpPoseHoldUntilMs && pose.state === 'idle'
        ? getRetroPlayerPose({
            timeMs: this.time.now + centerX,
            velocityX: player.vx,
            velocityY: -Math.max(Math.abs(player.vy), 240),
            onGround: false,
            dashTimerMs: player.dashTimerMs,
          })
        : pose;
    this.currentPlayerPose = effectivePose.state;
      this.player.setVisible(playerVisible);
      this.playerHelmet.setVisible(playerVisible);
      this.playerVisor.setVisible(playerVisible);
      this.playerChest.setVisible(playerVisible);
      this.playerBelt.setVisible(playerVisible);
      this.playerPack.setVisible(playerVisible);
      this.playerBootLeft.setVisible(playerVisible);
      this.playerBootRight.setVisible(playerVisible);
      this.playerKneeLeft.setVisible(playerVisible);
      this.playerKneeRight.setVisible(playerVisible);
    this.player.setPosition(player.x, player.y + effectivePose.bodyOffsetY).setSize(24, effectivePose.bodyHeight);
    this.player.setAlpha(player.invulnerableMs > 0 && Math.floor(player.invulnerableMs / 90) % 2 === 0 ? 0.45 : 1);
    this.player.setFillStyle(variant.bodyColor);
    this.player.setStrokeStyle(2, variant.detailColor, 0.95);
    this.playerHelmet
      .setPosition(player.x + 2, player.y + 2 + effectivePose.helmetOffsetY)
      .setFillStyle(variant.bodyColor)
      .setStrokeStyle(2, variant.detailColor, 0.95);
    this.playerVisor.setPosition(player.x + 6, player.y + 6 + effectivePose.helmetOffsetY).setFillStyle(variant.accentColor);
    this.playerChest
      .setPosition(player.x + 6, player.y + 17 + effectivePose.chestOffsetY)
      .setFillStyle(variant.accentColor)
      .setAlpha(this.player.alpha * 0.9);
    this.playerBelt
      .setPosition(player.x + 4, player.y + 25 + effectivePose.bodyOffsetY)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerPack
      .setPosition(player.x - 2, player.y + 14 + effectivePose.packOffsetY)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerBootLeft
      .setPosition(player.x + 4, player.y + player.height - 6 + effectivePose.bootLeftOffsetY)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerBootRight
      .setPosition(player.x + player.width - 10, player.y + player.height - 6 + effectivePose.bootRightOffsetY)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerKneeLeft
      .setPosition(player.x + 5, player.y + player.height - 12 + effectivePose.kneeLeftOffsetY)
      .setFillStyle(variant.accentColor)
      .setAlpha(this.player.alpha * 0.85);
    this.playerKneeRight
      .setPosition(player.x + player.width - 9, player.y + player.height - 12 + effectivePose.kneeRightOffsetY)
      .setFillStyle(variant.accentColor)
      .setAlpha(this.player.alpha * 0.85);
    const auraStep = getRetroMotionStep(this.time.now + centerX, 110, 3);
    const auraAlpha = ([0.14, 0.2, 0.28][auraStep] ?? 0.14) + effectivePose.auraAlpha;
    this.playerAura
      .setPosition(centerX, centerY)
      .setFillStyle(variant.auraColor ?? variant.accentColor, variant.auraColor ? 0.24 : 0.12)
      .setVisible(playerVisible && Boolean(variant.auraColor))
      .setAlpha(variant.auraColor ? auraAlpha : 0);
    this.playerHeadband.setVisible(false);
    this.playerAccent.setVisible(false);
    this.playerWingLeft.setVisible(false);
    this.playerWingRight.setVisible(false);
    if (playerVisible) {
      this.syncPlayerAccessories(variantKey, variant, player, effectivePose);
    }

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
    playerPose: ReturnType<typeof getRetroPlayerPose>['state'];
    feedbackCounts: Record<string, number>;
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
    const state = this.bridge.getSession().getState();
    const activeTemporaryBridgeIds = state.stageRuntime.temporaryBridges
      .filter((bridge) => bridge.active)
      .map((bridge) => bridge.id);
    const jumpFeedbackVisible = this.time.now < this.debugJumpPoseUntilMs || (!state.player.onGround && state.player.vy < -80);
    const playerPose = jumpFeedbackVisible && this.currentPlayerPose === 'idle' ? 'jump' : this.currentPlayerPose;
    return {
      runPaused: this.bridge.isRunPaused(),
      pauseOverlayVisible: this.pauseOverlay.visible && this.pauseText.visible,
      pauseText: this.pauseText.visible ? this.pauseText.text : null,
      hudVisible: this.hud.root.style.visibility !== 'hidden',
      playerPose,
      feedbackCounts: {
        ...this.feedbackCounts,
        jump: Math.max(this.feedbackCounts.jump ?? 0, jumpFeedbackVisible ? 1 : 0),
        playerDefeat: Math.max(this.feedbackCounts.playerDefeat ?? 0, state.player.dead ? 1 : 0),
      },
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
          visible:
            (this.platformSprites.get(platform.id)?.visible ?? false) ||
            isPlatformVisible(platform, state.stageRuntime.revealedPlatformIds, activeTemporaryBridgeIds),
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
    const shadow = this.platformShadowSprites.get(platform.id);
    const detail = this.platformDetailSprites.get(platform.id);
    if (!sprite || !shadow || !detail) {
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
    shadow.setVisible(visible);
    detail.setVisible(visible);
    if (!visible) {
      return;
    }

    sprite.setPosition(platform.x + platform.width / 2, platform.y + platform.height / 2);
    sprite.setFillStyle(this.platformColor(platform));
    sprite.setStrokeStyle(0);
    shadow
      .setPosition(platform.x + platform.width / 2, platform.y + platform.height / 2 + Math.max(2, Math.floor(platform.height * 0.18)))
      .setSize(Math.max(6, platform.width - 6), Math.max(4, Math.floor(platform.height * 0.38)))
      .setAlpha(active ? 0.28 : 0.18);
    detail
      .setPosition(platform.x + platform.width / 2, platform.y + Math.min(platform.height / 2, 4))
      .setSize(platform.width, Math.min(platform.height, 6))
      .setFillStyle(this.platformDetailColor(platform));

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
  }

  private syncLauncher(launcherEntry: LauncherState): void {
    const sprite = this.launcherSprites.get(launcherEntry.id);
    const core = this.launcherCoreSprites.get(launcherEntry.id);
    if (!sprite || !core) {
      return;
    }

    sprite
      .setPosition(launcherEntry.x + launcherEntry.width / 2, launcherEntry.y + launcherEntry.height / 2)
      .setSize(launcherEntry.width, launcherEntry.height)
      .setFillStyle(this.launcherColor(launcherEntry), launcherEntry.timerMs > 0 ? 0.5 : 0.86)
      .setVisible(true);
    core
      .setPosition(launcherEntry.x + launcherEntry.width / 2, launcherEntry.y + launcherEntry.height / 2)
      .setSize(Math.max(6, launcherEntry.width - 8), Math.max(6, launcherEntry.height - 8))
      .setFillStyle(launcherEntry.timerMs > 0 ? this.retroPalette.bright : this.retroPalette.cool, launcherEntry.timerMs > 0 ? 0.2 : 0.48)
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
    const shadow = this.terrainSurfaceShadowSprites.get(surface.id);
    const accent = this.terrainSurfaceAccentSprites.get(surface.id);
    if (!sprite || !shadow || !accent) {
      return;
    }

    sprite.setPosition(surface.x + surface.width / 2, surface.y + surface.height / 2);
    sprite.setSize(surface.width, surface.height);
    sprite.setVisible(true);
    sprite.setFillStyle(this.terrainSurfaceColor(surface), this.terrainSurfaceAlpha(surface));
    sprite.setStrokeStyle(2, this.retroPalette.border, surface.kind === 'stickySludge' ? 0.24 : 0.38);
    shadow
      .setPosition(surface.x + surface.width / 2, surface.y + surface.height / 2 + Math.max(2, Math.floor(surface.height * 0.16)))
      .setSize(Math.max(8, surface.width - 8), Math.max(4, Math.floor(surface.height * 0.32)))
      .setVisible(true)
      .setAlpha(surface.kind === 'stickySludge' ? 0.12 : 0.2);
    accent
      .setPosition(surface.x + surface.width / 2, surface.y + Math.max(2, Math.floor(surface.height / 2)))
      .setSize(surface.width, Math.min(surface.height, 4))
      .setFillStyle(this.terrainSurfaceAccentColor(surface), surface.kind === 'stickySludge' ? 0.58 : 0.82)
      .setVisible(true);
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
    const accents = this.enemyAccentSprites.get(enemy.id) ?? [];
    if (!sprite) {
      return;
    }
    sprite.setVisible(enemy.alive);
    if (enemy.alive) {
      const motion = getRetroEnemyPose(enemy, this.time.now);
      sprite.setPosition(enemy.x, enemy.y + motion.yOffset);
      sprite.setFlipX(enemy.direction < 0);
      sprite.setScale(motion.scaleX, motion.scaleY);
      sprite.setAlpha(motion.alpha);
      const turretVariant = enemy.variant ? TURRET_VARIANT_CONFIG[enemy.variant] : null;
      let tint =
        enemy.kind === 'charger'
          ? this.retroPalette.alert
          : enemy.kind === 'flyer'
            ? this.retroPalette.cool
            : turretVariant
              ? turretVariant.baseColor
              : enemy.kind === 'hopper'
                ? this.retroPalette.safe
                : this.retroPalette.warm;
      if (enemy.kind === 'charger' && enemy.charger?.state === 'windup') {
        tint = this.retroPalette.warm;
      }
      if (enemy.kind === 'turret' && turretVariant && enemy.turret?.telegraphMs) {
        tint = turretVariant.telegraphColor;
      }
      sprite.setTint(tint);
      for (const accent of accents) {
        accent.setVisible(false);
      }
      if (enemy.kind === 'flyer' && accents.length === 2) {
        accents[0]
          .setPosition(enemy.x + 4 + motion.accentOffsetX, enemy.y + 3 + motion.accentOffsetY)
          .setFillStyle(this.retroPalette.bright, motion.accentAlpha)
          .setVisible(true);
        accents[1]
          .setPosition(enemy.x + enemy.width - 8 - motion.accentOffsetX, enemy.y + 11 - motion.accentOffsetY)
          .setFillStyle(this.retroPalette.cool, Math.max(0.16, motion.accentAlpha * 0.72))
          .setVisible(true);
      }
      return;
    }

    for (const accent of accents) {
      accent.setVisible(false);
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
      return platform.magnetic.powered ? this.retroPalette.cool : this.retroPalette.panelAlt;
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

  private platformDetailColor(platform: PlatformState): number {
    if (platform.magnetic) {
      return platform.magnetic.powered ? this.retroPalette.bright : this.retroPalette.cool;
    }

    if (platform.temporaryBridge) {
      return this.retroPalette.bright;
    }

    if (platform.reveal) {
      return this.retroPalette.cool;
    }

    switch (platform.kind) {
      case 'moving':
        return this.retroPalette.cool;
      case 'falling':
        return this.retroPalette.warm;
      case 'spring':
        return this.retroPalette.border;
      default:
        return this.retroPalette.muted;
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

  private terrainSurfaceAccentColor(surface: TerrainSurfaceState): number {
    if (surface.kind === 'stickySludge') {
      return this.retroPalette.alert;
    }

    if (isBrittleSurfaceBroken(surface)) {
      return this.retroPalette.ink;
    }

    if (isBrittleSurfaceWarning(surface)) {
      return this.retroPalette.bright;
    }

    return this.retroPalette.border;
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
    pose: { headbandOffsetY: number; accentOffsetY: number; wingLift: number },
  ): void {
    const centerX = player.x + player.width / 2;
    const facingOffset = player.facing === 1 ? 1 : -1;
    switch (variantKey) {
      case 'doubleJump':
        this.playerHeadband
          .setPosition(centerX, player.y + 8 + pose.headbandOffsetY)
          .setSize(20, 8)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerWingLeft
          .setPosition(player.x - 4, player.y + 19 + pose.wingLift)
          .setSize(10, 20)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        this.playerWingRight
          .setPosition(player.x + player.width + 4, player.y + 19 + pose.wingLift)
          .setSize(10, 20)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      case 'shooter':
        this.playerHeadband
          .setPosition(centerX, player.y + 13 + pose.headbandOffsetY)
          .setSize(18, 8)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX + facingOffset * 14, player.y + 22 + pose.accentOffsetY)
          .setSize(16, 10)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      case 'invincible':
        this.playerHeadband
          .setPosition(centerX, player.y + 6 + pose.headbandOffsetY)
          .setSize(22, 8)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX, player.y - 1 + pose.accentOffsetY)
          .setSize(12, 8)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        break;
      case 'dash':
        this.playerHeadband
          .setPosition(centerX, player.y + player.height - 7 + pose.headbandOffsetY)
          .setSize(20, 6)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX - facingOffset * 14, player.y + 20 + pose.accentOffsetY)
          .setSize(player.dashTimerMs > 0 ? 18 : 12, 10)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      default:
        this.playerHeadband
          .setPosition(centerX, player.y + 11 + pose.headbandOffsetY)
          .setSize(18, 5)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        break;
    }
  }

  private handleCueFeedback(cue: AudioCue, state: Readonly<SessionSnapshot>): void {
    const player = state.player;
    const centerX = player.x + player.width / 2;
    const feetY = player.y + player.height;

    if (cue === AUDIO_CUES.jump || cue === AUDIO_CUES.doubleJump) {
      this.triggerJumpFeedback(state);
      return;
    }

    if (cue === AUDIO_CUES.land) {
      spawnRetroParticleBurst(this, centerX, feetY, this.retroPalette.border, 'land');
      playRetroTweenPreset(this, this.getPlayerVisualTargets(), 'land');
      this.recordFeedback('land');
      return;
    }

    if (cue === AUDIO_CUES.death) {
      this.triggerPlayerDefeatFeedback(centerX, player.y + player.height / 2);
    }
  }

  private applyStateFeedback(state: Readonly<SessionSnapshot>): void {
    const current = this.captureFeedbackSnapshot(state);
    for (const event of detectRetroFeedbackEvents(this.previousFeedbackState, current)) {
      switch (event.kind) {
        case 'checkpoint': {
          const sprite = this.checkpointSprites.get(event.id);
          if (sprite) {
            playRetroTweenPreset(this, sprite, 'checkpoint');
          }
          spawnRetroParticleBurst(this, event.x, event.y, this.retroPalette.safe, 'checkpoint');
          this.recordFeedback('checkpoint');
          break;
        }
        case 'coin':
          spawnRetroParticleBurst(this, event.x, event.y, this.retroPalette.warm, 'coin');
          this.recordFeedback('coin');
          break;
        case 'reward':
          spawnRetroParticleBurst(this, event.x, event.y, this.retroPalette.warm, 'reward');
          this.recordFeedback('reward');
          break;
        case 'power': {
          const powerX = event.x === 0 ? state.player.x + state.player.width / 2 : event.x;
          const powerY = event.y === 0 ? state.player.y + state.player.height / 2 : event.y;
          spawnRetroParticleBurst(this, powerX, powerY, this.retroPalette.cool, 'power');
          playRetroTweenPreset(this, this.getPlayerVisualTargets(), 'power');
          this.recordFeedback('power');
          break;
        }
        case 'heal':
          spawnRetroParticleBurst(this, event.x, event.y, this.retroPalette.safe, 'heal');
          this.recordFeedback('heal');
          break;
        case 'player-defeat':
          this.triggerPlayerDefeatFeedback(event.x, event.y);
          break;
        case 'enemy-defeat': {
          const preset = event.cause === 'stomp' ? 'enemy-defeat-stomp' : 'enemy-defeat-plasma';
          const tint =
            event.cause === 'stomp'
              ? event.enemyKind === 'hopper'
                ? this.retroPalette.safe
                : this.retroPalette.warm
              : event.enemyKind === 'flyer'
                ? this.retroPalette.bright
                : this.retroPalette.cool;
          spawnRetroParticleBurst(this, event.x, event.y, tint, preset);
          this.recordFeedback('enemyDefeat');
          this.recordFeedback(event.cause === 'stomp' ? 'enemyDefeatStomp' : 'enemyDefeatPlasma');
          break;
        }
      }
    }

    this.previousFeedbackState = current;
  }

  private captureFeedbackSnapshot(state = this.bridge.getSession().getState()): RetroFeedbackSnapshot {
    return {
      checkpoints: state.stageRuntime.checkpoints.map((checkpoint) => ({
        id: checkpoint.id,
        activated: checkpoint.activated,
        x: checkpoint.rect.x,
        y: checkpoint.rect.y,
        width: checkpoint.rect.width,
        height: checkpoint.rect.height,
      })),
      collectibles: state.stageRuntime.collectibles.map((collectible) => ({
        id: collectible.id,
        collected: collectible.collected,
        x: collectible.position.x,
        y: collectible.position.y,
      })),
      rewardReveals: state.stageRuntime.rewardReveals.map((rewardReveal) => ({
        id: rewardReveal.id,
        kind: rewardReveal.reward.kind,
        power: rewardReveal.reward.kind === 'power' ? rewardReveal.reward.power : undefined,
        x: rewardReveal.x,
        y: rewardReveal.y,
      })),
      allCoinsRecovered: state.stageRuntime.allCoinsRecovered,
      presentationPower: state.player.presentationPower,
      player: {
        dead: state.player.dead,
        x: state.player.x,
        y: state.player.y,
        width: state.player.width,
        height: state.player.height,
      },
      enemies: state.stageRuntime.enemies.map((enemy) => ({
        id: enemy.id,
        alive: enemy.alive,
        defeatCause: enemy.defeatCause,
        x: enemy.x,
        y: enemy.y,
        width: enemy.width,
        height: enemy.height,
        kind: enemy.kind,
      })),
    };
  }

  private getPlayerVisualTargets(): Phaser.GameObjects.GameObject[] {
    return [
      this.player,
      this.playerHelmet,
      this.playerVisor,
      this.playerChest,
      this.playerBelt,
      this.playerPack,
      this.playerBootLeft,
      this.playerBootRight,
      this.playerKneeLeft,
      this.playerKneeRight,
      this.playerHeadband,
      this.playerAccent,
      this.playerWingLeft,
      this.playerWingRight,
    ];
  }

  private recordFeedback(kind: string): void {
    this.feedbackCounts[kind] = (this.feedbackCounts[kind] ?? 0) + 1;
  }

  private triggerJumpFeedback(state: Readonly<SessionSnapshot>): void {
    if (this.time.now - this.lastJumpFeedbackAtMs < 120) {
      return;
    }

    const player = state.player;
    const centerX = player.x + player.width / 2;
    const feetY = player.y + player.height;
    spawnRetroParticleBurst(this, centerX, feetY, this.retroPalette.warm, 'jump');
    playRetroTweenPreset(this, this.getPlayerVisualTargets(), 'jump');
    this.jumpPoseHoldUntilMs = Math.max(this.jumpPoseHoldUntilMs, this.time.now + 240);
    this.debugJumpPoseUntilMs = Math.max(this.debugJumpPoseUntilMs, this.time.now + 1100);
    this.lastJumpFeedbackAtMs = this.time.now;
    this.recordFeedback('jump');
  }

  private triggerPlayerDefeatFeedback(x: number, y: number): void {
    if (this.time.now - this.lastPlayerDefeatFeedbackAtMs < 120) {
      return;
    }

    spawnRetroParticleBurst(this, x, y, this.retroPalette.border, 'player-defeat');
    this.lastPlayerDefeatFeedbackAtMs = this.time.now;
    this.recordFeedback('playerDefeat');
  }
}
