import type {
  EnemyKind,
  GravityFieldKind,
  HazardKind,
  PlatformKind,
  PlatformSurfaceMechanic,
  Rect,
  RewardDefinition,
  StageObjectiveKind,
  StageObjectiveTargetKind,
  TurretVariantId,
  Vector2,
} from '../../simulation/state';
import type { StageAudioThemeMetadata } from '../../../audio/audioContract';

export type ActivationNodeDefinition = Rect & {
  id: string;
};

export type GravityCapsuleButtonDefinition = Rect & {
  id: string;
};

export type GravityCapsuleRoomContentDefinition = {
  platformIds?: string[];
  collectibleIds?: string[];
  rewardBlockIds?: string[];
  hazardIds?: string[];
  enemyIds?: string[];
};

export type GravityCapsuleDoorSupportsDefinition = {
  entryApproachPlatformId: string;
  entryApproachPath: Rect;
  exitInteriorPlatformId: string;
  exitReconnectPlatformId: string;
  exitReconnectPath: Rect;
  routePlatformIds: string[];
};

export type PlatformDefinition = Rect & {
  id: string;
  kind: PlatformKind;
  surfaceMechanic?: PlatformSurfaceMechanic;
  move?: { axis: 'x' | 'y'; range: number; speed: number };
  fall?: { triggerDelayMs: number; stayArmThresholdMs?: number; hopGapThresholdMs?: number };
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
  gravityCapsuleId?: string;
};

export type GravityCapsuleDefinition = {
  id: string;
  fieldId: string;
  shell: Rect;
  entryDoor: Rect;
  exitDoor: Rect;
  button: GravityCapsuleButtonDefinition;
  entryRoute: Rect;
  buttonRoute: Rect;
  exitRoute: Rect;
  contents: GravityCapsuleRoomContentDefinition;
  doorSupports?: GravityCapsuleDoorSupportsDefinition;
};

export type RevealVolumeDefinition = Rect & {
  id: string;
  revealPlatformIds: string[];
};

export type ScannerVolumeDefinition = Rect & {
  id: string;
  temporaryBridgeIds: string[];
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
  platformIds?: string[];
  revealVolumeIds?: string[];
  revealPlatformIds?: string[];
  scannerVolumeIds?: string[];
  temporaryBridgeIds?: string[];
  lowGravityZoneIds?: string[];
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
    | 'terrainVariant'
  )[];
  cue: SecretRouteCueDefinition;
  entry: Rect;
  interior: Rect;
  reconnect: Rect;
  mainPath: Rect;
  reward: SecretRouteRewardDefinition;
};

export const EMPTY_PLATFORM_SUPPORTED_MECHANIC_FAMILIES = [
  'moving',
  'unstableOrCollapsing',
  'springTraversal',
  'sticky',
  'brittle',
  'revealPlatform',
  'scannerSwitchTemporaryBridge',
  'activationNodeMagneticPlatform',
  'boundedGravityFieldTraversal',
] as const;

export type EmptyPlatformSupportedMechanicFamily = (typeof EMPTY_PLATFORM_SUPPORTED_MECHANIC_FAMILIES)[number];

export type EmptyPlatformMechanicFamily = EmptyPlatformSupportedMechanicFamily | 'jumpTiming';

export type EmptyPlatformProgressionSegment = 'early' | 'middle' | 'late';

export type EmptyPlatformTraversalRunDefinition = {
  id: string;
  traversalChallenge: boolean;
  progressionSegment: EmptyPlatformProgressionSegment;
  platformIds: string[];
  mechanicFamilies: EmptyPlatformMechanicFamily[];
};

export type StageObjectiveDefinition = {
  kind: StageObjectiveKind;
  target: {
    kind: StageObjectiveTargetKind;
    id: string;
  };
};

export type StartCabinDefinition = {
  centerX: number;
  baseY: number;
  facing: 1 | -1;
};

export type StageDefinition = {
  id: string;
  name: string;
  audio: StageAudioThemeMetadata;
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
  emptyPlatformRuns: EmptyPlatformTraversalRunDefinition[];
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
  startCabin: StartCabinDefinition;
  platforms: PlatformDefinition[];
  lowGravityZones: LowGravityZoneDefinition[];
  gravityFields: GravityFieldDefinition[];
  gravityCapsules: GravityCapsuleDefinition[];
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

export type StageExtension = {
  targetDurationMinutes: number;
  worldWidth: number;
  segments: StageDefinition['segments'];
  emptyPlatformRuns?: EmptyPlatformTraversalRunDefinition[];
  platforms: PlatformDefinition[];
  lowGravityZones?: LowGravityZoneDefinition[];
  gravityFields?: GravityFieldDefinition[];
  gravityCapsules?: GravityCapsuleDefinition[];
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
