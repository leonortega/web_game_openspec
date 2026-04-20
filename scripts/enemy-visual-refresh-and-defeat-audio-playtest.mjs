import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = 'enemy-visual-refresh-and-defeat-audio';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'verification.json');
const MD_REPORT = path.join(REPORT_DIR, 'playtest-report.md');
const PORT = 4181;
const BASE_URL = process.env.PLAYTEST_BASE_URL ?? `http://127.0.0.1:${PORT}/?debug=1`;
const VIEWPORT = { width: 1440, height: 900 };
const STAGE_INDICES = [0, 1, 2];

const RELEVANT_CUES = new Set(['stomp', 'shoot-hit', 'hurt', 'death']);

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
  await wait(120);
  return page;
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

function extractRelevantCueOrder(audioDebug) {
  return (audioDebug?.events ?? [])
    .filter((event) => event.type === 'cue' && RELEVANT_CUES.has(event.cue))
    .map((event) => event.cue);
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

async function findStageIndex(page, predicateSource) {
  for (const stageIndex of STAGE_INDICES) {
    await startGameScene(page, stageIndex);
    const matched = await page.evaluate(predicateSource);
    if (matched) {
      return stageIndex;
    }
  }

  throw new Error('Could not find a stage that matches the requested validation scenario');
}

async function centerCameraAndShot(page, x, y, name) {
  await page.evaluate(
    ({ targetX, targetY }) => {
      const game = window.__CRYSTAL_RUN_GAME__;
      const scene = game.scene.getScene('game');
      scene.cameras.main.stopFollow();
      scene.cameras.main.centerOn(targetX, targetY);
    },
    { targetX: x, targetY: y },
  );
  await wait(32);
  await page.locator('canvas').screenshot({ path: path.join(REPORT_DIR, name) });
}

async function captureFlyerRead(page) {
  const stageIndex = await findStageIndex(
    page,
    () => window.__CRYSTAL_RUN_BRIDGE__.getSession().getState().stageRuntime.enemies.some((enemy) => enemy.kind === 'flyer'),
  );
  await startGameScene(page, stageIndex);

  const snapshot = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const state = bridge.getSession().getState();
    const flyer = state.stageRuntime.enemies.find((enemy) => enemy.kind === 'flyer');
    if (!flyer) {
      throw new Error('Missing flyer enemy for saucer-read validation');
    }
    const scene = game.scene.getScene('game');
    const sprite = scene.enemySprites.get(flyer.id);
    const accents = scene.enemyAccentSprites.get(flyer.id) ?? [];
    return {
      stageId: state.stage.id,
      enemyId: flyer.id,
      enemyX: flyer.x,
      enemyY: flyer.y,
      spriteX: sprite?.x ?? null,
      spriteY: sprite?.y ?? null,
      spriteWidth: sprite?.displayWidth ?? sprite?.width ?? null,
      spriteHeight: sprite?.displayHeight ?? sprite?.height ?? null,
      accents: accents.map((accent) => ({
        x: accent.x,
        y: accent.y,
        width: accent.width,
        height: accent.height,
        visible: accent.visible,
        alpha: accent.alpha,
      })),
    };
  });

  await centerCameraAndShot(
    page,
    (snapshot.spriteX ?? snapshot.enemyX) + (snapshot.spriteWidth ?? 34) / 2,
    (snapshot.spriteY ?? snapshot.enemyY) + (snapshot.spriteHeight ?? 24) / 2,
    'flyer-undercarriage.png',
  );

  const lowerHullThreshold = (snapshot.spriteY ?? snapshot.enemyY) + (snapshot.spriteHeight ?? 24) * 0.5;
  const undersideReadable =
    snapshot.accents.length === 2 &&
    snapshot.accents.every((accent) => accent.visible && accent.y >= lowerHullThreshold);

  return {
    ...snapshot,
    lowerHullThreshold,
    undersideReadable,
  };
}

async function captureStompScenario(page) {
  const stageIndex = await findStageIndex(
    page,
    () => window.__CRYSTAL_RUN_BRIDGE__.getSession().getState().stageRuntime.enemies.some((enemy) => enemy.kind === 'hopper' || enemy.kind === 'walker' || enemy.kind === 'charger'),
  );
  await startGameScene(page, stageIndex);
  await resetAudioDebug(page);

  const result = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
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
    session.consumeCues();

    const target = state.stageRuntime.enemies.find(
      (enemy) => enemy.kind === 'hopper' || enemy.kind === 'walker' || enemy.kind === 'charger',
    );
    if (!target) {
      throw new Error('Missing stompable enemy for stomp validation');
    }
    const support = state.stageRuntime.enemies
      .filter((enemy) => enemy.id !== target.id && enemy.alive)
      .sort((left, right) => Math.abs(left.x - target.x) - Math.abs(right.x - target.x))[0] ?? null;

    state.player.x = target.x;
    state.player.y = target.y - state.player.height - 2;
    state.player.vx = 0;
    state.player.vy = 320;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    session.update(16, idleInput);

    const scene = game.scene.getScene('game');
    const targetSprite = scene.enemySprites.get(target.id);
    const supportSprite = support ? scene.enemySprites.get(support.id) : null;
    const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;

    return {
      stageId: state.stage.id,
      targetId: target.id,
      targetKind: target.kind,
      supportId: support?.id ?? null,
      targetAlive: state.stageRuntime.enemies.find((enemy) => enemy.id === target.id)?.alive ?? null,
      defeatCause: state.stageRuntime.enemies.find((enemy) => enemy.id === target.id)?.defeatCause ?? null,
      stageMessage: state.stageMessage,
      feedbackCounts: debug?.feedbackCounts ?? {},
      targetVisible: targetSprite?.visible ?? false,
      targetDepth: targetSprite?.depth ?? null,
      targetX: targetSprite?.x ?? target.x,
      targetY: targetSprite?.y ?? target.y,
      supportVisible: supportSprite?.visible ?? false,
    };
  });

  await wait(90);
  const audioDebug = await readAudioDebug(page);
  await centerCameraAndShot(page, result.targetX + 17, result.targetY + 12, 'stomp-defeat.png');

  return {
    ...result,
    cueOrder: extractRelevantCueOrder(audioDebug),
  };
}

async function capturePlasmaScenario(page) {
  const stageIndex = await findStageIndex(
    page,
    () => window.__CRYSTAL_RUN_BRIDGE__.getSession().getState().stageRuntime.enemies.some((enemy) => enemy.kind === 'hopper' || enemy.kind === 'walker' || enemy.kind === 'charger'),
  );
  await startGameScene(page, stageIndex);
  await resetAudioDebug(page);

  const result = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
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
    session.consumeCues();

    const target = state.stageRuntime.enemies.find(
      (enemy) => enemy.kind === 'hopper' || enemy.kind === 'walker' || enemy.kind === 'charger',
    );
    if (!target) {
      throw new Error('Missing target enemy for plasma-defeat validation');
    }
    const support = state.stageRuntime.enemies
      .filter((enemy) => enemy.id !== target.id && enemy.alive)
      .sort((left, right) => Math.abs(left.x - target.x) - Math.abs(right.x - target.x))[0] ?? null;

    state.stageRuntime.projectiles.push({
      id: `debug-shot-${Math.random().toString(36).slice(2, 8)}`,
      owner: 'player',
      x: target.x + target.width / 2 - 8,
      y: target.y + target.height / 2 - 6,
      vx: 0,
      width: 16,
      height: 12,
      alive: true,
    });

    session.update(16, idleInput);

    const scene = game.scene.getScene('game');
    const targetSprite = scene.enemySprites.get(target.id);
    const supportSprite = support ? scene.enemySprites.get(support.id) : null;
    const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;

    return {
      stageId: state.stage.id,
      targetId: target.id,
      targetKind: target.kind,
      supportId: support?.id ?? null,
      targetAlive: state.stageRuntime.enemies.find((enemy) => enemy.id === target.id)?.alive ?? null,
      defeatCause: state.stageRuntime.enemies.find((enemy) => enemy.id === target.id)?.defeatCause ?? null,
      stageMessage: state.stageMessage,
      feedbackCounts: debug?.feedbackCounts ?? {},
      targetVisible: targetSprite?.visible ?? false,
      targetDepth: targetSprite?.depth ?? null,
      targetX: targetSprite?.x ?? target.x,
      targetY: targetSprite?.y ?? target.y,
      supportVisible: supportSprite?.visible ?? false,
    };
  });

  await wait(90);
  const audioDebug = await readAudioDebug(page);
  await centerCameraAndShot(page, result.targetX + 17, result.targetY + 12, 'plasma-defeat.png');

  return {
    ...result,
    cueOrder: extractRelevantCueOrder(audioDebug),
  };
}

async function capturePlayerDeathScenario(page) {
  await startGameScene(page, 0);
  await resetAudioDebug(page);

  const result = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const session = bridge.getSession();
    const state = session.getState();
    session.consumeCues();

    state.progress.activePowers.doubleJump = false;
    state.progress.activePowers.shooter = false;
    state.progress.activePowers.invincible = false;
    state.progress.activePowers.dash = false;
    state.progress.powerTimers.invincibleMs = 0;
    state.player.health = 1;
    state.player.invulnerableMs = 0;

    session.damagePlayer();

    const scene = game.scene.getScene('game');
    const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;

    return {
      stageId: state.stage.id,
      playerDead: state.player.dead,
      respawnTimerMs: state.respawnTimerMs,
      playerVisible: scene.player?.visible ?? false,
      playerDepth: scene.player?.depth ?? null,
      playerX: scene.player?.x ?? state.player.x,
      playerY: scene.player?.y ?? state.player.y,
      stageMessage: state.stageMessage,
      feedbackCounts: debug?.feedbackCounts ?? {},
    };
  });

  await wait(120);
  const audioDebug = await readAudioDebug(page);
  const resolved = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const session = bridge.getSession();
    const state = session.getState();
    const scene = game.scene.getScene('game');
    return {
      playerVisible: scene.player?.visible ?? false,
      respawnTimerMs: state.respawnTimerMs,
    };
  });

  await centerCameraAndShot(page, result.playerX + 13, result.playerY + 21, 'player-death.png');

  return {
    ...result,
    resolved,
    cueOrder: extractRelevantCueOrder(audioDebug),
  };
}

function evaluateResult(result) {
  const flyerPass = result.flyer.undersideReadable;
  const stompPass =
    result.stomp.targetAlive === false &&
    result.stomp.defeatCause === 'stomp' &&
    result.stomp.supportVisible === true &&
    JSON.stringify(result.stomp.cueOrder) === JSON.stringify(['stomp']);
  const plasmaPass =
    result.plasma.targetAlive === false &&
    result.plasma.defeatCause === 'plasma-blast' &&
    result.plasma.supportVisible === true &&
    JSON.stringify(result.plasma.cueOrder) === JSON.stringify(['shoot-hit']);
  const deathPass =
    result.playerDeath.playerDead === true &&
    result.playerDeath.resolved.respawnTimerMs < result.playerDeath.respawnTimerMs &&
    JSON.stringify(result.playerDeath.cueOrder) === JSON.stringify(['death']);

  return {
    flyerPass,
    stompPass,
    plasmaPass,
    deathPass,
    overallPass: flyerPass && stompPass && plasmaPass && deathPass,
  };
}

function buildMarkdownReport(result, evaluation) {
  const passLine = evaluation.overallPass
    ? '- The flyer now reads as a lower-lit saucer in live play, and the defeat or death cues stayed cleanly separated across stomp, plasma, and fatal-hit probes.'
    : '- One or more live probes did not meet the expected visual or audio separation thresholds, so the change should stay in verify/fix until those gaps are resolved.';

  return `## Live Verification

- Date: 2026-04-15
- Server: \`npx vite preview --host 127.0.0.1 --port ${PORT}\`
- URL: \`${BASE_URL}\`
- Method: headless Playwright probe against the debug-enabled preview build

## Flyer Read Check

- Stage: \`${result.flyer.stageId}\`
- Accent count: \`${result.flyer.accents.length}\`
- Lower-hull threshold: \`${result.flyer.lowerHullThreshold}\`
- Accent Y positions: \`${result.flyer.accents.map((accent) => accent.y).join(', ')}\`
- Underside-lit read passed: \`${evaluation.flyerPass}\`

## Defeat Audio Checks

### Stomp

- Stage: \`${result.stomp.stageId}\`
- Enemy kind: \`${result.stomp.targetKind}\`
- Defeat cause: \`${result.stomp.defeatCause}\`
- Support threat still visible: \`${result.stomp.supportVisible}\`
- Relevant cue order: \`${result.stomp.cueOrder.join(', ') || 'none'}\`
- Feedback counts: \`${JSON.stringify(result.stomp.feedbackCounts)}\`
- Passed: \`${evaluation.stompPass}\`

### Plasma Blaster

- Stage: \`${result.plasma.stageId}\`
- Enemy kind: \`${result.plasma.targetKind}\`
- Defeat cause: \`${result.plasma.defeatCause}\`
- Support threat still visible: \`${result.plasma.supportVisible}\`
- Relevant cue order: \`${result.plasma.cueOrder.join(', ') || 'none'}\`
- Feedback counts: \`${JSON.stringify(result.plasma.feedbackCounts)}\`
- Passed: \`${evaluation.plasmaPass}\`

## Player Death Audio Check

- Stage: \`${result.playerDeath.stageId}\`
- Player dead latched: \`${result.playerDeath.playerDead}\`
- Respawn timer during hold: \`${result.playerDeath.respawnTimerMs}\`
- Respawn timer after hold: \`${result.playerDeath.resolved.respawnTimerMs}\`
- Relevant cue order: \`${result.playerDeath.cueOrder.join(', ') || 'none'}\`
- Feedback counts: \`${JSON.stringify(result.playerDeath.feedbackCounts)}\`
- Passed: \`${evaluation.deathPass}\`

## Screenshots

- \`flyer-undercarriage.png\`
- \`stomp-defeat.png\`
- \`plasma-defeat.png\`
- \`player-death.png\`

## Decision

${passLine}

- Flyer lower-light placement: \`${evaluation.flyerPass}\`
- Stomp cue separation: \`${evaluation.stompPass}\`
- Plasma cue separation: \`${evaluation.plasmaPass}\`
- Fatal-death cue separation: \`${evaluation.deathPass}\`
- Overall pass: \`${evaluation.overallPass}\`
`;
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });

  let preview;
  const useExternalServer = Boolean(process.env.PLAYTEST_BASE_URL);
  if (!useExternalServer) {
    preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], {
      cwd: ROOT,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });

    preview.stdout.on('data', (chunk) => process.stdout.write(chunk));
    preview.stderr.on('data', (chunk) => process.stderr.write(chunk));
  }

  const cleanup = async () => {
    if (preview && !preview.killed) {
      preview.kill();
    }
  };

  try {
    await waitForServer(BASE_URL.replace(/\?debug=1$/, ''));
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await openPage(browser);
      try {
        const flyer = await captureFlyerRead(page);
        const stomp = await captureStompScenario(page);
        const plasma = await capturePlasmaScenario(page);
        const playerDeath = await capturePlayerDeathScenario(page);
        const result = { flyer, stomp, plasma, playerDeath };
        const evaluation = evaluateResult(result);

        await fs.writeFile(JSON_REPORT, `${JSON.stringify({ ...result, evaluation }, null, 2)}\n`, 'utf8');
        await fs.writeFile(MD_REPORT, buildMarkdownReport(result, evaluation), 'utf8');

        if (!evaluation.overallPass) {
          throw new Error('Live validation did not satisfy all enemy-visual-refresh-and-defeat-audio checks');
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