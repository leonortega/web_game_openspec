import Phaser from 'phaser';
import { stageDefinitions } from '../../game/content/stages';
import { SceneBridge } from '../adapters/sceneBridge';

const AUTO_ADVANCE_MS = 2800;

export class CompleteScene extends Phaser.Scene {
  private autoAdvanceTimeout: number | null = null;

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

    this.add.rectangle(width / 2, height / 2, width, height, 0x091310, 0.92).setOrigin(0.5);
    this.add
      .text(width / 2, 170, finalStage ? 'Sanctum Cleansed' : 'Stage Cleared', {
        fontFamily: 'Trebuchet MS',
        fontSize: '42px',
        color: '#f7f3d6',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        250,
        `Recovered crystals: ${state.progress.totalCrystals}\nUnlocked stages: ${state.progress.unlockedStageIndex + 1}\nPower: ${state.progress.unlockedPowers.dash ? 'Air Dash online' : 'Dormant'}`,
        {
          align: 'center',
          fontFamily: 'Trebuchet MS',
          fontSize: '22px',
          color: '#f5cf64',
          lineSpacing: 10,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        390,
        finalStage
          ? 'Final stage clear. Press M for menu or R to replay.'
          : `Next stage opens automatically in ${Math.round(AUTO_ADVANCE_MS / 1000)} seconds.\nPress R to replay or M for menu.`,
        {
          align: 'center',
          fontFamily: 'Trebuchet MS',
          fontSize: '20px',
          color: '#b9cab8',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-R', replayStage);
    this.input.keyboard?.once('keydown-M', goToMenu);
    this.input.keyboard?.once('keydown-N', continueForward);

    if (!finalStage) {
      this.autoAdvanceTimeout = window.setTimeout(continueForward, AUTO_ADVANCE_MS);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.autoAdvanceTimeout !== null) {
        window.clearTimeout(this.autoAdvanceTimeout);
        this.autoAdvanceTimeout = null;
      }
    });
  }
}
