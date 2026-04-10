import Phaser from 'phaser';
import { formatRunSettings, getActivePowerLabels } from '../../game/simulation/state';
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
    const activePowers = getActivePowerLabels(state.progress.activePowers, state.progress.powerTimers);

    this.add.rectangle(width / 2, height / 2, width, height, 0x08110f, 0.96).setOrigin(0.5);
    this.add.rectangle(width / 2, height / 2, width - 120, height - 150, 0x14201d, 0.92).setStrokeStyle(2, 0xf5cf64, 0.45);

    this.add
      .text(width / 2, 118, `Stage ${state.stageIndex + 1}`, {
        fontFamily: 'Trebuchet MS',
        fontSize: '22px',
        color: '#b9cab8',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 165, state.stage.name, {
        fontFamily: 'Trebuchet MS',
        fontSize: '40px',
        color: '#f7f3d6',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 222, state.stage.hint, {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#d0ddce',
        align: 'center',
        wordWrap: { width: width - 240 },
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        330,
        `Coins: ${state.progress.totalCoins}\nStage coins: ${state.stageRuntime.totalCoins}\nPowers: ${activePowers.length > 0 ? activePowers.join(', ') : 'None'}${
          state.progress.powerTimers.invincibleMs > 0 ? ` (${Math.ceil(state.progress.powerTimers.invincibleMs / 1000)}s)` : ''
        }\nRun: ${formatRunSettings(state.progress.runSettings)}`,
        {
          fontFamily: 'Trebuchet MS',
          fontSize: '22px',
          color: '#f5cf64',
          align: 'center',
          lineSpacing: 10,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, 455, 'Prepare for the next run', {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#b9cab8',
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
