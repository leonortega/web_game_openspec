import * as Phaser from 'phaser';
import { SceneBridge } from './adapters/sceneBridge';
import { buildGameConfig } from './gameConfig';

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

  const bridge = new SceneBridge();
  const isDebug = new URLSearchParams(window.location.search).has('debug');
  if (isDebug) {
    (window as Window & { __CRYSTAL_RUN_BRIDGE__?: SceneBridge }).__CRYSTAL_RUN_BRIDGE__ = bridge;
  }

  const game = new Phaser.Game(buildGameConfig(shell));

  game.registry.set('bridge', bridge);
  if (isDebug) {
    (window as Window & { __CRYSTAL_RUN_GAME__?: Phaser.Game }).__CRYSTAL_RUN_GAME__ = game;
  }
  // Enable global quantize postFX for this game instance.
  enableGlobalQuantizePostFX(game);
  return game;
};

// Attach a global quantize + dither postFX to every scene's main camera.
// Uses Phaser's built-in Quantize filter (R,G,B steps + dither).
function enableGlobalQuantizePostFX(game: Phaser.Game): void {
  const attachQuantizeToScene = (scene: Phaser.Scene) => {
    try {
      const mainCam = (scene as any).cameras?.main;
      if (
        mainCam &&
        mainCam.filters &&
        mainCam.filters.external &&
        typeof mainCam.filters.external.addQuantize === 'function'
      ) {
        // R5-G6-B5 -> steps ~ [32, 64, 32]. Alpha steps set to 1.
        mainCam.filters.external.addQuantize({ steps: [32, 64, 32, 1], dither: true, mode: 0 });
        // Mark registry so canvas-side textures avoid double-quantizing.
        try {
          (game.registry as any).set('globalQuantizeEnabled', true);
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Quantize postFX attach failed for scene', (scene as any)?.sys?.settings?.key, err);
    }
  };

  // Attach to already created scenes (if any)
  try {
    const sceneManager = (game.scene as any);
    const keys = sceneManager.keys || {};
    for (const k in keys) {
      const s = keys[k];
      if (s) {
        attachQuantizeToScene(s as Phaser.Scene);
      }
    }

    // Also attach when scenes start in future
    if (sceneManager.events && typeof sceneManager.events.on === 'function') {
      sceneManager.events.on(Phaser.Scenes.Events.START, (scene: Phaser.Scene) => {
        attachQuantizeToScene(scene);
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to enable global quantize postFX', err);
  }
}

// Enable global quantize postFX when module is loaded.
// The game instance is created via createGameApp; we locate it on window after boot.
try {
  // If a game already exists on window (debug), enable immediately.
  const maybeGame = (window as any).__CRYSTAL_RUN_GAME__ as Phaser.Game | undefined;
  if (maybeGame) {
    enableGlobalQuantizePostFX(maybeGame);
  }
} catch (e) {
  // ignore
}
