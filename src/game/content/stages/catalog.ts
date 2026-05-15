import type { StageDefinition } from './types';
import { buildValidatedStageCatalog } from './stageCatalogUtils';
import { amberCavernStage } from './catalog/amberCavernStage';
import { forestRuinsStage } from './catalog/forestRuinsStage';
import { skySanctumStage } from './catalog/skySanctumStage';

export const stageDefinitions: StageDefinition[] = buildValidatedStageCatalog([
  forestRuinsStage,
  amberCavernStage,
  skySanctumStage,
]);
