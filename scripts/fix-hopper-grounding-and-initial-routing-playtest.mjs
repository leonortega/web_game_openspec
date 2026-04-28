import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = 'fix-hopper-grounding-and-initial-routing';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'verification.json');
const MD_REPORT = path.join(REPORT_DIR, 'playtest-report.md');
const DEFAULT_PORT = 4182;
const VIEWPORT = { width: 1440, height: 900 };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function reservePort(preferredPort = DEFAULT_PORT) {
  const tryPort = (port) =>
    new Promise((resolve, reject) => {
      const server = net.createServer();
      server.unref();
      server.on('error', reject);
      server.listen(port, '127.0.0.1', () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
          server.close(() => reject(new Error('Could not reserve preview port.')));
          return;
        }

        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(address.port);
        });
      });
    });

  for (let offset = 0; offset < 20; offset += 1) {
    try {
      return await tryPort(preferredPort + offset);
    } catch {}
  }

  throw new Error('Could not find a free preview port for playtest.');
}

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

async function waitForActiveScene(page, expectedScene, timeoutMs = 12000) {
  await page.waitForFunction(
    (sceneKey) => {
      const game = window.__CRYSTAL_RUN_GAME__;
      if (!game) {
        return false;
      }
      return game.scene.getScenes(true).some((scene) => scene.scene.key === sceneKey);
    },
    expectedScene,
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

async function openPage(browser, baseUrl) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  attachPageLogging(page);
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await waitForActiveScene(page, 'menu');
  await page.locator('canvas').click({ position: { x: 24, y: 24 } });
  await wait(120);
  return page;
}

async function startGameScene(page, stageIndex) {
  await page.evaluate((targetStageIndex) => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    bridge.forceStartStage(targetStageIndex);
    ['menu', 'complete', 'stage-intro', 'game'].forEach((sceneKey) => {
      if (game.scene.getScenes(false).some((scene) => scene.scene.key === sceneKey)) {
        game.scene.stop(sceneKey);
      }
    });
    game.scene.start('game');
  }, stageIndex);
  await waitForActiveScene(page, 'game');
  await wait(150);
}

async function runScenarioChecks(page) {
  await startGameScene(page, 0);

  return page.evaluate(() => {
    const session = window.__CRYSTAL_RUN_BRIDGE__.getSession();
    const state = session.getState();
    const idleInput = {
      left: false,
      right: false,
      jumpHeld: false,
      jumpPressed: false,
      dashPressed: false,
      shootPressed: false,
    };

    const createStaticPlatform = (id, x, y, width) => ({
      id,
      kind: 'static',
      x,
      y,
      width,
      height: 32,
      startX: x,
      startY: y,
      vx: 0,
      vy: 0,
    });

    const forestHopper = state.stageRuntime.enemies.find((enemy) => enemy.id === 'hopper-1');
    const forestSupport = forestHopper?.supportPlatformId
      ? state.stageRuntime.platforms.find((platform) => platform.id === forestHopper.supportPlatformId) ?? null
      : null;

    const groundedStart = {
      enemyId: forestHopper?.id ?? null,
      supportPlatformId: forestHopper?.supportPlatformId ?? null,
      supportResolved: Boolean(forestSupport),
      floating: !forestHopper || forestHopper.supportY === null || Math.abs(forestHopper.y - forestHopper.supportY) > 0.5,
    };

    const support = createStaticPlatform('hopper-support', 1920, 540, 180);
    const leftLanding = createStaticPlatform('hopper-left-landing', 1510, 495, 180);
    const rightLanding = createStaticPlatform('hopper-right-landing', 2180, 495, 180);
    state.stageRuntime.platforms = [leftLanding, support, rightLanding];
    state.stageRuntime.hazards = [];
    state.stageRuntime.enemies = [
      {
        id: 'first-hop-hopper',
        kind: 'hopper',
        x: 1930,
        y: support.y - 30,
        vx: 0,
        vy: 0,
        width: 34,
        height: 30,
        alive: true,
        defeatCause: null,
        direction: -1,
        supportY: support.y - 30,
        supportPlatformId: support.id,
        laneLeft: support.x,
        laneRight: support.x + support.width - 34,
        hop: {
          intervalMs: 1200,
          timerMs: 1,
          impulse: 860,
          speed: 120,
          committedHops: 0,
          targetPlatformId: null,
          targetX: null,
          targetY: null,
        },
      },
    ];

    session.update(16, idleInput);
    const directedHopper = state.stageRuntime.enemies[0];
    const firstHop = {
      targetPlatformId: directedHopper.hop?.targetPlatformId ?? null,
      direction: directedHopper.direction,
      waitedOnSupport: directedHopper.supportPlatformId !== null,
    };

    state.stageRuntime.platforms = [support];
    state.stageRuntime.enemies = [
      {
        id: 'isolated-hopper',
        kind: 'hopper',
        x: 1930,
        y: support.y - 30,
        vx: 0,
        vy: 0,
        width: 34,
        height: 30,
        alive: true,
        defeatCause: null,
        direction: -1,
        supportY: support.y - 30,
        supportPlatformId: support.id,
        laneLeft: support.x,
        laneRight: support.x + support.width - 34,
        hop: {
          intervalMs: 1200,
          timerMs: 1,
          impulse: 860,
          speed: 120,
          committedHops: 0,
          targetPlatformId: null,
          targetX: null,
          targetY: null,
        },
      },
      {
        id: 'control-flyer',
        kind: 'flyer',
        x: 2200,
        y: 320,
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
          left: 2200,
          right: 2360,
          speed: 90,
          bobAmp: 12,
          bobSpeed: 4,
          bobPhase: 0,
          originY: 320,
        },
      },
    ];

    for (let index = 0; index < 10; index += 1) {
      session.update(16, idleInput);
    }

    const waitingHopper = state.stageRuntime.enemies.find((enemy) => enemy.id === 'isolated-hopper');
    const flyer = state.stageRuntime.enemies.find((enemy) => enemy.id === 'control-flyer');
    const waitingState = {
      supportPlatformId: waitingHopper?.supportPlatformId ?? null,
      targetPlatformId: waitingHopper?.hop?.targetPlatformId ?? null,
      y: waitingHopper?.y ?? null,
      supportY: waitingHopper?.supportY ?? null,
      vx: waitingHopper?.vx ?? null,
      vy: waitingHopper?.vy ?? null,
    };
    const flyerState = {
      supportPlatformId: flyer?.supportPlatformId ?? null,
      y: flyer?.y ?? null,
      originY: flyer?.flyer?.originY ?? null,
    };

    return { groundedStart, firstHop, waitingState, flyerState };
  });
}

function summarize(results) {
  const checks = [
    {
      name: 'grounded hopper starts on support',
      passed:
        results.groundedStart.enemyId !== null &&
        results.groundedStart.supportResolved &&
        !results.groundedStart.floating,
      details: results.groundedStart,
    },
    {
      name: 'first hop chooses reachable supported right lane',
      passed: results.firstHop.targetPlatformId === 'hopper-right-landing' && results.firstHop.direction === 1,
      details: results.firstHop,
    },
    {
      name: 'isolated hopper waits on support',
      passed:
        results.waitingState.supportPlatformId === 'hopper-support' &&
        results.waitingState.targetPlatformId === null &&
        results.waitingState.y === results.waitingState.supportY &&
        results.waitingState.vx === 0 &&
        results.waitingState.vy === 0,
      details: results.waitingState,
    },
    {
      name: 'flyer remains unsupported hover enemy',
      passed:
        results.flyerState.supportPlatformId === null &&
        results.flyerState.originY !== null &&
        results.flyerState.y !== results.flyerState.originY,
      details: results.flyerState,
    },
  ];

  return {
    ok: checks.every((check) => check.passed),
    checks,
  };
}

async function writeReport(summary) {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(JSON_REPORT, JSON.stringify(summary, null, 2));

  const lines = [
    '# Hopper grounding and initial routing playtest',
    '',
    `- Result: ${summary.ok ? 'PASS' : 'FAIL'}`,
    `- Server: \`${summary.server}\``,
    `- Method: headless Playwright probe against debug preview`,
    '',
    '## Checks',
  ];

  for (const check of summary.checks) {
    lines.push(`- ${check.passed ? 'PASS' : 'FAIL'}: ${check.name}`);
    lines.push(`  Details: ${JSON.stringify(check.details)}`);
  }

  await fs.writeFile(MD_REPORT, `${lines.join('\n')}\n`);
}

async function main() {
  let browser;
  let preview;

  try {
    const port = await reservePort(Number(process.env.PLAYTEST_PORT ?? DEFAULT_PORT));
    const baseUrl = process.env.PLAYTEST_BASE_URL ?? `http://127.0.0.1:${port}/?debug=1`;
    const previewCommand =
      process.platform === 'win32'
        ? {
            command: 'cmd.exe',
            args: ['/d', '/s', '/c', `npx vite preview --host 127.0.0.1 --port ${port} --strictPort`],
          }
        : {
            command: 'npx',
            args: ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
          };

    preview = spawn(previewCommand.command, previewCommand.args, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    preview.stdout.on('data', (chunk) => process.stdout.write(chunk));
    preview.stderr.on('data', (chunk) => process.stderr.write(chunk));

    await waitForServer(baseUrl);
    browser = await chromium.launch({ headless: true });
    const page = await openPage(browser, baseUrl);
    const scenarioResults = await runScenarioChecks(page);
    const summary = summarize(scenarioResults);
    summary.server = baseUrl;

    await writeReport(summary);

    if (!summary.ok) {
      throw new Error(`Playtest failed. See ${JSON_REPORT}`);
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    if (preview && !preview.killed) {
      preview.kill();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});