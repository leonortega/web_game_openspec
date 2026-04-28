export type {
  ActivationNodeDefinition,
  EmptyPlatformMechanicFamily,
  EmptyPlatformProgressionSegment,
  EmptyPlatformSupportedMechanicFamily,
  EmptyPlatformTraversalRunDefinition,
  EnemyDefinition,
  GravityCapsuleButtonDefinition,
  GravityCapsuleDefinition,
  GravityCapsuleRoomContentDefinition,
  GravityFieldDefinition,
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
} from './types';

export {
  activationNode,
  falling,
  gravityCapsule,
  gravityField,
  ground,
  magneticPlatform,
  moving,
  revealPlatform,
  revealVolume,
  rewardBlock,
  scannerVolume,
  spring,
  startCabin,
  temporaryBridgePlatform,
  withSurfaceMechanic,
} from './builders';

export {
  validateStageCatalogMagneticRollout,
  validateStageCatalogSecretRoutes,
  validateStageCatalogTerrainRollout,
  validateStageDefinition,
  validateTraversalMechanics,
} from './validation';

export { stageDefinitions } from './catalog';
