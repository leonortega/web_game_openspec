import type {
  ActivationNodeDefinition,
  EnemyDefinition,
  GravityCapsuleButtonDefinition,
  GravityCapsuleDefinition,
  GravityCapsuleRoomContentDefinition,
  GravityFieldDefinition,
  LauncherDefinition,
  PlatformDefinition,
  RevealVolumeDefinition,
  RewardBlockDefinition,
  ScannerVolumeDefinition,
  StageDefinition,
  StartCabinDefinition,
  TerrainSurfaceDefinition,
} from './types';
import type { GravityFieldKind, LauncherKind, Rect, RewardDefinition, TerrainSurfaceKind, Vector2 } from '../../simulation/state';

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

export const falling = (x: number, y: number, width: number, height = 32, triggerDelayMs = 650): PlatformDefinition => ({
  id: `platform-${x}-${y}-falling`,
  kind: 'falling',
  x,
  y,
  width,
  height,
  fall: { triggerDelayMs },
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

export const withTerrainVariant = <T extends PlatformDefinition>(
  platform: T,
  terrainVariant: TerrainSurfaceKind,
): T & { terrainVariant: TerrainSurfaceKind } => ({
  ...platform,
  terrainVariant,
});

export const terrainSurface = (
  id: string,
  kind: TerrainSurfaceKind,
  x: number,
  y: number,
  width: number,
  height = 12,
): TerrainSurfaceDefinition => ({
  id,
  kind,
  x,
  y,
  width,
  height,
});

export const launcher = (
  id: string,
  kind: LauncherKind,
  x: number,
  y: number,
  width: number,
  height = 14,
  direction?: Vector2,
): LauncherDefinition => ({
  id,
  kind,
  x,
  y,
  width,
  height,
  direction,
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

export const findTraversableSupport = (stage: StageDefinition, rect: Rect, heightTolerance = 24): PlatformDefinition | null => {
  const rectBottom = rect.y + rect.height;
  return (
    stage.platforms.find((platform) => {
      const overlap = overlapWidth(rect.x, rect.x + rect.width, platform.x, platform.x + platform.width);
      return overlap >= Math.min(rect.width * 0.55, platform.width) && Math.abs(rectBottom - platform.y) <= heightTolerance;
    }) ?? null
  );
};

export const findExitSupport = (stage: StageDefinition, exitRect: Rect): PlatformDefinition | null => {
  const exitBottom = exitRect.y + exitRect.height;
  return (
    stage.platforms.find((platform) => {
      if (platform.kind !== 'static' || platform.reveal || platform.temporaryBridge) {
        return false;
      }

      const overlap = overlapWidth(exitRect.x, exitRect.x + exitRect.width, platform.x, platform.x + platform.width);
      return overlap >= Math.min(exitRect.width * 0.55, platform.width) && Math.abs(exitBottom - platform.y) <= 12;
    }) ?? null
  );
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

  for (const id of capsule.contents.terrainSurfaceIds ?? []) {
    pushRect(id, stage.terrainSurfaces.find((surface) => surface.id === id) ?? null);
  }

  for (const id of capsule.contents.launcherIds ?? []) {
    pushRect(id, stage.launchers.find((launcherEntry) => launcherEntry.id === id) ?? null);
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
  terrainSurfaceIds: stage.terrainSurfaces
    .filter((surface) => intersectsRect(surface, capsule.shell))
    .map((surface) => surface.id),
  launcherIds: stage.launchers.filter((launcherEntry) => intersectsRect(launcherEntry, capsule.shell)).map((launcherEntry) => launcherEntry.id),
  collectibleIds: stage.collectibles
    .filter((collectible) => intersectsRect(collectibleRect(collectible), capsule.shell))
    .map((collectible) => collectible.id),
  rewardBlockIds: stage.rewardBlocks.filter((block) => intersectsRect(block, capsule.shell)).map((block) => block.id),
  hazardIds: stage.hazards.filter((hazard) => intersectsRect(hazard.rect, capsule.shell)).map((hazard) => hazard.id),
  enemyIds: stage.enemies.filter((enemy) => intersectsRect(enemyRect(enemy), capsule.shell)).map((enemy) => enemy.id),
});

export const gravityCapsuleHasBlockingShellWalls = (capsule: GravityCapsuleDefinition): boolean => {
  const leftBottomWidth = capsule.entryDoor.x - capsule.shell.x;
  const middleBottomWidth = capsule.exitDoor.x - (capsule.entryDoor.x + capsule.entryDoor.width);
  const rightBottomWidth = capsule.shell.x + capsule.shell.width - (capsule.exitDoor.x + capsule.exitDoor.width);

  return leftBottomWidth > 0 && middleBottomWidth > 0 && rightBottomWidth > 0;
};
