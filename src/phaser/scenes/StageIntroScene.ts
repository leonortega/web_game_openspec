import Phaser from 'phaser';
import {
  formatActivePowerSummary,
  formatCheckpointStatus,
  formatRunCollectibleSummary,
  formatRunSettings,
  formatStageCollectibleTarget,
} from '../../game/simulation/state';
import { SceneBridge } from '../adapters/sceneBridge';

const INTRO_DURATION_MS = 2400;

export class StageIntroScene extends Phaser.Scene {
  private introTimeout: number | null = null;

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

    this.add.rectangle(width / 2, height / 2, width, height, state.stage.palette.skyBottom, 0.96).setOrigin(0.5);
    this.add
      .rectangle(width / 2, height / 2, width - 120, height - 150, stagePresentation.panelColor, 0.92)
      .setStrokeStyle(2, state.stage.palette.accent, 0.45);

    this.add
      .text(width / 2, 104, stagePresentation.sectorLabel, {
        fontFamily: 'Trebuchet MS',
        fontSize: '20px',
        color: '#b9cab8',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 136, `Stage ${state.stageIndex + 1}`, {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#d6e5e2',
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 182, state.stage.name, {
        fontFamily: 'Trebuchet MS',
        fontSize: '40px',
        color: '#f7f3d6',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 226, `${stagePresentation.biomeLabel}\n${stagePresentation.paletteCue}`, {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#d7f2ee',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 290, state.stage.hint, {
        fontFamily: 'Trebuchet MS',
        fontSize: '17px',
        color: '#d0ddce',
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
          fontFamily: 'Trebuchet MS',
          fontSize: '20px',
          color: '#f5cf64',
          align: 'center',
          lineSpacing: 10,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, 520, stagePresentation.introLine, {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#b9cab8',
        align: 'center',
        wordWrap: { width: width - 260 },
      })
      .setOrigin(0.5);

    this.introTimeout = window.setTimeout(() => {
      this.scene.start('game');
    }, INTRO_DURATION_MS);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.introTimeout !== null) {
        window.clearTimeout(this.introTimeout);
        this.introTimeout = null;
      }
    });
  }
}
