import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = process.env.OPENSPEC_CHANGE ?? 'remove-complete-scene-accent-widget';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'complete-scene-playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'complete-scene-playtest-report.md');
const PORT = 4197;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 20000) {
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
      return Boolean(game) && game.scene.getScenes(true).some((scene) => scene.scene.key === key);
    },
    sceneKey,
    { timeout: timeoutMs },
  );
}

async function run() {
  const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  try {
    console.log('playtest: waiting for preview server');
    await waitForServer(BASE_URL);
    console.log('playtest: launching browser');
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await waitForActiveScene(page, 'menu');

      const nonFinal = await page.evaluate(() => {
        const bridge = window.__CRYSTAL_RUN_BRIDGE__;
        const game = window.__CRYSTAL_RUN_GAME__;
        bridge.forceStartStage(0);
        bridge.getSession().getState().progress.activePowers.doubleJump = true;
        game.scene.getScene('game').scene.start('complete');
      });
      void nonFinal;
      await waitForActiveScene(page, 'complete');

      const completeCheck = await page.evaluate(() => {
        const game = window.__CRYSTAL_RUN_GAME__;
        const complete = game.scene.getScene('complete');
        const debug = typeof complete.getDebugSnapshot === 'function' ? complete.getDebugSnapshot() : null;
        const textValues = complete.children
          .getChildren()
          .filter((child) => typeof child.text === 'string')
          .map((child) => child.text);
        const rectangles = complete.children.getChildren().filter((child) => child.type === 'Rectangle');
        const sideWidgetRects = rectangles.filter((child) => Math.abs((child.x ?? 0) - (complete.scale.width - 176)) <= 8);
        return {
          hasRunSamples: textValues.some((value) => value.includes('Run research samples:')),
          hasSectorSamples: textValues.some((value) => value.includes('Sector research samples:')),
          hasBeacons: textValues.some((value) => value.includes('Survey beacons online:')),
          hasLoadout: textValues.some((value) => value.includes('Loadout:')),
          hasStageName: textValues.some((value) => value.includes('Verdant Impact Crater')),
          hasRetroFrame: rectangles.length >= 4,
          sideWidgetRects: sideWidgetRects.length,
          debug,
        };
      });

      await page.waitForFunction(
        () => {
          const bridge = window.__CRYSTAL_RUN_BRIDGE__;
          const game = window.__CRYSTAL_RUN_GAME__;
          const activeSceneKeys = game.scene.getScenes(true).map((scene) => scene.scene.key);
          return (
            !activeSceneKeys.includes('complete') &&
            (activeSceneKeys.includes('stage-intro') || activeSceneKeys.includes('game') || bridge.getSession().getState().stageIndex > 0)
          );
        },
        { timeout: 5000 },
      );
      const autoAdvanced = await page.evaluate(() => {
        const bridge = window.__CRYSTAL_RUN_BRIDGE__;
        const game = window.__CRYSTAL_RUN_GAME__;
        const activeSceneKeys = game.scene.getScenes(true).map((scene) => scene.scene.key);
        return !activeSceneKeys.includes('complete') && (activeSceneKeys.includes('stage-intro') || activeSceneKeys.includes('game') || bridge.getSession().getState().stageIndex > 0);
      });

      await page.evaluate(() => {
        const bridge = window.__CRYSTAL_RUN_BRIDGE__;
        const game = window.__CRYSTAL_RUN_GAME__;
        bridge.forceStartStage(2);
        game.scene.getScene('game').scene.start('complete');
      });
      await waitForActiveScene(page, 'complete');
      await page.waitForTimeout(3200);
      const finalStageStays = await page.evaluate(() => {
        const game = window.__CRYSTAL_RUN_GAME__;
        const bridge = window.__CRYSTAL_RUN_BRIDGE__;
        return game.scene.getScenes(true).some((scene) => scene.scene.key === 'complete') && bridge.getSession().getState().stageIndex === 2;
      });

      const result = {
        passed:
          completeCheck.hasRunSamples &&
          completeCheck.hasSectorSamples &&
          completeCheck.hasBeacons &&
          completeCheck.hasLoadout &&
          completeCheck.hasStageName &&
          completeCheck.hasRetroFrame &&
          completeCheck.sideWidgetRects === 0 &&
          completeCheck.debug?.sideWidgetVisible === false &&
          completeCheck.debug?.accentMode === 'none' &&
          completeCheck.debug?.accentVisible === false &&
          completeCheck.debug?.accentTweenActive === false &&
          completeCheck.debug?.accentBurstCount === 0 &&
          autoAdvanced &&
          finalStageStays,
        completeCheck,
        autoAdvanced,
        finalStageStays,
      };

      await fs.mkdir(REPORT_DIR, { recursive: true });
      await fs.writeFile(JSON_REPORT, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

      const markdown = [
        '# Complete Scene Accent Playtest',
        '',
        `- Passed: ${String(result.passed)}`,
        `- Run samples visible: ${String(result.completeCheck.hasRunSamples)}`,
        `- Sector samples visible: ${String(result.completeCheck.hasSectorSamples)}`,
        `- Beacon summary visible: ${String(result.completeCheck.hasBeacons)}`,
        `- Loadout visible: ${String(result.completeCheck.hasLoadout)}`,
        `- Stage name visible: ${String(result.completeCheck.hasStageName)}`,
        `- Retro frame preserved: ${String(result.completeCheck.hasRetroFrame)}`,
        `- Right-side widget rectangles: ${result.completeCheck.sideWidgetRects}`,
        `- Debug sideWidgetVisible: ${String(result.completeCheck.debug?.sideWidgetVisible)}`,
        `- Debug accentMode: ${String(result.completeCheck.debug?.accentMode)}`,
        `- Debug accentVisible: ${String(result.completeCheck.debug?.accentVisible)}`,
        `- Debug accentTweenActive: ${String(result.completeCheck.debug?.accentTweenActive)}`,
        `- Debug accentBurstCount: ${String(result.completeCheck.debug?.accentBurstCount)}`,
        `- Non-final completion auto-advanced: ${String(result.autoAdvanced)}`,
        `- Final-stage completion stayed active: ${String(result.finalStageStays)}`,
      ].join('\n');
      await fs.writeFile(MD_REPORT, `${markdown}\n`, 'utf8');

      console.log(`playtest: wrote ${JSON_REPORT}`);
      if (!result.passed) {
        throw new Error('Complete scene accent playtest failed');
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.kill();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});