import {
  EMPTY_PLATFORM_SUPPORTED_MECHANIC_FAMILIES,
  type EmptyPlatformMechanicFamily,
  type EmptyPlatformProgressionSegment,
  type EmptyPlatformSupportedMechanicFamily,
  type StageDefinition,
  type EnemyDefinition,
  type PlatformDefinition,
  type RewardBlockDefinition,
  type SecretRouteDefinition,
} from './types';
import type { PlatformSurfaceKind, PlatformSurfaceTerrainKind, Rect, TurretVariantId } from '../../simulation/state';
import type { StageAudioThemeMetadata } from '../../../audio/audioContract';
import { GRAVITY_FIELD_KINDS, PLATFORM_SURFACE_TERRAIN_KINDS, TURRET_VARIANT_CONFIG } from '../../simulation/state';
import {
  enemyRect,
  expandRect,
  findCheckpointSupport,
  findExitSupport,
  findGroundedEnemySupport,
  findHazardSupport,
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
  gravityCapsulePlayerFieldRect,
  gravityCapsuleRectCrossesDoorBoundary,
  gravityCapsuleRectCrossesSealedShellBoundary,
  gravityCapsuleUsesSideWallDoors,
  intersectsRect,
  isVisibleStableGroundSupport,
  isRectWithinRect,
  isRectWithinWorld,
  rectEquals,
  rectContainsPoint,
  rewardBlockNeedsSupportSnap,
} from './builders';

const GROUND_STOMP_ENEMY_KINDS: EnemyDefinition['kind'][] = ['walker', 'hopper', 'charger'];
const IMMEDIATE_ROUTE_ENEMY_KINDS: EnemyDefinition['kind'][] = ['walker', 'hopper', 'charger', 'turret'];
const POWER_PICKUP_ESCAPE_DISTANCE = 150;
const POWER_PICKUP_SUPPORT_GAP = 56;
const POWER_PICKUP_SUPPORT_HEIGHT_TOLERANCE = 96;
const SECRET_ROUTE_MIN_REWARD_SCORE = 3;
const MAIN_STAGE_IDS = ['forest-ruins', 'amber-cavern', 'sky-sanctum'] as const;
const MAIN_STAGE_TERRAIN_KINDS = ['brittleCrystal', 'stickySludge'] as const;
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
const GRAVITY_ROOM_BUTTON_ROUTE_MIN_RISE = 48;
const GRAVITY_ROOM_BUTTON_LANE_HORIZONTAL_PADDING = 36;
const GRAVITY_ROOM_BUTTON_LANE_VERTICAL_PADDING = 56;
const HOP_HORIZONTAL_REACH = 280;
const HOP_VERTICAL_REACH = 170;
const HOP_FLIGHT_TIME_MIN = 0.42;
const HOP_FLIGHT_TIME_MAX = 0.82;
const HOP_HORIZONTAL_SPEED_LIMIT = 420;
const HOP_IMPULSE_LIMIT = 980;
const EMPTY_PLATFORM_PROGRESSION_SEGMENTS: EmptyPlatformProgressionSegment[] = ['early', 'middle', 'late'];

const rectCenterX = (rect: Rect): number => rect.x + rect.width / 2;
const rectBottom = (rect: Rect): number => rect.y + rect.height;
const rectOverlapWidth = (left: Rect, right: Rect): number =>
  Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x));

const gravityCapsuleRelativeCenterX = (capsule: StageDefinition['gravityCapsules'][number], x: number): number =>
  (x - capsule.shell.x) / capsule.shell.width;

const rectOverlapsY = (left: Rect, right: Rect): boolean => left.y < right.y + right.height && left.y + left.height > right.y;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const hasReachableInitialHopperLanding = (stage: StageDefinition, enemy: EnemyDefinition): boolean => {
  if (enemy.kind !== 'hopper' || !enemy.hop) {
    return true;
  }

  const hop = enemy.hop;

  const currentSupport = findGroundedEnemySupport(stage, enemy);
  if (!currentSupport) {
    return false;
  }

  const bounds = enemyRect(enemy);
  const currentCenterX = enemy.position.x + bounds.width / 2;
  const currentY = currentSupport.y - bounds.height;
  const currentSupportCenterX = currentSupport.x + currentSupport.width / 2;

  return stage.platforms
    .filter((platform) => platform.id !== currentSupport.id && isVisibleStableGroundSupport(platform, ['static', 'spring']))
    .map((platform) => {
      const targetLeft = platform.x;
      const targetRight = platform.x + platform.width - bounds.width;
      if (targetRight < targetLeft) {
        return null;
      }

      const landingX = clamp(currentCenterX - bounds.width / 2, targetLeft, targetRight);
      const landingCenterX = landingX + bounds.width / 2;
      const dx = landingCenterX - currentCenterX;
      const dy = platform.y - bounds.height - currentY;
      if (Math.abs(dx) > HOP_HORIZONTAL_REACH || Math.abs(dy) > HOP_VERTICAL_REACH) {
        return null;
      }

      const baseFlightTime = clamp(
        Math.abs(dx) / Math.max(hop.speed, 1),
        HOP_FLIGHT_TIME_MIN,
        HOP_FLIGHT_TIME_MAX,
      );
      const vy = (dy - 0.5 * stage.world.gravity * baseFlightTime * baseFlightTime) / baseFlightTime;
      const vx = dx / baseFlightTime;
      if (vy >= -120 || Math.abs(vx) > HOP_HORIZONTAL_SPEED_LIMIT || Math.abs(vy) > HOP_IMPULSE_LIMIT) {
        return null;
      }

      const apexTime = Math.abs(vy) / stage.world.gravity;
      const apexY = currentY + vy * apexTime - 0.5 * stage.world.gravity * apexTime * apexTime;
      if (apexY > Math.min(currentY, platform.y - bounds.height) + 24) {
        return null;
      }

      return {
        score: Math.abs(dx) + Math.abs(dy) * 0.75,
        laneScore: Math.abs(platform.x + platform.width / 2 - currentSupportCenterX),
        travelScore: Math.abs(landingX - enemy.position.x),
        landingX,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => a.score - b.score || a.laneScore - b.laneScore || a.travelScore - b.travelScore || a.landingX - b.landingX)
    .length > 0;
};

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

const gravityCapsuleButtonLaneRect = (capsule: StageDefinition['gravityCapsules'][number]): Rect => {
  const left = Math.min(capsule.button.x, capsule.buttonRoute.x) - GRAVITY_ROOM_BUTTON_LANE_HORIZONTAL_PADDING;
  const top = Math.min(capsule.button.y, capsule.buttonRoute.y) - GRAVITY_ROOM_BUTTON_LANE_VERTICAL_PADDING;
  const right =
    Math.max(capsule.button.x + capsule.button.width, capsule.buttonRoute.x + capsule.buttonRoute.width) +
    GRAVITY_ROOM_BUTTON_LANE_HORIZONTAL_PADDING;
  const bottom =
    Math.max(capsule.button.y + capsule.button.height, capsule.buttonRoute.y + capsule.buttonRoute.height) +
    GRAVITY_ROOM_BUTTON_LANE_VERTICAL_PADDING;

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
};

const gravityCapsuleActiveButtonRouteReadsWrong = (
  stage: StageDefinition,
  capsule: StageDefinition['gravityCapsules'][number],
): boolean => {
  const entrySupport = findTraversableSupport(stage, capsule.entryRoute);
  const buttonSupport = findTraversableSupport(stage, capsule.buttonRoute);
  const exitSupport = findTraversableSupport(stage, capsule.exitRoute);
  const entryRise = rectBottom(capsule.entryRoute) - rectBottom(capsule.buttonRoute);
  const exitRise = rectBottom(capsule.exitRoute) - rectBottom(capsule.buttonRoute);
  const buttonOverlap = rectOverlapWidth(capsule.button, capsule.buttonRoute);

  return (
    !entrySupport ||
    !buttonSupport ||
    !exitSupport ||
    entryRise < GRAVITY_ROOM_BUTTON_ROUTE_MIN_RISE ||
    exitRise < GRAVITY_ROOM_BUTTON_ROUTE_MIN_RISE ||
    buttonOverlap < Math.min(capsule.button.width, Math.max(20, Math.floor(capsule.buttonRoute.width * 0.35))) ||
    capsule.button.y + capsule.button.height > buttonSupport.y + 12
  );
};

const gravityCapsuleEnemyBlocksButtonLane = (
  stage: StageDefinition,
  capsule: StageDefinition['gravityCapsules'][number],
): boolean => {
  const linkedEnemyIds = new Set(capsule.contents.enemyIds ?? []);
  if (linkedEnemyIds.size === 0) {
    return false;
  }

  const buttonLane = gravityCapsuleButtonLaneRect(capsule);
  return stage.enemies
    .filter((enemy) => linkedEnemyIds.has(enemy.id))
    .some((enemy) => intersectsRect(expandRect(enemyTraversalEnvelope(stage, enemy), 12), buttonLane));
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
  const unsupportedBlocks = stage.rewardBlocks.filter((block) => rewardBlockNeedsSupportSnap(stage.platforms, block));
  const lockedBlocks = stage.rewardBlocks.filter((block) => isRewardBlockLockedByEnemy(stage, block));
  const forcedHitBlocks = stage.rewardBlocks.filter((block) => isRewardBlockForcedHitRoute(stage, block));
  if (unsupportedBlocks.length > 0) {
    throw new Error(
      `Reward blocks must keep authored visible-ground clearance without support snap: ${unsupportedBlocks
        .map((block) => block.id)
        .join(', ')}`,
    );
  }
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
): { id: string; rect: Rect; kind: 'platform' | 'launcher' | 'collectible' | 'rewardBlock' | 'hazard' | 'enemy' }[] => [
  ...stage.platforms.map((platform) => ({ id: platform.id, rect: platformTraversalEnvelope(platform), kind: 'platform' as const })),
  ...stage.collectibles.map((collectible) => ({ id: collectible.id, rect: collectibleBounds(collectible), kind: 'collectible' as const })),
  ...stage.rewardBlocks.map((block) => ({ id: block.id, rect: block, kind: 'rewardBlock' as const })),
  ...stage.hazards.map((hazard) => ({ id: hazard.id, rect: hazard.rect, kind: 'hazard' as const })),
  ...stage.enemies.map((enemy) => ({ id: enemy.id, rect: enemyTraversalEnvelope(stage, enemy), kind: 'enemy' as const })),
];

const hasLegacyTerrainSurfaceOverlays = (stage: StageDefinition): boolean =>
  Array.isArray((stage as StageDefinition & { terrainSurfaces?: unknown }).terrainSurfaces);

const legacyTerrainSurfaceIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

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

const findEntriesMissingAuthoredFlushSupport = <T extends { id: string }>(
  entries: T[],
  resolveSupport: (entry: T) => PlatformDefinition | null,
): T[] => entries.filter((entry) => !resolveSupport(entry));

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

  const unsupportedEnemies = findEntriesMissingAuthoredFlushSupport(groundedEnemies, (enemy) =>
    findGroundedEnemySupport(stage, enemy),
  );
  if (unsupportedEnemies.length > 0) {
    throw new Error(
      `Non-flying enemies must sit on readable platform support: ${unsupportedEnemies.map((enemy) => enemy.id).join(', ')}`,
    );
  }

  const unsupportedHopperRoutes = groundedEnemies.filter((enemy) => enemy.kind === 'hopper' && !hasReachableInitialHopperLanding(stage, enemy));
  if (unsupportedHopperRoutes.length > 0) {
    throw new Error(
      `Grounded hoppers must author a reachable supported first landing: ${unsupportedHopperRoutes.map((enemy) => enemy.id).join(', ')}`,
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
      case 'terrainVariant':
        return (
          route.cue.platformIds?.every((platformId) =>
            stage.platforms.some(
              (platform) =>
                platform.id === platformId &&
                (platform.surfaceMechanic?.kind === 'brittleCrystal' || platform.surfaceMechanic?.kind === 'stickySludge') &&
                intersectsRect(routeBounds, platform),
            ),
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

export const validateStageCatalogTerrainRollout = (stages: StageDefinition[]): StageDefinition[] => {
  const mainStages = MAIN_STAGE_IDS.map((stageId) => stages.find((stage) => stage.id === stageId)).filter(
    (stage): stage is StageDefinition => Boolean(stage),
  );

  if (mainStages.length !== MAIN_STAGE_IDS.length) {
    throw new Error('Stage catalog must include all shipped main stages before validating terrain rollout.');
  }

  const missingStageTerrain = mainStages.filter((stage) => mainStageTerrainKinds(stage).length === 0);
  if (missingStageTerrain.length > 0) {
    throw new Error(
      `Main stage terrain rollout must keep at least one brittle crystal or sticky sludge beat in each shipped stage: ${missingStageTerrain.map((stage) => stage.id).join(', ')}`,
    );
  }

  const campaignTerrainKinds = new Set<PlatformSurfaceTerrainKind>(mainStages.flatMap((stage) => mainStageTerrainKinds(stage)));
  const missingTerrainKinds = MAIN_STAGE_TERRAIN_KINDS.filter((kind) => !campaignTerrainKinds.has(kind));
  if (missingTerrainKinds.length > 0) {
    throw new Error(
      `Main stage terrain rollout must include both brittle crystal and sticky sludge across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array: missing ${missingTerrainKinds.join(', ')}`,
    );
  }

  const springStageIds = new Set(
    mainStages.filter((stage) => stage.platforms.some((platform) => platform.kind === 'spring')).map((stage) => stage.id),
  );
  if (springStageIds.size < 2) {
    throw new Error('Main stage rollout must place spring platforms in at least two shipped stages.');
  }

  return stages;
};

const authoredSurfacePlatforms = (
  stage: StageDefinition,
  kind?: PlatformSurfaceKind,
): (PlatformDefinition & { surfaceMechanic: NonNullable<PlatformDefinition['surfaceMechanic']> })[] =>
  stage.platforms.filter(
    (platform): platform is PlatformDefinition & { surfaceMechanic: NonNullable<PlatformDefinition['surfaceMechanic']> } =>
      platform.surfaceMechanic !== undefined && (kind == null || platform.surfaceMechanic.kind === kind),
  );

const authoredTerrainVariantPlatforms = (
  stage: StageDefinition,
  kind?: PlatformSurfaceTerrainKind,
): (PlatformDefinition & { surfaceMechanic: { kind: PlatformSurfaceTerrainKind } })[] =>
  authoredSurfacePlatforms(stage).filter(
    (platform): platform is PlatformDefinition & { surfaceMechanic: { kind: PlatformSurfaceTerrainKind } } =>
      PLATFORM_SURFACE_TERRAIN_KINDS.includes(platform.surfaceMechanic.kind as PlatformSurfaceTerrainKind) &&
      (kind == null || platform.surfaceMechanic.kind === kind),
  );

const isTerrainVariantInteriorOnlyDeadEnd = (route: SecretRouteDefinition, platform: PlatformDefinition): boolean =>
  intersectsRect(platform, route.interior) &&
  !intersectsRect(platform, route.entry) &&
  !intersectsRect(platform, route.mainPath) &&
  !intersectsRect(platform, route.reconnect);

const terrainKindsConfinedToDeadEnds = (stage: StageDefinition): PlatformSurfaceTerrainKind[] =>
  MAIN_STAGE_TERRAIN_KINDS.filter((kind) => {
    const authored = authoredTerrainVariantPlatforms(stage, kind);
    return (
      authored.length > 0 &&
      authored.every((platform) => stage.secretRoutes.some((route) => isTerrainVariantInteriorOnlyDeadEnd(route, platform)))
    );
  });

const mainStageTerrainKinds = (stage: StageDefinition): PlatformSurfaceTerrainKind[] =>
  MAIN_STAGE_TERRAIN_KINDS.filter((kind) => authoredTerrainVariantPlatforms(stage, kind).length > 0);

const isSupportedEmptyPlatformFamily = (
  family: EmptyPlatformMechanicFamily,
): family is EmptyPlatformSupportedMechanicFamily =>
  EMPTY_PLATFORM_SUPPORTED_MECHANIC_FAMILIES.includes(family as EmptyPlatformSupportedMechanicFamily);

const validateEmptyPlatformVariety = (stage: StageDefinition): StageDefinition => {
  const runIds = stage.emptyPlatformRuns.map((run) => run.id);
  if (new Set(runIds).size !== runIds.length) {
    throw new Error(`Empty-platform traversal run ids must be unique: ${stage.id}`);
  }

  for (const run of stage.emptyPlatformRuns) {
    if (!run.traversalChallenge) {
      continue;
    }

    const supportedFamilies = [...new Set(run.mechanicFamilies.filter(isSupportedEmptyPlatformFamily))];
    if (supportedFamilies.length === 0) {
      throw new Error(
        `Empty-platform traversal challenge cannot be jump-only: ${stage.id}/${run.id} (segment: ${run.progressionSegment}, missing supported mechanic-family composition)`,
      );
    }

    if (supportedFamilies.length < 2) {
      throw new Error(
        `Empty-platform traversal challenge must include at least two supported mechanic families: ${stage.id}/${run.id} (segment: ${run.progressionSegment}, missing families: ${2 - supportedFamilies.length})`,
      );
    }
  }

  const qualifyingRuns = stage.emptyPlatformRuns.filter((run) => run.traversalChallenge);
  if (qualifyingRuns.length === 0) {
    return stage;
  }

  const coveredSegments = new Set(qualifyingRuns.map((run) => run.progressionSegment));
  const missingSegments = EMPTY_PLATFORM_PROGRESSION_SEGMENTS.filter((segment) => !coveredSegments.has(segment));
  if (missingSegments.length > 0) {
    throw new Error(
      `Empty-platform traversal challenge distribution must cover early, middle, and late segments: ${stage.id} (missing segments: ${missingSegments.join(', ')})`,
    );
  }

  return stage;
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

  const terrainVariantPlatforms = authoredTerrainVariantPlatforms(stage);
  const legacyLaunchers = (stage as StageDefinition & { launchers?: unknown }).launchers;
  if (hasLegacyTerrainSurfaceOverlays(stage)) {
    const legacyIds = legacyTerrainSurfaceIds((stage as StageDefinition & { terrainSurfaces?: unknown }).terrainSurfaces).join(', ');
    throw new Error(
      `Brittle crystal and sticky sludge must be authored on platform terrainVariant instead of terrain surfaces${legacyIds ? `: ${legacyIds}` : ''}`,
    );
  }

  if (Array.isArray(legacyLaunchers) && legacyLaunchers.length > 0) {
    const legacyIds = legacyLaunchers
      .map((entry) => (typeof entry === 'object' && entry && 'id' in entry ? String((entry as { id: unknown }).id) : 'unknown'))
      .join(', ');
    throw new Error(
      `Spring platforms must be authored as platform kinds instead of stage launchers${legacyIds ? `: ${legacyIds}` : ''}`,
    );
  }

  const mixedLegacyRouteSupport = stage.secretRoutes.flatMap((route) =>
    [
      ...legacyTerrainSurfaceIds((route.cue as typeof route.cue & { terrainSurfaceIds?: unknown }).terrainSurfaceIds).map(
        (surfaceId) => `${route.id}->${surfaceId}`,
      ),
      ...legacyTerrainSurfaceIds((route.cue as typeof route.cue & { launcherIds?: unknown }).launcherIds).map(
        (surfaceId) => `${route.id}->${surfaceId}`,
      ),
    ],
  );
  if (mixedLegacyRouteSupport.length > 0) {
    throw new Error(`Secret routes must reference platform-owned surface mechanics through platform ids: ${mixedLegacyRouteSupport.join(', ')}`);
  }

  const mixedLegacyCapsuleSupport = stage.gravityCapsules.flatMap((capsule) =>
    [
      ...legacyTerrainSurfaceIds(
        (capsule.contents as typeof capsule.contents & { terrainSurfaceIds?: unknown }).terrainSurfaceIds,
      ).map((surfaceId) => `${capsule.id}->${surfaceId}`),
      ...legacyTerrainSurfaceIds(
        (capsule.contents as typeof capsule.contents & { launcherIds?: unknown }).launcherIds,
      ).map((surfaceId) => `${capsule.id}->${surfaceId}`),
    ],
  );
  if (mixedLegacyCapsuleSupport.length > 0) {
    throw new Error(`Gravity rooms must reference platform-owned surface mechanics through platform ids: ${mixedLegacyCapsuleSupport.join(', ')}`);
  }

  const invalidTerrainVariantPlatforms = terrainVariantPlatforms.filter(
    (platform) =>
      platform.kind !== 'static' || Boolean(platform.reveal) || Boolean(platform.temporaryBridge) || Boolean(platform.magnetic),
  );
  if (invalidTerrainVariantPlatforms.length > 0) {
    throw new Error(
      `Platform surface mechanics must stay on plain static platforms: ${invalidTerrainVariantPlatforms.map((platform) => platform.id).join(', ')}`,
    );
  }

  const retiredSurfaceMechanicPlatforms = authoredSurfacePlatforms(stage).filter(
    (platform) => !PLATFORM_SURFACE_TERRAIN_KINDS.includes(platform.surfaceMechanic.kind as PlatformSurfaceTerrainKind),
  );
  if (retiredSurfaceMechanicPlatforms.length > 0) {
    throw new Error(
      `Platform surface mechanics only support brittle crystal and sticky sludge on static platforms: ${retiredSurfaceMechanicPlatforms
        .map((platform) => `${platform.id}:${platform.surfaceMechanic.kind}`)
        .join(', ')}`,
    );
  }

  const overlappingSpringPlatforms: string[] = [];
  const springPlatforms = stage.platforms.filter((platform) => platform.kind === 'spring');
  for (let index = 0; index < springPlatforms.length; index += 1) {
    const current = springPlatforms[index];
    for (const platform of stage.platforms) {
      if (platform.id === current.id) {
        continue;
      }

      if (intersectsRect(current, platform)) {
        overlappingSpringPlatforms.push(`${current.id}<->${platform.id}`);
      }
    }
  }

  if (overlappingSpringPlatforms.length > 0) {
    throw new Error(
      `Spring platforms must use one full-footprint authored support beat instead of overlapping plain-support stand-ins: ${overlappingSpringPlatforms.join(', ')}`,
    );
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
    const playerField = gravityCapsulePlayerFieldRect(capsule);
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
      !rectEquals(field, playerField) ||
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

  const invalidGravityCapsuleEnemyContainment = stage.gravityCapsules.filter((capsule) => {
    const linkedEnemyIds = new Set(capsule.contents.enemyIds ?? []);

    return stage.enemies.some((enemy) => {
      const startRect = enemyRect(enemy);
      const traversalEnvelope = enemyTraversalEnvelope(stage, enemy);
      const startsInside = isRectWithinRect(capsule.shell, startRect);
      const overlapsShell = intersectsRect(startRect, capsule.shell);

      if (linkedEnemyIds.has(enemy.id)) {
        return !startsInside || gravityCapsuleRectCrossesDoorBoundary(capsule, traversalEnvelope);
      }

      if (overlapsShell) {
        return true;
      }

      return gravityCapsuleRectCrossesDoorBoundary(capsule, traversalEnvelope);
    });
  });
  if (invalidGravityCapsuleEnemyContainment.length > 0) {
    throw new Error(
      `Gravity rooms must keep enemies assigned to their authored side of side-wall doors: ${invalidGravityCapsuleEnemyContainment.map((capsule) => capsule.id).join(', ')}`,
    );
  }

  if (MAIN_STAGE_IDS.includes(stage.id as (typeof MAIN_STAGE_IDS)[number])) {
    const unfocusedGravityCapsules = stage.gravityCapsules.filter((capsule) => {
      const interiorEntries = gravityCapsuleInteriorEntriesByKind(stage, capsule);
      const linkedPlatformIds = new Set(capsule.contents.platformIds ?? []);
      const linkedEnemyIds = new Set(capsule.contents.enemyIds ?? []);
      const unexpectedPlatformIds = interiorEntries.platformIds.filter((platformId) => !linkedPlatformIds.has(platformId));
      const unexpectedEnemyIds = interiorEntries.enemyIds.filter((enemyId) => !linkedEnemyIds.has(enemyId));

      return (
        unexpectedPlatformIds.length > 0 ||
        unexpectedEnemyIds.length > 0 ||
        interiorEntries.collectibleIds.length > 0 ||
        interiorEntries.rewardBlockIds.length > 0 ||
        interiorEntries.hazardIds.length > 0 ||
        (capsule.contents.collectibleIds?.length ?? 0) > 0 ||
        (capsule.contents.rewardBlockIds?.length ?? 0) > 0 ||
        (capsule.contents.hazardIds?.length ?? 0) > 0
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

  const unreadableGravityCapsuleButtons = stage.gravityCapsules.filter((capsule) =>
    gravityCapsuleActiveButtonRouteReadsWrong(stage, capsule),
  );
  if (unreadableGravityCapsuleButtons.length > 0) {
    throw new Error(
      `Gravity rooms must keep the active-field inverse-jump route to their interior disable button readable and reachable: ${unreadableGravityCapsuleButtons
        .map((capsule) => capsule.id)
        .join(', ')}`,
    );
  }

  const blockedGravityCapsuleButtonLanes = stage.gravityCapsules.filter((capsule) =>
    gravityCapsuleEnemyBlocksButtonLane(stage, capsule),
  );
  if (blockedGravityCapsuleButtonLanes.length > 0) {
    throw new Error(
      `Gravity rooms must keep contained interior enemies from blocking the only button lane: ${blockedGravityCapsuleButtonLanes
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
    const restoredTerrainPlatforms = authoredTerrainVariantPlatforms(stage);
    if (restoredTerrainPlatforms.length === 0) {
      throw new Error(
        `Main stages must author at least one readable brittle crystal or sticky sludge terrain variant: ${stage.id}`,
      );
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

  if (stage.stageObjective) {
    const objectiveTargets: Record<'checkpoint' | 'revealVolume' | 'scannerVolume', Set<string>> = {
      checkpoint: checkpointIds,
      revealVolume: revealVolumeIds,
      scannerVolume: uniqueScannerIds,
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

  const unsupportedCheckpoints = findEntriesMissingAuthoredFlushSupport(stage.checkpoints, (checkpoint) =>
    findCheckpointSupport(stage, checkpoint.rect),
  );
  if (unsupportedCheckpoints.length > 0) {
    throw new Error(
      `Checkpoints must stand on visible stable route support: ${unsupportedCheckpoints.map((checkpoint) => checkpoint.id).join(', ')}`,
    );
  }

  const unsupportedHazards = findEntriesMissingAuthoredFlushSupport(stage.hazards, (hazard) =>
    findHazardSupport(stage, hazard.rect),
  );
  if (unsupportedHazards.length > 0) {
    throw new Error(
      `Hazards must sit on readable grounded support: ${unsupportedHazards.map((hazard) => hazard.id).join(', ')}`,
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
      validateTraversalMechanics(
        validateEmptyPlatformVariety(validateEnemyPlacement(validateStaticElementCollisions(validateRewardBlocks(stage)))),
      ),
    ),
  );
