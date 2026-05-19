import type { StageDefinition, StageExtension } from './types';
import {
  validateStageCatalogMagneticRollout,
  validateStageCatalogSecretRoutes,
  validateStageCatalogTerrainRollout,
  validateStageDefinition,
} from './validation';

export const applyStageExtension = (stage: StageDefinition, extension: StageExtension): StageDefinition => {
  const platforms = [...stage.platforms, ...extension.platforms];
  return {
    ...stage,
    targetDurationMinutes: extension.targetDurationMinutes,
    segments: [...stage.segments, ...extension.segments],
    emptyPlatformRuns: [...stage.emptyPlatformRuns, ...(extension.emptyPlatformRuns ?? [])],
    world: {
      ...stage.world,
      width: extension.worldWidth,
    },
    platforms,
    lowGravityZones: [...stage.lowGravityZones, ...(extension.lowGravityZones ?? [])],
    gravityFields: [...stage.gravityFields, ...(extension.gravityFields ?? [])],
    gravityCapsules: [...stage.gravityCapsules, ...(extension.gravityCapsules ?? [])],
    revealVolumes: [...stage.revealVolumes, ...(extension.revealVolumes ?? [])],
    scannerVolumes: [...stage.scannerVolumes, ...(extension.scannerVolumes ?? [])],
    activationNodes: [...stage.activationNodes, ...(extension.activationNodes ?? [])],
    checkpoints: [...stage.checkpoints, ...extension.checkpoints],
    collectibles: [...stage.collectibles, ...extension.collectibles],
    rewardBlocks: [...stage.rewardBlocks, ...extension.rewardBlocks],
    secretRoutes: [...stage.secretRoutes, ...(extension.secretRoutes ?? [])],
    hazards: [...stage.hazards, ...extension.hazards],
    enemies: [...stage.enemies, ...extension.enemies],
    exit: extension.exit,
    hint: extension.hint,
    stageObjective: extension.stageObjective ?? stage.stageObjective,
  };
};

export const buildValidatedStageCatalog = (stages: StageDefinition[]): StageDefinition[] =>
  validateStageCatalogSecretRoutes(
    validateStageCatalogTerrainRollout(
      validateStageCatalogMagneticRollout(stages.map((stage) => validateStageDefinition(stage))),
    ),
  );
