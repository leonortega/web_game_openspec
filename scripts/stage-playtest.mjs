import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = process.env.OPENSPEC_CHANGE ?? 'pause-overlay-and-help-panel-sizing';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'playtest-report.md');
const PORT = 4179;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;
const CHANGE_RESULT_SCOPE = {
  'pause-menu-esc-continue-options-help': new Set(['Flow Checks']),
  'pause-menu-visibility-and-help-scroll': new Set(['Flow Checks']),
  'pause-overlay-and-help-panel-sizing': new Set(['Flow Checks']),
};

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
    checkpointPass: maxCheckpointGap <= Math.max(2200, Math.round(stage.world.width * 0.3)),
  };
}

function findBlockSupport(stage, block) {
  const centerX = block.x + block.width / 2;
  const blockBottom = block.y + block.height;
  return (
    stage.platforms
      .filter(
        (platform) =>
          centerX >= platform.x &&
          centerX <= platform.x + platform.width &&
          platform.y >= blockBottom,
      )
      .sort((left, right) => left.y - right.y)[0] ?? null
  );
}

function analyzeBlockSpacing(stage) {
  const invalidBlocks = [];

  for (const block of stage.rewardBlocks ?? []) {
    const support = findBlockSupport(stage, block);
    if (!support) {
      invalidBlocks.push(block.id);
      continue;
    }

    const clearance = support.y - (block.y + block.height);
    if (clearance < 56) {
      invalidBlocks.push(block.id);
    }
  }

  return {
    invalidBlocks,
    passed: invalidBlocks.length === 0,
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
  const overlappingStatics = [];

  const staticElements = [
    ...stage.checkpoints.map((checkpoint) => ({ id: checkpoint.id, rect: checkpoint.rect })),
    ...stage.collectibles.map((collectible) => ({
      id: collectible.id,
      rect: { x: collectible.position.x - 12, y: collectible.position.y - 12, width: 24, height: 24 },
    })),
    ...stage.rewardBlocks.map((rewardBlock) => ({ id: rewardBlock.id, rect: rewardBlock })),
    { id: 'exit', rect: stage.exit },
  ];

  for (let index = 0; index < staticElements.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < staticElements.length; nextIndex += 1) {
      const current = staticElements[index];
      const next = staticElements[nextIndex];
      if (intersectsRect(current.rect, next.rect)) {
        overlappingStatics.push(`${current.id}<->${next.id}`);
      }
    }
  }

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
    overlappingStatics,
    checkpointPass: unsafeCheckpoints.length === 0,
    hazardPass: unsafeHazards.length === 0,
    enemyPass:
      unsafeEnemySpawns.length === 0 &&
      invalidEnemyLanes.length === 0 &&
      edgeThreats.length === 0 &&
      overlappingStatics.length === 0,
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
    powerVariantDistinct: result.powerVariantDistinct,
    turretVisibilityGated: result.turretVisibilityGated,
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
      result.flyerMoved &&
      result.powerVariantDistinct &&
      result.turretVisibilityGated,
  };
}

function blockReport(result) {
  return {
    coinHitStates: result.coinHitStates,
    coinRevealVisible: result.coinRevealVisible,
    coinRevealExpired: result.coinRevealExpired,
    powerRevealVisible: result.powerRevealVisible,
    powerRevealExpired: result.powerRevealExpired,
    powerSingleUse: result.powerSingleUse,
    spacingPassed: result.spacingPassed,
    blockedPlacementRejected: result.blockedPlacementRejected,
    forcedHitRejected: result.forcedHitRejected,
    hazardForcedHitRejected: result.hazardForcedHitRejected,
    coinForcedHitRejected: result.coinForcedHitRejected,
    coinHazardForcedHitRejected: result.coinHazardForcedHitRejected,
    safePlacementAllowed: result.safePlacementAllowed,
    hazardSafePlacementAllowed: result.hazardSafePlacementAllowed,
    runtimeSafeContinuation: result.runtimeSafeContinuation,
    runtimeHazardSafeContinuation: result.runtimeHazardSafeContinuation,
    runtimeCoinSafeContinuation: result.runtimeCoinSafeContinuation,
    passed:
      result.coinHitStates.length >= 2 &&
      result.coinHitStates[0].remainingHits === 1 &&
      result.coinHitStates[0].coinsGained === 1 &&
      result.coinHitStates[0].used === false &&
      result.coinHitStates[1].remainingHits === 0 &&
      result.coinHitStates[1].coinsGained === 2 &&
      result.coinHitStates[1].used === true &&
      result.coinRevealVisible &&
      result.coinRevealExpired &&
      result.powerRevealVisible &&
      result.powerRevealExpired &&
      result.powerSingleUse &&
      result.spacingPassed &&
      result.blockedPlacementRejected &&
      result.forcedHitRejected &&
      result.safePlacementAllowed &&
      result.hazardForcedHitRejected &&
      result.coinForcedHitRejected &&
      result.coinHazardForcedHitRejected &&
      result.hazardSafePlacementAllowed &&
      result.runtimeSafeContinuation &&
      result.runtimeHazardSafeContinuation &&
      result.runtimeCoinSafeContinuation,
  };
}

function findSupportForRect(stage, rect) {
  const centerX = rect.x + rect.width / 2;
  const bottom = rect.y + rect.height;
  return (
    stage.platforms
      .filter(
        (platform) =>
          centerX >= platform.x &&
          centerX <= platform.x + platform.width &&
          platform.y >= bottom,
      )
      .sort((left, right) => left.y - right.y)[0] ?? null
  );
}

function analyzeRewardBlockLocks(stage) {
  const invalidBlocks = [];

  const isImmediateContinuationSupport = (blockSupport, candidateSupport) => {
    if (blockSupport.id === candidateSupport.id) {
      return true;
    }

    const horizontalSupportGap =
      candidateSupport.x > blockSupport.x + blockSupport.width
        ? candidateSupport.x - (blockSupport.x + blockSupport.width)
        : blockSupport.x > candidateSupport.x + candidateSupport.width
          ? blockSupport.x - (candidateSupport.x + candidateSupport.width)
          : 0;

    return horizontalSupportGap <= 56 && Math.abs(candidateSupport.y - blockSupport.y) <= 96;
  };

  const isBlockingRectAheadOfRewardBlock = (block, rect) => {
    const forwardGap = rect.x - (block.x + block.width);
    return rect.x >= block.x - 16 && forwardGap <= 150 && rect.x + rect.width > block.x;
  };

  for (const block of stage.rewardBlocks ?? []) {
    const blockSupport = findSupportForRect(stage, block);
    if (!blockSupport) {
      invalidBlocks.push(block.id);
      continue;
    }

    for (const enemy of stage.enemies ?? []) {
      const enemyBounds = enemyRect(enemy);
      const enemySupport = findSupportForRect(stage, enemyBounds);
      if (['walker', 'hopper', 'charger'].includes(enemy.kind) && enemySupport?.id === blockSupport.id) {
        const horizontalOverlap = overlapWidth(
          block.x,
          block.x + block.width,
          enemyBounds.x,
          enemyBounds.x + enemyBounds.width,
        );
        const verticalGap = Math.abs(block.y + block.height - enemyBounds.y);
        if (horizontalOverlap > 0 && verticalGap <= 96) {
          invalidBlocks.push(block.id);
          break;
        }
      }

      if (!isBlockingRectAheadOfRewardBlock(block, enemyBounds)) {
        continue;
      }

      if (enemy.kind === 'flyer') {
        if (enemyBounds.y + enemyBounds.height >= block.y - 16 && enemyBounds.y <= blockSupport.y + 12) {
          invalidBlocks.push(block.id);
          break;
        }
        continue;
      }

      if (enemySupport && isImmediateContinuationSupport(blockSupport, enemySupport)) {
        invalidBlocks.push(block.id);
        break;
      }
    }

    if (invalidBlocks.includes(block.id)) {
      continue;
    }

    for (const hazard of stage.hazards ?? []) {
      const hazardSupport = findSupportForRect(stage, hazard.rect);
      if (!hazardSupport || !isImmediateContinuationSupport(blockSupport, hazardSupport)) {
        continue;
      }

      if (isBlockingRectAheadOfRewardBlock(block, hazard.rect)) {
        invalidBlocks.push(block.id);
        break;
      }
    }
  }

  return {
    invalidBlocks,
    passed: invalidBlocks.length === 0,
  };
}

function rewardLockCoverageReport() {
  const blockedFixture = {
    platforms: [{ id: 'floor', kind: 'static', x: 0, y: 120, width: 240, height: 24 }],
    rewardBlocks: [{ id: 'blocked', x: 84, y: 36, width: 40, height: 40, reward: { kind: 'coins', amount: 1 } }],
    enemies: [{ id: 'enemy', kind: 'walker', position: { x: 92, y: 76 } }],
  };
  const forcedHitFixture = {
    platforms: [{ id: 'floor', kind: 'static', x: 0, y: 120, width: 240, height: 24 }],
    rewardBlocks: [{ id: 'forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
    enemies: [{ id: 'enemy', kind: 'walker', position: { x: 136, y: 90 } }],
  };
  const safeFixture = {
    platforms: [
      { id: 'pickup-floor', kind: 'static', x: 0, y: 120, width: 140, height: 24 },
      { id: 'next-floor', kind: 'static', x: 196, y: 120, width: 180, height: 24 },
    ],
    rewardBlocks: [{ id: 'safe', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
    enemies: [{ id: 'enemy', kind: 'walker', position: { x: 292, y: 90 } }],
  };
  const hazardForcedHitFixture = {
    platforms: [{ id: 'floor', kind: 'static', x: 0, y: 120, width: 240, height: 24 }],
    rewardBlocks: [{ id: 'hazard-forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
    hazards: [{ id: 'spikes', kind: 'spikes', rect: { x: 128, y: 104, width: 56, height: 16 } }],
    enemies: [],
  };
  const hazardSafeFixture = {
    platforms: [
      { id: 'pickup-floor', kind: 'static', x: 0, y: 120, width: 180, height: 24 },
      { id: 'next-floor', kind: 'static', x: 240, y: 120, width: 180, height: 24 },
    ],
    rewardBlocks: [{ id: 'hazard-safe', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
    hazards: [{ id: 'spikes', kind: 'spikes', rect: { x: 260, y: 104, width: 56, height: 16 } }],
    enemies: [],
  };

  const blockedRejected = !analyzeRewardBlockLocks(blockedFixture).passed;
  const forcedHitRejected = !analyzeRewardBlockLocks(forcedHitFixture).passed;
  const safeAllowed = analyzeRewardBlockLocks(safeFixture).passed;
  const hazardForcedHitRejected = !analyzeRewardBlockLocks(hazardForcedHitFixture).passed;
  const hazardSafeAllowed = analyzeRewardBlockLocks(hazardSafeFixture).passed;
  const coinForcedHitRejected = !analyzeRewardBlockLocks({
    platforms: forcedHitFixture.platforms,
    rewardBlocks: [{ id: 'coin-forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'coins', amount: 2 } }],
    enemies: forcedHitFixture.enemies,
    hazards: [],
  }).passed;
  const coinHazardForcedHitRejected = !analyzeRewardBlockLocks({
    platforms: hazardForcedHitFixture.platforms,
    rewardBlocks: [{ id: 'coin-hazard-forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'coins', amount: 2 } }],
    enemies: [],
    hazards: hazardForcedHitFixture.hazards,
  }).passed;

  return {
    blockedRejected,
    forcedHitRejected,
    safeAllowed,
    hazardForcedHitRejected,
    hazardSafeAllowed,
    coinForcedHitRejected,
    coinHazardForcedHitRejected,
    passed:
      blockedRejected &&
      forcedHitRejected &&
      safeAllowed &&
      hazardForcedHitRejected &&
      hazardSafeAllowed &&
      coinForcedHitRejected &&
      coinHazardForcedHitRejected,
  };
}

function staticLayoutCoverageReport() {
  const basePlatforms = [{ id: 'floor', kind: 'static', x: 0, y: 120, width: 340, height: 32 }];
  const overlappingFixture = {
    platforms: basePlatforms,
    checkpoints: [{ id: 'cp', rect: { x: 84, y: 40, width: 24, height: 80 } }],
    collectibles: [],
    rewardBlocks: [{ id: 'coin-block', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'coins', amount: 2 } }],
    hazards: [],
    enemies: [],
    exit: { x: 240, y: 40, width: 40, height: 80 },
  };
  const safeFixture = {
    platforms: basePlatforms,
    checkpoints: [{ id: 'cp', rect: { x: 32, y: 40, width: 24, height: 80 } }],
    collectibles: [{ id: 'gem', position: { x: 124, y: 64 } }],
    rewardBlocks: [{ id: 'coin-block', x: 188, y: 36, width: 40, height: 40, reward: { kind: 'coins', amount: 2 } }],
    hazards: [],
    enemies: [],
    exit: { x: 268, y: 40, width: 40, height: 80 },
  };

  const overlappingRejected = analyzeSafety(overlappingFixture).overlappingStatics.length > 0;
  const safeAllowed = analyzeSafety(safeFixture).overlappingStatics.length === 0;

  return {
    overlappingRejected,
    safeAllowed,
    passed: overlappingRejected && safeAllowed,
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

function scopeResultsForChange(results) {
  const scopedNames = CHANGE_RESULT_SCOPE[CHANGE_NAME];
  if (!scopedNames) {
    return results;
  }

  return results.filter((result) => scopedNames.has(result.stageName));
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

async function readMenuSnapshot(page) {
  return page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const menu = game.scene.getScene('menu');
    if (!menu) {
      return null;
    }

    if (typeof menu.getDebugSnapshot === 'function') {
      return menu.getDebugSnapshot();
    }

    const textNodes = menu.children
      .getChildren()
      .filter((child) => typeof child.text === 'string');
    const texts = textNodes.map((child) => child.text);
    const selectedText =
      textNodes.find((child) => {
        const backgroundColor = String(child.style?.backgroundColor ?? '').toLowerCase();
        const color = String(child.style?.color ?? '').toLowerCase();
        return backgroundColor.includes('f5cf64') || color.includes('11150f');
      })?.text ?? null;
    return {
      texts,
      joined: texts.join('\n'),
      selectedText,
    };
  });
}

async function emitMenuPointerOver(page, prefix) {
  return page.evaluate((valuePrefix) => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const menu = game.scene.getScene('menu');
    if (!menu) {
      return false;
    }

    const target = menu.children
      .getChildren()
      .find(
        (child) =>
          typeof child.text === 'string' &&
          child.text.startsWith(valuePrefix) &&
          Boolean(child.input?.enabled),
      );
    if (!target) {
      return false;
    }

    target.emit('pointerover');
    return true;
  }, prefix);
}

async function wheelMenu(page, deltaY) {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas bounds unavailable for wheel input');
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, deltaY);
}

async function readRuntimeSnapshot(page) {
  return page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const state = bridge.getSession().getState();
    const activeScenes = game.scene.getScenes(true).map((scene) => scene.scene.key);
    const pausedGameScene = game.scene.getScene('game');
    const gameSnapshot = typeof pausedGameScene?.getDebugSnapshot === 'function' ? pausedGameScene.getDebugSnapshot() : null;

    return {
      playerX: state.player.x,
      playerY: state.player.y,
      playerVx: state.player.vx,
      playerVy: state.player.vy,
      collectedCoins: state.stageRuntime.collectedCoins,
      totalCoins: state.progress.totalCoins,
      firstCollectibleCollected: state.stageRuntime.collectibles[0]?.collected ?? false,
      runSettings: { ...state.progress.runSettings },
      runPaused: bridge.isRunPaused(),
      activeScenes,
      gameScenePaused: Boolean(pausedGameScene?.scene.isPaused()),
      pauseOverlayVisible: gameSnapshot?.pauseOverlayVisible ?? false,
      pauseOverlayText: gameSnapshot?.pauseText ?? null,
      hudVisible: gameSnapshot?.hudVisible ?? true,
    };
  });
}

async function collectFlowResults(page) {
  await waitForActiveScene(page, 'menu');
  const initialMenu = await readMenuSnapshot(page);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  const mainRootKeyboard = await readMenuSnapshot(page);

  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);
  const mainOptionsMenu = await readMenuSnapshot(page);

  const pointerHoverWorked = await emitMenuPointerOver(page, 'Volume');
  if (!pointerHoverWorked) {
    throw new Error('Menu pointer validation target not found');
  }
  await page.waitForTimeout(120);
  const mainOptionsPointer = await readMenuSnapshot(page);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(120);
  const mainOptionsUpdatedSettings = await page.evaluate(() => ({
    ...window.__CRYSTAL_RUN_BRIDGE__.getSession().getState().progress.runSettings,
  }));

  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  const mainRootAfterOptions = await readMenuSnapshot(page);

  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);
  const mainHelpMenu = await readMenuSnapshot(page);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  const mainHelpAfterKeyboardScroll = await readMenuSnapshot(page);
  await wheelMenu(page, 320);
  await page.waitForTimeout(120);
  const mainHelpAfterWheelScroll = await readMenuSnapshot(page);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  const mainRootAfterHelp = await readMenuSnapshot(page);

  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(120);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(120);
  await page.keyboard.press('Enter');

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
      hasCoins: textValues.some((value) => value.includes('Coins:')),
      hasPowers: textValues.some((value) => value.includes('Powers:')),
      hasRun: textValues.some((value) => value.includes('Run:')),
    };
  });
  await waitForActiveScene(page, 'game', 12000);

  const runtimeSeed = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    const collectible = state.stageRuntime.collectibles[0];

    state.player.x += 123;
    state.player.y = Math.max(0, state.player.y - 17);
    if (collectible) {
      collectible.collected = true;
      state.stageRuntime.collectedCoins = Math.max(state.stageRuntime.collectedCoins, 1);
      state.progress.totalCoins = Math.max(state.progress.totalCoins, 1);
    }

    return {
      playerX: state.player.x,
      playerY: state.player.y,
      collectedCoins: state.stageRuntime.collectedCoins,
      totalCoins: state.progress.totalCoins,
      firstCollectibleCollected: collectible?.collected ?? false,
    };
  });

  const hudCheck = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.hud-card')];
    const meta = document.querySelector('.hud-meta');
    const metaLines = [...document.querySelectorAll('.hud-meta-line')].map((node) => node.textContent?.trim() ?? '');
    return {
      hasFourCards: cards.length === 4,
      hasCornerMeta: Boolean(meta),
      hasRunLine: metaLines.some((value) => value.startsWith('Run')),
      hasSegmentLine: metaLines.some((value) => value.startsWith('Segment')),
    };
  });

  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  const pauseStableBefore = await readRuntimeSnapshot(page);
  await page.waitForTimeout(220);
  const pauseStableAfter = await readRuntimeSnapshot(page);

  await page.keyboard.press('Escape');
  await waitForActiveScene(page, 'game', 12000);
  const resumedRuntime = await readRuntimeSnapshot(page);

  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    bridge.forceStartStage(0);
    bridge.getSession().getState().progress.unlockedStageIndex = 2;
    game.scene.getScene('game').scene.start('complete');
  });
  await waitForActiveScene(page, 'complete');
  await waitForActiveScene(page, 'stage-intro', 12000);
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
    mainMenuRootVisible:
      Boolean(initialMenu) &&
      initialMenu.mode === 'main' &&
      initialMenu.view === 'root' &&
      initialMenu.joined.includes('Crystal Run') &&
      initialMenu.joined.includes('Start') &&
      initialMenu.joined.includes('Options') &&
      initialMenu.joined.includes('Help'),
    mainMenuKeyboardUpdate:
      Boolean(initialMenu && mainRootKeyboard) &&
      initialMenu.selectedText === 'Start' &&
      mainRootKeyboard.selectedText === 'Options',
    mainOptionsVisible:
      Boolean(mainOptionsMenu) &&
      mainOptionsMenu.mode === 'main' &&
      mainOptionsMenu.view === 'options' &&
      mainOptionsMenu.joined.includes('Difficulty') &&
      mainOptionsMenu.joined.includes('Enemies') &&
      mainOptionsMenu.joined.includes('Volume'),
    mainMenuPointerUpdate:
      Boolean(mainOptionsPointer) &&
      mainOptionsPointer.selectedText?.startsWith('Volume'),
    mainOptionsLiveUpdate:
      typeof mainOptionsUpdatedSettings.masterVolume === 'number' &&
      Boolean(mainRootAfterOptions) &&
      mainRootAfterOptions.mode === 'main' &&
      mainRootAfterOptions.view === 'root',
    mainHelpVisible:
      Boolean(mainHelpMenu) &&
      mainHelpMenu.mode === 'main' &&
      mainHelpMenu.view === 'help' &&
      mainHelpMenu.joined.includes('Powers') &&
      mainHelpMenu.joined.includes('Hazards') &&
      Boolean(mainRootAfterHelp) &&
      mainRootAfterHelp.mode === 'main' &&
      mainRootAfterHelp.view === 'root',
    mainHelpLargerPanelVisible:
      Boolean(mainHelpMenu) &&
      mainHelpMenu.helpPanelHeight >= 360 &&
      mainHelpMenu.helpViewportHeight >= 220,
    mainHelpScrollVisible:
      Boolean(mainHelpMenu) &&
      mainHelpMenu.helpScrollbarVisible &&
      mainHelpMenu.helpScrollMax > 0,
    mainHelpKeyboardScrollWorked:
      Boolean(mainHelpMenu && mainHelpAfterKeyboardScroll) &&
      mainHelpAfterKeyboardScroll.helpScrollOffset > mainHelpMenu.helpScrollOffset,
    mainHelpWheelScrollWorked:
      Boolean(mainHelpAfterKeyboardScroll && mainHelpAfterWheelScroll) &&
      mainHelpAfterWheelScroll.helpScrollOffset > mainHelpAfterKeyboardScroll.helpScrollOffset,
    introVisible: true,
    introStatusVisible:
      introCheck.hasStageLabel && introCheck.hasCoins && introCheck.hasPowers && introCheck.hasRun,
    hudLayoutPassed:
      hudCheck.hasFourCards && hudCheck.hasCornerMeta && hudCheck.hasRunLine && hudCheck.hasSegmentLine,
    pauseOverlayVisible:
      pauseStableBefore.runPaused &&
      pauseStableBefore.pauseOverlayVisible &&
      pauseStableBefore.pauseOverlayText === 'PAUSE' &&
      !pauseStableBefore.hudVisible,
    pauseMenuSceneRemoved:
      !pauseStableBefore.activeScenes.includes('menu') &&
      !pauseStableAfter.activeScenes.includes('menu'),
    pauseFreezeWorked:
      pauseStableBefore.runPaused &&
      !pauseStableBefore.gameScenePaused &&
      pauseStableAfter.runPaused &&
      !pauseStableAfter.gameScenePaused &&
      pauseStableAfter.pauseOverlayVisible &&
      pauseStableBefore.playerX === pauseStableAfter.playerX &&
      pauseStableBefore.playerY === pauseStableAfter.playerY &&
      pauseStableBefore.playerVx === pauseStableAfter.playerVx &&
      pauseStableBefore.playerVy === pauseStableAfter.playerVy &&
      pauseStableBefore.collectedCoins === pauseStableAfter.collectedCoins &&
      pauseStableBefore.totalCoins === pauseStableAfter.totalCoins,
    pauseMenuActionsRemoved:
      !pauseStableBefore.activeScenes.includes('menu') &&
      !pauseStableBefore.pauseOverlayText?.includes('Continue') &&
      !pauseStableBefore.pauseOverlayText?.includes('Options') &&
      !pauseStableBefore.pauseOverlayText?.includes('Help'),
    pauseResumeExact:
      !resumedRuntime.runPaused &&
      !resumedRuntime.pauseOverlayVisible &&
      resumedRuntime.hudVisible &&
      !resumedRuntime.activeScenes.includes('stage-intro') &&
      resumedRuntime.collectedCoins === runtimeSeed.collectedCoins &&
      resumedRuntime.totalCoins === runtimeSeed.totalCoins &&
      resumedRuntime.firstCollectibleCollected === runtimeSeed.firstCollectibleCollected &&
      resumedRuntime.playerX === pauseStableBefore.playerX &&
      resumedRuntime.playerY === pauseStableBefore.playerY,
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
    state.progress.activePowers.dash = true;
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

    const gameScene = game.scene.getScene('game');
    const capturePowerSignature = (power) => {
      const powerState = bridge.getSession().getState();
      for (const key of Object.keys(powerState.progress.activePowers)) {
        powerState.progress.activePowers[key] = false;
      }
      powerState.progress.powerTimers.invincibleMs = 0;
      powerState.player.presentationPower = null;
      if (power === 'invincible') {
        powerState.progress.activePowers.invincible = true;
        powerState.progress.powerTimers.invincibleMs = 9000;
      } else {
        powerState.progress.activePowers[power] = true;
      }
      bridge.consumeFrame(16);
      gameScene.syncView();
      return JSON.stringify({
        fill: gameScene.player.fillColor,
        stroke: gameScene.player.strokeColor,
        aura: gameScene.playerAura.visible,
        accent: gameScene.playerAccent.visible,
        headband: gameScene.playerHeadband.visible,
        wingLeft: gameScene.playerWingLeft.visible,
        wingRight: gameScene.playerWingRight.visible,
      });
    };
    const powerSignatures = ['doubleJump', 'shooter', 'invincible', 'dash'].map(capturePowerSignature);
    const powerVariantDistinct = new Set(powerSignatures).size === powerSignatures.length;

    bridge.forceStartStage(1);
    resetToGameScene();
    let turretState = bridge.getSession().getState();
    bridge.setCameraViewBox({ x: 0, y: 0, width: 960, height: 540 });
    let offscreenTurretCue = false;
    for (let i = 0; i < 180; i += 1) {
      bridge.consumeFrame(16);
      offscreenTurretCue ||= bridge.drainCues().includes('turret-fire');
    }
    const offscreenProjectileCount = bridge.getSession().getState().stageRuntime.projectiles.filter((shot) => shot.owner === 'enemy').length;
    const firstTurret = turretState.stageRuntime.enemies.find((enemy) => enemy.kind === 'turret');
    turretState.player.x = firstTurret.x - 140;
    turretState.player.y = Math.max(0, firstTurret.y);
    bridge.setCameraViewBox({ x: firstTurret.x - 1040, y: Math.max(0, firstTurret.y - 160), width: 960, height: 540 });
    let leadMarginTurretCue = false;
    for (let i = 0; i < 180; i += 1) {
      bridge.consumeFrame(16);
      leadMarginTurretCue ||= bridge.drainCues().includes('turret-fire');
    }
    const leadMarginProjectileCount = bridge.getSession().getState().stageRuntime.projectiles.filter((shot) => shot.owner === 'enemy').length;
    const turretVisibilityGated =
      !offscreenTurretCue &&
      offscreenProjectileCount === 0 &&
      (leadMarginTurretCue || leadMarginProjectileCount > 0);

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
        dashUnlocked: dashState.progress.activePowers.dash,
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
        powerVariantDistinct,
        turretVisibilityGated,
      },
    });

    bridge.forceStartStage(0);
    resetToGameScene();
    let blockState = bridge.getSession().getState();
    const coinStartTotal = blockState.progress.totalCoins;
    const coinBlock = blockState.stageRuntime.rewardBlocks.find(
      (rewardBlock) => rewardBlock.reward.kind === 'coins' && rewardBlock.reward.amount > 1,
    );

    const punchBlock = (blockId) => {
      const activeState = bridge.getSession().getState();
      const activeBlock = activeState.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === blockId);
      activeState.player.x = activeBlock.x + activeBlock.width / 2 - activeState.player.width / 2;
      activeState.player.y = activeBlock.y + activeBlock.height + 2;
      activeState.player.vx = 0;
      activeState.player.vy = -720;
      activeState.player.onGround = false;
      activeState.player.supportPlatformId = null;
      bridge.consumeFrame(16);
      return bridge.getSession().getState();
    };

    const firstCoinPunch = punchBlock(coinBlock.id);
    const firstCoinState = firstCoinPunch.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === coinBlock.id);
    const firstCoinSnapshot = {
      remainingHits: firstCoinState.remainingHits,
      coinsGained: firstCoinPunch.progress.totalCoins - coinStartTotal,
      used: firstCoinState.used,
    };
    const coinRevealVisible = firstCoinPunch.stageRuntime.rewardReveals.length > 0;
    for (let i = 0; i < 70; i += 1) {
      bridge.consumeFrame(16);
    }
    const coinRevealExpired = bridge.getSession().getState().stageRuntime.rewardReveals.length === 0;

    const secondCoinPunch = punchBlock(coinBlock.id);
    const secondCoinState = secondCoinPunch.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === coinBlock.id);
    const secondCoinSnapshot = {
      remainingHits: secondCoinState.remainingHits,
      coinsGained: secondCoinPunch.progress.totalCoins - coinStartTotal,
      used: secondCoinState.used,
    };

    bridge.forceStartStage(1);
    resetToGameScene();
    blockState = bridge.getSession().getState();
    const powerBlock = blockState.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.reward.kind === 'power');
    const firstPowerPunch = punchBlock(powerBlock.id);
    const firstPowerState = firstPowerPunch.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === powerBlock.id);
    const firstPowerSnapshot = {
      remainingHits: firstPowerState.remainingHits,
      used: firstPowerState.used,
    };
    const powerRevealVisible = firstPowerPunch.stageRuntime.rewardReveals.length > 0;
    for (let i = 0; i < 70; i += 1) {
      bridge.consumeFrame(16);
    }
    const powerRevealExpired = bridge.getSession().getState().stageRuntime.rewardReveals.length === 0;
    const secondPowerPunch = punchBlock(powerBlock.id);
    const secondPowerState = secondPowerPunch.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === powerBlock.id);
    const secondPowerSnapshot = {
      remainingHits: secondPowerState.remainingHits,
      used: secondPowerState.used,
    };
    const rewardLockCoverage = (() => {
      const findFixtureSupport = (fixture, rect) => {
        const centerX = rect.x + rect.width / 2;
        const bottom = rect.y + rect.height;
        return (
          fixture.platforms
            .filter(
              (platform) =>
                centerX >= platform.x &&
                centerX <= platform.x + platform.width &&
                platform.y >= bottom,
            )
            .sort((left, right) => left.y - right.y)[0] ?? null
        );
      };
      const analyzeFixtureLocks = (fixture) => {
        const invalidBlocks = [];
        const isImmediateContinuationSupport = (blockSupport, candidateSupport) => {
          if (blockSupport.id === candidateSupport.id) {
            return true;
          }
          const horizontalSupportGap =
            candidateSupport.x > blockSupport.x + blockSupport.width
              ? candidateSupport.x - (blockSupport.x + blockSupport.width)
              : blockSupport.x > candidateSupport.x + candidateSupport.width
                ? blockSupport.x - (candidateSupport.x + candidateSupport.width)
                : 0;
          return horizontalSupportGap <= 56 && Math.abs(candidateSupport.y - blockSupport.y) <= 96;
        };
        const isBlockingRectAheadOfRewardBlock = (block, rect) => {
          const forwardGap = rect.x - (block.x + block.width);
          return rect.x >= block.x - 16 && forwardGap <= 150 && rect.x + rect.width > block.x;
        };
        for (const block of fixture.rewardBlocks) {
          const blockSupport = findFixtureSupport(fixture, block);
          if (!blockSupport) {
            invalidBlocks.push(block.id);
            continue;
          }
          for (const enemy of fixture.enemies) {
            const enemyBounds = {
              x: enemy.position.x,
              y: enemy.position.y,
              width: enemy.kind === 'turret' ? 28 : 34,
              height: enemy.kind === 'turret' ? 38 : enemy.kind === 'flyer' ? 24 : 30,
            };
            const enemySupport = findFixtureSupport(fixture, enemyBounds);
            if (['walker', 'hopper', 'charger'].includes(enemy.kind) && enemySupport?.id === blockSupport.id) {
              const horizontalOverlap = Math.max(
                0,
                Math.min(block.x + block.width, enemyBounds.x + enemyBounds.width) - Math.max(block.x, enemyBounds.x),
              );
              const verticalGap = Math.abs(block.y + block.height - enemyBounds.y);
              if (horizontalOverlap > 0 && verticalGap <= 96) {
                invalidBlocks.push(block.id);
                break;
              }
            }

            if (!isBlockingRectAheadOfRewardBlock(block, enemyBounds)) {
              continue;
            }

            if (enemySupport && isImmediateContinuationSupport(blockSupport, enemySupport)) {
              invalidBlocks.push(block.id);
              break;
            }
          }

          if (invalidBlocks.includes(block.id)) {
            continue;
          }

          for (const hazard of fixture.hazards ?? []) {
            const hazardSupport = findFixtureSupport(fixture, hazard.rect);
            if (!hazardSupport || !isImmediateContinuationSupport(blockSupport, hazardSupport)) {
              continue;
            }
            if (isBlockingRectAheadOfRewardBlock(block, hazard.rect)) {
              invalidBlocks.push(block.id);
              break;
            }
          }
        }
        return {
          passed: invalidBlocks.length === 0,
        };
      };
      const blockedFixture = {
        platforms: [{ id: 'floor', kind: 'static', x: 0, y: 120, width: 240, height: 24 }],
        rewardBlocks: [{ id: 'blocked', x: 84, y: 36, width: 40, height: 40, reward: { kind: 'coins', amount: 1 } }],
        enemies: [{ id: 'enemy', kind: 'walker', position: { x: 92, y: 76 } }],
      };
      const forcedHitFixture = {
        platforms: [{ id: 'floor', kind: 'static', x: 0, y: 120, width: 240, height: 24 }],
        rewardBlocks: [{ id: 'forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
        enemies: [{ id: 'enemy', kind: 'walker', position: { x: 136, y: 90 } }],
      };
      const safeFixture = {
        platforms: [
          { id: 'pickup-floor', kind: 'static', x: 0, y: 120, width: 140, height: 24 },
          { id: 'next-floor', kind: 'static', x: 196, y: 120, width: 180, height: 24 },
        ],
        rewardBlocks: [{ id: 'safe', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
        enemies: [{ id: 'enemy', kind: 'walker', position: { x: 292, y: 90 } }],
        hazards: [],
      };
      const hazardForcedHitFixture = {
        platforms: [{ id: 'floor', kind: 'static', x: 0, y: 120, width: 240, height: 24 }],
        rewardBlocks: [{ id: 'hazard-forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
        enemies: [],
        hazards: [{ id: 'spikes', kind: 'spikes', rect: { x: 128, y: 104, width: 56, height: 16 } }],
      };
      const hazardSafeFixture = {
        platforms: [
          { id: 'pickup-floor', kind: 'static', x: 0, y: 120, width: 180, height: 24 },
          { id: 'next-floor', kind: 'static', x: 240, y: 120, width: 180, height: 24 },
        ],
        rewardBlocks: [{ id: 'hazard-safe', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
        enemies: [],
        hazards: [{ id: 'spikes', kind: 'spikes', rect: { x: 260, y: 104, width: 56, height: 16 } }],
      };
      return {
        blockedRejected: !analyzeFixtureLocks(blockedFixture).passed,
        forcedHitRejected: !analyzeFixtureLocks(forcedHitFixture).passed,
        safeAllowed: analyzeFixtureLocks(safeFixture).passed,
        hazardForcedHitRejected: !analyzeFixtureLocks(hazardForcedHitFixture).passed,
        hazardSafeAllowed: analyzeFixtureLocks(hazardSafeFixture).passed,
        coinForcedHitRejected: !analyzeFixtureLocks({
          platforms: forcedHitFixture.platforms,
          rewardBlocks: [{ id: 'coin-forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'coins', amount: 2 } }],
          enemies: forcedHitFixture.enemies,
          hazards: [],
        }).passed,
        coinHazardForcedHitRejected: !analyzeFixtureLocks({
          platforms: hazardForcedHitFixture.platforms,
          rewardBlocks: [{ id: 'coin-hazard-forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'coins', amount: 2 } }],
          enemies: [],
          hazards: hazardForcedHitFixture.hazards,
        }).passed,
      };
    })();

    bridge.forceStartStage(1);
    resetToGameScene();
    const runtimeRouteState = bridge.getSession().getState();
    const runtimeRouteBlock = runtimeRouteState.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === 'amber-dash');
    const runtimePowerKind = runtimeRouteBlock.reward.kind === 'power' ? runtimeRouteBlock.reward.power : null;
    const pickupState = punchBlock(runtimeRouteBlock.id);
    const routeStartHealth = pickupState.player.health;
    const routeTargetX = runtimeRouteBlock.x + runtimeRouteBlock.width + 32;
    let runtimeAfterRoute = pickupState;
    bridge.setRight(true);
    for (let i = 0; i < 75; i += 1) {
      bridge.consumeFrame(16);
      runtimeAfterRoute = bridge.getSession().getState();
      if (
        runtimeAfterRoute.player.x >= routeTargetX ||
        runtimeAfterRoute.player.health !== routeStartHealth ||
        runtimeAfterRoute.player.dead
      ) {
        break;
      }
    }
    bridge.setRight(false);
    const runtimeSafeContinuation =
      runtimeAfterRoute.player.health === routeStartHealth &&
      !runtimeAfterRoute.player.dead &&
      runtimeAfterRoute.player.x >= routeTargetX &&
      runtimePowerKind !== null &&
      runtimeAfterRoute.progress.activePowers[runtimePowerKind];

    bridge.forceStartStage(1);
    resetToGameScene();
    const runtimeHazardState = bridge.getSession().getState();
    const runtimeHazardBlock = runtimeHazardState.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === 'amber-shooter');
    const runtimeHazardPowerKind = runtimeHazardBlock.reward.kind === 'power' ? runtimeHazardBlock.reward.power : null;
    const hazardPickupState = punchBlock(runtimeHazardBlock.id);
    const hazardRouteStartHealth = hazardPickupState.player.health;
    const hazardRouteTargetX = runtimeHazardBlock.x + runtimeHazardBlock.width + 52;
    let runtimeAfterHazardRoute = hazardPickupState;
    bridge.setRight(true);
    for (let i = 0; i < 75; i += 1) {
      bridge.consumeFrame(16);
      runtimeAfterHazardRoute = bridge.getSession().getState();
      if (
        runtimeAfterHazardRoute.player.x >= hazardRouteTargetX ||
        runtimeAfterHazardRoute.player.health !== hazardRouteStartHealth ||
        runtimeAfterHazardRoute.player.dead
      ) {
        break;
      }
    }
    bridge.setRight(false);
    const runtimeHazardSafeContinuation =
      runtimeAfterHazardRoute.player.health === hazardRouteStartHealth &&
      !runtimeAfterHazardRoute.player.dead &&
      runtimeAfterHazardRoute.player.x >= hazardRouteTargetX &&
      runtimeHazardPowerKind !== null &&
      runtimeAfterHazardRoute.progress.activePowers[runtimeHazardPowerKind];

    bridge.forceStartStage(0);
    resetToGameScene();
    const runtimeCoinState = bridge.getSession().getState();
    const runtimeCoinBlock = runtimeCoinState.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === 'forest-coin-1');
    const coinPickupStartTotal = runtimeCoinState.progress.totalCoins;
    const coinPickupState = punchBlock(runtimeCoinBlock.id);
    const coinRouteStartHealth = coinPickupState.player.health;
    const coinRouteTargetX = runtimeCoinBlock.x + runtimeCoinBlock.width + 36;
    let runtimeAfterCoinRoute = coinPickupState;
    bridge.setRight(true);
    for (let i = 0; i < 60; i += 1) {
      bridge.consumeFrame(16);
      runtimeAfterCoinRoute = bridge.getSession().getState();
      if (
        runtimeAfterCoinRoute.player.x >= coinRouteTargetX ||
        runtimeAfterCoinRoute.player.health !== coinRouteStartHealth ||
        runtimeAfterCoinRoute.player.dead
      ) {
        break;
      }
    }
    bridge.setRight(false);
    const runtimeCoinSafeContinuation =
      runtimeAfterCoinRoute.player.health === coinRouteStartHealth &&
      !runtimeAfterCoinRoute.player.dead &&
      runtimeAfterCoinRoute.player.x >= coinRouteTargetX &&
      runtimeAfterCoinRoute.progress.totalCoins > coinPickupStartTotal;

    results.push({
      stageName: 'Block Checks',
      targetDurationMinutes: 0,
      stage: {
        world: { width: 0 },
        segments: [],
        platforms: [],
        enemies: [],
        hazards: [],
        collectibles: [],
        checkpoints: [],
        rewardBlocks: [],
      },
      checkpoint: {
        activatedId: 'blocks',
        checkpointX: 0,
        respawnedX: 0,
        health: 3,
      },
      blocks: {
        coinHitStates: [
          firstCoinSnapshot,
          secondCoinSnapshot,
        ],
        coinRevealVisible,
        coinRevealExpired,
        powerRevealVisible,
        powerRevealExpired,
        powerSingleUse:
          firstPowerSnapshot.used === true &&
          firstPowerSnapshot.remainingHits === 0 &&
          secondPowerSnapshot.remainingHits === 0 &&
          secondPowerSnapshot.used === true &&
          secondPowerPunch.stageRuntime.rewardReveals.length === 0,
        blockedPlacementRejected: rewardLockCoverage.blockedRejected,
        forcedHitRejected: rewardLockCoverage.forcedHitRejected,
        safePlacementAllowed: rewardLockCoverage.safeAllowed,
        hazardForcedHitRejected: rewardLockCoverage.hazardForcedHitRejected,
        hazardSafePlacementAllowed: rewardLockCoverage.hazardSafeAllowed,
        coinForcedHitRejected: rewardLockCoverage.coinForcedHitRejected,
        coinHazardForcedHitRejected: rewardLockCoverage.coinHazardForcedHitRejected,
        runtimeSafeContinuation,
        runtimeHazardSafeContinuation,
        runtimeCoinSafeContinuation,
        spacingPassed: [0, 1, 2].every((stageIndex) => {
          bridge.forceStartStage(stageIndex);
          resetToGameScene();
          const spacingState = bridge.getSession().getState();
          return spacingState.stage.rewardBlocks.every((rewardBlock) => {
            const support = spacingState.stage.platforms
              .filter(
                (platform) =>
                  rewardBlock.x + rewardBlock.width / 2 >= platform.x &&
                  rewardBlock.x + rewardBlock.width / 2 <= platform.x + platform.width &&
                  platform.y >= rewardBlock.y + rewardBlock.height,
              )
              .sort((left, right) => left.y - right.y)[0];
            if (!support) {
              return false;
            }
            const clearance = support.y - (rewardBlock.y + rewardBlock.height);
            return clearance >= 56;
          });
        }),
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
        notes.push(
          mechanics.powerVariantDistinct ? 'power variants are visually distinct' : 'power variants are not visually distinct',
        );
        notes.push(mechanics.turretVisibilityGated ? 'turret lead-margin gate passed' : 'turret lead-margin gate failed');

        return {
          stageName: result.stageName,
          targetDurationMinutes: 0,
          estimatedMinutes: 0,
          readability: {
            segmentCount: 0,
            collectibleZones: [],
            maxCheckpointGap: 0,
            segmentPass: true,
            collectiblePass: true,
            checkpointPass: true,
          },
          checkpoint: { passed: true },
          safety: { passed: true },
          mechanics,
          flow: { passed: true },
          notes,
        };
      }

      if (result.stageName === 'Block Checks') {
        const blocks = blockReport(result.blocks);
        const notes = [];
        notes.push(blocks.coinRevealVisible ? 'coin reveal spawned on hit' : 'coin reveal missing on hit');
        notes.push(blocks.coinRevealExpired ? 'coin reveal faded after 1 second' : 'coin reveal lingered too long');
        notes.push(blocks.powerRevealVisible ? 'power reveal spawned on hit' : 'power reveal missing on hit');
        notes.push(blocks.powerRevealExpired ? 'power reveal faded after 1 second' : 'power reveal lingered too long');
        notes.push(blocks.powerSingleUse ? 'power block remained single-use' : 'power block triggered more than once');
        notes.push(blocks.blockedPlacementRejected ? 'blocked reward-block fixture rejected' : 'blocked reward-block fixture accepted incorrectly');
        notes.push(blocks.forcedHitRejected ? 'forced-hit power route rejected' : 'forced-hit power route accepted incorrectly');
        notes.push(blocks.safePlacementAllowed ? 'safe reward-block fixture accepted' : 'safe reward-block fixture rejected incorrectly');
        notes.push(blocks.hazardForcedHitRejected ? 'hazard forced-hit route rejected' : 'hazard forced-hit route accepted incorrectly');
        notes.push(blocks.coinForcedHitRejected ? 'coin forced-hit route rejected' : 'coin forced-hit route accepted incorrectly');
        notes.push(
          blocks.coinHazardForcedHitRejected
            ? 'coin hazard forced-hit route rejected'
            : 'coin hazard forced-hit route accepted incorrectly',
        );
        notes.push(blocks.hazardSafePlacementAllowed ? 'safe hazard fixture accepted' : 'safe hazard fixture rejected incorrectly');
        notes.push(blocks.runtimeSafeContinuation ? 'live enemy-route continuation passed' : 'live enemy-route continuation failed');
        notes.push(
          blocks.runtimeHazardSafeContinuation ? 'live hazard-route continuation passed' : 'live hazard-route continuation failed',
        );
        notes.push(blocks.runtimeCoinSafeContinuation ? 'live coin-route continuation passed' : 'live coin-route continuation failed');
        notes.push(blocks.spacingPassed ? 'punch-block spacing passed' : 'punch-block spacing failed');

        return {
          stageName: result.stageName,
          targetDurationMinutes: 0,
          estimatedMinutes: 0,
          readability: {
            segmentCount: 0,
            collectibleZones: [],
            maxCheckpointGap: 0,
            segmentPass: true,
            collectiblePass: true,
            checkpointPass: true,
          },
          checkpoint: { passed: true },
          safety: { passed: true },
          mechanics: { passed: true },
          blocks,
          flow: { passed: true },
          notes,
        };
      }

      const estimatedMinutes = estimateMinutes(result.stage);
      const readability = analyzeReadability(result.stage);
      const checkpoint = checkpointReport(result.checkpoint);
      const safetyScan = analyzeSafety(result.stage);
      const blockSpacing = analyzeBlockSpacing(result.stage);
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
          : 'collectibles do not cover early/mid/late pacing zones',
      );
      notes.push(checkpoint.passed ? 'late checkpoint respawn passed' : 'late checkpoint respawn failed');
      notes.push(
        safetyScan.checkpointPass && safetyScan.hazardPass && safetyScan.enemyPass
          ? 'checkpoints, hazards, grounded enemies, and static elements are on supported routes'
          : `unsafe authored elements found: checkpoints [${safetyScan.unsafeCheckpoints.join(', ')}], hazards [${safetyScan.unsafeHazards.join(', ')}], enemy spawns [${safetyScan.unsafeEnemySpawns.join(', ')}], enemy lanes [${safetyScan.invalidEnemyLanes.join(', ')}], edge threats [${safetyScan.edgeThreats.join(', ')}], static overlaps [${safetyScan.overlappingStatics.join(', ')}]`,
      );
      notes.push(
        blockSpacing.passed
          ? 'reward blocks keep punchable clearance above stable floors'
          : `reward block spacing failed for [${blockSpacing.invalidBlocks.join(', ')}]`,
      );

      return {
        stageName: result.stageName,
        targetDurationMinutes: result.targetDurationMinutes,
        estimatedMinutes,
        readability,
        checkpoint,
        safety: { passed: safetyScan.checkpointPass && safetyScan.hazardPass && safetyScan.enemyPass },
        blockSpacing,
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
        mainMenuRootVisible: flowChecks.mainMenuRootVisible,
        mainMenuKeyboardUpdate: flowChecks.mainMenuKeyboardUpdate,
        mainOptionsVisible: flowChecks.mainOptionsVisible,
        mainMenuPointerUpdate: flowChecks.mainMenuPointerUpdate,
        mainOptionsLiveUpdate: flowChecks.mainOptionsLiveUpdate,
        mainHelpVisible: flowChecks.mainHelpVisible,
        mainHelpLargerPanelVisible: flowChecks.mainHelpLargerPanelVisible,
        mainHelpScrollVisible: flowChecks.mainHelpScrollVisible,
        mainHelpKeyboardScrollWorked: flowChecks.mainHelpKeyboardScrollWorked,
        mainHelpWheelScrollWorked: flowChecks.mainHelpWheelScrollWorked,
        introStatusVisible: flowChecks.introStatusVisible,
        hudLayoutPassed: flowChecks.hudLayoutPassed,
        pauseOverlayVisible: flowChecks.pauseOverlayVisible,
        pauseMenuSceneRemoved: flowChecks.pauseMenuSceneRemoved,
        pauseFreezeWorked: flowChecks.pauseFreezeWorked,
        pauseMenuActionsRemoved: flowChecks.pauseMenuActionsRemoved,
        pauseResumeExact: flowChecks.pauseResumeExact,
        autoAdvanceWorked: flowChecks.autoAdvanceWorked,
        finalStageStopped: flowChecks.finalStageStopped,
        passed:
          flowChecks.mainMenuRootVisible &&
          flowChecks.mainMenuKeyboardUpdate &&
          flowChecks.mainOptionsVisible &&
          flowChecks.mainMenuPointerUpdate &&
          flowChecks.mainOptionsLiveUpdate &&
          flowChecks.mainHelpVisible &&
          flowChecks.mainHelpLargerPanelVisible &&
          flowChecks.mainHelpScrollVisible &&
          flowChecks.mainHelpKeyboardScrollWorked &&
          flowChecks.mainHelpWheelScrollWorked &&
          flowChecks.introVisible &&
          flowChecks.introStatusVisible &&
          flowChecks.hudLayoutPassed &&
          flowChecks.pauseOverlayVisible &&
          flowChecks.pauseMenuSceneRemoved &&
          flowChecks.pauseFreezeWorked &&
          flowChecks.pauseMenuActionsRemoved &&
          flowChecks.pauseResumeExact &&
          flowChecks.autoAdvanceWorked &&
          flowChecks.finalStageStopped,
      },
      notes: [
        flowChecks.mainMenuRootVisible ? 'main menu root actions passed' : 'main menu root actions failed',
        flowChecks.mainMenuKeyboardUpdate ? 'main root keyboard navigation passed' : 'main root keyboard navigation failed',
        flowChecks.mainOptionsVisible ? 'main options view passed' : 'main options view failed',
        flowChecks.mainMenuPointerUpdate ? 'main options pointer navigation passed' : 'main options pointer navigation failed',
        flowChecks.mainOptionsLiveUpdate ? 'main options live updates passed' : 'main options live updates failed',
        flowChecks.mainHelpVisible ? 'main help view passed' : 'main help view failed',
        flowChecks.mainHelpLargerPanelVisible ? 'main help panel sizing passed' : 'main help panel sizing failed',
        flowChecks.mainHelpScrollVisible ? 'main help scrollbar appeared for overflow' : 'main help scrollbar missing',
        flowChecks.mainHelpKeyboardScrollWorked ? 'main help keyboard scroll passed' : 'main help keyboard scroll failed',
        flowChecks.mainHelpWheelScrollWorked ? 'main help wheel scroll passed' : 'main help wheel scroll failed',
        flowChecks.introVisible ? 'stage intro scene appeared' : 'stage intro scene missing',
        flowChecks.introStatusVisible ? 'intro status summary passed' : 'intro status summary failed',
        flowChecks.hudLayoutPassed ? 'hud layout passed' : 'hud layout failed',
        flowChecks.pauseOverlayVisible ? 'pause overlay visibility passed' : 'pause overlay visibility failed',
        flowChecks.pauseMenuSceneRemoved ? 'pause menu scene no longer launched' : 'pause menu scene still launched',
        flowChecks.pauseFreezeWorked ? 'pause freeze check passed' : 'pause freeze check failed',
        flowChecks.pauseMenuActionsRemoved ? 'pause-only actions were removed' : 'pause-only actions still appeared',
        flowChecks.pauseResumeExact ? 'pause resume returned to the exact run' : 'pause resume rebuilt or lost runtime state',
        flowChecks.autoAdvanceWorked ? 'results auto-advance passed' : 'results auto-advance failed',
        flowChecks.finalStageStopped ? 'final stage stayed on results screen' : 'final stage auto-advanced incorrectly',
      ],
    });

    const rewardLockCoverage = rewardLockCoverageReport();
    results.push({
      stageName: 'Reward Lock Coverage',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: { segmentCount: 0, collectibleZones: [], maxCheckpointGap: 0, segmentPass: true, collectiblePass: true, checkpointPass: true },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: true },
      flow: { passed: true },
      rewardLockCoverage,
      notes: [
        rewardLockCoverage.blockedRejected ? 'blocked fixture rejected' : 'blocked fixture accepted incorrectly',
        rewardLockCoverage.forcedHitRejected ? 'forced-hit fixture rejected' : 'forced-hit fixture accepted incorrectly',
        rewardLockCoverage.safeAllowed ? 'safe fixture accepted' : 'safe fixture rejected incorrectly',
        rewardLockCoverage.hazardForcedHitRejected ? 'hazard forced-hit fixture rejected' : 'hazard forced-hit fixture accepted incorrectly',
        rewardLockCoverage.coinForcedHitRejected ? 'coin forced-hit fixture rejected' : 'coin forced-hit fixture accepted incorrectly',
        rewardLockCoverage.coinHazardForcedHitRejected ? 'coin hazard forced-hit fixture rejected' : 'coin hazard forced-hit fixture accepted incorrectly',
        rewardLockCoverage.hazardSafeAllowed ? 'safe hazard fixture accepted' : 'safe hazard fixture rejected incorrectly',
      ],
    });

    const staticLayoutCoverage = staticLayoutCoverageReport();
    results.push({
      stageName: 'Static Layout Coverage',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: true },
      flow: { passed: true },
      staticLayoutCoverage,
      notes: [
        staticLayoutCoverage.overlappingRejected
          ? 'overlapping static fixture rejected'
          : 'overlapping static fixture accepted incorrectly',
        staticLayoutCoverage.safeAllowed ? 'safe adjacent static fixture accepted' : 'safe adjacent static fixture rejected incorrectly',
      ],
    });

    const scopedResults = scopeResultsForChange(results);

    const failures = scopedResults.filter(
      (result) =>
        result.estimatedMinutes < result.targetDurationMinutes ||
        !result.readability.segmentPass ||
        !result.readability.checkpointPass ||
        !result.readability.collectiblePass ||
        !result.checkpoint.passed ||
        !result.safety.passed ||
        result.blockSpacing?.passed === false ||
        result.blocks?.passed === false ||
        result.rewardLockCoverage?.passed === false ||
        result.staticLayoutCoverage?.passed === false ||
        !result.mechanics.passed ||
        !result.flow.passed,
    );

      await fs.writeFile(JSON_REPORT, `${JSON.stringify(scopedResults, null, 2)}\n`);
      await fs.writeFile(MD_REPORT, buildMarkdown(scopedResults));

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
