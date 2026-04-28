import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = 'align-gravity-room-fields-and-enemy-containment';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'gravity-room-fields-and-enemy-containment-playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'gravity-room-fields-and-enemy-containment-playtest-report.md');
const VITE_PREVIEW_BIN = path.join(ROOT, 'node_modules', '.bin', 'vite.cmd');
const PORT = 4197;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;
const VIEWPORT = { width: 1440, height: 900 };
const ROOM = { stageIndex: 2, stageId: 'sky-sanctum', roomId: 'sky-anti-grav-capsule', fieldId: 'sky-anti-grav-stream' };

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

async function collectEvidence(page, roomId, fieldId) {
  return page.evaluate(({ targetRoomId, targetFieldId }) => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    const capsule = state.stageRuntime.gravityCapsules.find((entry) => entry.id === targetRoomId);
    const field = state.stageRuntime.gravityFields.find((entry) => entry.id === targetFieldId);
    if (!capsule || !field) {
      return null;
    }

    const shellRight = capsule.shell.x + capsule.shell.width;
    const oldInnerFieldApprox = {
      left: capsule.shell.x + 32,
      right: shellRight - 22,
    };

    const consumeFrame = (frames = 1) => {
      for (let index = 0; index < frames; index += 1) {
        bridge.consumeFrame(16);
      }
    };

    const setPlayerAt = (x, y, vy = 220) => {
      state.player.x = x;
      state.player.y = y;
      state.player.vx = 0;
      state.player.vy = vy;
      state.player.onGround = false;
      state.player.supportPlatformId = null;
      consumeFrame(1);
      return {
        x: state.player.x,
        y: state.player.y,
        gravityFieldId: state.player.gravityFieldId,
        gravityFieldKind: state.player.gravityFieldKind,
        gravityScale: state.player.gravityScale,
        vy: state.player.vy,
      };
    };

    const insideFlyer = {
      id: 'playtest-inside-flyer',
      kind: 'flyer',
      x: shellRight - 42,
      y: capsule.exitDoor.y + 18,
      vx: 0,
      vy: 0,
      width: 34,
      height: 24,
      alive: true,
      defeatCause: null,
      direction: 1,
      supportY: null,
      supportPlatformId: null,
      laneLeft: null,
      laneRight: null,
      flyer: {
        left: shellRight - 82,
        right: shellRight + 92,
        speed: 120,
        bobAmp: 0,
        bobSpeed: 0,
        bobPhase: 0,
        originY: capsule.exitDoor.y + 18,
      },
    };
    const outsideFlyer = {
      id: 'playtest-outside-flyer',
      kind: 'flyer',
      x: capsule.shell.x - 34,
      y: capsule.entryDoor.y + 18,
      vx: 0,
      vy: 0,
      width: 34,
      height: 24,
      alive: true,
      defeatCause: null,
      direction: 1,
      supportY: null,
      supportPlatformId: null,
      laneLeft: null,
      laneRight: null,
      flyer: {
        left: capsule.shell.x - 70,
        right: capsule.shell.x + 70,
        speed: 120,
        bobAmp: 0,
        bobSpeed: 0,
        bobPhase: 0,
        originY: capsule.entryDoor.y + 18,
      },
    };

    state.stageRuntime.enemies = state.stageRuntime.enemies.filter(
      (enemy) => enemy.id !== insideFlyer.id && enemy.id !== outsideFlyer.id,
    );
    state.stageRuntime.enemies.push(insideFlyer, outsideFlyer);

    const leftInteriorProbe = setPlayerAt(capsule.shell.x + 6, capsule.shell.y + 36, 220);
    const rightInteriorProbe = setPlayerAt(shellRight - state.player.width - 6, capsule.shell.y + 36, 220);
    consumeFrame(1);

    const activeContainment = {
      insideFlyer: state.stageRuntime.enemies.find((enemy) => enemy.id === insideFlyer.id),
      outsideFlyer: state.stageRuntime.enemies.find((enemy) => enemy.id === outsideFlyer.id),
    };

    const buttonSupport = state.stageRuntime.platforms.find((platform) => {
      const overlap = Math.max(
        0,
        Math.min(capsule.button.x + capsule.button.width, platform.x + platform.width) - Math.max(capsule.button.x, platform.x),
      );
      return overlap >= Math.min(capsule.button.width * 0.55, platform.width) && Math.abs(capsule.button.y + capsule.button.height - platform.y) <= 24;
    });

    state.player.x = capsule.button.x + capsule.button.width / 2 - state.player.width / 2;
    state.player.y = buttonSupport.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = buttonSupport.id;
    consumeFrame(2);

    const disabledCapsule = state.stageRuntime.gravityCapsules.find((entry) => entry.id === targetRoomId);
    const disabledPlayerProbe = setPlayerAt(capsule.shell.x + 6, capsule.shell.y + 36, 220);

    const disabledInside = state.stageRuntime.enemies.find((enemy) => enemy.id === insideFlyer.id);
    disabledInside.x = shellRight - 42;
    disabledInside.direction = 1;
    const disabledOutside = state.stageRuntime.enemies.find((enemy) => enemy.id === outsideFlyer.id);
    disabledOutside.x = capsule.shell.x - 34;
    disabledOutside.direction = 1;
    consumeFrame(1);

    const disabledContainment = {
      insideFlyer: state.stageRuntime.enemies.find((enemy) => enemy.id === insideFlyer.id),
      outsideFlyer: state.stageRuntime.enemies.find((enemy) => enemy.id === outsideFlyer.id),
    };

    return {
      roomId: targetRoomId,
      fieldId: targetFieldId,
      fieldMatchesShell: field.x === capsule.shell.x && field.y === capsule.shell.y && field.width === capsule.shell.width && field.height === capsule.shell.height,
      leftInteriorProbe,
      rightInteriorProbe,
      oldInnerFieldApprox,
      activeContainment,
      disabled: {
        enabled: disabledCapsule.enabled,
        buttonActivated: disabledCapsule.button.activated,
        playerProbe: disabledPlayerProbe,
        containment: disabledContainment,
      },
    };
  }, { targetRoomId: roomId, targetFieldId: fieldId });
}

function reportPassed(result) {
  if (!result) {
    return false;
  }

  const insideActiveHeld = result.activeContainment.insideFlyer.x + result.activeContainment.insideFlyer.width <= result.rightInteriorProbe.x + 42;
  const outsideActiveHeld = result.activeContainment.outsideFlyer.x + result.activeContainment.outsideFlyer.width <= result.leftInteriorProbe.x;
  const insideDisabledHeld = result.disabled.containment.insideFlyer.x + result.disabled.containment.insideFlyer.width <= result.rightInteriorProbe.x + 42;
  const outsideDisabledHeld = result.disabled.containment.outsideFlyer.x + result.disabled.containment.outsideFlyer.width <= result.leftInteriorProbe.x;

  return Boolean(
    result.fieldMatchesShell &&
      result.leftInteriorProbe.gravityFieldId === result.fieldId &&
      result.leftInteriorProbe.gravityFieldKind === 'anti-grav-stream' &&
      result.leftInteriorProbe.x < result.oldInnerFieldApprox.left &&
      result.rightInteriorProbe.gravityFieldId === result.fieldId &&
      result.rightInteriorProbe.x + 26 > result.oldInnerFieldApprox.right &&
      insideActiveHeld &&
      outsideActiveHeld &&
      result.disabled.enabled === false &&
      result.disabled.buttonActivated === true &&
      result.disabled.playerProbe.gravityFieldId === null &&
      insideDisabledHeld &&
      outsideDisabledHeld
  );
}

function buildMarkdown(result, passed) {
  const insideActiveHeld = result.activeContainment.insideFlyer.x + result.activeContainment.insideFlyer.width <= result.rightInteriorProbe.x + 42;
  const outsideActiveHeld = result.activeContainment.outsideFlyer.x + result.activeContainment.outsideFlyer.width <= result.leftInteriorProbe.x;
  const insideDisabledHeld = result.disabled.containment.insideFlyer.x + result.disabled.containment.insideFlyer.width <= result.rightInteriorProbe.x + 42;
  const outsideDisabledHeld = result.disabled.containment.outsideFlyer.x + result.disabled.containment.outsideFlyer.width <= result.leftInteriorProbe.x;

  return `# Gravity Room Fields And Enemy Containment Playtest

Focused runtime probe against sky-sanctum enclosed anti-grav room in debug preview build.

## Decision

${passed ? '- PASS: room-wide player gravity, player-only field effect, and enemy door containment all held in active and disabled states.' : '- FAIL: one or more full-room gravity or enemy containment checks failed.'}

## Evidence

- Stage: ${ROOM.stageId}
- Room: ${result.roomId}
- Field matches shell bounds: ${String(result.fieldMatchesShell)}
- Left-edge player probe x: ${result.leftInteriorProbe.x}
- Previous inner-field left approximation: ${result.oldInnerFieldApprox.left}
- Left-edge probe active field id: ${result.leftInteriorProbe.gravityFieldId ?? 'none'}
- Right-edge player probe x: ${result.rightInteriorProbe.x}
- Previous inner-field right approximation: ${result.oldInnerFieldApprox.right}
- Right-edge probe active field id: ${result.rightInteriorProbe.gravityFieldId ?? 'none'}
- Inside enemy held in room while active: ${String(insideActiveHeld)}
- Outside enemy kept out while active: ${String(outsideActiveHeld)}
- Room disabled after button: ${String(result.disabled.enabled === false && result.disabled.buttonActivated === true)}
- Disabled-state player field cleared: ${String(result.disabled.playerProbe.gravityFieldId === null)}
- Inside enemy held in room while disabled: ${String(insideDisabledHeld)}
- Outside enemy kept out while disabled: ${String(outsideDisabledHeld)}
`;
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
    await forceStartGameScene(page, ROOM.stageIndex);
    const result = await collectEvidence(page, ROOM.roomId, ROOM.fieldId);
    const passed = reportPassed(result);

    await fs.writeFile(JSON_REPORT, `${JSON.stringify({ change: CHANGE_NAME, passed, result }, null, 2)}\n`, 'utf8');
    await fs.writeFile(MD_REPORT, buildMarkdown(result, passed), 'utf8');

    if (!passed) {
      throw new Error('Gravity room fields and enemy containment playtest failed.');
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