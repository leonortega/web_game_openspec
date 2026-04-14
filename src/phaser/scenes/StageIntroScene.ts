import * as Phaser from 'phaser';
import {
  formatActivePowerSummary,
  formatCheckpointStatus,
  formatRunCollectibleSummary,
  formatRunSettings,
  formatStageCollectibleTarget,
} from '../../game/simulation/state';
import { SceneBridge } from '../adapters/sceneBridge';
import {
  RETRO_FONT_FAMILY,
  createRetroPresentationPalette,
  drawRetroBackdrop,
} from '../view/retroPresentation';

const INTRO_DURATION_MS = 2400;

export class StageIntroScene extends Phaser.Scene {
  private introEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super('stage-intro');
  }

  create(): void {
    const bridge = this.registry.get('bridge') as SceneBridge;
    const state = bridge.getSession().getState();
    const { width, height } = this.scale;
    const stagePresentation = state.stage.presentation;
    const powerSummary = formatActivePowerSummary(state.progress.activePowers, state.progress.powerTimers);
    const activeCheckpointCount = state.stageRuntime.checkpoints.filter((checkpoint) => checkpoint.activated).length;
    const retro = createRetroPresentationPalette(state.stage.palette);

    drawRetroBackdrop(this, 0, 0, width, height, retro, 'transition');
    this.add
      .rectangle(width / 2, height / 2, width - 104, height - 112, retro.panel, 0.96)
      .setStrokeStyle(4, retro.border, 0.9);
    this.add.rectangle(width / 2, 92, width - 136, 36, retro.stageAccent, 0.9).setStrokeStyle(2, retro.ink, 1);
    this.add.rectangle(width / 2, 388, width - 196, 118, retro.panelAlt, 0.98).setStrokeStyle(3, retro.border, 0.8);
    this.add.rectangle(width / 2, 512, width - 196, 44, retro.skyline, 0.96).setStrokeStyle(2, retro.border, 0.6);

    this.add
      .text(width / 2, 104, stagePresentation.sectorLabel, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '18px',
        color: retro.shadow,
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 136, `Stage ${state.stageIndex + 1}`, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '18px',
        color: retro.dimText,
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 182, state.stage.name, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '34px',
        color: retro.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 226, `${stagePresentation.biomeLabel}\n${stagePresentation.paletteCue}`, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '16px',
        color: retro.dimText,
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 290, state.stage.hint, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '16px',
        color: retro.text,
        align: 'center',
        wordWrap: { width: width - 240 },
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        392,
        `${formatRunCollectibleSummary(state.progress.totalCoins)}\n${formatStageCollectibleTarget(
          state.stageRuntime.totalCoins,
        )}\n${formatCheckpointStatus(activeCheckpointCount, state.stageRuntime.checkpoints.length)}\nLoadout: ${powerSummary}\nRun: ${formatRunSettings(state.progress.runSettings)}`,
        {
          fontFamily: RETRO_FONT_FAMILY,
          fontSize: '18px',
          color: '#f0b84b',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, 520, stagePresentation.introLine, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '16px',
        color: retro.dimText,
        align: 'center',
        wordWrap: { width: width - 260 },
      })
      .setOrigin(0.5);

    this.introEvent = this.time.delayedCall(INTRO_DURATION_MS, () => {
      this.scene.start('game');
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.introEvent?.remove(false);
      this.introEvent = undefined;
    });
  }
}
