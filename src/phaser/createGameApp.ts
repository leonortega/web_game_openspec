import Phaser from 'phaser';
import { SceneBridge } from './adapters/sceneBridge';
import { BootScene } from './scenes/BootScene';
import { CompleteScene } from './scenes/CompleteScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { StageIntroScene } from './scenes/StageIntroScene';

export const createGameApp = (mountNode: HTMLElement | null): Phaser.Game => {
  if (!mountNode) {
    throw new Error('Missing #app mount node');
  }

  const shell = document.createElement('div');
  shell.className = 'game-shell';
  mountNode.appendChild(shell);

  const bridge = new SceneBridge();
  const isDebug = new URLSearchParams(window.location.search).has('debug');
  if (isDebug) {
    (window as Window & { __CRYSTAL_RUN_BRIDGE__?: SceneBridge }).__CRYSTAL_RUN_BRIDGE__ = bridge;
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: shell,
    width: 960,
    height: 540,
    backgroundColor: '#091310',
    scene: [BootScene, MenuScene, StageIntroScene, GameScene, CompleteScene],
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

  game.registry.set('bridge', bridge);
  if (isDebug) {
    (window as Window & { __CRYSTAL_RUN_GAME__?: Phaser.Game }).__CRYSTAL_RUN_GAME__ = game;
  }
  return game;
};
