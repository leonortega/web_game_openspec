import * as Phaser from 'phaser';
import EnhancedRenderPlugin from './plugins/EnhancedRenderPlugin';

import { GAME_SCENES } from './scenes';

const rexGlobals = globalThis as typeof globalThis & {
  rexcrtfilterplugin?: Phaser.Types.Core.PluginObjectItem['plugin'];
  rexlocalforagefilesplugin?: Phaser.Types.Core.PluginObjectItem['plugin'];
  rexscaleouterplugin?: Phaser.Types.Core.PluginObjectItem['plugin'];
  rextagtextplugin?: Phaser.Types.Core.PluginObjectItem['plugin'];
  rextextplayerplugin?: Phaser.Types.Core.PluginObjectItem['plugin'];
  rexuiplugin?: Phaser.Types.Core.PluginObjectItem['plugin'];
};

export const buildGameConfig = (parent: HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.WEBGL,
  parent,
  width: 960,
  height: 540,
  backgroundColor: '#091310',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  antialiasGL: false,
  mipmapFilter: 'NEAREST',
  // Register scene-scoped plugin that provides GPU sprite helper, unified filter facade, and lighting shim.
  plugins: {
    global: [
      { key: 'rexCrtFilter', plugin: rexGlobals.rexcrtfilterplugin!, start: true },
      { key: 'rexFiles', plugin: rexGlobals.rexlocalforagefilesplugin!, start: true },
      { key: 'rexTagText', plugin: rexGlobals.rextagtextplugin!, start: true },
      { key: 'rexTextPlayer', plugin: rexGlobals.rextextplayerplugin!, start: true },
    ],
    scene: [
      { key: 'rexUI', plugin: rexGlobals.rexuiplugin!, mapping: 'rexUI' as unknown as string },
      { key: 'rexScaleOuter', plugin: rexGlobals.rexscaleouterplugin!, mapping: 'rexScaleOuter' as unknown as string },
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
