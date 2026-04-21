import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = 'fix-gravity-room-side-wall-flow';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'gravity-room-in-out-flow-playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'gravity-room-in-out-flow-playtest-report.md');
const VITE_PREVIEW_BIN = path.join(ROOT, 'node_modules', '.bin', 'vite.cmd');
const PORT = 4196;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;
const VIEWPORT = { width: 1440, height: 900 };
const ROOM_TARGETS = [
  { stageIndex: 0, stageId: 'forest-ruins', roomId: 'forest-anti-grav-canopy-room' },
  { stageIndex: 1, stageId: 'amber-cavern', roomId: 'amber-inversion-smelter-room' },
  { stageIndex: 2, stageId: 'sky-sanctum', roomId: 'sky-anti-grav-capsule' },
  { stageIndex: 2, stageId: 'sky-sanctum', roomId: 'sky-gravity-inversion-capsule' },
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
  console.log('playtest: opening browser page');
  const page = await browser.newPage({ viewport: VIEWPORT });
  attachPageLogging(page);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForActiveScene(page, 'menu');
  await page.locator('canvas').click({ position: { x: 24, y: 24 } });
  return page;
}

async function forceStartGameScene(page, stageIndex) {
  console.log(`playtest: force starting stage ${stageIndex}`);
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
    return Boolean(scene && typeof scene.getDebugSnapshot === 'function' && scene.getDebugSnapshot()?.gravityCapsuleVisuals);
  });
}

async function readRoomEvidence(page, roomId) {
  return page.evaluate((targetRoomId) => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const state = bridge.getSession().getState();
    const scene = game.scene.getScene('game');
    const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
    const capsule = state.stageRuntime.gravityCapsules.find((entry) => entry.id === targetRoomId);
    if (!capsule) {
      return null;
    }

    const shellMidX = capsule.shell.x + capsule.shell.width / 2;
    const shellRight = capsule.shell.x + capsule.shell.width;
    const shellBottom = capsule.shell.y + capsule.shell.height;
    const buttonCenterX = capsule.button.x + capsule.button.width / 2;
    const toSupportRect = (platform) => {
      if (!platform?.move) {
        return platform;
      }

      if (platform.move.axis === 'x') {
        return {
          x: platform.x,
          y: platform.y,
          width: platform.width + platform.move.range,
          height: platform.height,
        };
      }

      return {
        x: platform.x,
        y: platform.y - platform.move.range,
        width: platform.width,
        height: platform.height + platform.move.range,
      };
    };
    const platformById = (id) => state.stageRuntime.platforms.find((platform) => platform.id === id) ?? null;
    const buttonSupport = state.stageRuntime.platforms.find((platform) => {
      const overlap = Math.max(
        0,
        Math.min(capsule.button.x + capsule.button.width, platform.x + platform.width) - Math.max(capsule.button.x, platform.x),
      );
      return overlap >= Math.min(capsule.button.width * 0.55, platform.width) && Math.abs(capsule.button.y + capsule.button.height - platform.y) <= 24;
    });
    const entrySupport = capsule.doorSupports ? platformById(capsule.doorSupports.entryApproachPlatformId) : null;
    const exitInteriorSupport = capsule.doorSupports ? platformById(capsule.doorSupports.exitInteriorPlatformId) : null;
    const exitReconnectSupport = capsule.doorSupports ? platformById(capsule.doorSupports.exitReconnectPlatformId) : null;
    const entryDoorCenter = capsule.entryDoor.x + capsule.entryDoor.width / 2;
    const exitDoorCenter = capsule.exitDoor.x + capsule.exitDoor.width / 2;

    return {
      roomId: targetRoomId,
      enabled: capsule.enabled,
      buttonActivated: capsule.button.activated,
      entryDoorCenterRatio: (entryDoorCenter - capsule.shell.x) / capsule.shell.width,
      exitDoorCenterRatio: (exitDoorCenter - capsule.shell.x) / capsule.shell.width,
      entryDoorOnLeftWall: capsule.entryDoor.x === capsule.shell.x,
      exitDoorOnRightWall: capsule.exitDoor.x + capsule.exitDoor.width === shellRight,
      bottomEdgeSealed:
        capsule.entryDoor.y + capsule.entryDoor.height < shellBottom &&
        capsule.exitDoor.y + capsule.exitDoor.height < shellBottom,
      buttonBetweenDoors: buttonCenterX > capsule.entryDoor.x + capsule.entryDoor.width && buttonCenterX < capsule.exitDoor.x,
      distinctExteriorSupport:
        capsule.doorSupports?.entryApproachPlatformId != null &&
        capsule.doorSupports.entryApproachPlatformId !== capsule.doorSupports.exitReconnectPlatformId,
      distinctEntryAndExitSupport:
        capsule.doorSupports?.entryApproachPlatformId != null &&
        capsule.doorSupports.entryApproachPlatformId !== capsule.doorSupports.exitInteriorPlatformId,
      entryPathReadsLeft:
        capsule.doorSupports?.entryApproachPath != null &&
        capsule.doorSupports.entryApproachPath.x < capsule.shell.x &&
        capsule.doorSupports.entryApproachPath.x + capsule.doorSupports.entryApproachPath.width <= shellMidX,
      exitPathReadsRight:
        capsule.doorSupports?.exitReconnectPath != null &&
        capsule.doorSupports.exitReconnectPath.x >= shellMidX &&
        capsule.doorSupports.exitReconnectPath.x + capsule.doorSupports.exitReconnectPath.width > shellRight,
      entryApproachPlatformId: capsule.doorSupports?.entryApproachPlatformId ?? null,
      exitInteriorPlatformId: capsule.doorSupports?.exitInteriorPlatformId ?? null,
      exitReconnectPlatformId: capsule.doorSupports?.exitReconnectPlatformId ?? null,
      entrySupportRect: entrySupport ? toSupportRect(entrySupport) : null,
      exitInteriorSupportRect: exitInteriorSupport ? toSupportRect(exitInteriorSupport) : null,
      exitReconnectSupportRect: exitReconnectSupport ? toSupportRect(exitReconnectSupport) : null,
      buttonSupportId: buttonSupport?.id ?? null,
      debugVisual: debug?.gravityCapsuleVisuals?.find((entry) => entry.id === targetRoomId) ?? null,
    };
  }, roomId);
}

async function triggerRoomButton(page, roomId) {
  return page.evaluate((targetRoomId) => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    const capsule = state.stageRuntime.gravityCapsules.find((entry) => entry.id === targetRoomId);
    if (!capsule) {
      return { activated: false, reason: 'missing-capsule' };
    }

    const buttonSupport = state.stageRuntime.platforms.find((platform) => {
      const overlap = Math.max(
        0,
        Math.min(capsule.button.x + capsule.button.width, platform.x + platform.width) - Math.max(capsule.button.x, platform.x),
      );
      return overlap >= Math.min(capsule.button.width * 0.55, platform.width) && Math.abs(capsule.button.y + capsule.button.height - platform.y) <= 24;
    });

    if (!buttonSupport) {
      return { activated: false, reason: 'missing-button-support' };
    }

    state.stageRuntime.enemies = [];
    state.player.x = capsule.button.x + capsule.button.width / 2 - state.player.width / 2;
    state.player.y = buttonSupport.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = buttonSupport.id;

    bridge.consumeFrame(16);
    bridge.consumeFrame(16);
    bridge.consumeFrame(16);

    const updated = bridge.getSession().getState().stageRuntime.gravityCapsules.find((entry) => entry.id === targetRoomId);
    return {
      activated: Boolean(updated && updated.enabled === false && updated.button.activated === true),
      enabled: updated?.enabled ?? null,
      buttonActivated: updated?.button.activated ?? null,
      buttonSupportId: buttonSupport.id,
    };
  }, roomId);
}

function roomPassed(result) {
  return Boolean(
    result.baseline &&
      result.baseline.entryDoorCenterRatio <= 0.35 &&
      result.baseline.exitDoorCenterRatio >= 0.65 &&
      result.baseline.entryDoorOnLeftWall &&
      result.baseline.exitDoorOnRightWall &&
      result.baseline.bottomEdgeSealed &&
      result.baseline.buttonBetweenDoors &&
      result.baseline.distinctExteriorSupport &&
      result.baseline.distinctEntryAndExitSupport &&
      result.baseline.entryPathReadsLeft &&
      result.baseline.exitPathReadsRight &&
      result.baseline.debugVisual?.entryDoorVisible === true &&
      result.baseline.debugVisual?.exitDoorVisible === true &&
      result.toggle.activated === true &&
      result.reset?.enabled === true &&
      result.reset?.buttonActivated === false
  );
}

function buildMarkdown(results) {
  const lines = [
    '# Gravity Room IN/OUT Flow Playtest',
    '',
    'Focused runtime probe against the debug-enabled preview build.',
    '',
    '## Decision',
    '',
    results.every((result) => result.passed)
      ? '- PASS: all four current gravity rooms use side-wall IN-left and OUT-right flow, sealed bottoms, and intact button reset behavior.'
      : '- FAIL: one or more gravity rooms still miss the requested side-wall flow, sealed-bottom, or reset behavior.',
    '',
    '## Room Evidence',
    '',
  ];

  for (const result of results) {
    lines.push(`### ${result.roomId}`);
    lines.push(`- Stage: ${result.stageId}`);
    lines.push(`- Entry door ratio: ${result.baseline?.entryDoorCenterRatio?.toFixed(3) ?? 'n/a'}`);
    lines.push(`- Exit door ratio: ${result.baseline?.exitDoorCenterRatio?.toFixed(3) ?? 'n/a'}`);
    lines.push(`- Entry door on left wall: ${String(result.baseline?.entryDoorOnLeftWall)}`);
    lines.push(`- Exit door on right wall: ${String(result.baseline?.exitDoorOnRightWall)}`);
    lines.push(`- Bottom edge sealed: ${String(result.baseline?.bottomEdgeSealed)}`);
    lines.push(`- Entry support: ${result.baseline?.entryApproachPlatformId ?? 'n/a'}`);
    lines.push(`- Exit interior support: ${result.baseline?.exitInteriorPlatformId ?? 'n/a'}`);
    lines.push(`- Exit reconnect support: ${result.baseline?.exitReconnectPlatformId ?? 'n/a'}`);
    lines.push(`- Button between doors: ${String(result.baseline?.buttonBetweenDoors)}`);
    lines.push(`- Entry path stays left of room midpoint: ${String(result.baseline?.entryPathReadsLeft)}`);
    lines.push(`- Exit reconnect stays right of room midpoint: ${String(result.baseline?.exitPathReadsRight)}`);
    lines.push(`- Exterior supports are distinct: ${String(result.baseline?.distinctExteriorSupport)}`);
    lines.push(`- Button toggle fired in live scene: ${String(result.toggle?.activated)}`);
    lines.push(`- Restart reset restored active baseline: ${String(result.reset?.enabled === true && result.reset?.buttonActivated === false)}`);
    lines.push(`- Passed: ${String(result.passed)}`);
    lines.push('');
  }

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

  try {
    console.log('playtest: waiting for preview server');
    await waitForServer(`http://127.0.0.1:${PORT}`);
    console.log('playtest: launching browser');
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await openPage(browser);
      const results = [];

      for (const target of ROOM_TARGETS) {
        console.log(`playtest: probing ${target.roomId}`);
        await forceStartGameScene(page, target.stageIndex);
        const baseline = await readRoomEvidence(page, target.roomId);
        const toggle = await triggerRoomButton(page, target.roomId);
        await forceStartGameScene(page, target.stageIndex);
        const reset = await readRoomEvidence(page, target.roomId);
        const result = {
          ...target,
          baseline,
          toggle,
          reset,
        };
        results.push({ ...result, passed: roomPassed(result) });
      }

      const report = {
        change: CHANGE_NAME,
        passed: results.every((result) => result.passed),
        results,
      };

      await fs.writeFile(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      await fs.writeFile(MD_REPORT, buildMarkdown(results), 'utf8');
      console.log(`playtest: wrote ${JSON_REPORT}`);

      if (!report.passed) {
        throw new Error(`Gravity room IN/OUT flow playtest failed. See ${JSON_REPORT}`);
      }

      console.log('playtest: completed successfully');
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