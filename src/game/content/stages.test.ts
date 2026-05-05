import { describe, expect, it } from 'vitest';

import {
  ACTIVE_SUSTAINED_MUSIC_MANIFEST,
  BACKUP_SUSTAINED_MUSIC_MANIFEST,
  MENU_SUSTAINED_MUSIC,
  getStageSustainedMusic,
} from '../../audio/musicAssets';
import { stageDefinitions, validateStageCatalogTerrainRollout, validateStageDefinition, type StageDefinition } from './stages';
import {
  enemyRect,
  findCheckpointSupport,
  findExitSupport,
  findGroundedEnemySupport,
  findHazardSupport,
  rewardBlockNeedsSupportSnap,
} from './stages/builders';

const terrainVariantPlatforms = (stage: StageDefinition, kind: 'brittleCrystal' | 'stickySludge') =>
  stage.platforms.filter((platform) => platform.surfaceMechanic?.kind === kind);

const springPlatforms = (stage: StageDefinition) => stage.platforms.filter((platform) => platform.kind === 'spring');

const STAGE_START_CABIN_BASE_HEIGHT = 12;

const cloneStage = (): StageDefinition => JSON.parse(JSON.stringify(stageDefinitions[0])) as StageDefinition;
const cloneAmberStage = (): StageDefinition =>
  JSON.parse(JSON.stringify(stageDefinitions.find((stage) => stage.id === 'amber-cavern'))) as StageDefinition;
const cloneSkyStage = (): StageDefinition =>
  JSON.parse(JSON.stringify(stageDefinitions.find((stage) => stage.id === 'sky-sanctum'))) as StageDefinition;

const gravityRoomFlowSummary = (stage: StageDefinition, roomId: string) => {
  const capsule = stage.gravityCapsules.find((entry) => entry.id === roomId);
  if (!capsule?.doorSupports) {
    throw new Error(`Expected gravity room fixture with door supports: ${roomId}`);
  }

  const shellMidX = capsule.shell.x + capsule.shell.width / 2;
  const shellRight = capsule.shell.x + capsule.shell.width;
  const shellBottom = capsule.shell.y + capsule.shell.height;
  const buttonCenterX = capsule.button.x + capsule.button.width / 2;

  return {
    capsule,
    entryDoorRatio: (capsule.entryDoor.x + capsule.entryDoor.width / 2 - capsule.shell.x) / capsule.shell.width,
    exitDoorRatio: (capsule.exitDoor.x + capsule.exitDoor.width / 2 - capsule.shell.x) / capsule.shell.width,
    entryDoorOnLeftWall: capsule.entryDoor.x === capsule.shell.x,
    exitDoorOnRightWall: capsule.exitDoor.x + capsule.exitDoor.width === shellRight,
    bottomEdgeSealed:
      capsule.entryDoor.y + capsule.entryDoor.height < shellBottom &&
      capsule.exitDoor.y + capsule.exitDoor.height < shellBottom,
    buttonBetweenDoors:
      buttonCenterX > capsule.entryDoor.x + capsule.entryDoor.width && buttonCenterX < capsule.exitDoor.x,
    entryPathReadsLeft:
      capsule.doorSupports.entryApproachPath.x < capsule.shell.x &&
      capsule.doorSupports.entryApproachPath.x + capsule.doorSupports.entryApproachPath.width <= shellMidX,
    exitPathReadsRight:
      capsule.doorSupports.exitReconnectPath.x >= shellMidX &&
      capsule.doorSupports.exitReconnectPath.x + capsule.doorSupports.exitReconnectPath.width > shellRight,
    distinctExteriorSupport:
      capsule.doorSupports.entryApproachPlatformId !== capsule.doorSupports.exitReconnectPlatformId,
    distinctEntryAndExitSupport:
      capsule.doorSupports.entryApproachPlatformId !== capsule.doorSupports.exitInteriorPlatformId,
  };
};

const terrainBeatSummary = (stage: StageDefinition, kind: 'brittleCrystal' | 'stickySludge') =>
  new Set(
    terrainVariantPlatforms(stage, kind)
      .map((platform) => stage.segments.find((segment) => platform.x + platform.width / 2 >= segment.startX && platform.x + platform.width / 2 <= segment.endX)?.id ?? 'unmapped'),
  );

const terrainKindsPresent = (stage: StageDefinition) =>
  new Set(
    stage.platforms.flatMap((platform) =>
      platform.surfaceMechanic?.kind === 'brittleCrystal' || platform.surfaceMechanic?.kind === 'stickySludge'
        ? [platform.surfaceMechanic.kind]
        : [],
    ),
  );

const qualifyingEmptyPlatformRuns = (stage: StageDefinition) => stage.emptyPlatformRuns.filter((run) => run.traversalChallenge);

describe('spring stage validation', () => {
  it('accepts exits that stay grounded on a supported final platform', () => {
    const stage = cloneStage();

    expect(validateStageDefinition(stage).exit).toEqual(stage.exit);
  });

  it('rejects unsupported floating exit endpoints', () => {
    const stage = cloneStage();

    stage.exit = {
      ...stage.exit,
      x: stage.exit.x + 80,
    };

    expect(() => validateStageDefinition(stage)).toThrow('Stage exits must sit on readable grounded support');
  });

  it('rejects exits that only stand on reveal-only helper support', () => {
    const stage = cloneStage();
    stage.exit = {
      ...stage.exit,
      x: stage.world.width - 60,
    };

    stage.platforms = [
      ...stage.platforms,
      {
        id: 'exit-reveal-support',
        kind: 'static',
        x: stage.exit.x - 12,
        y: stage.exit.y + stage.exit.height,
        width: 72,
        height: 24,
        reveal: { id: 'exit-reveal' },
      },
    ];

    expect(() => validateStageDefinition(stage)).toThrow('Stage exits must sit on readable grounded support');
  });

  it('rejects retired bounce and gas surface mechanics authored on static support', () => {
    const stage = cloneStage() as StageDefinition & { platforms: Array<StageDefinition['platforms'][number] & { surfaceMechanic?: unknown }> };

    stage.platforms = stage.platforms.map((platform) =>
      platform.id === 'platform-510-575'
        ? { ...platform, surfaceMechanic: { kind: 'bouncePod' } }
        : platform.id === 'platform-760-525'
          ? { ...platform, surfaceMechanic: { kind: 'gasVent' } }
          : platform,
    ) as typeof stage.platforms;

    expect(() => validateStageDefinition(stage as StageDefinition)).toThrow(
      'Platform surface mechanics only support brittle crystal and sticky sludge on static platforms',
    );
  });

  it('rejects overlapping spring platforms that fake a token overlay conversion', () => {
    const stage = cloneStage();

    stage.platforms.push(
      { id: 'overlap-a', kind: 'spring', x: 530, y: 575, width: 80, height: 32, spring: { boost: 860, cooldownMs: 350 } },
      { id: 'overlap-b', kind: 'static', x: 580, y: 575, width: 80, height: 32 },
    );

    expect(() => validateStageDefinition(stage)).toThrow(
      'Spring platforms must use one full-footprint authored support beat instead of overlapping plain-support stand-ins',
    );
  });

  it('rejects deprecated spring launcher metadata encoded as launcher annotations', () => {
    const stage = cloneStage() as StageDefinition & { launchers?: unknown[] };

    stage.launchers = [
      { id: 'deprecated-spring', kind: 'spring', x: 530, y: 575, width: 80, height: 14 },
    ];

    expect(() => validateStageDefinition(stage)).toThrow(
      'Spring platforms must be authored as platform kinds instead of stage launchers',
    );
  });

  it('accepts shipped spring-platform conversions while keeping the shipped catalog free of launcher annotations', () => {
    const forest = validateStageDefinition(cloneStage());
    const amber = validateStageDefinition(cloneAmberStage());
    const sky = validateStageDefinition(cloneSkyStage());

    expect((stageDefinitions as Array<StageDefinition & { launchers?: unknown[] }>).flatMap((stage) => stage.launchers ?? [])).toHaveLength(0);
    expect(springPlatforms(forest)).toHaveLength(5);
    expect(springPlatforms(amber)).toHaveLength(4);
    expect(springPlatforms(sky)).toHaveLength(4);
    expect(forest.platforms.find((platform) => platform.id === 'platform-6940-460-spring')?.kind).toBe('spring');
    expect(forest.platforms.find((platform) => platform.id === 'platform-3890-420')?.kind).toBe('spring');
    expect(forest.platforms.find((platform) => platform.id === 'platform-5820-450')?.kind).toBe('falling');
    expect(amber.platforms.find((platform) => platform.id === 'platform-2110-480')?.kind).toBe('spring');
    expect(amber.platforms.find((platform) => platform.id === 'platform-4630-460')?.kind).toBe('spring');
    expect(sky.platforms.find((platform) => platform.id === 'platform-2280-520')?.kind).toBe('spring');
    expect(sky.platforms.find((platform) => platform.id === 'platform-4460-430')?.kind).toBe('falling');
    expect(sky.platforms.find((platform) => platform.id === 'platform-6590-470')?.kind).toBe('spring');
    expect(sky.platforms.find((platform) => platform.id === 'platform-10640-480-spring')?.kind).toBe('spring');
  });
});

describe('enemy placement validation', () => {
  it('accepts current grounded non-flying enemy placement across the authored stage', () => {
    const stage = cloneStage();

    expect(validateStageDefinition(stage).enemies).toEqual(stage.enemies);
  });

  it('keeps shipped grounded enemies authored flush to their resolved support across current stages', () => {
    const stages = [cloneStage(), cloneAmberStage(), cloneSkyStage()];

    for (const stage of stages) {
      for (const enemy of stage.enemies.filter((entry) => entry.kind !== 'flyer')) {
        const support = findGroundedEnemySupport(stage, enemy);
        const bounds = enemyRect(enemy);

        expect(support, `${stage.id}:${enemy.id} should resolve visible support`).toBeTruthy();
        expect(bounds.y + bounds.height, `${stage.id}:${enemy.id} should sit flush on authored support`).toBe(support!.y);
      }
    }
  });

  it('keeps shipped spike hazards authored flush to their resolved support across current stages', () => {
    const stages = [cloneStage(), cloneAmberStage(), cloneSkyStage()];

    for (const stage of stages) {
      for (const hazard of stage.hazards.filter((entry) => entry.kind === 'spikes')) {
        const support = findHazardSupport(stage, hazard.rect);

        expect(support, `${stage.id}:${hazard.id} should resolve visible support`).toBeTruthy();
        expect(
          hazard.rect.y + hazard.rect.height,
          `${stage.id}:${hazard.id} should sit flush on authored support`,
        ).toBe(support!.y);
      }
    }
  });

  it('keeps shipped checkpoints authored flush to their resolved support across current stages', () => {
    const stages = [cloneStage(), cloneAmberStage(), cloneSkyStage()];

    for (const stage of stages) {
      for (const checkpoint of stage.checkpoints) {
        const support = findCheckpointSupport(stage, checkpoint.rect);

        expect(support, `${stage.id}:${checkpoint.id} should resolve visible support`).toBeTruthy();
        expect(
          checkpoint.rect.y + checkpoint.rect.height,
          `${stage.id}:${checkpoint.id} should sit flush on authored support`,
        ).toBe(support!.y);
      }
    }
  });

  it('keeps shipped exits authored flush to their resolved support across current stages', () => {
    const stages = [cloneStage(), cloneAmberStage(), cloneSkyStage()];

    for (const stage of stages) {
      const support = findExitSupport(stage, stage.exit);

      expect(support, `${stage.id}:exit should resolve visible support`).toBeTruthy();
      expect(stage.exit.y + stage.exit.height, `${stage.id}:exit should sit flush on authored support`).toBe(support!.y);
    }
  });

  it('keeps shipped stage-start cabin bases planted on the start platform surface', () => {
    const stages = [cloneStage(), cloneAmberStage(), cloneSkyStage()];

    for (const stage of stages) {
      const support = stage.platforms.find(
        (platform) =>
          stage.startCabin.centerX >= platform.x &&
          stage.startCabin.centerX <= platform.x + platform.width &&
          Math.abs(stage.startCabin.baseY + STAGE_START_CABIN_BASE_HEIGHT / 2 - platform.y) <= 0,
      );

      expect(support, `${stage.id}:start cabin should sit on visible start support`).toBeTruthy();
      expect(stage.startCabin.baseY + STAGE_START_CABIN_BASE_HEIGHT / 2).toBe(support!.y);
    }
  });

  it('keeps shipped reward blocks authored high enough that visible support never snaps them upward', () => {
    const stages = [cloneStage(), cloneAmberStage(), cloneSkyStage()];

    for (const stage of stages) {
      for (const block of stage.rewardBlocks) {
        expect(
          rewardBlockNeedsSupportSnap(stage.platforms, block),
          `${stage.id}:${block.id} should not depend on hidden support snap`,
        ).toBe(false);
      }
    }
  });

  it('accepts grounded hoppers that start on real support and have a reachable supported first landing', () => {
    const stage = cloneStage();
    const hopper = stage.enemies.find((enemy) => enemy.id === 'hopper-1');
    if (!hopper || hopper.kind !== 'hopper') {
      throw new Error('Expected forest hopper fixture.');
    }

    hopper.position.y = 510;

    expect(validateStageDefinition(stage).enemies.find((enemy) => enemy.id === 'hopper-1')?.position.y).toBe(510);
  });

  it('rejects non-flying enemies that sit off readable platform support', () => {
    const stage = cloneStage();
    const walker = stage.enemies.find((enemy) => enemy.id === 'walker-1');
    if (!walker || walker.kind !== 'walker') {
      throw new Error('Expected forest walker fixture.');
    }

    walker.position.x = 1450;
    walker.position.y = 640;

    expect(() => validateStageDefinition(stage)).toThrow('Non-flying enemies must sit on readable platform support');
  });

  it('rejects grounded hoppers that would start floating above nearby support', () => {
    const stage = cloneStage();
    const hopper = stage.enemies.find((enemy) => enemy.id === 'hopper-1');
    if (!hopper || hopper.kind !== 'hopper') {
      throw new Error('Expected forest hopper fixture.');
    }

    hopper.position.y = 472;

    expect(() => validateStageDefinition(stage)).toThrow('Non-flying enemies must sit on readable platform support');
  });

  it('rejects grounded hoppers whose first hop has no reachable supported landing', () => {
    const stage = cloneStage();
    stage.platforms = stage.platforms.filter((platform) => platform.id !== 'platform-2180-495');

    expect(() => validateStageDefinition(stage)).toThrow('Grounded hoppers must author a reachable supported first landing');
  });

  it('rejects non-flying enemies hidden below the stage floor while allowing flyers off platforms', () => {
    const stage = cloneStage();
    const hopper = stage.enemies.find((enemy) => enemy.id === 'hopper-1');
    const flyer = stage.enemies.find((enemy) => enemy.id === 'flyer-1');
    if (!hopper || hopper.kind !== 'hopper' || !flyer || flyer.kind !== 'flyer') {
      throw new Error('Expected forest hopper and flyer fixtures.');
    }

    flyer.position.x = 1500;
    flyer.position.y = 680;
    expect(validateStageDefinition(stage).enemies.find((enemy) => enemy.id === 'flyer-1')?.position.y).toBe(680);

    hopper.position.y = stage.world.height;

    expect(() => validateStageDefinition(stage)).toThrow('Non-flying enemies must stay within the visible stage bounds');
  });

  it('rejects hazards that float off readable grounded support', () => {
    const stage = cloneStage();
    const hazard = stage.hazards.find((entry) => entry.id === 'spikes-1');
    if (!hazard) {
      throw new Error('Expected forest hazard fixture.');
    }

    hazard.rect.y -= 40;

    expect(() => validateStageDefinition(stage)).toThrow('Hazards must sit on readable grounded support');
  });

  it('rejects hazards that only pass by tolerant normalization instead of authored flush support', () => {
    const stage = cloneStage();
    const hazard = stage.hazards.find((entry) => entry.id === 'spikes-1');
    if (!hazard) {
      throw new Error('Expected forest hazard fixture.');
    }

    hazard.rect.y -= 4;

    expect(() => validateStageDefinition(stage)).toThrow('Hazards must sit on readable grounded support');
  });

  it('rejects grounded enemies that only stand on reveal-only helper support', () => {
    const stage = cloneStage();

    stage.platforms = stage.platforms.filter((platform) => platform.id !== 'platform-1020-470');
    stage.platforms.push({
      id: 'reveal-only-support',
      kind: 'static',
      x: 1020,
      y: 468,
      width: 190,
      height: 32,
      reveal: { id: 'test-reveal' },
    });

    expect(() => validateStageDefinition(stage)).toThrow('Non-flying enemies must sit on readable platform support');
  });
});

describe('stage audio composition validation', () => {
  it('maps the current menu and playable stages to distinct ChillMindscapes sustained tracks', () => {
    expect(MENU_SUSTAINED_MUSIC.title).toBe('Call For Love');
    expect(getStageSustainedMusic('forest-ruins')?.title).toBe('Hour For Two');
    expect(getStageSustainedMusic('amber-cavern')?.title).toBe('Give Her Shadow');
    expect(getStageSustainedMusic('sky-sanctum')?.title).toBe('Get Out');
    expect(ACTIVE_SUSTAINED_MUSIC_MANIFEST.every((entry) => entry.license === 'CC-BY-4.0')).toBe(true);
    expect(new Set(ACTIVE_SUSTAINED_MUSIC_MANIFEST.map((entry) => entry.localAssetPath)).size).toBe(4);
    expect(ACTIVE_SUSTAINED_MUSIC_MANIFEST.every((entry) => entry.localAssetPath.startsWith('/audio/music/chillmindscapes-pack-4/'))).toBe(true);
    expect(BACKUP_SUSTAINED_MUSIC_MANIFEST.map((entry) => entry.title)).toEqual([
      'She Will Try',
      'Easy Dreams',
      'A Day',
    ]);
  });

  it('authors richer phrase-family metadata for each current playable stage', () => {
    const stages = ['forest-ruins', 'amber-cavern', 'sky-sanctum']
      .map((id) => stageDefinitions.find((stage) => stage.id === id))
      .filter((stage): stage is StageDefinition => Boolean(stage));

    expect(new Set(stages.map((stage) => stage.audio.signature)).size).toBe(3);
    expect(stages.every((stage) => stage.audio.transitionPhrases.intro.relationship.includes('states'))).toBe(true);
    expect(stages.every((stage) => stage.audio.transitionPhrases.clear.relationship.includes('resolves'))).toBe(true);
    expect(stages.every((stage) => stage.audio.transitionPhrases.final.relationship.includes('culminates'))).toBe(true);
  });

  it('rejects stages missing required transition metadata', () => {
    const stage = cloneStage();
    stage.audio.themeId = '';

    expect(() => validateStageDefinition(stage)).toThrow(
      'Stage audio metadata must declare a transition theme and signature',
    );

    const missingPhraseFamily = cloneStage();
    missingPhraseFamily.audio.transitionPhrases.clear.relationship = '';

    expect(() => validateStageDefinition(missingPhraseFamily)).toThrow(
      'Stage audio metadata must declare intro, clear, and final transition labels and relationships',
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
  it('requires every main stage to keep live brittle or sticky rollout while still authoring gravity sections', () => {
    const forest = validateStageDefinition(cloneStage());
    const amber = validateStageDefinition(cloneAmberStage());
    const sky = validateStageDefinition(cloneSkyStage());

    expect(terrainVariantPlatforms(forest, 'stickySludge')).toHaveLength(1);
    expect(terrainBeatSummary(forest, 'stickySludge').size).toBeGreaterThanOrEqual(1);
    expect(terrainKindsPresent(forest)).toEqual(new Set(['stickySludge']));
    expect(forest.gravityFields.length).toBeGreaterThan(0);

    expect(terrainVariantPlatforms(amber, 'brittleCrystal')).toHaveLength(1);
    expect(terrainBeatSummary(amber, 'brittleCrystal').size).toBeGreaterThanOrEqual(1);
    expect(terrainKindsPresent(amber)).toEqual(new Set(['brittleCrystal']));
    expect(amber.gravityFields.length).toBeGreaterThan(0);
    expect(springPlatforms(amber)).toHaveLength(4);

    expect(terrainVariantPlatforms(sky, 'stickySludge')).toHaveLength(1);
    expect(terrainBeatSummary(sky, 'stickySludge').size).toBeGreaterThanOrEqual(1);
    expect(terrainKindsPresent(sky)).toEqual(new Set(['stickySludge']));
    expect(sky.gravityFields.length).toBeGreaterThan(0);
    expect(springPlatforms(sky)).toHaveLength(4);

    expect(springPlatforms(forest)).toHaveLength(5);

    const combinedKinds = new Set([...terrainKindsPresent(forest), ...terrainKindsPresent(amber), ...terrainKindsPresent(sky)]);
    expect(combinedKinds).toEqual(new Set(['brittleCrystal', 'stickySludge']));

    const forestWithoutTerrain = cloneStage();
    forestWithoutTerrain.platforms = forestWithoutTerrain.platforms.map((platform) =>
      platform.id === 'platform-9920-540' ? { ...platform, surfaceMechanic: undefined } : platform,
    );
    expect(() => validateStageDefinition(forestWithoutTerrain)).toThrow(
      'Main stages must author at least one readable brittle crystal or sticky sludge terrain variant: forest-ruins',
    );

    const stickyOnlyCatalog = stageDefinitions.map((stage) => ({
      ...stage,
      platforms: stage.platforms.map((platform) =>
        platform.surfaceMechanic?.kind === 'brittleCrystal'
          ? { ...platform, surfaceMechanic: { kind: 'stickySludge' as const } }
          : platform,
      ),
    }));
    expect(() => validateStageCatalogTerrainRollout(stickyOnlyCatalog)).toThrow(
      'Main stage terrain rollout must include both brittle crystal and sticky sludge across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array: missing brittleCrystal',
    );

    const amberWithoutGravity = cloneAmberStage();
    amberWithoutGravity.gravityFields = [];
    amberWithoutGravity.gravityCapsules = [];
    expect(() => validateStageDefinition(amberWithoutGravity)).toThrow(
      'Main stages must author at least one bounded gravity-field section: amber-cavern',
    );
  });

  it('keeps brittle and sticky terrain authoring valid outside the current main stages', () => {
    const sideStage = cloneAmberStage();
    sideStage.id = 'terrain-variant-regression-fixture';
    sideStage.enemies = sideStage.enemies.map((enemy) =>
      enemy.kind === 'turret' ? { ...enemy, variant: undefined } : enemy,
    );
    sideStage.platforms = sideStage.platforms.map((platform) => {
      if (platform.id === 'platform-8160-520') {
        return { ...platform, surfaceMechanic: { kind: 'stickySludge' } };
      }

      if (platform.id === 'platform-9460-420') {
        return { ...platform, surfaceMechanic: { kind: 'brittleCrystal' } };
      }

      return platform;
    });

    expect(terrainVariantPlatforms(validateStageDefinition(sideStage), 'stickySludge')).toHaveLength(1);
    expect(terrainVariantPlatforms(validateStageDefinition(sideStage), 'brittleCrystal')).toHaveLength(1);
    expect(terrainBeatSummary(validateStageDefinition(sideStage), 'stickySludge').size).toBeGreaterThanOrEqual(1);
    expect(terrainBeatSummary(validateStageDefinition(sideStage), 'brittleCrystal').size).toBeGreaterThanOrEqual(1);
  });

  it('rejects legacy brittle and sticky terrain overlays and non-static platform variant usage', () => {
    const legacyOverlayStage = cloneStage() as ReturnType<typeof cloneStage> & { terrainSurfaces?: unknown[] };
    legacyOverlayStage.platforms = legacyOverlayStage.platforms.map((platform) => ({ ...platform, surfaceMechanic: undefined }));
    legacyOverlayStage.terrainSurfaces = [
      { id: 'legacy-sticky', kind: 'stickySludge', x: 8350, y: 520, width: 132, height: 12 },
    ];

    expect(() => validateStageDefinition(legacyOverlayStage)).toThrow(
      'Brittle crystal and sticky sludge must be authored on platform terrainVariant instead of terrain surfaces',
    );

    const mixedAuthoringStage = cloneStage();
    mixedAuthoringStage.gravityCapsules = mixedAuthoringStage.gravityCapsules.map((capsule, index) =>
      index === 0
        ? {
            ...capsule,
            contents: {
              ...capsule.contents,
              terrainSurfaceIds: ['legacy-brittle'],
            },
          }
        : capsule,
    ) as typeof mixedAuthoringStage.gravityCapsules;

    expect(() => validateStageDefinition(mixedAuthoringStage)).toThrow(
      'Gravity rooms must reference platform-owned surface mechanics through platform ids',
    );

    const movingVariantStage = cloneStage();
    movingVariantStage.platforms = movingVariantStage.platforms.map((platform) =>
      platform.kind === 'moving' ? { ...platform, surfaceMechanic: { kind: 'stickySludge' } } : platform,
    );

    expect(() => validateStageDefinition(movingVariantStage)).toThrow(
      'Platform surface mechanics must stay on plain static platforms',
    );
  });

  it('authors exactly one anti-grav stream and one gravity inversion column in Halo Spire Array', () => {
    const stage = cloneSkyStage();

    const validated = validateStageDefinition(stage);
    expect(validated.gravityFields.map((field) => field.kind).sort()).toEqual([
      'anti-grav-stream',
      'gravity-inversion-column',
    ]);
    expect(validated.gravityCapsules).toHaveLength(2);
    expect(validated.gravityCapsules.map((capsule) => capsule.fieldId).sort()).toEqual([
      'sky-anti-grav-stream',
      'sky-gravity-inversion-column',
    ]);
  });

  it('encloses every current playable gravity field in its own authored gravity room', () => {
    const forest = validateStageDefinition(cloneStage());
    const amber = validateStageDefinition(cloneAmberStage());
    const sky = validateStageDefinition(cloneSkyStage());

    expect(forest.gravityCapsules).toHaveLength(forest.gravityFields.length);
    expect(amber.gravityCapsules).toHaveLength(amber.gravityFields.length);
    expect(sky.gravityCapsules).toHaveLength(sky.gravityFields.length);
    expect(forest.gravityFields.every((field) => field.gravityCapsuleId)).toBe(true);
    expect(amber.gravityFields.every((field) => field.gravityCapsuleId)).toBe(true);
    expect(sky.gravityFields.every((field) => field.gravityCapsuleId)).toBe(true);
    expect(sky.gravityCapsules.map((capsule) => capsule.button.id).sort()).toEqual([
      'sky-anti-grav-capsule-button',
      'sky-gravity-inversion-room-button',
    ]);
  });

  it('rejects current playable stages that leave any gravity field outside its own linked room', () => {
    const forest = cloneStage();
    forest.gravityFields[0] = {
      ...forest.gravityFields[0],
      gravityCapsuleId: undefined,
    };
    forest.gravityCapsules = forest.gravityCapsules.filter((capsule) => capsule.fieldId !== 'forest-anti-grav-canopy-lift');

    expect(() => validateStageDefinition(forest)).toThrow(
      'Main stages must enclose every authored gravity field in its own linked gravity room: forest-ruins',
    );
  });

  it('accepts authored enclosed gravity rooms with separate side-wall doors and contained content', () => {
    const stage = cloneSkyStage();

    const validated = validateStageDefinition(stage);
    expect(validated.gravityCapsules).toHaveLength(2);
    expect(validated.gravityCapsules[0].button.id).toBe('sky-anti-grav-capsule-button');
    expect(validated.gravityCapsules[1].button.id).toBe('sky-gravity-inversion-room-button');
    expect(validated.gravityCapsules.every((capsule) => capsule.entryDoor.x < capsule.exitDoor.x)).toBe(true);
    expect(validated.gravityCapsules.every((capsule) => capsule.entryDoor.x === capsule.shell.x)).toBe(true);
    expect(
      validated.gravityCapsules.every((capsule) => {
        const field = validated.gravityFields.find((entry) => entry.id === capsule.fieldId);
        return Boolean(
          field &&
            field.x === capsule.shell.x &&
            field.y === capsule.shell.y &&
            field.width === capsule.shell.width &&
            field.height === capsule.shell.height,
        );
      }),
    ).toBe(true);
    expect(validated.gravityCapsules[0].contents.platformIds).toContain('platform-9010-480');
    expect(validated.gravityCapsules[0].contents.enemyIds).toContain('sky-room-walker-1');
    expect(validated.gravityCapsules[1].contents.enemyIds).toContain('sky-room-walker-2');
    expect(validated.gravityCapsules[1].contents.platformIds).toContain('platform-9490-540');
  });

  it('accepts gravity rooms with authored interior enemies when they stay contained to the room interior', () => {
    const stage = cloneSkyStage();

    stage.enemies.push({
      id: 'sky-room-walker-test',
      kind: 'walker',
      position: { x: 9040, y: 450 },
      patrol: { left: 9010, right: 9180, speed: 96 },
    });
    stage.gravityCapsules[0].contents = {
      ...stage.gravityCapsules[0].contents,
      enemyIds: [...(stage.gravityCapsules[0].contents.enemyIds ?? []), 'sky-room-walker-test'],
    };

    const validated = validateStageDefinition(stage);
    expect(validated.gravityCapsules[0].contents.enemyIds).toContain('sky-room-walker-test');
  });

  it('rejects gravity rooms whose interior enemy envelope can leave through a side-wall door', () => {
    const stage = cloneSkyStage();
    const capsule = stage.gravityCapsules[0];

    stage.enemies.push({
      id: 'sky-room-flyer-escape-test',
      kind: 'flyer',
      position: { x: capsule.shell.x + capsule.shell.width - 70, y: capsule.exitDoor.y + 24 },
      flyer: {
        left: capsule.shell.x + capsule.shell.width - 100,
        right: capsule.shell.x + capsule.shell.width + 84,
        speed: 84,
        bobAmp: 0,
        bobSpeed: 3.2,
      },
    });
    stage.gravityCapsules[0].contents = {
      ...stage.gravityCapsules[0].contents,
      enemyIds: [...(stage.gravityCapsules[0].contents.enemyIds ?? []), 'sky-room-flyer-escape-test'],
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must keep enemies assigned to their authored side of side-wall doors: sky-anti-grav-capsule',
    );
  });

  it('rejects gravity rooms whose exterior enemy envelope can enter through a side-wall door', () => {
    const stage = cloneSkyStage();
    const capsule = stage.gravityCapsules[0];

    stage.enemies.push({
      id: 'sky-room-flyer-intrusion-test',
      kind: 'flyer',
      position: { x: capsule.shell.x - 70, y: capsule.entryDoor.y + 24 },
      flyer: {
        left: capsule.shell.x - 96,
        right: capsule.shell.x + 84,
        speed: 84,
        bobAmp: 0,
        bobSpeed: 3.2,
      },
    });

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must keep enemies assigned to their authored side of side-wall doors: sky-anti-grav-capsule',
    );
  });

  it('accepts current gravity rooms that reuse authored intended route supports without doorway-only helper ledges', () => {
    const forest = validateStageDefinition(cloneStage());
    const amber = validateStageDefinition(cloneAmberStage());
    const sky = validateStageDefinition(cloneSkyStage());

    expect(forest.platforms.some((platform) => platform.id === 'platform-8620-530')).toBe(false);
    expect(forest.platforms.some((platform) => platform.id === 'platform-9384-530')).toBe(false);
    expect(amber.platforms.some((platform) => platform.id === 'platform-9810-570')).toBe(false);
    expect(amber.platforms.some((platform) => platform.id === 'platform-10760-570')).toBe(false);
    expect(sky.platforms.some((platform) => platform.id === 'platform-9110-480')).toBe(false);
    expect(sky.platforms.some((platform) => platform.id === 'platform-9232-480')).toBe(false);
    expect(forest.gravityCapsules[0].doorSupports?.entryApproachPlatformId).toBe('platform-8610-450-moving');
    expect(amber.gravityCapsules[0].doorSupports?.entryApproachPlatformId).toBe('platform-9730-500-falling');
    expect(amber.gravityCapsules[0].doorSupports?.exitReconnectPlatformId).toBe('platform-10830-350');
    expect(sky.gravityCapsules[0].doorSupports?.entryApproachPlatformId).toBe('platform-8740-560');
    expect(sky.gravityCapsules[0].doorSupports?.exitReconnectPlatformId).toBe('platform-9490-540');
  });

  it('accepts the current four gravity rooms only when IN reads left, the button sits mid-room, and OUT reads right', () => {
    const forestFlow = gravityRoomFlowSummary(validateStageDefinition(cloneStage()), 'forest-anti-grav-canopy-room');
    const amberFlow = gravityRoomFlowSummary(validateStageDefinition(cloneAmberStage()), 'amber-inversion-smelter-room');
    const skyAntiGravFlow = gravityRoomFlowSummary(validateStageDefinition(cloneSkyStage()), 'sky-anti-grav-capsule');
    const skyInversionFlow = gravityRoomFlowSummary(validateStageDefinition(cloneSkyStage()), 'sky-gravity-inversion-capsule');

    for (const flow of [forestFlow, amberFlow, skyAntiGravFlow, skyInversionFlow]) {
      expect(flow.entryDoorRatio).toBeLessThanOrEqual(0.35);
      expect(flow.exitDoorRatio).toBeGreaterThanOrEqual(0.65);
      expect(flow.entryDoorOnLeftWall).toBe(true);
      expect(flow.exitDoorOnRightWall).toBe(true);
      expect(flow.bottomEdgeSealed).toBe(true);
      expect(flow.buttonBetweenDoors).toBe(true);
      expect(flow.entryPathReadsLeft).toBe(true);
      expect(flow.exitPathReadsRight).toBe(true);
      expect(flow.distinctExteriorSupport).toBe(true);
      expect(flow.distinctEntryAndExitSupport).toBe(true);
    }
  });

  it('accepts current gravity rooms only when the inverse-jump button route rises above the entry and exit supports', () => {
    const rooms = [
      validateStageDefinition(cloneStage()).gravityCapsules[0],
      validateStageDefinition(cloneAmberStage()).gravityCapsules[0],
      ...validateStageDefinition(cloneSkyStage()).gravityCapsules,
    ];

    for (const capsule of rooms) {
      const entryRise = capsule.entryRoute.y + capsule.entryRoute.height - (capsule.buttonRoute.y + capsule.buttonRoute.height);
      const exitRise = capsule.exitRoute.y + capsule.exitRoute.height - (capsule.buttonRoute.y + capsule.buttonRoute.height);
      const buttonOverlap = Math.max(
        0,
        Math.min(capsule.button.x + capsule.button.width, capsule.buttonRoute.x + capsule.buttonRoute.width) -
          Math.max(capsule.button.x, capsule.buttonRoute.x),
      );

      expect(entryRise).toBeGreaterThanOrEqual(48);
      expect(exitRise).toBeGreaterThanOrEqual(48);
      expect(buttonOverlap).toBeGreaterThanOrEqual(Math.min(capsule.button.width, Math.max(20, Math.floor(capsule.buttonRoute.width * 0.35))));
      expect(capsule.button.y + capsule.button.height).toBeLessThanOrEqual(capsule.buttonRoute.y + capsule.buttonRoute.height + 12);
    }
  });

  it('rejects gravity rooms whose entry door loses its left-side platform-path continuation', () => {
    const stage = cloneSkyStage();
    stage.gravityCapsules[0].doorSupports = {
      ...stage.gravityCapsules[0].doorSupports!,
      entryApproachPath: {
        ...stage.gravityCapsules[0].doorSupports!.entryApproachPath,
        y: stage.gravityCapsules[0].doorSupports!.entryApproachPath.y - 72,
      },
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must author a continuous platform path into each entry door',
    );
  });

  it('rejects gravity rooms whose linked button is not on a reachable interior route', () => {
    const stage = cloneSkyStage();
    stage.gravityCapsules[0].button = {
      ...stage.gravityCapsules[0].button,
      x: stage.gravityCapsules[0].shell.x + stage.gravityCapsules[0].shell.width - 48,
      y: stage.gravityCapsules[0].shell.y + 20,
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must place their linked interior disable button on a reachable authored route: sky-anti-grav-capsule',
    );
  });

  it('rejects gravity rooms whose active-field button route drops back to entry-floor readability', () => {
    const stage = cloneSkyStage();
    stage.gravityCapsules[0].button = {
      ...stage.gravityCapsules[0].button,
      x: 9056,
      y: 448,
    };
    stage.gravityCapsules[0].buttonRoute = {
      ...stage.gravityCapsules[0].buttonRoute,
      x: 9022,
      y: 456,
      width: 92,
      height: 24,
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must keep the active-field inverse-jump route to their interior disable button readable and reachable: sky-anti-grav-capsule',
    );
  });

  it('rejects gravity rooms whose contained interior enemies block the only button lane', () => {
    const stage = cloneSkyStage();

    stage.enemies.push({
      id: 'sky-room-button-lane-blocker',
      kind: 'turret',
      position: { x: 9150, y: 262 },
      turret: { intervalMs: 1400 },
    });
    stage.gravityCapsules[0].contents = {
      ...stage.gravityCapsules[0].contents,
      enemyIds: [...(stage.gravityCapsules[0].contents.enemyIds ?? []), 'sky-room-button-lane-blocker'],
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must keep contained interior enemies from blocking the only button lane: sky-anti-grav-capsule',
    );
  });

  it('rejects gravity rooms that reuse one side-wall opening for both entry and exit', () => {
    const stage = cloneSkyStage();
    stage.gravityCapsules[0].exitDoor = { ...stage.gravityCapsules[0].entryDoor };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must author separate side-wall entry and exit openings while keeping the full bottom edge sealed: sky-anti-grav-capsule',
    );
  });

  it('rejects gravity rooms whose door openings consume the shell edge instead of leaving blocking wall segments', () => {
    const stage = cloneSkyStage();
    stage.gravityCapsules[0].entryDoor = {
      ...stage.gravityCapsules[0].entryDoor,
      y: stage.gravityCapsules[0].shell.y,
      height: stage.gravityCapsules[0].shell.height,
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must author separate side-wall entry and exit openings while keeping the full bottom edge sealed: sky-anti-grav-capsule',
    );
  });

  it('rejects gravity rooms that leave a bottom-edge doorway remnant', () => {
    const stage = cloneSkyStage();
    stage.gravityCapsules[0].entryDoor = {
      ...stage.gravityCapsules[0].entryDoor,
      x: stage.gravityCapsules[0].shell.x + 72,
      y: stage.gravityCapsules[0].shell.y + stage.gravityCapsules[0].shell.height - 46,
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must author separate side-wall entry and exit openings while keeping the full bottom edge sealed: sky-anti-grav-capsule',
    );
  });

  it('rejects gravity rooms whose linked content escapes the authored shell', () => {
    const stage = cloneSkyStage();
    stage.gravityCapsules[0].contents = {
      ...stage.gravityCapsules[0].contents,
      collectibleIds: ['sky-10b', 'sky-19c'],
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must keep all linked room content inside the authored shell: sky-anti-grav-capsule',
    );
  });

  it('rejects gravity rooms whose traversal content path intrudes through sealed shell bands', () => {
    const stage = cloneSkyStage();
    const capsule = stage.gravityCapsules[0];

    stage.enemies.push({
      id: 'sky-shell-band-trespass',
      kind: 'flyer',
      position: { x: capsule.shell.x - 36, y: capsule.shell.y + 132 },
      flyer: {
        left: capsule.shell.x - 64,
        right: capsule.shell.x + 36,
        speed: 84,
        bobAmp: 12,
        bobSpeed: 3.2,
      },
    });

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must keep authored traversal content from intruding through sealed shell bands outside door openings: sky-anti-grav-capsule',
    );
  });

  it('rejects gravity rooms whose exit door loses its exterior-side reconnect after crossing out of the room', () => {
    const stage = cloneSkyStage();
    stage.gravityCapsules[0].doorSupports = {
      ...stage.gravityCapsules[0].doorSupports!,
      exitReconnectPath: {
        ...stage.gravityCapsules[0].doorSupports!.exitReconnectPath,
        x: stage.gravityCapsules[0].doorSupports!.exitReconnectPath.x + 148,
      },
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Current playable gravity rooms must reuse authored intended route supports for entry and exit doors: sky-anti-grav-capsule',
    );
  });

  it('rejects current playable gravity rooms when a helper platform replaces the authored intended door support', () => {
    const stage = cloneAmberStage();
    stage.platforms = stage.platforms.filter((platform) => platform.id !== 'platform-9730-500-falling');
    stage.gravityCapsules[0].doorSupports = {
      ...stage.gravityCapsules[0].doorSupports!,
      entryApproachPlatformId: 'amber-door-helper',
      routePlatformIds: stage.gravityCapsules[0].doorSupports!.routePlatformIds.map((platformId) =>
        platformId === 'platform-9730-500-falling' ? 'amber-door-helper' : platformId,
      ),
    };
    stage.platforms.push({ id: 'amber-door-helper', kind: 'static', x: 9900, y: 570, width: 60, height: 32 });

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must keep authored traversal content from intruding through sealed shell bands outside door openings: amber-inversion-smelter-room',
    );
  });

  it('rejects door moves that are not coordinated with the affected route rectangle', () => {
    const stage = cloneSkyStage();
    stage.gravityCapsules[1].doorSupports = {
      ...stage.gravityCapsules[1].doorSupports!,
      exitReconnectPath: {
        ...stage.gravityCapsules[1].doorSupports!.exitReconnectPath,
        x: stage.gravityCapsules[1].doorSupports!.exitReconnectPath.x + 120,
      },
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Current playable gravity rooms must reuse authored intended route supports for entry and exit doors: sky-gravity-inversion-capsule',
    );
  });

  it('rejects current gravity rooms that technically validate but still keep the old surrogate IN/OUT read', () => {
    const stage = cloneSkyStage();
    stage.gravityFields[0] = {
      ...stage.gravityFields[0],
      x: 8928,
      y: 108,
      width: 304,
      height: 396,
    };
    stage.gravityCapsules[0] = {
      ...stage.gravityCapsules[0],
      shell: { x: 8928, y: 108, width: 304, height: 396 },
      entryDoor: { x: 9004, y: 458, width: 42, height: 46 },
      exitDoor: { x: 9140, y: 458, width: 42, height: 46 },
      entryRoute: { x: 9022, y: 456, width: 84, height: 24 },
      exitRoute: { x: 9098, y: 456, width: 82, height: 24 },
      contents: {
        platformIds: ['platform-9010-480', 'platform-9040-300'],
      },
      doorSupports: {
        entryApproachPlatformId: 'platform-9010-480',
        entryApproachPath: { x: 9016, y: 456, width: 40, height: 24 },
        exitInteriorPlatformId: 'platform-9010-480',
        exitReconnectPlatformId: 'platform-9010-480',
        exitReconnectPath: { x: 9186, y: 456, width: 40, height: 24 },
        routePlatformIds: ['platform-9010-480', 'platform-9040-300', 'platform-9270-420-moving'],
      },
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must author separate side-wall entry and exit openings while keeping the full bottom edge sealed: sky-anti-grav-capsule',
    );
  });

  it('accepts gravity rooms whose doorway path is provided by a moving platform', () => {
    const stage = cloneStage();
    const entrySupport = stage.platforms.find((platform) => platform.id === 'platform-8610-450-moving');
    if (!entrySupport) {
      throw new Error('Expected forest gravity-room moving entry path fixture.');
    }

    entrySupport.kind = 'moving';
    entrySupport.move = { axis: 'x', range: 60, speed: 86 };

    const validated = validateStageDefinition(stage);
    expect(validated.gravityCapsules[0].id).toBe('forest-anti-grav-canopy-room');
  });

  it('rejects current playable gravity rooms that use an above-room surrogate entry path', () => {
    const stage = cloneSkyStage();
    stage.gravityCapsules[0].doorSupports = {
      ...stage.gravityCapsules[0].doorSupports!,
      entryApproachPath: { x: stage.gravityCapsules[0].shell.x - 28, y: stage.gravityCapsules[0].shell.y - 40, width: 28, height: 24 },
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Current playable gravity rooms must reuse authored intended route supports for entry and exit doors: sky-anti-grav-capsule',
    );
  });

  it('rejects current playable gravity rooms that keep pickups or other mixed mechanics inside the shell', () => {
    const stage = cloneSkyStage();
    stage.collectibles.push({
      id: 'sky-room-sample-test',
      position: {
        x: stage.gravityCapsules[0].shell.x + 84,
        y: stage.gravityCapsules[0].shell.y + 118,
      },
    });

    expect(() => validateStageDefinition(stage)).toThrow(
      'Current playable gravity rooms must stay focused on contained gravity traversal and button-off exit flow without extra mixed mechanics: sky-anti-grav-capsule',
    );
  });

  it('rejects gravity rooms whose entry-to-exit route geometry is cut off inside the shell', () => {
    const stage = cloneSkyStage();
    stage.gravityCapsules[0].buttonRoute = {
      ...stage.gravityCapsules[0].buttonRoute,
      y: stage.gravityCapsules[0].buttonRoute.y - 88,
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Gravity rooms must keep the active-field inverse-jump route to their interior disable button readable and reachable: sky-anti-grav-capsule',
    );
  });

  it('rejects overlapping gravity fields and nearby checkpoint placement', () => {
    const stage = cloneSkyStage();
    const [antiGravStream, inversionColumn] = stage.gravityFields;
    stage.id = 'sky-overlap-test';
    stage.gravityCapsules = [];

    stage.gravityFields = [
      { ...antiGravStream, gravityCapsuleId: undefined },
      { ...inversionColumn, x: antiGravStream.x + 80, y: antiGravStream.y + 40, gravityCapsuleId: undefined },
    ];

    expect(() => validateStageDefinition(stage)).toThrow('Gravity fields cannot overlap another gravity modifier zone');

    stage.gravityFields = [
      { ...antiGravStream, gravityCapsuleId: undefined },
      { ...inversionColumn, gravityCapsuleId: undefined },
    ];
    stage.checkpoints[0] = {
      ...stage.checkpoints[0],
      rect: { x: antiGravStream.x + 24, y: antiGravStream.y + antiGravStream.height - 80, width: 24, height: 80 },
    };

    expect(() => validateStageDefinition(stage)).toThrow('Checkpoints must stay outside immediate gravity-field motion');
  });

  it('accepts checkpoints that stand on visible stable authored support', () => {
    const stage = cloneStage();

    expect(validateStageDefinition(stage).checkpoints.map((checkpoint) => checkpoint.id)).toContain('cp-1');
  });

  it('rejects checkpoints that only stand on reveal-platform support', () => {
    const stage = cloneStage();
    stage.stageObjective = undefined;
    stage.platforms = [
      ...stage.platforms.filter(
        (platform) => !(platform.x <= 1420 && platform.x + platform.width >= 1444 && Math.abs(platform.y - 540) <= 4),
      ),
      {
        id: 'checkpoint-reveal-platform',
        kind: 'static',
        x: 1400,
        y: 540,
        width: 72,
        height: 24,
        reveal: { id: 'checkpoint-reveal' },
      },
    ];
    stage.checkpoints = [{ id: 'cp-reveal-only', rect: { x: 1420, y: 460, width: 24, height: 80 } }];

    expect(() => validateStageDefinition(stage)).toThrow('Checkpoints must stand on visible stable route support');
  });

  it('rejects checkpoints that only stand on temporary bridge support', () => {
    const stage = cloneStage();
    stage.stageObjective = undefined;
    stage.scannerVolumes = [
      {
        id: 'scanner-a',
        x: 1200,
        y: 420,
        width: 64,
        height: 64,
        temporaryBridgeIds: ['checkpoint-temp-platform'],
      },
    ];
    stage.platforms = [
      ...stage.platforms.filter(
        (platform) => !(platform.x <= 1420 && platform.x + platform.width >= 1444 && Math.abs(platform.y - 540) <= 4),
      ),
      {
        id: 'checkpoint-temp-platform',
        kind: 'static',
        x: 1400,
        y: 540,
        width: 72,
        height: 24,
        temporaryBridge: { scannerId: 'scanner-a', durationMs: 2200 },
      },
    ];
    stage.checkpoints = [{ id: 'cp-temp-only', rect: { x: 1420, y: 460, width: 24, height: 80 } }];

    expect(() => validateStageDefinition(stage)).toThrow('Checkpoints must stand on visible stable route support');
  });

  it('rejects airborne checkpoints without grounded support', () => {
    const stage = cloneStage();
    stage.checkpoints[0] = {
      ...stage.checkpoints[0],
      rect: { x: 1420, y: 410, width: 24, height: 80 },
    };

    expect(() => validateStageDefinition(stage)).toThrow('Checkpoints must stand on visible stable route support');
  });

  it('rejects checkpoints that only pass by tolerant normalization instead of authored flush support', () => {
    const stage = cloneStage();
    stage.checkpoints[0] = {
      ...stage.checkpoints[0],
      rect: { ...stage.checkpoints[0].rect, y: stage.checkpoints[0].rect.y + 4 },
    };

    expect(() => validateStageDefinition(stage)).toThrow('Checkpoints must stand on visible stable route support');
  });

  it('rejects checkpoints that overlap spring footing instead of stable grounded support', () => {
    const stage = cloneStage();
    stage.collectibles = [];
    stage.rewardBlocks = [];
    stage.platforms = stage.platforms.map((platform) =>
      platform.id === 'platform-510-575'
        ? { ...platform, kind: 'spring', spring: { boost: 860, cooldownMs: 350 }, surfaceMechanic: undefined }
        : platform,
    );
    stage.checkpoints[0] = {
      ...stage.checkpoints[0],
      rect: { x: 558, y: 495, width: 24, height: 80 },
    };

    expect(() => validateStageDefinition(stage)).toThrow('Checkpoints must stand on visible stable route support');
  });

  it('rejects reward blocks that only clear nearby support after hidden snap fallback', () => {
    const stage = cloneStage();
    stage.rewardBlocks[0] = {
      ...stage.rewardBlocks[0],
      y: stage.rewardBlocks[0].y + 8,
    };

    expect(() => validateStageDefinition(stage)).toThrow(
      'Reward blocks must keep authored visible-ground clearance without support snap',
    );
  });

  it('rejects checkpoints authored beyond the terminal exit', () => {
    const stage = cloneSkyStage();
    stage.platforms.push({
      id: 'post-exit-support',
      kind: 'static',
      x: stage.exit.x + stage.exit.width + 8,
      y: stage.exit.y + 60,
      width: 72,
      height: 24,
    });

    stage.checkpoints[stage.checkpoints.length - 1] = {
      ...stage.checkpoints[stage.checkpoints.length - 1],
      rect: { x: stage.exit.x + stage.exit.width + 8, y: stage.exit.y - 20, width: 24, height: 80 },
    };

    expect(() => validateStageDefinition(stage)).toThrow('Checkpoints must stay before the terminal exit');
  });
});

describe('empty-platform variety validation', () => {
  it('accepts shipped empty-platform traversal challenge metadata with mixed mechanic families', () => {
    const stages = [validateStageDefinition(cloneStage()), validateStageDefinition(cloneAmberStage()), validateStageDefinition(cloneSkyStage())];

    for (const stage of stages) {
      const qualifyingRuns = qualifyingEmptyPlatformRuns(stage);
      expect(qualifyingRuns.length).toBeGreaterThanOrEqual(3);
      expect(new Set(qualifyingRuns.map((run) => run.progressionSegment))).toEqual(new Set(['early', 'middle', 'late']));
      expect(qualifyingRuns.every((run) => new Set(run.mechanicFamilies.filter((family) => family !== 'jumpTiming')).size >= 2)).toBe(true);
      expect(qualifyingRuns.every((run) => run.platformIds.every((platformId) => stage.platforms.some((platform) => platform.id === platformId)))).toBe(true);
    }
  });

  it('rejects jump-only empty-platform traversal challenge runs', () => {
    const stage = cloneStage();
    stage.emptyPlatformRuns = [
      {
        id: 'forest-jump-only-fixture',
        traversalChallenge: true,
        progressionSegment: 'early',
        platformIds: ['platform-510-575'],
        mechanicFamilies: ['jumpTiming'],
      },
      {
        id: 'forest-middle-fixture',
        traversalChallenge: true,
        progressionSegment: 'middle',
        platformIds: ['platform-5300-470'],
        mechanicFamilies: ['moving', 'springTraversal'],
      },
      {
        id: 'forest-late-fixture',
        traversalChallenge: true,
        progressionSegment: 'late',
        platformIds: ['platform-7200-400-spring'],
        mechanicFamilies: ['moving', 'springTraversal'],
      },
    ];

    expect(() => validateStageDefinition(stage)).toThrow('Empty-platform traversal challenge cannot be jump-only');
  });

  it('rejects traversal challenge runs that provide only one supported mechanic family', () => {
    const stage = cloneAmberStage();
    stage.emptyPlatformRuns = [
      {
        id: 'amber-early-fixture',
        traversalChallenge: true,
        progressionSegment: 'early',
        platformIds: ['platform-1590-470-moving'],
        mechanicFamilies: ['moving', 'springTraversal'],
      },
      {
        id: 'amber-middle-fixture',
        traversalChallenge: true,
        progressionSegment: 'middle',
        platformIds: ['platform-4350-390-falling'],
        mechanicFamilies: ['unstableOrCollapsing'],
      },
      {
        id: 'amber-late-fixture',
        traversalChallenge: true,
        progressionSegment: 'late',
        platformIds: ['platform-7170-530-spring'],
        mechanicFamilies: ['springTraversal', 'brittle'],
      },
    ];

    expect(() => validateStageDefinition(stage)).toThrow('Empty-platform traversal challenge must include at least two supported mechanic families');
  });

  it('rejects stage progression metadata that misses a required early/middle/late segment', () => {
    const stage = cloneSkyStage();
    stage.emptyPlatformRuns = [
      {
        id: 'sky-early-fixture',
        traversalChallenge: true,
        progressionSegment: 'early',
        platformIds: ['platform-1750-350-moving'],
        mechanicFamilies: ['moving', 'boundedGravityFieldTraversal'],
      },
      {
        id: 'sky-late-fixture',
        traversalChallenge: true,
        progressionSegment: 'late',
        platformIds: ['platform-6590-470'],
        mechanicFamilies: ['springTraversal', 'scannerSwitchTemporaryBridge'],
      },
    ];

    expect(() => validateStageDefinition(stage)).toThrow(
      'Empty-platform traversal challenge distribution must cover early, middle, and late segments',
    );
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
    walkerVariant.position.y += 8;
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
