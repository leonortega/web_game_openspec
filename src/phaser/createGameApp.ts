import * as Phaser from 'phaser';
import { SceneBridge } from './adapters/sceneBridge';
import { buildGameConfig } from './gameConfig';
import { applyConfiguredRetroPostFxToCamera, applyRetroOverlayToScene, setCrtFilterEnabled } from './retroPostFx';

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
  setCrtFilterEnabled(game, true);
  if (isDebug) {
    (window as Window & { __CRYSTAL_RUN_GAME__?: Phaser.Game }).__CRYSTAL_RUN_GAME__ = game;
  }
  // Enable global retro postFX for this game instance.
  enableGlobalRetroPostFX(game);
  return game;
};

// Attach global retro postFX to every scene's main camera.
// Prefers Rex addCRT when present; falls back to built-in barrel + quantize.
function enableGlobalRetroPostFX(game: Phaser.Game): void {
  const bindSceneRetroAttach = (scene: Phaser.Scene): void => {
    scene.events.once(Phaser.Scenes.Events.READY, () => {
      attachRetroToScene(scene);
    });
    scene.events.once(Phaser.Scenes.Events.PRE_RENDER, () => {
      attachRetroToScene(scene);
    });
  };

  const attachRetroToScene = (scene: Phaser.Scene, retries = 2) => {
    try {
      const mainCam = (scene as any).cameras?.main;
      const externalFilters = (mainCam as any)?.filters?.external;

      if (!mainCam || !externalFilters) {
        if (retries > 0) {
          requestAnimationFrame(() => attachRetroToScene(scene, retries - 1));
        }
        return;
      }

      applyConfiguredRetroPostFxToCamera(game, mainCam);
      applyRetroOverlayToScene(scene);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Retro postFX attach failed for scene', (scene as any)?.sys?.settings?.key, err);
    }
  };

  // Attach to already created scenes (if any)
  try {
    const sceneManager = (game.scene as any);
    const keys = sceneManager.keys || {};
    for (const k in keys) {
      const s = keys[k];
      if (s) {
        bindSceneRetroAttach(s as Phaser.Scene);
        attachRetroToScene(s as Phaser.Scene);
      }
    }

    // Also attach when scenes start in future
    if (sceneManager.events && typeof sceneManager.events.on === 'function') {
      sceneManager.events.on(Phaser.Scenes.Events.START, (scene: Phaser.Scene) => {
        bindSceneRetroAttach(scene);
        scene.events.once(Phaser.Scenes.Events.CREATE, () => {
          attachRetroToScene(scene);
        });
        attachRetroToScene(scene);
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to enable global retro postFX', err);
  }
}

// Enable global retro postFX when module is loaded.
// The game instance is created via createGameApp; we locate it on window after boot.
try {
  // If a game already exists on window (debug), enable immediately.
  const maybeGame = (window as any).__CRYSTAL_RUN_GAME__ as Phaser.Game | undefined;
  if (maybeGame) {
    enableGlobalRetroPostFX(maybeGame);
  }
} catch (e) {
  // ignore
}
