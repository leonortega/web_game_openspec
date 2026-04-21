import * as Phaser from 'phaser';
import { stageDefinitions } from '../../game/content/stages';
import {
  getActivePowerLabels,
  formatRunCollectibleSummary,
  formatRunSettings,
  formatStageCollectibleSummary,
} from '../../game/simulation/state';
import { SceneBridge } from '../adapters/sceneBridge';
import {
  RETRO_FONT_FAMILY,
  createRetroPresentationPalette,
  drawRetroBackdrop,
} from '../view/retroPresentation';
import { SynthAudio } from '../audio/SynthAudio';
import { runUnlockedAudioAction } from '../audio/sceneAudio';

const AUTO_ADVANCE_MS = 2800;

export class CompleteScene extends Phaser.Scene {
  private audio?: SynthAudio;

  private autoAdvanceEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super('complete');
  }

  create(): void {
    const bridge = this.registry.get('bridge') as SceneBridge;
    const session = bridge.getSession();
    const state = session.getState();
    const finalStage = state.stageIndex >= stageDefinitions.length - 1;
    const { width, height } = this.scale;
    let transitioning = false;
    const stagePresentation = state.stage.presentation;
    const powerSummary = getActivePowerLabels(state.progress.activePowers, state.progress.powerTimers).join(', ') || 'None';
    const activeCheckpointCount = state.stageRuntime.checkpoints.filter((checkpoint) => checkpoint.activated).length;
    const checkpointSummary = `Survey beacons online: ${activeCheckpointCount}/${state.stageRuntime.checkpoints.length}`;
    const retro = createRetroPresentationPalette(state.stage.palette);
    this.audio = new SynthAudio(this, () => bridge.getSession().getState().progress.runSettings.masterVolume);

    const goToMenu = () => {
      if (transitioning) {
        return;
      }
      transitioning = true;
      this.scene.start('menu');
    };

    const replayStage = () => {
      if (transitioning) {
        return;
      }
      transitioning = true;
      session.restartStage();
      this.scene.start('stage-intro');
    };

    const continueForward = () => {
      if (transitioning || finalStage) {
        return;
      }
      transitioning = true;
      session.advanceToNextStage();
      this.scene.start('stage-intro');
    };

    drawRetroBackdrop(this, 0, 0, width, height, retro, 'transition');
    this.add.rectangle(width / 2, height / 2, width - 104, height - 112, retro.panel, 0.96).setStrokeStyle(4, retro.border, 0.9);
    this.add.rectangle(width / 2, 96, width - 140, 34, retro.stageAccent, 0.9).setStrokeStyle(2, retro.ink, 1);
    this.add.rectangle(width / 2, 320, width - 188, 126, retro.panelAlt, 0.98).setStrokeStyle(3, retro.border, 0.78);
    this.add.rectangle(width / 2, 470, width - 188, 56, retro.skyline, 0.98).setStrokeStyle(2, retro.border, 0.6);
    this.add
      .text(width / 2, 118, stagePresentation.sectorLabel, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '18px',
        color: retro.shadow,
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 170, finalStage ? 'Survey Complete' : stagePresentation.completionTitle, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '34px',
        color: retro.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 218, `${state.stage.name}\n${stagePresentation.biomeLabel}`, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '16px',
        color: retro.dimText,
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        320,
        `${formatRunCollectibleSummary(state.progress.totalCoins)}\n${formatStageCollectibleSummary(
          state.stageRuntime.collectedCoins,
          state.stageRuntime.totalCoins,
        )}\n${checkpointSummary}\nLoadout: ${powerSummary}\nRun: ${formatRunSettings(state.progress.runSettings)}`,
        {
          align: 'center',
          fontFamily: RETRO_FONT_FAMILY,
          fontSize: '18px',
          color: '#f0b84b',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        462,
        finalStage
          ? 'All three survey sectors are cleared. Press M for menu or R to replay.'
          : `Next survey sector opens automatically in ${Math.round(AUTO_ADVANCE_MS / 1000)} seconds.\nPress R to replay or M for menu.`,
        {
          align: 'center',
          fontFamily: RETRO_FONT_FAMILY,
          fontSize: '16px',
          color: retro.dimText,
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.audio.playStageClear(state.stage, finalStage);
    const retryCompletionAudio = () => {
      if (!this.audio) {
        return;
      }
      void runUnlockedAudioAction(this.audio, () => {
        this.audio?.playStageClear(state.stage, finalStage);
      });
    };
    this.input.keyboard?.once('keydown', retryCompletionAudio);
    this.input.once('pointerdown', retryCompletionAudio);

    this.input.keyboard?.once('keydown-R', replayStage);
    this.input.keyboard?.once('keydown-M', goToMenu);
    this.input.keyboard?.once('keydown-N', continueForward);

    if (!finalStage) {
      this.autoAdvanceEvent = this.time.delayedCall(AUTO_ADVANCE_MS, continueForward);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.autoAdvanceEvent?.remove(false);
      this.autoAdvanceEvent = undefined;
      this.audio?.stopMusic();
      this.audio = undefined;
    });
  }

  getDebugSnapshot(): {
    accentBurstCount: number;
    accentTweenActive: boolean;
    accentVisible: boolean;
    accentMode: string;
    sideWidgetVisible: boolean;
  } {
    return {
      accentBurstCount: 0,
      accentTweenActive: false,
      accentVisible: false,
      accentMode: 'none',
      sideWidgetVisible: false,
    };
  }
}
