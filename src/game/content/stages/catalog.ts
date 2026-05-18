import type { StageDefinition } from './types';
import { buildValidatedStageCatalog } from './stageCatalogUtils';
import { amberCavernStage } from './catalog/amberCavernStage';
import { forestRuinsStage } from './catalog/forestRuinsStage';
import { prismLiftworksStage } from './catalog/prismLiftworksStage';
import { signalWeirStage } from './catalog/signalWeirStage';
import { skySanctumStage } from './catalog/skySanctumStage';
import { surveyorsRunoffStage } from './catalog/surveyorsRunoffStage';

export const stageDefinitions: StageDefinition[] = buildValidatedStageCatalog([
  forestRuinsStage,
  amberCavernStage,
  skySanctumStage,
  surveyorsRunoffStage,
  signalWeirStage,
  prismLiftworksStage,
]);
