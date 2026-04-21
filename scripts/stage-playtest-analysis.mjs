const CHANGE_RESULT_SCOPE = {
  'activation-node-magnetic-platforms': new Set(['Mechanic Checks']),
  'fold-terrain-into-platform-variants': new Set(['Terrain Variant Stage Checks']),
  'replace-synth-music-with-free-space-tracks': new Set(['Audio Asset Checks', 'Flow Checks']),
  'deepen-stage-and-menu-composition': new Set(['Audio Composition Checks', 'Flow Checks']),
  'expand-chiptune-audio-coverage': new Set(['Flow Checks']),
  'strengthen-8bit-audio-identity': new Set(['Flow Checks']),
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
  'stage-background-foreground-separation': new Set(['Retro Presentation Checks']),
  'eightbit-presentation-and-audio-polish': new Set(['Retro Presentation Checks', 'Audio Asset Checks', 'Flow Checks']),
  'remove-music-and-add-entity-animations': new Set(['Audio Asset Checks', 'Flow Checks', 'Retro Motion Checks']),
  'stage-variation-and-death-animation-pass': new Set([
    'Verdant Impact Crater',
    'Ember Rift Warrens',
    'Halo Spire Array',
    'Mechanic Checks',
    'Retro Motion Checks',
    'Flow Checks',
  ]),
  'terrain-visual-distinction-and-rollout': new Set([
    'Verdant Impact Crater',
    'Ember Rift Warrens',
    'Halo Spire Array',
    'Mechanic Checks',
  ]),
  'enclosed-gravity-room-sections': new Set(['Mechanic Checks']),
  'gravity-room-door-reposition-no-new-platforms': new Set(['Mechanic Checks']),
};

export function estimateMinutes(stage) {
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

export function analyzeReadability(stage) {
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

export function analyzeTerrainRollout(stage) {
  const centerX = (platform) => platform.x + platform.width / 2;
  const beatForPlatform = (platform) =>
    stage.segments.find((segment) => centerX(platform) >= segment.startX && centerX(platform) <= segment.endX)?.id ?? 'unmapped';
  const brittle = stage.platforms.filter((platform) => platform.terrainVariant === 'brittleCrystal');
  const sticky = stage.platforms.filter((platform) => platform.terrainVariant === 'stickySludge');
  const brittleBeats = [...new Set(brittle.map(beatForPlatform))];
  const stickyBeats = [...new Set(sticky.map(beatForPlatform))];

  return {
    brittleCount: brittle.length,
    stickyCount: sticky.length,
    brittleBeats,
    stickyBeats,
    minimumsPassed: brittle.length >= 2 && sticky.length >= 2,
    beatCoveragePassed: brittleBeats.length >= 2 && stickyBeats.length >= 2,
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

export function analyzeBlockSpacing(stage) {
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

export function analyzeSafety(stage) {
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

export function buildTurretVariantCheck(rawResults) {
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

export function checkpointReport(result) {
  return {
    activatedId: result.activatedId,
    checkpointX: result.checkpointX,
    respawnedX: result.respawnedX,
    health: result.health,
    passed: Math.abs(result.checkpointX - result.respawnedX) <= 20 && result.health === 3,
  };
}

export function mechanicReport(result) {
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
    gravityRoomRolloutComplete: result.gravityRoomRolloutComplete,
    gravityRoomButtonsReachable: result.gravityRoomButtonsReachable,
    gravityRoomWallsBlockOutsideDoors: result.gravityRoomWallsBlockOutsideDoors,
    gravityCapsuleDormantVisible: result.gravityCapsuleDormantVisible,
    gravityCapsuleRouteContained: result.gravityCapsuleRouteContained,
    gravityCapsuleActivationTriggered: result.gravityCapsuleActivationTriggered,
    gravityFieldRouteReadable: result.gravityFieldRouteReadable,
    antiGravStreamApplied: result.antiGravStreamApplied,
    gravityInversionApplied: result.gravityInversionApplied,
    gravityFieldDashSuppressed: result.gravityFieldDashSuppressed,
    gravityFieldExitRestored: result.gravityFieldExitRestored,
    gravityFieldResetConsistent: result.gravityFieldResetConsistent,
    gravityCapsuleResetConsistent: result.gravityCapsuleResetConsistent,
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
    terrainSurfaceCueShapesVisible: result.terrainSurfaceCueShapesVisible,
    brittleWarningTriggered: result.brittleWarningTriggered,
    brittleWarningVisualStrengthened: result.brittleWarningVisualStrengthened,
    brittleEscapeJumpWorked: result.brittleEscapeJumpWorked,
    brittleBrokenVisualDistinct: result.brittleBrokenVisualDistinct,
    brittleFreshAttemptReset: result.brittleFreshAttemptReset,
    stickyGroundedTraversalReduced: result.stickyGroundedTraversalReduced,
    stickyMotionCueVisible: result.stickyMotionCueVisible,
    stickyAntiGravJumpSequenced: result.stickyAntiGravJumpSequenced,
    powerVariantDistinct: result.powerVariantDistinct,
    backdropRouteSeparationReadable: result.backdropRouteSeparationReadable,
    authoredBackdropResponsive: result.authoredBackdropResponsive,
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
      result.gravityRoomRolloutComplete &&
      result.gravityRoomButtonsReachable &&
      result.gravityRoomWallsBlockOutsideDoors &&
      result.gravityCapsuleDormantVisible &&
      result.gravityCapsuleRouteContained &&
      result.gravityCapsuleActivationTriggered &&
      result.gravityFieldRouteReadable &&
      result.antiGravStreamApplied &&
      result.gravityInversionApplied &&
      result.gravityFieldDashSuppressed &&
      result.gravityFieldExitRestored &&
      result.gravityFieldResetConsistent &&
      result.gravityCapsuleResetConsistent &&
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
      result.terrainSurfaceCueShapesVisible &&
      result.brittleWarningTriggered &&
      result.brittleWarningVisualStrengthened &&
      result.brittleEscapeJumpWorked &&
      result.brittleBrokenVisualDistinct &&
      result.brittleFreshAttemptReset &&
      result.stickyGroundedTraversalReduced &&
      result.stickyMotionCueVisible &&
      result.stickyAntiGravJumpSequenced &&
      result.powerVariantDistinct &&
      result.backdropRouteSeparationReadable &&
      result.authoredBackdropResponsive &&
      result.routingInteractablesReadable &&
      result.hazardContrastReadable &&
      result.turretTelegraphReadable &&
      result.turretVisibilityGated,
  };
}

export function blockReport(result) {
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

export function rewardLockCoverageReport() {
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

export function staticLayoutCoverageReport() {
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

export function analyzeSecretRoutes(stage) {
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

export function buildMarkdown(results, changeName) {
  const lines = [
    '# Stage Playtest Report',
    '',
    `Automated browser-assisted validation for \`${changeName}\`.`,
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

export function scopeResultsForChange(results, changeName) {
  const scopedNames = CHANGE_RESULT_SCOPE[changeName];
  if (!scopedNames) {
    return results;
  }

  return results.filter((result) => scopedNames.has(result.stageName));
}