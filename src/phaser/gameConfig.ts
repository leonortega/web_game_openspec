import * as Phaser from 'phaser';

import { GAME_SCENES } from './scenes';

export const buildGameConfig = (parent: HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.WEBGL,
  parent,
  width: 960,
  height: 540,
  backgroundColor: '#091310',
  scene: GAME_SCENES,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});