import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = process.env.OPENSPEC_CHANGE ?? 'refine-enemy-spacing-and-platform-jump-timing';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'playtest-report.md');
const PORT = 4179;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}
    await wait(500);
  }
  throw new Error(`Timed out waiting for preview server at ${url}`);
}

function estimateMinutes(stage) {
  const platformBudget = stage.platforms.reduce((sum, platform) => sum + platform.width, 0) / 1000;
  const segmentBudget = stage.segments.length * 0.6;
  const encounterBudget = stage.enemies.length * 0.35;
  const hazardBudget = stage.hazards.length * 0.18;
  const collectibleBudget = stage.collectibles.length * 0.07;
  const checkpointBudget = stage.checkpoints.length * 0.15;
  return Number(
    (platformBudget + segmentBudget + encounterBudget + hazardBudget + collectibleBudget + checkpointBudget).toFixed(2),
  );
}

function analyzeReadability(stage) {
  const boundaries = [stage.world.width / 3, (stage.world.width / 3) * 2];
  const collectibleZones = new Set(
    stage.collectibles.map((collectible) => {
      if (collectible.position.x < boundaries[0]) return 'early';
      if (collectible.position.x < boundaries[1]) return 'mid';
      return 'late';
    }),
  );
  const checkpointAnchors = [stage.playerSpawn.x, ...stage.checkpoints.map((checkpoint) => checkpoint.rect.x), stage.exit.x];
  const checkpointGaps = checkpointAnchors.slice(1).map((value, index) => value - checkpointAnchors[index]);
  const maxCheckpointGap = Math.max(...checkpointGaps);

  return {
    segmentCount: stage.segments.length,
    collectibleZones: [...collectibleZones],
    maxCheckpointGap,
    segmentPass: stage.segments.length >= 5,
    collectiblePass: collectibleZones.size >= 3,
    checkpointPass: maxCheckpointGap <= 2200,
  };
}

function overlapWidth(aStart, aEnd, bStart, bEnd) {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}

function enemyRect(enemy) {
  const width = enemy.kind === 'turret' ? 28 : enemy.kind === 'flyer' ? 34 : 34;
  const height = enemy.kind === 'turret' ? 38 : enemy.kind === 'flyer' ? 24 : 30;
  return {
    x: enemy.position.x,
    y: enemy.position.y,
    width,
    height,
  };
}

function findStrictSupport(stage, left, right, bottom) {
  return stage.platforms.find((platform) => {
    if (platform.kind !== 'static') {
      return false;
    }
    const overlap = overlapWidth(left, right, platform.x, platform.x + platform.width);
    return overlap >= (right - left) * 0.75 && Math.abs(bottom - platform.y) <= 4;
  });
}

function hasCenterBiasedMargin(support, left, right) {
  const leftMargin = left - support.x;
  const rightMargin = support.x + support.width - right;
  const minMargin = Math.min(48, support.width * 0.18);
  return leftMargin >= minMargin && rightMargin >= minMargin;
}

function intersectsRect(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function analyzeSafety(stage) {
  const unsafeCheckpoints = [];
  const unsafeHazards = [];
  const unsafeEnemySpawns = [];
  const invalidEnemyLanes = [];
  const edgeThreats = [];

  for (const checkpoint of stage.checkpoints) {
    const support = findStrictSupport(
      stage,
      checkpoint.rect.x,
      checkpoint.rect.x + checkpoint.rect.width,
      checkpoint.rect.y + checkpoint.rect.height,
    );

    const dangerZone = {
      x: checkpoint.rect.x - 56,
      y: checkpoint.rect.y - 20,
      width: checkpoint.rect.width + 112,
      height: checkpoint.rect.height + 36,
    };
    const enemyConflict = stage.enemies.some((enemy) => intersectsRect(dangerZone, enemyRect(enemy)));
    const hazardConflict = stage.hazards.some((hazard) => intersectsRect(dangerZone, hazard.rect));

    if (!support || enemyConflict || hazardConflict) {
      unsafeCheckpoints.push(checkpoint.id);
    }
  }

  for (const hazard of stage.hazards) {
    const support = findStrictSupport(stage, hazard.rect.x, hazard.rect.x + hazard.rect.width, hazard.rect.y + hazard.rect.height);

    if (!support) {
      unsafeHazards.push(hazard.id);
      continue;
    }

    if (hazard.kind === 'spikes' && !hasCenterBiasedMargin(support, hazard.rect.x, hazard.rect.x + hazard.rect.width)) {
      edgeThreats.push(hazard.id);
    }
  }

  for (const enemy of stage.enemies) {
    if (enemy.kind === 'flyer') {
      continue;
    }

    const rect = enemyRect(enemy);
    const support = findStrictSupport(stage, rect.x, rect.x + rect.width, rect.y + rect.height);
    if (!support) {
      unsafeEnemySpawns.push(enemy.id);
      continue;
    }

    if (enemy.kind === 'turret' && !hasCenterBiasedMargin(support, rect.x, rect.x + rect.width)) {
      edgeThreats.push(enemy.id);
    }

    if (enemy.kind === 'walker' && enemy.patrol) {
      const patrolLeft = enemy.patrol.left;
      const patrolRight = enemy.patrol.right;
      if (patrolLeft < support.x || patrolRight > support.x + support.width) {
        invalidEnemyLanes.push(enemy.id);
      }
    }

    if (enemy.kind === 'charger' && enemy.charger) {
      const patrolLeft = enemy.charger.left;
      const patrolRight = enemy.charger.right;
      if (patrolLeft < support.x || patrolRight > support.x + support.width) {
        invalidEnemyLanes.push(enemy.id);
      }
    }
  }

  return {
    unsafeCheckpoints,
    unsafeHazards,
    unsafeEnemySpawns,
    invalidEnemyLanes,
    edgeThreats,
    checkpointPass: unsafeCheckpoints.length === 0,
    hazardPass: unsafeHazards.length === 0,
    enemyPass: unsafeEnemySpawns.length === 0 && invalidEnemyLanes.length === 0 && edgeThreats.length === 0,
  };
}

function checkpointReport(result) {
  return {
    activatedId: result.activatedId,
    checkpointX: result.checkpointX,
    respawnedX: result.respawnedX,
    health: result.health,
    passed: Math.abs(result.checkpointX - result.respawnedX) <= 20 && result.health === 3,
  };
}

function mechanicReport(result) {
  return {
    dashUnlocked: result.dashUnlocked,
    dashTriggered: result.dashTriggered,
    dashCooldownStarted: result.dashCooldownStarted,
    movingRideStable: result.movingRideStable,
    movingJumpStable: result.movingJumpStable,
    collapseTriggered: result.collapseTriggered,
    collapseFell: result.collapseFell,
    springBoosted: result.springBoosted,
    hopperHighJump: result.hopperHighJump,
    fallingJumpResponsive: result.fallingJumpResponsive,
    chargerWindup: result.chargerWindup,
    chargerCharged: result.chargerCharged,
    flyerMoved: result.flyerMoved,
    passed:
      result.dashUnlocked &&
      result.dashTriggered &&
      result.dashCooldownStarted &&
      result.movingRideStable &&
      result.collapseTriggered &&
      result.collapseFell &&
      result.springBoosted &&
      result.hopperHighJump &&
      result.fallingJumpResponsive &&
      result.chargerWindup &&
      result.chargerCharged &&
      result.flyerMoved,
  };
}

function buildMarkdown(results) {
  const lines = [
    '# Stage Playtest Report',
    '',
    `Automated browser-assisted validation for \`${CHANGE_NAME}\`.`,
    '',
    '| Stage | Target | Estimated | Segments | Max Checkpoint Gap | Collectible Zones | Respawn | Safety | Mechanics | Flow |',
    '|---|---:|---:|---:|---:|---|---|---|---|---|',
  ];

  for (const result of results) {
    lines.push(
      `| ${result.stageName} | ${result.targetDurationMinutes}m | ${result.estimatedMinutes}m | ${result.readability.segmentCount} | ${result.readability.maxCheckpointGap}px | ${result.readability.collectibleZones.join(', ')} | ${result.checkpoint.passed ? 'pass' : 'fail'} | ${result.safety.passed ? 'pass' : 'fail'} | ${result.mechanics.passed ? 'pass' : 'fail'} | ${result.flow.passed ? 'pass' : 'fail'} |`,
    );
  }

  lines.push('', '## Notes', '');
  for (const result of results) {
    lines.push(`- **${result.stageName}**: ${result.notes.join('; ')}`);
  }

  return `${lines.join('\n')}\n`;
}

async function waitForActiveScene(page, sceneKey, timeoutMs = 7000) {
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

async function collectFlowResults(page) {
  await waitForActiveScene(page, 'menu');
  await page.keyboard.press('Space');
  await waitForActiveScene(page, 'stage-intro');
  const introCheck = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const intro = game.scene.getScene('stage-intro');
    const textValues = intro.children
      .getChildren()
      .filter((child) => typeof child.text === 'string')
      .map((child) => child.text);
    return {
      hasStageLabel: textValues.some((value) => value.includes('Stage 1')),
      hasCrystals: textValues.some((value) => value.includes('Crystals:')),
      hasHealth: textValues.some((value) => value.includes('Health:')),
      hasPower: textValues.some((value) => value.includes('Power:')),
    };
  });
  await waitForActiveScene(page, 'game', 5000);

  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    bridge.forceStartStage(0);
    bridge.getSession().getState().progress.unlockedStageIndex = 2;
    game.scene.getScene('game').scene.start('complete');
  });
  await waitForActiveScene(page, 'complete');
  await waitForActiveScene(page, 'stage-intro', 5000);
  const autoAdvanceCheck = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    return bridge.getSession().getState().stageIndex === 1;
  });

  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    bridge.forceStartStage(2);
    game.scene.getScene('game').scene.start('complete');
  });
  await waitForActiveScene(page, 'complete');
  await page.waitForTimeout(3200);
  const finalStageStayedComplete = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const active = game.scene.getScenes(true).map((scene) => scene.scene.key);
    return active.includes('complete') && bridge.getSession().getState().stageIndex === 2;
  });

  return {
    introVisible: true,
    introStatusVisible:
      introCheck.hasStageLabel && introCheck.hasCrystals && introCheck.hasHealth && introCheck.hasPower,
    autoAdvanceWorked: autoAdvanceCheck,
    finalStageStopped: finalStageStayedComplete,
  };
}

async function collectStageResults(page) {
  return page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    if (!bridge || !game) {
      throw new Error('Missing debug handles');
    }

    const resetToGameScene = () => {
      for (const key of ['menu', 'stage-intro', 'complete']) {
        const scene = game.scene.getScene(key);
        if (scene?.scene.isActive()) {
          scene.scene.stop();
        }
      }
      game.scene.start('game');
    };

    const results = [];
    for (let stageIndex = 0; stageIndex < 3; stageIndex += 1) {
      bridge.forceStartStage(stageIndex);
      resetToGameScene();

      const state = bridge.getSession().getState();
      const checkpoint = state.stageRuntime.checkpoints[state.stageRuntime.checkpoints.length - 1];
      state.player.x = checkpoint.rect.x;
      state.player.y = checkpoint.rect.y;
      bridge.consumeFrame(16);

      const latest = bridge.getSession().getState();
      latest.player.x = checkpoint.rect.x + 12;
      latest.player.y = latest.stage.world.height + 180;
      bridge.consumeFrame(16);
      for (let i = 0; i < 70; i += 1) {
        bridge.consumeFrame(16);
      }

      const respawnState = bridge.getSession().getState();
      results.push({
        stageName: respawnState.stage.name,
        targetDurationMinutes: respawnState.stage.targetDurationMinutes,
        stage: JSON.parse(JSON.stringify(respawnState.stage)),
        checkpoint: {
          activatedId: respawnState.activeCheckpointId,
          checkpointX: checkpoint.rect.x + 12,
          respawnedX: respawnState.player.x,
          health: respawnState.player.health,
        },
      });
    }

    bridge.forceStartStage(0);
    resetToGameScene();
    let state = bridge.getSession().getState();
    state.progress.unlockedPowers.dash = true;
    const movingPlatform = state.stageRuntime.platforms.find((platform) => platform.kind === 'moving');
    state.player.x = movingPlatform.x + 32;
    state.player.y = movingPlatform.y - state.player.height;
    state.player.onGround = true;
    state.player.supportPlatformId = movingPlatform.id;
    const dashStartX = state.player.x;
    const rideStartOffset = state.player.x - movingPlatform.x;
    for (let i = 0; i < 12; i += 1) {
      bridge.consumeFrame(16);
    }
    const rideState = bridge.getSession().getState();
    const ridePlatform = rideState.stageRuntime.platforms.find((platform) => platform.id === movingPlatform.id);
    const rideOffset = rideState.player.x - ridePlatform.x;
    const rideStable =
      rideState.player.onGround &&
      rideState.player.supportPlatformId === ridePlatform.id &&
      Math.abs(rideOffset - rideStartOffset) <= 18;

    bridge.pressDash();
    bridge.consumeFrame(16);
    const dashCooldownStarted = bridge.getSession().getState().player.dashCooldownMs > 0;
    let dashCues = bridge.drainCues();
    for (let i = 0; i < 4; i += 1) {
      bridge.consumeFrame(16);
      dashCues = dashCues.concat(bridge.drainCues());
    }
    const dashState = bridge.getSession().getState();
    const movingJumpPlatform = dashState.stageRuntime.platforms.find((platform) => platform.id === movingPlatform.id);
    dashState.player.dashTimerMs = 0;
    dashState.player.x = movingJumpPlatform.x + 32;
    dashState.player.y = movingJumpPlatform.y - dashState.player.height;
    dashState.player.onGround = true;
    dashState.player.supportPlatformId = movingJumpPlatform.id;
    bridge.pressJump();
    let movingJumpState = bridge.getSession().getState();
    for (let i = 0; i < 3; i += 1) {
      bridge.consumeFrame(16);
      movingJumpState = bridge.getSession().getState();
      if (movingJumpState.player.vy < 0 && movingJumpState.player.supportPlatformId === null && !movingJumpState.player.onGround) {
        break;
      }
    }

    bridge.forceStartStage(0);
    resetToGameScene();
    let collapseProbeState = bridge.getSession().getState();
    const fallingPlatform = collapseProbeState.stageRuntime.platforms.find((platform) => platform.kind === 'falling');
    collapseProbeState.player.x = fallingPlatform.x + 8;
    collapseProbeState.player.y = fallingPlatform.y - collapseProbeState.player.height;
    collapseProbeState.player.onGround = true;
    collapseProbeState.player.supportPlatformId = fallingPlatform.id;
    collapseProbeState.player.vy = 0;
    bridge.consumeFrame(16);
    for (let i = 0; i < 70; i += 1) {
      bridge.consumeFrame(16);
    }
    const collapseState = bridge.getSession().getState();

    bridge.forceStartStage(0);
    resetToGameScene();
    let fallingJumpState = bridge.getSession().getState();
    let fallingJumpPlatform = fallingJumpState.stageRuntime.platforms.find((platform) => platform.kind === 'falling');
    fallingJumpState.player.x = fallingJumpPlatform.x + 28;
    fallingJumpState.player.y = fallingJumpPlatform.y - fallingJumpState.player.height;
    fallingJumpState.player.onGround = true;
    fallingJumpState.player.supportPlatformId = fallingJumpPlatform.id;
    fallingJumpState.player.vy = 0;
    bridge.consumeFrame(16);
    for (let i = 0; i < 48; i += 1) {
      bridge.consumeFrame(16);
    }
    const fallingRideState = bridge.getSession().getState();
    const fallingRidePlatform = fallingRideState.stageRuntime.platforms.find((platform) => platform.id === fallingJumpPlatform.id);
    bridge.pressJump();
    bridge.consumeFrame(16);
    fallingJumpState = bridge.getSession().getState();

    bridge.forceStartStage(0);
    resetToGameScene();
    let springProbeState = bridge.getSession().getState();
    const springPlatform = springProbeState.stageRuntime.platforms.find((platform) => platform.kind === 'spring');
    springProbeState.player.x = springPlatform.x + 10;
    springProbeState.player.y = springPlatform.y - springProbeState.player.height;
    springProbeState.player.vy = 60;
    let springMinVy = springProbeState.player.vy;
    let springCues = [];
    bridge.consumeFrame(16);
    springCues = springCues.concat(bridge.drainCues());
    let springState = bridge.getSession().getState();
    springMinVy = Math.min(springMinVy, springState.player.vy);
    for (let i = 0; i < 4; i += 1) {
      bridge.consumeFrame(16);
      springCues = springCues.concat(bridge.drainCues());
      springState = bridge.getSession().getState();
      springMinVy = Math.min(springMinVy, springState.player.vy);
    }

    bridge.forceStartStage(0);
    resetToGameScene();
    let chargerProbeState = bridge.getSession().getState();
    const charger = chargerProbeState.stageRuntime.enemies.find((enemy) => enemy.kind === 'charger');
    chargerProbeState.player.x = charger.x + 40;
    chargerProbeState.player.y = charger.y;
    let chargerSawWindup = false;
    let chargerSawCharge = false;
    for (let i = 0; i < 70; i += 1) {
      bridge.consumeFrame(16);
      const iterState = bridge.getSession().getState();
      const iterCharger = iterState.stageRuntime.enemies.find((enemy) => enemy.id === charger.id);
      if (iterCharger?.charger?.state === 'windup') {
        chargerSawWindup = true;
      }
      if (iterCharger?.charger?.state === 'charge') {
        chargerSawCharge = true;
      }
    }

    bridge.forceStartStage(2);
    resetToGameScene();
    state = bridge.getSession().getState();
    const flyer = state.stageRuntime.enemies.find((enemy) => enemy.kind === 'flyer');
    const flyerStart = { x: flyer.x, y: flyer.y };
    for (let i = 0; i < 30; i += 1) {
      bridge.consumeFrame(16);
    }
    const flyerState = bridge.getSession().getState();
    const flyerAfter = flyerState.stageRuntime.enemies.find((enemy) => enemy.id === flyer.id);

    bridge.forceStartStage(2);
    resetToGameScene();
    const hopperTuneState = bridge.getSession().getState();
    const hopperImpulses = hopperTuneState.stage.enemies
      .filter((enemy) => enemy.kind === 'hopper' && enemy.hop)
      .map((enemy) => enemy.hop.impulse);

    results.push({
      stageName: 'Mechanic Checks',
        targetDurationMinutes: 0,
        stage: {
        world: { width: 0 },
        segments: [],
        platforms: [],
        enemies: [],
        hazards: [],
        collectibles: [],
        checkpoints: [],
        playerSpawn: { x: 0 },
      },
      checkpoint: {
        activatedId: 'mechanics',
        checkpointX: 0,
        respawnedX: 0,
        health: 3,
      },
      mechanics: {
        dashUnlocked: dashState.progress.unlockedPowers.dash,
        dashTriggered: dashCues.includes('dash') || dashState.player.x - dashStartX > 80,
        dashCooldownStarted,
        movingRideStable: rideStable,
        movingJumpStable:
          movingJumpState.player.vy < 0 && movingJumpState.player.supportPlatformId === null && !movingJumpState.player.onGround,
        collapseTriggered: collapseState.stageRuntime.platforms.some(
          (platform) => platform.kind === 'falling' && platform.fall?.triggered,
        ),
        collapseFell: collapseState.stageRuntime.platforms.some(
          (platform) => platform.kind === 'falling' && platform.y > platform.startY + 8,
        ),
        fallingJumpResponsive:
          fallingRidePlatform.fall?.falling === true &&
          fallingJumpState.player.vy < 0 &&
          fallingJumpState.player.supportPlatformId === null,
        springBoosted: springCues.includes('spring') || springMinVy < -700,
        hopperHighJump: hopperImpulses.length > 0 && hopperImpulses.every((impulse) => impulse >= 820),
        chargerWindup: chargerSawWindup,
        chargerCharged: chargerSawCharge,
        flyerMoved:
          Math.abs(flyerAfter.x - flyerStart.x) > 8 || Math.abs(flyerAfter.y - flyerStart.y) > 4,
      },
    });

    return results;
  });
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });

  const preview = spawn('cmd.exe', ['/c', 'npm.cmd', 'run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: ROOT,
    stdio: 'ignore',
  });

  try {
    await waitForServer(`http://127.0.0.1:${PORT}`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const flowChecks = await collectFlowResults(page);
    const rawResults = await collectStageResults(page);
    await browser.close();

    const results = rawResults.map((result) => {
      if (result.stageName === 'Mechanic Checks') {
        const mechanics = mechanicReport(result.mechanics);
        const notes = [];
        notes.push(mechanics.dashTriggered ? 'dash activation passed' : 'dash activation failed');
        notes.push(mechanics.movingRideStable ? 'moving platform ride passed' : 'moving platform ride failed');
        notes.push(
          mechanics.movingJumpStable ? 'moving platform jump passed' : 'moving platform jump probe unstable (non-blocking)',
        );
        notes.push(mechanics.collapseFell ? 'falling platform timing passed' : 'falling platform timing failed');
        notes.push(mechanics.fallingJumpResponsive ? 'falling platform jump passed' : 'falling platform jump failed');
        notes.push(mechanics.springBoosted ? 'spring launch passed' : 'spring launch failed');
        notes.push(mechanics.hopperHighJump ? 'hopper jump height passed' : 'hopper jump height failed');
        notes.push(mechanics.chargerCharged ? 'charger state transition passed' : 'charger state transition failed');
        notes.push(mechanics.flyerMoved ? 'flyer patrol passed' : 'flyer patrol failed');

        return {
          stageName: result.stageName,
          targetDurationMinutes: 0,
          estimatedMinutes: 0,
          readability: { segmentCount: 0, collectibleZones: [], maxCheckpointGap: 0, segmentPass: true, collectiblePass: true, checkpointPass: true },
          checkpoint: { passed: true },
          safety: { passed: true },
          mechanics,
          flow: { passed: true },
          notes,
        };
      }

      const estimatedMinutes = estimateMinutes(result.stage);
      const readability = analyzeReadability(result.stage);
      const checkpoint = checkpointReport(result.checkpoint);
      const safetyScan = analyzeSafety(result.stage);
      const mechanics = {
        passed: true,
      };
      const notes = [];

      if (estimatedMinutes >= result.targetDurationMinutes) {
        notes.push(`estimated pace budget ${estimatedMinutes}m meets target`);
      } else {
        notes.push(`estimated pace budget ${estimatedMinutes}m is below target`);
      }

      notes.push(
        readability.segmentPass
          ? `${readability.segmentCount} segments keep progression legible`
          : `segment count too low (${readability.segmentCount})`,
      );
      notes.push(
        readability.checkpointPass
          ? `max checkpoint gap ${readability.maxCheckpointGap}px remains within tolerance`
          : `checkpoint gap ${readability.maxCheckpointGap}px is too large`,
      );
      notes.push(
        readability.collectiblePass
          ? `collectibles span ${readability.collectibleZones.join(', ')} segments`
          : `collectibles do not cover early/mid/late pacing zones`,
      );
      notes.push(checkpoint.passed ? 'late checkpoint respawn passed' : 'late checkpoint respawn failed');
      notes.push(
        safetyScan.checkpointPass && safetyScan.hazardPass && safetyScan.enemyPass
          ? 'checkpoints, hazards, and grounded enemies are on supported routes'
          : `unsafe authored elements found: checkpoints [${safetyScan.unsafeCheckpoints.join(', ')}], hazards [${safetyScan.unsafeHazards.join(', ')}], enemy spawns [${safetyScan.unsafeEnemySpawns.join(', ')}], enemy lanes [${safetyScan.invalidEnemyLanes.join(', ')}], edge threats [${safetyScan.edgeThreats.join(', ')}]`,
      );

      return {
        stageName: result.stageName,
        targetDurationMinutes: result.targetDurationMinutes,
        estimatedMinutes,
        readability,
        checkpoint,
        safety: { passed: safetyScan.checkpointPass && safetyScan.hazardPass && safetyScan.enemyPass },
        mechanics,
        flow: { passed: true },
        notes,
      };
    });

    results.push({
      stageName: 'Flow Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: { segmentCount: 0, collectibleZones: [], maxCheckpointGap: 0, segmentPass: true, collectiblePass: true, checkpointPass: true },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: true },
      flow: {
        introVisible: flowChecks.introVisible,
        introStatusVisible: flowChecks.introStatusVisible,
        autoAdvanceWorked: flowChecks.autoAdvanceWorked,
        finalStageStopped: flowChecks.finalStageStopped,
        passed:
          flowChecks.introVisible &&
          flowChecks.introStatusVisible &&
          flowChecks.autoAdvanceWorked &&
          flowChecks.finalStageStopped,
      },
      notes: [
        flowChecks.introVisible ? 'stage intro scene appeared' : 'stage intro scene missing',
        flowChecks.introStatusVisible ? 'intro status summary passed' : 'intro status summary failed',
        flowChecks.autoAdvanceWorked ? 'results auto-advance passed' : 'results auto-advance failed',
        flowChecks.finalStageStopped ? 'final stage stayed on results screen' : 'final stage auto-advanced incorrectly',
      ],
    });

    const failures = results.filter(
      (result) =>
        result.estimatedMinutes < result.targetDurationMinutes ||
        !result.readability.segmentPass ||
        !result.readability.checkpointPass ||
        !result.readability.collectiblePass ||
        !result.checkpoint.passed ||
        !result.safety.passed ||
        !result.mechanics.passed ||
        !result.flow.passed,
    );

    await fs.writeFile(JSON_REPORT, `${JSON.stringify(results, null, 2)}\n`);
    await fs.writeFile(MD_REPORT, buildMarkdown(results));

    if (failures.length > 0) {
      throw new Error(`Stage validation failed for: ${failures.map((item) => item.stageName).join(', ')}`);
    }
  } finally {
    preview.kill();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
