import { describe, expect, it } from 'vitest';

import { stageDefinitions, validateStageDefinition, type StageDefinition } from './stages';

const cloneStage = (): StageDefinition => JSON.parse(JSON.stringify(stageDefinitions[0])) as StageDefinition;
const cloneAmberStage = (): StageDefinition =>
  JSON.parse(JSON.stringify(stageDefinitions.find((stage) => stage.id === 'amber-cavern'))) as StageDefinition;

describe('launcher stage validation', () => {
  it('accepts supported launcher kinds with bounded upward-biased directions', () => {
    const stage = cloneStage();

    stage.launchers = [
      { id: 'valid-bounce', kind: 'bouncePod', x: 530, y: 575, width: 80, height: 14, direction: { x: 0.24, y: -1 } },
      { id: 'valid-gas', kind: 'gasVent', x: 620, y: 575, width: 50, height: 14 },
    ];

    expect(validateStageDefinition(stage).launchers).toHaveLength(2);
  });

  it('rejects launcher directions beyond the upward-biased clamp', () => {
    const stage = cloneStage();

    stage.launchers = [
      { id: 'bad-angle', kind: 'bouncePod', x: 530, y: 575, width: 80, height: 14, direction: { x: 1, y: -0.2 } },
    ];

    expect(() => validateStageDefinition(stage)).toThrow(
      'Launchers must use an upward-biased direction within 25 degrees of vertical',
    );
  });

  it('rejects ambiguous overlapping launcher contact areas', () => {
    const stage = cloneStage();

    stage.launchers = [
      { id: 'overlap-a', kind: 'bouncePod', x: 530, y: 575, width: 80, height: 14 },
      { id: 'overlap-b', kind: 'gasVent', x: 580, y: 575, width: 80, height: 14 },
    ];

    expect(() => validateStageDefinition(stage)).toThrow(
      'Launchers cannot overlap another launcher or spring contact area',
    );
  });
});

describe('secret route stage validation', () => {
  it('accepts the authored reconnecting sample cave route', () => {
    const stage = cloneAmberStage();

    expect(validateStageDefinition(stage).secretRoutes).toHaveLength(1);
  });

  it('rejects secret routes without meaningful reward value', () => {
    const stage = cloneAmberStage();

    stage.secretRoutes[0].reward.collectibleIds = [];
    stage.secretRoutes[0].reward.rewardBlockIds = [];
    stage.secretRoutes[0].reward.note = '';

    expect(() => validateStageDefinition(stage)).toThrow('Secret route must provide meaningful optional reward value');
  });

  it('rejects secret routes with unresolved reveal cue metadata', () => {
    const stage = cloneAmberStage();

    stage.secretRoutes[0].mechanics = ['revealPlatform'];
    stage.secretRoutes[0].cue.revealPlatformIds = ['missing-reveal-platform'];

    expect(() => validateStageDefinition(stage)).toThrow(
      'Secret route must use nearby authored traversal cues from supported mechanics',
    );
  });
});