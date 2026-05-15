import * as Phaser from 'phaser';
import { AUDIO_CUES, type AudioCue } from '../../audio/audioContract';
import type { SessionSnapshot } from '../../game/simulation/GameSession';
import { stageDefinitions } from '../../game/content/stages';
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
import { SceneBridge } from '../adapters/sceneBridge';
import { SynthAudio } from '../audio/SynthAudio';
import { applyConfiguredRetroPostFxToCamera } from '../retroPostFx';
import {
  createProjectileTrailEmitter,
  createBurstEffect,
  createCheckpointFireworkEffect,
  createMuzzleSmokeEffect,
  createFadingRegionEffect,
  updateTrailEmitter,
  ensureParticleTexture,

} from '../view/particleEffects';
import {
  CAPSULE_PRESENTATION,
  EXIT_CAPSULE_ART_BOUNDS,
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
  getRetroHitFlashBlend,
  getRetroHitFlashPreset,
  getRetroMotionStep,
  getRetroPlayerPose,
  mixColor,
  playRetroDefeatTweenPreset,
  playRetroTweenPreset,
  resetRetroPresentationTargets,
  snapRetroValue,
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
  type GameScenePlatformRenderingContext,
} from './gameScene/platformRendering';
import {
  syncCheckpoint as syncCheckpointRendering,
  syncCollectible as syncCollectibleRendering,
  syncRewardBlock as syncRewardBlockRendering,
  syncRewardReveal as syncRewardRevealRendering,
  type GameSceneRewardRenderingContext,
} from './gameScene/rewardRendering';
import { createRexHud } from '../ui/rexHud';
import { bindScaleOuter, getViewportMetrics } from '../ui/rexUiTheme';
import { drawAstronautGraphic } from '../view/runtimeCharacterGraphics';
import { drawTeleportMachineGraphic, drawTeleportShutterGraphic } from '../view/teleportMachineGraphics';

const COMPLETE_TRANSITION_DELAY_MS = 160;
const STAGE_START_SEQUENCE_DURATION_MS = getStageStartSequenceTotalMs();

export class GameScene extends Phaser.Scene {
  private bridge!: SceneBridge;

  private audio!: SynthAudio;

  private playerAnchor!: Phaser.GameObjects.Rectangle;

  private playerSprite!: Phaser.GameObjects.Graphics;

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

  private bottomMistSprites: Phaser.GameObjects.Shape[] = [];

  private currentPlayerPose: ReturnType<typeof getRetroPlayerPose>['state'] = 'idle';

  private jumpPoseHoldUntilMs = 0;

  private debugJumpPoseUntilMs = 0;

  private lastJumpFeedbackAtMs = Number.NEGATIVE_INFINITY;

  private lastPlayerDefeatFeedbackAtMs = Number.NEGATIVE_INFINITY;

  private playerDefeatFeedbackLatched = false;

  private playerHitFlashUntilMs = Number.NEGATIVE_INFINITY;

  private playerDefeatVisibleUntilMs = Number.NEGATIVE_INFINITY;

  private playerDefeatResetPending = false;

  private enemyDefeatVisibleUntilMs = new Map<string, number>();

  private enemyHitFlashUntilMs = new Map<string, number>();

  private platformSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private platformShadowSprites = new Map<string, Phaser.GameObjects.Rectangle | { layer: any; index: number }>();

  private platformDetailSprites = new Map<string, Phaser.GameObjects.Rectangle | { layer: any; index: number }>();


  private platformCategoryMarkerSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private terrainVariantSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private terrainVariantShadowSprites = new Map<string, Phaser.GameObjects.Rectangle | { layer: any; index: number }>();

  private terrainVariantAccentSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private terrainVariantDetailSprites = new Map<string, Array<Phaser.GameObjects.Rectangle | { layer: any; index: number }>>();

  private hazardSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private gravityZoneSprites: Phaser.GameObjects.Rectangle[] = [];

  private gravityFieldSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private gravityFieldCategoryMarkerSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private gravityCapsuleShellSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private gravityCapsuleEntryDoorSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private gravityCapsuleExitDoorSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private gravityCapsuleButtonSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private gravityCapsuleButtonCoreSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private gravityCapsuleShellMarkerSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private gravityCapsuleButtonMarkerSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private activationNodeSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private activationNodeMarkerSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private enemySprites = new Map<string, Phaser.GameObjects.Graphics>();

  private enemyContactStrips = new Map<string, Phaser.GameObjects.Rectangle>();

  private enemyAccentSprites = new Map<string, Phaser.GameObjects.Rectangle[]>();

  private checkpointSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private checkpointContactStrips = new Map<string, Phaser.GameObjects.Rectangle>();

  private collectibleSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private rewardBlockSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private rewardBlockIcons = new Map<string, Phaser.GameObjects.Graphics>();

  private rewardRevealTexts = new Map<string, Phaser.GameObjects.Text>();

  private projectileSprites = new Map<string, Phaser.GameObjects.Graphics>();

  private projectileTrailEmitters = new Map<string, Phaser.GameObjects.Particles.ParticleEmitter>();

  private transientParticleEffects = new Map<string, Phaser.GameObjects.Particles.ParticleEmitter>();

  private particleSequence = 0;

  private lastStageStartPhase: StageStartCapsulePhase | null = null;

  private exitTeleportBeamTriggered = false;

  private exitShell!: Phaser.GameObjects.Graphics;

  private exitDoor!: Phaser.GameObjects.Graphics;

  private exitBase!: Phaser.GameObjects.Image;

  private exitBaseShadow!: Phaser.GameObjects.Rectangle;

  private exitBeacon!: Phaser.GameObjects.Image;

  private arrivalBaseShadow!: Phaser.GameObjects.Rectangle;

  private arrivalShell!: Phaser.GameObjects.Graphics;

  private arrivalDoor!: Phaser.GameObjects.Graphics;

  private arrivalAura!: Phaser.GameObjects.Ellipse;

  private arrivalPlayer!: Phaser.GameObjects.Graphics;

  private pauseOverlay!: Phaser.GameObjects.Rectangle;

  private pauseText!: Phaser.GameObjects.Text;

  private hud!: ReturnType<typeof createRexHud>;

  private uiCamera!: Phaser.Cameras.Scene2D.Camera;

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
    void this.projectileTrailEmitters;
    void this.transientParticleEffects;
    void this.rewardBlockSprites;
    void this.rewardBlockIcons;
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
    void this.bottomMistSprites;
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
    void this.rewardBlockIcons;
    void this.enemySprites;
    void this.enemyAccentSprites;
    void this.playerAnchor;
    void this.playerSprite;
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
    void this.arrivalBaseShadow;
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
    void this.rewardBlockIcons;
    void this.rewardRevealTexts;
    void this.rewardBlockColor;
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
    void this.enemyHitFlashUntilMs;
    return this as unknown as GameSceneEnemyRenderingContext;
  }

  create(): void {
    this.bridge = this.registry.get('bridge') as SceneBridge;
    this.audio = new SynthAudio(
      this,
      () => this.bridge.getSession().getState().progress.runSettings.musicVolume,
      () => this.bridge.getSession().getState().progress.runSettings.sfxVolume,
    );
    applyConfiguredRetroPostFxToCamera(this.game, this.cameras.main);
    bindScaleOuter(this);
    this.completeTransitionEvent = undefined;
    ensureBootTexturesRegistered(this);
    ensureParticleTexture(this);
    this.ensurePlayerAnimations();

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
    this.playerHitFlashUntilMs = Number.NEGATIVE_INFINITY;
    this.playerDefeatVisibleUntilMs = Number.NEGATIVE_INFINITY;
    this.playerDefeatResetPending = false;
    this.enemyDefeatVisibleUntilMs.clear();
    this.enemyHitFlashUntilMs.clear();
    this.clearBeamEffects();
    this.lastStageStartPhase = null;
    this.exitTeleportBeamTriggered = false;
    this.stageStartArrivalTimerMs = STAGE_START_SEQUENCE_DURATION_MS;
    this.stageStartCapsuleLayout = getStageStartCapsuleLayout(
      resolveStageStartCapsuleAnchor(state.stage.startCabin),
      state.player,
    );
    this.gameplayMusicStarted = false;
    createBaseDisplayObjects(this.getBaseDisplayContext(), state);
    this.hud = createRexHud(this);
    setupGameSceneHud(this.getHudSetupContext());
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height, false, 'ui');
    this.cameras.main.ignore([this.hud.root, this.pauseOverlay, this.pauseText]);
    const uiObjects = new Set<Phaser.GameObjects.GameObject>([this.hud.root, this.pauseOverlay, this.pauseText]);
    this.uiCamera.ignore(this.children.getAll().filter((entry) => !uiObjects.has(entry)));

    this.setupInput();
    this.cameras.main.startFollow(this.playerAnchor, true, 0.08, 0.08);
    this.syncView();
    this.bridge.syncHud(this.hud);
    this.startGameplayMusicIfReady();

    const syncPauseOverlayLayout = (gameSize: { width: number; height: number }): void => {
      const { centerX, centerY, width, height } = getViewportMetrics(this, gameSize);
      this.pauseOverlay.setPosition(centerX, centerY).setSize(width, height);
      this.pauseText.setPosition(centerX, centerY);
      this.uiCamera.setViewport(0, 0, width, height);
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
        const session = this.bridge.getSession();
        if (state.stageIndex >= stageDefinitions.length - 1) {
          session.advanceToNextStage();
          this.scene.start('telemetry-summary');
          return;
        }
        session.advanceToNextStage();
        this.scene.start('stage-intro');
      });
    }
  }

  private handleShutdown(): void {
    cleanupGameScene(this.getCleanupContext());
  }

  private setupInput(): void {
    setupGameSceneInput(this.getInputContext());
  }

  private ensurePlayerAnimations(): void {
    const createIfMissing = (
      key: string,
      start: number,
      end: number,
      frameRate: number,
      repeat: number,
    ) => {
      if (this.anims.exists(key)) {
        return;
      }
      this.anims.create({
        key,
        frames: Array.from({ length: end - start + 1 }, (_entry, index) => ({
          key: 'player-sheet',
          frame: `${start + index}`,
        })),
        frameRate,
        repeat,
      });
    };

    createIfMissing('player-anim-idle', 0, 3, 6, -1);
    createIfMissing('player-anim-run', 4, 9, 8, -1);
    createIfMissing('player-anim-jump', 10, 11, 6, -1);
    createIfMissing('player-anim-fall', 12, 13, 6, -1);
    createIfMissing('player-anim-dash', 14, 16, 10, -1);
    createIfMissing('player-anim-hurt', 17, 18, 8, 0);
    createIfMissing('player-anim-defeat', 19, 23, 8, 0);
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
    this.updateBeamEffects();
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
    const snappedPlayerX = snapRetroValue(player.x);
    const snappedPlayerY = snapRetroValue(player.y);
    const centerX = snapRetroValue(player.x + player.width / 2);
    const centerY = snapRetroValue(player.y + player.height / 2);
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
    const invincibleField = variantKey === 'invincible';
    const playerBaseAlpha =
      playerDefeatHoldActive ? 1 : !invincibleField && player.invulnerableMs > 0 && Math.floor(player.invulnerableMs / 90) % 2 === 0 ? 0.45 : 1;
    const torsoHeight = effectivePose.state === 'dash' ? 16 : effectivePose.state === 'fall' ? 18 : 17;
    const torsoY = snapRetroValue(snappedPlayerY + 13 + effectivePose.bodyOffsetY);
    const visorX = snapRetroValue(facing === 1 ? snappedPlayerX + 8 : snappedPlayerX + 6);
    const packX = snapRetroValue(facing === 1 ? snappedPlayerX + 2 : snappedPlayerX + player.width - 8);
    const chestX = snapRetroValue(snappedPlayerX + 8);
    this.playerAnchor.setPosition(player.x, player.y).setSize(player.width, player.height);
    const playerHitBlend = getRetroHitFlashBlend(this.time.now, this.playerHitFlashUntilMs, 'player-hit');
    this.playerSprite
      .setVisible(playerVisible)
      .setPosition(snappedPlayerX, snappedPlayerY)
      .setAlpha(playerBaseAlpha)
      .setDepth(playerDefeatHoldActive ? 12 : 6);
    drawAstronautGraphic(this.playerSprite, {
      variantKey,
      width: player.width,
      height: player.height,
      facing,
      variant,
      pose: effectivePose.state,
      alpha: playerBaseAlpha,
      hitFlashBlend: player.dead ? 0 : playerHitBlend,
      defeat: playerDefeatHoldActive,
      brightColor: this.retroPalette.bright,
      alertColor: this.retroPalette.alert,
    });

    this.player.setVisible(false);
    this.playerHelmet.setVisible(false);
    this.playerVisor.setVisible(false);
    this.playerChest.setVisible(false);
    this.playerBelt.setVisible(false);
    this.playerPack.setVisible(false);
    this.playerArmLeft.setVisible(false);
    this.playerArmRight.setVisible(false);
    this.playerBootLeft.setVisible(false);
    this.playerBootRight.setVisible(false);
    this.playerKneeLeft.setVisible(false);
    this.playerKneeRight.setVisible(false);
    this.player.setPosition(snapRetroValue(snappedPlayerX + 5), torsoY).setSize(14, torsoHeight);
    this.player.setAlpha(playerBaseAlpha);
    this.player.setFillStyle(variant.bodyColor);
    this.playerHelmet
      .setPosition(snapRetroValue(snappedPlayerX + 4), snapRetroValue(snappedPlayerY + 2 + effectivePose.helmetOffsetY))
      .setSize(16, 11)
      .setFillStyle(variant.bodyColor)
      .setStrokeStyle(2, variant.detailColor, 0.95);
    this.playerVisor
      .setPosition(visorX, snapRetroValue(snappedPlayerY + 6 + effectivePose.helmetOffsetY))
      .setSize(8, 5)
      .setFillStyle(variant.accentColor);
    this.playerChest
      .setPosition(chestX, snapRetroValue(snappedPlayerY + 18 + effectivePose.chestOffsetY))
      .setSize(8, 6)
      .setFillStyle(variant.accentColor)
      .setAlpha(playerDefeatHoldActive ? 1 : this.player.alpha * 0.9);
    this.playerBelt
      .setPosition(snapRetroValue(snappedPlayerX + 6), snapRetroValue(snappedPlayerY + 25 + effectivePose.bodyOffsetY))
      .setSize(12, 3)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerPack
      .setPosition(packX, snapRetroValue(snappedPlayerY + 13 + effectivePose.packOffsetY))
      .setSize(6, 14)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerBootLeft
      .setPosition(
        snapRetroValue(snappedPlayerX + 4),
        snapRetroValue(snappedPlayerY + player.height - 6 + effectivePose.bootLeftOffsetY),
      )
      .setSize(6, 6)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerBootRight
      .setPosition(
        snapRetroValue(snappedPlayerX + player.width - 10),
        snapRetroValue(snappedPlayerY + player.height - 6 + effectivePose.bootRightOffsetY),
      )
      .setSize(6, 6)
      .setFillStyle(variant.detailColor)
      .setAlpha(this.player.alpha);
    this.playerKneeLeft
      .setPosition(
        snapRetroValue(snappedPlayerX + 6),
        snapRetroValue(snappedPlayerY + player.height - 12 + effectivePose.kneeLeftOffsetY),
      )
      .setSize(4, 5)
      .setFillStyle(variant.accentColor)
      .setAlpha(this.player.alpha * 0.85);
    this.playerKneeRight
      .setPosition(
        snapRetroValue(snappedPlayerX + player.width - 10),
        snapRetroValue(snappedPlayerY + player.height - 12 + effectivePose.kneeRightOffsetY),
      )
      .setSize(4, 5)
      .setFillStyle(variant.accentColor)
      .setAlpha(this.player.alpha * 0.85);
    const auraStep = getRetroMotionStep(this.time.now + centerX, 110, 3);
    const auraAlpha = ([0.14, 0.2, 0.28][auraStep] ?? 0.14) + effectivePose.auraAlpha;
    const fieldPulse = invincibleField ? (Math.sin(this.time.now / 72) + 1) * 0.5 : 0;
    const fieldColor = variant.auraColor ?? variant.accentColor;
    this.playerAura
      .setPosition(centerX, centerY)
      .setFillStyle(fieldColor, variant.auraColor ? 0.24 : 0.12)
      .setStrokeStyle(0, fieldColor, 0)
      .setScale(invincibleField ? 1.12 + fieldPulse * 0.18 : 1)
      .setVisible(playerVisible && Boolean(variant.auraColor))
      .setAlpha(variant.auraColor ? auraAlpha : 0);
    if (playerHitBlend > 0 && !player.dead) {
      this.player.setFillStyle(mixColor(variant.bodyColor, this.retroPalette.bright, playerHitBlend));
      this.playerHelmet.setFillStyle(mixColor(variant.bodyColor, this.retroPalette.bright, playerHitBlend * 0.88));
      this.playerVisor.setFillStyle(mixColor(variant.accentColor, this.retroPalette.bright, playerHitBlend));
      this.playerChest.setFillStyle(mixColor(variant.accentColor, this.retroPalette.bright, playerHitBlend));
      this.playerBelt.setFillStyle(mixColor(variant.detailColor, this.retroPalette.bright, playerHitBlend * 0.42));
      this.playerPack.setFillStyle(mixColor(variant.detailColor, this.retroPalette.bright, playerHitBlend * 0.42));
      this.playerArmLeft.setFillStyle(mixColor(variant.bodyColor, this.retroPalette.bright, playerHitBlend * 0.72));
      this.playerArmRight.setFillStyle(mixColor(variant.bodyColor, this.retroPalette.bright, playerHitBlend * 0.72));
      this.playerBootLeft.setFillStyle(mixColor(variant.detailColor, this.retroPalette.bright, playerHitBlend * 0.34));
      this.playerBootRight.setFillStyle(mixColor(variant.detailColor, this.retroPalette.bright, playerHitBlend * 0.34));
      this.playerKneeLeft.setFillStyle(mixColor(variant.accentColor, this.retroPalette.bright, playerHitBlend * 0.8));
      this.playerKneeRight.setFillStyle(mixColor(variant.accentColor, this.retroPalette.bright, playerHitBlend * 0.8));
      if (!variant.auraColor) {
        const hitAura = getRetroHitFlashPreset('player-hit');
        this.playerAura
          .setPosition(centerX, centerY)
          .setFillStyle(this.retroPalette.bright, hitAura.auraAlpha)
          .setVisible(playerVisible)
          .setAlpha(hitAura.auraAlpha * Phaser.Math.Clamp(playerHitBlend / hitAura.blend, 0.24, 1));
      }
    }
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
    this.applyExitFinishPresentation(state);
    this.applyStageStartArrivalPresentation(state);

    for (const platform of state.stageRuntime.platforms) {
      this.syncPlatform(platform);
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
        const emitter = this.projectileTrailEmitters.get(id);
        emitter?.stop(true);
        this.projectileTrailEmitters.delete(id);
      }
    }

    for (const [id, text] of this.rewardRevealTexts.entries()) {
      if (!state.stageRuntime.rewardReveals.find((rewardReveal) => rewardReveal.id === id)) {
        text.destroy();
        this.rewardRevealTexts.delete(id);
      }
    }

    if (!state.exitFinish.active) {
      this.exitTeleportBeamTriggered = false;
      if (this.exitBase && this.exitBaseShadow && this.exitBeacon && this.exitShell && this.exitDoor) {
        this.exitBase
          .setTint(this.retroPalette.panelAlt)
          .setScale(1, 1)
          .setAlpha(1);
        this.exitBaseShadow.setAlpha(0.26).setScale(1, 1);
        this.exitBeacon
          .setTint(state.stageRuntime.exitReached ? this.retroPalette.cool : this.retroPalette.bright)
          .setScale(1, 1)
          .setAlpha(state.stageRuntime.exitReached ? 0.9 : 0.78);
        this.exitShell
          .setAlpha(state.stageRuntime.exitReached ? 0.82 : 0.94);
        drawTeleportMachineGraphic(this.exitShell, {
          width: 62,
          height: 92,
          ringPhase: (this.time.now / 640) % 1,
          ringAlpha: state.stageRuntime.exitReached ? 0.32 : 0.08,
          beamAlpha: state.stageRuntime.exitReached ? 0.3 : 0.1,
          podAlpha: state.stageRuntime.exitReached ? 0.98 : 0.94,
          palette: {
            podDark: 0x4f4843,
            podMid: 0x7c746e,
            podLight: 0xb0aaa2,
            beam: 0x77ebff,
            beamGlow: 0xd8ffff,
            indicator: state.stageRuntime.exitReached ? 0xffdc73 : 0x7be7ff,
          },
        });
        this.exitDoor
          .setAlpha(state.stageRuntime.exitReached ? 0.76 : 0.88)
          .setVisible(true);
        drawTeleportShutterGraphic(this.exitDoor, {
          width: EXIT_CAPSULE_ART_BOUNDS.door.width,
          height: 48,
          closedProgress: 1,
          color: state.stageRuntime.exitReached ? 0x172d36 : 0x10202b,
          alpha: state.stageRuntime.exitReached ? 0.76 : 0.88,
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn('syncView: exit visuals not ready');
      }
    }
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
      kind: 'magnet' | 'crystal';
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
      hudVisible: this.hud.root.visible,
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
      arrivalCapsuleBaseY: this.stageStartCapsuleLayout.baseY,
      arrivalCapsuleShellWidth: this.getDebugRenderableWidth(this.arrivalShell),
      arrivalCapsuleDoorWidth: this.getDebugRenderableWidth(this.arrivalDoor),
      arrivalCapsuleShellTextureKey: this.getDebugRenderableKey(this.arrivalShell),
      arrivalCapsuleDoorTextureKey: this.getDebugRenderableKey(this.arrivalDoor),
      arrivalCapsuleUsesExitArt: false,
      gameplayMusicStarted: this.gameplayMusicStarted,
      exitFinishActive: state.exitFinish.active,
      exitFinishTimerMs: state.exitFinish.timerMs,
      exitDoorWidth: this.getDebugRenderableWidth(this.exitDoor),
      exitDoorTextureKey: this.getDebugRenderableKey(this.exitDoor),
      exitDoorVisible: this.exitDoor.visible,
      exitDoorOpenProgress: getExitFinishDoorOpenProgress(this.getExitFinishProgress(state)),
      playerVisualVisibleCount: this.getPlayerVisualTargets().filter(
        (target) => (target as Phaser.GameObjects.GameObject & { visible?: boolean }).visible,
      ).length,
      exitSpriteTextureKey: this.getDebugRenderableKey(this.exitShell),
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
        .stageRuntime.platforms.filter((platform) => platform.kind === 'magnet' || platform.kind === 'crystal').map((platform) => {
          const sprite = this.terrainVariantSprites.get(platform.id);
          const accent = this.terrainVariantAccentSprites.get(platform.id);
          const detailsRec = this.terrainVariantDetailSprites.get(platform.id) ?? [];

          const detailInfo = detailsRec.map((detail) => {
            if ((detail as any).layer) {
              const member = (detail as any).layer.getMember((detail as any).index);
              if (!member) {
                return { visible: false, width: 0, height: 0, x: platform.x + platform.width / 2, y: platform.y + platform.height / 2 };
              }
              return {
                visible: (member.alpha ?? 1) > 0,
                width: (member.scaleX ?? 0) * 2,
                height: (member.scaleY ?? 0) * 2,
                x: member.x ?? platform.x + platform.width / 2,
                y: member.y ?? platform.y + platform.height / 2,
              };
            }

            const rect = detail as Phaser.GameObjects.Rectangle;
            return { visible: rect.visible, width: rect.width, height: rect.height, x: rect.x, y: rect.y };
          });

          return {
            id: platform.id,
            visualCategory: getTerrainTraversalVisualCategory(platform),
            kind: platform.kind as 'magnet' | 'crystal',
            x: platform.x,
            y: platform.y,
            width: platform.width,
            height: platform.height,
            visible: sprite?.visible ?? false,
            fillColor: this.getVisualPrimaryColor(sprite),
            fillAlpha: this.getVisualPrimaryAlpha(sprite),
            accentColor: accent?.fillColor ?? 0,
            accentAlpha: accent?.fillAlpha ?? 0,
            detailVisibleCount: detailInfo.filter((d) => d.visible).length,
            detailWidths: detailInfo.map((d) => d.width),
            detailHeights: detailInfo.map((d) => d.height),
            detailOffsets: detailInfo.map((d) => ({
              x: Math.round(d.x - (platform.x + platform.width / 2)),
              y: Math.round(d.y - (platform.y + platform.height / 2)),
            })),
          };
        }),
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
          fillColor: this.getVisualPrimaryColor(this.platformSprites.get(platform.id)),
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
            fillColor: this.getVisualPrimaryColor(this.gravityFieldSprites.get(field.id)),
            fillAlpha: this.getVisualPrimaryAlpha(this.gravityFieldSprites.get(field.id)),
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
          shellFillColor: this.getVisualPrimaryColor(this.gravityCapsuleShellSprites.get(capsule.id)),
          shellFillAlpha: this.getVisualPrimaryAlpha(this.gravityCapsuleShellSprites.get(capsule.id)),
          entryDoorFillColor: this.getVisualPrimaryColor(this.gravityCapsuleEntryDoorSprites.get(capsule.id)),
          exitDoorFillColor: this.getVisualPrimaryColor(this.gravityCapsuleExitDoorSprites.get(capsule.id)),
          buttonFillColor: this.getVisualPrimaryColor(this.gravityCapsuleButtonSprites.get(capsule.id)),
          buttonCoreFillColor: this.getVisualPrimaryColor(this.gravityCapsuleButtonCoreSprites.get(capsule.id)),
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
          tint: this.getVisualPrimaryColor(this.enemySprites.get(enemy.id)),
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
          fillColor: this.getVisualPrimaryColor(this.activationNodeSprites.get(node.id)),
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
          fillColor: this.getVisualPrimaryColor(this.platformSprites.get(platform.id)),
          alpha: this.platformSprites.get(platform.id)?.alpha ?? 0,
        })),
    };
  }

  private getVisualPrimaryColor(target: any): number {
    if (!target) {
      return 0;
    }
    if (typeof target.getData === 'function') {
      const dataColor = target.getData('renderTint');
      if (typeof dataColor === 'number') {
        return dataColor;
      }
    }
    if (typeof target.fillColor === 'number') {
      return target.fillColor;
    }
    if (typeof target.tintTopLeft === 'number') {
      return target.tintTopLeft;
    }
    return 0;
  }

  private getVisualPrimaryAlpha(target: any): number {
    if (!target) {
      return 0;
    }
    if (typeof target.fillAlpha === 'number') {
      return target.fillAlpha;
    }
    if (typeof target.alpha === 'number') {
      return target.alpha;
    }
    return 0;
  }

  private setPauseOverlayVisible(visible: boolean): void {
    this.pauseOverlay.setVisible(visible);
    this.pauseText.setVisible(visible);
    this.hud.root.setVisible(!visible);
  }

  private syncPlatform(platform: PlatformState): void {
    syncPlatformRendering(this.getPlatformRenderingContext(), platform);
  }

  private syncActivationNode(node: { id: string; x: number; y: number; width: number; height: number; activated: boolean }): void {
    syncActivationNodeRendering(this.getPlatformRenderingContext(), node as never);
  }

  private syncGravityField(field: GravityFieldState): void {
    syncGravityFieldRendering(this.getGravityRenderingContext(), field);
  }

  private syncGravityCapsule(capsule: GravityCapsuleState): void {
    syncGravityCapsuleRendering(this.getGravityRenderingContext(), capsule);
  }

  private syncBrittleTerrainVariantDetails(platform: PlatformState, details: Array<Phaser.GameObjects.Rectangle | { layer: any; index: number }>): void {
    const broken = isBrittlePlatformBroken(platform);
    const warning = isBrittlePlatformWarning(platform);
    const ready = isBrittlePlatformReady(platform);
    const centerX = platform.x + platform.width / 2;
    const centerY = platform.y + platform.height / 2;
    const shineWidth = Math.max(6, Math.floor(platform.width * (broken ? 0.08 : ready ? 0.1 : 0.09)));
    const shineHeight = Math.max(6, Math.floor(platform.height * (broken ? 0.2 : ready ? 0.72 : 0.64)));
    const shineOffsets = [-0.24, 0, 0.24];
    const shineYOffsets = broken ? [0.18, 0.1, 0.16] : ready ? [0, -0.04, 0.02] : [0.02, -0.06, 0.04];
    const shineAlphas = broken ? [0.08, 0.1, 0.08] : ready ? [0.34, 0.48, 0.34] : warning ? [0.28, 0.4, 0.28] : [0.22, 0.32, 0.22];

    const setDetailMember = (rec: any, opts: any) => {
      if (!rec) return;
      if (rec.layer) {
        rec.layer.editMember(rec.index, opts);
      } else if (typeof rec.setPosition === 'function') {
        if (opts.x !== undefined && opts.y !== undefined) rec.setPosition(opts.x, opts.y);
        if (opts.width !== undefined && opts.height !== undefined) rec.setSize(opts.width, opts.height);
        if (opts.fill !== undefined) rec.setFillStyle(opts.fill, opts.alpha ?? 1);
        if (opts.alpha !== undefined) rec.setAlpha(opts.alpha);
        if (opts.visible !== undefined) rec.setVisible(opts.visible);
      }
    };

    details.forEach((detail: any, index: number) => {
      const x = centerX + platform.width * shineOffsets[index];
      const y = centerY + platform.height * shineYOffsets[index];
      const w = index === 1 ? shineWidth + 2 : shineWidth;
      const h = index === 1 ? shineHeight + (broken ? 0 : 2) : shineHeight;
      const color = broken ? this.retroPalette.border : this.retroPalette.bright;
      const alpha = shineAlphas[index];
      setDetailMember(detail, { x, y, width: w, height: h, fill: color, alpha, visible: true, scaleX: w / 2, scaleY: h / 2, tintTopLeft: color, tintTopRight: color, tintBottomLeft: color, tintBottomRight: color });
    });
  }

  private syncStickyTerrainVariantDetails(_platform: PlatformState, details: Array<Phaser.GameObjects.Rectangle | { layer: any; index: number }>): void {
    const setDetailMember = (rec: any, opts: any) => {
      if (!rec) return;
      if (rec.layer) {
        rec.layer.editMember(rec.index, opts);
      } else if (typeof rec.setPosition === 'function') {
        if (opts.x !== undefined && opts.y !== undefined) rec.setPosition(opts.x, opts.y);
        if (opts.width !== undefined && opts.height !== undefined) rec.setSize(opts.width, opts.height);
        if (opts.fill !== undefined) rec.setFillStyle(opts.fill, opts.alpha ?? 1);
        if (opts.alpha !== undefined) rec.setAlpha(opts.alpha);
        if (opts.visible !== undefined) rec.setVisible(opts.visible);
      }
    };

    details.forEach((detail: any, index: number) => {
      void index;
      setDetailMember(detail, { visible: false, alpha: 0 });
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

    if (!projectile.alive) {
      const emitter = this.projectileTrailEmitters.get(projectile.id);
      if (emitter) {
        emitter.stop();
        emitter.destroy();
      }
      this.projectileTrailEmitters.delete(projectile.id);
      return;
    }

    const centerX = projectile.x + 6;
    const centerY = projectile.y + 6;
    const vx = (projectile as any).vx ?? 0;
    const vy = (projectile as any).vy ?? 0;
    const speed = Math.hypot(vx, vy);
    const directionX = speed > 0 ? vx / speed : 1;
    const directionY = speed > 0 ? vy / speed : 0;
    const color = projectile.variant ? 0x9dd9ff : this.retroPalette.warm;

    let emitter = this.projectileTrailEmitters.get(projectile.id);
    if (!emitter) {
      ensureParticleTexture(this);
      emitter = createProjectileTrailEmitter(this, {
        x: centerX,
        y: centerY,
        color,
        alpha: projectile.variant ? 0.62 : 0.5,
        depth: 8,
        speed: speed * 0.15,
        lifespan: 300,
      });
      this.projectileTrailEmitters.set(projectile.id, emitter);

      const muzzleOffset = projectile.owner === 'enemy' ? 7 : 12;
      createMuzzleSmokeEffect(this, {
        x: centerX - directionX * muzzleOffset,
        y: centerY - directionY * muzzleOffset,
        directionX,
        directionY,
        owner: projectile.owner,
        depth: 9,
      });
    }

    // Update emitter position and angle
    updateTrailEmitter(
      emitter,
      centerX - directionX * 5,
      centerY - directionY * 5,
      Phaser.Math.RadToDeg(Math.atan2(directionY, directionX)),
    );
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

  private rewardRevealText(rewardReveal: RewardRevealState): string {
    return rewardRevealText(rewardReveal);
  }

  private rewardRevealColor(rewardReveal: RewardRevealState): string {
    return rewardRevealColor(rewardReveal);
  }

  private handleCueFeedback(cue: AudioCue, state: Readonly<SessionSnapshot>): void {
    const player = state.player;
    const centerX = player.x + player.width / 2;
    const feetY = player.y + player.height;

    if (cue === AUDIO_CUES.jump || cue === AUDIO_CUES.doubleJump) {
      this.triggerJumpFeedback(state);
      if (cue === AUDIO_CUES.doubleJump) {
        const packX = state.player.x + state.player.width * 0.5 - state.player.facing * 5;
        const packY = state.player.y + state.player.height * 0.34;
        spawnRetroParticleBurst(this, packX, packY, this.retroPalette.bright, 'power');
        this.spawnBeamPulse('distortion', packX, packY + 6, this.retroPalette.bright, 18, 24, 160, 12);
        ensureParticleTexture(this);
        createBurstEffect(this, {
          x: this.playerPack.x,
          y: this.playerPack.y,
          color: 0x00ffff,
          alpha: 0.8,
          depth: 11,
          durationMs: 180,
        });
      }
      return;
    }

    if (cue === AUDIO_CUES.land) {
      spawnRetroParticleBurst(this, centerX, feetY, this.retroPalette.border, 'land');
      this.spawnBeamPulse('hit-flash', centerX, feetY - 2, this.retroPalette.bright, 34, 10, 110, 11);
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
          ensureParticleTexture(this);
          const fireworkX = sprite?.x ?? event.x;
          const fireworkY = sprite ? sprite.y + 8 : event.y;
          createCheckpointFireworkEffect(this, {
            x: fireworkX,
            y: fireworkY,
            depth: 12,
          });
          
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
        case 'platform-break':
          spawnRetroParticleBurst(this, event.x, event.y, this.retroPalette.cool, 'reward');
          this.spawnBeamPulse('distortion', event.x, event.y, this.retroPalette.bright, Math.max(24, event.width), Math.max(12, Math.floor(event.height * 0.9)), 120, 11);
          this.recordFeedback('platformBreak');
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
        case 'player-hit':
          this.triggerPlayerHitFeedback(event.x, event.y);
          break;
        case 'player-defeat':
          this.triggerPlayerDefeatFeedback(event.x, event.y);
          break;
        case 'enemy-defeat': {
          const closeRangeImpact = event.cause !== 'plasma-blast';
          const preset = closeRangeImpact ? 'enemy-defeat-stomp' : 'enemy-defeat-plasma';
          const tint =
            closeRangeImpact
              ? event.enemyKind === 'hopper'
                ? this.retroPalette.safe
                : this.retroPalette.warm
              : event.enemyKind === 'flyer'
                ? this.retroPalette.bright
                : this.retroPalette.cool;
            spawnRetroParticleBurst(this, event.x, event.y, tint, preset);
            spawnRetroDefeatFlash(this, event.x, event.y, tint, closeRangeImpact ? 'stomp' : 'plasma-blast');
            this.triggerEnemyDefeatFeedback(event.id, event.cause);
          this.recordFeedback('enemyDefeat');
          this.recordFeedback(closeRangeImpact ? 'enemyDefeatStomp' : 'enemyDefeatPlasma');
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
      brittlePlatforms: state.stageRuntime.platforms
        .filter((platform) => platform.kind === 'crystal' && platform.brittle)
        .map((platform) => ({
          id: platform.id,
          phase: platform.brittle?.phase ?? 'intact',
          x: platform.x,
          y: platform.y,
          width: platform.width,
          height: platform.height,
        })),
      allCoinsRecovered: state.stageRuntime.allCoinsRecovered,
      presentationPower: state.player.presentationPower,
      player: {
        dead: state.player.dead,
        x: state.player.x,
        y: state.player.y,
        width: state.player.width,
        height: state.player.height,
        health: state.player.health,
        invulnerableMs: state.player.invulnerableMs,
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
      this.playerSprite,
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

  private getDebugRenderableWidth(object: Phaser.GameObjects.GameObject & { displayWidth?: number }): number {
    const dataWidth = Number((object as any).getData?.('debugWidth'));
    if (Number.isFinite(dataWidth) && dataWidth > 0) {
      return dataWidth;
    }

    return Number(object.displayWidth ?? 0);
  }

  private getDebugRenderableKey(object: Phaser.GameObjects.GameObject & { texture?: { key?: string } }): string {
    return String((object as any).getData?.('debugTextureKey') ?? object.texture?.key ?? 'graphics');
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
    if (sequence.phase !== this.lastStageStartPhase) {
      if (sequence.phase === 'rematerialize') {
        this.spawnBeamPulse('distortion', layout.capsuleCenterX, layout.capsuleCenterY + 2, this.retroPalette.cool, 40, 14, 140, 12);
        ensureParticleTexture(this);
        createBurstEffect(this, { x: this.arrivalDoor.x, y: this.arrivalDoor.y, color: 0x00ff00, alpha: 0.8, depth: 11, durationMs: 180 });
        createBurstEffect(this, { x: this.arrivalShell.x, y: this.arrivalShell.y, color: 0x00ff00, alpha: 0.8, depth: 11, durationMs: 180 });
        createBurstEffect(this, { x: this.arrivalPlayer.x, y: this.arrivalPlayer.y, color: 0x00ff00, alpha: 0.8, depth: 11, durationMs: 140 });
      }
      if (sequence.phase === 'closing') {
        this.spawnBeamPulse('distortion', layout.capsuleCenterX, layout.capsuleCenterY + 2, this.retroPalette.warm, 34, 10, 120, 12);
        ensureParticleTexture(this);
        createBurstEffect(this, { x: this.arrivalDoor.x, y: this.arrivalDoor.y, color: 0xff6600, alpha: 0.7, depth: 11, durationMs: 140 });
      }
      this.lastStageStartPhase = sequence.phase;
    }
    // Defensive guard: arrival visuals may not be created in some startup races.
    if (!this.arrivalBaseShadow || !this.arrivalShell || !this.arrivalDoor || !this.arrivalAura || !this.arrivalPlayer) {
      // eslint-disable-next-line no-console
      console.warn('applyStageStartArrivalPresentation: arrival visuals not ready');
      return;
    }
    if (!this.isStageStartArrivalActive()) {
      this.arrivalBaseShadow
        .setPosition(layout.capsuleCenterX, layout.baseShadowY)
        .setScale(1, 1)
        .setAlpha(0.22)
        .setVisible(true);
      this.arrivalShell
        .setPosition(layout.capsuleCenterX, layout.capsuleCenterY)
        .setAlpha(0.92)
        .setVisible(true);
      this.arrivalDoor
        .setPosition(layout.capsuleCenterX, layout.capsuleCenterY + 1)
        .setAlpha(0)
        .setVisible(true);
      drawTeleportMachineGraphic(this.arrivalShell, {
        width: 62,
        height: 92,
        ringPhase: 0,
        ringAlpha: 0,
        beamAlpha: 0.12,
        podAlpha: 0.9,
        palette: {
          podDark: 0x4b4643,
          podMid: 0x78716c,
          podLight: 0xa59f97,
          beam: 0x80ecff,
          beamGlow: 0xc7ffff,
          indicator: 0x7bdfff,
        },
      });
      this.arrivalDoor.clear();
      this.arrivalDoor.setData('debugWidth', 0);
      this.arrivalAura.setVisible(false);
      this.arrivalPlayer.setVisible(false);
      return;
    }

    const flickerAlpha = sequence.phase === 'rematerialize' && Math.floor(this.time.now / 48) % 2 === 0 ? 0.58 : 1;
    const shellAlpha = Phaser.Math.Clamp(0.58 + (1 - sequence.overallProgress) * 0.16, 0.48, 0.82);
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
    const ringPhase = ((this.time.now / 520) % 1 + sequence.walkoutProgress * 0.12) % 1;

    this.arrivalBaseShadow
      .setPosition(layout.capsuleCenterX, layout.baseShadowY)
      .setScale(1 + (1 - sequence.doorClosedProgress) * 0.08, 1)
      .setAlpha(0.2 + (1 - sequence.overallProgress) * 0.08)
      .setVisible(true);
    this.arrivalShell
      .setPosition(layout.capsuleCenterX, layout.capsuleCenterY)
      .setAlpha(shellAlpha)
      .setVisible(true);
    drawTeleportMachineGraphic(this.arrivalShell, {
      width: 62,
      height: 92,
      ringPhase,
      ringAlpha: Phaser.Math.Clamp(0.18 + sequence.revealProgress * 0.74 - sequence.doorClosedProgress * 0.36, 0, 0.88),
      beamAlpha: Phaser.Math.Clamp(0.24 + sequence.revealProgress * 0.58 - sequence.doorClosedProgress * 0.44, 0.08, 0.92),
      podAlpha: 0.94,
      palette: {
        podDark: 0x4f4843,
        podMid: 0x7c746e,
        podLight: 0xb0aaa2,
        beam: 0x77ebff,
        beamGlow: 0xd8ffff,
        indicator: sequence.phase === 'closing' ? 0xffdc73 : 0x7be7ff,
      },
    });
    this.arrivalDoor
      .setPosition(layout.capsuleCenterX, layout.capsuleCenterY + 1)
      .setAlpha(doorAlpha)
      .setVisible(doorAlpha > 0.02);
    drawTeleportShutterGraphic(this.arrivalDoor, {
      width: doorWidth,
      height: 48,
      closedProgress: sequence.doorClosedProgress,
      color: 0x10202b,
      alpha: 0.82,
    });
    this.arrivalAura
      .setPosition(Phaser.Math.Linear(layout.capsuleCenterX, playerCenterX, sequence.walkoutProgress * 0.8), playerCenterY - 2)
      .setSize(50 - sequence.overallProgress * 8, 66 - sequence.overallProgress * 10)
      .setFillStyle(this.retroPalette.cool, 0.22)
      .setAlpha(Phaser.Math.Clamp(0.58 - sequence.walkoutProgress * 0.28 - sequence.doorClosedProgress * 0.34, 0, 0.58))
      .setVisible(sequence.phase !== 'inert' && sequence.doorClosedProgress < 0.98);
    this.arrivalPlayer
      .setPosition(arrivalPlayerX, arrivalPlayerY)
      .setAlpha(playerAlpha)
      .setVisible(sequence.phase !== 'closing' && playerAlpha > 0.02);
    drawAstronautGraphic(this.arrivalPlayer, {
      variantKey: 'base',
      width: 24,
      height: 40,
      facing: layout.playerTargetX >= layout.playerStartX ? 1 : -1,
      variant: {
        bodyColor: 0xf6ee78,
        detailColor: 0xe0cd4e,
        accentColor: 0xfff7b4,
        auraColor: null,
      },
      pose: sequence.phase === 'walkout' ? 'run-a' : 'idle',
      alpha: playerAlpha,
      hitFlashBlend: 0,
      defeat: false,
      brightColor: this.retroPalette.bright,
      alertColor: this.retroPalette.alert,
    });
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

    if (!this.exitTeleportBeamTriggered && progress >= 0.08) {
      this.spawnBeamPulse('distortion', playerCenterX, playerCenterY, this.retroPalette.cool, 42, 14, 150, 12);
      this.spawnBeamPulse('hit-flash', capsuleCenterX, capsuleCenterY, this.retroPalette.bright, 26, 26, 130, 12);
      ensureParticleTexture(this);
      createBurstEffect(this, { x: this.exitDoor.x, y: this.exitDoor.y, color: 0xff00ff, alpha: 0.8, depth: 11, durationMs: 190 });
      createBurstEffect(this, { x: this.exitShell.x, y: this.exitShell.y, color: 0xff00ff, alpha: 0.8, depth: 11, durationMs: 190 });
      createBurstEffect(this, { x: this.player.x, y: this.player.y, color: 0xff00ff, alpha: 0.8, depth: 11, durationMs: 150 });
      this.exitTeleportBeamTriggered = true;
    }

    // Defensive guard: ensure exit visuals exist before mutating them.
    if (!this.exitBase || !this.exitBaseShadow || !this.exitBeacon || !this.exitShell || !this.exitDoor) {
      // eslint-disable-next-line no-console
      console.warn('applyExitFinishPresentation: exit visuals not ready');
      return;
    }

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
      .setTint(progress > 0.5 ? this.retroPalette.cool : this.retroPalette.panelAlt)
      .setScale(1 + progress * 0.08, 1)
      .setAlpha(0.92 + progress * 0.08);
    this.exitBaseShadow
      .setScale(1 + progress * 0.14, 1)
      .setAlpha(0.24 + progress * 0.12);
    this.exitBeacon
      .setTint(progress > 0.45 ? this.retroPalette.cool : this.retroPalette.bright)
      .setScale(1 + progress * 0.18, 1 + progress * 0.12)
      .setAlpha(0.82 + progress * 0.16);

    this.exitShell
      .setAlpha(0.88 + Math.sin(this.time.now / 55) * 0.12);
    drawTeleportMachineGraphic(this.exitShell, {
      width: 62,
      height: 92,
      ringPhase: ((this.time.now / 440) % 1 + progress * 0.22) % 1,
      ringAlpha: Phaser.Math.Clamp(0.28 + progress * 0.62, 0.28, 0.92),
      beamAlpha: Phaser.Math.Clamp(0.22 + progress * 0.7, 0.22, 0.96),
      podAlpha: 0.98,
      palette: {
        podDark: 0x4f4843,
        podMid: 0x7c746e,
        podLight: 0xb0aaa2,
        beam: progress > 0.55 ? 0x8cf2ff : 0x77ebff,
        beamGlow: 0xd8ffff,
        indicator: progress > 0.42 ? 0xfff4ad : 0x7be7ff,
      },
    });
    this.exitDoor
      .setAlpha(0.82 + doorOpenProgress * 0.12 + Math.sin(this.time.now / 70) * 0.04)
      .setVisible(true);
    drawTeleportShutterGraphic(this.exitDoor, {
      width: exitDoorWidth,
      height: 48,
      closedProgress: 1,
      color: progress > 0.42 ? 0x17303a : 0x10202b,
      alpha: 0.82 + doorOpenProgress * 0.12,
    });
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
    this.spawnBeamPulse('distortion', centerX, feetY - 6, this.retroPalette.cool, 20, 16, 90, 11);
    this.spawnBeamPulse('hit-flash', centerX, feetY, this.retroPalette.warm, 24, 8, 80, 11);
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
    this.spawnBeamPulse('hit-flash', x, y, this.retroPalette.alert, 44, 12, 130, 12);
    this.spawnBeamPulse('distortion', x, y, this.retroPalette.bright, 22, 22, 110, 13);
    ensureParticleTexture(this);
    createBurstEffect(this, { x: this.player.x, y: this.player.y, color: 0xff0000, alpha: 0.9, depth: 13, durationMs: 180 });
    createBurstEffect(this, { x: this.playerHelmet.x, y: this.playerHelmet.y, color: 0xff0000, alpha: 0.8, depth: 13, durationMs: 180 });
    createBurstEffect(this, { x: this.playerVisor.x, y: this.playerVisor.y, color: 0xff6600, alpha: 0.8, depth: 13, durationMs: 180 });
    this.setPlayerVisualDepths(defeatPreset.depth, defeatPreset.depth + 1);
    this.lastPlayerDefeatFeedbackAtMs = this.time.now;
    this.recordFeedback('playerDefeat');
  }

  private triggerPlayerHitFeedback(x: number, y: number): void {
    const hitFlash = getRetroHitFlashPreset('player-hit');
    if (this.playerHitFlashUntilMs - this.time.now > hitFlash.durationMs * 0.4) {
      return;
    }

    this.playerHitFlashUntilMs = Math.max(this.playerHitFlashUntilMs, this.time.now + hitFlash.durationMs);
    this.playerAura.setPosition(x, y);
    this.spawnBeamPulse('hit-flash', x, y, this.retroPalette.bright, 28, 8, 90, 12);
    ensureParticleTexture(this);
    createBurstEffect(this, { x: this.player.x, y: this.player.y, color: 0xffff00, alpha: 0.8, depth: 13, durationMs: 110 });
    createBurstEffect(this, { x: this.playerHelmet.x, y: this.playerHelmet.y, color: 0xffff00, alpha: 0.75, depth: 13, durationMs: 110 });
    createBurstEffect(this, { x: this.playerVisor.x, y: this.playerVisor.y, color: 0xffff00, alpha: 0.75, depth: 13, durationMs: 110 });
    this.recordFeedback('playerHit');
  }

  private triggerEnemyDefeatFeedback(enemyId: string, cause: EnemyDefeatCause): void {
    const sprite = this.enemySprites.get(enemyId);
    if (!sprite) {
      return;
    }
    const visualWidth = Number(sprite.getData('visualWidth') ?? 24);
    const visualHeight = Number(sprite.getData('visualHeight') ?? 24);
    const centerX = sprite.x + visualWidth / 2;
    const centerY = sprite.y + visualHeight / 2;

    const presetName = cause === 'plasma-blast' ? 'plasma-blast' : 'stomp';
    const preset = getRetroDefeatTweenPreset(presetName);
    this.enemyDefeatVisibleUntilMs.set(enemyId, this.time.now + ENEMY_DEFEAT_VISIBLE_HOLD_MS);
    this.enemyHitFlashUntilMs.set(enemyId, this.time.now + getRetroHitFlashPreset('enemy-hit').durationMs);
    sprite.setVisible(true);
    sprite.setDepth(preset.depth);
    playRetroDefeatTweenPreset(this, sprite, presetName);

    const beamColor = cause === 'plasma-blast' ? this.retroPalette.cool : this.retroPalette.warm;
    const beamWidth = cause === 'plasma-blast' ? 34 : 30;
    const beamHeight = cause === 'plasma-blast' ? 8 : 10;
    this.spawnBeamPulse('hit-flash', centerX, centerY, beamColor, beamWidth, beamHeight, 90, 11);
    if (cause === 'stomp') {
      this.spawnBeamPulse('distortion', centerX, centerY + 4, this.retroPalette.bright, 18, 18, 70, 11);
    }
    ensureParticleTexture(this);
    createBurstEffect(this, {
      x: sprite.x,
      y: sprite.y,
      color: cause === 'stomp' ? 0xffaa00 : 0xff0055,
      alpha: 0.85,
      depth: 10,
      durationMs: 120,
    });
  }

  private resetPlayerDefeatPresentation(): void {
    resetRetroPresentationTargets(this, [
      { target: this.playerAura, depth: 5, visible: false, alpha: 0 },
      { target: this.playerPack, depth: 5, visible: true },
      { target: this.playerSprite, depth: 6, visible: true },
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
    this.playerHitFlashUntilMs = Number.NEGATIVE_INFINITY;
    this.playerDefeatVisibleUntilMs = Number.NEGATIVE_INFINITY;
  }

  private spawnBeamPulse(
    // _kind: effect type from old beam system (palette-ramp, hit-flash, distortion)
    // Currently unused but kept for backwards compatibility with existing call sites
    _kind: 'palette-ramp' | 'hit-flash' | 'distortion',
    x: number,
    y: number,
    color: number,
    width: number,
    height: number,
    durationMs: number,
    depth: number,
  ): void {
    ensureParticleTexture(this);
    
    const effect = createFadingRegionEffect(this, {
      x,
      y,
      width,
      height,
      color,
      alpha: 0.72,
      depth,
      durationMs,
      lifespan: durationMs,
    });

    const id = `particle-${this.particleSequence++}`;
    this.transientParticleEffects.set(id, effect);
  }

  private updateBeamEffects(): void {
    // Particle emitters handle their own lifecycle
    // This is now primarily handled by Phaser's particle system
    for (const [id, emitter] of this.transientParticleEffects.entries()) {
      if (emitter.isDestroyed) {
        this.transientParticleEffects.delete(id);
      }
    }
  }

  private clearBeamEffects(): void {
    for (const emitter of this.projectileTrailEmitters.values()) {
      emitter.stop();
      emitter.destroy();
    }
    this.projectileTrailEmitters.clear();

    for (const emitter of this.transientParticleEffects.values()) {
      emitter.stop();
      emitter.destroy();
    }
    this.transientParticleEffects.clear();
  }

  private setPlayerVisualDepths(baseDepth: number, detailDepth: number): void {
    this.playerSprite.setDepth(baseDepth);
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
