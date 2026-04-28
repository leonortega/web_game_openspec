import type {
  ActivationNodeDefinition,
  EnemyDefinition,
  GravityCapsuleButtonDefinition,
  GravityCapsuleDefinition,
  GravityCapsuleDoorSupportsDefinition,
  GravityCapsuleRoomContentDefinition,
  GravityFieldDefinition,
  PlatformDefinition,
  RevealVolumeDefinition,
  RewardBlockDefinition,
  ScannerVolumeDefinition,
  StageDefinition,
  StartCabinDefinition,
} from './types';
import type { GravityFieldKind, PlatformSurfaceKind, Rect, RewardDefinition, Vector2 } from '../../simulation/state';

const BLOCK_CLEARANCE_ABOVE_FLOOR = 72;

export const ground = (x: number, y: number, width: number, height = 32): PlatformDefinition => ({
  id: `platform-${x}-${y}`,
  kind: 'static',
  x,
  y,
  width,
  height,
});

export const moving = (
  x: number,
  y: number,
  width: number,
  height: number,
  axis: 'x' | 'y',
  range: number,
  speed: number,
): PlatformDefinition => ({
  id: `platform-${x}-${y}-moving`,
  kind: 'moving',
  x,
  y,
  width,
  height,
  move: { axis, range, speed },
});

export const falling = (
  x: number,
  y: number,
  width: number,
  height = 32,
  triggerDelayMs = 650,
  stayArmThresholdMs = 120,
  hopGapThresholdMs = 50,
): PlatformDefinition => ({
  id: `platform-${x}-${y}-falling`,
  kind: 'falling',
  x,
  y,
  width,
  height,
  fall: { triggerDelayMs, stayArmThresholdMs, hopGapThresholdMs },
});

export const spring = (x: number, y: number, width: number, height = 32, boost = 860): PlatformDefinition => ({
  id: `platform-${x}-${y}-spring`,
  kind: 'spring',
  x,
  y,
  width,
  height,
  spring: { boost, cooldownMs: 350 },
});

export const startCabin = (centerX: number, baseY: number, facing: 1 | -1 = 1): StartCabinDefinition => ({
  centerX,
  baseY,
  facing,
});

export const revealPlatform = (
  id: string,
  revealId: string,
  x: number,
  y: number,
  width: number,
  height = 24,
): PlatformDefinition => ({
  id,
  kind: 'static',
  x,
  y,
  width,
  height,
  reveal: { id: revealId },
});

export const temporaryBridgePlatform = (
  id: string,
  scannerId: string,
  x: number,
  y: number,
  width: number,
  height = 24,
  durationMs = 2200,
  revealId?: string,
): PlatformDefinition => ({
  id,
  kind: 'static',
  x,
  y,
  width,
  height,
  reveal: revealId ? { id: revealId } : undefined,
  temporaryBridge: { scannerId, durationMs },
});

export const gravityField = (
  id: string,
  kind: GravityFieldKind,
  x: number,
  y: number,
  width: number,
  height: number,
  gravityCapsuleId?: string,
): GravityFieldDefinition => ({
  id,
  kind,
  x,
  y,
  width,
  height,
  gravityCapsuleId,
});

export const revealVolume = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  revealPlatformIds: string[],
): RevealVolumeDefinition => ({
  id,
  x,
  y,
  width,
  height,
  revealPlatformIds,
});

export const scannerVolume = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  temporaryBridgeIds: string[],
): ScannerVolumeDefinition => ({
  id,
  x,
  y,
  width,
  height,
  temporaryBridgeIds,
});

export const activationNode = (
  id: string,
  x: number,
  y: number,
  width = 28,
  height = 48,
): ActivationNodeDefinition => ({
  id,
  x,
  y,
  width,
  height,
});

export const magneticPlatform = (
  id: string,
  activationNodeId: string,
  x: number,
  y: number,
  width: number,
  height = 20,
): PlatformDefinition => ({
  id,
  kind: 'static',
  x,
  y,
  width,
  height,
  magnetic: { activationNodeId },
});

export const withSurfaceMechanic = <T extends PlatformDefinition>(
  platform: T,
  kind: PlatformSurfaceKind,
): T & { surfaceMechanic: NonNullable<PlatformDefinition['surfaceMechanic']> } => ({
  ...platform,
  surfaceMechanic: { kind },
});

export const rewardBlock = (
  id: string,
  x: number,
  y: number,
  reward: RewardDefinition,
  width = 40,
  height = 40,
): RewardBlockDefinition => ({
  id,
  x,
  y,
  width,
  height,
  reward,
});

export const expandRect = (rect: Rect, padding: number): Rect => ({
  x: rect.x - padding,
  y: rect.y - padding,
  width: rect.width + padding * 2,
  height: rect.height + padding * 2,
});

export const isRectWithinWorld = (stage: StageDefinition, rect: Rect): boolean =>
  rect.width > 0 &&
  rect.height > 0 &&
  rect.x >= 0 &&
  rect.y >= 0 &&
  rect.x + rect.width <= stage.world.width &&
  rect.y + rect.height <= stage.world.height;

export const isRectWithinRect = (outer: Rect, inner: Rect): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

export const rectEquals = (left: Rect, right: Rect): boolean =>
  left.x === right.x &&
  left.y === right.y &&
  left.width === right.width &&
  left.height === right.height;

export const rectContainsPoint = (rect: Rect, point: Vector2): boolean =>
  point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;

const blockCenterX = (block: RewardBlockDefinition): number => block.x + block.width / 2;

const findSupportBelow = (
  platforms: PlatformDefinition[],
  block: RewardBlockDefinition,
): PlatformDefinition | null => {
  const centerX = blockCenterX(block);
  const blockBottom = block.y + block.height;
  return (
    platforms
      .filter((platform) => !platform.temporaryBridge)
      .filter((platform) => !platform.reveal)
      .filter(
        (platform) =>
          centerX >= platform.x &&
          centerX <= platform.x + platform.width &&
          platform.y >= blockBottom,
      )
      .sort((left, right) => left.y - right.y)[0] ?? null
  );
};

export const gravityCapsule = (
  id: string,
  fieldId: string,
  shell: Rect,
  entryDoor: Rect,
  exitDoor: Rect,
  button: GravityCapsuleButtonDefinition,
  entryRoute: Rect,
  buttonRoute: Rect,
  exitRoute: Rect,
  contents: GravityCapsuleRoomContentDefinition,
  doorSupports?: GravityCapsuleDoorSupportsDefinition,
): GravityCapsuleDefinition => ({
  id,
  fieldId,
  shell,
  entryDoor,
  exitDoor,
  button,
  entryRoute,
  buttonRoute,
  exitRoute,
  contents,
  doorSupports,
});

export const gravityCapsulePlayerFieldRect = (
  capsule: Pick<GravityCapsuleDefinition, 'shell'>,
): Rect => ({
  ...capsule.shell,
});

export const findSupportBelowSpan = (
  platforms: PlatformDefinition[],
  x: number,
  width: number,
  bottom: number,
): PlatformDefinition | null => {
  const centerX = x + width / 2;
  return (
    platforms
      .filter(
        (platform) =>
          centerX >= platform.x &&
          centerX <= platform.x + platform.width &&
          platform.y >= bottom,
      )
      .sort((left, right) => left.y - right.y)[0] ?? null
  );
};

const repositionRewardBlock = (
  block: RewardBlockDefinition,
  platforms: PlatformDefinition[],
  fallbackY: number,
): RewardBlockDefinition => {
  const support = findSupportBelow(platforms, block);
  if (!support) {
    return block;
  }

  const targetY = support.y - block.height - BLOCK_CLEARANCE_ABOVE_FLOOR;
  return {
    ...block,
    y: fallbackY <= targetY ? fallbackY : targetY,
  };
};

export const rewardBlockNeedsSupportSnap = (
  platforms: PlatformDefinition[],
  block: RewardBlockDefinition,
): boolean => repositionRewardBlock(block, platforms, block.y).y !== block.y;

export const normalizeRewardBlocks = (
  platforms: PlatformDefinition[],
  blocks: RewardBlockDefinition[],
): RewardBlockDefinition[] => blocks.map((block) => repositionRewardBlock(block, platforms, block.y));

export const enemyRect = (enemy: EnemyDefinition): Rect => ({
  x: enemy.position.x,
  y: enemy.position.y,
  width: enemy.kind === 'turret' ? 28 : 34,
  height: enemy.kind === 'turret' ? 38 : enemy.kind === 'flyer' ? 24 : 30,
});

export const intersectsRect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

export const overlapWidth = (leftStart: number, leftEnd: number, rightStart: number, rightEnd: number): number =>
  Math.max(0, Math.min(leftEnd, rightEnd) - Math.max(leftStart, rightStart));

export const overlapHeight = (topStart: number, topEnd: number, bottomStart: number, bottomEnd: number): number =>
  Math.max(0, Math.min(topEnd, bottomEnd) - Math.max(topStart, bottomStart));

const groundedSupportSortScore = (rect: Rect, platform: PlatformDefinition): [number, number, number] => {
  const overlap = overlapWidth(rect.x, rect.x + rect.width, platform.x, platform.x + platform.width);
  return [Math.abs(rect.y + rect.height - platform.y), -overlap, platform.x];
};

export const isVisibleStableGroundSupport = (
  platform: PlatformDefinition,
  supportKinds: readonly PlatformDefinition['kind'][],
): boolean =>
  supportKinds.includes(platform.kind) &&
  !platform.reveal &&
  !platform.temporaryBridge &&
  !platform.magnetic;

export const findVisibleGroundSupport = (
  stage: StageDefinition,
  rect: Rect,
  overlapRatio: number,
  heightTolerance: number,
  supportKinds: readonly PlatformDefinition['kind'][],
): PlatformDefinition | null =>
  (
    stage.platforms
      .filter((platform) => {
        if (!isVisibleStableGroundSupport(platform, supportKinds)) {
          return false;
        }

        const overlap = overlapWidth(rect.x, rect.x + rect.width, platform.x, platform.x + platform.width);
        return overlap >= Math.min(rect.width * overlapRatio, platform.width) && Math.abs(rect.y + rect.height - platform.y) <= heightTolerance;
      })
      .sort((left, right) => {
        const leftScore = groundedSupportSortScore(rect, left);
        const rightScore = groundedSupportSortScore(rect, right);
        return leftScore[0] - rightScore[0] || leftScore[1] - rightScore[1] || leftScore[2] - rightScore[2];
      })[0] ?? null
  );

export const findVisibleFlushGroundSupport = (
  stage: StageDefinition,
  rect: Rect,
  overlapRatio: number,
  supportKinds: readonly PlatformDefinition['kind'][],
): PlatformDefinition | null => findVisibleGroundSupport(stage, rect, overlapRatio, 0, supportKinds);

export const resolveAuthoredFlushRectOnSupport = (
  stage: StageDefinition,
  rect: Rect,
  overlapRatio: number,
  supportKinds: readonly PlatformDefinition['kind'][],
): { rect: Rect; support: PlatformDefinition } | null => {
  const support = findVisibleGroundSupport(stage, rect, overlapRatio, 3, supportKinds);
  if (!support) {
    return null;
  }

  return {
    rect: {
      ...rect,
      y: support.y - rect.height,
    },
    support,
  };
};

export const gravityCapsuleShellWallThickness = (capsule: Pick<GravityCapsuleDefinition, 'entryDoor' | 'exitDoor'>): number =>
  Math.max(6, Math.min(12, Math.floor(Math.min(capsule.entryDoor.height, capsule.exitDoor.height) / 4)));

const gravityCapsuleEntryDoorOnLeftWall = (capsule: GravityCapsuleDefinition): boolean =>
  capsule.entryDoor.x === capsule.shell.x;

const gravityCapsuleExitDoorOnRightWall = (capsule: GravityCapsuleDefinition): boolean =>
  capsule.exitDoor.x + capsule.exitDoor.width === capsule.shell.x + capsule.shell.width;

const gravityCapsuleSealedBottomSpans = (capsule: GravityCapsuleDefinition): Array<{ left: number; right: number }> => {
  const shellRight = capsule.shell.x + capsule.shell.width;

  return [{ left: capsule.shell.x, right: shellRight }];
};

const gravityCapsuleSealedLeftWallSpans = (capsule: GravityCapsuleDefinition): Array<{ top: number; bottom: number }> => [
  { top: capsule.shell.y, bottom: capsule.entryDoor.y },
  { top: capsule.entryDoor.y + capsule.entryDoor.height, bottom: capsule.shell.y + capsule.shell.height },
].filter((span) => span.bottom > span.top);

const gravityCapsuleSealedRightWallSpans = (capsule: GravityCapsuleDefinition): Array<{ top: number; bottom: number }> => [
  { top: capsule.shell.y, bottom: capsule.exitDoor.y },
  { top: capsule.exitDoor.y + capsule.exitDoor.height, bottom: capsule.shell.y + capsule.shell.height },
].filter((span) => span.bottom > span.top);
;

const rectCrossesVerticalWallAtSealedSpan = (
  rect: Rect,
  wallX: number,
  spans: Array<{ top: number; bottom: number }>,
): boolean =>
  rect.x < wallX && rect.x + rect.width > wallX && spans.some((span) => overlapHeight(rect.y, rect.y + rect.height, span.top, span.bottom) > 0);

const rectCrossesHorizontalWallAtSealedSpan = (
  rect: Rect,
  wallY: number,
  spans: Array<{ left: number; right: number }>,
): boolean =>
  rect.y < wallY && rect.y + rect.height > wallY && spans.some((span) => overlapWidth(rect.x, rect.x + rect.width, span.left, span.right) > 0);

export const gravityCapsuleUsesSideWallDoors = (capsule: GravityCapsuleDefinition): boolean => {
  const shellBottom = capsule.shell.y + capsule.shell.height;

  return (
    gravityCapsuleEntryDoorOnLeftWall(capsule) &&
    gravityCapsuleExitDoorOnRightWall(capsule) &&
    capsule.entryDoor.y > capsule.shell.y &&
    capsule.exitDoor.y > capsule.shell.y &&
    capsule.entryDoor.y + capsule.entryDoor.height < shellBottom &&
    capsule.exitDoor.y + capsule.exitDoor.height < shellBottom
  );
};

export const gravityCapsuleRectCrossesSealedShellBoundary = (capsule: GravityCapsuleDefinition, rect: Rect): boolean => {
  const shellRight = capsule.shell.x + capsule.shell.width;
  const shellBottom = capsule.shell.y + capsule.shell.height;
  const overlapsShellHeight = rect.y < shellBottom && rect.y + rect.height > capsule.shell.y;
  const overlapsShellWidth = rect.x < shellRight && rect.x + rect.width > capsule.shell.x;

  if (overlapsShellHeight && rectCrossesVerticalWallAtSealedSpan(rect, capsule.shell.x, gravityCapsuleSealedLeftWallSpans(capsule))) {
    return true;
  }

  if (overlapsShellHeight && rectCrossesVerticalWallAtSealedSpan(rect, shellRight, gravityCapsuleSealedRightWallSpans(capsule))) {
    return true;
  }

  if (overlapsShellWidth && rect.y < capsule.shell.y && rect.y + rect.height > capsule.shell.y) {
    return true;
  }

  if (rectCrossesHorizontalWallAtSealedSpan(rect, shellBottom, gravityCapsuleSealedBottomSpans(capsule))) {
    return true;
  }

  return false;
};

export const gravityCapsuleRectCrossesDoorBoundary = (capsule: GravityCapsuleDefinition, rect: Rect): boolean => {
  const shellRight = capsule.shell.x + capsule.shell.width;
  const crossesEntryDoor =
    rect.x < capsule.shell.x &&
    rect.x + rect.width > capsule.shell.x &&
    overlapHeight(rect.y, rect.y + rect.height, capsule.entryDoor.y, capsule.entryDoor.y + capsule.entryDoor.height) > 0;
  const crossesExitDoor =
    rect.x < shellRight &&
    rect.x + rect.width > shellRight &&
    overlapHeight(rect.y, rect.y + rect.height, capsule.exitDoor.y, capsule.exitDoor.y + capsule.exitDoor.height) > 0;

  return crossesEntryDoor || crossesExitDoor;
};

const gravityCapsuleDoorPathPlatformRect = (platform: PlatformDefinition): Rect => {
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

export const gravityCapsuleDoorSupportRect = (platform: PlatformDefinition): Rect => gravityCapsuleDoorPathPlatformRect(platform);

const isSupportedDoorPathRect = (
  supportRect: Rect,
  pathRect: Rect,
  heightTolerance: number,
): boolean => {
  const overlap = overlapWidth(pathRect.x, pathRect.x + pathRect.width, supportRect.x, supportRect.x + supportRect.width);
  return (
    overlap >= Math.min(Math.max(24, Math.floor(pathRect.width * 0.55)), supportRect.width) &&
    Math.abs(pathRect.y + pathRect.height - supportRect.y) <= heightTolerance
  );
};

const findExpectedGravityCapsuleDoorPathSupport = (
  stage: StageDefinition,
  platformId: string | null | undefined,
  routeRects: Rect[],
  heightTolerance: number,
): PlatformDefinition | null => {
  if (!platformId) {
    return null;
  }

  const platform = stage.platforms.find((entry) => entry.id === platformId) ?? null;
  if (
    !platform ||
    ((platform.kind !== 'static' && platform.kind !== 'moving' && platform.kind !== 'falling') || platform.reveal || platform.temporaryBridge)
  ) {
    return null;
  }

  const supportRect = gravityCapsuleDoorPathPlatformRect(platform);
  return routeRects.every((routeRect) => isSupportedDoorPathRect(supportRect, routeRect, heightTolerance)) ? platform : null;
};

export const gravityCapsuleDoorSupportsReuseRoute = (capsule: GravityCapsuleDefinition): boolean => {
  if (!capsule.doorSupports) {
    return false;
  }

  const routeSupportIds = new Set(capsule.doorSupports.routePlatformIds);
  return (
    routeSupportIds.has(capsule.doorSupports.entryApproachPlatformId) &&
    routeSupportIds.has(capsule.doorSupports.exitInteriorPlatformId) &&
    routeSupportIds.has(capsule.doorSupports.exitReconnectPlatformId)
  );
};

export const findGravityCapsuleDoorFooting = (
  stage: StageDefinition,
  door: Rect,
  route: Rect,
): PlatformDefinition | null => {
  const minimumDoorOverlap = Math.floor(door.width * 0.65);
  const minimumRouteOverlap = Math.floor(route.width * 0.55);
  const minimumVerticalOverlap = Math.max(12, Math.floor(door.height * 0.35));

  return (
    stage.platforms.find((platform) => {
      if ((platform.kind !== 'static' && platform.kind !== 'moving') || platform.reveal || platform.temporaryBridge) {
        return false;
      }

      const pathRect = gravityCapsuleDoorPathPlatformRect(platform);
      const verticalOverlap = Math.max(
        0,
        Math.min(door.y + door.height, pathRect.y + pathRect.height) - Math.max(door.y, pathRect.y),
      );

      if (verticalOverlap < minimumVerticalOverlap) {
        return false;
      }

      const doorOverlap = overlapWidth(door.x, door.x + door.width, pathRect.x, pathRect.x + pathRect.width);
      const routeOverlap = overlapWidth(route.x, route.x + route.width, pathRect.x, pathRect.x + pathRect.width);

      return (
        doorOverlap >= Math.min(minimumDoorOverlap, pathRect.width) &&
        routeOverlap >= Math.min(minimumRouteOverlap, pathRect.width)
      );
    }) ?? null
  );
};

export const findGravityCapsuleEntryDoorApproach = (
  stage: StageDefinition,
  capsule: GravityCapsuleDefinition,
): PlatformDefinition | null =>
  findExpectedGravityCapsuleDoorPathSupport(
    stage,
    capsule.doorSupports?.entryApproachPlatformId,
    capsule.doorSupports ? [capsule.doorSupports.entryApproachPath] : [],
    64,
  );

export const findGravityCapsuleExitDoorInteriorAccess = (
  stage: StageDefinition,
  capsule: GravityCapsuleDefinition,
): PlatformDefinition | null =>
  findExpectedGravityCapsuleDoorPathSupport(
    stage,
    capsule.doorSupports?.exitInteriorPlatformId,
    [capsule.exitRoute],
    40,
  );

export const findGravityCapsuleExitDoorReconnect = (
  stage: StageDefinition,
  capsule: GravityCapsuleDefinition,
): PlatformDefinition | null =>
  findExpectedGravityCapsuleDoorPathSupport(
    stage,
    capsule.doorSupports?.exitReconnectPlatformId,
    capsule.doorSupports ? [capsule.doorSupports.exitReconnectPath] : [],
    64,
  );

export const findTraversableSupport = (stage: StageDefinition, rect: Rect, heightTolerance = 24): PlatformDefinition | null => {
  const rectBottom = rect.y + rect.height;
  return (
    stage.platforms.find((platform) => {
      const overlap = overlapWidth(rect.x, rect.x + rect.width, platform.x, platform.x + platform.width);
      return overlap >= Math.min(rect.width * 0.55, platform.width) && Math.abs(rectBottom - platform.y) <= heightTolerance;
    }) ?? null
  );
};

const CHECKPOINT_SUPPORT_OVERLAP_RATIO = 0.75;

const HAZARD_SUPPORT_OVERLAP_RATIO = 0.55;
const GROUNDED_ENEMY_SUPPORT_OVERLAP_RATIO = 0.55;

export const findGroundedEnemySupport = (stage: StageDefinition, enemy: EnemyDefinition): PlatformDefinition | null =>
  resolveAuthoredFlushRectOnSupport(stage, enemyRect(enemy), GROUNDED_ENEMY_SUPPORT_OVERLAP_RATIO, ['static', 'spring'])?.support ??
  null;

export const resolveGroundedEnemyRect = (stage: StageDefinition, enemy: EnemyDefinition): Rect | null =>
  resolveAuthoredFlushRectOnSupport(stage, enemyRect(enemy), GROUNDED_ENEMY_SUPPORT_OVERLAP_RATIO, ['static', 'spring'])?.rect ?? null;

export const findCheckpointSupport = (stage: StageDefinition, checkpointRect: Rect): PlatformDefinition | null =>
  resolveAuthoredFlushRectOnSupport(stage, checkpointRect, CHECKPOINT_SUPPORT_OVERLAP_RATIO, ['static'])?.support ?? null;

export const resolveCheckpointRect = (stage: StageDefinition, checkpointRect: Rect): Rect | null => {
  return resolveAuthoredFlushRectOnSupport(stage, checkpointRect, CHECKPOINT_SUPPORT_OVERLAP_RATIO, ['static'])?.rect ?? null;
};

export const findHazardSupport = (stage: StageDefinition, hazardRect: Rect): PlatformDefinition | null =>
  resolveAuthoredFlushRectOnSupport(stage, hazardRect, HAZARD_SUPPORT_OVERLAP_RATIO, ['static', 'falling', 'spring'])?.support ??
  null;

export const resolveHazardRect = (stage: StageDefinition, hazardRect: Rect): Rect | null => {
  return (
    resolveAuthoredFlushRectOnSupport(stage, hazardRect, HAZARD_SUPPORT_OVERLAP_RATIO, ['static', 'falling', 'spring'])?.rect ??
    null
  );
};

export const resolveCheckpointRespawnPoint = (
  stage: StageDefinition,
  checkpointRect: Rect,
  playerWidth: number,
  playerHeight: number,
): { x: number; y: number; supportPlatformId: string } | null => {
  const support = findCheckpointSupport(stage, checkpointRect);
  const resolvedRect = resolveCheckpointRect(stage, checkpointRect);
  if (!support || !resolvedRect) {
    return null;
  }

  const desiredX = resolvedRect.x + Math.floor(resolvedRect.width / 2);
  const maxSpawnX = support.x + Math.max(0, support.width - playerWidth);

  return {
    x: Math.min(Math.max(desiredX, support.x), maxSpawnX),
    y: support.y - playerHeight,
    supportPlatformId: support.id,
  };
};

export const findExitSupport = (stage: StageDefinition, exitRect: Rect): PlatformDefinition | null => {
  return resolveAuthoredFlushRectOnSupport(stage, exitRect, 0.55, ['static'])?.support ?? null;
};

const collectibleRect = (collectible: StageDefinition['collectibles'][number]): Rect => ({
  x: collectible.position.x - 8,
  y: collectible.position.y - 8,
  width: 16,
  height: 16,
});

export const gravityCapsuleContentEntries = (stage: StageDefinition, capsule: GravityCapsuleDefinition): { id: string; rect: Rect }[] => {
  const entries: { id: string; rect: Rect }[] = [];
  const pushRect = (id: string, rect: Rect | null | undefined) => {
    if (rect) {
      entries.push({ id, rect });
    }
  };

  for (const id of capsule.contents.platformIds ?? []) {
    pushRect(id, stage.platforms.find((platform) => platform.id === id) ?? null);
  }

  for (const id of capsule.contents.collectibleIds ?? []) {
    const collectible = stage.collectibles.find((entry) => entry.id === id) ?? null;
    pushRect(id, collectible ? collectibleRect(collectible) : null);
  }

  for (const id of capsule.contents.rewardBlockIds ?? []) {
    pushRect(id, stage.rewardBlocks.find((block) => block.id === id) ?? null);
  }

  for (const id of capsule.contents.hazardIds ?? []) {
    pushRect(id, stage.hazards.find((hazard) => hazard.id === id)?.rect ?? null);
  }

  for (const id of capsule.contents.enemyIds ?? []) {
    const enemy = stage.enemies.find((entry) => entry.id === id) ?? null;
    pushRect(id, enemy ? enemyRect(enemy) : null);
  }

  return entries;
};

export const gravityCapsuleInteriorEntriesByKind = (stage: StageDefinition, capsule: GravityCapsuleDefinition) => ({
  platformIds: stage.platforms.filter((platform) => intersectsRect(platform, capsule.shell)).map((platform) => platform.id),
  collectibleIds: stage.collectibles
    .filter((collectible) => intersectsRect(collectibleRect(collectible), capsule.shell))
    .map((collectible) => collectible.id),
  rewardBlockIds: stage.rewardBlocks.filter((block) => intersectsRect(block, capsule.shell)).map((block) => block.id),
  hazardIds: stage.hazards.filter((hazard) => intersectsRect(hazard.rect, capsule.shell)).map((hazard) => hazard.id),
  enemyIds: stage.enemies.filter((enemy) => intersectsRect(enemyRect(enemy), capsule.shell)).map((enemy) => enemy.id),
});

export const gravityCapsuleHasBlockingShellWalls = (capsule: GravityCapsuleDefinition): boolean => {
  return (
    gravityCapsuleUsesSideWallDoors(capsule) &&
    gravityCapsuleSealedLeftWallSpans(capsule).length === 2 &&
    gravityCapsuleSealedRightWallSpans(capsule).length === 2 &&
    gravityCapsuleSealedBottomSpans(capsule).length === 1
  );
};
