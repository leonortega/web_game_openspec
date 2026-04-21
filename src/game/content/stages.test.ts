import { describe, expect, it } from 'vitest';

import {
  ACTIVE_SUSTAINED_MUSIC_MANIFEST,
  BACKUP_SUSTAINED_MUSIC_MANIFEST,
  MENU_SUSTAINED_MUSIC,
  getStageSustainedMusic,
} from '../../audio/musicAssets';
import { stageDefinitions, validateStageDefinition, type StageDefinition } from './stages';

const terrainVariantPlatforms = (stage: StageDefinition, kind: 'brittleCrystal' | 'stickySludge') =>
  stage.platforms.filter((platform) => platform.terrainVariant === kind);

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

describe('launcher stage validation', () => {
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

describe('enemy placement validation', () => {
  it('accepts current grounded non-flying enemy placement across the authored stage', () => {
    const stage = cloneStage();

    expect(validateStageDefinition(stage).enemies).toEqual(stage.enemies);
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
});

describe('stage audio composition validation', () => {
  it('maps the current menu and playable stages to the approved CC0 sustained tracks', () => {
    expect(MENU_SUSTAINED_MUSIC.title).toBe('Another space background track');
    expect(getStageSustainedMusic('forest-ruins')?.title).toBe('Magic Space');
    expect(getStageSustainedMusic('amber-cavern')?.title).toBe('I swear I saw it - background track');
    expect(getStageSustainedMusic('sky-sanctum')?.title).toBe('Party Sector');
    expect(ACTIVE_SUSTAINED_MUSIC_MANIFEST.every((entry) => entry.license === 'CC0')).toBe(true);
    expect(BACKUP_SUSTAINED_MUSIC_MANIFEST.map((entry) => entry.title)).toEqual([
      'Galactic Temple',
      'Space Music: Out There',
      'Tragic ambient main menu',
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
  it('requires every main stage to author at least two brittle and two sticky terrain sections across multiple beats plus one gravity section', () => {
    const forest = cloneStage();
    const amber = cloneAmberStage();
    const sky = cloneSkyStage();

    expect(terrainVariantPlatforms(validateStageDefinition(forest), 'brittleCrystal').length).toBeGreaterThanOrEqual(2);
    expect(terrainVariantPlatforms(validateStageDefinition(forest), 'stickySludge').length).toBeGreaterThanOrEqual(2);
    expect(terrainBeatSummary(validateStageDefinition(forest), 'brittleCrystal').size).toBeGreaterThanOrEqual(2);
    expect(terrainBeatSummary(validateStageDefinition(forest), 'stickySludge').size).toBeGreaterThanOrEqual(2);
    expect(validateStageDefinition(forest).gravityFields.length).toBeGreaterThan(0);
    expect(terrainVariantPlatforms(validateStageDefinition(amber), 'brittleCrystal').length).toBeGreaterThanOrEqual(2);
    expect(terrainVariantPlatforms(validateStageDefinition(amber), 'stickySludge').length).toBeGreaterThanOrEqual(2);
    expect(terrainBeatSummary(validateStageDefinition(amber), 'brittleCrystal').size).toBeGreaterThanOrEqual(2);
    expect(terrainBeatSummary(validateStageDefinition(amber), 'stickySludge').size).toBeGreaterThanOrEqual(2);
    expect(validateStageDefinition(amber).gravityFields.length).toBeGreaterThan(0);
    expect(terrainVariantPlatforms(validateStageDefinition(sky), 'brittleCrystal').length).toBeGreaterThanOrEqual(2);
    expect(terrainVariantPlatforms(validateStageDefinition(sky), 'stickySludge').length).toBeGreaterThanOrEqual(2);
    expect(terrainBeatSummary(validateStageDefinition(sky), 'brittleCrystal').size).toBeGreaterThanOrEqual(2);
    expect(terrainBeatSummary(validateStageDefinition(sky), 'stickySludge').size).toBeGreaterThanOrEqual(2);
    expect(validateStageDefinition(sky).gravityFields.length).toBeGreaterThan(0);

    forest.platforms = forest.platforms.map((platform) =>
      platform.terrainVariant === 'stickySludge' ? { ...platform, terrainVariant: undefined } : platform,
    );
    expect(() => validateStageDefinition(forest)).toThrow(
      'Main stages must author at least 2 brittle crystal and sticky sludge surfaces: forest-ruins',
    );

    const clusteredAmber = cloneAmberStage();
    clusteredAmber.platforms = clusteredAmber.platforms.map((platform) => {
      if (platform.id === 'platform-8160-520') {
        return { ...platform, terrainVariant: undefined };
      }

      if (platform.id === 'platform-11090-420') {
        return { ...platform, terrainVariant: undefined };
      }

      if (platform.id === 'platform-10290-500' || platform.id === 'platform-10550-430') {
        return { ...platform, terrainVariant: 'stickySludge' };
      }

      return platform;
    });
    expect(() => validateStageDefinition(clusteredAmber)).toThrow(
      'Main stages must spread brittle crystal and sticky sludge across at least two traversal beats: amber-cavern',
    );

    amber.gravityFields = [];
    amber.gravityCapsules = [];
    expect(() => validateStageDefinition(amber)).toThrow(
      'Main stages must author at least one bounded gravity-field section: amber-cavern',
    );
  });

  it('rejects legacy brittle and sticky terrain overlays and non-static platform variant usage', () => {
    const legacyOverlayStage = cloneStage();
    legacyOverlayStage.platforms = legacyOverlayStage.platforms.map((platform) => ({ ...platform, terrainVariant: undefined }));
    legacyOverlayStage.terrainSurfaces = [
      { id: 'legacy-sticky', kind: 'stickySludge', x: 8350, y: 520, width: 132, height: 12 },
    ];

    expect(() => validateStageDefinition(legacyOverlayStage)).toThrow(
      'Brittle crystal and sticky sludge must be authored on platform terrainVariant instead of terrain surfaces',
    );

    const mixedAuthoringStage = cloneStage();
    mixedAuthoringStage.terrainSurfaces = [
      { id: 'legacy-brittle', kind: 'brittleCrystal', x: 8480, y: 340, width: 110, height: 12 },
    ];

    expect(() => validateStageDefinition(mixedAuthoringStage)).toThrow(
      'Brittle crystal and sticky sludge cannot mix platform terrain variants with legacy terrain surfaces',
    );

    const movingVariantStage = cloneStage();
    movingVariantStage.platforms = movingVariantStage.platforms.map((platform) =>
      platform.kind === 'moving' ? { ...platform, terrainVariant: 'stickySludge' } : platform,
    );

    expect(() => validateStageDefinition(movingVariantStage)).toThrow(
      'Brittle crystal and sticky sludge variants must stay on plain static platforms',
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
    expect(validated.gravityCapsules[0].contents.platformIds).toContain('platform-9010-480');
    expect(validated.gravityCapsules[1].contents.platformIds).toContain('platform-9490-540');
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
      'Gravity rooms must contain readable traversable route geometry from entry to exit: sky-anti-grav-capsule',
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

  it('rejects checkpoints authored beyond the terminal exit', () => {
    const stage = cloneSkyStage();

    stage.checkpoints[stage.checkpoints.length - 1] = {
      ...stage.checkpoints[stage.checkpoints.length - 1],
      rect: { x: stage.exit.x + stage.exit.width + 8, y: stage.exit.y - 20, width: 24, height: 80 },
    };

    expect(() => validateStageDefinition(stage)).toThrow('Checkpoints must stay before the terminal exit');
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