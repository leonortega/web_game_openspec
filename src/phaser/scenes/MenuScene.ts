import Phaser from 'phaser';
import { SceneBridge } from '../adapters/sceneBridge';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create(): void {
    const bridge = this.registry.get('bridge') as SceneBridge;
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x10211d, 1).setOrigin(0.5);

    this.add
      .text(width / 2, 120, 'Crystal Run', {
        fontFamily: 'Trebuchet MS',
        fontSize: '44px',
        color: '#f7f3d6',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 185, 'MVP platform game', {
        fontFamily: 'Trebuchet MS',
        fontSize: '20px',
        color: '#b8cab7',
      })
      .setOrigin(0.5);

    const state = bridge.getSession().getState();
    this.add
      .text(
        width / 2,
        290,
        `Unlocked stages: ${state.progress.unlockedStageIndex + 1}\nCrystals recovered: ${state.progress.totalCrystals}\nMain stages target ${state.stage.targetDurationMinutes}+ minutes`,
        {
          align: 'center',
          fontFamily: 'Trebuchet MS',
          fontSize: '22px',
          color: '#f7f3d6',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        430,
        'Press SPACE to enter the ruins\nPress 1, 2, or 3 to jump to an unlocked stage',
        {
          align: 'center',
          fontFamily: 'Trebuchet MS',
          fontSize: '20px',
          color: '#f5cf64',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-SPACE', () => {
      bridge.startStage(bridge.getSession().getState().stageIndex);
      this.scene.start('game');
    });

    for (const key of ['ONE', 'TWO', 'THREE'] as const) {
      this.input.keyboard?.once(`keydown-${key}`, () => {
        const index = { ONE: 0, TWO: 1, THREE: 2 }[key];
        bridge.startStage(index);
        this.scene.start('game');
      });
    }
  }
}
