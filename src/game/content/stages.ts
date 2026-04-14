import type {
  EnemyKind,
  GravityFieldKind,
  HazardKind,
  LauncherKind,
  PlatformKind,
  Rect,
  RewardDefinition,
  StageObjectiveKind,
  StageObjectiveTargetKind,
  TerrainSurfaceKind,
  TurretVariantId,
  Vector2,
} from '../simulation/state';
import { GRAVITY_FIELD_KINDS, LAUNCHER_KINDS, TURRET_VARIANT_CONFIG } from '../simulation/state';

export type ActivationNodeDefinition = Rect & {
  id: string;
};

export type PlatformDefinition = Rect & {
  id: string;
  kind: PlatformKind;
  move?: { axis: 'x' | 'y'; range: number; speed: number };
  fall?: { triggerDelayMs: number };
  spring?: { boost: number; cooldownMs: number };
  reveal?: { id: string };
  temporaryBridge?: { scannerId: string; durationMs: number };
  magnetic?: { activationNodeId: string };
};

export type LowGravityZoneDefinition = Rect & {
  id: string;
  gravityScale: number;
};

export type GravityFieldDefinition = Rect & {
  id: string;
  kind: GravityFieldKind;
};

export type RevealVolumeDefinition = Rect & {
  id: string;
  revealPlatformIds: string[];
};

export type ScannerVolumeDefinition = Rect & {
  id: string;
  temporaryBridgeIds: string[];
};

export type TerrainSurfaceDefinition = Rect & {
  id: string;
  kind: TerrainSurfaceKind;
};

export type LauncherDefinition = Rect & {
  id: string;
  kind: LauncherKind;
  direction?: Vector2;
};

export type EnemyDefinition = {
  id: string;
  kind: EnemyKind;
  variant?: TurretVariantId;
  position: Vector2;
  patrol?: { left: number; right: number; speed: number };
  hop?: { intervalMs: number; impulse: number; speed: number };
  turret?: { intervalMs: number };
  charger?: { left: number; right: number; patrolSpeed: number; chargeSpeed: number; windupMs: number; cooldownMs: number };
  flyer?: { left: number; right: number; speed: number; bobAmp: number; bobSpeed: number };
};

export type RewardBlockDefinition = Rect & {
  id: string;
  reward: RewardDefinition;
};

export type SecretRouteCueDefinition = {
  description: string;
  rect: Rect;
  revealVolumeIds?: string[];
  revealPlatformIds?: string[];
  scannerVolumeIds?: string[];
  temporaryBridgeIds?: string[];
  lowGravityZoneIds?: string[];
  launcherIds?: string[];
  terrainSurfaceIds?: string[];
};

export type SecretRouteRewardDefinition = {
  collectibleIds: string[];
  rewardBlockIds: string[];
  note: string;
};

export type SecretRouteDefinition = {
  id: string;
  title: string;
  areaKind: 'abandonedMicroArea' | 'sampleCave';
  mechanics: (
    | 'optionalDetour'
    | 'revealPlatform'
    | 'scannerBridge'
    | 'timedReveal'
    | 'lowGravity'
    | 'launcher'
    | 'terrainSurface'
  )[];
  cue: SecretRouteCueDefinition;
  entry: Rect;
  interior: Rect;
  reconnect: Rect;
  mainPath: Rect;
  reward: SecretRouteRewardDefinition;
};

export type StageObjectiveDefinition = {
  kind: StageObjectiveKind;
  target: {
    kind: StageObjectiveTargetKind;
    id: string;
  };
};

export type StageDefinition = {
  id: string;
  name: string;
  presentation: {
    sectorLabel: string;
    biomeLabel: string;
    paletteCue: string;
    introLine: string;
    completionTitle: string;
    panelColor: number;
  };
  targetDurationMinutes: number;
  segments: {
    id: string;
    title: string;
    startX: number;
    endX: number;
    focus: string;
  }[];
  palette: {
    skyTop: number;
    skyBottom: number;
    accent: number;
    ground: number;
  };
  world: {
    width: number;
    height: number;
    gravity: number;
  };
  playerSpawn: Vector2;
  platforms: PlatformDefinition[];
  terrainSurfaces: TerrainSurfaceDefinition[];
  launchers: LauncherDefinition[];
  lowGravityZones: LowGravityZoneDefinition[];
  gravityFields: GravityFieldDefinition[];
  revealVolumes: RevealVolumeDefinition[];
  scannerVolumes: ScannerVolumeDefinition[];
  activationNodes: ActivationNodeDefinition[];
  checkpoints: { id: string; rect: Rect }[];
  collectibles: { id: string; position: Vector2 }[];
  rewardBlocks: RewardBlockDefinition[];
  secretRoutes: SecretRouteDefinition[];
  hazards: { id: string; kind: HazardKind; rect: Rect }[];
  enemies: EnemyDefinition[];
  exit: Rect;
  hint: string;
  stageObjective?: StageObjectiveDefinition;
};

const ground = (x: number, y: number, width: number, height = 32): PlatformDefinition => ({
  id: `platform-${x}-${y}`,
  kind: 'static',
  x,
  y,
  width,
  height,
});

const moving = (
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

const falling = (x: number, y: number, width: number, height = 32, triggerDelayMs = 650): PlatformDefinition => ({
  id: `platform-${x}-${y}-falling`,
  kind: 'falling',
  x,
  y,
  width,
  height,
  fall: { triggerDelayMs },
});

const spring = (x: number, y: number, width: number, height = 32, boost = 860): PlatformDefinition => ({
  id: `platform-${x}-${y}-spring`,
  kind: 'spring',
  x,
  y,
  width,
  height,
  spring: { boost, cooldownMs: 350 },
});

const revealPlatform = (
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

const temporaryBridgePlatform = (
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

const gravityField = (
  id: string,
  kind: GravityFieldKind,
  x: number,
  y: number,
  width: number,
  height: number,
): GravityFieldDefinition => ({
  id,
  kind,
  x,
  y,
  width,
  height,
});

const revealVolume = (
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

const scannerVolume = (
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

const activationNode = (
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

const magneticPlatform = (
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

const terrainSurface = (
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

const launcher = (
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

const rewardBlock = (
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

const BLOCK_CLEARANCE_ABOVE_FLOOR = 72;
const GROUND_STOMP_ENEMY_KINDS: EnemyDefinition['kind'][] = ['walker', 'hopper', 'charger'];
const IMMEDIATE_ROUTE_ENEMY_KINDS: EnemyDefinition['kind'][] = ['walker', 'hopper', 'charger', 'turret'];
const POWER_PICKUP_ESCAPE_DISTANCE = 150;
const POWER_PICKUP_SUPPORT_GAP = 56;
const POWER_PICKUP_SUPPORT_HEIGHT_TOLERANCE = 96;
const SECRET_ROUTE_MIN_REWARD_SCORE = 3;

const expandRect = (rect: Rect, padding: number): Rect => ({
  x: rect.x - padding,
  y: rect.y - padding,
  width: rect.width + padding * 2,
  height: rect.height + padding * 2,
});

const isRectWithinWorld = (stage: StageDefinition, rect: Rect): boolean =>
  rect.width > 0 &&
  rect.height > 0 &&
  rect.x >= 0 &&
  rect.y >= 0 &&
  rect.x + rect.width <= stage.world.width &&
  rect.y + rect.height <= stage.world.height;

const rectContainsPoint = (rect: Rect, point: Vector2): boolean =>
  point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;

type StageExtension = {
  targetDurationMinutes: number;
  worldWidth: number;
  segments: StageDefinition['segments'];
  platforms: PlatformDefinition[];
  terrainSurfaces?: TerrainSurfaceDefinition[];
  launchers?: LauncherDefinition[];
  lowGravityZones?: LowGravityZoneDefinition[];
  gravityFields?: GravityFieldDefinition[];
  revealVolumes?: RevealVolumeDefinition[];
  scannerVolumes?: ScannerVolumeDefinition[];
  activationNodes?: ActivationNodeDefinition[];
  checkpoints: StageDefinition['checkpoints'];
  collectibles: StageDefinition['collectibles'];
  rewardBlocks: RewardBlockDefinition[];
  secretRoutes?: SecretRouteDefinition[];
  hazards: StageDefinition['hazards'];
  enemies: EnemyDefinition[];
  exit: Rect;
  hint: string;
  stageObjective?: StageObjectiveDefinition;
};

const blockCenterX = (block: RewardBlockDefinition): number => block.x + block.width / 2;

const findSupportBelow = (
  platforms: PlatformDefinition[],
  block: RewardBlockDefinition,
): PlatformDefinition | null => {
  const centerX = blockCenterX(block);
  const blockBottom = block.y + block.height;
  return (
    platforms
      .filter(
        (platform) =>
          centerX >= platform.x &&
          centerX <= platform.x + platform.width &&
          platform.y >= blockBottom,
      )
      .sort((left, right) => left.y - right.y)[0] ?? null
  );
};

const findSupportBelowSpan = (
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

const normalizeRewardBlocks = (
  platforms: PlatformDefinition[],
  blocks: RewardBlockDefinition[],
): RewardBlockDefinition[] => blocks.map((block) => repositionRewardBlock(block, platforms, block.y));

const enemyRect = (enemy: EnemyDefinition): Rect => ({
  x: enemy.position.x,
  y: enemy.position.y,
  width: enemy.kind === 'turret' ? 28 : 34,
  height: enemy.kind === 'turret' ? 38 : enemy.kind === 'flyer' ? 24 : 30,
});

const intersectsRect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

const overlapWidth = (leftStart: number, leftEnd: number, rightStart: number, rightEnd: number): number =>
  Math.max(0, Math.min(leftEnd, rightEnd) - Math.max(leftStart, rightStart));

const findTraversableSupport = (stage: StageDefinition, rect: Rect): PlatformDefinition | null => {
  const rectBottom = rect.y + rect.height;
  return (
    stage.platforms.find((platform) => {
      const overlap = overlapWidth(rect.x, rect.x + rect.width, platform.x, platform.x + platform.width);
      return overlap >= Math.min(rect.width * 0.55, platform.width) && Math.abs(rectBottom - platform.y) <= 24;
    }) ?? null
  );
};

const secretRouteRewardScore = (stage: StageDefinition, reward: SecretRouteRewardDefinition): number => {
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

const LAUNCHER_MAX_DIRECTION_RADIANS = (25 * Math.PI) / 180;
const HALO_SPIRE_ARRAY_STAGE_ID = 'sky-sanctum';
const GRAVITY_FIELD_CHECKPOINT_CLEARANCE = 56;
const MAGNETIC_PLATFORM_STAGE_ID = 'forest-ruins';
const MAGNETIC_NODE_MAX_HORIZONTAL_DISTANCE = 240;
const MAGNETIC_NODE_MAX_VERTICAL_DISTANCE = 180;
const MAGNETIC_ROUTE_FALLBACK_MAX_DROP = 240;

const hasValidLauncherDirection = (direction?: Vector2): boolean => {
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

const validateStaticElementCollisions = (stage: StageDefinition): StageDefinition => {
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

const validateStageCatalogSecretRoutes = (stages: StageDefinition[]): StageDefinition[] => {
  const secretRouteCount = stages.reduce((total, stage) => total + stage.secretRoutes.length, 0);
  if (secretRouteCount <= 0) {
    throw new Error('At least one stage must define a reconnecting secret route.');
  }

  return stages;
};

const validateTraversalMechanics = (stage: StageDefinition): StageDefinition => {
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

  const findSupportingPlatformForSurface = (surface: TerrainSurfaceDefinition): PlatformDefinition | null =>
    stage.platforms.find(
      (platform) =>
        platform.kind === 'static' &&
        !platform.reveal &&
        !platform.temporaryBridge &&
        surface.x >= platform.x &&
        surface.x + surface.width <= platform.x + platform.width &&
        Math.abs(surface.y - platform.y) <= 1 &&
        surface.height > 0 &&
        surface.height <= Math.min(platform.height, 16),
    ) ?? null;

  const findSupportingPlatformForLauncher = (launcherEntry: LauncherDefinition): PlatformDefinition | null =>
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

  if (stage.gravityFields.length > 0 && stage.id !== HALO_SPIRE_ARRAY_STAGE_ID) {
    throw new Error(`Gravity-field rollout is limited to ${HALO_SPIRE_ARRAY_STAGE_ID}.`);
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

  const invalidTerrainSurfaces = stage.terrainSurfaces.filter(
    (surface) =>
      surface.width <= 0 ||
      surface.height <= 0 ||
      surface.x < 0 ||
      surface.y < 0 ||
      surface.x + surface.width > stage.world.width ||
      surface.y + surface.height > stage.world.height,
  );
  if (invalidTerrainSurfaces.length > 0) {
    throw new Error(
      `Terrain surfaces must use positive bounded rectangles: ${invalidTerrainSurfaces.map((surface) => surface.id).join(', ')}`,
    );
  }

  const unsupportedTerrainSurfaces = stage.terrainSurfaces.filter(
    (surface) => surface.kind !== 'brittleCrystal' && surface.kind !== 'stickySludge',
  );
  if (unsupportedTerrainSurfaces.length > 0) {
    throw new Error(
      `Terrain surfaces must use a supported kind: ${unsupportedTerrainSurfaces.map((surface) => surface.id).join(', ')}`,
    );
  }

  const unsupportedSurfaceAlignment = stage.terrainSurfaces.filter((surface) => !findSupportingPlatformForSurface(surface));
  if (unsupportedSurfaceAlignment.length > 0) {
    throw new Error(
      `Terrain surfaces must align to solid static platform support: ${unsupportedSurfaceAlignment
        .map((surface) => surface.id)
        .join(', ')}`,
    );
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
    const objectiveTargets: Record<StageObjectiveTargetKind, Set<string>> = {
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

  const overlappingTerrainSurfaces: string[] = [];
  for (let index = 0; index < stage.terrainSurfaces.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < stage.terrainSurfaces.length; nextIndex += 1) {
      const current = stage.terrainSurfaces[index];
      const next = stage.terrainSurfaces[nextIndex];
      if (intersectsRect(current, next)) {
        overlappingTerrainSurfaces.push(`${current.id}<->${next.id}`);
      }
    }
  }

  if (overlappingTerrainSurfaces.length > 0) {
    throw new Error(`Terrain surfaces cannot overlap or conflict: ${overlappingTerrainSurfaces.join(', ')}`);
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

const validateStageCatalogMagneticRollout = (stages: StageDefinition[]): StageDefinition[] => {
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

const applyStageExtension = (stage: StageDefinition, extension: StageExtension): StageDefinition => {
  const platforms = [...stage.platforms, ...extension.platforms];
  return {
    ...stage,
    targetDurationMinutes: extension.targetDurationMinutes,
    segments: [...stage.segments, ...extension.segments],
    world: {
      ...stage.world,
      width: extension.worldWidth,
    },
    platforms,
    terrainSurfaces: [...stage.terrainSurfaces, ...(extension.terrainSurfaces ?? [])],
    launchers: [...stage.launchers, ...(extension.launchers ?? [])],
    lowGravityZones: [...stage.lowGravityZones, ...(extension.lowGravityZones ?? [])],
    gravityFields: [...stage.gravityFields, ...(extension.gravityFields ?? [])],
    revealVolumes: [...stage.revealVolumes, ...(extension.revealVolumes ?? [])],
    scannerVolumes: [...stage.scannerVolumes, ...(extension.scannerVolumes ?? [])],
    activationNodes: [...stage.activationNodes, ...(extension.activationNodes ?? [])],
    checkpoints: [...stage.checkpoints, ...extension.checkpoints],
    collectibles: [...stage.collectibles, ...extension.collectibles],
    rewardBlocks: normalizeRewardBlocks(platforms, [...stage.rewardBlocks, ...extension.rewardBlocks]),
    secretRoutes: [...stage.secretRoutes, ...(extension.secretRoutes ?? [])],
    hazards: [...stage.hazards, ...extension.hazards],
    enemies: [...stage.enemies, ...extension.enemies],
    exit: extension.exit,
    hint: extension.hint,
    stageObjective: extension.stageObjective ?? stage.stageObjective,
  };
};

const baseStageDefinitions: StageDefinition[] = [
  {
    id: 'forest-ruins',
    name: 'Verdant Impact Crater',
    presentation: {
      sectorLabel: 'Survey Sector A1',
      biomeLabel: 'Biolume crater basin',
      paletteCue: 'Mint canopy haze, comet-stone shadows, and signal-amber ruins.',
      introLine: 'Sweep the crater floor, vault the canopy relays, and reconnect the survey beacon above the impact ridge.',
      completionTitle: 'Sector Beacon Secured',
      panelColor: 0x12231f,
    },
    targetDurationMinutes: 10,
    segments: [
      { id: 'approach', title: 'Landing Shelf', startX: 0, endX: 1500, focus: 'survey warm-up' },
      { id: 'shrine', title: 'Spore Relay', startX: 1500, endX: 3100, focus: 'hazard ladders' },
      { id: 'aqueduct', title: 'Crater Channel', startX: 3100, endX: 4700, focus: 'recovery lane' },
      { id: 'gauntlet', title: 'Canopy Spine', startX: 4700, endX: 6500, focus: 'readable pressure bands' },
      { id: 'spire', title: 'Beacon Gate', startX: 6500, endX: 8100, focus: 'final ascent' },
    ],
    palette: {
      skyTop: 0x1f544c,
      skyBottom: 0x091816,
      accent: 0x9cf6d3,
      ground: 0x447a68,
    },
    world: { width: 8100, height: 720, gravity: 1800 },
    playerSpawn: { x: 110, y: 520 },
    platforms: [
      ground(0, 620, 420),
      ground(510, 575, 170),
      ground(760, 525, 180),
      ground(1020, 470, 190),
      ground(1290, 540, 220),
      moving(1610, 600, 240, 32, 'x', 120, 80),
      ground(1920, 540, 180),
      ground(2180, 495, 180),
      ground(2440, 450, 210),
      ground(2720, 520, 220),
      ground(3040, 590, 250),
      falling(3370, 535, 190),
      ground(3630, 470, 180),
      ground(3890, 420, 190),
      ground(4170, 485, 200),
      ground(4450, 560, 220),
      ground(4770, 610, 220),
      ground(5060, 540, 170),
      ground(5300, 470, 180),
      ground(5560, 530, 180),
      ground(5820, 450, 200),
      ground(6100, 520, 200),
      ground(6380, 590, 220),
      spring(6680, 520, 180),
      ground(6940, 460, 180),
      ground(7200, 400, 180),
      ground(7460, 470, 200),
      ground(7750, 540, 220),
    ],
    terrainSurfaces: [],
    launchers: [launcher('forest-bounce-pod-route', 'bouncePod', 6990, 460, 110, 14, { x: 0.32, y: -1 })],
    lowGravityZones: [],
    gravityFields: [],
    revealVolumes: [],
    scannerVolumes: [],
    activationNodes: [],
    checkpoints: [
      { id: 'cp-1', rect: { x: 1420, y: 460, width: 24, height: 80 } },
      { id: 'cp-2', rect: { x: 3090, y: 510, width: 24, height: 80 } },
      { id: 'cp-3', rect: { x: 5130, y: 460, width: 24, height: 80 } },
      { id: 'cp-4', rect: { x: 6430, y: 510, width: 24, height: 80 } },
    ],
    collectibles: [
      { id: 'crystal-1', position: { x: 820, y: 470 } },
      { id: 'crystal-2', position: { x: 2470, y: 400 } },
      { id: 'crystal-3', position: { x: 3520, y: 420 } },
      { id: 'crystal-4', position: { x: 4620, y: 520 } },
      { id: 'crystal-5', position: { x: 5880, y: 400 } },
      { id: 'crystal-6', position: { x: 7240, y: 350 } },
      { id: 'crystal-7', position: { x: 7830, y: 490 } },
    ],
    rewardBlocks: [
      rewardBlock('forest-coin-1', 560, 470, { kind: 'coins', amount: 2 }),
      rewardBlock('forest-double-jump', 2190, 390, { kind: 'power', power: 'doubleJump' }),
      rewardBlock('forest-coin-2', 3435, 410, { kind: 'coins', amount: 2 }),
      rewardBlock('forest-dash', 6700, 465, { kind: 'power', power: 'dash' }),
    ],
    secretRoutes: [],
    hazards: [
      { id: 'spikes-1', kind: 'spikes', rect: { x: 175, y: 604, width: 70, height: 16 } },
      { id: 'spikes-2', kind: 'spikes', rect: { x: 2520, y: 434, width: 40, height: 16 } },
      { id: 'spikes-3', kind: 'spikes', rect: { x: 3705, y: 454, width: 30, height: 16 } },
      { id: 'spikes-4', kind: 'spikes', rect: { x: 5860, y: 434, width: 30, height: 16 } },
      { id: 'spikes-5', kind: 'spikes', rect: { x: 7260, y: 384, width: 60, height: 16 } },
    ],
    enemies: [
      {
        id: 'walker-1',
        kind: 'walker',
        position: { x: 1030, y: 438 },
        patrol: { left: 1020, right: 1210, speed: 90 },
      },
      {
        id: 'hopper-1',
        kind: 'hopper',
        position: { x: 1930, y: 512 },
        hop: { intervalMs: 1400, impulse: 820, speed: 110 },
      },
      {
        id: 'flyer-1',
        kind: 'flyer',
        position: { x: 3530, y: 360 },
        flyer: { left: 3430, right: 3920, speed: 95, bobAmp: 22, bobSpeed: 4.2 },
      },
      {
        id: 'walker-2',
        kind: 'walker',
        position: { x: 2500, y: 418 },
        patrol: { left: 2440, right: 2650, speed: 100 },
      },
      {
        id: 'hopper-2',
        kind: 'hopper',
        position: { x: 4210, y: 453 },
        hop: { intervalMs: 1250, impulse: 860, speed: 120 },
      },
      {
        id: 'turret-1',
        kind: 'turret',
        position: { x: 5418, y: 432 },
        turret: { intervalMs: 1900 },
      },
      {
        id: 'walker-3',
        kind: 'walker',
        position: { x: 6110, y: 488 },
        patrol: { left: 6100, right: 6300, speed: 110 },
      },
      {
        id: 'charger-1',
        kind: 'charger',
        position: { x: 7240, y: 370 },
        charger: { left: 7200, right: 7340, patrolSpeed: 65, chargeSpeed: 280, windupMs: 500, cooldownMs: 900 },
      },
      {
        id: 'hopper-3',
        kind: 'hopper',
        position: { x: 7470, y: 438 },
        hop: { intervalMs: 1200, impulse: 900, speed: 130 },
      },
    ],
    exit: { x: 7990, y: 460, width: 40, height: 80 },
    hint: 'Five crater sectors guide the critical path from the landing shelf to the beacon gate, with canopy routes branching overhead.',
  },
  {
    id: 'amber-cavern',
    name: 'Ember Rift Warrens',
    presentation: {
      sectorLabel: 'Survey Sector B4',
      biomeLabel: 'Molten resin trench',
      paletteCue: 'Copper vents, ember fog, and cooled basalt liftworks.',
      introLine: 'Descend through the resin lifts, cross the furnace terraces, and reach the reactor vault at the far lip of the trench.',
      completionTitle: 'Reactor Vault Reached',
      panelColor: 0x25170f,
    },
    targetDurationMinutes: 10,
    segments: [
      { id: 'mouth', title: 'Rift Mouth', startX: 0, endX: 1450, focus: 'intro hazards' },
      { id: 'lifts', title: 'Resin Lifts', startX: 1450, endX: 3050, focus: 'vertical traversal' },
      { id: 'forge', title: 'Furnace Conduit', startX: 3050, endX: 4700, focus: 'hazard timing' },
      { id: 'barracks', title: 'Basalt Barracks', startX: 4700, endX: 6400, focus: 'mixed encounters' },
      { id: 'heart', title: 'Core Prism', startX: 6400, endX: 8200, focus: 'turret lanes' },
    ],
    palette: {
      skyTop: 0x5a311e,
      skyBottom: 0x180c08,
      accent: 0xffb768,
      ground: 0x8a5c33,
    },
    world: { width: 8200, height: 720, gravity: 1850 },
    playerSpawn: { x: 90, y: 560 },
    platforms: [
      ground(0, 620, 420),
      ground(500, 560, 180),
      ground(760, 510, 180),
      ground(1020, 460, 180),
      ground(1280, 410, 220),
      moving(1590, 470, 180, 32, 'y', 90, 70),
      ground(1850, 540, 180),
      ground(2110, 480, 200),
      ground(2390, 420, 180),
      ground(2650, 350, 180),
      ground(2910, 430, 190),
      ground(3190, 520, 220),
      ground(3490, 580, 240),
      ground(3800, 520, 190),
      ground(4070, 450, 190),
      falling(4350, 390, 200, 32, 700),
      ground(4630, 460, 180),
      ground(4890, 530, 220),
      ground(5200, 590, 230),
      ground(5510, 520, 180),
      ground(5770, 460, 180),
      ground(6030, 400, 200),
      ground(6310, 470, 180),
      spring(6570, 540, 220, 32, 900),
      ground(6880, 600, 220),
      ground(7170, 530, 190),
      ground(7440, 470, 180),
      ground(7700, 420, 180),
      ground(7960, 500, 180),
    ],
    terrainSurfaces: [],
    launchers: [],
    lowGravityZones: [],
    gravityFields: [],
    revealVolumes: [],
    scannerVolumes: [],
    activationNodes: [],
    checkpoints: [
      { id: 'cp-1', rect: { x: 1310, y: 330, width: 24, height: 80 } },
      { id: 'cp-2', rect: { x: 3510, y: 500, width: 24, height: 80 } },
      { id: 'cp-3', rect: { x: 5200, y: 510, width: 24, height: 80 } },
      { id: 'cp-4', rect: { x: 6910, y: 520, width: 24, height: 80 } },
    ],
    collectibles: [
      { id: 'amber-1', position: { x: 530, y: 500 } },
      { id: 'amber-2', position: { x: 1280, y: 360 } },
      { id: 'amber-3', position: { x: 2650, y: 300 } },
      { id: 'amber-4', position: { x: 3570, y: 540 } },
      { id: 'amber-5', position: { x: 4360, y: 340 } },
      { id: 'amber-6', position: { x: 5510, y: 470 } },
      { id: 'amber-7', position: { x: 6325, y: 340 } },
      { id: 'amber-8', position: { x: 7730, y: 360 } },
    ],
    rewardBlocks: [
      rewardBlock('amber-coin-1', 1090, 410, { kind: 'coins', amount: 2 }),
      rewardBlock('amber-shooter', 2425, 360, { kind: 'power', power: 'shooter' }),
      rewardBlock('amber-coin-2', 4670, 395, { kind: 'coins', amount: 3 }),
    ],
    secretRoutes: [],
    hazards: [
      { id: 'spikes-1', kind: 'spikes', rect: { x: 180, y: 604, width: 60, height: 16 } },
      { id: 'spikes-forge-1', kind: 'spikes', rect: { x: 2695, y: 334, width: 72, height: 16 } },
      { id: 'spikes-2', kind: 'spikes', rect: { x: 3880, y: 504, width: 60, height: 16 } },
      { id: 'spikes-barracks-1', kind: 'spikes', rect: { x: 4960, y: 514, width: 80, height: 16 } },
      { id: 'spikes-3', kind: 'spikes', rect: { x: 6380, y: 454, width: 40, height: 16 } },
      { id: 'spikes-heart-1', kind: 'spikes', rect: { x: 7235, y: 514, width: 60, height: 16 } },
    ],
    enemies: [
      {
        id: 'walker-1',
        kind: 'walker',
        position: { x: 540, y: 530 },
        patrol: { left: 508, right: 672, speed: 100 },
      },
      {
        id: 'hopper-1',
        kind: 'hopper',
        position: { x: 1910, y: 510 },
        hop: { intervalMs: 1250, impulse: 860, speed: 110 },
      },
      {
        id: 'turret-1',
        kind: 'turret',
        position: { x: 3338, y: 482 },
        turret: { intervalMs: 1800 },
      },
      {
        id: 'walker-2',
        kind: 'walker',
        position: { x: 4090, y: 420 },
        patrol: { left: 4082, right: 4248, speed: 105 },
      },
      {
        id: 'hopper-2',
        kind: 'hopper',
        position: { x: 4935, y: 500 },
        hop: { intervalMs: 1300, impulse: 900, speed: 120 },
      },
      {
        id: 'turret-2',
        kind: 'turret',
        variant: 'resinBurst',
        position: { x: 6116, y: 362 },
        turret: { intervalMs: 2200 },
      },
      {
        id: 'charger-1',
        kind: 'charger',
        position: { x: 7460, y: 440 },
        charger: { left: 7440, right: 7620, patrolSpeed: 70, chargeSpeed: 300, windupMs: 520, cooldownMs: 950 },
      },
      {
        id: 'walker-3',
        kind: 'walker',
        position: { x: 7215, y: 500 },
        patrol: { left: 7178, right: 7352, speed: 110 },
      },
      {
        id: 'flyer-1',
        kind: 'flyer',
        position: { x: 7420, y: 360 },
        flyer: { left: 7310, right: 7950, speed: 105, bobAmp: 24, bobSpeed: 4.6 },
      },
      {
        id: 'turret-3',
        kind: 'turret',
        variant: 'resinBurst',
        position: { x: 7776, y: 382 },
        turret: { intervalMs: 2200 },
      },
    ],
    exit: { x: 8090, y: 420, width: 44, height: 80 },
    hint: 'Five trench sectors break the route into readable lift, furnace, and vault pushes while optional vents open overhead.',
  },
  {
    id: 'sky-sanctum',
    name: 'Halo Spire Array',
    presentation: {
      sectorLabel: 'Survey Sector C7',
      biomeLabel: 'Ion halo spires',
      paletteCue: 'Aurora glass, pale ion light, and fractured station crowns.',
      introLine: 'Climb the ion stairs, cross the halo lanes, and dock at the crown array above the storm band.',
      completionTitle: 'Array Dock Locked',
      panelColor: 0x122238,
    },
    targetDurationMinutes: 11,
    segments: [
      { id: 'stairs', title: 'Ion Stair', startX: 0, endX: 1550, focus: 'opening precision' },
      { id: 'gallery', title: 'Solar Gallery', startX: 1550, endX: 3300, focus: 'recovery and ascent' },
      { id: 'bridges', title: 'Shard Bridges', startX: 3300, endX: 5000, focus: 'gap pressure' },
      { id: 'orbits', title: 'Halo Lanes', startX: 5000, endX: 6800, focus: 'turret lanes' },
      { id: 'summit', title: 'Crown Dock', startX: 6800, endX: 8800, focus: 'endurance finale' },
    ],
    palette: {
      skyTop: 0x2b5f86,
      skyBottom: 0x09111f,
      accent: 0x9ee8ff,
      ground: 0x7daccb,
    },
    world: { width: 8800, height: 720, gravity: 1780 },
    playerSpawn: { x: 90, y: 570 },
    platforms: [
      ground(0, 630, 340),
      ground(420, 560, 170),
      ground(680, 500, 180),
      ground(950, 430, 180),
      ground(1220, 500, 170),
      ground(1480, 420, 180),
      moving(1750, 350, 180, 32, 'x', 140, 90),
      ground(2020, 430, 170),
      ground(2280, 520, 190),
      ground(2570, 450, 180),
      ground(2830, 390, 180),
      ground(3090, 470, 180),
      ground(3360, 550, 210),
      ground(3660, 490, 180),
      ground(3920, 420, 180),
      ground(4180, 350, 190),
      ground(4460, 430, 180),
      ground(4720, 520, 180),
      ground(4990, 600, 210),
      ground(5290, 530, 180),
      ground(5550, 460, 180),
      moving(5810, 390, 180, 32, 'y', 100, 80),
      ground(6070, 330, 180),
      ground(6330, 400, 180),
      ground(6590, 470, 180),
      ground(6850, 540, 200),
      ground(7140, 470, 180),
      ground(7400, 400, 180),
      falling(7660, 330, 180, 32, 650),
      ground(7920, 410, 180),
      ground(8180, 500, 190),
      ground(8460, 590, 220),
    ],
    terrainSurfaces: [],
    launchers: [],
    lowGravityZones: [],
    gravityFields: [],
    revealVolumes: [],
    scannerVolumes: [],
    activationNodes: [],
    checkpoints: [
      { id: 'cp-1', rect: { x: 1240, y: 420, width: 24, height: 80 } },
      { id: 'cp-2', rect: { x: 3380, y: 470, width: 24, height: 80 } },
      { id: 'cp-3', rect: { x: 5030, y: 520, width: 24, height: 80 } },
      { id: 'cp-4', rect: { x: 6890, y: 460, width: 24, height: 80 } },
    ],
    collectibles: [
      { id: 'sky-1', position: { x: 450, y: 500 } },
      { id: 'sky-2', position: { x: 980, y: 370 } },
      { id: 'sky-3', position: { x: 1760, y: 290 } },
      { id: 'sky-4', position: { x: 2850, y: 330 } },
      { id: 'sky-5', position: { x: 4180, y: 290 } },
      { id: 'sky-6', position: { x: 5570, y: 410 } },
      { id: 'sky-7', position: { x: 6090, y: 270 } },
      { id: 'sky-8', position: { x: 7680, y: 270 } },
      { id: 'sky-9', position: { x: 8510, y: 540 } },
    ],
    rewardBlocks: [
      rewardBlock('sky-invincible', 1740, 300, { kind: 'power', power: 'invincible' }),
      rewardBlock('sky-coin-1', 3450, 500, { kind: 'coins', amount: 2 }),
      rewardBlock('sky-coin-2', 6950, 490, { kind: 'coins', amount: 3 }),
    ],
    secretRoutes: [],
    hazards: [
      { id: 'spikes-3', kind: 'spikes', rect: { x: 475, y: 544, width: 60, height: 16 } },
      { id: 'spikes-4', kind: 'spikes', rect: { x: 2071, y: 414, width: 68, height: 16 } },
      { id: 'spikes-5', kind: 'spikes', rect: { x: 3730, y: 474, width: 40, height: 16 } },
      { id: 'spikes-6', kind: 'spikes', rect: { x: 6400, y: 384, width: 40, height: 16 } },
      { id: 'spikes-7', kind: 'spikes', rect: { x: 7990, y: 394, width: 40, height: 16 } },
    ],
    enemies: [
      {
        id: 'walker-1',
        kind: 'walker',
        position: { x: 735, y: 468 },
        patrol: { left: 680, right: 820, speed: 100 },
      },
      {
        id: 'hopper-1',
        kind: 'hopper',
        position: { x: 1510, y: 388 },
        hop: { intervalMs: 1200, impulse: 900, speed: 130 },
      },
      {
        id: 'flyer-1',
        kind: 'flyer',
        position: { x: 1930, y: 300 },
        flyer: { left: 1770, right: 2440, speed: 110, bobAmp: 26, bobSpeed: 5.2 },
      },
      {
        id: 'turret-1',
        kind: 'turret',
        variant: 'ionPulse',
        position: { x: 2646, y: 412 },
        turret: { intervalMs: 2100 },
      },
      {
        id: 'walker-2',
        kind: 'walker',
        position: { x: 3940, y: 388 },
        patrol: { left: 3920, right: 4100, speed: 110 },
      },
      {
        id: 'hopper-2',
        kind: 'hopper',
        position: { x: 5320, y: 498 },
        hop: { intervalMs: 1200, impulse: 940, speed: 135 },
      },
      {
        id: 'turret-2',
        kind: 'turret',
        position: { x: 6146, y: 292 },
        turret: { intervalMs: 1450 },
      },
      {
        id: 'turret-3',
        kind: 'turret',
        position: { x: 7216, y: 432 },
        turret: { intervalMs: 1400 },
      },
      {
        id: 'charger-1',
        kind: 'charger',
        position: { x: 8210, y: 470 },
        charger: { left: 8180, right: 8370, patrolSpeed: 72, chargeSpeed: 320, windupMs: 500, cooldownMs: 900 },
      },
      {
        id: 'walker-3',
        kind: 'walker',
        position: { x: 7420, y: 368 },
        patrol: { left: 7400, right: 7580, speed: 110 },
      },
      {
        id: 'turret-4',
        kind: 'turret',
        variant: 'ionPulse',
        position: { x: 8556, y: 552 },
        turret: { intervalMs: 2100 },
      },
    ],
    exit: { x: 8600, y: 510, width: 48, height: 80 },
    hint: 'Five sky sectors alternate recovery ledges and ion-lane pressure while optional halo rails sit above the main climb.',
  },
];

const forestRuinsExtension: StageExtension = {
  targetDurationMinutes: 20,
  worldWidth: 12050,
  segments: [
    { id: 'vault', title: 'Meteor Sink', startX: 8100, endX: 9280, focus: 'reset jumps and split routes' },
    { id: 'canopy', title: 'Relay Canopy', startX: 9280, endX: 10640, focus: 'branch pressure and rewards' },
    { id: 'citadel', title: 'Observatory Rise', startX: 10640, endX: 12050, focus: 'extended final ascent' },
  ],
  platforms: [
    ground(8060, 590, 220),
    ground(8350, 520, 180),
    ground(8480, 340, 150),
    moving(8610, 450, 170, 32, 'x', 110, 86),
    ground(8730, 280, 150),
    ground(8860, 530, 200),
    moving(8990, 250, 140, 32, 'x', 90, 76),
    falling(9140, 470, 170),
    ground(9240, 320, 160),
    ground(9390, 400, 180),
    ground(9650, 470, 190),
    magneticPlatform('forest-magnetic-platform-1', 'forest-magnetic-node-1', 9928, 356, 132),
    ground(9920, 540, 210),
    ground(10010, 320, 160),
    spring(10210, 610, 200, 32, 920),
    ground(10310, 260, 150),
    ground(10510, 520, 180),
    ground(10770, 450, 180),
    ground(11030, 380, 180),
    ground(11300, 450, 200),
    ground(11590, 530, 220),
  ],
  checkpoints: [
    { id: 'cp-5', rect: { x: 9960, y: 460, width: 24, height: 80 } },
    { id: 'cp-6', rect: { x: 11460, y: 370, width: 24, height: 80 } },
  ],
  activationNodes: [activationNode('forest-magnetic-node-1', 9760, 422)],
  collectibles: [
    { id: 'crystal-8', position: { x: 8420, y: 470 } },
    { id: 'crystal-8b', position: { x: 8520, y: 300 } },
    { id: 'crystal-9', position: { x: 8660, y: 390 } },
    { id: 'crystal-9b', position: { x: 8770, y: 240 } },
    { id: 'crystal-10', position: { x: 9170, y: 420 } },
    { id: 'crystal-10b', position: { x: 9030, y: 210 } },
    { id: 'crystal-11', position: { x: 9440, y: 350 } },
    { id: 'crystal-11b', position: { x: 9260, y: 280 } },
    { id: 'crystal-12', position: { x: 10020, y: 490 } },
    { id: 'crystal-13', position: { x: 10260, y: 540 } },
    { id: 'crystal-13b', position: { x: 10060, y: 280 } },
    { id: 'crystal-14', position: { x: 10820, y: 400 } },
    { id: 'crystal-15', position: { x: 11410, y: 320 } },
    { id: 'crystal-16', position: { x: 11720, y: 470 } },
  ],
  rewardBlocks: [
    rewardBlock('forest-coin-3', 8930, 470, { kind: 'coins', amount: 3 }),
    rewardBlock('forest-coin-branch', 9245, 250, { kind: 'coins', amount: 3 }),
    rewardBlock('forest-shooter', 9685, 420, { kind: 'power', power: 'shooter' }),
    rewardBlock('forest-coin-4', 10190, 470, { kind: 'coins', amount: 2 }),
    rewardBlock('forest-coin-5', 10030, 250, { kind: 'coins', amount: 2 }),
    rewardBlock('forest-invincible', 11320, 380, { kind: 'power', power: 'invincible' }),
  ],
  hazards: [
    { id: 'forest-spikes-6', kind: 'spikes', rect: { x: 8140, y: 574, width: 60, height: 16 } },
    { id: 'forest-spikes-7', kind: 'spikes', rect: { x: 10560, y: 504, width: 50, height: 16 } },
    { id: 'forest-spikes-8', kind: 'spikes', rect: { x: 11630, y: 514, width: 70, height: 16 } },
  ],
  enemies: [
    {
      id: 'walker-4',
      kind: 'walker',
      position: { x: 8360, y: 490 },
      patrol: { left: 8350, right: 8510, speed: 105 },
    },
    {
      id: 'hopper-4',
      kind: 'hopper',
      position: { x: 8870, y: 500 },
      hop: { intervalMs: 1180, impulse: 900, speed: 130 },
    },
    {
      id: 'flyer-2',
      kind: 'flyer',
      position: { x: 9040, y: 210 },
      flyer: { left: 8920, right: 9280, speed: 112, bobAmp: 22, bobSpeed: 4.8 },
    },
    {
      id: 'turret-2',
      kind: 'turret',
      position: { x: 9466, y: 362 },
      turret: { intervalMs: 1700 },
    },
    {
      id: 'turret-3',
      kind: 'turret',
      position: { x: 10390, y: 222 },
      turret: { intervalMs: 1580 },
    },
    {
      id: 'walker-5',
      kind: 'walker',
      position: { x: 10520, y: 490 },
      patrol: { left: 10510, right: 10640, speed: 108 },
    },
    {
      id: 'charger-2',
      kind: 'charger',
      position: { x: 11055, y: 350 },
      charger: { left: 11030, right: 11190, patrolSpeed: 72, chargeSpeed: 300, windupMs: 520, cooldownMs: 900 },
    },
    {
      id: 'walker-6',
      kind: 'walker',
      position: { x: 11605, y: 500 },
      patrol: { left: 11590, right: 11780, speed: 120 },
    },
  ],
  exit: { x: 11890, y: 450, width: 40, height: 80 },
  hint: 'Eight crater sectors now span the meteor sink, relay canopy, and observatory rise, with optional canopy pockets feeding back into the survey line.',
  stageObjective: {
    kind: 'restoreBeacon',
    target: { kind: 'checkpoint', id: 'cp-6' },
  },
};

const amberCavernExtension: StageExtension = {
  targetDurationMinutes: 20,
  worldWidth: 12250,
  segments: [
    { id: 'fissure', title: 'Glass Fissure', startX: 8200, endX: 9440, focus: 'vertical recovery beats' },
    { id: 'ramparts', title: 'Ember Ramparts', startX: 9440, endX: 10880, focus: 'split-route hazard pressure' },
    { id: 'vault', title: 'Reactor Vault', startX: 10880, endX: 12250, focus: 'final forge gauntlet' },
  ],
  platforms: [
    ground(8160, 520, 200),
    ground(8420, 450, 180),
    ground(8450, 290, 150),
    ground(8680, 380, 180),
    ground(8710, 235, 140),
    revealPlatform('amber-secret-cave-bridge', 'amber-secret-cave-reveal', 8855, 250, 110),
    moving(8940, 430, 180, 32, 'y', 110, 72),
    moving(8970, 190, 140, 32, 'x', 90, 70),
    ground(9200, 340, 180),
    ground(9220, 260, 160),
    ground(9460, 420, 200),
    falling(9730, 500, 180),
    ground(9990, 570, 220),
    ground(10290, 500, 180),
    ground(10410, 260, 150),
    spring(10550, 430, 190, 32, 930),
    ground(10700, 210, 140),
    ground(10830, 350, 180),
    ground(11090, 420, 190),
    ground(11370, 500, 220),
    ground(11670, 560, 220),
    ground(11960, 470, 180),
  ],
  checkpoints: [
    { id: 'cp-5', rect: { x: 9220, y: 260, width: 24, height: 80 } },
    { id: 'cp-6', rect: { x: 11710, y: 480, width: 24, height: 80 } },
  ],
  revealVolumes: [revealVolume('amber-secret-cave-trigger', 8400, 240, 240, 220, ['amber-secret-cave-reveal'])],
  collectibles: [
    { id: 'amber-9', position: { x: 8210, y: 470 } },
    { id: 'amber-9b', position: { x: 8490, y: 250 } },
    { id: 'amber-10', position: { x: 8460, y: 390 } },
    { id: 'amber-10b', position: { x: 8740, y: 195 } },
    { id: 'amber-11', position: { x: 8730, y: 320 } },
    { id: 'amber-11b', position: { x: 9010, y: 150 } },
    { id: 'amber-secret-sample-1', position: { x: 8940, y: 205 } },
    { id: 'amber-12', position: { x: 8990, y: 380 } },
    { id: 'amber-12b', position: { x: 9250, y: 220 } },
    { id: 'amber-secret-sample-2', position: { x: 9160, y: 175 } },
    { id: 'amber-13', position: { x: 9500, y: 370 } },
    { id: 'amber-14', position: { x: 10040, y: 520 } },
    { id: 'amber-14b', position: { x: 10450, y: 220 } },
    { id: 'amber-15', position: { x: 10610, y: 360 } },
    { id: 'amber-15b', position: { x: 10740, y: 170 } },
    { id: 'amber-16', position: { x: 10870, y: 300 } },
    { id: 'amber-17', position: { x: 11430, y: 450 } },
    { id: 'amber-18', position: { x: 12000, y: 420 } },
  ],
  rewardBlocks: [
    rewardBlock('amber-coin-3', 8450, 390, { kind: 'coins', amount: 3 }),
    rewardBlock('amber-coin-branch', 9230, 210, { kind: 'coins', amount: 3 }),
    rewardBlock('amber-invincible', 10320, 430, { kind: 'power', power: 'invincible' }),
    rewardBlock('amber-coin-5', 10720, 150, { kind: 'coins', amount: 2 }),
    rewardBlock('amber-coin-4', 10860, 310, { kind: 'coins', amount: 2 }),
    rewardBlock('amber-dash', 11780, 420, { kind: 'power', power: 'dash' }),
  ],
  secretRoutes: [
    {
      id: 'amber-hidden-sample-cave',
      title: 'Collapsed Sample Gallery',
      areaKind: 'sampleCave',
      mechanics: ['revealPlatform', 'optionalDetour'],
      cue: {
        description: 'A cracked resin ledge and sample glint above the trench reveal a hidden bridge into the abandoned cave pocket.',
        rect: { x: 8420, y: 418, width: 180, height: 32 },
        revealVolumeIds: ['amber-secret-cave-trigger'],
        revealPlatformIds: ['amber-secret-cave-reveal'],
      },
      entry: { x: 8710, y: 171, width: 140, height: 64 },
      interior: { x: 8855, y: 126, width: 545, height: 214 },
      reconnect: { x: 9460, y: 356, width: 180, height: 64 },
      mainPath: { x: 8940, y: 366, width: 180, height: 64 },
      reward: {
        collectibleIds: ['amber-secret-sample-1', 'amber-secret-sample-2', 'amber-11b', 'amber-12b'],
        rewardBlockIds: ['amber-coin-branch'],
        note: 'The optional sample cave pays out a research cluster and cache before dropping back onto the trench route.',
      },
    },
  ],
  hazards: [
    { id: 'amber-spikes-4', kind: 'spikes', rect: { x: 8220, y: 504, width: 60, height: 16 } },
    { id: 'amber-spikes-5', kind: 'spikes', rect: { x: 10050, y: 554, width: 70, height: 16 } },
    { id: 'amber-spikes-6', kind: 'spikes', rect: { x: 11420, y: 484, width: 70, height: 16 } },
  ],
  enemies: [
    {
      id: 'walker-4',
      kind: 'walker',
      position: { x: 8170, y: 490 },
      patrol: { left: 8160, right: 8340, speed: 105 },
    },
    {
      id: 'hopper-3',
      kind: 'hopper',
      position: { x: 8690, y: 350 },
      hop: { intervalMs: 1220, impulse: 900, speed: 125 },
    },
    {
      id: 'flyer-2',
      kind: 'flyer',
      position: { x: 9010, y: 150 },
      flyer: { left: 8890, right: 9250, speed: 112, bobAmp: 20, bobSpeed: 4.7 },
    },
    {
      id: 'turret-4',
      kind: 'turret',
      position: { x: 10036, y: 532 },
      turret: { intervalMs: 1600 },
    },
    {
      id: 'hopper-4',
      kind: 'hopper',
      position: { x: 10000, y: 540 },
      hop: { intervalMs: 1180, impulse: 920, speed: 130 },
    },
    {
      id: 'turret-5',
      kind: 'turret',
      position: { x: 10440, y: 222 },
      turret: { intervalMs: 1500 },
    },
    {
      id: 'charger-2',
      kind: 'charger',
      position: { x: 11120, y: 390 },
      charger: { left: 11090, right: 11280, patrolSpeed: 72, chargeSpeed: 310, windupMs: 520, cooldownMs: 920 },
    },
    {
      id: 'walker-5',
      kind: 'walker',
      position: { x: 12070, y: 440 },
      patrol: { left: 12020, right: 12130, speed: 118 },
    },
  ],
  exit: { x: 12160, y: 390, width: 44, height: 80 },
  hint: 'The trench now runs through the glass fissure, ember ramparts, and reactor vault, with a hidden sample gallery reconnecting above the main line.',
};

const skySanctumExtension: StageExtension = {
  targetDurationMinutes: 21,
  worldWidth: 13240,
  segments: [
    { id: 'belfry', title: 'Storm Belfry', startX: 8800, endX: 10120, focus: 'mid-air recovery' },
    { id: 'halo', title: 'Halo Causeway', startX: 10120, endX: 11640, focus: 'turret lanes and resets' },
    { id: 'crown', title: 'Crown Approach', startX: 11640, endX: 13240, focus: 'endurance finale' },
  ],
  platforms: [
    ground(8740, 560, 210),
    ground(9010, 490, 180),
    ground(9040, 300, 150),
    moving(9270, 420, 180, 32, 'x', 130, 88),
    ground(9310, 240, 140),
    ground(9540, 340, 180),
    moving(9580, 200, 140, 32, 'x', 100, 78),
    ground(9800, 410, 190),
    ground(9840, 270, 150),
    falling(10080, 480, 180),
    ground(10340, 550, 210),
    ground(10640, 480, 180),
    moving(10900, 400, 180, 32, 'y', 110, 84),
    ground(10970, 250, 150),
    revealPlatform('sky-reveal-bridge-1', 'sky-hidden-bridge-1', 11150, 250, 120),
    ground(11160, 320, 180),
    ground(11240, 190, 140),
    revealPlatform('sky-reveal-bridge-2', 'sky-hidden-bridge-2', 11390, 220, 110),
    ground(11420, 390, 180),
    spring(11680, 460, 200, 32, 950),
    ground(11970, 380, 180),
    ground(12230, 320, 180),
    ground(12280, 230, 150),
    temporaryBridgePlatform('sky-temporary-bridge-1', 'sky-halo-scanner', 12450, 230, 120, 24, 2600, 'sky-timed-secret-bridge'),
    ground(12620, 230, 140),
    ground(12490, 400, 180),
    ground(12750, 500, 220),
    ground(13040, 430, 180),
  ],
  terrainSurfaces: [
    terrainSurface('sky-sludge-route', 'stickySludge', 9010, 490, 140),
    terrainSurface('sky-brittle-route', 'brittleCrystal', 10420, 550, 110),
  ],
  launchers: [launcher('sky-gas-vent-route', 'gasVent', 9050, 490, 96, 14, { x: 0.18, y: -1 })],
  lowGravityZones: [],
  gravityFields: [
    gravityField('sky-anti-grav-stream', 'anti-grav-stream', 8960, 120, 260, 380),
    gravityField('sky-gravity-inversion-column', 'gravity-inversion-column', 9510, 130, 220, 340),
  ],
  revealVolumes: [
    revealVolume('sky-hidden-bridge-trigger', 10920, 170, 220, 190, ['sky-hidden-bridge-1', 'sky-hidden-bridge-2']),
    revealVolume('sky-timed-route-trigger', 12210, 120, 160, 170, ['sky-timed-secret-bridge']),
  ],
  scannerVolumes: [scannerVolume('sky-halo-scanner', 12400, 120, 170, 180, ['sky-temporary-bridge-1'])],
  checkpoints: [
    { id: 'cp-5', rect: { x: 10670, y: 400, width: 24, height: 80 } },
    { id: 'cp-6', rect: { x: 13180, y: 350, width: 24, height: 80 } },
  ],
  collectibles: [
    { id: 'sky-10', position: { x: 8780, y: 510 } },
    { id: 'sky-10b', position: { x: 9070, y: 260 } },
    { id: 'sky-11', position: { x: 9050, y: 440 } },
    { id: 'sky-11b', position: { x: 9340, y: 200 } },
    { id: 'sky-12', position: { x: 9340, y: 360 } },
    { id: 'sky-12b', position: { x: 9600, y: 160 } },
    { id: 'sky-13', position: { x: 9580, y: 280 } },
    { id: 'sky-13b', position: { x: 9870, y: 230 } },
    { id: 'sky-14', position: { x: 10120, y: 430 } },
    { id: 'sky-15', position: { x: 10390, y: 500 } },
    { id: 'sky-15b', position: { x: 11030, y: 210 } },
    { id: 'sky-16', position: { x: 10750, y: 430 } },
    { id: 'sky-17', position: { x: 11210, y: 260 } },
    { id: 'sky-17b', position: { x: 11280, y: 150 } },
    { id: 'sky-18', position: { x: 11750, y: 410 } },
    { id: 'sky-19', position: { x: 12410, y: 270 } },
    { id: 'sky-19b', position: { x: 12330, y: 190 } },
    { id: 'sky-19c', position: { x: 12670, y: 180 } },
    { id: 'sky-20', position: { x: 12900, y: 450 } },
  ],
  rewardBlocks: [
    rewardBlock('sky-dash-2', 9400, 380, { kind: 'power', power: 'dash' }),
    rewardBlock('sky-coin-branch', 9850, 220, { kind: 'coins', amount: 3 }),
    rewardBlock('sky-coin-3', 10750, 430, { kind: 'coins', amount: 3 }),
    rewardBlock('sky-coin-5', 11260, 140, { kind: 'coins', amount: 2 }),
    rewardBlock('sky-temp-bridge-cache', 12650, 130, { kind: 'coins', amount: 2 }),
    rewardBlock('sky-shooter', 13060, 350, { kind: 'power', power: 'shooter' }),
  ],
  secretRoutes: [
    {
      id: 'sky-halo-timed-secret-route',
      title: 'Halo Relay Slipstream',
      areaKind: 'abandonedMicroArea',
      mechanics: ['optionalDetour', 'timedReveal'],
      cue: {
        description: 'A relay shimmer outlines a short upper path before the halo scanner can energize it.',
        rect: { x: 12300, y: 214, width: 80, height: 16 },
        revealVolumeIds: ['sky-timed-route-trigger'],
        revealPlatformIds: ['sky-timed-secret-bridge'],
        scannerVolumeIds: ['sky-halo-scanner'],
        temporaryBridgeIds: ['sky-temporary-bridge-1'],
      },
      entry: { x: 12220, y: 180, width: 120, height: 96 },
      interior: { x: 12390, y: 100, width: 360, height: 180 },
      reconnect: { x: 12610, y: 166, width: 120, height: 64 },
      mainPath: { x: 12480, y: 336, width: 240, height: 64 },
      reward: {
        collectibleIds: ['sky-19c'],
        rewardBlockIds: ['sky-temp-bridge-cache'],
        note: 'The relay ledge hides extra samples before it rejoins the halo causeway.',
      },
    },
  ],
  hazards: [
    { id: 'sky-spikes-8', kind: 'spikes', rect: { x: 8790, y: 544, width: 60, height: 16 } },
    { id: 'sky-spikes-9', kind: 'spikes', rect: { x: 10400, y: 534, width: 80, height: 16 } },
    { id: 'sky-spikes-10', kind: 'spikes', rect: { x: 12540, y: 384, width: 50, height: 16 } },
    { id: 'sky-spikes-11', kind: 'spikes', rect: { x: 12840, y: 484, width: 40, height: 16 } },
  ],
  enemies: [
    {
      id: 'walker-4',
      kind: 'walker',
      position: { x: 9820, y: 380 },
      patrol: { left: 9810, right: 9960, speed: 108 },
    },
    {
      id: 'flyer-2',
      kind: 'flyer',
      position: { x: 9410, y: 160 },
      flyer: { left: 9300, right: 9670, speed: 112, bobAmp: 24, bobSpeed: 5.1 },
    },
    {
      id: 'hopper-3',
      kind: 'hopper',
      position: { x: 10350, y: 520 },
      hop: { intervalMs: 1180, impulse: 940, speed: 136 },
    },
    {
      id: 'flyer-3',
      kind: 'flyer',
      position: { x: 12540, y: 300 },
      flyer: { left: 12420, right: 12920, speed: 115, bobAmp: 28, bobSpeed: 5.3 },
    },
    {
      id: 'walker-5',
      kind: 'walker',
      position: { x: 12760, y: 470 },
      patrol: { left: 12750, right: 12940, speed: 118 },
    },
  ],
  exit: { x: 13120, y: 350, width: 48, height: 80 },
  hint: 'The array now climbs through the belfry, halo causeway, and crown approach with optional halo rails reconnecting above the storm band.',
  stageObjective: {
    kind: 'reactivateRelay',
    target: { kind: 'scannerVolume', id: 'sky-halo-scanner' },
  },
};

export const validateStageDefinition = (stage: StageDefinition): StageDefinition =>
  validateEnemyVariants(
    validateSecretRoutes(validateTraversalMechanics(validateStaticElementCollisions(validateRewardBlocks(stage)))),
  );

export const stageDefinitions: StageDefinition[] = validateStageCatalogSecretRoutes(
  validateStageCatalogMagneticRollout(
    baseStageDefinitions.map((stage) => {
    switch (stage.id) {
      case 'forest-ruins':
        return validateStageDefinition(applyStageExtension(stage, forestRuinsExtension));
      case 'amber-cavern':
        return validateStageDefinition(applyStageExtension(stage, amberCavernExtension));
      case 'sky-sanctum':
        return validateStageDefinition(applyStageExtension(stage, skySanctumExtension));
      default:
        return validateStageDefinition({
          ...stage,
          rewardBlocks: normalizeRewardBlocks(stage.platforms, stage.rewardBlocks),
        });
    }
    }),
  ),
);
