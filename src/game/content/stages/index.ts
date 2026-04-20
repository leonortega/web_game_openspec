export type {
  ActivationNodeDefinition,
  EnemyDefinition,
  GravityCapsuleButtonDefinition,
  GravityCapsuleDefinition,
  GravityCapsuleRoomContentDefinition,
  GravityFieldDefinition,
  LauncherDefinition,
  LowGravityZoneDefinition,
  PlatformDefinition,
  RevealVolumeDefinition,
  RewardBlockDefinition,
  ScannerVolumeDefinition,
  SecretRouteDefinition,
  StageDefinition,
  StageExtension,
  StageObjectiveDefinition,
  StartCabinDefinition,
  TerrainSurfaceDefinition,
} from './types';

export {
  activationNode,
  falling,
  gravityCapsule,
  gravityField,
  ground,
  launcher,
  magneticPlatform,
  moving,
  normalizeRewardBlocks,
  revealPlatform,
  revealVolume,
  rewardBlock,
  scannerVolume,
  spring,
  startCabin,
  temporaryBridgePlatform,
  terrainSurface,
} from './builders';

export {
  validateStageCatalogMagneticRollout,
  validateStageCatalogSecretRoutes,
  validateStageDefinition,
  validateTraversalMechanics,
} from './validation';

export { stageDefinitions } from './catalog';
