import * as Phaser from 'phaser';
import { AUDIO_CUES, type AudioCue } from '../../audio/audioContract';
import type { SessionSnapshot } from '../../game/simulation/GameSession';
import { ensureBootTexturesRegistered } from '../assets/bootTextures';
import {
  PLAYER_POWER_VARIANTS,
  isBrittlePlatformBroken,
  isBrittlePlatformReady,
  isBrittlePlatformWarning,
  isPlatformVisible,
  type EnemyDefeatCause,
  type CheckpointState,
  type CollectibleState,
  type EnemyState,
  type GravityCapsuleState,
  type GravityFieldState,
  type PlatformState,
  type ProjectileState,
  type RewardBlockState,
  type RewardRevealState,
} from '../../game/simulation/state';
import { createHud } from '../../ui/hud/hud';
import { SceneBridge } from '../adapters/sceneBridge';
import { SynthAudio } from '../audio/SynthAudio';
import {
  CAPSULE_PRESENTATION,
  EXIT_CAPSULE_ART_BOUNDS,
  EXIT_CAPSULE_TEXTURE_KEYS,
  getExitFinishDoorOpenProgress,
  getStageStartCapsuleLayout,
  getStageStartSequenceState,
  getStageStartSequenceTotalMs,
  resolveStageStartCapsuleAnchor,
  type StageStartCapsulePhase,
  type StageStartCapsuleLayout,
} from '../view/capsulePresentation';
import {
  ENEMY_DEFEAT_VISIBLE_HOLD_MS,
  PLAYER_DEFEAT_VISIBLE_HOLD_MS,
  createRetroPresentationPalette,
  detectRetroFeedbackEvents,
  getRetroDefeatTweenPreset,
  getRetroMotionStep,
  getRetroPlayerPose,
  playRetroDefeatTweenPreset,
  playRetroTweenPreset,
  resetRetroPresentationTargets,
  spawnRetroDefeatFlash,
  spawnRetroParticleBurst,
  type RetroFeedbackSnapshot,
  type RetroPresentationPalette,
} from '../view/retroPresentation';
import {
  activationNodeColor,
  gravityCapsuleButtonColor,
  gravityCapsuleButtonCoreColor,
  gravityCapsuleDoorAlpha,
  gravityCapsuleEntryDoorColor,
  gravityCapsuleExitDoorColor,
  gravityCapsuleShellAlpha,
  gravityCapsuleShellColor,
  gravityCapsuleShellStrokeColor,
  gravityFieldAlpha,
  gravityFieldColor,
  platformColor,
  platformDetailColor,
  rewardBlockColor,
  rewardBlockLabel,
  rewardRevealColor,
  rewardRevealText,
  terrainVariantAccentAlpha,
  terrainVariantAccentColor,
  terrainVariantAccentHeight,
  terrainVariantAccentWidth,
  terrainVariantAccentY,
  terrainVariantAlpha,
  terrainVariantColor,
  terrainVariantShadowAlpha,
  terrainVariantStrokeAlpha,
  terrainVariantStrokeColor,
} from '../view/gameSceneStyling';
import {
  getActivationNodeTraversalVisualCategory,
  getGravityCapsuleButtonTraversalVisualCategory,
  getGravityCapsuleShellTraversalVisualCategory,
  getGravityFieldTraversalVisualCategory,
  getPlatformTraversalVisualCategory,
  getTerrainTraversalVisualCategory,
  type TraversalVisualCategory,
} from '../view/traversalVisualLanguage';
import {
  cleanupGameScene,
  createBaseDisplayObjects,
  setupGameSceneHud,
  setupGameSceneInput,
  type GameSceneBaseDisplayContext,
  type GameSceneCleanupContext,
  type GameSceneHudSetupContext,
  type GameSceneInputContext,
} from './gameScene/bootstrap';
import {
  drawHazard as drawHazardRendering,
  syncEnemy as syncEnemyRendering,
  syncProjectile as syncProjectileRendering,
  type GameSceneEnemyRenderingContext,
} from './gameScene/enemyRendering';
import {
  syncGravityCapsule as syncGravityCapsuleRendering,
  syncGravityField as syncGravityFieldRendering,
  type GameSceneGravityRenderingContext,
} from './gameScene/gravityRendering';
import {
  syncActivationNode as syncActivationNodeRendering,
  syncPlatform as syncPlatformRendering,
  syncTerrainVariantPlatform as syncTerrainVariantPlatformRendering,
  type GameScenePlatformRenderingContext,
} from './gameScene/platformRendering';
import {
  syncCheckpoint as syncCheckpointRendering,
  syncCollectible as syncCollectibleRendering,
  syncRewardBlock as syncRewardBlockRendering,
  syncRewardReveal as syncRewardRevealRendering,
  type GameSceneRewardRenderingContext,
} from './gameScene/rewardRendering';
import {
  renderDiagnosticOverlay,
  type GameSceneDiagnosticContext,
} from './gameScene/diagnosticRendering';

const COMPLETE_TRANSITION_DELAY_MS = 160;
const STAGE_START_SEQUENCE_DURATION_MS = getStageStartSequenceTotalMs();

export class GameScene extends Phaser.Scene {
  private bridge!: SceneBridge;

  private audio!: SynthAudio;

  private playerAnchor!: Phaser.GameObjects.Rectangle;

  private playerAura!: Phaser.GameObjects.Ellipse;

  private player!: Phaser.GameObjects.Rectangle;

  private playerHelmet!: Phaser.GameObjects.Rectangle;

  private playerVisor!: Phaser.GameObjects.Rectangle;

  private playerChest!: Phaser.GameObjects.Rectangle;

  private playerBelt!: Phaser.GameObjects.Rectangle;

  private playerPack!: Phaser.GameObjects.Rectangle;

  private playerArmLeft!: Phaser.GameObjects.Rectangle;

  private playerArmRight!: Phaser.GameObjects.Rectangle;

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

  private playerDefeatVisibleUntilMs = Number.NEGATIVE_INFINITY;

  private playerDefeatResetPending = false;

  private enemyDefeatVisibleUntilMs = new Map<string, number>();

  private platformSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private platformShadowSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private platformDetailSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private platformCategoryMarkerSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private terrainVariantSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private terrainVariantShadowSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private terrainVariantAccentSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private terrainVariantDetailSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private hazardSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private gravityZoneSprites: Phaser.GameObjects.Rectangle[] = [];

  private gravityFieldSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private gravityFieldCategoryMarkerSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private gravityCapsuleShellSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private gravityCapsuleEntryDoorSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private gravityCapsuleExitDoorSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private gravityCapsuleButtonSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private gravityCapsuleButtonCoreSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private gravityCapsuleShellMarkerSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private gravityCapsuleButtonMarkerSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private activationNodeSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private activationNodeMarkerSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private enemySprites = new Map<string, Phaser.GameObjects.Sprite>();

  private enemyContactStrips = new Map<string, Phaser.GameObjects.Rectangle>();

  private enemyAccentSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private checkpointSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private checkpointContactStrips = new Map<string, Phaser.GameObjects.Rectangle>();

  private collectibleSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private rewardBlockSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private rewardBlockLabels = new Map<string, Phaser.GameObjects.Text>();

  private rewardRevealTexts = new Map<string, Phaser.GameObjects.Text>();

  private projectileSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private exitShell!: Phaser.GameObjects.Image;

  private exitDoor!: Phaser.GameObjects.Image;

  private exitBase!: Phaser.GameObjects.Rectangle;

  private exitBaseShadow!: Phaser.GameObjects.Rectangle;

  private exitBeacon!: Phaser.GameObjects.Rectangle;

  private arrivalBase!: Phaser.GameObjects.Rectangle;

  private arrivalBaseShadow!: Phaser.GameObjects.Rectangle;

  private arrivalBeacon!: Phaser.GameObjects.Rectangle;

  private arrivalShell!: Phaser.GameObjects.Image;

  private arrivalDoor!: Phaser.GameObjects.Image;

  private arrivalAura!: Phaser.GameObjects.Ellipse;

  private arrivalPlayer!: Phaser.GameObjects.Sprite;

  private pauseOverlay!: Phaser.GameObjects.Rectangle;

  private pauseText!: Phaser.GameObjects.Text;

  private hud = createHud(document.createElement('div'));

  private completeTransitionEvent?: Phaser.Time.TimerEvent;

  private stageStartArrivalTimerMs = 0;

  private stageStartCapsuleLayout!: StageStartCapsuleLayout;

  private gameplayMusicStarted = false;

  constructor() {
    super('game');
  }

  private getHudSetupContext(): GameSceneHudSetupContext {
    void this.hud;
    return this as unknown as GameSceneHudSetupContext;
  }

  private getInputContext(): GameSceneInputContext {
    void this.audio;
    void this.bridge;
    void this.startGameplayMusicIfReady;
    void this.setPauseOverlayVisible;
    return this as unknown as GameSceneInputContext;
  }

  private getCleanupContext(): GameSceneCleanupContext {
    void this.completeTransitionEvent;
    void this.audio;
    void this.hud;
    void this.platformSprites;
    void this.platformShadowSprites;
    void this.platformDetailSprites;
    void this.platformCategoryMarkerSprites;
    void this.terrainVariantSprites;
    void this.terrainVariantShadowSprites;
    void this.terrainVariantAccentSprites;
    void this.terrainVariantDetailSprites;
    void this.gravityZoneSprites;
    void this.gravityFieldSprites;
    void this.gravityFieldCategoryMarkerSprites;
    void this.gravityCapsuleShellSprites;
    void this.gravityCapsuleEntryDoorSprites;
    void this.gravityCapsuleExitDoorSprites;
    void this.gravityCapsuleButtonSprites;
    void this.gravityCapsuleButtonCoreSprites;
    void this.gravityCapsuleShellMarkerSprites;
    void this.gravityCapsuleButtonMarkerSprites;
    void this.activationNodeSprites;
    void this.activationNodeMarkerSprites;
    void this.enemySprites;
    void this.enemyAccentSprites;
    void this.checkpointSprites;
    void this.collectibleSprites;
    void this.projectileSprites;
    void this.rewardBlockSprites;
    void this.rewardBlockLabels;
    void this.rewardRevealTexts;
    void this.hazardSprites;
    void this.enemyDefeatVisibleUntilMs;
    void this.playerDefeatVisibleUntilMs;
    void this.playerDefeatResetPending;
    void this.feedbackCounts;
    void this.setPauseOverlayVisible;
    void this.setStageStartArrivalVisible;
    return this as unknown as GameSceneCleanupContext;
  }

  private getBaseDisplayContext(): GameSceneBaseDisplayContext {
    void this.retroPalette;
    void this.gravityZoneSprites;
    void this.gravityFieldSprites;
    void this.gravityFieldCategoryMarkerSprites;
    void this.gravityCapsuleShellSprites;
    void this.gravityCapsuleEntryDoorSprites;
    void this.gravityCapsuleExitDoorSprites;
    void this.gravityCapsuleButtonSprites;
    void this.gravityCapsuleButtonCoreSprites;
    void this.gravityCapsuleShellMarkerSprites;
    void this.gravityCapsuleButtonMarkerSprites;
    void this.activationNodeSprites;
    void this.activationNodeMarkerSprites;
    void this.platformSprites;
    void this.platformShadowSprites;
    void this.platformDetailSprites;
    void this.platformCategoryMarkerSprites;
    void this.terrainVariantSprites;
    void this.terrainVariantShadowSprites;
    void this.terrainVariantAccentSprites;
    void this.terrainVariantDetailSprites;
    void this.checkpointSprites;
    void this.collectibleSprites;
    void this.rewardBlockSprites;
    void this.rewardBlockLabels;
    void this.enemySprites;
    void this.enemyAccentSprites;
    void this.playerAnchor;
    void this.playerAura;
    void this.player;
    void this.playerHelmet;
    void this.playerVisor;
    void this.playerChest;
    void this.playerBelt;
    void this.playerPack;
    void this.playerArmLeft;
    void this.playerArmRight;
    void this.playerBootLeft;
    void this.playerBootRight;
    void this.playerKneeLeft;
    void this.playerKneeRight;
    void this.playerHeadband;
    void this.playerAccent;
    void this.playerWingLeft;
    void this.playerWingRight;
    void this.exitShell;
    void this.exitDoor;
    void this.exitBase;
    void this.exitBaseShadow;
    void this.exitBeacon;
    void this.arrivalBase;
    void this.arrivalBaseShadow;
    void this.arrivalBeacon;
    void this.arrivalShell;
    void this.arrivalDoor;
    void this.arrivalAura;
    void this.arrivalPlayer;
    void this.pauseOverlay;
    void this.pauseText;
    void this.gravityFieldColor;
    void this.gravityFieldAlpha;
    void this.gravityCapsuleShellColor;
    void this.gravityCapsuleShellAlpha;
    void this.gravityCapsuleShellStrokeColor;
    void this.gravityCapsuleEntryDoorColor;
    void this.gravityCapsuleExitDoorColor;
    void this.gravityCapsuleDoorAlpha;
    void this.gravityCapsuleButtonColor;
    void this.gravityCapsuleButtonCoreColor;
    void this.activationNodeColor;
    void this.platformColor;
    void this.platformDetailColor;
    void this.terrainVariantColor;
    void this.terrainVariantAlpha;
    void this.terrainVariantAccentColor;
    void this.rewardBlockColor;
    void this.rewardBlockLabel;
    void this.createTraversalMarkerRects;
    void this.drawHazard;
    return this as unknown as GameSceneBaseDisplayContext;
  }

  private getPlatformRenderingContext(): GameScenePlatformRenderingContext {
    void this.bridge;
    void this.retroPalette;
    void this.platformSprites;
    void this.platformShadowSprites;
    void this.platformDetailSprites;
    void this.platformCategoryMarkerSprites;
    void this.activationNodeSprites;
    void this.activationNodeMarkerSprites;
    void this.terrainVariantSprites;
    void this.terrainVariantShadowSprites;
    void this.terrainVariantAccentSprites;
    void this.terrainVariantDetailSprites;
    void this.platformColor;
    void this.platformDetailColor;
    void this.activationNodeColor;
    void this.terrainVariantColor;
    void this.terrainVariantAlpha;
    void this.terrainVariantStrokeColor;
    void this.terrainVariantStrokeAlpha;
    void this.terrainVariantShadowAlpha;
    void this.terrainVariantAccentY;
    void this.terrainVariantAccentWidth;
    void this.terrainVariantAccentHeight;
    void this.terrainVariantAccentColor;
    void this.terrainVariantAccentAlpha;
    void this.syncStickyTerrainVariantDetails;
    void this.syncBrittleTerrainVariantDetails;
    return this as unknown as GameScenePlatformRenderingContext;
  }

  private getGravityRenderingContext(): GameSceneGravityRenderingContext {
    void this.bridge;
    void this.retroPalette;
    void this.gravityFieldSprites;
    void this.gravityFieldCategoryMarkerSprites;
    void this.gravityCapsuleShellSprites;
    void this.gravityCapsuleEntryDoorSprites;
    void this.gravityCapsuleExitDoorSprites;
    void this.gravityCapsuleButtonSprites;
    void this.gravityCapsuleButtonCoreSprites;
    void this.gravityCapsuleShellMarkerSprites;
    void this.gravityCapsuleButtonMarkerSprites;
    void this.gravityFieldColor;
    void this.gravityFieldAlpha;
    void this.gravityCapsuleShellColor;
    void this.gravityCapsuleShellAlpha;
    void this.gravityCapsuleShellStrokeColor;
    void this.gravityCapsuleEntryDoorColor;
    void this.gravityCapsuleExitDoorColor;
    void this.gravityCapsuleDoorAlpha;
    void this.gravityCapsuleButtonColor;
    void this.gravityCapsuleButtonCoreColor;
    return this as unknown as GameSceneGravityRenderingContext;
  }

  private getRewardRenderingContext(): GameSceneRewardRenderingContext {
    void this.retroPalette;
    void this.checkpointSprites;
    void this.checkpointContactStrips;
    void this.collectibleSprites;
    void this.rewardBlockSprites;
    void this.rewardBlockLabels;
    void this.rewardRevealTexts;
    void this.rewardBlockColor;
    void this.rewardBlockLabel;
    void this.rewardRevealText;
    void this.rewardRevealColor;
    return this as unknown as GameSceneRewardRenderingContext;
  }

  private getEnemyRenderingContext(): GameSceneEnemyRenderingContext {
    void this.retroPalette;
    void this.hazardSprites;
    void this.enemySprites;
    void this.enemyContactStrips;
    void this.enemyAccentSprites;
    void this.projectileSprites;
    void this.enemyDefeatVisibleUntilMs;
    return this as unknown as GameSceneEnemyRenderingContext;
  }

  private getDiagnosticContext(): GameSceneDiagnosticContext {
    return this as unknown as GameSceneDiagnosticContext;
  }

  create(): void {
    this.bridge = this.registry.get('bridge') as SceneBridge;
    this.audio = new SynthAudio(this, () => this.bridge.getSession().getState().progress.runSettings.masterVolume);
    this.completeTransitionEvent = undefined;
    ensureBootTexturesRegistered(this);
    setupGameSceneHud(this.getHudSetupContext());

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
    this.playerDefeatVisibleUntilMs = Number.NEGATIVE_INFINITY;
    this.playerDefeatResetPending = false;
    this.enemyDefeatVisibleUntilMs.clear();
    this.stageStartArrivalTimerMs = STAGE_START_SEQUENCE_DURATION_MS;
    this.stageStartCapsuleLayout = getStageStartCapsuleLayout(
      resolveStageStartCapsuleAnchor(state.stage.startCabin),
      state.player,
    );
    this.gameplayMusicStarted = false;
    createBaseDisplayObjects(this.getBaseDisplayContext(), state);

    this.setupInput();
    this.cameras.main.startFollow(this.playerAnchor, true, 0.08, 0.08);
    this.syncView();
    this.bridge.syncHud(this.hud);
    this.startGameplayMusicIfReady();

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
    const arrivalActive = this.isStageStartArrivalActive();
    if (arrivalActive) {
      this.updateStageStartArrival(delta);
    } else {
      this.bridge.consumeFrame(delta);
    }
    const state = this.bridge.getSession().getState();
    if (!arrivalActive) {
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
    }
    this.syncView();
    this.bridge.syncHud(this.hud);

    if (!arrivalActive && state.levelJustCompleted && !this.completeTransitionEvent) {
      this.completeTransitionEvent = this.time.delayedCall(COMPLETE_TRANSITION_DELAY_MS, () => {
        this.completeTransitionEvent = undefined;
        this.scene.start('complete');
      });
    }
  }

  private handleShutdown(): void {
    cleanupGameScene(this.getCleanupContext());
  }

  private setupInput(): void {
    setupGameSceneInput(this.getInputContext());
  }

  private drawHazard(hazard: { id?: string; kind: string; rect: { x: number; y: number; width: number; height: number } }): void {
    drawHazardRendering(this.getEnemyRenderingContext(), hazard as never);
  }

  private createTraversalMarkerRects(count: number, depth: number): Phaser.GameObjects.Rectangle[] {
    return Array.from({ length: count }, () =>
      this.add.rectangle(0, 0, 6, 6, this.retroPalette.bright, 0.5).setOrigin(0.5).setDepth(depth).setVisible(false),
    );
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
    const playerDefeatHoldActive = player.dead && this.time.now < this.playerDefeatVisibleUntilMs;
    if (this.playerDefeatResetPending && !playerDefeatHoldActive) {
      this.resetPlayerDefeatPresentation();
      this.playerDefeatResetPending = false;
    }
    const playerVisible =
      (!player.dead || playerDefeatHoldActive) && !state.player.suppressPresentation && !this.isStageStartArrivalActive();
    const variantKey = state.player.presentationPower ?? 'base';
    const variant = PLAYER_POWER_VARIANTS[variantKey];
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const facing = player.facing;
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
    const torsoHeight = effectivePose.state === 'dash' ? 16 : effectivePose.state === 'fall' ? 18 : 17;
    const torsoY = player.y + 13 + effectivePose.bodyOffsetY;
    const armSwing =
      effectivePose.state === 'run-a'
        ? -2
        : effectivePose.state === 'run-b'
          ? 2
          : effectivePose.state === 'jump'
            ? -3
            : effectivePose.state === 'fall'
              ? 1
              : effectivePose.state === 'dash'
                ? 4
                : 0;
    const leftArmY = player.y + 15 + effectivePose.chestOffsetY + (facing === 1 ? -armSwing : armSwing);
    const rightArmY = player.y + 15 + effectivePose.chestOffsetY + (facing === 1 ? armSwing : -armSwing);
    const visorX = facing === 1 ? player.x + 8 : player.x + 6;
    const packX = facing === 1 ? player.x + 2 : player.x + player.width - 8;
    const chestX = player.x + 8;
    this.playerAnchor.setPosition(player.x, player.y).setSize(player.width, player.height);
    this.player.setVisible(playerVisible);
    this.playerHelmet.setVisible(playerVisible);
    this.playerVisor.setVisible(playerVisible);
    this.playerChest.setVisible(playerVisible);
    this.playerBelt.setVisible(playerVisible);
    this.playerPack.setVisible(playerVisible);
    this.playerArmLeft.setVisible(playerVisible);
    this.playerArmRight.setVisible(playerVisible);
    this.playerBootLeft.setVisible(playerVisible);
    this.playerBootRight.setVisible(playerVisible);
    this.playerKneeLeft.setVisible(playerVisible);
    this.playerKneeRight.setVisible(playerVisible);
    this.player.setPosition(player.x + 5, torsoY).setSize(14, torsoHeight);
    this.player.setAlpha(playerDefeatHoldActive ? 1 : player.invulnerableMs > 0 && Math.floor(player.invulnerableMs / 90) % 2 === 0 ? 0.45 : 1);
    this.player.setFillStyle(variant.bodyColor);
    this.player.setStrokeStyle(2, variant.detailColor, 0.95);
    this.playerHelmet
      .setPosition(player.x + 4, player.y + 2 + effectivePose.helmetOffsetY)
      .setSize(16, 11)
      .setFillStyle(variant.bodyColor)
      .setStrokeStyle(2, variant.detailColor, 0.95);
    this.playerVisor.setPosition(visorX, player.y + 6 + effectivePose.helmetOffsetY).setSize(8, 5).setFillStyle(variant.accentColor);
    this.playerChest
      .setPosition(chestX, player.y + 18 + effectivePose.chestOffsetY)
      .setSize(8, 6)
      .setFillStyle(variant.accentColor)
      .setAlpha(playerDefeatHoldActive ? 1 : this.player.alpha * 0.9);
    this.playerBelt
      .setPosition(player.x + 6, player.y + 25 + effectivePose.bodyOffsetY)
      .setSize(12, 3)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerPack
      .setPosition(packX, player.y + 13 + effectivePose.packOffsetY)
      .setSize(6, 14)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerArmLeft
      .setPosition(player.x + 2, leftArmY)
      .setSize(4, effectivePose.state === 'dash' ? 10 : 12)
      .setFillStyle(variant.bodyColor)
      .setAlpha(this.player.alpha);
    this.playerArmRight
      .setPosition(player.x + player.width - 6, rightArmY)
      .setSize(4, effectivePose.state === 'dash' ? 10 : 12)
      .setFillStyle(variant.bodyColor)
      .setAlpha(this.player.alpha);
    this.playerBootLeft
      .setPosition(player.x + 4, player.y + player.height - 6 + effectivePose.bootLeftOffsetY)
      .setSize(6, 6)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerBootRight
      .setPosition(player.x + player.width - 10, player.y + player.height - 6 + effectivePose.bootRightOffsetY)
      .setSize(6, 6)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerKneeLeft
      .setPosition(player.x + 6, player.y + player.height - 12 + effectivePose.kneeLeftOffsetY)
      .setSize(4, 5)
      .setFillStyle(variant.accentColor)
      .setAlpha(this.player.alpha * 0.85);
    this.playerKneeRight
      .setPosition(player.x + player.width - 10, player.y + player.height - 12 + effectivePose.kneeRightOffsetY)
      .setSize(4, 5)
      .setFillStyle(variant.accentColor)
      .setAlpha(this.player.alpha * 0.85);
    const auraStep = getRetroMotionStep(this.time.now + centerX, 110, 3);
    const auraAlpha = ([0.14, 0.2, 0.28][auraStep] ?? 0.14) + effectivePose.auraAlpha;
    this.playerAura
      .setPosition(centerX, centerY)
      .setFillStyle(variant.auraColor ?? variant.accentColor, variant.auraColor ? 0.24 : 0.12)
      .setVisible(playerVisible && Boolean(variant.auraColor))
      .setAlpha(variant.auraColor ? auraAlpha : 0);
    if (playerDefeatHoldActive) {
      this.player.setFillStyle(this.retroPalette.bright);
      this.player.setStrokeStyle(3, this.retroPalette.alert, 1);
      this.playerHelmet.setFillStyle(this.retroPalette.alert);
      this.playerVisor.setFillStyle(this.retroPalette.bright);
      this.playerChest.setFillStyle(this.retroPalette.alert).setAlpha(1);
      this.playerBelt.setFillStyle(this.retroPalette.bright);
      this.playerPack.setFillStyle(this.retroPalette.alert);
      this.playerArmLeft.setFillStyle(this.retroPalette.alert);
      this.playerArmRight.setFillStyle(this.retroPalette.alert);
      this.playerBootLeft.setFillStyle(this.retroPalette.bright);
      this.playerBootRight.setFillStyle(this.retroPalette.bright);
      this.playerKneeLeft.setFillStyle(this.retroPalette.bright);
      this.playerKneeRight.setFillStyle(this.retroPalette.bright);
      this.setPlayerVisualDepths(12, 13);
    }
    this.playerHeadband.setVisible(false);
    this.playerAccent.setVisible(false);
    this.playerWingLeft.setVisible(false);
    this.playerWingRight.setVisible(false);
    if (playerVisible) {
      this.syncPlayerAccessories(variantKey, variant, player, effectivePose);
    }
    this.applyExitFinishPresentation(state);
    this.applyStageStartArrivalPresentation(state);

    for (const platform of state.stageRuntime.platforms) {
      this.syncPlatform(platform);
    }

    for (const terrainVariantPlatform of state.stageRuntime.platforms.filter((platform) => platform.surfaceMechanic)) {
      this.syncTerrainVariantPlatform(terrainVariantPlatform);
    }

    for (const gravityField of state.stageRuntime.gravityFields) {
      this.syncGravityField(gravityField);
    }

    for (const gravityCapsule of state.stageRuntime.gravityCapsules) {
      this.syncGravityCapsule(gravityCapsule);
    }

    for (const activationNode of state.stageRuntime.activationNodes) {
      this.syncActivationNode(activationNode);
    }

    const platformTopById = new Map(state.stageRuntime.platforms.map((platform) => [platform.id, platform.y] as const));

    for (const checkpoint of state.stageRuntime.checkpoints) {
      this.syncCheckpoint(checkpoint, platformTopById);
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

    if (!state.exitFinish.active) {
      this.exitBase
        .setFillStyle(this.retroPalette.panelAlt, 0.94)
        .setScale(1, 1)
        .setAlpha(1);
      this.exitBaseShadow.setAlpha(0.26).setScale(1, 1);
      this.exitBeacon
        .setFillStyle(state.stageRuntime.exitReached ? this.retroPalette.cool : this.retroPalette.bright, state.stageRuntime.exitReached ? 0.86 : 0.78)
        .setScale(1, 1)
        .setAlpha(state.stageRuntime.exitReached ? 0.9 : 0.78);
      this.exitShell
        .setAlpha(state.stageRuntime.exitReached ? 0.68 : 1)
        .setScale(1, 1)
        .setTint(this.retroPalette.warm);
      this.exitDoor
        .setTexture(EXIT_CAPSULE_TEXTURE_KEYS.door)
        .setDisplaySize(EXIT_CAPSULE_ART_BOUNDS.door.width, EXIT_CAPSULE_ART_BOUNDS.door.height)
        .setTint(state.stageRuntime.exitReached ? this.retroPalette.border : this.retroPalette.ink)
        .setAlpha(state.stageRuntime.exitReached ? 0.76 : 0.88)
        .setVisible(true);
    }

    // Diagnostic: render debug lines showing platform tops (green) vs object bottoms (red/blue)
    renderDiagnosticOverlay(
      this.getDiagnosticContext(),
      state.stageRuntime.platforms,
      state.stageRuntime.checkpoints,
      state.stageRuntime.enemies,
    );
  }

  getDebugSnapshot(): {
    runPaused: boolean;
    pauseOverlayVisible: boolean;
    pauseText: string | null;
    hudVisible: boolean;
    stageStartArrivalActive: boolean;
    stageStartArrivalTimerMs: number;
    stageStartArrivalProgress: number;
    stageStartCapsulePhase: StageStartCapsulePhase;
    stageStartCapsuleDoorClosedProgress: number;
    stageStartWalkoutProgress: number;
    stageStartControlLocked: boolean;
    arrivalCapsuleVisible: boolean;
    arrivalPlayerVisible: boolean;
    arrivalPlayerX: number;
    persistentStartCapsuleVisible: boolean;
    arrivalCapsuleCenterX: number;
    arrivalCapsuleCenterY: number;
    arrivalCapsuleBaseY: number;
    arrivalCapsuleShellWidth: number;
    arrivalCapsuleDoorWidth: number;
    arrivalCapsuleShellTextureKey: string;
    arrivalCapsuleDoorTextureKey: string;
    arrivalCapsuleUsesExitArt: boolean;
    gameplayMusicStarted: boolean;
    exitFinishActive: boolean;
    exitFinishTimerMs: number;
    exitDoorWidth: number;
    exitDoorTextureKey: string;
    exitDoorVisible: boolean;
    exitDoorOpenProgress: number;
    playerVisualVisibleCount: number;
    exitSpriteTextureKey: string;
    exitSpriteAlpha: number;
    exitBaseVisible: boolean;
    exitBeaconVisible: boolean;
    playerPose: ReturnType<typeof getRetroPlayerPose>['state'];
    feedbackCounts: Record<string, number>;
    terrainVariantVisuals: {
      id: string;
      visualCategory: TraversalVisualCategory;
      kind: NonNullable<PlatformState['surfaceMechanic']>['kind'];
      x: number;
      y: number;
      width: number;
      height: number;
      visible: boolean;
      fillColor: number;
      fillAlpha: number;
      accentColor: number;
      accentAlpha: number;
      detailVisibleCount: number;
      detailWidths: number[];
      detailHeights: number[];
      detailOffsets: { x: number; y: number }[];
    }[];
    platformVisuals: {
      id: string;
      kind: PlatformState['kind'];
      visualCategory: TraversalVisualCategory;
      revealId: string | null;
      temporaryBridgeScannerId: string | null;
      magneticPowered: boolean;
      visible: boolean;
      fillColor: number;
      alpha: number;
      markerVisibleCount: number;
    }[];
    gravityFieldVisuals: {
      id: string;
      visualCategory: TraversalVisualCategory;
      x: number;
      y: number;
      width: number;
      height: number;
      visible: boolean;
      fillColor: number;
      fillAlpha: number;
      markerVisibleCount: number;
    }[];
    gravityCapsuleVisuals: {
      id: string;
      enabled: boolean;
      shellVisualCategory: TraversalVisualCategory;
      buttonVisualCategory: TraversalVisualCategory;
      shellVisible: boolean;
        entryDoorVisible: boolean;
        exitDoorVisible: boolean;
      buttonVisible: boolean;
      buttonActivated: boolean;
      shellFillColor: number;
      shellFillAlpha: number;
        entryDoorFillColor: number;
        exitDoorFillColor: number;
      buttonFillColor: number;
      buttonCoreFillColor: number;
      shellMarkerVisibleCount: number;
      buttonMarkerVisibleCount: number;
    }[];
    enemyVisuals: {
      id: string;
      kind: EnemyState['kind'];
      visible: boolean;
      tint: number;
    }[];
    activationNodeVisuals: {
      id: string;
      visualCategory: TraversalVisualCategory;
      x: number;
      y: number;
      width: number;
      height: number;
      visible: boolean;
      fillColor: number;
      markerVisibleCount: number;
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
      stageStartArrivalActive: this.isStageStartArrivalActive(),
      stageStartArrivalTimerMs: this.stageStartArrivalTimerMs,
      stageStartArrivalProgress: this.getStageStartArrivalProgress(),
      stageStartCapsulePhase: this.getStageStartCapsulePhase(),
      stageStartCapsuleDoorClosedProgress: this.getStageStartCapsuleDoorClosedProgress(),
      stageStartWalkoutProgress: this.getStageStartSequenceState().walkoutProgress,
      stageStartControlLocked: this.getStageStartSequenceState().playerControlLocked,
      arrivalCapsuleVisible: this.arrivalShell.visible,
      arrivalPlayerVisible: this.arrivalPlayer.visible,
      arrivalPlayerX: this.arrivalPlayer.x,
      persistentStartCapsuleVisible: !this.isStageStartArrivalActive() && this.arrivalShell.visible,
      arrivalCapsuleCenterX: this.arrivalShell.x,
      arrivalCapsuleCenterY: this.arrivalShell.y,
      arrivalCapsuleBaseY: this.arrivalBase.y,
      arrivalCapsuleShellWidth: this.arrivalShell.displayWidth,
      arrivalCapsuleDoorWidth: this.arrivalDoor.displayWidth,
      arrivalCapsuleShellTextureKey: this.arrivalShell.texture.key,
      arrivalCapsuleDoorTextureKey: this.arrivalDoor.texture.key,
      arrivalCapsuleUsesExitArt:
        this.arrivalShell.texture.key === EXIT_CAPSULE_TEXTURE_KEYS.shell &&
        this.arrivalDoor.texture.key === EXIT_CAPSULE_TEXTURE_KEYS.door,
      gameplayMusicStarted: this.gameplayMusicStarted,
      exitFinishActive: state.exitFinish.active,
      exitFinishTimerMs: state.exitFinish.timerMs,
      exitDoorWidth: this.exitDoor.displayWidth,
      exitDoorTextureKey: this.exitDoor.texture.key,
      exitDoorVisible: this.exitDoor.visible,
      exitDoorOpenProgress: getExitFinishDoorOpenProgress(this.getExitFinishProgress(state)),
      playerVisualVisibleCount: this.getPlayerVisualTargets().filter(
        (target) => (target as Phaser.GameObjects.GameObject & { visible?: boolean }).visible,
      ).length,
      exitSpriteTextureKey: this.exitShell.texture.key,
      exitSpriteAlpha: this.exitShell.alpha,
      exitBaseVisible: this.exitBase.visible,
      exitBeaconVisible: this.exitBeacon.visible,
      playerPose,
      feedbackCounts: {
        ...this.feedbackCounts,
        jump: Math.max(this.feedbackCounts.jump ?? 0, jumpFeedbackVisible ? 1 : 0),
        playerDefeat: Math.max(this.feedbackCounts.playerDefeat ?? 0, state.player.dead ? 1 : 0),
      },
      terrainVariantVisuals: this.bridge
        .getSession()
        .getState()
        .stageRuntime.platforms.filter((platform) => platform.surfaceMechanic).map((platform) => ({
          id: platform.id,
          visualCategory: getTerrainTraversalVisualCategory(platform),
          kind: platform.surfaceMechanic!.kind,
          x: platform.x,
          y: platform.y,
          width: platform.width,
          height: platform.height,
          visible: this.terrainVariantSprites.get(platform.id)?.visible ?? false,
          fillColor: this.terrainVariantSprites.get(platform.id)?.fillColor ?? 0,
          fillAlpha: this.terrainVariantSprites.get(platform.id)?.fillAlpha ?? 0,
          accentColor: this.terrainVariantAccentSprites.get(platform.id)?.fillColor ?? 0,
          accentAlpha: this.terrainVariantAccentSprites.get(platform.id)?.fillAlpha ?? 0,
          detailVisibleCount:
            this.terrainVariantDetailSprites.get(platform.id)?.filter((detail) => detail.visible).length ?? 0,
          detailWidths: this.terrainVariantDetailSprites.get(platform.id)?.map((detail) => detail.width) ?? [],
          detailHeights: this.terrainVariantDetailSprites.get(platform.id)?.map((detail) => detail.height) ?? [],
          detailOffsets:
            this.terrainVariantDetailSprites.get(platform.id)?.map((detail) => ({
              x: Math.round(detail.x - (platform.x + platform.width / 2)),
              y: Math.round(detail.y - (platform.y + platform.height / 2)),
            })) ?? [],
        })),
      platformVisuals: this.bridge
        .getSession()
        .getState()
        .stageRuntime.platforms.map((platform) => ({
          id: platform.id,
          kind: platform.kind,
          visualCategory: getPlatformTraversalVisualCategory(platform),
          revealId: platform.reveal?.id ?? null,
          temporaryBridgeScannerId: platform.temporaryBridge?.scannerId ?? null,
          magneticPowered: platform.magnetic?.powered ?? false,
          visible:
            (this.platformSprites.get(platform.id)?.visible ?? false) ||
            isPlatformVisible(platform, state.stageRuntime.revealedPlatformIds, activeTemporaryBridgeIds),
          fillColor: this.platformSprites.get(platform.id)?.fillColor ?? 0,
          alpha: this.platformSprites.get(platform.id)?.alpha ?? 0,
          markerVisibleCount: this.platformCategoryMarkerSprites.get(platform.id)?.filter((marker) => marker.visible).length ?? 0,
        })),
      gravityFieldVisuals: this.bridge
        .getSession()
        .getState()
        .stageRuntime.gravityFields.map((field) => {
          const capsule = field.gravityCapsuleId
            ? state.stageRuntime.gravityCapsules.find((entry) => entry.id === field.gravityCapsuleId) ?? null
            : null;
          return {
            id: field.id,
            visualCategory: getGravityFieldTraversalVisualCategory(field, capsule),
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            visible: this.gravityFieldSprites.get(field.id)?.visible ?? false,
            fillColor: this.gravityFieldSprites.get(field.id)?.fillColor ?? 0,
            fillAlpha: this.gravityFieldSprites.get(field.id)?.fillAlpha ?? 0,
            markerVisibleCount:
              this.gravityFieldCategoryMarkerSprites.get(field.id)?.filter((marker) => marker.visible).length ?? 0,
          };
        }),
      gravityCapsuleVisuals: this.bridge
        .getSession()
        .getState()
        .stageRuntime.gravityCapsules.map((capsule) => ({
          id: capsule.id,
          enabled: capsule.enabled,
          shellVisualCategory: getGravityCapsuleShellTraversalVisualCategory(capsule),
          buttonVisualCategory: getGravityCapsuleButtonTraversalVisualCategory(capsule),
          shellVisible: this.gravityCapsuleShellSprites.get(capsule.id)?.visible ?? false,
          entryDoorVisible: this.gravityCapsuleEntryDoorSprites.get(capsule.id)?.visible ?? false,
          exitDoorVisible: this.gravityCapsuleExitDoorSprites.get(capsule.id)?.visible ?? false,
          buttonVisible: this.gravityCapsuleButtonSprites.get(capsule.id)?.visible ?? false,
          buttonActivated: capsule.button.activated,
          shellFillColor: this.gravityCapsuleShellSprites.get(capsule.id)?.fillColor ?? 0,
          shellFillAlpha: this.gravityCapsuleShellSprites.get(capsule.id)?.fillAlpha ?? 0,
          entryDoorFillColor: this.gravityCapsuleEntryDoorSprites.get(capsule.id)?.fillColor ?? 0,
          exitDoorFillColor: this.gravityCapsuleExitDoorSprites.get(capsule.id)?.fillColor ?? 0,
          buttonFillColor: this.gravityCapsuleButtonSprites.get(capsule.id)?.fillColor ?? 0,
          buttonCoreFillColor: this.gravityCapsuleButtonCoreSprites.get(capsule.id)?.fillColor ?? 0,
          shellMarkerVisibleCount:
            this.gravityCapsuleShellMarkerSprites.get(capsule.id)?.filter((marker) => marker.visible).length ?? 0,
          buttonMarkerVisibleCount:
            this.gravityCapsuleButtonMarkerSprites.get(capsule.id)?.filter((marker) => marker.visible).length ?? 0,
        })),
      enemyVisuals: this.bridge
        .getSession()
        .getState()
        .stageRuntime.enemies.map((enemy) => ({
          id: enemy.id,
          kind: enemy.kind,
          visible: this.enemySprites.get(enemy.id)?.visible ?? false,
          tint: this.enemySprites.get(enemy.id)?.tintTopLeft ?? 0,
        })),
      activationNodeVisuals: this.bridge
        .getSession()
        .getState()
        .stageRuntime.activationNodes.map((node) => ({
          id: node.id,
          visualCategory: getActivationNodeTraversalVisualCategory(node),
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          visible: this.activationNodeSprites.get(node.id)?.visible ?? false,
          fillColor: this.activationNodeSprites.get(node.id)?.fillColor ?? 0,
          markerVisibleCount: this.activationNodeMarkerSprites.get(node.id)?.filter((marker) => marker.visible).length ?? 0,
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
    syncPlatformRendering(this.getPlatformRenderingContext(), platform);
  }

  private syncActivationNode(node: { id: string; x: number; y: number; width: number; height: number; activated: boolean }): void {
    syncActivationNodeRendering(this.getPlatformRenderingContext(), node as never);
  }

  private syncTerrainVariantPlatform(platform: PlatformState): void {
    syncTerrainVariantPlatformRendering(this.getPlatformRenderingContext(), platform);
  }

  private syncGravityField(field: GravityFieldState): void {
    syncGravityFieldRendering(this.getGravityRenderingContext(), field);
  }

  private syncGravityCapsule(capsule: GravityCapsuleState): void {
    syncGravityCapsuleRendering(this.getGravityRenderingContext(), capsule);
  }

  private syncBrittleTerrainVariantDetails(platform: PlatformState, details: Phaser.GameObjects.Rectangle[]): void {
    const broken = isBrittlePlatformBroken(platform);
    const warning = isBrittlePlatformWarning(platform);
    const ready = isBrittlePlatformReady(platform);
    const centerX = platform.x + platform.width / 2;
    const centerY = platform.y + platform.height / 2;
    const shardWidth = Math.max(6, Math.floor(platform.width * (broken ? 0.12 : ready ? 0.1 : 0.08)));
    const shardHeight = Math.max(4, Math.floor(platform.height * (broken ? 0.4 : ready ? 0.6 : 0.72)));
    const shardOffsets = [-0.28, 0, 0.28];
    const shardYOffsets = broken ? [0.12, 0.18, 0.08] : ready ? [0.02, -0.16, 0.04] : [0.06, -0.08, 0.1];
    const shardAlphas = broken ? [0.22, 0.16, 0.22] : ready ? [0.92, 1, 0.92] : warning ? [0.82, 0.96, 0.82] : [0.44, 0.66, 0.44];

    details.forEach((detail, index) => {
      detail
        .setPosition(centerX + platform.width * shardOffsets[index], centerY + platform.height * shardYOffsets[index])
        .setSize(index === 1 ? shardWidth + 2 : shardWidth, index === 1 ? shardHeight + (broken ? 0 : 2) : shardHeight)
        .setFillStyle(
          broken
            ? this.retroPalette.border
            : ready
              ? this.retroPalette.alert
              : warning
                ? this.retroPalette.bright
                : this.retroPalette.border,
          shardAlphas[index],
        )
        .setVisible(true);
    });
  }

  private syncStickyTerrainVariantDetails(platform: PlatformState, details: Phaser.GameObjects.Rectangle[]): void {
    const centerX = platform.x + platform.width / 2;
    const centerY = platform.y + platform.height / 2;
    const bandHeight = Math.max(2, Math.floor(platform.height * 0.24));
    const baseWidths = [0.84, 0.62, 0.74];
    const yOffsets = [-0.16, 0.04, 0.22];
    const driftStep = (this.time.now + platform.x) / 140;

    details.forEach((detail, index) => {
      const drift = Math.sin(driftStep + index * 0.9) * Math.max(4, platform.width * 0.04);
      const widthPulse = (Math.cos(driftStep * 1.2 + index) + 1) * Math.max(2, platform.width * 0.03);
      const bandWidth = Math.max(12, Math.floor(platform.width * baseWidths[index] - widthPulse));
      detail
        .setPosition(centerX + drift * (index === 1 ? -1 : 1), centerY + platform.height * yOffsets[index])
        .setSize(bandWidth, bandHeight)
        .setFillStyle(index === 1 ? this.retroPalette.warm : this.retroPalette.alert, index === 1 ? 0.34 : 0.46)
        .setVisible(true);
    });
  }

  private syncCheckpoint(checkpoint: CheckpointState, platformTopById: ReadonlyMap<string, number>): void {
    const supportTopY = checkpoint.supportPlatformId ? platformTopById.get(checkpoint.supportPlatformId) : undefined;
    syncCheckpointRendering(this.getRewardRenderingContext(), checkpoint, supportTopY);
  }

  private syncCollectible(collectible: CollectibleState): void {
    syncCollectibleRendering(this.getRewardRenderingContext(), collectible);
  }

  private syncRewardBlock(rewardBlock: RewardBlockState): void {
    syncRewardBlockRendering(this.getRewardRenderingContext(), rewardBlock);
  }

  private syncRewardReveal(rewardReveal: RewardRevealState): void {
    syncRewardRevealRendering(this.getRewardRenderingContext(), rewardReveal);
  }

  private syncEnemy(enemy: EnemyState): void {
    syncEnemyRendering(this.getEnemyRenderingContext(), enemy);
  }

  private syncProjectile(projectile: ProjectileState): void {
    syncProjectileRendering(this.getEnemyRenderingContext(), projectile);
  }

  private platformColor(platform: PlatformState): number {
    return platformColor(this.retroPalette, platform);
  }

  private platformDetailColor(platform: PlatformState): number {
    return platformDetailColor(this.retroPalette, platform);
  }

  private activationNodeColor(node: { activated: boolean }): number {
    return activationNodeColor(this.retroPalette, node);
  }

  private terrainVariantColor(platform: PlatformState): number {
    return terrainVariantColor(this.retroPalette, platform);
  }

  private terrainVariantAccentColor(platform: PlatformState): number {
    return terrainVariantAccentColor(this.retroPalette, platform);
  }

  private terrainVariantAlpha(platform: PlatformState): number {
    return terrainVariantAlpha(platform);
  }

  private terrainVariantStrokeColor(platform: PlatformState): number {
    return terrainVariantStrokeColor(this.retroPalette, platform);
  }

  private terrainVariantStrokeAlpha(platform: PlatformState): number {
    return terrainVariantStrokeAlpha(platform);
  }

  private terrainVariantShadowAlpha(platform: PlatformState): number {
    return terrainVariantShadowAlpha(platform);
  }

  private terrainVariantAccentY(platform: PlatformState): number {
    return terrainVariantAccentY(platform);
  }

  private terrainVariantAccentWidth(platform: PlatformState): number {
    return terrainVariantAccentWidth(platform);
  }

  private terrainVariantAccentHeight(platform: PlatformState): number {
    return terrainVariantAccentHeight(platform);
  }

  private terrainVariantAccentAlpha(platform: PlatformState): number {
    return terrainVariantAccentAlpha(platform);
  }

  private gravityFieldColor(field: GravityFieldState, capsule: GravityCapsuleState | null = null): number {
    return gravityFieldColor(this.retroPalette, field, capsule);
  }

  private gravityFieldAlpha(field: GravityFieldState, capsule: GravityCapsuleState | null = null): number {
    return gravityFieldAlpha(field, capsule);
  }

  private gravityCapsuleShellColor(capsule: GravityCapsuleState): number {
    return gravityCapsuleShellColor(capsule);
  }

  private gravityCapsuleShellAlpha(capsule: GravityCapsuleState): number {
    return gravityCapsuleShellAlpha(capsule);
  }

  private gravityCapsuleShellStrokeColor(capsule: GravityCapsuleState): number {
    return gravityCapsuleShellStrokeColor(capsule);
  }

  private gravityCapsuleEntryDoorColor(capsule: GravityCapsuleState): number {
    return gravityCapsuleEntryDoorColor(capsule);
  }

  private gravityCapsuleExitDoorColor(capsule: GravityCapsuleState): number {
    return gravityCapsuleExitDoorColor(capsule);
  }

  private gravityCapsuleDoorAlpha(capsule: GravityCapsuleState): number {
    return gravityCapsuleDoorAlpha(capsule);
  }

  private gravityCapsuleButtonColor(capsule: GravityCapsuleState): number {
    return gravityCapsuleButtonColor(this.retroPalette, capsule);
  }

  private gravityCapsuleButtonCoreColor(capsule: GravityCapsuleState): number {
    return gravityCapsuleButtonCoreColor(this.retroPalette, capsule);
  }

  private rewardBlockColor(rewardBlock: RewardBlockState): number {
    return rewardBlockColor(this.retroPalette, rewardBlock);
  }

  private rewardBlockLabel(rewardBlock: RewardBlockState): string {
    return rewardBlockLabel(rewardBlock);
  }

  private rewardRevealText(rewardReveal: RewardRevealState): string {
    return rewardRevealText(rewardReveal);
  }

  private rewardRevealColor(rewardReveal: RewardRevealState): string {
    return rewardRevealColor(rewardReveal);
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
          .setPosition(centerX, player.y + 11 + pose.headbandOffsetY)
          .setSize(14, 4)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerWingLeft
          .setPosition(player.x + 3, player.y + 23 + pose.wingLift)
          .setSize(5, 14)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        this.playerWingRight
          .setPosition(player.x + player.width - 3, player.y + 23 + pose.wingLift)
          .setSize(5, 14)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      case 'shooter':
        this.playerHeadband
          .setPosition(centerX, player.y + 11 + pose.headbandOffsetY)
          .setSize(12, 3)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX + facingOffset * 11, player.y + 23 + pose.accentOffsetY)
          .setSize(10, 8)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      case 'invincible':
        this.playerHeadband
          .setPosition(centerX, player.y + 8 + pose.headbandOffsetY)
          .setSize(18, 4)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX, player.y + 1 + pose.accentOffsetY)
          .setSize(8, 6)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        break;
      case 'dash':
        this.playerHeadband
          .setPosition(centerX, player.y + 27 + pose.headbandOffsetY)
          .setSize(12, 4)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX - facingOffset * 8, player.y + 25 + pose.accentOffsetY)
          .setSize(player.dashTimerMs > 0 ? 14 : 8, 7)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      default:
        this.playerHeadband
          .setPosition(centerX, player.y + 28 + pose.headbandOffsetY)
          .setSize(10, 3)
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
            spawnRetroDefeatFlash(this, event.x, event.y, tint, event.cause === 'stomp' ? 'stomp' : 'plasma-blast');
            this.triggerEnemyDefeatFeedback(event.id, event.cause);
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
      this.playerArmLeft,
      this.playerArmRight,
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

  private getExitFinishProgress(state: Readonly<SessionSnapshot>): number {
    if (!state.exitFinish.active || state.exitFinish.durationMs <= 0) {
      return 0;
    }

    return Phaser.Math.Clamp(1 - state.exitFinish.timerMs / state.exitFinish.durationMs, 0, 1);
  }

  private isStageStartArrivalActive(): boolean {
    return this.stageStartArrivalTimerMs > 0;
  }

  private getStageStartArrivalProgress(): number {
    return this.getStageStartSequenceState().overallProgress;
  }

  private getStageStartCapsuleDoorClosedProgress(): number {
    return this.getStageStartSequenceState().doorClosedProgress;
  }

  private getStageStartCapsulePhase(): StageStartCapsulePhase {
    return this.getStageStartSequenceState().phase;
  }

  private getStageStartSequenceState() {
    return getStageStartSequenceState(this.stageStartArrivalTimerMs);
  }

  private updateStageStartArrival(deltaMs: number): void {
    this.bridge.resetGameplayInput();
    this.stageStartArrivalTimerMs = Math.max(0, this.stageStartArrivalTimerMs - deltaMs);
    if (this.stageStartArrivalTimerMs === 0) {
      this.startGameplayMusicIfReady();
    }
  }

  private setStageStartArrivalVisible(visible: boolean): void {
    this.arrivalBaseShadow.setVisible(visible);
    this.arrivalBase.setVisible(visible);
    this.arrivalBeacon.setVisible(visible);
    this.arrivalShell.setVisible(visible);
    this.arrivalDoor.setVisible(visible);
    this.arrivalAura.setVisible(visible);
    this.arrivalPlayer.setVisible(visible);
  }

  private startGameplayMusicIfReady(): void {
    if (this.gameplayMusicStarted || this.isStageStartArrivalActive()) {
      return;
    }

    this.audio.startStageMusic(this.bridge.getSession().getState().stage);
    this.gameplayMusicStarted = true;
  }

  private applyStageStartArrivalPresentation(state: Readonly<SessionSnapshot>): void {
    const layout = this.stageStartCapsuleLayout;
    const playerCenterX = layout.playerTargetX + state.player.width / 2;
    const playerCenterY = layout.playerY + state.player.height / 2;
    const sequence = this.getStageStartSequenceState();
    if (!this.isStageStartArrivalActive()) {
      this.arrivalBaseShadow
        .setPosition(layout.capsuleCenterX, layout.baseShadowY)
        .setScale(1, 1)
        .setAlpha(0.22)
        .setVisible(true);
      this.arrivalBase
        .setPosition(layout.capsuleCenterX, layout.baseY)
        .setScale(1, 1)
        .setFillStyle(this.retroPalette.panelAlt, 0.92)
        .setAlpha(0.92)
        .setVisible(true);
      this.arrivalBeacon
        .setPosition(layout.capsuleCenterX, layout.beaconY)
        .setFillStyle(this.retroPalette.cool, 0.34)
        .setScale(1, 1)
        .setAlpha(0.34)
        .setVisible(true);
      this.arrivalShell
        .setPosition(layout.capsuleCenterX, layout.capsuleCenterY)
        .setDisplaySize(EXIT_CAPSULE_ART_BOUNDS.shell.width, EXIT_CAPSULE_ART_BOUNDS.shell.height)
        .setTint(this.retroPalette.warm)
        .setScale(1, 1)
        .setAlpha(0.78)
        .setVisible(true);
      this.arrivalDoor
        .setPosition(layout.capsuleCenterX, layout.capsuleCenterY + 1)
        .setDisplaySize(EXIT_CAPSULE_ART_BOUNDS.door.width, EXIT_CAPSULE_ART_BOUNDS.door.height)
        .setTint(this.retroPalette.border)
        .setAlpha(0.82)
        .setVisible(true);
      this.arrivalAura.setVisible(false);
      this.arrivalPlayer.setVisible(false);
      return;
    }

    const flickerAlpha = sequence.phase === 'rematerialize' && Math.floor(this.time.now / 48) % 2 === 0 ? 0.58 : 1;
    const shellAlpha = Phaser.Math.Clamp(0.4 + (1 - sequence.overallProgress) * 0.28, 0.32, 0.72);
    const shellTint = sequence.phase === 'rematerialize' ? this.retroPalette.cool : this.retroPalette.warm;
    const doorWidth = Phaser.Math.Linear(
      CAPSULE_PRESENTATION.doorOpenWidth,
      CAPSULE_PRESENTATION.doorClosedWidth,
      sequence.doorClosedProgress,
    );
    const doorAlpha = Phaser.Math.Linear(0.22, 0.86, sequence.doorClosedProgress);
    const playerAlpha = Phaser.Math.Clamp((1 - sequence.doorClosedProgress * 0.9) * flickerAlpha, 0, 1);
    const walkoutStrideY = Math.sin(sequence.walkoutProgress * Math.PI * 2) * CAPSULE_PRESENTATION.walkoutLift;
    const arrivalPlayerX = Phaser.Math.Linear(layout.playerStartX, layout.playerTargetX, sequence.walkoutProgress);
    const arrivalPlayerY = layout.playerY + (1 - sequence.revealProgress) * 10 - walkoutStrideY;

    this.arrivalBaseShadow
      .setPosition(layout.capsuleCenterX, layout.baseShadowY)
      .setScale(1 + (1 - sequence.doorClosedProgress) * 0.08, 1)
      .setAlpha(0.2 + (1 - sequence.overallProgress) * 0.08)
      .setVisible(true);
    this.arrivalBase
      .setPosition(layout.capsuleCenterX, layout.baseY)
      .setScale(1 + (1 - sequence.doorClosedProgress) * 0.06, 1)
      .setFillStyle(sequence.phase === 'rematerialize' ? this.retroPalette.cool : this.retroPalette.panelAlt, 0.88)
      .setAlpha(0.88)
      .setVisible(true);
    this.arrivalBeacon
      .setPosition(layout.capsuleCenterX, layout.beaconY)
      .setFillStyle(sequence.phase === 'rematerialize' ? this.retroPalette.cool : this.retroPalette.bright, 0.82)
      .setScale(1 + (1 - sequence.overallProgress) * 0.14, 1 + (1 - sequence.overallProgress) * 0.1)
      .setAlpha(0.56 + sequence.revealProgress * 0.22 + Math.sin(this.time.now / 62) * 0.08)
      .setVisible(true);
    this.arrivalShell
      .setPosition(layout.capsuleCenterX, layout.capsuleCenterY)
      .setDisplaySize(EXIT_CAPSULE_ART_BOUNDS.shell.width, EXIT_CAPSULE_ART_BOUNDS.shell.height)
      .setTint(shellTint)
      .setScale(1, 1 - (1 - sequence.revealProgress) * 0.04)
      .setAlpha(shellAlpha)
      .setVisible(true);
    this.arrivalDoor
      .setPosition(layout.capsuleCenterX, layout.capsuleCenterY + 1)
      .setDisplaySize(doorWidth, EXIT_CAPSULE_ART_BOUNDS.door.height)
      .setTint(sequence.doorClosedProgress > 0.5 ? this.retroPalette.border : this.retroPalette.ink)
      .setAlpha(doorAlpha)
      .setVisible(doorAlpha > 0.02);
    this.arrivalAura
      .setPosition(Phaser.Math.Linear(layout.capsuleCenterX, playerCenterX, sequence.walkoutProgress * 0.8), playerCenterY - 2)
      .setSize(50 - sequence.overallProgress * 8, 66 - sequence.overallProgress * 10)
      .setFillStyle(this.retroPalette.cool, 0.22)
      .setAlpha(Phaser.Math.Clamp(0.58 - sequence.walkoutProgress * 0.28 - sequence.doorClosedProgress * 0.34, 0, 0.58))
      .setVisible(sequence.phase !== 'inert' && sequence.doorClosedProgress < 0.98);
    this.arrivalPlayer
      .setPosition(arrivalPlayerX, arrivalPlayerY)
      .setTint(sequence.phase === 'rematerialize' ? this.retroPalette.bright : this.retroPalette.cool)
      .setAlpha(playerAlpha)
      .setVisible(sequence.phase !== 'closing' && playerAlpha > 0.02);
  }

  private applyExitFinishPresentation(state: Readonly<SessionSnapshot>): void {
    const progress = this.getExitFinishProgress(state);
    if (progress <= 0) {
      return;
    }

    const capsuleCenterX = state.stage.exit.x + state.stage.exit.width / 2;
    const capsuleCenterY = state.stage.exit.y + state.stage.exit.height / 2;
    const playerCenterX = state.player.x + state.player.width / 2;
    const playerCenterY = state.player.y + state.player.height / 2;
    const shiftX = Phaser.Math.Linear(0, capsuleCenterX - playerCenterX, Math.min(1, progress * 1.18));
    const shiftY = Phaser.Math.Linear(0, capsuleCenterY - 20 - playerCenterY, Math.min(1, progress * 1.12));
    const flickerAlpha = progress > 0.18 && Math.floor(this.time.now / 45) % 2 === 0 ? 0.28 : 1;
    const doorOpenProgress = getExitFinishDoorOpenProgress(progress);
    const exitDoorWidth = Phaser.Math.Linear(
      CAPSULE_PRESENTATION.doorClosedWidth,
      CAPSULE_PRESENTATION.doorOpenWidth,
      doorOpenProgress,
    );
    const hidden = state.exitFinish.suppressPresentation;
    const collapseAlpha = hidden ? 0 : Phaser.Math.Clamp(1 - progress * 2.6, 0, 1) * flickerAlpha;

    for (const target of this.getPlayerVisualTargets()) {
      const shape = target as Phaser.GameObjects.Shape;
      shape.setPosition(shape.x + shiftX, shape.y + shiftY - progress * 10);
      shape.setVisible(!hidden && shape.visible);
      shape.setAlpha(shape.alpha * collapseAlpha);
    }

    this.playerAura
      .setPosition(capsuleCenterX, capsuleCenterY - 16)
      .setVisible(true)
      .setSize(34 + progress * 22, 48 + progress * 20)
      .setFillStyle(this.retroPalette.cool, 0.18 + progress * 0.42)
      .setAlpha(0.3 + progress * 0.55)
      .setDepth(11);

    this.exitBase
      .setFillStyle(progress > 0.5 ? this.retroPalette.cool : this.retroPalette.panelAlt, 0.92)
      .setScale(1 + progress * 0.08, 1)
      .setAlpha(0.92 + progress * 0.08);
    this.exitBaseShadow
      .setScale(1 + progress * 0.14, 1)
      .setAlpha(0.24 + progress * 0.12);
    this.exitBeacon
      .setFillStyle(progress > 0.45 ? this.retroPalette.cool : this.retroPalette.bright, 0.8 + progress * 0.18)
      .setScale(1 + progress * 0.18, 1 + progress * 0.12)
      .setAlpha(0.82 + progress * 0.16);

    this.exitShell
      .setTint(progress > 0.55 ? this.retroPalette.cool : this.retroPalette.warm)
      .setAlpha(0.88 + Math.sin(this.time.now / 55) * 0.12)
      .setScale(1 + progress * 0.06, 1 - progress * 0.03);
    this.exitDoor
      .setTexture(doorOpenProgress > 0 ? EXIT_CAPSULE_TEXTURE_KEYS.doorOpen : EXIT_CAPSULE_TEXTURE_KEYS.door)
      .setDisplaySize(exitDoorWidth, EXIT_CAPSULE_ART_BOUNDS.door.height)
      .setTint(progress > 0.42 ? this.retroPalette.cool : this.retroPalette.ink)
      .setAlpha(0.82 + doorOpenProgress * 0.12 + Math.sin(this.time.now / 70) * 0.04)
      .setVisible(true);
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
    spawnRetroDefeatFlash(this, x, y, this.retroPalette.alert, 'player-death');
    const defeatPreset = getRetroDefeatTweenPreset('player-death');
    this.playerDefeatVisibleUntilMs = Math.max(this.playerDefeatVisibleUntilMs, this.time.now + PLAYER_DEFEAT_VISIBLE_HOLD_MS);
    this.playerDefeatResetPending = true;
    playRetroDefeatTweenPreset(this, this.getPlayerVisualTargets(), 'player-death');
    this.setPlayerVisualDepths(defeatPreset.depth, defeatPreset.depth + 1);
    this.lastPlayerDefeatFeedbackAtMs = this.time.now;
    this.recordFeedback('playerDefeat');
  }

  private triggerEnemyDefeatFeedback(enemyId: string, cause: EnemyDefeatCause): void {
    const sprite = this.enemySprites.get(enemyId);
    if (!sprite) {
      return;
    }

    const presetName = cause === 'plasma-blast' ? 'plasma-blast' : 'stomp';
    const preset = getRetroDefeatTweenPreset(presetName);
    this.enemyDefeatVisibleUntilMs.set(enemyId, this.time.now + ENEMY_DEFEAT_VISIBLE_HOLD_MS);
    sprite.setVisible(true);
    sprite.setDepth(preset.depth);
    playRetroDefeatTweenPreset(this, sprite, presetName);
  }

  private resetPlayerDefeatPresentation(): void {
    resetRetroPresentationTargets(this, [
      { target: this.playerAura, depth: 5, visible: false, alpha: 0 },
      { target: this.playerPack, depth: 5, visible: true },
      { target: this.player, depth: 6, visible: true },
      { target: this.playerHelmet, depth: 7, visible: true },
      { target: this.playerVisor, depth: 7, visible: true },
      { target: this.playerChest, depth: 7, visible: true },
      { target: this.playerBelt, depth: 7, visible: true },
      { target: this.playerArmLeft, depth: 7, visible: true },
      { target: this.playerArmRight, depth: 7, visible: true },
      { target: this.playerBootLeft, depth: 7, visible: true },
      { target: this.playerBootRight, depth: 7, visible: true },
      { target: this.playerKneeLeft, depth: 7, visible: true },
      { target: this.playerKneeRight, depth: 7, visible: true },
      { target: this.playerHeadband, depth: 7, visible: false },
      { target: this.playerAccent, depth: 7, visible: false },
      { target: this.playerWingLeft, depth: 7, visible: false },
      { target: this.playerWingRight, depth: 7, visible: false },
    ]);
    this.playerDefeatVisibleUntilMs = Number.NEGATIVE_INFINITY;
  }

  private setPlayerVisualDepths(baseDepth: number, detailDepth: number): void {
    this.player.setDepth(baseDepth);
    this.playerHelmet.setDepth(detailDepth);
    this.playerVisor.setDepth(detailDepth);
    this.playerChest.setDepth(detailDepth);
    this.playerBelt.setDepth(detailDepth);
    this.playerPack.setDepth(detailDepth);
    this.playerArmLeft.setDepth(detailDepth);
    this.playerArmRight.setDepth(detailDepth);
    this.playerBootLeft.setDepth(detailDepth);
    this.playerBootRight.setDepth(detailDepth);
    this.playerKneeLeft.setDepth(detailDepth);
    this.playerKneeRight.setDepth(detailDepth);
    this.playerHeadband.setDepth(detailDepth);
    this.playerAccent.setDepth(detailDepth);
    this.playerWingLeft.setDepth(detailDepth);
    this.playerWingRight.setDepth(detailDepth);
  }
}
