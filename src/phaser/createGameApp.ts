import * as Phaser from 'phaser';
import { SceneBridge } from './adapters/sceneBridge';
import { buildGameConfig } from './gameConfig';
import { RunProgressStore } from './persistence/RunProgressStore';
import { setCrtFilterEnabled } from './retroPostFx';
import { createDefaultRunSettings } from '../game/simulation/state';

export const createGameApp = (mountNode: HTMLElement | null): Phaser.Game => {
  if (!mountNode) {
    throw new Error('Missing #app mount node');
  }

  const shellFrame = document.createElement('div');
  shellFrame.className = 'game-shell-frame';
  mountNode.appendChild(shellFrame);

  const shell = document.createElement('div');
  shell.className = 'game-shell';
  shellFrame.appendChild(shell);

  const game = new Phaser.Game(buildGameConfig(shell));
  const progressStore = new RunProgressStore(game);
  const bridge = new SceneBridge(progressStore);
  const isDebug = new URLSearchParams(window.location.search).has('debug');
  if (isDebug) {
    (window as Window & { __CRYSTAL_RUN_BRIDGE__?: SceneBridge }).__CRYSTAL_RUN_BRIDGE__ = bridge;
  }

  game.registry.set('bridge', bridge);
  setCrtFilterEnabled(game, createDefaultRunSettings().crtEnabled);
  if (isDebug) {
    (window as Window & { __CRYSTAL_RUN_GAME__?: Phaser.Game }).__CRYSTAL_RUN_GAME__ = game;
  }
  return game;
};
