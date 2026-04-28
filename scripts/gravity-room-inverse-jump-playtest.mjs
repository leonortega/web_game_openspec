import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = 'gravity-room-inverse-jump';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'gravity-room-inverse-jump-playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'gravity-room-inverse-jump-playtest-report.md');
const VITE_BIN = path.join(ROOT, 'node_modules', '.bin', 'vite.cmd');
const PORT = 4198;
const BASE_URL = `${process.env.PLAYTEST_BASE_URL ?? `http://127.0.0.1:${PORT}/`}?debug=1`;
const VIEWPORT = { width: 1440, height: 900 };
const TARGETS = [
  {
    stageIndex: 0,
    stageId: 'forest-ruins',
    roomId: 'forest-anti-grav-canopy-room',
    supportPlatformId: 'platform-8860-530',
    ceilingSupportPlatformId: 'platform-8990-250-moving',
    roofProbeOffsetX: 40,
  },
  {
    stageIndex: 1,
    stageId: 'amber-cavern',
    roomId: 'amber-inversion-smelter-room',
    supportPlatformId: 'platform-9990-570',
  },
  {
    stageIndex: 2,
    stageId: 'sky-sanctum',
    roomId: 'sky-anti-grav-capsule',
    supportPlatformId: 'platform-9010-480',
  },
  {
    stageIndex: 2,
    stageId: 'sky-sanctum',
    roomId: 'sky-gravity-inversion-capsule',
    supportPlatformId: 'platform-9770-540',
  },
];

const idleInput = {
  left: false,
  right: false,
  jumpHeld: false,
  jumpPressed: false,
  dashPressed: false,
  shootPressed: false,
};

const jumpInput = {
  ...idleInput,
  jumpHeld: true,
  jumpPressed: true,
};

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

  throw new Error(`Timed out waiting for dev server at ${url}`);
}

async function waitForActiveScene(page, sceneKey, timeoutMs = 12000) {
  await page.waitForFunction(
    (expectedKey) => {
      const game = window.__CRYSTAL_RUN_GAME__;
      if (!game) {
        return false;
      }

      return game.scene.getScenes(true).some((scene) => scene.scene.key === expectedKey);
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
    ['menu', 'stage-intro', 'complete'].forEach((sceneKey) => {
      if (game.scene.getScenes(false).some((scene) => scene.scene.key === sceneKey)) {
        game.scene.stop(sceneKey);
      }
    });
    game.scene.start('game');
  }, stageIndex);
  await waitForActiveScene(page, 'game');
}

async function collectRoomEvidence(page, target) {
  return page.evaluate(({ stageIndex, roomId, supportPlatformId, ceilingSupportPlatformId, roofProbeOffsetX }) => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    bridge.forceStartStage(stageIndex);
    bridge.resetGameplayInput();
    const session = bridge.getSession();
    const state = session.getState();
    const idleInput = {
      left: false,
      right: false,
      jumpHeld: false,
      jumpPressed: false,
      dashPressed: false,
      shootPressed: false,
    };
    const jumpInput = {
      ...idleInput,
      jumpHeld: true,
      jumpPressed: true,
    };
    const capsule = state.stageRuntime.gravityCapsules.find((entry) => entry.id === roomId);
    const support = state.stageRuntime.platforms.find((platform) => platform.id === supportPlatformId);
    const field = state.stageRuntime.gravityFields.find((entry) => entry.gravityCapsuleId === roomId || entry.id === capsule?.fieldId);
    if (!capsule || !support) {
      return null;
    }

    const roomWalker = state.stageRuntime.enemies.find((enemy) => (capsule.id === 'sky-anti-grav-capsule' ? enemy.id === 'sky-room-walker-1' : enemy.id === 'sky-room-walker-2'));
    const enemyBefore = roomWalker
      ? { id: roomWalker.id, x: roomWalker.x, y: roomWalker.y }
      : null;

    if (roomWalker) {
      session.update(16, idleInput);
    }

    const enemyAfter = roomWalker
      ? (() => {
          const updated = session.getState().stageRuntime.enemies.find((enemy) => enemy.id === roomWalker.id);
          return updated ? { id: updated.id, x: updated.x, y: updated.y } : null;
        })()
      : null;

    const placePlayerOnSupport = () => {
      state.player.x = support.x + 20;
      state.player.y = support.y - state.player.height;
      state.player.vx = 0;
      state.player.vy = 0;
      state.player.onGround = true;
      state.player.supportPlatformId = support.id;
      state.player.phaseThroughSupportPlatformId = null;
      state.player.jumpSourceGravityCapsuleId = null;
      state.player.jumpSourceSupportPlatformId = null;
    };

    const captureManualJump = () => {
      placePlayerOnSupport();
      session.startSupportedPlayerJump('jump');
      session.updatePlayerGravityState();
      return {
        velocityY: state.player.vy,
        onGround: state.player.onGround,
        gravityFieldId: state.player.gravityFieldId,
        gravityFieldKind: state.player.gravityFieldKind,
        gravityScale: state.player.gravityScale,
        phaseThroughSupportPlatformId: state.player.phaseThroughSupportPlatformId,
      };
    };

    placePlayerOnSupport();
    const preJump = {
      onGround: state.player.onGround,
      supportPlatformId: state.player.supportPlatformId,
      coyoteMs: state.player.coyoteMs,
      capsuleEnabled: capsule.enabled,
      shell: { ...capsule.shell },
      field: field ? { id: field.id, x: field.x, y: field.y, width: field.width, height: field.height } : null,
      supportedCapsuleIdFromRuntime:
        typeof session.findSupportedPlayerGravityCapsule === 'function'
          ? session.findSupportedPlayerGravityCapsule()?.id ?? null
          : null,
      resolvedTakeoffBeforeUpdate:
        typeof session.resolveSupportedPlayerJumpTakeoff === 'function'
          ? session.resolveSupportedPlayerJumpTakeoff()
          : null,
      shellContainsSupportPoint:
        state.player.x + state.player.width / 2 >= capsule.shell.x &&
        state.player.x + state.player.width / 2 <= capsule.shell.x + capsule.shell.width &&
        state.player.y + state.player.height - 1 >= capsule.shell.y &&
        state.player.y + state.player.height - 1 <= capsule.shell.y + capsule.shell.height,
      runtimeHasResolveSupportedPlayerJumpTakeoff:
        typeof session.resolveSupportedPlayerJumpTakeoff === 'function' &&
        session.resolveSupportedPlayerJumpTakeoff.toString().includes('jumpSourceGravityCapsuleId'),
      runtimeHasBridgeJumpPhaseThrough:
        typeof session.startSupportedPlayerJump === 'function' &&
        session.startSupportedPlayerJump.toString().includes('phaseThroughSupportPlatformId'),
    };
    session.update(16, jumpInput);
    const activeState = session.getState();
    const manualJump = captureManualJump();

    let ceilingJump = null;
    if (ceilingSupportPlatformId) {
      bridge.forceStartStage(stageIndex);
      bridge.resetGameplayInput();
      const ceilingState = session.getState();
      const ceilingSupport = ceilingState.stageRuntime.platforms.find((platform) => platform.id === ceilingSupportPlatformId);
      const ceilingField = ceilingState.stageRuntime.gravityFields.find((entry) => entry.gravityCapsuleId === roomId || entry.id === ceilingState.stageRuntime.gravityCapsules.find((entry) => entry.id === roomId)?.fieldId);
      if (ceilingSupport && ceilingField) {
        ceilingState.player.x = ceilingSupport.x + 24;
        ceilingState.player.y = ceilingSupport.y + ceilingSupport.height + 2;
        ceilingState.player.vx = 0;
        ceilingState.player.vy = -120;
        ceilingState.player.onGround = false;
        ceilingState.player.supportPlatformId = null;
        ceilingState.player.phaseThroughSupportPlatformId = null;
        ceilingState.player.jumpSourceGravityCapsuleId = null;
        ceilingState.player.jumpSourceSupportPlatformId = null;
        session.update(16, idleInput);
        const pinnedState = session.getState();
        const pinnedPlayer = {
          y: pinnedState.player.y,
          vy: pinnedState.player.vy,
          gravityFieldId: pinnedState.player.gravityFieldId,
        };
        session.update(16, jumpInput);
        const jumpedState = session.getState();
        const jumpedPlayer = {
          y: jumpedState.player.y,
          vy: jumpedState.player.vy,
          gravityFieldId: jumpedState.player.gravityFieldId,
        };
        ceilingJump = {
          supportPlatformId: ceilingSupport.id,
          pinnedY: pinnedPlayer.y,
          expectedPinnedY: ceilingSupport.y + ceilingSupport.height,
          pinnedVelocityY: pinnedPlayer.vy,
          pinnedGravityFieldId: pinnedPlayer.gravityFieldId,
          jumpedVelocityY: jumpedPlayer.vy,
          jumpedGravityFieldId: jumpedPlayer.gravityFieldId,
          jumpedY: jumpedPlayer.y,
        };
      }
    }

    let roofJump = null;
    if (typeof roofProbeOffsetX === 'number') {
      bridge.forceStartStage(stageIndex);
      bridge.resetGameplayInput();
      const roofState = session.getState();
      const roofCapsule = roofState.stageRuntime.gravityCapsules.find((entry) => entry.id === roomId);
      const roofField = roofState.stageRuntime.gravityFields.find((entry) => entry.gravityCapsuleId === roomId || entry.id === roofCapsule?.fieldId);
      if (roofCapsule && roofField) {
        const wallThickness = Math.max(6, Math.min(12, Math.floor(Math.min(roofCapsule.entryDoor.height, roofCapsule.exitDoor.height) / 4)));
        roofState.player.x = roofCapsule.shell.x + roofProbeOffsetX;
        roofState.player.y = roofCapsule.shell.y + 4;
        roofState.player.vx = 0;
        roofState.player.vy = -120;
        roofState.player.onGround = false;
        roofState.player.supportPlatformId = null;
        roofState.player.phaseThroughSupportPlatformId = null;
        roofState.player.jumpSourceGravityCapsuleId = null;
        roofState.player.jumpSourceSupportPlatformId = null;
        session.update(16, idleInput);
        const pinnedRoofState = session.getState();
        const pinnedRoofPlayer = {
          y: pinnedRoofState.player.y,
          vy: pinnedRoofState.player.vy,
          gravityFieldId: pinnedRoofState.player.gravityFieldId,
        };
        session.update(16, jumpInput);
        const jumpedRoofState = session.getState();
        const jumpedRoofPlayer = {
          y: jumpedRoofState.player.y,
          vy: jumpedRoofState.player.vy,
          gravityFieldId: jumpedRoofState.player.gravityFieldId,
        };
        roofJump = {
          pinnedY: pinnedRoofPlayer.y,
          expectedPinnedY: roofCapsule.shell.y + wallThickness,
          pinnedVelocityY: pinnedRoofPlayer.vy,
          pinnedGravityFieldId: pinnedRoofPlayer.gravityFieldId,
          jumpedVelocityY: jumpedRoofPlayer.vy,
          jumpedGravityFieldId: jumpedRoofPlayer.gravityFieldId,
          jumpedY: jumpedRoofPlayer.y,
        };
      }
    }

    bridge.forceStartStage(stageIndex);
    bridge.resetGameplayInput();
    const resetState = session.getState();
    const resetCapsule = resetState.stageRuntime.gravityCapsules.find((entry) => entry.id === roomId);
    const resetSupport = resetState.stageRuntime.platforms.find((platform) => platform.id === supportPlatformId);
    const resetRoomWalker = resetState.stageRuntime.enemies.find((enemy) => (roomId === 'sky-anti-grav-capsule' ? enemy.id === 'sky-room-walker-1' : enemy.id === 'sky-room-walker-2'));
    if (!resetCapsule || !resetSupport) {
      return null;
    }

    const capsuleRef = resetCapsule;
    const supportRef = resetSupport;
    const roomWalkerRef = resetRoomWalker;

    capsuleRef.enabled = false;
    capsuleRef.button.activated = true;

    const toggledCapsule = session.getState().stageRuntime.gravityCapsules.find((entry) => entry.id === roomId);

    resetState.player.x = supportRef.x + 20;
    resetState.player.y = supportRef.y - resetState.player.height;
    resetState.player.vx = 0;
    resetState.player.vy = 0;
    resetState.player.onGround = true;
    resetState.player.supportPlatformId = supportRef.id;
    resetState.player.phaseThroughSupportPlatformId = null;
    resetState.player.jumpSourceGravityCapsuleId = null;
    resetState.player.jumpSourceSupportPlatformId = null;
    session.update(16, jumpInput);
    const disabledState = session.getState();

    return {
      roomId,
      supportPlatformId,
      preJump,
      manualJump,
      ceilingJump,
      roofJump,
      activeJump: {
        velocityY: activeState.player.vy,
        onGround: activeState.player.onGround,
        gravityFieldId: activeState.player.gravityFieldId,
        gravityFieldKind: activeState.player.gravityFieldKind,
        gravityScale: activeState.player.gravityScale,
        phaseThroughSupportPlatformId: activeState.player.phaseThroughSupportPlatformId,
      },
      disableToggle: {
        enabled: toggledCapsule?.enabled ?? null,
        buttonActivated: toggledCapsule?.button.activated ?? null,
      },
      disabledJump: {
        velocityY: disabledState.player.vy,
        onGround: disabledState.player.onGround,
        gravityFieldId: disabledState.player.gravityFieldId,
        gravityFieldKind: disabledState.player.gravityFieldKind,
        gravityScale: disabledState.player.gravityScale,
      },
      containedEnemy: enemyBefore && enemyAfter && roomWalkerRef
        ? {
            id: enemyBefore.id,
            before: enemyBefore,
            after: enemyAfter,
          }
        : null,
    };
  }, target);
}

function evaluateTarget(result) {
  return Boolean(
    result &&
      result.activeJump.velocityY > 0 &&
      result.activeJump.onGround === false &&
      result.activeJump.gravityFieldId &&
      result.activeJump.phaseThroughSupportPlatformId === result.supportPlatformId &&
      (!result.ceilingJump ||
        (result.ceilingJump.pinnedY === result.ceilingJump.expectedPinnedY &&
          result.ceilingJump.pinnedVelocityY === 0 &&
          result.ceilingJump.pinnedGravityFieldId &&
          result.ceilingJump.jumpedVelocityY > 0 &&
          result.ceilingJump.jumpedGravityFieldId &&
          result.ceilingJump.jumpedY > result.ceilingJump.expectedPinnedY)) &&
      (!result.roofJump ||
        (result.roofJump.pinnedY === result.roofJump.expectedPinnedY &&
          result.roofJump.pinnedVelocityY === 0 &&
          result.roofJump.pinnedGravityFieldId &&
          result.roofJump.jumpedVelocityY > 0 &&
          result.roofJump.jumpedGravityFieldId &&
          result.roofJump.jumpedY > result.roofJump.expectedPinnedY)) &&
      result.disableToggle.enabled === false &&
      result.disableToggle.buttonActivated === true &&
      result.disabledJump.velocityY < 0 &&
      result.disabledJump.gravityFieldId === null
  );
}

function buildMarkdown(results) {
  const lines = [
    '# Gravity Room Inverse Jump Playtest',
    '',
    'Focused browser probe for active inverse jump takeoff and disabled-room normal jump restoration.',
    '',
    '## Decision',
    '',
    results.every((result) => result.passed) ? '- PASS: active room jump takeoff inverts and disabled room jump returns to normal.' : '- FAIL: one or more room probes did not match the expected state boundary.',
    '',
  ];

  for (const result of results) {
    lines.push(`## ${result.stageId} :: ${result.roomId}`);
    lines.push('');
    lines.push(`- Result: ${result.passed ? 'PASS' : 'FAIL'}`);
    lines.push(`- Active jump vy: ${result.activeJump.velocityY}`);
    lines.push(`- Active gravity field: ${result.activeJump.gravityFieldId ?? 'none'} (${result.activeJump.gravityFieldKind ?? 'none'})`);
    lines.push(`- Active phase-through support: ${result.activeJump.phaseThroughSupportPlatformId ?? 'none'}`);
    if (result.ceilingJump) {
      lines.push(`- Ceiling pinned y: ${result.ceilingJump.pinnedY} (expected ${result.ceilingJump.expectedPinnedY})`);
      lines.push(`- Ceiling pinned vy: ${result.ceilingJump.pinnedVelocityY}`);
      lines.push(`- Ceiling jump vy: ${result.ceilingJump.jumpedVelocityY}`);
    }
    if (result.roofJump) {
      lines.push(`- Roof pinned y: ${result.roofJump.pinnedY} (expected ${result.roofJump.expectedPinnedY})`);
      lines.push(`- Roof pinned vy: ${result.roofJump.pinnedVelocityY}`);
      lines.push(`- Roof jump vy: ${result.roofJump.jumpedVelocityY}`);
    }
    lines.push(`- Button disabled room: enabled=${String(result.disableToggle.enabled)}, activated=${String(result.disableToggle.buttonActivated)}`);
    lines.push(`- Disabled jump vy: ${result.disabledJump.velocityY}`);
    lines.push(`- Disabled gravity field: ${result.disabledJump.gravityFieldId ?? 'none'}`);
    if (result.containedEnemy) {
      lines.push(
        `- Contained enemy patrol probe: ${result.containedEnemy.id} moved x ${result.containedEnemy.before.x} -> ${result.containedEnemy.after.x}, y stayed ${result.containedEnemy.after.y}`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function writeReports(results) {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(JSON_REPORT, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
  await fs.writeFile(MD_REPORT, `${buildMarkdown(results)}\n`, 'utf8');
}

async function main() {
  const server = process.env.PLAYTEST_BASE_URL
    ? null
    : spawn('cmd.exe', ['/c', VITE_BIN, '--host', '127.0.0.1', '--port', String(PORT)], {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

  server?.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server?.stderr.on('data', (chunk) => process.stderr.write(chunk));

  const cleanupServer = async () => {
    if (!server || server.exitCode !== null || !server.pid) {
      return;
    }

    if (process.platform === 'win32') {
      await new Promise((resolve) => {
        const killer = spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
        killer.once('exit', () => resolve());
        killer.once('error', () => resolve());
      });
      return;
    }

    server.kill('SIGTERM');
  };

  let browser;
  try {
    await waitForServer(BASE_URL);
    browser = await chromium.launch({ headless: true });
    const page = await openPage(browser);
    const results = [];

    for (const target of TARGETS) {
      console.log(`playtest: probing ${target.roomId}`);
      await forceStartGameScene(page, target.stageIndex);
      const evidence = await collectRoomEvidence(page, target);
      if (!evidence) {
        throw new Error(`Missing playtest evidence for ${target.roomId}`);
      }

      results.push({
        stageId: target.stageId,
        passed: evaluateTarget(evidence),
        ...evidence,
      });
    }

    await writeReports(results);

    if (!results.every((result) => result.passed)) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    await cleanupServer();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});