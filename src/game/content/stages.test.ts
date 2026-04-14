import { describe, expect, it } from 'vitest';

import { stageDefinitions, validateStageDefinition, type StageDefinition } from './stages';

const cloneStage = (): StageDefinition => JSON.parse(JSON.stringify(stageDefinitions[0])) as StageDefinition;
const cloneAmberStage = (): StageDefinition =>
  JSON.parse(JSON.stringify(stageDefinitions.find((stage) => stage.id === 'amber-cavern'))) as StageDefinition;
const cloneSkyStage = (): StageDefinition =>
  JSON.parse(JSON.stringify(stageDefinitions.find((stage) => stage.id === 'sky-sanctum'))) as StageDefinition;

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

describe('activation-node magnetic platform stage validation', () => {
  it('accepts the bounded forest rollout with one nearby activation node and one retry-safe magnetic platform', () => {
    const stage = cloneStage();

    expect(validateStageDefinition(stage).activationNodes).toHaveLength(1);
    expect(validateStageDefinition(stage).platforms.filter((platform) => platform.magnetic)).toHaveLength(1);
  });

  it('rejects magnetic platforms linked to unknown activation nodes', () => {
    const stage = cloneStage();
    const magnetic = stage.platforms.find((platform) => platform.magnetic);
    if (!magnetic?.magnetic) {
      throw new Error('Expected forest magnetic fixture.');
    }

    magnetic.magnetic.activationNodeId = 'missing-node';

    expect(() => validateStageDefinition(stage)).toThrow('Magnetic platforms reference unknown activation nodes');
  });

  it('rejects activation nodes that are too far from their linked magnetic platform', () => {
    const stage = cloneStage();
    stage.activationNodes[0].x -= 40;

    expect(() => validateStageDefinition(stage)).toThrow('Activation nodes must stay nearby their linked magnetic platforms');
  });

  it('rejects magnetic routes that remove the retry-safe fallback below the powered platform', () => {
    const stage = cloneStage();
    stage.platforms = stage.platforms.filter((platform) => platform.id !== 'platform-9920-540');

    expect(() => validateStageDefinition(stage)).toThrow(
      'Activation-node magnetic platforms must preserve a retry-safe non-magnetic fallback path',
    );
  });
});

describe('gravity field stage validation', () => {
  it('authors exactly one anti-grav stream and one gravity inversion column in Halo Spire Array', () => {
    const stage = cloneSkyStage();

    const validated = validateStageDefinition(stage);
    expect(validated.gravityFields.map((field) => field.kind).sort()).toEqual([
      'anti-grav-stream',
      'gravity-inversion-column',
    ]);
  });

  it('rejects gravity-field rollout on unsupported stages', () => {
    const stage = cloneStage();

    stage.gravityFields = [{ id: 'bad-rollout', kind: 'anti-grav-stream', x: 520, y: 260, width: 160, height: 180 }];

    expect(() => validateStageDefinition(stage)).toThrow('Gravity-field rollout is limited to sky-sanctum.');
  });

  it('rejects overlapping gravity fields and nearby checkpoint placement', () => {
    const stage = cloneSkyStage();
    const [antiGravStream, inversionColumn] = stage.gravityFields;

    stage.gravityFields = [
      antiGravStream,
      { ...inversionColumn, x: antiGravStream.x + 80, y: antiGravStream.y + 40 },
    ];

    expect(() => validateStageDefinition(stage)).toThrow('Gravity fields cannot overlap another gravity modifier zone');

    stage.gravityFields = [antiGravStream, inversionColumn];
    stage.checkpoints[0] = {
      ...stage.checkpoints[0],
      rect: { x: antiGravStream.x + 24, y: antiGravStream.y + antiGravStream.height - 80, width: 24, height: 80 },
    };

    expect(() => validateStageDefinition(stage)).toThrow('Checkpoints must stay outside immediate gravity-field motion');
  });
});

describe('secret route stage validation', () => {
  it('accepts the authored reconnecting sample cave route', () => {
    const stage = cloneAmberStage();

    expect(validateStageDefinition(stage).secretRoutes).toHaveLength(1);
  });

  it('accepts the authored timed-reveal secret route in the sky stage', () => {
    const stage = cloneSkyStage();

    expect(validateStageDefinition(stage).secretRoutes.some((route) => route.mechanics.includes('timedReveal'))).toBe(true);
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

  it('rejects malformed timed-reveal links that remove the authored reveal cue', () => {
    const stage = cloneSkyStage();

    stage.revealVolumes = stage.revealVolumes.filter((volume) => volume.id !== 'sky-timed-route-trigger');

    expect(() => validateStageDefinition(stage)).toThrow(
      'Timed-reveal platforms must link one reveal cue and one scanner activator through authored stage data',
    );
  });

  it('rejects timed-reveal routes whose scanner overlaps the reveal cue before the route is legible', () => {
    const stage = cloneSkyStage();
    const route = stage.secretRoutes.find((entry) => entry.id === 'sky-halo-timed-secret-route');
    const scanner = stage.scannerVolumes.find((volume) => volume.id === 'sky-halo-scanner');
    if (!route || !scanner) {
      throw new Error('Expected timed-reveal sky route fixture.');
    }

    scanner.x = route.cue.rect.x;
    scanner.y = route.cue.rect.y - 12;
    scanner.width = route.cue.rect.width + 20;
    scanner.height = 40;

    expect(() => validateStageDefinition(stage)).toThrow(
      'Timed-reveal secret routes must make the route legible before scanner timing begins',
    );
  });
});

describe('lightweight stage objective validation', () => {
  it('accepts authored checkpoint and scanner-backed stage objectives', () => {
    expect(stageDefinitions.find((stage) => stage.id === 'forest-ruins')?.stageObjective).toEqual({
      kind: 'restoreBeacon',
      target: { kind: 'checkpoint', id: 'cp-6' },
    });
    expect(stageDefinitions.find((stage) => stage.id === 'sky-sanctum')?.stageObjective).toEqual({
      kind: 'reactivateRelay',
      target: { kind: 'scannerVolume', id: 'sky-halo-scanner' },
    });
  });

  it('rejects stage objectives that reference unknown authored targets', () => {
    const stage = cloneStage();

    stage.stageObjective = {
      kind: 'restoreBeacon',
      target: { kind: 'checkpoint', id: 'missing-checkpoint' },
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Stage objective references unknown checkpoint: missing-checkpoint',
    );
  });
});

describe('turret variant stage validation', () => {
  it('authors exactly two supported turret variant encounters per biome rollout', () => {
    const amberVariants = cloneAmberStage().enemies.filter((enemy) => enemy.variant === 'resinBurst');
    const skyVariants = cloneSkyStage().enemies.filter((enemy) => enemy.variant === 'ionPulse');

    expect(amberVariants).toHaveLength(2);
    expect(amberVariants.every((enemy) => enemy.kind === 'turret')).toBe(true);
    expect(amberVariants[0].position.x).toBeLessThan(amberVariants[1].position.x);

    expect(skyVariants).toHaveLength(2);
    expect(skyVariants.every((enemy) => enemy.kind === 'turret')).toBe(true);
    expect(skyVariants[0].position.x).toBeLessThan(skyVariants[1].position.x);
  });

  it('rejects unsupported turret variant assignments', () => {
    const stage = cloneSkyStage();
    const walkerVariant = stage.enemies.find((enemy) => enemy.id === 'turret-1');
    if (!walkerVariant || walkerVariant.kind !== 'turret') {
      throw new Error('Expected sky-sanctum turret fixture.');
    }

    walkerVariant.kind = 'walker';
    walkerVariant.patrol = { left: 2570, right: 2750, speed: 100 };
    delete walkerVariant.turret;

    expect(() => validateStageDefinition(stage)).toThrow('Biome-linked variants are limited to turret enemies');
  });

  it('rejects turret variants on the wrong biome stage', () => {
    const stage = cloneSkyStage();
    const turret = stage.enemies.find((enemy) => enemy.id === 'turret-1');
    if (!turret || turret.kind !== 'turret') {
      throw new Error('Expected sky-sanctum turret fixture.');
    }

    turret.variant = 'resinBurst';

    expect(() => validateStageDefinition(stage)).toThrow('Turret variants must stay on their supported biome stages');
  });
});