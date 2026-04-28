import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = 'traversal-category-visual-language';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'traversal-category-visual-language-playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'traversal-category-visual-language-playtest-report.md');
const VITE_PREVIEW_BIN = path.join(ROOT, 'node_modules', '.bin', 'vite.cmd');
const PORT = 4195;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;
const VIEWPORT = { width: 1440, height: 900 };
const GRAVITY_ROOM_SHELL_COLOR = 0x2f6f91;
const GRAVITY_ROOM_BUTTON_COLOR = 0xf2c94c;

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

async function waitForActiveScene(page, sceneKey, timeoutMs = 20000) {
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

async function forceStartGameScene(page, stageIndex) {
  await page.evaluate((targetStageIndex) => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;

    bridge.forceStartStage(targetStageIndex);
    ['game', 'complete', 'stage-intro'].forEach((sceneKey) => {
      if (game.scene.getScenes(false).some((scene) => scene.scene.key === sceneKey)) {
        game.scene.stop(sceneKey);
      }
    });
    game.scene.start('stage-intro');
  }, stageIndex);
  await waitForActiveScene(page, 'stage-intro');
  await waitForActiveScene(page, 'game');
  await page.waitForFunction(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game?.scene?.getScene('game');
    return Boolean(scene && typeof scene.getDebugSnapshot === 'function' && scene.getDebugSnapshot()?.platformVisuals);
  });
}

async function readGameState(page) {
  return page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    return {
      debug: typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null,
      state: bridge.getSession().getState(),
    };
  });
}

async function activateForestMagneticRoute(page) {
  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    const node = state.stageRuntime.activationNodes[0];

    state.stageRuntime.enemies = [];
    state.player.x = node.x + 2;
    state.player.y = node.y + 2;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    bridge.consumeFrame(16);
  });
}

async function activateSkyGravityCapsule(page) {
  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    const capsule = state.stageRuntime.gravityCapsules[0];
    const buttonSupport = state.stageRuntime.platforms.find((platform) => {
      const overlap = Math.max(
        0,
        Math.min(capsule.button.x + capsule.button.width, platform.x + platform.width) - Math.max(capsule.button.x, platform.x),
      );
      return overlap >= Math.min(capsule.button.width * 0.55, platform.width) && Math.abs(capsule.button.y + capsule.button.height - platform.y) <= 24;
    });

    state.stageRuntime.enemies = [];
    state.player.x = capsule.button.x + capsule.button.width / 2 - state.player.width / 2;
    state.player.y = buttonSupport.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = buttonSupport.id;
    bridge.consumeFrame(16);
  });
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

      await forceStartGameScene(page, 0);
      const forestBefore = await readGameState(page);
      const springVisual = forestBefore.debug.platformVisuals.find((platform) => platform.kind === 'spring');
      const staticVisual = forestBefore.debug.platformVisuals.find(
        (platform) => platform.kind === 'static' && !platform.revealId && !platform.temporaryBridgeScannerId && !platform.magneticPowered,
      );
      const forestCapsuleVisual = forestBefore.debug.gravityCapsuleVisuals.find(
        (capsule) => capsule.id === 'forest-anti-grav-canopy-room',
      );
      const forestRoomPlatform = forestBefore.debug.platformVisuals.find((platform) => platform.id === 'platform-9190-530');

      await activateForestMagneticRoute(page);
      const forestAfter = await readGameState(page);
      const nodeAfter = forestAfter.debug.activationNodeVisuals.find((node) => node.id === 'forest-magnetic-node-1');
      const magneticAfter = forestAfter.debug.platformVisuals.find((platform) => platform.id === 'forest-magnetic-platform-1');

      await forceStartGameScene(page, 1);
      const amberBefore = await readGameState(page);
      const amberCapsuleVisual = amberBefore.debug.gravityCapsuleVisuals.find(
        (capsule) => capsule.id === 'amber-inversion-smelter-room',
      );
      const amberRoomPlatform = amberBefore.debug.platformVisuals.find((platform) => platform.id === 'platform-10510-570');

      await forceStartGameScene(page, 2);
      const skyBefore = await readGameState(page);
      const antiGravFieldBefore = skyBefore.debug.gravityFieldVisuals.find((field) => field.id === 'sky-anti-grav-stream');
      const inversionField = skyBefore.debug.gravityFieldVisuals.find((field) => field.id === 'sky-gravity-inversion-column');
      const antiGravCapsuleBefore = skyBefore.debug.gravityCapsuleVisuals.find((capsule) => capsule.id === 'sky-anti-grav-capsule');
      const inversionCapsuleBefore = skyBefore.debug.gravityCapsuleVisuals.find(
        (capsule) => capsule.id === 'sky-gravity-inversion-capsule',
      );
      const skyRoomPlatform = skyBefore.debug.platformVisuals.find((platform) => platform.id === 'platform-9490-540');
      await activateSkyGravityCapsule(page);
      const skyAfter = await readGameState(page);
      const disabledFieldAfter = skyAfter.debug.gravityFieldVisuals.find((field) => field.id === antiGravFieldBefore?.id);
      const capsuleAfter = skyAfter.debug.gravityCapsuleVisuals.find((capsule) => capsule.id === 'sky-anti-grav-capsule');

      const allFieldsEnclosed = [forestBefore, amberBefore, skyBefore].every(
        (snapshot) =>
          snapshot.state.stageRuntime.gravityFields.length > 0 &&
          snapshot.state.stageRuntime.gravityFields.length === snapshot.state.stageRuntime.gravityCapsules.length &&
          snapshot.state.stageRuntime.gravityFields.every((field) => field.gravityCapsuleId),
      );

      const assertions = [
        {
          name: 'assisted movement uses family markers on spring platforms',
          passed:
            springVisual?.visualCategory === 'assistedMovement' &&
            springVisual?.markerVisibleCount === 3 &&
            staticVisual?.visualCategory === 'neutral' &&
            staticVisual?.markerVisibleCount === 0,
        },
        {
          name: 'route toggle activation updates node and magnetic platform locally',
          passed:
            nodeAfter?.visualCategory === 'routeToggle' &&
            nodeAfter?.markerVisibleCount === 3 &&
            magneticAfter?.visualCategory === 'routeToggle' &&
            magneticAfter?.magneticPowered === true &&
            magneticAfter?.markerVisibleCount === 3,
        },
        {
          name: 'current playable stages author every gravity field as an enclosed room',
          passed: allFieldsEnclosed,
        },
        {
          name: 'gravity rooms use blue shells and yellow buttons while room-local platforms keep authored colors',
          passed:
            forestCapsuleVisual?.shellFillColor === GRAVITY_ROOM_SHELL_COLOR &&
            forestCapsuleVisual?.buttonFillColor === GRAVITY_ROOM_BUTTON_COLOR &&
            forestRoomPlatform?.fillColor !== GRAVITY_ROOM_SHELL_COLOR &&
            amberCapsuleVisual?.shellFillColor === GRAVITY_ROOM_SHELL_COLOR &&
            amberCapsuleVisual?.buttonFillColor === GRAVITY_ROOM_BUTTON_COLOR &&
            amberRoomPlatform?.fillColor !== GRAVITY_ROOM_SHELL_COLOR &&
            antiGravCapsuleBefore?.shellFillColor === GRAVITY_ROOM_SHELL_COLOR &&
            antiGravCapsuleBefore?.buttonFillColor === GRAVITY_ROOM_BUTTON_COLOR &&
            inversionCapsuleBefore?.shellFillColor === GRAVITY_ROOM_SHELL_COLOR &&
            inversionCapsuleBefore?.buttonFillColor === GRAVITY_ROOM_BUTTON_COLOR &&
            skyRoomPlatform?.fillColor !== GRAVITY_ROOM_SHELL_COLOR,
        },
        {
          name: 'active gravity room field reads as gravity modifier before button disable',
          passed:
            antiGravFieldBefore?.visualCategory === 'gravityModifier' &&
            antiGravFieldBefore?.markerVisibleCount === 4 &&
            inversionField?.visualCategory === 'gravityModifier' &&
            inversionField?.markerVisibleCount === 4,
        },
        {
          name: 'gravity room button disable flips the linked field into route-toggle family',
          passed:
            disabledFieldAfter?.visualCategory === 'routeToggle' &&
            disabledFieldAfter?.markerVisibleCount === 4 &&
            capsuleAfter?.enabled === false &&
            capsuleAfter?.shellVisualCategory === 'routeToggle' &&
            capsuleAfter?.buttonVisualCategory === 'routeToggle' &&
            capsuleAfter?.shellMarkerVisibleCount === 3 &&
            capsuleAfter?.buttonMarkerVisibleCount === 3,
        },
      ];

      const passed = assertions.every((assertion) => assertion.passed);
      const report = {
        change: CHANGE_NAME,
        passed,
        assertions,
        snapshots: {
          forestBefore: {
            springVisual,
            staticVisual,
            forestCapsuleVisual,
            forestRoomPlatform,
          },
          forestAfter: {
            nodeAfter,
            magneticAfter,
          },
          amberBefore: {
            amberCapsuleVisual,
            amberRoomPlatform,
          },
          skyBefore: {
            antiGravFieldBefore,
            inversionField,
            antiGravCapsuleBefore,
            inversionCapsuleBefore,
            skyRoomPlatform,
          },
          skyAfter: {
            disabledFieldAfter,
            capsuleAfter,
          },
        },
      };

      const mdLines = [
        '# Traversal Category Visual Language Playtest',
        '',
        `Passed: ${passed ? 'yes' : 'no'}`,
        '',
        '## Assertions',
        ...assertions.map((assertion) => `- [${assertion.passed ? 'x' : ' '}] ${assertion.name}`),
      ];

      await fs.writeFile(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      await fs.writeFile(MD_REPORT, `${mdLines.join('\n')}\n`, 'utf8');

      if (!passed) {
        throw new Error(`Traversal category visual language playtest failed. See ${JSON_REPORT}`);
      }
    } finally {
      await browser.close();
    }
  } finally {
    await cleanup();
  }
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});