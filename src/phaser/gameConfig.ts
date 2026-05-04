import * as Phaser from 'phaser';
import EnhancedRenderPlugin from './plugins/EnhancedRenderPlugin';

import { GAME_SCENES } from './scenes';

export const buildGameConfig = (parent: HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.WEBGL,
  parent,
  width: 960,
  height: 540,
  backgroundColor: '#091310',
  pixelArt: true,
  antialias: false,
  antialiasGL: false,
  // Register scene-scoped plugin that provides GPU sprite helper, unified filter facade, and lighting shim.
  plugins: {
    scene: [
      { key: 'EnhancedRender', plugin: EnhancedRenderPlugin, mapping: 'enhanced' as unknown as string },
    ],
  },
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