import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = 'add-contained-gravity-room-enemies-and-fix-button-reach';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'gravity-room-button-route-and-contained-enemies-playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'gravity-room-button-route-and-contained-enemies-playtest-report.md');
const VITE_PREVIEW_BIN = path.join(ROOT, 'node_modules', '.bin', 'vite.cmd');
const PORT = 4198;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;
const VIEWPORT = { width: 1440, height: 900 };

const ROOMS = [
  {
    stageIndex: 0,
    stageId: 'forest-ruins',
    roomId: 'forest-anti-grav-canopy-room',
    fieldId: 'forest-anti-grav-canopy-lift',
    fieldKind: 'anti-grav-stream',
    enemyIds: ['forest-room-walker-1'],
  },
  {
    stageIndex: 1,
    stageId: 'amber-cavern',
    roomId: 'amber-inversion-smelter-room',
    fieldId: 'amber-inversion-smelter-column',
    fieldKind: 'gravity-inversion-column',
    enemyIds: ['amber-room-walker-1'],
  },
  {
    stageIndex: 2,
    stageId: 'sky-sanctum',
    roomId: 'sky-anti-grav-capsule',
    fieldId: 'sky-anti-grav-stream',
    fieldKind: 'anti-grav-stream',
    enemyIds: ['sky-room-walker-1'],
  },
  {
    stageIndex: 2,
    stageId: 'sky-sanctum',
    roomId: 'sky-gravity-inversion-capsule',
    fieldId: 'sky-gravity-inversion-column',
    fieldKind: 'gravity-inversion-column',
    enemyIds: ['sky-room-walker-2'],
  },
];

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
}

async function collectRoomEvidence(page, room) {
  await forceStartGameScene(page, room.stageIndex);

  return page.evaluate((target) => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    const capsule = state.stageRuntime.gravityCapsules.find((entry) => entry.id === target.roomId);
    const field = state.stageRuntime.gravityFields.find((entry) => entry.id === target.fieldId);

    if (!capsule || !field) {
      return null;
    }

    const linkedEnemyIds = new Set(target.enemyIds ?? []);
    const buttonSupport = state.stageRuntime.platforms.find((platform) => {
      const overlap = Math.max(
        0,
        Math.min(capsule.button.x + capsule.button.width, platform.x + platform.width) - Math.max(capsule.button.x, platform.x),
      );
      return overlap >= Math.min(capsule.button.width * 0.55, platform.width) && Math.abs(capsule.button.y + capsule.button.height - platform.y) <= 24;
    });
    const buttonLane = {
      x: Math.min(capsule.button.x, capsule.buttonRoute.x) - 36,
      y: Math.min(capsule.button.y, capsule.buttonRoute.y) - 56,
      width:
        Math.max(capsule.button.x + capsule.button.width, capsule.buttonRoute.x + capsule.buttonRoute.width) -
        Math.min(capsule.button.x, capsule.buttonRoute.x) +
        72,
      height:
        Math.max(capsule.button.y + capsule.button.height, capsule.buttonRoute.y + capsule.buttonRoute.height) -
        Math.min(capsule.button.y, capsule.buttonRoute.y) +
        112,
    };

    const linkedEnemiesBefore = state.stageRuntime.enemies
      .filter((enemy) => linkedEnemyIds.has(enemy.id))
      .map((enemy) => ({ id: enemy.id, x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }));

    const enemyIntersectsLane = (enemy) =>
      enemy.x < buttonLane.x + buttonLane.width &&
      enemy.x + enemy.width > buttonLane.x &&
      enemy.y < buttonLane.y + buttonLane.height &&
      enemy.y + enemy.height > buttonLane.y;

    if (!buttonSupport) {
      return {
        stageId: target.stageId,
        roomId: target.roomId,
        fieldId: target.fieldId,
        fieldKind: target.fieldKind,
        missingButtonSupport: true,
      };
    }

    state.player.x = capsule.button.x - state.player.width - 8;
    state.player.y = buttonSupport.y - state.player.height;
    state.player.vx = 180;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = buttonSupport.id;

    bridge.setRight(true);
    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.consumeFrame(16);

    const firstJumpFrame = {
      gravityFieldId: state.player.gravityFieldId,
      gravityFieldKind: state.player.gravityFieldKind,
      gravityScale: state.player.gravityScale,
      vy: state.player.vy,
    };

    state.player.x = capsule.button.x + capsule.button.width / 2 - state.player.width / 2;

    let framesToButton = 1;
    while (framesToButton < 30) {
      const activeCapsule = state.stageRuntime.gravityCapsules.find((entry) => entry.id === target.roomId);
      if (activeCapsule?.button.activated) {
        break;
      }

      bridge.consumeFrame(16);
      framesToButton += 1;
    }

    bridge.setJumpHeld(false);
    bridge.setRight(false);
    bridge.consumeFrame(16);

    const finalCapsule = state.stageRuntime.gravityCapsules.find((entry) => entry.id === target.roomId);
    const linkedEnemiesAfter = state.stageRuntime.enemies
      .filter((enemy) => linkedEnemyIds.has(enemy.id))
      .map((enemy) => ({ id: enemy.id, x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }));

    return {
      stageId: target.stageId,
      roomId: target.roomId,
      fieldId: target.fieldId,
      fieldKind: target.fieldKind,
      missingButtonSupport: false,
      fieldMatchesShell:
        field.x === capsule.shell.x && field.y === capsule.shell.y && field.width === capsule.shell.width && field.height === capsule.shell.height,
      linkedEnemyIds: [...linkedEnemyIds],
      linkedEnemiesBefore,
      linkedEnemiesAfter,
      enemyLaneClearBefore: linkedEnemiesBefore.every((enemy) => !enemyIntersectsLane(enemy)),
      enemyLaneClearAfter: linkedEnemiesAfter.every((enemy) => !enemyIntersectsLane(enemy)),
      firstJumpFrame,
      framesToButton,
      buttonActivated: Boolean(finalCapsule?.button.activated),
      capsuleEnabledAfter: finalCapsule?.enabled ?? null,
      gravityFieldClearedAfterDisable: state.player.gravityFieldId === null,
      enemiesContainedAfter: linkedEnemiesAfter.every(
        (enemy) =>
          enemy.x >= capsule.shell.x &&
          enemy.y >= capsule.shell.y &&
          enemy.x + enemy.width <= capsule.shell.x + capsule.shell.width &&
          enemy.y + enemy.height <= capsule.shell.y + capsule.shell.height,
      ),
    };
  }, room);
}

function roomPassed(result) {
  return Boolean(
    result &&
      result.missingButtonSupport === false &&
      result.fieldMatchesShell === true &&
      result.linkedEnemyIds.length > 0 &&
      result.enemyLaneClearBefore === true &&
      result.enemyLaneClearAfter === true &&
      result.firstJumpFrame.gravityFieldId === result.fieldId &&
      result.firstJumpFrame.gravityFieldKind === result.fieldKind &&
      result.firstJumpFrame.vy < -620 &&
      result.buttonActivated === true &&
      result.capsuleEnabledAfter === false &&
      result.gravityFieldClearedAfterDisable === true &&
      result.enemiesContainedAfter === true
  );
}

function buildMarkdown(results) {
  const passed = results.every((result) => roomPassed(result));
  const lines = [
    '# Gravity Room Button Route And Contained Enemies Playtest',
    '',
    'Focused debug-preview probe against current enclosed gravity rooms.',
    '',
    '## Decision',
    '',
    passed
      ? '- PASS: all current gravity rooms kept normal jump takeoff, allowed active-field button contact, and kept contained enemies readable and room-local.'
      : '- FAIL: one or more gravity rooms missed jump, button, or contained-enemy expectations.',
    '',
    '## Room Evidence',
    '',
  ];

  for (const result of results) {
    lines.push(`### ${result.stageId} / ${result.roomId}`);
    lines.push(`- Field matches shell bounds: ${String(result.fieldMatchesShell)}`);
    lines.push(`- Linked interior enemies authored: ${result.linkedEnemyIds.join(', ') || 'none'}`);
    lines.push(`- Button lane clear before jump: ${String(result.enemyLaneClearBefore)}`);
    lines.push(`- First jump frame field kind: ${result.firstJumpFrame.gravityFieldKind ?? 'none'}`);
    lines.push(`- First jump frame vy: ${result.firstJumpFrame.vy}`);
    lines.push(`- Button activated: ${String(result.buttonActivated)}`);
    lines.push(`- Gravity field cleared after disable: ${String(result.gravityFieldClearedAfterDisable)}`);
    lines.push(`- Linked enemies still contained after disable: ${String(result.enemiesContainedAfter)}`);
    lines.push(`- Button lane still clear after disable: ${String(result.enemyLaneClearAfter)}`);
    lines.push('');
  }

  lines.push('## Follow-up');
  lines.push('');
  lines.push(passed ? '- None. No room-specific readability follow-up needed from this focused probe.' : '- Follow-up needed in at least one room. See failed checks above.');

  return `${lines.join('\n')}\n`;
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

  let browser;

  try {
    await waitForServer(BASE_URL);
    browser = await chromium.launch({ headless: true });
    const page = await openPage(browser);
    const results = [];
    for (const room of ROOMS) {
      results.push(await collectRoomEvidence(page, room));
    }

    const passed = results.every((result) => roomPassed(result));
    await fs.writeFile(JSON_REPORT, `${JSON.stringify({ change: CHANGE_NAME, passed, results }, null, 2)}\n`, 'utf8');
    await fs.writeFile(MD_REPORT, buildMarkdown(results), 'utf8');

    if (!passed) {
      throw new Error('Gravity room button route and contained enemies playtest failed.');
    }
  } finally {
    await browser?.close();
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});