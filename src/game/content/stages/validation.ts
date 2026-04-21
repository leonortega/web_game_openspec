import type { StageDefinition, EnemyDefinition, PlatformDefinition, RewardBlockDefinition, SecretRouteDefinition } from './types';
import type { Rect, TerrainSurfaceKind, TurretVariantId } from '../../simulation/state';
import type { StageAudioThemeMetadata } from '../../../audio/audioContract';
import { GRAVITY_FIELD_KINDS, LAUNCHER_KINDS, TURRET_VARIANT_CONFIG } from '../../simulation/state';
import {
  enemyRect,
  expandRect,
  findExitSupport,
  findGravityCapsuleEntryDoorApproach,
  findGravityCapsuleExitDoorInteriorAccess,
  findGravityCapsuleExitDoorReconnect,
  findSupportBelowSpan,
  findTraversableSupport,
  gravityCapsuleContentEntries,
  gravityCapsuleDoorSupportsReuseRoute,
  gravityCapsuleDoorSupportRect,
  gravityCapsuleHasBlockingShellWalls,
  gravityCapsuleInteriorEntriesByKind,
  gravityCapsuleRectCrossesSealedShellBoundary,
  gravityCapsuleUsesSideWallDoors,
  intersectsRect,
  isRectWithinRect,
  isRectWithinWorld,
  rectContainsPoint,
} from './builders';

const GROUND_STOMP_ENEMY_KINDS: EnemyDefinition['kind'][] = ['walker', 'hopper', 'charger'];
const IMMEDIATE_ROUTE_ENEMY_KINDS: EnemyDefinition['kind'][] = ['walker', 'hopper', 'charger', 'turret'];
const POWER_PICKUP_ESCAPE_DISTANCE = 150;
const POWER_PICKUP_SUPPORT_GAP = 56;
const POWER_PICKUP_SUPPORT_HEIGHT_TOLERANCE = 96;
const SECRET_ROUTE_MIN_REWARD_SCORE = 3;
const LAUNCHER_MAX_DIRECTION_RADIANS = (25 * Math.PI) / 180;
const MAIN_STAGE_IDS = ['forest-ruins', 'amber-cavern', 'sky-sanctum'] as const;
const MAIN_STAGE_TERRAIN_KINDS = ['brittleCrystal', 'stickySludge'] as const;
const MAIN_STAGE_TERRAIN_MINIMUM = 2;
const HALO_SPIRE_ARRAY_STAGE_ID = 'sky-sanctum';
const GRAVITY_FIELD_CHECKPOINT_CLEARANCE = 56;
const MAGNETIC_PLATFORM_STAGE_ID = 'forest-ruins';
const MAGNETIC_NODE_MAX_HORIZONTAL_DISTANCE = 240;
const MAGNETIC_NODE_MAX_VERTICAL_DISTANCE = 180;
const MAGNETIC_ROUTE_FALLBACK_MAX_DROP = 240;
const CURRENT_GRAVITY_ROOM_FLOW_IDS = new Set([
  'forest-anti-grav-canopy-room',
  'amber-inversion-smelter-room',
  'sky-anti-grav-capsule',
  'sky-gravity-inversion-capsule',
]);
const CURRENT_GRAVITY_ROOM_ENTRY_MAX_RATIO = 0.35;
const CURRENT_GRAVITY_ROOM_EXIT_MIN_RATIO = 0.65;

const rectCenterX = (rect: Rect): number => rect.x + rect.width / 2;
const rectBottom = (rect: Rect): number => rect.y + rect.height;

const gravityCapsuleRelativeCenterX = (capsule: StageDefinition['gravityCapsules'][number], x: number): number =>
  (x - capsule.shell.x) / capsule.shell.width;

const rectOverlapsY = (left: Rect, right: Rect): boolean => left.y < right.y + right.height && left.y + left.height > right.y;

const pathReadsFromLeftWall = (capsule: StageDefinition['gravityCapsules'][number], path: Rect): boolean =>
  path.x < capsule.shell.x &&
  path.x + path.width >= capsule.shell.x &&
  path.x + path.width <= capsule.shell.x + capsule.entryDoor.width &&
  path.y < capsule.shell.y + capsule.shell.height &&
  rectBottom(path) > capsule.shell.y + 16;

const pathReadsFromRightWall = (capsule: StageDefinition['gravityCapsules'][number], path: Rect): boolean => {
  const shellRight = capsule.shell.x + capsule.shell.width;
  return (
    path.x <= shellRight &&
    path.x >= shellRight - capsule.exitDoor.width &&
    path.x + path.width > shellRight &&
    path.y < capsule.shell.y + capsule.shell.height &&
    rectBottom(path) > capsule.shell.y + 16
  );
};

const supportReadsFromLeftSide = (capsule: StageDefinition['gravityCapsules'][number], support: Rect): boolean =>
  support.x < capsule.shell.x && rectBottom(support) > capsule.shell.y + 16;

const supportReadsFromRightSide = (capsule: StageDefinition['gravityCapsules'][number], support: Rect): boolean =>
  support.x + support.width > capsule.shell.x + capsule.shell.width && rectBottom(support) > capsule.shell.y + 16;

const currentGravityRoomFlowReadsWrong = (stage: StageDefinition, capsule: StageDefinition['gravityCapsules'][number]): boolean => {
  if (!CURRENT_GRAVITY_ROOM_FLOW_IDS.has(capsule.id)) {
    return false;
  }

  const doorSupports = capsule.doorSupports;
  if (!doorSupports) {
    return true;
  }

  const entryDoorRatio = gravityCapsuleRelativeCenterX(capsule, rectCenterX(capsule.entryDoor));
  const exitDoorRatio = gravityCapsuleRelativeCenterX(capsule, rectCenterX(capsule.exitDoor));
  const shellMidX = capsule.shell.x + capsule.shell.width / 2;
  const shellRight = capsule.shell.x + capsule.shell.width;
  const shellBottom = capsule.shell.y + capsule.shell.height;
  const buttonCenterX = rectCenterX(capsule.button);
  const entrySupport = stage.platforms.find((platform) => platform.id === doorSupports.entryApproachPlatformId) ?? null;
  const exitInteriorSupport = stage.platforms.find((platform) => platform.id === doorSupports.exitInteriorPlatformId) ?? null;
  const exitReconnectSupport = stage.platforms.find((platform) => platform.id === doorSupports.exitReconnectPlatformId) ?? null;
  const entrySupportRect = entrySupport ? gravityCapsuleDoorSupportRect(entrySupport) : null;
  const exitInteriorSupportRect = exitInteriorSupport ? gravityCapsuleDoorSupportRect(exitInteriorSupport) : null;
  const exitReconnectSupportRect = exitReconnectSupport ? gravityCapsuleDoorSupportRect(exitReconnectSupport) : null;

  return (
    !gravityCapsuleUsesSideWallDoors(capsule) ||
    entryDoorRatio > CURRENT_GRAVITY_ROOM_ENTRY_MAX_RATIO ||
    exitDoorRatio < CURRENT_GRAVITY_ROOM_EXIT_MIN_RATIO ||
    buttonCenterX <= capsule.entryDoor.x + capsule.entryDoor.width ||
    buttonCenterX >= capsule.exitDoor.x ||
    capsule.entryDoor.x + capsule.entryDoor.width > shellMidX ||
    capsule.exitDoor.x < shellMidX ||
    capsule.entryDoor.y + capsule.entryDoor.height >= shellBottom ||
    capsule.exitDoor.y + capsule.exitDoor.height >= shellBottom ||
    doorSupports.entryApproachPlatformId === doorSupports.exitInteriorPlatformId ||
    doorSupports.entryApproachPlatformId === doorSupports.exitReconnectPlatformId ||
    !pathReadsFromLeftWall(capsule, doorSupports.entryApproachPath) ||
    !pathReadsFromRightWall(capsule, doorSupports.exitReconnectPath) ||
    doorSupports.entryApproachPath.x + doorSupports.entryApproachPath.width > shellMidX ||
    doorSupports.exitReconnectPath.x < shellMidX ||
    !entrySupport ||
    !exitInteriorSupport ||
    !exitReconnectSupport ||
    !entrySupportRect ||
    !exitInteriorSupportRect ||
    !exitReconnectSupportRect ||
    !supportReadsFromLeftSide(capsule, entrySupportRect) ||
    !supportReadsFromRightSide(capsule, exitReconnectSupportRect) ||
    rectCenterX(entrySupportRect) >= shellMidX ||
    rectCenterX(exitReconnectSupportRect) <= shellMidX ||
    rectCenterX(exitInteriorSupportRect) <= shellMidX ||
    rectOverlapsY(doorSupports.entryApproachPath, capsule.entryDoor) === false && doorSupports.entryApproachPath.y < capsule.shell.y ||
    rectOverlapsY(doorSupports.exitReconnectPath, capsule.exitDoor) === false && doorSupports.exitReconnectPath.y < capsule.shell.y ||
    shellRight !== capsule.exitDoor.x + capsule.exitDoor.width
  );
};

const isImmediateContinuationSupport = (
  blockSupport: PlatformDefinition,
  candidateSupport: PlatformDefinition,
): boolean => {
  if (blockSupport.id === candidateSupport.id) {
    return true;
  }

  const horizontalGap =
    candidateSupport.x > blockSupport.x + blockSupport.width
      ? candidateSupport.x - (blockSupport.x + blockSupport.width)
      : blockSupport.x > candidateSupport.x + candidateSupport.width
        ? blockSupport.x - (candidateSupport.x + candidateSupport.width)
        : 0;

  return (
    horizontalGap <= POWER_PICKUP_SUPPORT_GAP &&
    Math.abs(candidateSupport.y - blockSupport.y) <= POWER_PICKUP_SUPPORT_HEIGHT_TOLERANCE
  );
};

const isBlockingRectAheadOfRewardBlock = (
  block: RewardBlockDefinition,
  rect: Rect,
): boolean => {
  const blockRight = block.x + block.width;
  const forwardGap = rect.x - blockRight;
  return rect.x >= block.x - 16 && forwardGap <= POWER_PICKUP_ESCAPE_DISTANCE && rect.x + rect.width > block.x;
};

const isBlockingHazardRoute = (
  stage: StageDefinition,
  block: RewardBlockDefinition,
  blockSupport: PlatformDefinition,
): boolean =>
  stage.hazards.some((hazard) => {
    const hazardSupport = findSupportBelowSpan(stage.platforms, hazard.rect.x, hazard.rect.width, hazard.rect.y + hazard.rect.height);
    if (!hazardSupport || !isImmediateContinuationSupport(blockSupport, hazardSupport)) {
      return false;
    }

    return isBlockingRectAheadOfRewardBlock(block, hazard.rect);
  });

const isBlockingEnemyRoute = (
  stage: StageDefinition,
  block: RewardBlockDefinition,
  blockSupport: PlatformDefinition,
): boolean =>
  stage.enemies.some((enemy) => {
    if (!IMMEDIATE_ROUTE_ENEMY_KINDS.includes(enemy.kind)) {
      return false;
    }

    const enemyBounds = enemyRect(enemy);
    if (!isBlockingRectAheadOfRewardBlock(block, enemyBounds)) {
      return false;
    }

    const enemySupport = findSupportBelowSpan(stage.platforms, enemyBounds.x, enemyBounds.width, enemyBounds.y + enemyBounds.height);
    return Boolean(enemySupport && isImmediateContinuationSupport(blockSupport, enemySupport));
  });

const isRewardBlockLockedByEnemy = (stage: StageDefinition, block: RewardBlockDefinition): boolean => {
  const blockSupport = findSupportBelowSpan(stage.platforms, block.x, block.width, block.y + block.height);
  if (!blockSupport) {
    return false;
  }

  return stage.enemies.some((enemy) => {
    if (!GROUND_STOMP_ENEMY_KINDS.includes(enemy.kind)) {
      return false;
    }

    const enemyBounds = enemyRect(enemy);
    const enemySupport = findSupportBelowSpan(stage.platforms, enemyBounds.x, enemyBounds.width, enemyBounds.y + enemyBounds.height);
    if (!enemySupport || enemySupport.id !== blockSupport.id) {
      return false;
    }

    const horizontalOverlap = Math.min(block.x + block.width, enemyBounds.x + enemyBounds.width) - Math.max(block.x, enemyBounds.x);
    const verticalGap = Math.abs(block.y + block.height - enemyBounds.y);
    return horizontalOverlap > 0 && verticalGap <= 96;
  });
};

const isRewardBlockForcedHitRoute = (stage: StageDefinition, block: RewardBlockDefinition): boolean => {
  const blockSupport = findSupportBelowSpan(stage.platforms, block.x, block.width, block.y + block.height);
  if (!blockSupport) {
    return false;
  }

  return isBlockingEnemyRoute(stage, block, blockSupport) || isBlockingHazardRoute(stage, block, blockSupport);
};

const validateRewardBlocks = (stage: StageDefinition): StageDefinition => {
  const lockedBlocks = stage.rewardBlocks.filter((block) => isRewardBlockLockedByEnemy(stage, block));
  const forcedHitBlocks = stage.rewardBlocks.filter((block) => isRewardBlockForcedHitRoute(stage, block));
  if (lockedBlocks.length > 0) {
    throw new Error(
      `Reward blocks cannot sit over stompable grounded enemies: ${lockedBlocks.map((block) => block.id).join(', ')}`,
    );
  }
  if (forcedHitBlocks.length > 0) {
    throw new Error(
      `Reward block routes cannot force immediate enemy damage after pickup: ${forcedHitBlocks
        .map((block) => block.id)
        .join(', ')}`,
    );
  }

  const hasPhraseMetadata = (phrase: StageAudioThemeMetadata['transitionPhrases']['intro']): boolean =>
    phrase.label.trim().length > 0 && phrase.signature.trim().length > 0 && phrase.relationship.trim().length > 0;

  const audioMetadata = stage.audio;
  if (audioMetadata.themeId.trim().length === 0 || audioMetadata.signature.trim().length === 0) {
    throw new Error(`Stage audio metadata must declare a transition theme and signature: ${stage.id}`);
  }

  if (
    !hasPhraseMetadata(audioMetadata.transitionPhrases.intro) ||
    !hasPhraseMetadata(audioMetadata.transitionPhrases.clear) ||
    !hasPhraseMetadata(audioMetadata.transitionPhrases.final)
  ) {
    throw new Error(`Stage audio metadata must declare intro, clear, and final transition labels and relationships: ${stage.id}`);
  }

  return stage;
};

const authoredStaticElements = (
  stage: StageDefinition,
): { id: string; rect: Rect; category: 'activationNode' | 'checkpoint' | 'collectible' | 'rewardBlock' | 'exit' }[] => [
  ...stage.activationNodes.map((node) => ({ id: node.id, rect: node, category: 'activationNode' as const })),
  ...stage.checkpoints.map((checkpoint) => ({ id: checkpoint.id, rect: checkpoint.rect, category: 'checkpoint' as const })),
  ...stage.collectibles.map((collectible) => ({
    id: collectible.id,
    rect: { x: collectible.position.x - 12, y: collectible.position.y - 12, width: 24, height: 24 },
    category: 'collectible' as const,
  })),
  ...stage.rewardBlocks.map((rewardBlock) => ({ id: rewardBlock.id, rect: rewardBlock, category: 'rewardBlock' as const })),
  { id: 'exit', rect: stage.exit, category: 'exit' as const },
];

const collectibleBounds = (collectible: StageDefinition['collectibles'][number]): Rect => ({
  x: collectible.position.x - 8,
  y: collectible.position.y - 8,
  width: 16,
  height: 16,
});

const platformTraversalEnvelope = (platform: PlatformDefinition): Rect => {
  if (!platform.move) {
    return platform;
  }

  if (platform.move.axis === 'x') {
    return {
      x: platform.x,
      y: platform.y,
      width: platform.width + platform.move.range,
      height: platform.height,
    };
  }

  return {
    x: platform.x,
    y: platform.y - platform.move.range,
    width: platform.width,
    height: platform.height + platform.move.range,
  };
};

const enemyTraversalEnvelope = (stage: StageDefinition, enemy: EnemyDefinition): Rect => {
  const bounds = enemyRect(enemy);

  if (enemy.kind === 'walker' && enemy.patrol) {
    return {
      x: enemy.patrol.left,
      y: bounds.y,
      width: Math.max(bounds.width, enemy.patrol.right - enemy.patrol.left),
      height: bounds.height,
    };
  }

  if (enemy.kind === 'charger' && enemy.charger) {
    return {
      x: enemy.charger.left,
      y: bounds.y,
      width: Math.max(bounds.width, enemy.charger.right - enemy.charger.left),
      height: bounds.height,
    };
  }

  if (enemy.kind === 'flyer' && enemy.flyer) {
    return {
      x: enemy.flyer.left,
      y: enemy.position.y - enemy.flyer.bobAmp,
      width: Math.max(bounds.width, enemy.flyer.right - enemy.flyer.left),
      height: bounds.height + enemy.flyer.bobAmp * 2,
    };
  }

  if (enemy.kind === 'hopper' && enemy.hop) {
    const hangTimeSeconds = (2 * enemy.hop.impulse) / stage.world.gravity;
    const horizontalReach = Math.max(60, enemy.hop.speed * hangTimeSeconds);
    const verticalReach = (enemy.hop.impulse * enemy.hop.impulse) / (2 * stage.world.gravity);

    return {
      x: enemy.position.x - horizontalReach,
      y: enemy.position.y - verticalReach,
      width: bounds.width + horizontalReach * 2,
      height: bounds.height + verticalReach,
    };
  }

  return bounds;
};

const authoredTraversalContentEnvelopes = (
  stage: StageDefinition,
): { id: string; rect: Rect; kind: 'platform' | 'terrainSurface' | 'launcher' | 'collectible' | 'rewardBlock' | 'hazard' | 'enemy' }[] => [
  ...stage.platforms.map((platform) => ({ id: platform.id, rect: platformTraversalEnvelope(platform), kind: 'platform' as const })),
  ...stage.terrainSurfaces.map((surface) => ({ id: surface.id, rect: surface, kind: 'terrainSurface' as const })),
  ...stage.launchers.map((launcherEntry) => ({ id: launcherEntry.id, rect: launcherEntry, kind: 'launcher' as const })),
  ...stage.collectibles.map((collectible) => ({ id: collectible.id, rect: collectibleBounds(collectible), kind: 'collectible' as const })),
  ...stage.rewardBlocks.map((block) => ({ id: block.id, rect: block, kind: 'rewardBlock' as const })),
  ...stage.hazards.map((hazard) => ({ id: hazard.id, rect: hazard.rect, kind: 'hazard' as const })),
  ...stage.enemies.map((enemy) => ({ id: enemy.id, rect: enemyTraversalEnvelope(stage, enemy), kind: 'enemy' as const })),
];

const validateStaticElementCollisions = (stage: StageDefinition): StageDefinition => {
  if (!isRectWithinWorld(stage, stage.exit)) {
    throw new Error(`Exit must use a positive bounded rectangle within the stage world: ${stage.id}`);
  }

  if (!findExitSupport(stage, stage.exit)) {
    throw new Error(`Stage exits must sit on readable grounded support: ${stage.id}`);
  }

  const statics = authoredStaticElements(stage);
  const collisions: string[] = [];

  for (let index = 0; index < statics.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < statics.length; nextIndex += 1) {
      const current = statics[index];
      const next = statics[nextIndex];
      if (intersectsRect(current.rect, next.rect)) {
        collisions.push(`${current.id}<->${next.id}`);
      }
    }
  }

  if (collisions.length > 0) {
    throw new Error(`Static stage elements cannot overlap: ${collisions.join(', ')}`);
  }

  return stage;
};

const validateEnemyPlacement = (stage: StageDefinition): StageDefinition => {
  const groundedEnemies = stage.enemies.filter((enemy) => enemy.kind !== 'flyer');
  const outOfBoundsEnemies = groundedEnemies.filter((enemy) => !isRectWithinWorld(stage, enemyRect(enemy)));

  if (outOfBoundsEnemies.length > 0) {
    throw new Error(
      `Non-flying enemies must stay within the visible stage bounds: ${outOfBoundsEnemies
        .map((enemy) => enemy.id)
        .join(', ')}`,
    );
  }

  const unsupportedEnemies = groundedEnemies.filter((enemy) => !findTraversableSupport(stage, enemyRect(enemy)));
  if (unsupportedEnemies.length > 0) {
    throw new Error(
      `Non-flying enemies must sit on readable platform support: ${unsupportedEnemies.map((enemy) => enemy.id).join(', ')}`,
    );
  }

  return stage;
};

const secretRouteRewardScore = (stage: StageDefinition, reward: SecretRouteDefinition['reward']): number => {
  const collectibleScore = reward.collectibleIds.length;
  const blockScore = reward.rewardBlockIds.reduce((total, rewardBlockId) => {
    const rewardBlockEntry = stage.rewardBlocks.find((rewardBlock) => rewardBlock.id === rewardBlockId);
    if (!rewardBlockEntry) {
      return total;
    }

    return total + (rewardBlockEntry.reward.kind === 'coins' ? rewardBlockEntry.reward.amount : 3);
  }, 0);

  return collectibleScore + blockScore;
};

const routeUsesTimedRevealMechanic = (stage: StageDefinition, route: SecretRouteDefinition): boolean => {
  const routeBounds = expandRect(route.interior, 160);
  const revealVolumeIds = route.cue.revealVolumeIds ?? [];
  const revealPlatformIds = route.cue.revealPlatformIds ?? [];
  const scannerVolumeIds = route.cue.scannerVolumeIds ?? [];
  const temporaryBridgeIds = route.cue.temporaryBridgeIds ?? [];

  if (
    revealVolumeIds.length === 0 ||
    revealPlatformIds.length === 0 ||
    scannerVolumeIds.length === 0 ||
    temporaryBridgeIds.length === 0
  ) {
    return false;
  }

  return (
    revealVolumeIds.every((volumeId) =>
      stage.revealVolumes.some((volume) => volume.id === volumeId && intersectsRect(routeBounds, volume)),
    ) &&
    scannerVolumeIds.every((volumeId) =>
      stage.scannerVolumes.some((volume) => volume.id === volumeId && intersectsRect(routeBounds, volume)),
    ) &&
    temporaryBridgeIds.every((platformId) => {
      const platform = stage.platforms.find(
        (entry) => entry.id === platformId && Boolean(entry.temporaryBridge) && Boolean(entry.reveal) && intersectsRect(routeBounds, entry),
      );

      return Boolean(platform?.reveal && revealPlatformIds.includes(platform.reveal.id));
    })
  );
};

const routeUsesReadableMechanic = (stage: StageDefinition, route: SecretRouteDefinition): boolean => {
  const routeBounds = expandRect(route.interior, 160);
  return route.mechanics.some((mechanic) => {
    switch (mechanic) {
      case 'optionalDetour':
        return route.entry.y + route.entry.height < route.mainPath.y + route.mainPath.height - 24 || route.entry.x < route.reconnect.x - 120;
      case 'revealPlatform':
        return (
          (route.cue.revealVolumeIds?.every((volumeId) =>
            stage.revealVolumes.some((volume) => volume.id === volumeId && intersectsRect(routeBounds, volume)),
          ) ?? false) &&
          (route.cue.revealPlatformIds?.every((platformId) =>
            stage.platforms.some(
              (platform) =>
                Boolean(platform.reveal) &&
                (platform.id === platformId || platform.reveal?.id === platformId) &&
                intersectsRect(routeBounds, platform),
            ),
          ) ?? false)
        );
      case 'scannerBridge':
        return (
          (route.cue.scannerVolumeIds?.every((volumeId) =>
            stage.scannerVolumes.some((volume) => volume.id === volumeId && intersectsRect(routeBounds, volume)),
          ) ?? false) &&
          (route.cue.temporaryBridgeIds?.every((platformId) =>
            stage.platforms.some(
              (platform) =>
                platform.id === platformId && Boolean(platform.temporaryBridge) && intersectsRect(routeBounds, platform),
            ),
          ) ?? false)
        );
      case 'timedReveal':
        return routeUsesTimedRevealMechanic(stage, route);
      case 'lowGravity':
        return (
          route.cue.lowGravityZoneIds?.every((zoneId) =>
            stage.lowGravityZones.some((zone) => zone.id === zoneId && intersectsRect(routeBounds, zone)),
          ) ?? false
        );
      case 'launcher':
        return (
          route.cue.launcherIds?.every((launcherId) =>
            stage.launchers.some((launcherEntry) => launcherEntry.id === launcherId && intersectsRect(routeBounds, launcherEntry)),
          ) ?? false
        );
      case 'terrainSurface':
        return (
          route.cue.terrainSurfaceIds?.every((surfaceId) =>
            stage.terrainSurfaces.some((surface) => surface.id === surfaceId && intersectsRect(routeBounds, surface)),
          ) ?? false
        );
      default:
        return false;
    }
  });
};

const validateSecretRoutes = (stage: StageDefinition): StageDefinition => {
  const secretRouteIds = stage.secretRoutes.map((route) => route.id);
  if (new Set(secretRouteIds).size !== secretRouteIds.length) {
    throw new Error('Secret route ids must be unique.');
  }

  for (const route of stage.secretRoutes) {
    if (!route.title.trim()) {
      throw new Error(`Secret route must include a title: ${route.id}`);
    }

    if (route.mechanics.length === 0) {
      throw new Error(`Secret route must declare at least one supported traversal mechanic: ${route.id}`);
    }

    if (!route.cue.description.trim()) {
      throw new Error(`Secret route must include a readable discovery cue description: ${route.id}`);
    }

    for (const rect of [route.cue.rect, route.entry, route.interior, route.reconnect, route.mainPath]) {
      if (!isRectWithinWorld(stage, rect)) {
        throw new Error(`Secret route spans must stay within the authored stage bounds: ${route.id}`);
      }
    }

    if (!findTraversableSupport(stage, route.cue.rect)) {
      throw new Error(`Secret route discovery cue must sit over a traversable main-route perch: ${route.id}`);
    }

    if (!findTraversableSupport(stage, route.reconnect) || !findTraversableSupport(stage, route.mainPath)) {
      throw new Error(`Secret route must reconnect onto supported downstream terrain: ${route.id}`);
    }

    if (route.reconnect.x <= route.entry.x + 120) {
      throw new Error(`Secret route reconnect must sit downstream of the hidden entry: ${route.id}`);
    }

    if (route.mainPath.x > route.reconnect.x + route.reconnect.width + 240) {
      throw new Error(`Secret route main-path span must align with the downstream reconnection: ${route.id}`);
    }

    if (!routeUsesReadableMechanic(stage, route)) {
      throw new Error(`Secret route must use nearby authored traversal cues from supported mechanics: ${route.id}`);
    }

    if (route.mechanics.includes('timedReveal')) {
      const unsupportedTimedRevealMechanics = route.mechanics.filter(
        (mechanic) => mechanic !== 'timedReveal' && mechanic !== 'optionalDetour',
      );
      if (unsupportedTimedRevealMechanics.length > 0) {
        throw new Error(`Timed-reveal secret routes must stay bounded to reveal plus scanner composition: ${route.id}`);
      }

      const linkedRevealVolumes = stage.revealVolumes.filter((volume) => route.cue.revealVolumeIds?.includes(volume.id));
      const linkedScannerVolumes = stage.scannerVolumes.filter((volume) => route.cue.scannerVolumeIds?.includes(volume.id));
      const overlappingCueScanner = linkedScannerVolumes.some((volume) => intersectsRect(expandRect(route.cue.rect, 8), volume));
      const overlappingTriggerVolumes = linkedRevealVolumes.some((revealVolume) =>
        linkedScannerVolumes.some((scannerVolume) => intersectsRect(revealVolume, scannerVolume)),
      );
      const fallbackDependsOnTimedSupport = stage.platforms.some(
        (platform) => Boolean(platform.temporaryBridge) && intersectsRect(route.mainPath, platform),
      );

      if (overlappingCueScanner || overlappingTriggerVolumes) {
        throw new Error(`Timed-reveal secret routes must make the route legible before scanner timing begins: ${route.id}`);
      }

      if (fallbackDependsOnTimedSupport) {
        throw new Error(`Timed-reveal secret routes must preserve a safe main-route fallback outside timed support: ${route.id}`);
      }
    }

    const missingCollectibles = route.reward.collectibleIds.filter(
      (collectibleId) => !stage.collectibles.some((collectible) => collectible.id === collectibleId),
    );
    const missingRewardBlocks = route.reward.rewardBlockIds.filter(
      (rewardBlockId) => !stage.rewardBlocks.some((rewardBlock) => rewardBlock.id === rewardBlockId),
    );
    if (missingCollectibles.length > 0 || missingRewardBlocks.length > 0) {
      throw new Error(
        `Secret route reward references must resolve to authored collectibles and reward blocks: ${route.id}`,
      );
    }

    const rewardCollectiblesInside = route.reward.collectibleIds.every((collectibleId) => {
      const collectible = stage.collectibles.find((entry) => entry.id === collectibleId);
      return Boolean(collectible && rectContainsPoint(route.interior, collectible.position));
    });
    const rewardBlocksInside = route.reward.rewardBlockIds.every((rewardBlockId) => {
      const rewardBlockEntry = stage.rewardBlocks.find((entry) => entry.id === rewardBlockId);
      return Boolean(rewardBlockEntry && intersectsRect(route.interior, rewardBlockEntry));
    });
    if (!rewardCollectiblesInside || !rewardBlocksInside) {
      throw new Error(`Secret route rewards must sit inside the authored micro-area or sample cave: ${route.id}`);
    }

    if (!route.reward.note.trim() || secretRouteRewardScore(stage, route.reward) < SECRET_ROUTE_MIN_REWARD_SCORE) {
      throw new Error(`Secret route must provide meaningful optional reward value: ${route.id}`);
    }

    const reconnectDangerZone = expandRect(route.reconnect, 44);
    const reconnectThreats = [
      ...stage.hazards.filter((hazard) => intersectsRect(reconnectDangerZone, hazard.rect)).map((hazard) => hazard.id),
      ...stage.enemies.filter((enemy) => intersectsRect(reconnectDangerZone, enemyRect(enemy))).map((enemy) => enemy.id),
    ];
    if (reconnectThreats.length > 0 || intersectsRect(reconnectDangerZone, stage.exit)) {
      throw new Error(`Secret route reconnect must be safely downstream without immediate traps or exit overlap: ${route.id}`);
    }
  }

  return stage;
};

export const validateStageCatalogSecretRoutes = (stages: StageDefinition[]): StageDefinition[] => {
  const secretRouteCount = stages.reduce((total, stage) => total + stage.secretRoutes.length, 0);
  if (secretRouteCount <= 0) {
    throw new Error('At least one stage must define a reconnecting secret route.');
  }

  return stages;
};

const authoredTerrainVariantPlatforms = (
  stage: StageDefinition,
  kind?: TerrainSurfaceKind,
): (PlatformDefinition & { terrainVariant: TerrainSurfaceKind })[] =>
  stage.platforms.filter(
    (platform): platform is PlatformDefinition & { terrainVariant: TerrainSurfaceKind } =>
      Boolean(platform.terrainVariant) && (kind == null || platform.terrainVariant === kind),
  );

const terrainBeatForPlatform = (stage: StageDefinition, platform: PlatformDefinition): string => {
  const routeBeat = stage.secretRoutes.find(
    (route) =>
      intersectsRect(platform, route.entry) ||
      intersectsRect(platform, route.mainPath) ||
      intersectsRect(platform, route.reconnect) ||
      intersectsRect(platform, route.interior),
  );

  if (routeBeat) {
    if (intersectsRect(platform, routeBeat.mainPath) || intersectsRect(platform, routeBeat.reconnect)) {
      return `${routeBeat.id}:reconnect`;
    }

    return `${routeBeat.id}:branch`;
  }

  const centerX = platform.x + platform.width / 2;
  return stage.segments.find((segment) => centerX >= segment.startX && centerX <= segment.endX)?.id ?? 'unmapped';
};

const isTerrainVariantInteriorOnlyDeadEnd = (route: SecretRouteDefinition, platform: PlatformDefinition): boolean =>
  intersectsRect(platform, route.interior) &&
  !intersectsRect(platform, route.entry) &&
  !intersectsRect(platform, route.mainPath) &&
  !intersectsRect(platform, route.reconnect);

const terrainKindsConfinedToDeadEnds = (stage: StageDefinition): TerrainSurfaceKind[] =>
  MAIN_STAGE_TERRAIN_KINDS.filter((kind) => {
    const authored = authoredTerrainVariantPlatforms(stage, kind);
    return (
      authored.length > 0 &&
      authored.every((platform) => stage.secretRoutes.some((route) => isTerrainVariantInteriorOnlyDeadEnd(route, platform)))
    );
  });

const hasValidLauncherDirection = (direction?: { x: number; y: number }): boolean => {
  if (!direction) {
    return true;
  }

  const magnitude = Math.hypot(direction.x, direction.y);
  if (magnitude <= 0.0001) {
    return false;
  }

  const normalizedY = direction.y / magnitude;
  if (normalizedY >= 0) {
    return false;
  }

  return Math.acos(Math.min(1, Math.max(-1, -normalizedY))) <= LAUNCHER_MAX_DIRECTION_RADIANS + 0.0001;
};

export const validateTraversalMechanics = (stage: StageDefinition): StageDefinition => {
  const activationNodeIds = stage.activationNodes.map((node) => node.id);
  const uniqueActivationNodeIds = new Set(activationNodeIds);
  const magneticPlatforms = stage.platforms.filter(
    (platform): platform is PlatformDefinition & { magnetic: NonNullable<PlatformDefinition['magnetic']> } =>
      Boolean(platform.magnetic),
  );
  const revealIds = stage.platforms.flatMap((platform) => (platform.reveal ? [platform.reveal.id] : []));
  const uniqueRevealIds = new Set(revealIds);
  const temporaryBridgeIds = stage.platforms.flatMap((platform) => (platform.temporaryBridge ? [platform.id] : []));
  const uniqueTemporaryBridgeIds = new Set(temporaryBridgeIds);
  const scannerIds = stage.scannerVolumes.map((volume) => volume.id);
  const uniqueScannerIds = new Set(scannerIds);
  const terrainSurfaceIds = stage.terrainSurfaces.map((surface) => surface.id);
  const uniqueTerrainSurfaceIds = new Set(terrainSurfaceIds);
  const launcherIds = stage.launchers.map((launcherEntry) => launcherEntry.id);
  const uniqueLauncherIds = new Set(launcherIds);
  const checkpointIds = new Set(stage.checkpoints.map((checkpoint) => checkpoint.id));
  const revealVolumeIds = new Set(stage.revealVolumes.map((volume) => volume.id));

  if (uniqueActivationNodeIds.size !== activationNodeIds.length) {
    throw new Error('Activation node ids must be unique.');
  }

  const invalidActivationNodes = stage.activationNodes.filter((node) => !isRectWithinWorld(stage, node));
  if (invalidActivationNodes.length > 0) {
    throw new Error(
      `Activation nodes must use positive bounded rectangles: ${invalidActivationNodes.map((node) => node.id).join(', ')}`,
    );
  }

  if ((stage.activationNodes.length > 0 || magneticPlatforms.length > 0) && stage.id !== MAGNETIC_PLATFORM_STAGE_ID) {
    throw new Error(`Activation-node magnetic-platform rollout is limited to ${MAGNETIC_PLATFORM_STAGE_ID}.`);
  }

  if (stage.id === MAGNETIC_PLATFORM_STAGE_ID && (stage.activationNodes.length > 0 || magneticPlatforms.length > 0)) {
    if (stage.activationNodes.length !== 1 || magneticPlatforms.length !== 1) {
      throw new Error('Activation-node magnetic-platform rollout must author exactly one node and one linked platform.');
    }
  }

  const findSupportingPlatformForLauncher = (launcherEntry: StageDefinition['launchers'][number]): PlatformDefinition | null =>
    stage.platforms.find(
      (platform) =>
        platform.kind === 'static' &&
        !platform.reveal &&
        !platform.temporaryBridge &&
        launcherEntry.x >= platform.x &&
        launcherEntry.x + launcherEntry.width <= platform.x + platform.width &&
        Math.abs(launcherEntry.y - platform.y) <= 1 &&
        launcherEntry.height > 0 &&
        launcherEntry.height <= Math.min(platform.height, 20),
    ) ?? null;

  if (uniqueRevealIds.size !== revealIds.length) {
    throw new Error('Reveal platform ids must be unique.');
  }

  if (uniqueTemporaryBridgeIds.size !== temporaryBridgeIds.length) {
    throw new Error('Temporary bridge platform ids must be unique.');
  }

  const invalidMagneticPlatforms = magneticPlatforms.filter(
    (platform) => platform.kind !== 'static' || Boolean(platform.reveal) || Boolean(platform.temporaryBridge),
  );
  if (invalidMagneticPlatforms.length > 0) {
    throw new Error(
      `Magnetic platforms must be static authored support without reveal or temporary-bridge composition: ${invalidMagneticPlatforms
        .map((platform) => platform.id)
        .join(', ')}`,
    );
  }

  const missingActivationNodeReferences = magneticPlatforms.flatMap((platform) =>
    uniqueActivationNodeIds.has(platform.magnetic.activationNodeId)
      ? []
      : [`${platform.id}->${platform.magnetic.activationNodeId}`],
  );
  if (missingActivationNodeReferences.length > 0) {
    throw new Error(`Magnetic platforms reference unknown activation nodes: ${missingActivationNodeReferences.join(', ')}`);
  }

  const unusedActivationNodes = stage.activationNodes
    .filter((node) => !magneticPlatforms.some((platform) => platform.magnetic.activationNodeId === node.id))
    .map((node) => node.id);
  if (unusedActivationNodes.length > 0) {
    throw new Error(`Activation nodes must link at least one magnetic platform: ${unusedActivationNodes.join(', ')}`);
  }

  const unsupportedActivationNodeSupport = stage.activationNodes.filter((node) => !findTraversableSupport(stage, node));
  if (unsupportedActivationNodeSupport.length > 0) {
    throw new Error(
      `Activation nodes must sit over traversable authored support: ${unsupportedActivationNodeSupport.map((node) => node.id).join(', ')}`,
    );
  }

  const distantMagneticLinks = magneticPlatforms.flatMap((platform) => {
    const node = stage.activationNodes.find((entry) => entry.id === platform.magnetic.activationNodeId);
    if (!node) {
      return [];
    }

    const platformCenter = { x: platform.x + platform.width / 2, y: platform.y + platform.height / 2 };
    const nodeCenter = { x: node.x + node.width / 2, y: node.y + node.height / 2 };
    return Math.abs(platformCenter.x - nodeCenter.x) > MAGNETIC_NODE_MAX_HORIZONTAL_DISTANCE ||
      Math.abs(platformCenter.y - nodeCenter.y) > MAGNETIC_NODE_MAX_VERTICAL_DISTANCE
      ? [`${node.id}->${platform.id}`]
      : [];
  });
  if (distantMagneticLinks.length > 0) {
    throw new Error(`Activation nodes must stay nearby their linked magnetic platforms: ${distantMagneticLinks.join(', ')}`);
  }

  const unsafeMagneticFallbacks = magneticPlatforms.filter((platform) => {
    const fallbackSupport = findSupportBelowSpan(
      stage.platforms.filter((candidate) => candidate.id !== platform.id && !candidate.magnetic),
      platform.x,
      platform.width,
      platform.y + platform.height,
    );

    return !fallbackSupport || fallbackSupport.y - (platform.y + platform.height) > MAGNETIC_ROUTE_FALLBACK_MAX_DROP;
  });
  if (unsafeMagneticFallbacks.length > 0) {
    throw new Error(
      `Activation-node magnetic platforms must preserve a retry-safe non-magnetic fallback path: ${unsafeMagneticFallbacks
        .map((platform) => platform.id)
        .join(', ')}`,
    );
  }

  if (uniqueScannerIds.size !== scannerIds.length) {
    throw new Error('Scanner volume ids must be unique.');
  }

  if (uniqueTerrainSurfaceIds.size !== terrainSurfaceIds.length) {
    throw new Error('Terrain surface ids must be unique.');
  }

  const terrainVariantPlatforms = authoredTerrainVariantPlatforms(stage);
  if (stage.terrainSurfaces.length > 0 && terrainVariantPlatforms.length > 0) {
    throw new Error(
      `Brittle crystal and sticky sludge cannot mix platform terrain variants with legacy terrain surfaces: ${stage.terrainSurfaces.map((surface) => surface.id).join(', ')}`,
    );
  }

  if (stage.terrainSurfaces.length > 0) {
    throw new Error(
      `Brittle crystal and sticky sludge must be authored on platform terrainVariant instead of terrain surfaces: ${stage.terrainSurfaces.map((surface) => surface.id).join(', ')}`,
    );
  }

  const invalidTerrainVariantPlatforms = terrainVariantPlatforms.filter(
    (platform) =>
      platform.kind !== 'static' || Boolean(platform.reveal) || Boolean(platform.temporaryBridge) || Boolean(platform.magnetic),
  );
  if (invalidTerrainVariantPlatforms.length > 0) {
    throw new Error(
      `Brittle crystal and sticky sludge variants must stay on plain static platforms: ${invalidTerrainVariantPlatforms.map((platform) => platform.id).join(', ')}`,
    );
  }

  if (uniqueLauncherIds.size !== launcherIds.length) {
    throw new Error('Launcher ids must be unique.');
  }

  const missingRevealLinks = stage.revealVolumes.flatMap((volume) =>
    volume.revealPlatformIds.filter((revealId) => !uniqueRevealIds.has(revealId)).map((revealId) => `${volume.id}->${revealId}`),
  );
  if (missingRevealLinks.length > 0) {
    throw new Error(`Reveal volumes reference unknown reveal platforms: ${missingRevealLinks.join(', ')}`);
  }

  const invalidLowGravityZones = stage.lowGravityZones.filter(
    (zone) => zone.gravityScale <= 0 || zone.gravityScale >= 1,
  );
  if (invalidLowGravityZones.length > 0) {
    throw new Error(
      `Low-gravity zones must use a gravityScale between 0 and 1: ${invalidLowGravityZones.map((zone) => zone.id).join(', ')}`,
    );
  }

  const gravityFieldIds = stage.gravityFields.map((field) => field.id);
  if (new Set(gravityFieldIds).size !== gravityFieldIds.length) {
    throw new Error('Gravity field ids must be unique.');
  }

  const gravityCapsuleIds = stage.gravityCapsules.map((capsule) => capsule.id);
  if (new Set(gravityCapsuleIds).size !== gravityCapsuleIds.length) {
    throw new Error('Gravity capsule ids must be unique.');
  }

  const gravityCapsuleButtonIds = stage.gravityCapsules.map((capsule) => capsule.button.id);
  if (new Set(gravityCapsuleButtonIds).size !== gravityCapsuleButtonIds.length) {
    throw new Error('Gravity capsule button ids must be unique.');
  }

  const invalidGravityFields = stage.gravityFields.filter((field) => !isRectWithinWorld(stage, field));
  if (invalidGravityFields.length > 0) {
    throw new Error(
      `Gravity fields must use positive bounded rectangles: ${invalidGravityFields.map((field) => field.id).join(', ')}`,
    );
  }

  const unsupportedGravityFields = stage.gravityFields.filter((field) => !GRAVITY_FIELD_KINDS.includes(field.kind));
  if (unsupportedGravityFields.length > 0) {
    throw new Error(
      `Gravity fields must use a supported kind: ${unsupportedGravityFields.map((field) => field.id).join(', ')}`,
    );
  }

  const unknownGravityCapsuleLinks = stage.gravityFields.filter(
    (field) => field.gravityCapsuleId && !stage.gravityCapsules.some((capsule) => capsule.id === field.gravityCapsuleId),
  );
  if (unknownGravityCapsuleLinks.length > 0) {
    throw new Error(
      `Gravity fields reference unknown gravity capsules: ${unknownGravityCapsuleLinks.map((field) => field.id).join(', ')}`,
    );
  }

  const invalidGravityCapsuleFields = stage.gravityCapsules.filter((capsule) => {
    const field = stage.gravityFields.find((entry) => entry.id === capsule.fieldId);
    return !field || field.gravityCapsuleId !== capsule.id;
  });
  if (invalidGravityCapsuleFields.length > 0) {
    throw new Error(
      `Gravity capsules must link exactly one authored gravity field: ${invalidGravityCapsuleFields.map((capsule) => capsule.id).join(', ')}`,
    );
  }

  const invalidGravityCapsuleBounds = stage.gravityCapsules.filter((capsule) => {
    const field = stage.gravityFields.find((entry) => entry.id === capsule.fieldId);
    const doorSupports = capsule.doorSupports;
    return (
      !isRectWithinWorld(stage, capsule.shell) ||
      !isRectWithinWorld(stage, capsule.entryDoor) ||
      !isRectWithinWorld(stage, capsule.exitDoor) ||
      !isRectWithinWorld(stage, capsule.button) ||
      !isRectWithinWorld(stage, capsule.entryRoute) ||
      !isRectWithinWorld(stage, capsule.buttonRoute) ||
      !isRectWithinWorld(stage, capsule.exitRoute) ||
      Boolean(doorSupports && !isRectWithinWorld(stage, doorSupports.entryApproachPath)) ||
      Boolean(doorSupports && !isRectWithinWorld(stage, doorSupports.exitReconnectPath)) ||
      !field ||
      !isRectWithinRect(capsule.shell, field) ||
      !isRectWithinRect(capsule.shell, capsule.button) ||
      !isRectWithinRect(capsule.shell, capsule.entryRoute) ||
      !isRectWithinRect(capsule.shell, capsule.buttonRoute) ||
      !isRectWithinRect(capsule.shell, capsule.exitRoute)
    );
  });
  if (invalidGravityCapsuleBounds.length > 0) {
    throw new Error(
      `Gravity rooms must keep their linked field, doors, button, and route geometry inside the authored shell: ${invalidGravityCapsuleBounds.map((capsule) => capsule.id).join(', ')}`,
    );
  }

  const invalidGravityCapsuleOpenings = stage.gravityCapsules.filter(
    (capsule) =>
      intersectsRect(capsule.entryDoor, capsule.exitDoor) ||
      capsule.entryDoor.x >= capsule.exitDoor.x ||
      Math.abs(capsule.entryDoor.x - capsule.exitDoor.x) < 16 ||
      !gravityCapsuleUsesSideWallDoors(capsule) ||
      !gravityCapsuleHasBlockingShellWalls(capsule),
  );
  if (invalidGravityCapsuleOpenings.length > 0) {
    throw new Error(
      `Gravity rooms must author separate side-wall entry and exit openings while keeping the full bottom edge sealed: ${invalidGravityCapsuleOpenings.map((capsule) => capsule.id).join(', ')}`,
    );
  }

  const invalidGravityCapsuleContent = stage.gravityCapsules.filter((capsule) => {
    const contentEntries = gravityCapsuleContentEntries(stage, capsule);
    const expectedCount =
      (capsule.contents.platformIds?.length ?? 0) +
      (capsule.contents.terrainSurfaceIds?.length ?? 0) +
      (capsule.contents.launcherIds?.length ?? 0) +
      (capsule.contents.collectibleIds?.length ?? 0) +
      (capsule.contents.rewardBlockIds?.length ?? 0) +
      (capsule.contents.hazardIds?.length ?? 0) +
      (capsule.contents.enemyIds?.length ?? 0);

    if (contentEntries.length !== expectedCount) {
      return true;
    }

    return contentEntries.some((entry) => !isRectWithinRect(capsule.shell, entry.rect));
  });
  if (invalidGravityCapsuleContent.length > 0) {
    throw new Error(
      `Gravity rooms must keep all linked room content inside the authored shell: ${invalidGravityCapsuleContent.map((capsule) => capsule.id).join(', ')}`,
    );
  }

  const traversalContentEnvelopes = authoredTraversalContentEnvelopes(stage);
  const invalidGravityCapsuleShellIntrusion = stage.gravityCapsules.filter((capsule) =>
    traversalContentEnvelopes.some((entry) => gravityCapsuleRectCrossesSealedShellBoundary(capsule, entry.rect)),
  );
  if (invalidGravityCapsuleShellIntrusion.length > 0) {
    throw new Error(
      `Gravity rooms must keep authored traversal content from intruding through sealed shell bands outside door openings: ${invalidGravityCapsuleShellIntrusion.map((capsule) => capsule.id).join(', ')}`,
    );
  }

  if (MAIN_STAGE_IDS.includes(stage.id as (typeof MAIN_STAGE_IDS)[number])) {
    const unfocusedGravityCapsules = stage.gravityCapsules.filter((capsule) => {
      const interiorEntries = gravityCapsuleInteriorEntriesByKind(stage, capsule);
      const linkedPlatformIds = new Set(capsule.contents.platformIds ?? []);
      const unexpectedPlatformIds = interiorEntries.platformIds.filter((platformId) => !linkedPlatformIds.has(platformId));

      return (
        unexpectedPlatformIds.length > 0 ||
        interiorEntries.terrainSurfaceIds.length > 0 ||
        interiorEntries.launcherIds.length > 0 ||
        interiorEntries.collectibleIds.length > 0 ||
        interiorEntries.rewardBlockIds.length > 0 ||
        interiorEntries.hazardIds.length > 0 ||
        interiorEntries.enemyIds.length > 0 ||
        (capsule.contents.terrainSurfaceIds?.length ?? 0) > 0 ||
        (capsule.contents.launcherIds?.length ?? 0) > 0 ||
        (capsule.contents.collectibleIds?.length ?? 0) > 0 ||
        (capsule.contents.rewardBlockIds?.length ?? 0) > 0 ||
        (capsule.contents.hazardIds?.length ?? 0) > 0 ||
        (capsule.contents.enemyIds?.length ?? 0) > 0
      );
    });

    if (unfocusedGravityCapsules.length > 0) {
      throw new Error(
        `Current playable gravity rooms must stay focused on contained gravity traversal and button-off exit flow without extra mixed mechanics: ${unfocusedGravityCapsules.map((capsule) => capsule.id).join(', ')}`,
      );
    }
  }

  const unreachableGravityCapsuleButtons = stage.gravityCapsules.filter((capsule) => !findTraversableSupport(stage, capsule.button));
  if (unreachableGravityCapsuleButtons.length > 0) {
    throw new Error(
      `Gravity rooms must place their linked interior disable button on a reachable authored route: ${unreachableGravityCapsuleButtons
        .map((capsule) => capsule.id)
        .join(', ')}`,
    );
  }

  if (MAIN_STAGE_IDS.includes(stage.id as (typeof MAIN_STAGE_IDS)[number])) {
    const invalidGravityCapsuleDoorSupports = stage.gravityCapsules.filter((capsule) => {
      const doorSupports = capsule.doorSupports;
      const shellRight = capsule.shell.x + capsule.shell.width;
      const entrySupport = doorSupports
        ? stage.platforms.find((platform) => platform.id === doorSupports.entryApproachPlatformId) ?? null
        : null;
      const exitInteriorSupport = doorSupports
        ? stage.platforms.find((platform) => platform.id === doorSupports.exitInteriorPlatformId) ?? null
        : null;
      const exitReconnectSupport = doorSupports
        ? stage.platforms.find((platform) => platform.id === doorSupports.exitReconnectPlatformId) ?? null
        : null;
      return (
        !doorSupports ||
        !isRectWithinWorld(stage, doorSupports.entryApproachPath) ||
        !isRectWithinWorld(stage, doorSupports.exitReconnectPath) ||
        !pathReadsFromLeftWall(capsule, doorSupports.entryApproachPath) ||
        !pathReadsFromRightWall(capsule, doorSupports.exitReconnectPath) ||
        doorSupports.entryApproachPath.x + doorSupports.entryApproachPath.width > capsule.entryDoor.x + capsule.entryDoor.width ||
        doorSupports.exitReconnectPath.x < shellRight - capsule.exitDoor.width ||
        !gravityCapsuleDoorSupportsReuseRoute(capsule) ||
        !entrySupport ||
        !exitInteriorSupport ||
        !exitReconnectSupport ||
        !supportReadsFromLeftSide(capsule, gravityCapsuleDoorSupportRect(entrySupport)) ||
        !supportReadsFromRightSide(capsule, gravityCapsuleDoorSupportRect(exitReconnectSupport))
      );
    });

    if (invalidGravityCapsuleDoorSupports.length > 0) {
      throw new Error(
        `Current playable gravity rooms must reuse authored intended route supports for entry and exit doors: ${invalidGravityCapsuleDoorSupports.map((capsule) => capsule.id).join(', ')}`,
      );
    }
  }

  const unsupportedGravityCapsuleEntryApproaches = stage.gravityCapsules.filter(
    (capsule) => !findGravityCapsuleEntryDoorApproach(stage, capsule),
  );
  if (unsupportedGravityCapsuleEntryApproaches.length > 0) {
    throw new Error(
      `Gravity rooms must author a continuous platform path into each entry door: ${unsupportedGravityCapsuleEntryApproaches
        .map((capsule) => capsule.id)
        .join(', ')}`,
    );
  }

  const unsupportedGravityCapsuleExitAccess = stage.gravityCapsules.filter(
    (capsule) =>
      !findGravityCapsuleExitDoorInteriorAccess(stage, capsule) || !findGravityCapsuleExitDoorReconnect(stage, capsule),
  );
  if (unsupportedGravityCapsuleExitAccess.length > 0) {
    throw new Error(
      `Gravity rooms must author continuous platform-path exit access and reconnect support at each exit door: ${unsupportedGravityCapsuleExitAccess
        .map((capsule) => capsule.id)
        .join(', ')}`,
    );
  }

  const wrongFlowGravityCapsules = stage.gravityCapsules.filter((capsule) => currentGravityRoomFlowReadsWrong(stage, capsule));
  if (wrongFlowGravityCapsules.length > 0) {
    throw new Error(
      `Current playable gravity rooms must preserve player-facing side-wall IN-left and OUT-right flow: ${wrongFlowGravityCapsules
        .map((capsule) => capsule.id)
        .join(', ')}`,
    );
  }

  const uncontainedGravityCapsuleRoutes = stage.gravityCapsules.filter(
    (capsule) =>
      !findTraversableSupport(stage, capsule.entryRoute) ||
      !findTraversableSupport(stage, capsule.buttonRoute) ||
      !findTraversableSupport(stage, capsule.exitRoute),
  );
  if (uncontainedGravityCapsuleRoutes.length > 0) {
    throw new Error(
      `Gravity rooms must contain readable traversable route geometry from entry to exit: ${uncontainedGravityCapsuleRoutes
        .map((capsule) => capsule.id)
        .join(', ')}`,
    );
  }

  const invalidGravityCapsuleApproaches = stage.gravityCapsules.filter(
    (capsule) =>
      capsule.entryRoute.x > capsule.buttonRoute.x ||
      capsule.buttonRoute.x > capsule.exitRoute.x ||
      capsule.button.x + capsule.button.width > capsule.exitRoute.x,
  );
  if (invalidGravityCapsuleApproaches.length > 0) {
    throw new Error(
      `Gravity rooms must keep the interior disable button between the entry-side route and the disabled exit line: ${invalidGravityCapsuleApproaches
        .map((capsule) => capsule.id)
        .join(', ')}`,
    );
  }

  if (MAIN_STAGE_IDS.includes(stage.id as (typeof MAIN_STAGE_IDS)[number])) {
    const terrainKindCounts = new Map(
      MAIN_STAGE_TERRAIN_KINDS.map((kind) => [kind, authoredTerrainVariantPlatforms(stage, kind).length]),
    );
    const insufficientTerrainKinds = MAIN_STAGE_TERRAIN_KINDS.filter(
      (kind) => (terrainKindCounts.get(kind) ?? 0) < MAIN_STAGE_TERRAIN_MINIMUM,
    );
    if (insufficientTerrainKinds.length > 0) {
      throw new Error(
        `Main stages must author at least ${MAIN_STAGE_TERRAIN_MINIMUM} brittle crystal and sticky sludge surfaces: ${stage.id}`,
      );
    }

    const insufficientTerrainBeatCoverage = MAIN_STAGE_TERRAIN_KINDS.filter((kind) => {
      const beatCount = new Set(
        authoredTerrainVariantPlatforms(stage, kind).map((platform) => terrainBeatForPlatform(stage, platform)),
      ).size;
      return beatCount < 2;
    });
    if (insufficientTerrainBeatCoverage.length > 0) {
      throw new Error(`Main stages must spread brittle crystal and sticky sludge across at least two traversal beats: ${stage.id}`);
    }

    const deadEndTerrainKinds = terrainKindsConfinedToDeadEnds(stage);
    if (deadEndTerrainKinds.length > 0) {
      throw new Error(`Main stages cannot confine brittle crystal or sticky sludge to unreadable dead-end pockets: ${stage.id}`);
    }

    if (stage.gravityFields.length === 0) {
      throw new Error(`Main stages must author at least one bounded gravity-field section: ${stage.id}`);
    }

    const linkedGravityCapsuleIds = stage.gravityFields
      .map((field) => field.gravityCapsuleId)
      .filter((gravityCapsuleId): gravityCapsuleId is string => Boolean(gravityCapsuleId));
    if (
      linkedGravityCapsuleIds.length !== stage.gravityFields.length ||
      new Set(linkedGravityCapsuleIds).size !== stage.gravityFields.length ||
      stage.gravityCapsules.length !== stage.gravityFields.length
    ) {
      throw new Error(`Main stages must enclose every authored gravity field in its own linked gravity room: ${stage.id}`);
    }
  }

  if (stage.id === HALO_SPIRE_ARRAY_STAGE_ID && stage.gravityFields.length > 0) {
    const authoredKinds = new Set(stage.gravityFields.map((field) => field.kind));
    if (
      stage.gravityFields.length !== 2 ||
      !authoredKinds.has('anti-grav-stream') ||
      !authoredKinds.has('gravity-inversion-column')
    ) {
      throw new Error(
        'Halo Spire gravity-field rollout must author exactly one anti-grav stream and one gravity inversion column.',
      );
    }
  }

  const invalidTemporaryBridgePlatforms = stage.platforms.filter(
    (platform) => platform.temporaryBridge && (platform.kind !== 'static' || platform.temporaryBridge.durationMs <= 0),
  );
  if (invalidTemporaryBridgePlatforms.length > 0) {
    throw new Error(
      `Temporary bridges must be static, timer-backed platforms: ${invalidTemporaryBridgePlatforms.map((platform) => platform.id).join(', ')}`,
    );
  }

  const timedRevealPlatforms = stage.platforms.filter(
    (platform): platform is PlatformDefinition & {
      reveal: NonNullable<PlatformDefinition['reveal']>;
      temporaryBridge: NonNullable<PlatformDefinition['temporaryBridge']>;
    } => Boolean(platform.reveal && platform.temporaryBridge),
  );
  const malformedTimedRevealPlatforms = timedRevealPlatforms.filter(
    (platform) =>
      !stage.revealVolumes.some((volume) => volume.revealPlatformIds.includes(platform.reveal.id)) ||
      !stage.scannerVolumes.some((volume) => volume.id === platform.temporaryBridge.scannerId && volume.temporaryBridgeIds.includes(platform.id)),
  );
  if (malformedTimedRevealPlatforms.length > 0) {
    throw new Error(
      `Timed-reveal platforms must link one reveal cue and one scanner activator through authored stage data: ${malformedTimedRevealPlatforms
        .map((platform) => platform.id)
        .join(', ')}`,
    );
  }

  const missingScannerReferences = stage.platforms
    .filter((platform) => platform.temporaryBridge)
    .flatMap((platform) =>
      uniqueScannerIds.has(platform.temporaryBridge!.scannerId)
        ? []
        : [`${platform.id}->${platform.temporaryBridge!.scannerId}`],
    );
  if (missingScannerReferences.length > 0) {
    throw new Error(`Temporary bridges reference unknown scanner volumes: ${missingScannerReferences.join(', ')}`);
  }

  const missingTemporaryBridgeLinks = stage.scannerVolumes.flatMap((volume) =>
    volume.temporaryBridgeIds.filter((bridgeId) => !uniqueTemporaryBridgeIds.has(bridgeId)).map((bridgeId) => `${volume.id}->${bridgeId}`),
  );
  if (missingTemporaryBridgeLinks.length > 0) {
    throw new Error(`Scanner volumes reference unknown temporary bridges: ${missingTemporaryBridgeLinks.join(', ')}`);
  }

  const invalidLaunchers = stage.launchers.filter(
    (launcherEntry) =>
      launcherEntry.width <= 0 ||
      launcherEntry.height <= 0 ||
      launcherEntry.x < 0 ||
      launcherEntry.y < 0 ||
      launcherEntry.x + launcherEntry.width > stage.world.width ||
      launcherEntry.y + launcherEntry.height > stage.world.height,
  );
  if (invalidLaunchers.length > 0) {
    throw new Error(
      `Launchers must use positive bounded rectangles: ${invalidLaunchers.map((launcherEntry) => launcherEntry.id).join(', ')}`,
    );
  }

  const unsupportedLaunchers = stage.launchers.filter((launcherEntry) => !LAUNCHER_KINDS.includes(launcherEntry.kind));
  if (unsupportedLaunchers.length > 0) {
    throw new Error(
      `Launchers must use a supported kind: ${unsupportedLaunchers.map((launcherEntry) => launcherEntry.id).join(', ')}`,
    );
  }

  const invalidLauncherDirections = stage.launchers.filter((launcherEntry) => !hasValidLauncherDirection(launcherEntry.direction));
  if (invalidLauncherDirections.length > 0) {
    throw new Error(
      `Launchers must use an upward-biased direction within 25 degrees of vertical: ${invalidLauncherDirections.map((launcherEntry) => launcherEntry.id).join(', ')}`,
    );
  }

  const unsupportedLauncherAlignment = stage.launchers.filter((launcherEntry) => !findSupportingPlatformForLauncher(launcherEntry));
  if (unsupportedLauncherAlignment.length > 0) {
    throw new Error(
      `Launchers must align to solid static platform support: ${unsupportedLauncherAlignment.map((launcherEntry) => launcherEntry.id).join(', ')}`,
    );
  }

  const ambiguousLauncherContacts: string[] = [];
  for (let index = 0; index < stage.launchers.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < stage.launchers.length; nextIndex += 1) {
      const current = stage.launchers[index];
      const next = stage.launchers[nextIndex];
      if (intersectsRect(current, next)) {
        ambiguousLauncherContacts.push(`${current.id}<->${next.id}`);
      }
    }

    const current = stage.launchers[index];
    for (const platform of stage.platforms) {
      if (platform.kind === 'spring' && intersectsRect(current, platform)) {
        ambiguousLauncherContacts.push(`${current.id}<->${platform.id}`);
      }
    }
  }

  if (ambiguousLauncherContacts.length > 0) {
    throw new Error(`Launchers cannot overlap another launcher or spring contact area: ${ambiguousLauncherContacts.join(', ')}`);
  }

  if (stage.stageObjective) {
    const objectiveTargets: Record<'checkpoint' | 'revealVolume' | 'scannerVolume' | 'launcher', Set<string>> = {
      checkpoint: checkpointIds,
      revealVolume: revealVolumeIds,
      scannerVolume: uniqueScannerIds,
      launcher: uniqueLauncherIds,
    };

    if (!objectiveTargets[stage.stageObjective.target.kind].has(stage.stageObjective.target.id)) {
      throw new Error(
        `Stage objective references unknown ${stage.stageObjective.target.kind}: ${stage.stageObjective.target.id}`,
      );
    }
  }

  const overlappingGravityFields: string[] = [];
  for (let index = 0; index < stage.gravityFields.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < stage.gravityFields.length; nextIndex += 1) {
      const current = stage.gravityFields[index];
      const next = stage.gravityFields[nextIndex];
      if (intersectsRect(current, next)) {
        overlappingGravityFields.push(`${current.id}<->${next.id}`);
      }
    }

    const current = stage.gravityFields[index];
    for (const zone of stage.lowGravityZones) {
      if (intersectsRect(current, zone)) {
        overlappingGravityFields.push(`${current.id}<->${zone.id}`);
      }
    }
  }

  if (overlappingGravityFields.length > 0) {
    throw new Error(`Gravity fields cannot overlap another gravity modifier zone: ${overlappingGravityFields.join(', ')}`);
  }

  const unsafeGravityFieldCheckpoints = stage.checkpoints.filter((checkpoint) =>
    stage.gravityFields.some((field) => intersectsRect(expandRect(field, GRAVITY_FIELD_CHECKPOINT_CLEARANCE), checkpoint.rect)),
  );
  if (unsafeGravityFieldCheckpoints.length > 0) {
    throw new Error(
      `Checkpoints must stay outside immediate gravity-field motion: ${unsafeGravityFieldCheckpoints
        .map((checkpoint) => checkpoint.id)
        .join(', ')}`,
    );
  }

  const postExitCheckpoints = stage.checkpoints.filter(
    (checkpoint) => checkpoint.rect.x >= stage.exit.x + stage.exit.width,
  );
  if (postExitCheckpoints.length > 0) {
    throw new Error(
      `Checkpoints must stay before the terminal exit: ${postExitCheckpoints.map((checkpoint) => checkpoint.id).join(', ')}`,
    );
  }

  return stage;
};

const validateEnemyVariants = (stage: StageDefinition): StageDefinition => {
  const variantEnemies = stage.enemies.filter(
    (enemy): enemy is EnemyDefinition & { variant: TurretVariantId } => Boolean(enemy.variant),
  );

  const nonTurretVariants = variantEnemies.filter((enemy) => enemy.kind !== 'turret');
  if (nonTurretVariants.length > 0) {
    throw new Error(
      `Biome-linked variants are limited to turret enemies: ${nonTurretVariants.map((enemy) => enemy.id).join(', ')}`,
    );
  }

  const unsupportedStageVariants = variantEnemies.filter(
    (enemy) => TURRET_VARIANT_CONFIG[enemy.variant].supportedStageId !== stage.id,
  );
  if (unsupportedStageVariants.length > 0) {
    throw new Error(
      `Turret variants must stay on their supported biome stages: ${unsupportedStageVariants
        .map((enemy) => `${enemy.id}:${enemy.variant}`)
        .join(', ')}`,
    );
  }

  const authoredVariants = [...new Set(variantEnemies.map((enemy) => enemy.variant))];
  if (authoredVariants.length > 1) {
    throw new Error(`Stage must roll out only one supported turret variant at a time: ${stage.id}`);
  }

  const supportedVariants = Object.entries(TURRET_VARIANT_CONFIG)
    .filter(([, config]) => config.supportedStageId === stage.id)
    .map(([variant]) => variant as TurretVariantId);
  if (supportedVariants.length === 0 && variantEnemies.length > 0) {
    throw new Error(`Turret variants are not supported on stage: ${stage.id}`);
  }

  if (supportedVariants.length > 0) {
    const stageVariantEnemies = variantEnemies.filter((enemy) => supportedVariants.includes(enemy.variant));
    if (stageVariantEnemies.length !== 2) {
      throw new Error(`Supported turret variant rollout must author exactly two encounters on ${stage.id}`);
    }

    const ordered = [...stageVariantEnemies].sort((left, right) => left.position.x - right.position.x);
    if (ordered[0].position.x >= ordered[1].position.x) {
      throw new Error(`Turret variant rollout must introduce a teaching beat before mixed reuse on ${stage.id}`);
    }
  }

  return stage;
};

export const validateStageCatalogMagneticRollout = (stages: StageDefinition[]): StageDefinition[] => {
  const activationNodeCount = stages.reduce((total, stage) => total + stage.activationNodes.length, 0);
  const magneticPlatformCount = stages.reduce(
    (total, stage) => total + stage.platforms.filter((platform) => platform.magnetic).length,
    0,
  );

  if (activationNodeCount !== 1 || magneticPlatformCount !== 1) {
    throw new Error('Stage catalog must author exactly one activation node and one magnetic platform for the bounded rollout.');
  }

  return stages;
};

export const validateStageDefinition = (stage: StageDefinition): StageDefinition =>
  validateEnemyVariants(
    validateSecretRoutes(
      validateTraversalMechanics(validateEnemyPlacement(validateStaticElementCollisions(validateRewardBlocks(stage)))),
    ),
  );
