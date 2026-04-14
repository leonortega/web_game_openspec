import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = process.env.OPENSPEC_CHANGE ?? 'lightweight-stage-objectives';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'playtest-report.md');
const PORT = 4179;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;
const CHANGE_RESULT_SCOPE = {
  'activation-node-magnetic-platforms': new Set(['Mechanic Checks']),
  'pause-menu-esc-continue-options-help': new Set(['Flow Checks']),
  'pause-menu-visibility-and-help-scroll': new Set(['Flow Checks']),
  'pause-overlay-and-help-panel-sizing': new Set(['Flow Checks']),
  'scanner-switches-and-temporary-bridges': new Set(['Mechanic Checks']),
  'timed-reveal-secret-routes': new Set(['Mechanic Checks']),
  'biome-authored-launchers': new Set(['Mechanic Checks']),
  'readable-biome-enemy-variants': new Set(['Ember Rift Warrens', 'Halo Spire Array', 'Turret Variant Checks']),
  'expedition-secret-routes-and-sample-caves': new Set(['Ember Rift Warrens', 'Secret Route Checks']),
  'lightweight-stage-objectives': new Set(['Objective Checks']),
  'atari-2600-inspired-graphics': new Set(['Retro Presentation Checks', 'Flow Checks']),
  'retro-menu-and-presentation-tightening': new Set(['Retro Presentation Checks', 'Flow Checks']),
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
  const lateThreshold = stage.world.width * 0.68;
  const elevatedRoutePlatforms = stage.platforms.filter((platform) => platform.x >= lateThreshold && platform.y <= 340).length;
  const elevatedRouteRewards = [
    ...stage.collectibles.filter((collectible) => collectible.position.x >= lateThreshold && collectible.position.y <= 360),
    ...stage.rewardBlocks.filter((rewardBlock) => rewardBlock.x >= lateThreshold && rewardBlock.y <= 360),
  ].length;
  const mainRouteThreatXs = [
    ...stage.hazards.filter((hazard) => hazard.rect.x >= lateThreshold && hazard.rect.y >= 340).map((hazard) => hazard.rect.x),
    ...stage.enemies.filter((enemy) => enemy.position.x >= lateThreshold && enemy.position.y >= 340).map((enemy) => enemy.position.x),
  ].sort((left, right) => left - right);
  const optionalThreatCount = [
    ...stage.hazards.filter((hazard) => hazard.rect.x >= lateThreshold && hazard.rect.y < 340),
    ...stage.enemies.filter((enemy) => enemy.position.x >= lateThreshold && enemy.position.y < 340),
  ].length;

  let maxMainRouteThreatWindow = 0;
  for (let index = 0; index < mainRouteThreatXs.length; index += 1) {
    const windowStart = mainRouteThreatXs[index];
    const threatCount = mainRouteThreatXs.filter((value) => value >= windowStart && value <= windowStart + 960).length;
    maxMainRouteThreatWindow = Math.max(maxMainRouteThreatWindow, threatCount);
  }

  return {
    segmentCount: stage.segments.length,
    collectibleZones: [...collectibleZones],
    maxCheckpointGap,
    elevatedRoutePlatforms,
    elevatedRouteRewards,
    maxMainRouteThreatWindow,
    optionalThreatCount,
    segmentPass: stage.segments.length >= 5,
    collectiblePass: collectibleZones.size >= 3,
    checkpointPass: maxCheckpointGap <= Math.max(2200, Math.round(stage.world.width * 0.3)),
    routePass: elevatedRoutePlatforms >= 3 && elevatedRouteRewards >= 3,
    encounterPass: maxMainRouteThreatWindow <= 5 && optionalThreatCount >= 2,
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

function expandRect(rect, padding) {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

function rectContainsPoint(rect, point) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
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
    const gravityFieldConflict = (stage.gravityFields ?? []).some((field) =>
      intersectsRect(expandRect(field, 56), checkpoint.rect),
    );

    if (!support || enemyConflict || hazardConflict || gravityFieldConflict) {
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

function hasNearbyThreat(stage, turret, maxDx, maxDy) {
  const nearbyEnemy = stage.enemies.some((enemy) => {
    if (enemy.id === turret.id) {
      return false;
    }

    return Math.abs(enemy.position.x - turret.position.x) <= maxDx && Math.abs(enemy.position.y - turret.position.y) <= maxDy;
  });

  if (nearbyEnemy) {
    return true;
  }

  return stage.hazards.some(
    (hazard) =>
      Math.abs(hazard.rect.x - turret.position.x) <= maxDx &&
      Math.abs(hazard.rect.y + hazard.rect.height - turret.position.y) <= maxDy,
  );
}

function hasApproachFoothold(stage, turret, maxGap = 340, maxHeightDelta = 140) {
  const turretSupport = findStrictSupport(
    stage,
    turret.position.x,
    turret.position.x + enemyRect(turret).width,
    turret.position.y + enemyRect(turret).height,
  );
  if (!turretSupport) {
    return false;
  }

  return stage.platforms.some((platform) => {
    if (platform.id === turretSupport.id) {
      return false;
    }

    const horizontalGap = turretSupport.x - (platform.x + platform.width);
    return (
      horizontalGap >= -24 &&
      horizontalGap <= maxGap &&
      Math.abs(platform.y - turretSupport.y) <= maxHeightDelta
    );
  });
}

function buildTurretVariantCheck(rawResults) {
  const trackedStages = rawResults.filter(
    (result) =>
      result.stage &&
      (result.stageName === 'Ember Rift Warrens' || result.stageName === 'Halo Spire Array') &&
      (result.stage.id === 'amber-cavern' || result.stage.id === 'sky-sanctum'),
  );

  const variantReports = trackedStages.map((result) => {
    const variantTurrets = result.stage.enemies
      .filter((enemy) => enemy.kind === 'turret' && enemy.variant)
      .sort((left, right) => left.position.x - right.position.x);
    const teaching = variantTurrets[0];
    const mixed = variantTurrets[variantTurrets.length - 1];
    const teachingIsolated = Boolean(teaching) && !hasNearbyThreat(result.stage, teaching, 260, 120);
    const teachingFoothold = Boolean(teaching) && hasApproachFoothold(result.stage, teaching, 340, 160);
    const mixedPressure = Boolean(mixed) && hasNearbyThreat(result.stage, mixed, 380, 170);
    const mixedFoothold = Boolean(mixed) && hasApproachFoothold(result.stage, mixed, 360, 170);

    return {
      stageName: result.stageName,
      variant: teaching?.variant ?? mixed?.variant ?? 'missing',
      teachingId: teaching?.id ?? null,
      mixedId: mixed?.id ?? null,
      teachingIsolated,
      teachingFoothold,
      mixedPressure,
      mixedFoothold,
      passed:
        variantTurrets.length === 2 &&
        teachingIsolated &&
        teachingFoothold &&
        mixedPressure &&
        mixedFoothold,
    };
  });

  return {
    variantReports,
    passed: variantReports.length === 2 && variantReports.every((report) => report.passed),
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
    bouncePodLaunchWorked: result.bouncePodLaunchWorked,
    gasVentLaunchWorked: result.gasVentLaunchWorked,
    hopperHighJump: result.hopperHighJump,
    fallingJumpResponsive: result.fallingJumpResponsive,
    chargerWindup: result.chargerWindup,
    chargerCharged: result.chargerCharged,
    flyerMoved: result.flyerMoved,
    gravityFieldRouteReadable: result.gravityFieldRouteReadable,
    antiGravStreamApplied: result.antiGravStreamApplied,
    gravityInversionApplied: result.gravityInversionApplied,
    gravityFieldDashSuppressed: result.gravityFieldDashSuppressed,
    gravityFieldExitRestored: result.gravityFieldExitRestored,
    gravityFieldResetConsistent: result.gravityFieldResetConsistent,
    gravityFieldCheckpointSafe: result.gravityFieldCheckpointSafe,
    magneticDormantVisible: result.magneticDormantVisible,
    magneticNodeTriggered: result.magneticNodeTriggered,
    magneticPoweredSupport: result.magneticPoweredSupport,
    magneticVisualDistinct: result.magneticVisualDistinct,
    magneticRespawnReset: result.magneticRespawnReset,
    magneticFreshAttemptReset: result.magneticFreshAttemptReset,
    magneticRetrySafeFallback: result.magneticRetrySafeFallback,
    revealRouteUnlocked: result.revealRouteUnlocked,
    timedRevealActivationGuard: result.timedRevealActivationGuard,
    timedRevealDiscovered: result.timedRevealDiscovered,
    timedRevealActivated: result.timedRevealActivated,
    scannerBridgeActivated: result.scannerBridgeActivated,
    scannerBridgeNoStayRefresh: result.scannerBridgeNoStayRefresh,
    scannerBridgeReentryRefresh: result.scannerBridgeReentryRefresh,
    scannerBridgeOccupiedExpiry: result.scannerBridgeOccupiedExpiry,
    timedRevealSkipFallback: result.timedRevealSkipFallback,
    timedRevealReconnectionReady: result.timedRevealReconnectionReady,
    terrainSurfaceExtentsRendered: result.terrainSurfaceExtentsRendered,
    brittleWarningTriggered: result.brittleWarningTriggered,
    brittleEscapeJumpWorked: result.brittleEscapeJumpWorked,
    brittleFreshAttemptReset: result.brittleFreshAttemptReset,
    stickyGroundedTraversalReduced: result.stickyGroundedTraversalReduced,
    stickyAntiGravJumpSequenced: result.stickyAntiGravJumpSequenced,
    powerVariantDistinct: result.powerVariantDistinct,
    routingInteractablesReadable: result.routingInteractablesReadable,
    hazardContrastReadable: result.hazardContrastReadable,
    turretTelegraphReadable: result.turretTelegraphReadable,
    turretVisibilityGated: result.turretVisibilityGated,
    passed:
      result.dashUnlocked &&
      result.dashTriggered &&
      result.dashCooldownStarted &&
      result.movingRideStable &&
      result.collapseTriggered &&
      result.collapseFell &&
      result.springBoosted &&
      result.bouncePodLaunchWorked &&
      result.gasVentLaunchWorked &&
      result.hopperHighJump &&
      result.fallingJumpResponsive &&
      result.chargerWindup &&
      result.chargerCharged &&
      result.flyerMoved &&
      result.gravityFieldRouteReadable &&
      result.antiGravStreamApplied &&
      result.gravityInversionApplied &&
      result.gravityFieldDashSuppressed &&
      result.gravityFieldExitRestored &&
      result.gravityFieldResetConsistent &&
      result.gravityFieldCheckpointSafe &&
      result.magneticDormantVisible &&
      result.magneticNodeTriggered &&
      result.magneticPoweredSupport &&
      result.magneticVisualDistinct &&
      result.magneticRespawnReset &&
      result.magneticFreshAttemptReset &&
      result.magneticRetrySafeFallback &&
      result.revealRouteUnlocked &&
      result.timedRevealActivationGuard &&
      result.timedRevealDiscovered &&
      result.timedRevealActivated &&
      result.scannerBridgeActivated &&
      result.scannerBridgeNoStayRefresh &&
      result.scannerBridgeReentryRefresh &&
      result.scannerBridgeOccupiedExpiry &&
      result.timedRevealSkipFallback &&
      result.timedRevealReconnectionReady &&
      result.terrainSurfaceExtentsRendered &&
      result.brittleWarningTriggered &&
      result.brittleEscapeJumpWorked &&
      result.brittleFreshAttemptReset &&
      result.stickyGroundedTraversalReduced &&
      result.stickyAntiGravJumpSequenced &&
      result.powerVariantDistinct &&
      result.routingInteractablesReadable &&
      result.hazardContrastReadable &&
      result.turretTelegraphReadable &&
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

function analyzeSecretRoutes(stage) {
  const routes = stage.secretRoutes ?? [];
  const routeReports = routes.map((route) => {
    const rewardCollectibles = stage.collectibles.filter((collectible) => route.reward.collectibleIds.includes(collectible.id));
    const rewardBlocks = stage.rewardBlocks.filter((rewardBlock) => route.reward.rewardBlockIds.includes(rewardBlock.id));
    const rewardScore =
      rewardCollectibles.length +
      rewardBlocks.reduce(
        (total, rewardBlock) => total + (rewardBlock.reward.kind === 'coins' ? rewardBlock.reward.amount : 3),
        0,
      );
    const cueReadable = Boolean(findSupportForRect(stage, route.cue.rect));
    const rewardInsidePocket =
      rewardCollectibles.every((collectible) => rectContainsPoint(route.interior, collectible.position)) &&
      rewardBlocks.every((rewardBlock) => intersectsRect(route.interior, rewardBlock));
    const reconnectSupported = Boolean(findSupportForRect(stage, route.reconnect));
    const mainPathSupported = Boolean(findSupportForRect(stage, route.mainPath));
    const reconnectSafe =
      !stage.hazards.some((hazard) => intersectsRect(expandRect(route.reconnect, 32), hazard.rect)) &&
      !stage.enemies.some((enemy) => intersectsRect(expandRect(route.reconnect, 44), enemyRect(enemy)));

    return {
      id: route.id,
      title: route.title,
      cueReadable,
      rewardScore,
      rewardInsidePocket,
      reconnectSupported,
      mainPathSupported,
      reconnectSafe,
      downstreamReconnect: route.reconnect.x > route.entry.x + 120,
      passed:
        cueReadable &&
        rewardScore >= 3 &&
        rewardInsidePocket &&
        reconnectSupported &&
        mainPathSupported &&
        reconnectSafe &&
        route.reconnect.x > route.entry.x + 120,
    };
  });

  return {
    routeCount: routes.length,
    routeReports,
    passed: routes.length > 0 && routeReports.every((route) => route.passed),
  };
}

function buildMarkdown(results) {
  const lines = [
    '# Stage Playtest Report',
    '',
    `Automated browser-assisted validation for \`${CHANGE_NAME}\`.`,
    '',
    '| Stage | Target | Estimated | Segments | Max Checkpoint Gap | Collectible Zones | Detours | Main Route Threats | Respawn | Safety | Mechanics | Flow |',
    '|---|---:|---:|---:|---:|---|---|---:|---|---|---|---|',
  ];

  for (const result of results) {
    lines.push(
      `| ${result.stageName} | ${result.targetDurationMinutes}m | ${result.estimatedMinutes}m | ${result.readability.segmentCount} | ${result.readability.maxCheckpointGap}px | ${result.readability.collectibleZones.join(', ')} | ${result.readability.routePass ? 'pass' : 'fail'} | ${result.readability.maxMainRouteThreatWindow} | ${result.checkpoint.passed ? 'pass' : 'fail'} | ${result.safety.passed ? 'pass' : 'fail'} | ${result.mechanics.passed ? 'pass' : 'fail'} | ${result.flow.passed ? 'pass' : 'fail'} |`,
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
  const menuRootStyle = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const menu = game.scene.getScene('menu');
    const queue = [...menu.children.getChildren()];
    const visibleTexts = [];
    const visibleRectangles = [];

    while (queue.length > 0) {
      const child = queue.shift();
      if (!child) {
        continue;
      }

      if (typeof child.text === 'string' && child.visible) {
        visibleTexts.push(child);
      }

      if (child.type === 'Rectangle' && child.visible) {
        visibleRectangles.push(child);
      }

      if (Array.isArray(child.list)) {
        queue.push(...child.list);
      }
    }

    return {
      usesRetroFont: visibleTexts.every((child) => child.style?.fontFamily?.includes('Courier New')),
      hasFlatFrame: visibleRectangles.length >= 3,
      hasHighContrastSelection: visibleTexts.some((child) =>
        String(child.style?.backgroundColor ?? '').toLowerCase().includes('f0b84b'),
      ),
    };
  });
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
  const menuHelpStyle = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const menu = game.scene.getScene('menu');
    const queue = [...menu.children.getChildren()];
    const visibleTexts = [];
    const visibleRectangles = [];

    while (queue.length > 0) {
      const child = queue.shift();
      if (!child) {
        continue;
      }

      if (typeof child.text === 'string' && child.visible) {
        visibleTexts.push(child);
      }

      if (child.type === 'Rectangle' && child.visible) {
        visibleRectangles.push(child);
      }

      if (Array.isArray(child.list)) {
        queue.push(...child.list);
      }
    }

    return {
      usesRetroFont: visibleTexts.every((child) => child.style?.fontFamily?.includes('Courier New')),
      hasFlatHelpPanel: visibleRectangles.length >= 4,
      hasReadableHelpText:
        visibleTexts.some((child) => child.text === 'Help') && visibleTexts.some((child) => child.text === 'Powers'),
    };
  });
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  const mainHelpAfterKeyboardScroll = await readMenuSnapshot(page);
  await wheelMenu(page, 320);
  await page.waitForTimeout(120);
  const mainHelpAfterWheelScroll = await readMenuSnapshot(page);

  const helpSnapshots = [mainHelpMenu, mainHelpAfterKeyboardScroll, mainHelpAfterWheelScroll].filter(Boolean);
  const mainHelpClippingVerified = helpSnapshots.some(
    (snapshot) =>
      Array.isArray(snapshot.helpParagraphs) &&
      snapshot.helpParagraphs.some(
        (paragraph) => paragraph.visible && (paragraph.cropY > 0 || paragraph.cropHeight < paragraph.bottom - paragraph.top),
      ) &&
      snapshot.helpParagraphs.every(
        (paragraph) =>
          (paragraph.visible &&
            paragraph.cropHeight > 0 &&
            paragraph.visibleTop >= snapshot.helpViewportTop &&
            paragraph.visibleBottom <= snapshot.helpViewportBottom) ||
          (!paragraph.visible && paragraph.cropHeight === 0),
      ),
  );

  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  const mainRootAfterHelp = await readMenuSnapshot(page);

  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(120);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(120);
  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    state.progress.activePowers.doubleJump = true;
    state.progress.activePowers.invincible = true;
    state.progress.powerTimers.invincibleMs = 4000;
  });
  await page.keyboard.press('Enter');

  await waitForActiveScene(page, 'stage-intro');
  const introCheck = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const intro = game.scene.getScene('stage-intro');
    const textNodes = intro.children.getChildren().filter((child) => typeof child.text === 'string');
    const textValues = intro.children
      .getChildren()
      .filter((child) => typeof child.text === 'string')
      .map((child) => child.text);
    const retroRectangles = intro.children.getChildren().filter((child) => child.type === 'Rectangle');
    return {
      hasStageLabel: textValues.some((value) => value.includes('Stage 1')),
      hasRunSamples: textValues.some((value) => value.includes('Run research samples:')),
      hasSectorSamples: textValues.some((value) => value.includes('Sector research samples:')),
      hasBeaconStatus: textValues.some((value) => value.includes('Survey beacons online:')),
      hasLoadout: textValues.some((value) => value.includes('Loadout: Thruster Burst, Shield Field')),
      hasRun: textValues.some((value) => value.includes('Run:')),
      hasRetroFrame: retroRectangles.length >= 4,
      usesRetroFont: textNodes.every((child) => child.style?.fontFamily?.includes('Courier New')),
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
    const scoreboard = document.querySelector('.hud-scoreboard');
    const metaLines = [...document.querySelectorAll('.hud-meta-line')].map((node) => node.textContent?.trim() ?? '');
    const scoreboardStyle = scoreboard ? getComputedStyle(scoreboard) : null;
    return {
      hasFourCards: cards.length === 4,
      hasCornerMeta: Boolean(meta),
      hasRunLine: metaLines.some((value) => value.startsWith('Run')),
      hasSegmentLine: metaLines.some((value) => value.startsWith('Segment')),
      hasScoreboardBand:
        Boolean(scoreboardStyle) &&
        scoreboardStyle.borderStyle === 'solid' &&
        scoreboardStyle.backgroundColor !== 'rgba(0, 0, 0, 0)',
      usesFlatCells: cards.every((card) => getComputedStyle(card).borderRadius === '0px'),
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
    bridge.getSession().getState().progress.activePowers.doubleJump = true;
    bridge.getSession().getState().progress.activePowers.invincible = true;
    bridge.getSession().getState().progress.powerTimers.invincibleMs = 4000;
    bridge.getSession().getState().progress.unlockedStageIndex = 2;
    game.scene.getScene('game').scene.start('complete');
  });
  await waitForActiveScene(page, 'complete');
  const completeCheck = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const complete = game.scene.getScene('complete');
    const textNodes = complete.children.getChildren().filter((child) => typeof child.text === 'string');
    const textValues = complete.children
      .getChildren()
      .filter((child) => typeof child.text === 'string')
      .map((child) => child.text);
    const retroRectangles = complete.children.getChildren().filter((child) => child.type === 'Rectangle');
    return {
      hasRunSamples: textValues.some((value) => value.includes('Run research samples:')),
      hasSectorSamples: textValues.some((value) => value.includes('Sector research samples:')),
      hasBeaconStatus: textValues.some((value) => value.includes('Survey beacons online:')),
      hasAstronautLoadout: textValues.some((value) => value.includes('Loadout: Thruster Burst, Shield Field')),
      hasStageName: textValues.some((value) => value.includes('Verdant Impact Crater')),
      hasRetroFrame: retroRectangles.length >= 4,
      usesRetroFont: textNodes.every((child) => child.style?.fontFamily?.includes('Courier New')),
    };
  });
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
      initialMenu.joined.includes('Orbital Survey') &&
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
      mainHelpMenu.joined.includes('Thruster Burst') &&
      mainHelpMenu.joined.includes('Shield Field') &&
      mainHelpMenu.joined.includes('Hazards') &&
      Boolean(mainRootAfterHelp) &&
      mainRootAfterHelp.mode === 'main' &&
      mainRootAfterHelp.view === 'root',
    mainMenuRetroStyle:
      menuRootStyle.usesRetroFont &&
      menuRootStyle.hasFlatFrame &&
      menuRootStyle.hasHighContrastSelection &&
      menuHelpStyle.usesRetroFont &&
      menuHelpStyle.hasFlatHelpPanel &&
      menuHelpStyle.hasReadableHelpText,
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
    mainHelpClippingVerified,
    introVisible: true,
    introStatusVisible:
      introCheck.hasStageLabel &&
      introCheck.hasRunSamples &&
      introCheck.hasSectorSamples &&
      introCheck.hasBeaconStatus &&
      introCheck.hasLoadout &&
      introCheck.hasRun &&
      introCheck.hasRetroFrame &&
      introCheck.usesRetroFont,
    completeStatusVisible:
      completeCheck.hasRunSamples &&
      completeCheck.hasSectorSamples &&
      completeCheck.hasBeaconStatus &&
      completeCheck.hasAstronautLoadout &&
      completeCheck.hasStageName &&
      completeCheck.hasRetroFrame &&
      completeCheck.usesRetroFont,
    hudLayoutPassed:
      hudCheck.hasFourCards &&
      hudCheck.hasCornerMeta &&
      hudCheck.hasRunLine &&
      hudCheck.hasSegmentLine &&
      hudCheck.hasScoreboardBand &&
      hudCheck.usesFlatCells,
    pauseOverlayVisible:
      pauseStableBefore.runPaused &&
      pauseStableBefore.pauseOverlayVisible &&
      pauseStableBefore.pauseOverlayText === 'PAUSED' &&
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

async function collectObjectiveResults(page) {
  return page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    if (!bridge || !game) {
      throw new Error('Missing debug handles');
    }

    const expandRect = (rect, padding) => ({
      x: rect.x - padding,
      y: rect.y - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    const resetToGameScene = () => {
      for (const key of ['menu', 'stage-intro', 'complete']) {
        const scene = game.scene.getScene(key);
        if (scene?.scene.isActive()) {
          scene.scene.stop();
        }
      }
      game.scene.start('game');
    };

    bridge.forceStartStage(2);
    resetToGameScene();

    const initialState = bridge.getSession().getState();
    initialState.stageRuntime.enemies = [];
    initialState.stageRuntime.hazards = [];

    const briefingShown = initialState.stageRuntime.objective?.kind === 'reactivateRelay' &&
      initialState.stageMessage === 'Objective: reactivate the relay';

    initialState.player.x = initialState.stage.exit.x + 4;
    initialState.player.y = initialState.stage.exit.y;
    initialState.player.vx = 0;
    initialState.player.vy = 0;
    bridge.consumeFrame(16);

    const blockedState = bridge.getSession().getState();
    const incompleteExitBlocked =
      blockedState.levelCompleted === false &&
      blockedState.stageRuntime.exitReached === false &&
      blockedState.stageMessage === 'Reactivate the relay before exit';

    const scanner = blockedState.stageRuntime.scannerVolumes.find((volume) => volume.id === 'sky-halo-scanner');
    if (!scanner) {
      throw new Error('Objective scanner volume sky-halo-scanner not found');
    }

    blockedState.player.x = scanner.x + 16;
    blockedState.player.y = scanner.y + 16;
    blockedState.player.vx = 0;
    blockedState.player.vy = 0;
    bridge.consumeFrame(16);

    const completedState = bridge.getSession().getState();
    const objectiveCompleted =
      completedState.stageRuntime.objective?.completed === true;

    completedState.player.x = completedState.stage.exit.x + 4;
    completedState.player.y = completedState.stage.exit.y;
    completedState.player.vx = 0;
    completedState.player.vy = 0;
    bridge.consumeFrame(16);

    const exitCompletedState = bridge.getSession().getState();
    const completedExitCleared =
      exitCompletedState.levelCompleted === true &&
      exitCompletedState.stageRuntime.exitReached === true;

    return {
      briefingShown,
      incompleteExitBlocked,
      objectiveCompleted,
      completedExitCleared,
      passed: briefingShown && incompleteExitBlocked && objectiveCompleted && completedExitCleared,
    };
  });
}

async function collectStageResults(page) {
  return page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    if (!bridge || !game) {
      throw new Error('Missing debug handles');
    }

    const expandRect = (rect, padding) => ({
      x: rect.x - padding,
      y: rect.y - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

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
    let bounceLauncherState = bridge.getSession().getState();
    bounceLauncherState.stageRuntime.enemies = [];
    bounceLauncherState.stageRuntime.hazards = [];
    const bouncePod = bounceLauncherState.stageRuntime.launchers.find((launcher) => launcher.kind === 'bouncePod');
    const bounceSupportPlatform = bounceLauncherState.stageRuntime.platforms.find(
      (platform) => platform.id === bouncePod.supportPlatformId,
    );
    bounceLauncherState.player.x = bouncePod.x + Math.min(bouncePod.width - 12, 12) - bounceLauncherState.player.width / 2;
    bounceLauncherState.player.y = bounceSupportPlatform.y - bounceLauncherState.player.height - 1;
    bounceLauncherState.player.vx = 0;
    bounceLauncherState.player.vy = 160;
    bounceLauncherState.player.onGround = false;
    bounceLauncherState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const bounceLauncherResult = bridge.getSession().getState();
    const bounceLauncherCues = bridge.drainCues();
    const bouncePodLaunchWorked =
      bounceLauncherCues.includes('bounce-pod') &&
      Math.abs(bounceLauncherResult.player.vx) > 250 &&
      bounceLauncherResult.player.vy < -900;

    bridge.forceStartStage(2);
    resetToGameScene();
    let gasLauncherState = bridge.getSession().getState();
    gasLauncherState.stageRuntime.enemies = [];
    gasLauncherState.stageRuntime.hazards = [];
    const gasVent = gasLauncherState.stageRuntime.launchers.find((launcher) => launcher.kind === 'gasVent');
    const gasVentSupportPlatform = gasLauncherState.stageRuntime.platforms.find(
      (platform) => platform.id === gasVent.supportPlatformId,
    );
    gasLauncherState.player.x = gasVent.x + Math.min(gasVent.width - 12, 12) - gasLauncherState.player.width / 2;
    gasLauncherState.player.y = gasVentSupportPlatform.y - gasLauncherState.player.height - 1;
    gasLauncherState.player.vx = 0;
    gasLauncherState.player.vy = 160;
    gasLauncherState.player.onGround = false;
    gasLauncherState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const gasLauncherResult = bridge.getSession().getState();
    const gasLauncherCues = bridge.drainCues();
    bridge.consumeFrame(16);
    const gasLauncherFieldState = bridge.getSession().getState();
    const gasVentLaunchWorked =
      gasLauncherCues.includes('gas-vent') &&
      Math.abs(gasLauncherResult.player.vx) > 120 &&
      gasLauncherResult.player.vy < -780 &&
      gasLauncherFieldState.player.gravityFieldKind === 'anti-grav-stream';

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

    bridge.forceStartStage(0);
    resetToGameScene();
    const readabilityState = bridge.getSession().getState();
    const readabilityScene = game.scene.getScene('game');
    readabilityScene.syncView();
    const groundPlatform = readabilityState.stageRuntime.platforms.find(
      (platform) => platform.kind === 'static' && !platform.temporaryBridge && !platform.magnetic,
    );
    const firstCheckpoint = readabilityState.stageRuntime.checkpoints[0];
    const firstCollectible = readabilityState.stageRuntime.collectibles[0];
    const firstRewardBlock = readabilityState.stageRuntime.rewardBlocks[0];
    const firstHazard = readabilityState.stageRuntime.hazards[0];
    const groundFill = groundPlatform ? readabilityScene.platformSprites.get(groundPlatform.id)?.fillColor : null;
    const checkpointTint = firstCheckpoint ? readabilityScene.checkpointSprites.get(firstCheckpoint.id)?.tintTopLeft : null;
    const collectibleTint = firstCollectible ? readabilityScene.collectibleSprites.get(firstCollectible.id)?.tintTopLeft : null;
    const rewardBlockFill = firstRewardBlock ? readabilityScene.rewardBlockSprites.get(firstRewardBlock.id)?.fillColor : null;
    const hazardFill = firstHazard ? readabilityScene.hazardSprites.get(firstHazard.id)?.fillColor : null;
    const routingInteractablesReadable =
      Boolean(groundFill && checkpointTint && collectibleTint && rewardBlockFill && hazardFill) &&
      checkpointTint !== groundFill &&
      collectibleTint !== groundFill &&
      rewardBlockFill !== groundFill &&
      checkpointTint !== collectibleTint;
    const hazardContrastReadable = Boolean(
      groundFill &&
        hazardFill &&
        hazardFill !== groundFill,
    );

    bridge.forceStartStage(1);
    resetToGameScene();
    let turretState = bridge.getSession().getState();
    const variantTurret = turretState.stageRuntime.enemies.find((enemy) => enemy.kind === 'turret' && enemy.variant);
    if (!variantTurret?.turret || !variantTurret.supportPlatformId) {
      throw new Error('Expected biome-linked turret fixture for retro readability checks.');
    }
    variantTurret.turret.telegraphMs = Math.max(1, Math.floor(variantTurret.turret.telegraphDurationMs / 2));
    gameScene.syncView();
    const turretTelegraphReadable =
      gameScene.enemySprites.get(variantTurret.id)?.tintTopLeft !==
        gameScene.platformSprites.get(variantTurret.supportPlatformId)?.fillColor &&
      (gameScene.enemySprites.get(variantTurret.id)?.scaleX ?? 1) > 1;
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

    bridge.forceStartStage(2);
    resetToGameScene();
    let gravityFieldProbeState = bridge.getSession().getState();
    const antiGravStream = gravityFieldProbeState.stageRuntime.gravityFields.find(
      (field) => field.kind === 'anti-grav-stream',
    );
    const inversionColumn = gravityFieldProbeState.stageRuntime.gravityFields.find(
      (field) => field.kind === 'gravity-inversion-column',
    );
    const revealTrigger = gravityFieldProbeState.stageRuntime.revealVolumes[0];
    const hiddenPlatform = gravityFieldProbeState.stageRuntime.platforms.find((platform) => platform.reveal);
    const scannerTrigger = gravityFieldProbeState.stageRuntime.scannerVolumes.find((volume) => volume.id === 'sky-halo-scanner');
    const temporaryBridgePlatform = gravityFieldProbeState.stageRuntime.platforms.find((platform) => platform.id === 'sky-temporary-bridge-1');
    const timedRevealTrigger = gravityFieldProbeState.stageRuntime.revealVolumes.find((volume) => volume.id === 'sky-timed-route-trigger');
    const timedRevealRoute = gravityFieldProbeState.stage.secretRoutes?.find((route) => route.id === 'sky-halo-timed-secret-route');
    const haloCheckpoint = gravityFieldProbeState.stageRuntime.checkpoints.find((checkpoint) => checkpoint.id === 'cp-5');
    if (!antiGravStream || !inversionColumn || !haloCheckpoint) {
      throw new Error('Expected Halo Spire gravity field fixtures.');
    }
    const bridgeStateId = 'sky-temporary-bridge-1';
    const supportsRouteRect = (platform, rect) => {
      const overlap = Math.max(
        0,
        Math.min(rect.x + rect.width, platform.x + platform.width) - Math.max(rect.x, platform.x),
      );
      return overlap >= Math.min(rect.width * 0.55, platform.width) && Math.abs(rect.y + rect.height - platform.y) <= 24;
    };

    const gravityFieldVisuals = game.scene.getScene('game').getDebugSnapshot().gravityFieldVisuals;
    const gravityFieldRouteReadable = Boolean(
      antiGravStream &&
        inversionColumn &&
        antiGravStream.x < inversionColumn.x &&
        gravityFieldVisuals.find((field) => field.id === antiGravStream.id)?.visible &&
        gravityFieldVisuals.find((field) => field.id === inversionColumn.id)?.visible,
    );
    const gravityFieldCheckpointSafe = Boolean(
      haloCheckpoint &&
        !gravityFieldProbeState.stageRuntime.gravityFields.some((field) => {
          const paddedField = expandRect(field, 56);
          return (
            paddedField.x < haloCheckpoint.rect.x + haloCheckpoint.rect.width &&
            paddedField.x + paddedField.width > haloCheckpoint.rect.x &&
            paddedField.y < haloCheckpoint.rect.y + haloCheckpoint.rect.height &&
            paddedField.y + paddedField.height > haloCheckpoint.rect.y
          );
        }),
    );

    gravityFieldProbeState.player.x = antiGravStream.x + 40;
    gravityFieldProbeState.player.y = antiGravStream.y + 48;
    gravityFieldProbeState.player.vx = 0;
    gravityFieldProbeState.player.vy = 0;
    gravityFieldProbeState.player.onGround = false;
    gravityFieldProbeState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const antiGravState = bridge.getSession().getState();
    const antiGravStreamApplied =
      antiGravState.player.gravityFieldKind === 'anti-grav-stream' &&
      antiGravState.player.gravityScale < 0 &&
      antiGravState.player.vy < 0;
    antiGravState.progress.activePowers.dash = true;
    antiGravState.player.x = antiGravStream.x + 52;
    antiGravState.player.y = antiGravStream.y + 48;
    antiGravState.player.vx = 0;
    antiGravState.player.vy = 60;
    antiGravState.player.onGround = false;
    antiGravState.player.supportPlatformId = null;
    bridge.pressDash();
    bridge.consumeFrame(16);
    const gravityFieldDashState = bridge.getSession().getState();
    const gravityFieldDashSuppressed =
      gravityFieldDashState.player.dashTimerMs > 0 &&
      gravityFieldDashState.player.gravityFieldId === null &&
      gravityFieldDashState.player.gravityScale === 1;

    gravityFieldDashState.player.dashTimerMs = 0;
    gravityFieldDashState.player.x = inversionColumn.x + 36;
    gravityFieldDashState.player.y = inversionColumn.y + 52;
    gravityFieldDashState.player.vx = 0;
    gravityFieldDashState.player.vy = 0;
    gravityFieldDashState.player.onGround = false;
    gravityFieldDashState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const inversionState = bridge.getSession().getState();
    const gravityInversionApplied =
      inversionState.player.gravityFieldKind === 'gravity-inversion-column' &&
      inversionState.player.gravityScale < 0 &&
      inversionState.player.vy < 0;

    inversionState.player.x = inversionColumn.x + inversionColumn.width + 56;
    inversionState.player.y = inversionColumn.y + 52;
    inversionState.player.vx = 0;
    inversionState.player.vy = 0;
    inversionState.player.onGround = false;
    inversionState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const gravityFieldExitState = bridge.getSession().getState();
    const gravityFieldExitRestored =
      gravityFieldExitState.player.gravityFieldId === null &&
      gravityFieldExitState.player.gravityScale === 1 &&
      gravityFieldExitState.player.vy > 0;

    const hiddenInitiallyInactive = !gravityFieldExitState.stageRuntime.revealedPlatformIds.includes(hiddenPlatform.reveal.id);

    gravityFieldExitState.player.x = revealTrigger.x + 16;
    gravityFieldExitState.player.y = revealTrigger.y + 16;
    gravityFieldExitState.player.vx = 0;
    gravityFieldExitState.player.vy = 0;
    bridge.consumeFrame(16);
    const revealState = bridge.getSession().getState();
    const revealRouteUnlocked =
      hiddenInitiallyInactive && revealState.stageRuntime.revealedPlatformIds.includes(hiddenPlatform.reveal.id);

    const bridgeInitiallyInactive = !revealState.stageRuntime.temporaryBridges.find((bridge) => bridge.id === bridgeStateId).active;
    revealState.player.x = scannerTrigger.x + 16;
    revealState.player.y = scannerTrigger.y + 16;
    revealState.player.vx = 0;
    revealState.player.vy = 0;
    bridge.consumeFrame(16);
    const blockedActivationState = bridge.getSession().getState();
    const timedRevealActivationGuard =
      bridgeInitiallyInactive &&
      !blockedActivationState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).active;

    blockedActivationState.player.x = scannerTrigger.x - blockedActivationState.player.width - 24;
    blockedActivationState.player.y = scannerTrigger.y + 16;
    bridge.consumeFrame(16);

    const discoveryState = bridge.getSession().getState();
    discoveryState.player.x = timedRevealTrigger.x + 16;
    discoveryState.player.y = timedRevealTrigger.y + 16;
    discoveryState.player.vx = 0;
    discoveryState.player.vy = 0;
    bridge.consumeFrame(16);

    const timedRevealState = bridge.getSession().getState();
    const timedRevealDiscovered = timedRevealState.stageRuntime.revealedPlatformIds.includes(
      timedRevealState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).revealId,
    );
    const timedRevealSkipFallback = Boolean(
      timedRevealRoute &&
        timedRevealState.stageRuntime.platforms.some(
          (platform) => !platform.temporaryBridge && supportsRouteRect(platform, timedRevealRoute.mainPath),
        ) &&
        !timedRevealState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).active,
    );

    timedRevealState.player.x = scannerTrigger.x + 16;
    timedRevealState.player.y = scannerTrigger.y + 16;
    timedRevealState.player.vx = 0;
    timedRevealState.player.vy = 0;
    bridge.consumeFrame(16);
    const scannerActivationState = bridge.getSession().getState();
    const scannerBridgeActivated =
      bridgeInitiallyInactive &&
      scannerActivationState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).active &&
      scannerActivationState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).remainingMs ===
        scannerActivationState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).durationMs;
    const timedRevealActivated =
      scannerBridgeActivated &&
      scannerActivationState.stageRuntime.revealedPlatformIds.includes(
        scannerActivationState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).revealId,
      );

    bridge.consumeFrame(16);
    const scannerStayState = bridge.getSession().getState();
    const scannerBridgeNoStayRefresh =
      scannerStayState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).remainingMs <
      scannerStayState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).durationMs;

    scannerStayState.player.x = scannerTrigger.x - scannerStayState.player.width - 24;
    scannerStayState.player.y = scannerTrigger.y + 16;
    bridge.consumeFrame(16);

    const scannerLeaveState = bridge.getSession().getState();
    scannerLeaveState.player.x = scannerTrigger.x + scannerTrigger.width - 20;
    scannerLeaveState.player.y = scannerTrigger.y + 16;
    bridge.consumeFrame(16);

    const scannerReentryState = bridge.getSession().getState();
    const scannerBridgeReentryRefresh =
      scannerReentryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).remainingMs ===
      scannerReentryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).durationMs;

    const liveBridge = scannerReentryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId);
    liveBridge.remainingMs = 1;
    scannerReentryState.player.x = temporaryBridgePlatform.x + 24;
    scannerReentryState.player.y = temporaryBridgePlatform.y - scannerReentryState.player.height;
    scannerReentryState.player.vx = 0;
    scannerReentryState.player.vy = 0;
    scannerReentryState.player.onGround = true;
    scannerReentryState.player.supportPlatformId = liveBridge.id;
    bridge.consumeFrame(16);

    const occupiedExpiryState = bridge.getSession().getState();
    const heldBridgeSupport =
      occupiedExpiryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).active &&
      occupiedExpiryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).pendingHide;

    occupiedExpiryState.player.x = temporaryBridgePlatform.x + temporaryBridgePlatform.width + 36;
    occupiedExpiryState.player.y = temporaryBridgePlatform.y - occupiedExpiryState.player.height;
    occupiedExpiryState.player.onGround = true;
    occupiedExpiryState.player.supportPlatformId = liveBridge.id;
    bridge.consumeFrame(16);

    const releasedExpiryState = bridge.getSession().getState();
    const scannerBridgeOccupiedExpiry =
      heldBridgeSupport && !releasedExpiryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).active;
    const timedRevealReconnectionReady = Boolean(
      timedRevealRoute &&
        releasedExpiryState.stageRuntime.platforms.some(
          (platform) => !platform.temporaryBridge && supportsRouteRect(platform, timedRevealRoute.reconnect),
        ),
    );

    bridge.forceStartStage(2);
    resetToGameScene();
    let gravityFieldResetState = bridge.getSession().getState();
    gravityFieldResetState.player.x = haloCheckpoint.rect.x;
    gravityFieldResetState.player.y = haloCheckpoint.rect.y;
    gravityFieldResetState.player.vx = 0;
    gravityFieldResetState.player.vy = 0;
    bridge.consumeFrame(16);
    gravityFieldResetState = bridge.getSession().getState();
    gravityFieldResetState.player.x = antiGravStream.x + 40;
    gravityFieldResetState.player.y = antiGravStream.y + 48;
    gravityFieldResetState.player.vx = 0;
    gravityFieldResetState.player.vy = 0;
    gravityFieldResetState.player.onGround = false;
    gravityFieldResetState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    gravityFieldResetState = bridge.getSession().getState();
    gravityFieldResetState.player.health = 1;
    bridge.getSession().damagePlayer();
    bridge.getSession().respawnPlayer();
    gravityFieldResetState = bridge.getSession().getState();
    const gravityFieldResetConsistent =
      gravityFieldResetState.activeCheckpointId === 'cp-5' &&
      gravityFieldResetState.player.gravityFieldId === null &&
      gravityFieldResetState.player.gravityFieldKind === null &&
      gravityFieldResetState.player.gravityScale === 1 &&
      gravityFieldResetState.stageRuntime.gravityFields.length === 2;

    bridge.forceStartStage(0);
    resetToGameScene();
    let magneticState = bridge.getSession().getState();
    magneticState.stageRuntime.enemies = [];
    magneticState.stageRuntime.hazards = [];
    const magneticNode = magneticState.stageRuntime.activationNodes.find((node) => node.id === 'forest-magnetic-node-1');
    const magneticPlatform = magneticState.stageRuntime.platforms.find((platform) => platform.id === 'forest-magnetic-platform-1');
    const magneticFallback = magneticState.stageRuntime.platforms.find((platform) => platform.id === 'platform-9920-540');
    const magneticCheckpoint = magneticState.stageRuntime.checkpoints.find((checkpoint) => checkpoint.id === 'cp-5');
    if (!magneticNode || !magneticPlatform?.magnetic || !magneticFallback || !magneticCheckpoint) {
      throw new Error('Expected forest magnetic fixtures.');
    }
    const magneticScene = game.scene.getScene('game');
    magneticScene.syncView();
    const dormantMagneticVisual = magneticScene
      .getDebugSnapshot()
      .magneticPlatformVisuals.find((platform) => platform.id === magneticPlatform.id);
    const dormantNodeVisual = magneticScene
      .getDebugSnapshot()
      .activationNodeVisuals.find((node) => node.id === magneticNode.id);
    const magneticDormantVisible = Boolean(
      dormantMagneticVisual?.visible &&
        dormantNodeVisual?.visible &&
        dormantMagneticVisual.alpha < 1 &&
        dormantMagneticVisual.fillColor !== dormantNodeVisual.fillColor,
    );

    magneticState.player.x = magneticCheckpoint.rect.x;
    magneticState.player.y = magneticCheckpoint.rect.y;
    magneticState.player.vx = 0;
    magneticState.player.vy = 0;
    bridge.consumeFrame(16);

    magneticState = bridge.getSession().getState();
    magneticState.player.x = magneticNode.x + 2;
    magneticState.player.y = magneticNode.y + 2;
    magneticState.player.vx = 0;
    magneticState.player.vy = 0;
    magneticState.player.onGround = false;
    magneticState.player.supportPlatformId = null;
    bridge.consumeFrame(16);

    magneticState = bridge.getSession().getState();
    magneticScene.syncView();
    const poweredMagneticVisual = magneticScene
      .getDebugSnapshot()
      .magneticPlatformVisuals.find((platform) => platform.id === magneticPlatform.id);
    const poweredNodeVisual = magneticScene
      .getDebugSnapshot()
      .activationNodeVisuals.find((node) => node.id === magneticNode.id);
    const magneticNodeTriggered =
      magneticState.stageRuntime.activationNodes.find((node) => node.id === magneticNode.id)?.activated === true &&
      magneticState.stageRuntime.platforms.find((platform) => platform.id === magneticPlatform.id)?.magnetic?.powered === true;
    const magneticVisualDistinct = Boolean(
      dormantMagneticVisual &&
        poweredMagneticVisual &&
        poweredNodeVisual &&
        (poweredMagneticVisual.fillColor !== dormantMagneticVisual.fillColor ||
          poweredMagneticVisual.alpha > dormantMagneticVisual.alpha) &&
        poweredNodeVisual.fillColor !== dormantNodeVisual?.fillColor,
    );

    magneticState.player.x = magneticPlatform.x + 32;
    magneticState.player.y = magneticPlatform.y - magneticState.player.height - 4;
    magneticState.player.vx = 0;
    magneticState.player.vy = 220;
    magneticState.player.onGround = false;
    magneticState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    bridge.consumeFrame(16);

    magneticState = bridge.getSession().getState();
    const magneticPoweredSupport = magneticState.player.onGround && magneticState.player.supportPlatformId === magneticPlatform.id;

    magneticState.player.health = 1;
    bridge.getSession().damagePlayer();
    bridge.getSession().respawnPlayer();
    magneticState = bridge.getSession().getState();
    const magneticRespawnReset =
      magneticState.activeCheckpointId === 'cp-5' &&
      magneticState.stageRuntime.activationNodes.find((node) => node.id === magneticNode.id)?.activated === false &&
      magneticState.stageRuntime.platforms.find((platform) => platform.id === magneticPlatform.id)?.magnetic?.powered === false;

    magneticState.player.x = magneticFallback.x + 32;
    magneticState.player.y = magneticFallback.y - magneticState.player.height - 4;
    magneticState.player.vx = 0;
    magneticState.player.vy = 220;
    magneticState.player.onGround = false;
    magneticState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    bridge.consumeFrame(16);
    magneticState = bridge.getSession().getState();
    const magneticRetrySafeFallback =
      magneticState.player.onGround && magneticState.player.supportPlatformId === magneticFallback.id;

    bridge.getSession().restartStage();
    resetToGameScene();
    magneticState = bridge.getSession().getState();
    const magneticFreshAttemptReset =
      magneticState.stageRuntime.activationNodes.find((node) => node.id === magneticNode.id)?.activated === false &&
      magneticState.stageRuntime.platforms.find((platform) => platform.id === magneticPlatform.id)?.magnetic?.powered === false;

    bridge.forceStartStage(2);
    resetToGameScene();
    let surfaceProbeState = bridge.getSession().getState();
    surfaceProbeState.stageRuntime.enemies = [];
    const brittleSurface = surfaceProbeState.stageRuntime.terrainSurfaces.find((surface) => surface.kind === 'brittleCrystal');
    const stickySurface = surfaceProbeState.stageRuntime.terrainSurfaces.find((surface) => surface.kind === 'stickySludge');
    const brittleSupportPlatform = surfaceProbeState.stageRuntime.platforms.find((platform) => platform.id === brittleSurface.supportPlatformId);
    const stickySupportPlatform = surfaceProbeState.stageRuntime.platforms.find((platform) => platform.id === stickySurface.supportPlatformId);
    const normalSupportPlatform = surfaceProbeState.stageRuntime.platforms.find((platform) => platform.id === 'platform-8740-560');
    const surfaceScene = game.scene.getScene('game');
    surfaceScene.syncView();
    const surfaceVisuals = surfaceScene.getDebugSnapshot().terrainSurfaceVisuals;
    const brittleVisual = surfaceVisuals.find((surface) => surface.id === brittleSurface.id);
    const stickyVisual = surfaceVisuals.find((surface) => surface.id === stickySurface.id);
    const terrainSurfaceExtentsRendered =
      Boolean(brittleVisual?.visible) &&
      Boolean(stickyVisual?.visible) &&
      brittleVisual.x === brittleSurface.x &&
      brittleVisual.y === brittleSurface.y &&
      brittleVisual.width === brittleSurface.width &&
      brittleVisual.height === brittleSurface.height &&
      stickyVisual.x === stickySurface.x &&
      stickyVisual.y === stickySurface.y &&
      stickyVisual.width === stickySurface.width &&
      stickyVisual.height === stickySurface.height;

    surfaceProbeState.player.x = brittleSurface.x + 28 - surfaceProbeState.player.width / 2;
    surfaceProbeState.player.y = brittleSupportPlatform.y - surfaceProbeState.player.height;
    surfaceProbeState.player.vx = 0;
    surfaceProbeState.player.vy = 0;
    surfaceProbeState.player.onGround = true;
    surfaceProbeState.player.supportPlatformId = brittleSupportPlatform.id;
    surfaceProbeState.player.supportTerrainSurfaceId = brittleSurface.id;
    bridge.consumeFrame(16);
    let brittleState = bridge.getSession().getState();
    const brittleWarningTriggered =
      brittleState.stageRuntime.terrainSurfaces.find((surface) => surface.id === brittleSurface.id).brittle.phase === 'warning';
    brittleState.stageRuntime.terrainSurfaces.find((surface) => surface.id === brittleSurface.id).brittle.warningMs = 1;
    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.consumeFrame(16);
    bridge.setJumpHeld(false);
    brittleState = bridge.getSession().getState();
    const brittleEscapeJumpWorked =
      brittleState.player.vy < 0 &&
      brittleState.stageRuntime.terrainSurfaces.find((surface) => surface.id === brittleSurface.id).brittle.phase === 'broken';

    bridge.forceStartStage(2);
    resetToGameScene();
    surfaceProbeState = bridge.getSession().getState();
    surfaceProbeState.stageRuntime.enemies = [];
    surfaceProbeState.stageRuntime.terrainSurfaces = surfaceProbeState.stageRuntime.terrainSurfaces.filter(
      (surface) => surface.id !== stickySurface.id,
    );
    const brittleFreshAttemptReset =
      surfaceProbeState.stageRuntime.terrainSurfaces.find((surface) => surface.id === brittleSurface.id).brittle.phase === 'intact';

    surfaceProbeState.player.x = stickySurface.x + 28 - surfaceProbeState.player.width / 2;
    surfaceProbeState.player.y = stickySupportPlatform.y - surfaceProbeState.player.height;
    surfaceProbeState.player.vx = 0;
    surfaceProbeState.player.vy = 0;
    surfaceProbeState.player.onGround = true;
    surfaceProbeState.player.supportPlatformId = stickySupportPlatform.id;
    surfaceProbeState.player.supportTerrainSurfaceId = null;
    bridge.setRight(true);
    for (let index = 0; index < 5; index += 1) {
      bridge.consumeFrame(16);
    }
    const normalGroundSpeed = bridge.getSession().getState().player.vx;

    bridge.forceStartStage(2);
    resetToGameScene();
    surfaceProbeState = bridge.getSession().getState();
    surfaceProbeState.stageRuntime.enemies = [];
    surfaceProbeState.player.x = stickySurface.x + 28 - surfaceProbeState.player.width / 2;
    surfaceProbeState.player.y = stickySupportPlatform.y - surfaceProbeState.player.height;
    surfaceProbeState.player.vx = 0;
    surfaceProbeState.player.vy = 0;
    surfaceProbeState.player.onGround = true;
    surfaceProbeState.player.supportPlatformId = stickySupportPlatform.id;
    surfaceProbeState.player.supportTerrainSurfaceId = stickySurface.id;
    bridge.setRight(true);
    for (let index = 0; index < 5; index += 1) {
      bridge.consumeFrame(16);
    }
    const stickyGroundedSpeed = bridge.getSession().getState().player.vx;
    bridge.setRight(false);
    const stickyGroundedTraversalReduced = stickyGroundedSpeed < normalGroundSpeed;

    bridge.forceStartStage(2);
    resetToGameScene();
    surfaceProbeState = bridge.getSession().getState();
    surfaceProbeState.stageRuntime.enemies = [];
    surfaceProbeState.stageRuntime.terrainSurfaces = surfaceProbeState.stageRuntime.terrainSurfaces.filter(
      (surface) => surface.id !== stickySurface.id,
    );
    surfaceProbeState.player.x = stickySurface.x + 28 - surfaceProbeState.player.width / 2;
    surfaceProbeState.player.y = stickySupportPlatform.y - surfaceProbeState.player.height;
    surfaceProbeState.player.vx = 0;
    surfaceProbeState.player.vy = 0;
    surfaceProbeState.player.onGround = true;
    surfaceProbeState.player.supportPlatformId = stickySupportPlatform.id;
    surfaceProbeState.player.supportTerrainSurfaceId = null;
    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.consumeFrame(16);

    bridge.forceStartStage(2);
    resetToGameScene();
    surfaceProbeState = bridge.getSession().getState();
    surfaceProbeState.stageRuntime.enemies = [];
    surfaceProbeState.player.x = stickySurface.x + 28 - surfaceProbeState.player.width / 2;
    surfaceProbeState.player.y = stickySupportPlatform.y - surfaceProbeState.player.height;
    surfaceProbeState.player.vx = 0;
    surfaceProbeState.player.vy = 0;
    surfaceProbeState.player.onGround = true;
    surfaceProbeState.player.supportPlatformId = stickySupportPlatform.id;
    surfaceProbeState.player.supportTerrainSurfaceId = stickySurface.id;
    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.consumeFrame(16);
    bridge.setJumpHeld(false);
    const stickyAntiGravJumpState = bridge.getSession().getState();
    const stickyAntiGravJumpSequenced =
      stickyAntiGravJumpState.player.gravityFieldKind === 'anti-grav-stream' &&
      stickyAntiGravJumpState.player.vy > -640 &&
      stickyAntiGravJumpState.player.vy < 0;

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
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
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
        bouncePodLaunchWorked,
        gasVentLaunchWorked,
        hopperHighJump: hopperImpulses.length > 0 && hopperImpulses.every((impulse) => impulse >= 820),
        chargerWindup: chargerSawWindup,
        chargerCharged: chargerSawCharge,
        flyerMoved:
          Math.abs(flyerAfter.x - flyerStart.x) > 8 || Math.abs(flyerAfter.y - flyerStart.y) > 4,
        gravityFieldRouteReadable,
        antiGravStreamApplied,
        gravityInversionApplied,
        gravityFieldDashSuppressed,
        gravityFieldExitRestored,
        gravityFieldResetConsistent,
        gravityFieldCheckpointSafe,
        magneticDormantVisible,
        magneticNodeTriggered,
        magneticPoweredSupport,
        magneticVisualDistinct,
        magneticRespawnReset,
        magneticFreshAttemptReset,
        magneticRetrySafeFallback,
        revealRouteUnlocked,
        timedRevealActivationGuard,
        timedRevealDiscovered,
        timedRevealActivated,
        scannerBridgeActivated,
        scannerBridgeNoStayRefresh,
        scannerBridgeReentryRefresh,
        scannerBridgeOccupiedExpiry,
        timedRevealSkipFallback,
        timedRevealReconnectionReady,
        terrainSurfaceExtentsRendered,
        brittleWarningTriggered,
        brittleEscapeJumpWorked,
        brittleFreshAttemptReset,
        stickyGroundedTraversalReduced,
        stickyAntiGravJumpSequenced,
        powerVariantDistinct,
        routingInteractablesReadable,
        hazardContrastReadable,
        turretTelegraphReadable,
        turretVisibilityGated,
      },
    });

    bridge.forceStartStage(1);
    resetToGameScene();
    let secretRouteState = bridge.getSession().getState();
    const secretRoute = secretRouteState.stage.secretRoutes?.[0] ?? null;
    if (secretRoute) {
      const intersectsRect = (a, b) =>
        a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
      const rectContainsPoint = (rect, point) =>
        point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
      const enemyRect = (enemy) => ({
        x: enemy.position.x,
        y: enemy.position.y,
        width: enemy.kind === 'turret' ? 28 : 34,
        height: enemy.kind === 'turret' ? 38 : enemy.kind === 'flyer' ? 24 : 30,
      });
      const findSupport = (rect) => {
        const centerX = rect.x + rect.width / 2;
        const bottom = rect.y + rect.height;
        return (
          secretRouteState.stageRuntime.platforms
            .filter((platform) => centerX >= platform.x && centerX <= platform.x + platform.width && platform.y >= bottom)
            .sort((left, right) => left.y - right.y)[0] ?? null
        );
      };

      const cueSupport = findSupport(secretRoute.cue.rect);
      secretRouteState.player.x = secretRoute.cue.rect.x + 24;
      secretRouteState.player.y = (cueSupport?.y ?? secretRoute.cue.rect.y + secretRoute.cue.rect.height) - secretRouteState.player.height;
      secretRouteState.player.vx = 0;
      secretRouteState.player.vy = 0;
      secretRouteState.player.onGround = true;
      secretRouteState.player.supportPlatformId = cueSupport?.id ?? null;
      bridge.consumeFrame(16);

      let revealTriggered = true;
      if (secretRoute.cue.revealVolumeIds?.length) {
        const trigger = secretRouteState.stageRuntime.revealVolumes.find(
          (volume) => volume.id === secretRoute.cue.revealVolumeIds[0],
        );
        secretRouteState.player.x = trigger.x + 16;
        secretRouteState.player.y = trigger.y + 16;
        secretRouteState.player.vx = 0;
        secretRouteState.player.vy = 0;
        secretRouteState.player.onGround = false;
        secretRouteState.player.supportPlatformId = null;
        bridge.consumeFrame(16);
        const revealState = bridge.getSession().getState();
        revealTriggered = secretRoute.cue.revealPlatformIds.every((platformId) =>
          revealState.stageRuntime.revealedPlatformIds.includes(platformId),
        );
      }

      bridge.forceStartStage(1);
      resetToGameScene();
      secretRouteState = bridge.getSession().getState();
      const rewardCollectibleIds = [];
      for (const collectibleId of secretRoute.reward.collectibleIds) {
        const collectible = secretRouteState.stageRuntime.collectibles.find((entry) => entry.id === collectibleId);
        if (!collectible) {
          continue;
        }

        secretRouteState.player.x = collectible.position.x - secretRouteState.player.width / 2;
        secretRouteState.player.y = collectible.position.y - secretRouteState.player.height / 2;
        secretRouteState.player.vx = 0;
        secretRouteState.player.vy = 0;
        secretRouteState.player.onGround = false;
        secretRouteState.player.supportPlatformId = null;
        bridge.consumeFrame(16);
        if (bridge.getSession().getState().stageRuntime.collectibles.find((entry) => entry.id === collectibleId)?.collected) {
          rewardCollectibleIds.push(collectibleId);
        }
      }

      bridge.forceStartStage(1);
      resetToGameScene();
      secretRouteState = bridge.getSession().getState();
      const reconnectSupport = findSupport(secretRoute.reconnect);
      secretRouteState.player.x = secretRoute.reconnect.x + 12;
      secretRouteState.player.y = (reconnectSupport?.y ?? secretRoute.reconnect.y + secretRoute.reconnect.height) - secretRouteState.player.height;
      secretRouteState.player.vx = 0;
      secretRouteState.player.vy = 0;
      secretRouteState.player.onGround = true;
      secretRouteState.player.supportPlatformId = reconnectSupport?.id ?? null;
      bridge.setRight(true);
      for (let index = 0; index < 10; index += 1) {
        bridge.consumeFrame(16);
      }
      const reconnectState = bridge.getSession().getState();
      bridge.setRight(false);
      const reconnectProgressed = !reconnectState.player.dead && reconnectState.player.x > secretRoute.reconnect.x + 18;

      bridge.forceStartStage(1);
      resetToGameScene();
      secretRouteState = bridge.getSession().getState();
      const mainPathSupport = findSupport(secretRoute.mainPath);
      secretRouteState.player.x = secretRoute.mainPath.x + 12;
      secretRouteState.player.y = (mainPathSupport?.y ?? secretRoute.mainPath.y + secretRoute.mainPath.height) - secretRouteState.player.height;
      secretRouteState.player.vx = 0;
      secretRouteState.player.vy = 0;
      secretRouteState.player.onGround = true;
      secretRouteState.player.supportPlatformId = mainPathSupport?.id ?? null;
      bridge.setRight(true);
      for (let index = 0; index < 10; index += 1) {
        bridge.consumeFrame(16);
      }
      const skipState = bridge.getSession().getState();
      bridge.setRight(false);
      const skipMainRouteWorked = !skipState.player.dead && skipState.player.x > secretRoute.mainPath.x + 18;
      const rewardCollectibles = skipState.stage.collectibles.filter((collectible) =>
        secretRoute.reward.collectibleIds.includes(collectible.id),
      );
      const rewardBlocks = skipState.stage.rewardBlocks.filter((rewardBlock) =>
        secretRoute.reward.rewardBlockIds.includes(rewardBlock.id),
      );
      const rewardScore =
        rewardCollectibles.length +
        rewardBlocks.reduce(
          (total, rewardBlock) => total + (rewardBlock.reward.kind === 'coins' ? rewardBlock.reward.amount : 3),
          0,
        );
      const cueReadable = Boolean(cueSupport);
      const rewardInsidePocket =
        rewardCollectibles.every((collectible) => rectContainsPoint(secretRoute.interior, collectible.position)) &&
        rewardBlocks.every((rewardBlock) => intersectsRect(secretRoute.interior, rewardBlock));
      const reconnectSupported = Boolean(reconnectSupport);
      const mainPathSupported = Boolean(mainPathSupport);
      const reconnectSafe =
        !skipState.stage.hazards.some((hazard) => intersectsRect(expandRect(secretRoute.reconnect, 32), hazard.rect)) &&
        !skipState.stage.enemies.some((enemy) => intersectsRect(expandRect(secretRoute.reconnect, 44), enemyRect(enemy)));
      const primaryRouteReport = {
        id: secretRoute.id,
        title: secretRoute.title,
        cueReadable,
        rewardScore,
        rewardInsidePocket,
        reconnectSupported,
        mainPathSupported,
        reconnectSafe,
        downstreamReconnect: secretRoute.reconnect.x > secretRoute.entry.x + 120,
      };
      primaryRouteReport.passed =
        primaryRouteReport.cueReadable &&
        primaryRouteReport.rewardScore >= 3 &&
        primaryRouteReport.rewardInsidePocket &&
        primaryRouteReport.reconnectSupported &&
        primaryRouteReport.mainPathSupported &&
        primaryRouteReport.reconnectSafe &&
        primaryRouteReport.downstreamReconnect;
      const secretRouteSummary = {
        routeCount: 1,
        routeReports: [primaryRouteReport],
        passed: primaryRouteReport.passed,
      };

      results.push({
        stageName: 'Secret Route Checks',
        targetDurationMinutes: 0,
        stage: JSON.parse(JSON.stringify(skipState.stage)),
        checkpoint: {
          activatedId: 'secret-route',
          checkpointX: 0,
          respawnedX: 0,
          health: skipState.player.health,
        },
        readability: {
          segmentCount: 0,
          collectibleZones: [],
          maxCheckpointGap: 0,
          elevatedRoutePlatforms: 0,
          elevatedRouteRewards: 0,
          maxMainRouteThreatWindow: 0,
          optionalThreatCount: 0,
          segmentPass: true,
          collectiblePass: true,
          checkpointPass: true,
          routePass: true,
          encounterPass: true,
        },
        mechanics: { passed: true },
        secretRoutes: {
          ...secretRouteSummary,
          revealTriggered,
          rewardCollectibleIds,
          reconnectProgressed,
          skipMainRouteWorked,
          passed:
            secretRouteSummary.passed &&
            revealTriggered &&
            rewardCollectibleIds.length >= 2 &&
            reconnectProgressed &&
            skipMainRouteWorked,
        },
      });
    }

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
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
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
    page.on('pageerror', (error) => {
      console.error(`browser page error: ${error.message}`);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        console.error(`browser console error: ${message.text()}`);
      }
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const flowChecks = await collectFlowResults(page);
    const objectiveChecks = await collectObjectiveResults(page);
    const rawResults = await collectStageResults(page);
    const turretVariantChecks = buildTurretVariantCheck(rawResults);
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
        notes.push(mechanics.bouncePodLaunchWorked ? 'bounce pod route passed' : 'bounce pod route failed');
        notes.push(mechanics.gasVentLaunchWorked ? 'gas vent route passed' : 'gas vent route failed');
        notes.push(mechanics.hopperHighJump ? 'hopper jump height passed' : 'hopper jump height failed');
        notes.push(mechanics.chargerCharged ? 'charger state transition passed' : 'charger state transition failed');
        notes.push(mechanics.flyerMoved ? 'flyer patrol passed' : 'flyer patrol failed');
        notes.push(
          mechanics.gravityFieldRouteReadable
            ? 'Halo Spire gravity field route reads clearly in the live scene'
            : 'Halo Spire gravity field route readability failed in the live scene',
        );
        notes.push(
          mechanics.antiGravStreamApplied ? 'anti-grav stream acceleration passed' : 'anti-grav stream acceleration failed',
        );
        notes.push(
          mechanics.gravityInversionApplied
            ? 'gravity inversion column acceleration passed'
            : 'gravity inversion column acceleration failed',
        );
        notes.push(
          mechanics.gravityFieldDashSuppressed
            ? 'dash suppression over gravity fields passed'
            : 'dash suppression over gravity fields failed',
        );
        notes.push(
          mechanics.gravityFieldExitRestored
            ? 'gravity field exit restore passed'
            : 'gravity field exit restore failed',
        );
        notes.push(
          mechanics.gravityFieldResetConsistent
            ? 'gravity field reset consistency passed'
            : 'gravity field reset consistency failed',
        );
        notes.push(
          mechanics.gravityFieldCheckpointSafe
            ? 'gravity field checkpoint placement passed'
            : 'gravity field checkpoint placement failed',
        );
        notes.push(
          mechanics.magneticDormantVisible
            ? 'magnetic platform dormant presentation stayed visible in the live scene'
            : 'magnetic platform dormant presentation was not visible in the live scene',
        );
        notes.push(
          mechanics.magneticNodeTriggered
            ? 'activation node powered its linked magnetic platform'
            : 'activation node did not power its linked magnetic platform',
        );
        notes.push(
          mechanics.magneticPoweredSupport
            ? 'powered magnetic platform supported the player from above'
            : 'powered magnetic platform did not support the player from above',
        );
        notes.push(
          mechanics.magneticVisualDistinct
            ? 'magnetic dormant and powered visuals stayed distinct'
            : 'magnetic dormant and powered visuals were not distinct',
        );
        notes.push(
          mechanics.magneticRespawnReset
            ? 'magnetic power reset on checkpoint respawn'
            : 'magnetic power did not reset on checkpoint respawn',
        );
        notes.push(
          mechanics.magneticFreshAttemptReset
            ? 'magnetic power reset on fresh attempt restart'
            : 'magnetic power did not reset on fresh attempt restart',
        );
        notes.push(
          mechanics.magneticRetrySafeFallback
            ? 'magnetic route kept a retry-safe fallback surface after reset'
            : 'magnetic route lost its retry-safe fallback surface after reset',
        );
        notes.push(mechanics.revealRouteUnlocked ? 'reveal platform route passed' : 'reveal platform route failed');
        notes.push(
          mechanics.timedRevealActivationGuard
            ? 'timed-reveal scanner guard passed before discovery'
            : 'timed-reveal scanner guard failed before discovery',
        );
        notes.push(
          mechanics.timedRevealDiscovered ? 'timed-reveal discovery cue passed' : 'timed-reveal discovery cue failed',
        );
        notes.push(
          mechanics.timedRevealActivated ? 'timed-reveal activation ordering passed' : 'timed-reveal activation ordering failed',
        );
        notes.push(mechanics.scannerBridgeActivated ? 'scanner bridge activation passed' : 'scanner bridge activation failed');
        notes.push(mechanics.scannerBridgeNoStayRefresh ? 'scanner bridge stay-inside refresh guard passed' : 'scanner bridge stay-inside refresh guard failed');
        notes.push(mechanics.scannerBridgeReentryRefresh ? 'scanner bridge re-entry refresh passed' : 'scanner bridge re-entry refresh failed');
        notes.push(mechanics.scannerBridgeOccupiedExpiry ? 'scanner bridge occupied expiry passed' : 'scanner bridge occupied expiry failed');
        notes.push(
          mechanics.timedRevealSkipFallback
            ? 'timed-reveal skip fallback passed'
            : 'timed-reveal skip fallback failed',
        );
        notes.push(
          mechanics.timedRevealReconnectionReady
            ? 'timed-reveal reconnection remained safe'
            : 'timed-reveal reconnection was not ready',
        );
        notes.push(mechanics.terrainSurfaceExtentsRendered ? 'terrain surface extents render in the live scene' : 'terrain surface extents drift from the live scene');
        notes.push(mechanics.brittleWarningTriggered ? 'brittle floor warning passed' : 'brittle floor warning failed');
        notes.push(mechanics.brittleEscapeJumpWorked ? 'brittle escape jump passed' : 'brittle escape jump failed');
        notes.push(mechanics.brittleFreshAttemptReset ? 'brittle fresh-attempt reset passed' : 'brittle fresh-attempt reset failed');
        notes.push(mechanics.stickyGroundedTraversalReduced ? 'sticky grounded traversal penalty passed' : 'sticky grounded traversal penalty failed');
        notes.push(
          mechanics.stickyAntiGravJumpSequenced
            ? 'sticky anti-grav jump sequencing passed'
            : 'sticky anti-grav jump sequencing failed',
        );
        notes.push(
          mechanics.powerVariantDistinct ? 'power variants are visually distinct' : 'power variants are not visually distinct',
        );
        notes.push(
          mechanics.routingInteractablesReadable
            ? 'routing-critical interactables stay visually distinct against the flatter stage palette'
            : 'routing-critical interactables blend into the flatter stage palette',
        );
        notes.push(
          mechanics.hazardContrastReadable
            ? 'hazards keep reserved contrast against gameplay surfaces'
            : 'hazards lose contrast against gameplay surfaces',
        );
        notes.push(
          mechanics.turretTelegraphReadable
            ? 'turret telegraphs remain visually distinct before firing'
            : 'turret telegraphs are not visually distinct before firing',
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
            elevatedRoutePlatforms: 0,
            elevatedRouteRewards: 0,
            maxMainRouteThreatWindow: 0,
            optionalThreatCount: 0,
            segmentPass: true,
            collectiblePass: true,
            checkpointPass: true,
            routePass: true,
            encounterPass: true,
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
            elevatedRoutePlatforms: 0,
            elevatedRouteRewards: 0,
            maxMainRouteThreatWindow: 0,
            optionalThreatCount: 0,
            segmentPass: true,
            collectiblePass: true,
            checkpointPass: true,
            routePass: true,
            encounterPass: true,
          },
          checkpoint: { passed: true },
          safety: { passed: true },
          mechanics: { passed: true },
          blocks,
          flow: { passed: true },
          notes,
        };
      }

      if (result.stageName === 'Secret Route Checks') {
        const notes = [];
        const secretRoutes = result.secretRoutes;
        const primaryRoute = secretRoutes.routeReports[0];
        notes.push(secretRoutes.routeCount > 0 ? `${secretRoutes.routeCount} secret route authored` : 'no secret routes authored');
        notes.push(primaryRoute?.cueReadable ? 'discovery cue reads from the main route' : 'discovery cue is not readable');
        notes.push(secretRoutes.revealTriggered ? 'hidden bridge reveal probe passed' : 'hidden bridge reveal probe failed');
        notes.push(
          secretRoutes.rewardCollectibleIds.length >= 2
            ? `optional sample payoff reached ${secretRoutes.rewardCollectibleIds.length} collectible rewards`
            : 'optional sample payoff was not collected reliably',
        );
        notes.push(primaryRoute?.reconnectSafe ? 'downstream reconnection remained safe' : 'downstream reconnection felt unsafe');
        notes.push(secretRoutes.reconnectProgressed ? 'reconnection probe advanced downstream' : 'reconnection probe stalled');
        notes.push(secretRoutes.skipMainRouteWorked ? 'main route skip probe stayed completable' : 'main route skip probe stalled');

        return {
          stageName: result.stageName,
          targetDurationMinutes: 0,
          estimatedMinutes: 0,
          readability: {
            segmentCount: 0,
            collectibleZones: [],
            maxCheckpointGap: 0,
            elevatedRoutePlatforms: 0,
            elevatedRouteRewards: 0,
            maxMainRouteThreatWindow: 0,
            optionalThreatCount: 0,
            segmentPass: true,
            collectiblePass: true,
            checkpointPass: true,
            routePass: true,
            encounterPass: true,
          },
          checkpoint: { passed: true },
          safety: { passed: true },
          mechanics: { passed: true },
          flow: { passed: true },
          secretRoutes,
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
      notes.push(
        readability.routePass
          ? `${readability.elevatedRoutePlatforms} elevated route anchors and ${readability.elevatedRouteRewards} elevated rewards support optional detours`
          : `optional route coverage is thin (${readability.elevatedRoutePlatforms} anchors, ${readability.elevatedRouteRewards} rewards)`,
      );
      notes.push(
        readability.encounterPass
          ? `main-route late windows peak at ${readability.maxMainRouteThreatWindow} threats while ${readability.optionalThreatCount} optional threats stay off the critical path`
          : `late-route threat density is too high (${readability.maxMainRouteThreatWindow}) or optional pressure is missing (${readability.optionalThreatCount})`,
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

    const mechanicChecks = results.find((result) => result.stageName === 'Mechanic Checks');
    const retroMechanics = mechanicChecks?.mechanics ?? { passed: false };

    results.push({
      stageName: 'Retro Presentation Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: {
        powerVariantDistinct: retroMechanics.powerVariantDistinct === true,
        routingInteractablesReadable: retroMechanics.routingInteractablesReadable === true,
        hazardContrastReadable: retroMechanics.hazardContrastReadable === true,
        turretTelegraphReadable: retroMechanics.turretTelegraphReadable === true,
        passed:
          retroMechanics.powerVariantDistinct === true &&
          retroMechanics.routingInteractablesReadable === true &&
          retroMechanics.hazardContrastReadable === true &&
          retroMechanics.turretTelegraphReadable === true,
      },
      flow: { passed: true },
      notes: [
        retroMechanics.powerVariantDistinct === true
          ? 'player power variants remain distinct through silhouette and accent changes'
          : 'player power variants do not remain distinct through silhouette and accent changes',
        retroMechanics.routingInteractablesReadable === true
          ? 'routing-critical interactables stay distinct against the flatter gameplay palette'
          : 'routing-critical interactables blend into the flatter gameplay palette',
        retroMechanics.hazardContrastReadable === true
          ? 'hazards keep reserved contrast against gameplay surfaces'
          : 'hazards lose reserved contrast against gameplay surfaces',
        retroMechanics.turretTelegraphReadable === true
          ? 'turret telegraphs stay visually distinct before firing'
          : 'turret telegraphs do not stay visually distinct before firing',
      ],
    });

    results.push({
      stageName: 'Turret Variant Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: true },
      flow: { passed: turretVariantChecks.passed },
      turretVariantChecks,
      notes: turretVariantChecks.variantReports.flatMap((report) => [
        `${report.stageName}: ${report.variant} teaching beat ${report.teachingId ?? 'missing'} ${report.teachingIsolated ? 'stays isolated' : 'has nearby forced pressure'}`,
        `${report.stageName}: ${report.variant} teaching foothold ${report.teachingFoothold ? 'stays readable' : 'is missing a clear approach foothold'}`,
        `${report.stageName}: ${report.variant} mixed reuse ${report.mixedId ?? 'missing'} ${report.mixedPressure ? 'includes later pressure' : 'does not show later mixed pressure'}`,
        `${report.stageName}: ${report.variant} mixed foothold ${report.mixedFoothold ? 'preserves a response window' : 'compresses the response window too far'}`,
      ]),
    });

    results.push({
      stageName: 'Objective Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: true },
      flow: { passed: objectiveChecks.passed },
      objectiveChecks,
      notes: [
        objectiveChecks.briefingShown ? 'objective briefing appeared on stage start' : 'objective briefing missing on stage start',
        objectiveChecks.incompleteExitBlocked ? 'incomplete objective blocked exit completion' : 'incomplete objective did not block exit completion',
        objectiveChecks.objectiveCompleted ? 'relay objective activation completed in-stage' : 'relay objective activation failed',
        objectiveChecks.completedExitCleared ? 'completed objective allowed exit clear' : 'completed objective did not allow exit clear',
      ],
    });

    results.push({
      stageName: 'Flow Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
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
        mainMenuRetroStyle: flowChecks.mainMenuRetroStyle,
        mainHelpLargerPanelVisible: flowChecks.mainHelpLargerPanelVisible,
        mainHelpScrollVisible: flowChecks.mainHelpScrollVisible,
        mainHelpKeyboardScrollWorked: flowChecks.mainHelpKeyboardScrollWorked,
        mainHelpWheelScrollWorked: flowChecks.mainHelpWheelScrollWorked,
        mainHelpClippingVerified: flowChecks.mainHelpClippingVerified,
        introStatusVisible: flowChecks.introStatusVisible,
        completeStatusVisible: flowChecks.completeStatusVisible,
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
          flowChecks.mainMenuRetroStyle &&
          flowChecks.mainHelpLargerPanelVisible &&
          flowChecks.mainHelpScrollVisible &&
          flowChecks.mainHelpKeyboardScrollWorked &&
          flowChecks.mainHelpWheelScrollWorked &&
          flowChecks.mainHelpClippingVerified &&
          flowChecks.introVisible &&
          flowChecks.introStatusVisible &&
          flowChecks.completeStatusVisible &&
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
        flowChecks.mainMenuRetroStyle ? 'main menu retro style passed' : 'main menu retro style failed',
        flowChecks.mainHelpLargerPanelVisible ? 'main help panel sizing passed' : 'main help panel sizing failed',
        flowChecks.mainHelpScrollVisible ? 'main help scrollbar appeared for overflow' : 'main help scrollbar missing',
        flowChecks.mainHelpKeyboardScrollWorked ? 'main help keyboard scroll passed' : 'main help keyboard scroll failed',
        flowChecks.mainHelpWheelScrollWorked ? 'main help wheel scroll passed' : 'main help wheel scroll failed',
        flowChecks.mainHelpClippingVerified ? 'main help viewport clipping passed' : 'main help viewport clipping failed',
        flowChecks.introVisible ? 'stage intro scene appeared' : 'stage intro scene missing',
        flowChecks.introStatusVisible ? 'intro status summary passed' : 'intro status summary failed',
        flowChecks.completeStatusVisible ? 'results summary uses astronaut naming' : 'results summary uses stale naming',
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
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
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
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
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
        !result.readability.routePass ||
        !result.readability.encounterPass ||
        !result.checkpoint.passed ||
        !result.safety.passed ||
        result.blockSpacing?.passed === false ||
        result.blocks?.passed === false ||
        result.rewardLockCoverage?.passed === false ||
        result.staticLayoutCoverage?.passed === false ||
        result.secretRoutes?.passed === false ||
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
