import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = 'exit-cabin-door-open-animation';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'capsule-exit-playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'capsule-exit-playtest-report.md');
const VITE_PREVIEW_BIN = path.join(ROOT, 'node_modules', '.bin', 'vite.cmd');
const PORT = 4193;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;
const VIEWPORT = { width: 1440, height: 900 };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}
    await wait(400);
  }

  throw new Error(`Timed out waiting for preview server at ${url}`);
}

async function waitForActiveScene(page, sceneKey, timeoutMs = 12000) {
  await page.waitForFunction(
    (key) => {
      const game = window.__CRYSTAL_RUN_GAME__;
      if (!game) {
        return false;
      }
      return game.scene.getScenes(true).some((scene) => scene.scene.key === key);
    },
    sceneKey,
    { timeout: timeoutMs },
  );
}

async function resetAudioDebug(page) {
  await page.evaluate(() => {
    window.__CRYSTAL_RUN_AUDIO_DEBUG__ = {
      activeOwner: null,
      events: [],
      lastCue: null,
      unlockCount: 0,
    };
  });
}

async function readAudioDebug(page) {
  return page.evaluate(() => window.__CRYSTAL_RUN_AUDIO_DEBUG__ ?? null);
}

function attachPageLogging(page) {
  page.on('pageerror', (error) => {
    console.error(`browser page error: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      console.error(`browser console error: ${message.text()}`);
    }
  });
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  attachPageLogging(page);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForActiveScene(page, 'menu');
  await page.locator('canvas').click({ position: { x: 24, y: 24 } });
  return page;
}

async function readExitSupportChecks(page) {
  return page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const results = [];

    for (let stageIndex = 0; stageIndex < 3; stageIndex += 1) {
      bridge.forceStartStage(stageIndex);
      const state = bridge.getSession().getState();
      const exit = state.stage.exit;
      const exitBottom = exit.y + exit.height;
      const support = state.stageRuntime.platforms.find((platform) => {
        const overlap = Math.max(0, Math.min(exit.x + exit.width, platform.x + platform.width) - Math.max(exit.x, platform.x));
        return platform.kind === 'static' && overlap >= Math.min(exit.width * 0.55, platform.width) && Math.abs(exitBottom - platform.y) <= 12;
      });

      results.push({
        stageId: state.stage.id,
        supported: Boolean(support),
        supportId: support?.id ?? null,
      });
    }

    return results;
  });
}

async function waitForStageStartSequenceToResolve(page, timeoutMs = 5000) {
  await page.waitForFunction(
    () => {
      const game = window.__CRYSTAL_RUN_GAME__;
      const scene = game.scene.getScene('game');
      const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
      return Boolean(debug && debug.stageStartArrivalActive === false && debug.gameplayMusicStarted === true);
    },
    undefined,
    { timeout: timeoutMs },
  );
}

async function waitForExitHideMoment(page, timeoutMs = 4000) {
  await page.waitForFunction(
    () => {
      const bridge = window.__CRYSTAL_RUN_BRIDGE__;
      const game = window.__CRYSTAL_RUN_GAME__;
      const scene = game.scene.getScene('game');
      const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
      const state = bridge.getSession().getState();
      return Boolean(
        state.exitFinish.active === true &&
          state.exitFinish.suppressPresentation === true &&
          debug &&
          debug.playerVisualVisibleCount === 0,
      );
    },
    undefined,
    { timeout: timeoutMs },
  );
}

async function waitForExitDoorOpenBeat(page, timeoutMs = 4000) {
  await page.waitForFunction(
    () => {
      const bridge = window.__CRYSTAL_RUN_BRIDGE__;
      const game = window.__CRYSTAL_RUN_GAME__;
      const scene = game.scene.getScene('game');
      const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
      const state = bridge.getSession().getState();
      return Boolean(
        state.exitFinish.active === true &&
          state.levelCompleted === false &&
          debug &&
          debug.exitDoorVisible === true &&
          debug.exitDoorOpenProgress > 0.35 &&
          debug.exitDoorWidth < 24,
      );
    },
    undefined,
    { timeout: timeoutMs },
  );
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });

  const preview =
    process.platform === 'win32'
      ? spawn('cmd.exe', ['/d', '/s', '/c', `${VITE_PREVIEW_BIN} preview --host 127.0.0.1 --port ${PORT} --strictPort`], {
          cwd: ROOT,
          stdio: 'pipe',
        })
      : spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
          cwd: ROOT,
          stdio: 'pipe',
        });

  preview.stdout.on('data', (chunk) => process.stdout.write(chunk));
  preview.stderr.on('data', (chunk) => process.stderr.write(chunk));

  const cleanup = async () => {
    if (preview.exitCode !== null || !preview.pid) {
      return;
    }

    if (process.platform === 'win32') {
      await new Promise((resolve) => {
        const killer = spawn('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' });
        killer.once('exit', () => resolve());
        killer.once('error', () => resolve());
      });
      return;
    }

    preview.kill('SIGTERM');
  };

  try {
    await waitForServer(`http://127.0.0.1:${PORT}`);
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await openPage(browser);
      try {
        await resetAudioDebug(page);
        await page.evaluate(() => {
          const bridge = window.__CRYSTAL_RUN_BRIDGE__;
          const game = window.__CRYSTAL_RUN_GAME__;

          bridge.forceStartStage(0);
          game.scene.stop('menu');
          game.scene.stop('game');
          game.scene.stop('complete');
          game.scene.start('stage-intro');
        });

        await waitForActiveScene(page, 'stage-intro');

        const introSnapshot = await page.evaluate(() => {
          const game = window.__CRYSTAL_RUN_GAME__;
          const scene = game.scene.getScene('stage-intro');
          return typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
        });

        const exitSupportChecks = await readExitSupportChecks(page);

        await resetAudioDebug(page);
        await page.evaluate(() => {
          const bridge = window.__CRYSTAL_RUN_BRIDGE__;
          const game = window.__CRYSTAL_RUN_GAME__;

          bridge.forceStartStage(0);
          game.scene.stop('menu');
          game.scene.stop('complete');
          game.scene.stop('stage-intro');
          game.scene.start('game');

          const state = bridge.getSession().getState();
          state.stageRuntime.enemies = [];
          state.stageRuntime.hazards = [];
          state.stageRuntime.objective = null;
          state.player.x = state.stage.exit.x + 4;
          state.player.y = state.stage.exit.y;
          state.player.vx = 0;
          state.player.vy = 0;

          bridge.consumeFrame(16);
        });

        await waitForActiveScene(page, 'game');
        await waitForStageStartSequenceToResolve(page);
        await waitForExitDoorOpenBeat(page);

        const doorOpenBeat = await page.evaluate(() => {
          const bridge = window.__CRYSTAL_RUN_BRIDGE__;
          const game = window.__CRYSTAL_RUN_GAME__;
          const scene = game.scene.getScene('game');
          const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
          const state = bridge.getSession().getState();
          return {
            levelCompleted: state.levelCompleted,
            exitFinishActive: state.exitFinish.active,
            exitFinishTimerMs: state.exitFinish.timerMs,
            exitDoorVisible: debug?.exitDoorVisible ?? null,
            exitDoorWidth: debug?.exitDoorWidth ?? null,
            exitDoorTextureKey: debug?.exitDoorTextureKey ?? null,
            exitDoorOpenProgress: debug?.exitDoorOpenProgress ?? null,
            activeScenes: game.scene.getScenes(true).map((activeScene) => activeScene.scene.key),
          };
        });

        await waitForExitHideMoment(page);

        const midFinishHide = await page.evaluate(() => {
          const bridge = window.__CRYSTAL_RUN_BRIDGE__;
          const game = window.__CRYSTAL_RUN_GAME__;
          const scene = game.scene.getScene('game');
          const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
          const state = bridge.getSession().getState();
          return {
            levelCompleted: state.levelCompleted,
            exitFinishActive: state.exitFinish.active,
            exitFinishTimerMs: state.exitFinish.timerMs,
            exitDoorVisible: debug?.exitDoorVisible ?? null,
            exitDoorWidth: debug?.exitDoorWidth ?? null,
            exitDoorTextureKey: debug?.exitDoorTextureKey ?? null,
            exitDoorOpenProgress: debug?.exitDoorOpenProgress ?? null,
            playerVisualVisibleCount: debug?.playerVisualVisibleCount ?? null,
            persistentStartCapsuleVisible: debug?.persistentStartCapsuleVisible ?? null,
            arrivalCapsuleUsesExitArt: debug?.arrivalCapsuleUsesExitArt ?? null,
            arrivalCapsuleShellTextureKey: debug?.arrivalCapsuleShellTextureKey ?? null,
            arrivalCapsuleDoorTextureKey: debug?.arrivalCapsuleDoorTextureKey ?? null,
            exitSpriteTextureKey: debug?.exitSpriteTextureKey ?? null,
            exitSpriteAlpha: debug?.exitSpriteAlpha ?? null,
            exitBaseVisible: debug?.exitBaseVisible ?? null,
            exitBeaconVisible: debug?.exitBeaconVisible ?? null,
            activeScenes: game.scene.getScenes(true).map((activeScene) => activeScene.scene.key),
          };
        });
        const audioDebug = await readAudioDebug(page);

        await waitForActiveScene(page, 'complete', 12000);
        const handoff = await page.evaluate(() => {
          const game = window.__CRYSTAL_RUN_GAME__;
          const bridge = window.__CRYSTAL_RUN_BRIDGE__;
          return {
            activeScenes: game.scene.getScenes(true).map((scene) => scene.scene.key),
            levelCompleted: bridge.getSession().getState().levelCompleted,
            exitFinishActive: bridge.getSession().getState().exitFinish.active,
          };
        });

        const result = {
          introSnapshot,
          exitSupportChecks,
          doorOpenBeat,
          midFinishHide,
          handoff,
          capsuleTeleportCueSeen: audioDebug.events.some(
            (event) => event.type === 'cue' && event.cue === 'capsule-teleport',
          ),
        };
        const passed =
          result.introSnapshot?.accentMode === 'none' &&
          result.introSnapshot?.accentVisible === false &&
          result.introSnapshot?.accentTweenActive === false &&
          result.introSnapshot?.accentBurstCount === 0 &&
          result.exitSupportChecks.every((entry) => entry.supported === true) &&
          result.doorOpenBeat.exitFinishActive === true &&
          result.doorOpenBeat.levelCompleted === false &&
          result.doorOpenBeat.exitDoorVisible === true &&
          result.doorOpenBeat.exitDoorTextureKey === 'exit-door-open' &&
          result.doorOpenBeat.exitDoorOpenProgress > 0.35 &&
          result.doorOpenBeat.exitDoorWidth < 24 &&
          !result.doorOpenBeat.activeScenes.includes('complete') &&
          result.midFinishHide.exitFinishActive === true &&
          result.midFinishHide.levelCompleted === false &&
          result.midFinishHide.playerVisualVisibleCount === 0 &&
          result.midFinishHide.persistentStartCapsuleVisible === true &&
          result.midFinishHide.arrivalCapsuleUsesExitArt === true &&
          result.midFinishHide.arrivalCapsuleShellTextureKey === 'exit-shell' &&
          result.midFinishHide.arrivalCapsuleDoorTextureKey === 'exit-door' &&
          result.midFinishHide.exitSpriteTextureKey === 'exit-shell' &&
          result.midFinishHide.exitBaseVisible === true &&
          result.midFinishHide.exitBeaconVisible === true &&
          result.midFinishHide.exitDoorVisible === true &&
          result.midFinishHide.exitDoorOpenProgress > 0.35 &&
          !result.midFinishHide.activeScenes.includes('complete') &&
          result.capsuleTeleportCueSeen === true &&
          result.handoff.activeScenes.includes('complete') &&
          result.handoff.levelCompleted === true &&
          result.handoff.exitFinishActive === false;

        await fs.writeFile(JSON_REPORT, `${JSON.stringify({ ...result, passed }, null, 2)}\n`, 'utf8');
        await fs.writeFile(
          MD_REPORT,
          [
            '# Capsule Exit Playtest',
            '',
            `- URL: \`${BASE_URL}\``,
            `- Intro accent mode: \`${result.introSnapshot?.accentMode ?? 'missing'}\``,
            `- Intro accent visible: \`${result.introSnapshot?.accentVisible ?? 'missing'}\``,
            `- Intro accent tween active: \`${result.introSnapshot?.accentTweenActive ?? 'missing'}\``,
            `- Intro accent burst count: \`${result.introSnapshot?.accentBurstCount ?? 'missing'}\``,
            `- Exit support checks passed: \`${result.exitSupportChecks.every((entry) => entry.supported === true)}\``,
            `- Door-open beat active before handoff: \`${result.doorOpenBeat.exitFinishActive}\``,
            `- Door-open beat visible: \`${result.doorOpenBeat.exitDoorVisible}\``,
            `- Door-open beat texture: \`${result.doorOpenBeat.exitDoorTextureKey}\``,
            `- Door-open beat width: \`${result.doorOpenBeat.exitDoorWidth}\``,
            `- Mid-finish hide active: \`${result.midFinishHide.exitFinishActive}\``,
            `- Mid-finish completed: \`${result.midFinishHide.levelCompleted}\``,
            `- Mid-finish visible player parts: \`${result.midFinishHide.playerVisualVisibleCount}\``,
            `- Persistent start capsule still visible: \`${result.midFinishHide.persistentStartCapsuleVisible}\``,
            `- Start capsule still using exit shell and door art: \`${result.midFinishHide.arrivalCapsuleUsesExitArt}\``,
            `- Mid-finish exit base visible: \`${result.midFinishHide.exitBaseVisible}\``,
            `- Mid-finish exit beacon visible: \`${result.midFinishHide.exitBeaconVisible}\``,
            `- Teleport cue seen: \`${result.capsuleTeleportCueSeen}\``,
            `- Complete scene reached: \`${result.handoff.activeScenes.includes('complete')}\``,
            `- Overall pass: \`${passed}\``,
            '',
            passed
              ? '- Grounded start and exit support stayed intact, the exit door opened during the bounded finish, and the normal complete-scene handoff still waited for the finish to resolve.'
              : '- The grounded support, exit door-open beat, or bounded finish handoff checks failed.',
            '',
          ].join('\n'),
          'utf8',
        );

        if (!passed) {
          throw new Error('Capsule exit completion playtest failed');
        }
      } finally {
        await page.close();
      }
    } finally {
      await browser.close();
    }
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});