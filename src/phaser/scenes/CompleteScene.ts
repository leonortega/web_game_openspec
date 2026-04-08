import Phaser from 'phaser';
import { stageDefinitions } from '../../game/content/stages';
import { SceneBridge } from '../adapters/sceneBridge';

export class CompleteScene extends Phaser.Scene {
  constructor() {
    super('complete');
  }

  create(): void {
    const bridge = this.registry.get('bridge') as SceneBridge;
    const session = bridge.getSession();
    const state = session.getState();
    const finalStage = state.stageIndex >= stageDefinitions.length - 1;
    const { width, height } = this.scale;

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
        `Recovered crystals: ${state.progress.totalCrystals}\nUnlocked stages: ${state.progress.unlockedStageIndex + 1}`,
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
          ? 'Press M for menu or R to replay the final stage'
          : 'Press N for the next stage, R to replay, or M for menu',
        {
          align: 'center',
          fontFamily: 'Trebuchet MS',
          fontSize: '20px',
          color: '#b9cab8',
        },
      )
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-R', () => {
      session.restartStage();
      this.scene.start('game');
    });
    this.input.keyboard?.once('keydown-M', () => {
      this.scene.start('menu');
    });
    this.input.keyboard?.once('keydown-N', () => {
      if (!finalStage) {
        session.advanceToNextStage();
        this.scene.start('game');
      }
    });
  }
}
