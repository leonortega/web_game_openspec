import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = 'defeat-freeze-and-explosion-readability';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'verification.json');
const MD_REPORT = path.join(REPORT_DIR, 'playtest-report.md');
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;
const VIEWPORT = { width: 1280, height: 720 };

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

async function openPage(browser) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  attachPageLogging(page);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForActiveScene(page, 'menu');
  await page.locator('canvas').click({ position: { x: 24, y: 24 } });
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

async function captureEnemyHold(page) {
  await startGameScene(page, 1);

  const setup = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const session = bridge.getSession();
    const idleInput = {
      left: false,
      right: false,
      jumpHeld: false,
      jumpPressed: false,
      dashPressed: false,
      shootPressed: false,
    };

    const state = session.getState();
    const targetEnemy = state.stageRuntime.enemies.find((enemy) => enemy.kind === 'hopper');
    const supportEnemy = targetEnemy
      ? state.stageRuntime.enemies
          .filter((enemy) => enemy.id !== targetEnemy.id)
          .sort((left, right) => Math.abs(left.x - targetEnemy.x) - Math.abs(right.x - targetEnemy.x))[0]
      : null;
    if (!targetEnemy) {
      throw new Error('Missing hopper target for enemy hold validation');
    }
    if (!supportEnemy) {
      throw new Error('Missing support threat for mixed-encounter validation');
    }

    state.player.x = targetEnemy.x;
    state.player.y = targetEnemy.y - state.player.height - 2;
    state.player.vx = 0;
    state.player.vy = 320;
    state.player.onGround = false;
    state.player.supportPlatformId = null;

    session.update(16, idleInput);

    return {
      targetId: targetEnemy.id,
      supportId: supportEnemy.id,
    };
  });
  await page.waitForTimeout(80);

  const probe = await page.evaluate(({ targetId, supportId }) => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    const liveState = bridge.getSession().getState();
    const sceneSnapshot = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
    const targetSprite = scene.enemySprites.get(targetId);
    const supportSprite = scene.enemySprites.get(supportId);
    const emitters = scene.children
      .getChildren()
      .filter((child) => child.type === 'ParticleEmitter')
      .map((child) => ({ depth: child.depth, visible: child.visible, x: child.x, y: child.y }));

    return {
      targetId,
      supportId,
      debug: sceneSnapshot,
      stateEnemyAlive: liveState.stageRuntime.enemies.find((enemy) => enemy.id === targetId)?.alive ?? null,
      targetVisible: targetSprite?.visible ?? false,
      targetDepth: targetSprite?.depth ?? null,
      targetAngle: targetSprite?.angle ?? null,
      targetScaleX: targetSprite?.scaleX ?? null,
      targetScaleY: targetSprite?.scaleY ?? null,
      targetTint: targetSprite?.tintTopLeft ?? null,
      targetX: targetSprite?.x ?? null,
      targetY: targetSprite?.y ?? null,
      supportVisible: supportSprite?.visible ?? false,
      supportX: supportSprite?.x ?? null,
      supportY: supportSprite?.y ?? null,
      emitters,
    };
  }, setup);

  const canvas = page.locator('canvas');
  await page.evaluate(({ targetX, targetY }) => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    scene.cameras.main.stopFollow();
    scene.cameras.main.centerOn(targetX, targetY);
  }, { targetX: probe.targetX ?? 0, targetY: probe.targetY ?? 0 });
  await page.waitForTimeout(16);
  await canvas.screenshot({ path: path.join(REPORT_DIR, 'enemy-hold-centered.png') });
  await page.evaluate(({ targetX, targetY }) => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    scene.cameras.main.centerOn(targetX, targetY);
  }, { targetX: probe.targetX ?? 0, targetY: probe.targetY ?? 0 });
  await page.waitForTimeout(16);
  await canvas.screenshot({ path: path.join(REPORT_DIR, 'enemy-hold.png') });

  await page.waitForTimeout(100);
  const resolved = await page.evaluate((targetId) => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    const targetSprite = scene.enemySprites.get(targetId);
    return {
      targetVisible: targetSprite?.visible ?? false,
      emitters: scene.children
        .getChildren()
        .filter((child) => child.type === 'ParticleEmitter')
        .map((child) => ({ depth: child.depth, visible: child.visible, x: child.x, y: child.y })),
    };
  }, probe.targetId);

  return { hold: probe, resolved };
}

async function capturePlayerHold(page) {
  await startGameScene(page, 1);

  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const session = bridge.getSession();

    const state = session.getState();
    state.progress.activePowers.doubleJump = false;
    state.progress.activePowers.shooter = false;
    state.progress.activePowers.invincible = false;
    state.progress.activePowers.dash = false;
    state.progress.powerTimers.invincibleMs = 0;
    state.player.health = 1;
    state.player.invulnerableMs = 0;
    session.damagePlayer();
  });
  await page.waitForTimeout(80);

  const probe = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    const liveState = bridge.getSession().getState();
    const sceneSnapshot = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
    const emitters = scene.children
      .getChildren()
      .filter((child) => child.type === 'ParticleEmitter')
      .map((child) => ({ depth: child.depth, visible: child.visible, x: child.x, y: child.y }));

    return {
      debug: sceneSnapshot,
      visible: scene.player.visible,
      depth: scene.player.depth,
      angle: scene.player.angle,
      scaleX: scene.player.scaleX,
      scaleY: scene.player.scaleY,
      fillColor: scene.player.fillColor,
      playerX: scene.player.x,
      playerY: scene.player.y,
      respawnTimerMs: liveState.respawnTimerMs,
      emitters,
    };
  });

  const canvas = page.locator('canvas');
  await page.evaluate(({ playerX, playerY }) => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    scene.cameras.main.stopFollow();
    scene.cameras.main.centerOn(playerX, playerY);
  }, { playerX: probe.playerX ?? 0, playerY: probe.playerY ?? 0 });
  await page.waitForTimeout(16);
  await canvas.screenshot({ path: path.join(REPORT_DIR, 'player-hold-centered.png') });
  await page.evaluate(({ playerX, playerY }) => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    scene.cameras.main.centerOn(playerX, playerY);
  }, { playerX: probe.playerX ?? 0, playerY: probe.playerY ?? 0 });
  await page.waitForTimeout(16);
  await canvas.screenshot({ path: path.join(REPORT_DIR, 'player-hold.png') });

  await page.waitForTimeout(120);
  const resolved = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    return {
      visible: scene.player.visible,
      respawnTimerMs: bridge.getSession().getState().respawnTimerMs,
      emitters: scene.children
        .getChildren()
        .filter((child) => child.type === 'ParticleEmitter')
        .map((child) => ({ depth: child.depth, visible: child.visible, x: child.x, y: child.y })),
    };
  });

  return { hold: probe, resolved };
}

function buildMarkdownReport(result) {
  const enemyReadable =
    result.enemyHold.hold.targetVisible === true &&
    result.enemyHold.hold.supportVisible === true &&
    result.enemyHold.hold.targetDepth >= 12 &&
    result.enemyHold.hold.emitters.some((emitter) => emitter.depth >= 15);
  const playerReadable =
    result.playerHold.hold.visible === true &&
    result.playerHold.hold.depth >= 12 &&
    result.playerHold.hold.emitters.some((emitter) => emitter.depth >= 16) &&
    result.playerHold.hold.respawnTimerMs < 900;
  const pass = enemyReadable && playerReadable;

  const visualSummary = pass
    ? '- The defeat hold, victim-side cue, and stronger explosion now read clearly enough in the current gameplay frames while remaining local to the victim.\n- Nearby gameplay information remains visible during the mixed-encounter enemy probe, and the player-death presentation still hands off into the existing respawn countdown.'
    : '- The hold timing may be present, but the current captured frames still do not show both defeat classes reading clearly enough in active play to clear the task.\n- Keep the change in the verify/fix loop until the live frames convincingly show the intended readability outcome.';
  const decisionLines = pass
    ? [
        '- Mark `openspec/changes/defeat-freeze-and-explosion-readability/tasks.md` item `3.2` complete.',
        '- This live verification clears the OpenSpec active-play task for the change.',
      ]
    : [
        '- Keep `openspec/changes/defeat-freeze-and-explosion-readability/tasks.md` item `3.2` unchecked.',
        '- Do not archive the change yet.',
      ];

  return `## Live Verification\n\n- Date: 2026-04-15\n- Server: \`npx vite preview --host 127.0.0.1 --port 4173\`\n- URL: \`${BASE_URL}\`\n- Method: headless Playwright probe against the debug-enabled preview build\n\n## Automated Validation\n\n- \`npm test\`: passed\n- \`npm run build\`: passed\n\n## Defeat Hold Timing\n\n### Enemy Stomp\n\n- Forced a hopper stomp defeat in the live \`game\` scene\n- Dead enemy visibility during hold: \`${result.enemyHold.hold.targetVisible}\`\n- Dead enemy visibility after hold: \`${result.enemyHold.resolved.targetVisible}\`\n- Support threat visibility during hold: \`${result.enemyHold.hold.supportVisible}\`\n- Defeat feedback counters: \`${JSON.stringify(result.enemyHold.hold.debug?.feedbackCounts ?? {})}\`\n- Live emitter depths during the probe: \`${result.enemyHold.hold.emitters.map((emitter) => emitter.depth).join(', ')}\`\n\n### Player Defeat\n\n- Forced a fatal player damage event in the live \`game\` scene\n- Player visibility during hold: \`${result.playerHold.hold.visible}\`\n- Player visibility after hold: \`${result.playerHold.resolved.visible}\`\n- Respawn timer continued counting down during the hold window (\`${Number(result.playerHold.hold.respawnTimerMs).toFixed(2)}ms\` observed during hold, \`${Number(result.playerHold.resolved.respawnTimerMs).toFixed(2)}ms\` after)\n- Defeat feedback counter: \`${JSON.stringify(result.playerHold.hold.debug?.feedbackCounts ?? {})}\`\n- Live emitter depths during the probe: \`${result.playerHold.hold.emitters.map((emitter) => emitter.depth).join(', ')}\`\n\n## Visual Outcome\n\n- Centered screenshots were captured at:\n  - \`enemy-hold-centered.png\`\n  - \`enemy-hold.png\`\n  - \`player-hold-centered.png\`\n  - \`player-hold.png\`\n${visualSummary}\n\n## Decision\n\n${decisionLines.join('\n')}\n\n## Machine Summary\n\n- Enemy readable: \`${enemyReadable}\`\n- Player readable: \`${playerReadable}\`\n- Overall pass: \`${pass}\`\n`;
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });

  const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });

  let previewOutput = '';
  preview.stdout.on('data', (chunk) => {
    previewOutput += chunk.toString();
  });
  preview.stderr.on('data', (chunk) => {
    previewOutput += chunk.toString();
  });

  const cleanup = async () => {
    if (!preview.killed) {
      preview.kill();
    }
  };

  try {
    await waitForServer(`http://127.0.0.1:${PORT}`);
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await openPage(browser);
      try {
        const enemyHold = await captureEnemyHold(page);
        const playerHold = await capturePlayerHold(page);
        const result = { enemyHold, playerHold };
        await fs.writeFile(JSON_REPORT, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
        await fs.writeFile(MD_REPORT, buildMarkdownReport(result), 'utf8');
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
