import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  Math: {
    Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
  },
}));

import {
  ENEMY_DEFEAT_VISIBLE_HOLD_MS,
  PLAYER_DEFEAT_VISIBLE_HOLD_MS,
  RETRO_DEFEAT_PRESENTATION_MAX_MS,
  createRetroBackdropMotifPalette,
  createRetroMenuPalette,
  createRetroPresentationPalette,
  detectRetroFeedbackEvents,
  getRetroDefeatTweenPreset,
  getRetroParticlePreset,
  getRetroEnemyPose,
  getRetroPlayerPose,
  resetRetroPresentationTargets,
  spawnRetroParticleBurst,
} from './retroPresentation';

const toLuminance = (color: number): number => {
  const channels = [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (left: number, right: number): number => {
  const lighter = Math.max(toLuminance(left), toLuminance(right));
  const darker = Math.min(toLuminance(left), toLuminance(right));
  return (lighter + 0.05) / (darker + 0.05);
};

describe('createRetroPresentationPalette', () => {
  it('derives backdrop colors from authored stage inputs without reusing route-facing fills', () => {
    const stagePalette = {
      skyTop: 0x2b5f86,
      skyBottom: 0x09111f,
      accent: 0x9ee8ff,
      ground: 0x7daccb,
    };

    const retro = createRetroPresentationPalette(stagePalette);
    const backdropColors = [
      retro.background,
      retro.skyline,
      retro.groundBand,
      retro.backdropColumn,
      retro.backdropAccent,
      retro.backdropGlow,
    ];

    expect(retro.stageAccent).toBe(stagePalette.accent);
    expect(retro.groundBand).not.toBe(stagePalette.ground);
    expect(backdropColors).not.toContain(retro.panelAlt);
    expect(backdropColors).not.toContain(retro.panel);
    expect(new Set(backdropColors).size).toBe(backdropColors.length);
  });

  it('responds to authored palette changes while keeping overlay text reserved from the backdrop', () => {
    const verdant = createRetroPresentationPalette({
      skyTop: 0x1f544c,
      skyBottom: 0x091816,
      accent: 0x9cf6d3,
      ground: 0x447a68,
    });
    const ember = createRetroPresentationPalette({
      skyTop: 0x5a311e,
      skyBottom: 0x180c08,
      accent: 0xffb768,
      ground: 0x8a5c33,
    });

    expect([
      verdant.background,
      verdant.skyline,
      verdant.groundBand,
      verdant.backdropColumn,
      verdant.backdropAccent,
    ]).not.toEqual([
      ember.background,
      ember.skyline,
      ember.groundBand,
      ember.backdropColumn,
      ember.backdropAccent,
    ]);

    const textColors = [Number.parseInt(verdant.text.slice(1), 16), Number.parseInt(verdant.dimText.slice(1), 16)];
    const backdropColors = [
      verdant.background,
      verdant.skyline,
      verdant.groundBand,
      verdant.backdropColumn,
      verdant.backdropAccent,
      verdant.backdropGlow,
    ];

    for (const textColor of textColors) {
      expect(backdropColors).not.toContain(textColor);
    }
  });

  it('keeps overlay text colors readable against the core backdrop lanes', () => {
    const retro = createRetroPresentationPalette({
      skyTop: 0x2b5f86,
      skyBottom: 0x09111f,
      accent: 0x9ee8ff,
      ground: 0x7daccb,
    });

    const textColor = Number.parseInt(retro.text.slice(1), 16);
    const dimTextColor = Number.parseInt(retro.dimText.slice(1), 16);
    const coreBackdropLanes = [retro.background, retro.skyline, retro.groundBand];

    for (const backdropColor of coreBackdropLanes) {
      expect(contrastRatio(textColor, backdropColor)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(dimTextColor, backdropColor)).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps menu fallback palettes separated when no authored sky or ground colors are provided', () => {
    const retro = createRetroMenuPalette();

    expect(retro.stageAccent).toBe(0xe05b3d);
    expect(retro.background).not.toBe(retro.panelAlt);
    expect(retro.skyline).not.toBe(retro.groundBand);
    expect(retro.backdropColumn).not.toBe(retro.backdropAccent);
  });

  it('keeps route-facing and hazard-facing colors separated from backdrop lanes', () => {
    const retro = createRetroPresentationPalette({
      skyTop: 0x2b5f86,
      skyBottom: 0x09111f,
      accent: 0x9ee8ff,
      ground: 0x7daccb,
    });

    const backdropColors = [
      retro.background,
      retro.skyline,
      retro.groundBand,
      retro.backdropColumn,
      retro.backdropAccent,
      retro.backdropGlow,
    ];

    expect(backdropColors).not.toContain(retro.cool);
    expect(backdropColors).not.toContain(retro.warm);
    expect(backdropColors).not.toContain(retro.alert);
    expect(backdropColors).not.toContain(retro.safe);
    expect(backdropColors).not.toContain(retro.border);
  });

  it('derives extraterrestrial motif colors that stay secondary to route-facing colors', () => {
    const retro = createRetroPresentationPalette({
      skyTop: 0x2b5f86,
      skyBottom: 0x09111f,
      accent: 0x9ee8ff,
      ground: 0x7daccb,
    });

    const motif = createRetroBackdropMotifPalette(retro);
    const motifColors = Object.values(motif);
    const reservedForegroundColors = [retro.cool, retro.warm, retro.safe, retro.alert, retro.border, retro.panel, retro.panelAlt];
    const textColor = Number.parseInt(retro.text.slice(1), 16);
    const backgroundTextContrast = contrastRatio(textColor, retro.background);

    expect(new Set(motifColors).size).toBe(motifColors.length);
    for (const color of motifColors) {
      expect(reservedForegroundColors).not.toContain(color);
      expect(contrastRatio(textColor, color)).toBeGreaterThanOrEqual(1.1);
      expect(contrastRatio(textColor, color)).toBeLessThanOrEqual(backgroundTextContrast);
    }
  });

  it('selects bounded retro player poses for grounded movement, jumps, and dashes', () => {
    expect(getRetroPlayerPose({ timeMs: 0, velocityX: 0, velocityY: 0, onGround: true, dashTimerMs: 0 }).state).toBe('idle');
    expect(getRetroPlayerPose({ timeMs: 120, velocityX: 120, velocityY: 0, onGround: true, dashTimerMs: 0 }).state).toBe('run-b');
    expect(getRetroPlayerPose({ timeMs: 0, velocityX: 0, velocityY: -240, onGround: false, dashTimerMs: 0 }).state).toBe('jump');
    expect(getRetroPlayerPose({ timeMs: 0, velocityX: 0, velocityY: 180, onGround: false, dashTimerMs: 0 }).state).toBe('fall');
    expect(getRetroPlayerPose({ timeMs: 0, velocityX: 240, velocityY: 0, onGround: true, dashTimerMs: 60 }).state).toBe('dash');
  });

  it('keeps enemy motion tied to existing deterministic state windows', () => {
    expect(
      getRetroEnemyPose(
        {
          kind: 'turret',
          vx: 0,
          vy: 0,
          x: 420,
          turret: { intervalMs: 0, timerMs: 0, telegraphMs: 120, telegraphDurationMs: 240, burstGapMs: 0, burstGapDurationMs: 0, pendingShots: 0 },
        },
        0,
      ).state,
    ).toBe('telegraph');
    expect(
      getRetroEnemyPose(
        {
          kind: 'charger',
          vx: 0,
          vy: 0,
          x: 420,
          charger: { left: 0, right: 0, patrolSpeed: 0, chargeSpeed: 0, windupMs: 0, cooldownMs: 0, timerMs: 0, state: 'windup' },
        },
        0,
      ).state,
    ).toBe('windup');
    const flyerPose = getRetroEnemyPose(
      {
        kind: 'flyer',
        vx: 0,
        vy: 0,
        x: 420,
        flyer: { left: 0, right: 0, speed: 0, bobAmp: 0, bobSpeed: 0, bobPhase: 0, originY: 0 },
      },
      140,
    );
    expect(flyerPose.state).toBe('hover');
    expect(flyerPose.accentOffsetY).toBeGreaterThan(0);
    expect(flyerPose.accentAlpha).toBeGreaterThan(0.7);
    expect(
      getRetroEnemyPose(
        {
          kind: 'walker',
          vx: 96,
          vy: 0,
          x: 420,
        },
        0,
      ).state,
    ).toBe('walk-b');
    expect(
      getRetroEnemyPose(
        {
          kind: 'hopper',
          vx: 0,
          vy: 0,
          x: 420,
          hop: {
            intervalMs: 1200,
            timerMs: 140,
            impulse: 860,
            speed: 120,
            targetPlatformId: null,
            targetX: null,
            targetY: null,
          },
        },
        0,
      ).state,
    ).toBe('hop-crouch');
    expect(
      getRetroEnemyPose(
        {
          kind: 'hopper',
          vx: 0,
          vy: -220,
          x: 420,
          hop: {
            intervalMs: 1200,
            timerMs: 800,
            impulse: 860,
            speed: 120,
            targetPlatformId: null,
            targetX: null,
            targetY: null,
          },
        },
        0,
      ).state,
    ).toBe('hop-rise');
  });

  it('emits bounded feedback events only when gameplay state changes', () => {
    const previous = {
      checkpoints: [{ id: 'checkpoint-a', activated: false, x: 100, y: 200, width: 24, height: 80 }],
      collectibles: [{ id: 'coin-a', collected: false, x: 220, y: 180 }],
      rewardReveals: [],
      allCoinsRecovered: false,
      presentationPower: null,
      player: { dead: false, x: 80, y: 120, width: 24, height: 40 },
      enemies: [
        { id: 'enemy-a', alive: true, defeatCause: null, x: 320, y: 160, width: 24, height: 30, kind: 'hopper' as const },
        { id: 'enemy-b', alive: true, defeatCause: null, x: 420, y: 160, width: 24, height: 30, kind: 'walker' as const },
      ],
    };
    const current = {
      checkpoints: [{ id: 'checkpoint-a', activated: true, x: 100, y: 200, width: 24, height: 80 }],
      collectibles: [{ id: 'coin-a', collected: true, x: 220, y: 180 }],
      rewardReveals: [{ id: 'reward-a', kind: 'power' as const, power: 'dash' as const, x: 260, y: 160 }],
      allCoinsRecovered: true,
      presentationPower: 'dash' as const,
      player: { dead: true, x: 80, y: 120, width: 24, height: 40 },
      enemies: [
        {
          id: 'enemy-a',
          alive: false,
          defeatCause: 'stomp' as const,
          x: 320,
          y: 160,
          width: 24,
          height: 30,
          kind: 'hopper' as const,
        },
        {
          id: 'enemy-b',
          alive: false,
          defeatCause: 'plasma-blast' as const,
          x: 420,
          y: 160,
          width: 24,
          height: 30,
          kind: 'walker' as const,
        },
      ],
    };

    expect(detectRetroFeedbackEvents(previous, current)).toEqual([
      { kind: 'checkpoint', id: 'checkpoint-a', x: 112, y: 240 },
      { kind: 'coin', id: 'coin-a', x: 220, y: 180 },
      { kind: 'power', power: 'dash', x: 260, y: 160 },
      { kind: 'heal', x: 220, y: 180 },
      { kind: 'player-defeat', x: 92, y: 140 },
      { kind: 'enemy-defeat', id: 'enemy-a', cause: 'stomp', enemyKind: 'hopper', x: 332, y: 175 },
      { kind: 'enemy-defeat', id: 'enemy-b', cause: 'plasma-blast', enemyKind: 'walker', x: 432, y: 175 },
    ]);

    expect(detectRetroFeedbackEvents(current, current)).toEqual([]);
  });

  it('keeps supported defeat bursts above the gameplay stack while preserving distinct bounded presets', () => {
    const stomp = getRetroParticlePreset('enemy-defeat-stomp');
    const plasma = getRetroParticlePreset('enemy-defeat-plasma');
    const playerDefeat = getRetroParticlePreset('player-defeat');
    const stompTween = getRetroDefeatTweenPreset('stomp');
    const plasmaTween = getRetroDefeatTweenPreset('plasma-blast');
    const playerTween = getRetroDefeatTweenPreset('player-death');

    expect(stomp.depth).toBeGreaterThan(12);
    expect(plasma.depth).toBeGreaterThan(12);
    expect(playerDefeat.depth).toBeGreaterThan(plasma.depth);
    expect(stomp.angle).toEqual([198, 342]);
    expect(plasma.angle).toEqual([0, 360]);
    expect(plasma.count).toBeGreaterThan(stomp.count);
    expect(playerDefeat.count).toBeGreaterThan(plasma.count);
    expect(playerDefeat.lifespan).toBeGreaterThan(plasma.lifespan);
    expect(stomp.alphaStart).toBe(1);
    expect(plasma.alphaStart).toBe(1);
    expect(stomp.cleanupDelayMs).toBeLessThanOrEqual(RETRO_DEFEAT_PRESENTATION_MAX_MS);
    expect(plasma.cleanupDelayMs).toBeLessThanOrEqual(RETRO_DEFEAT_PRESENTATION_MAX_MS);
    expect(playerDefeat.cleanupDelayMs).toBeLessThanOrEqual(RETRO_DEFEAT_PRESENTATION_MAX_MS);
    expect(stompTween.holdMs).toBe(ENEMY_DEFEAT_VISIBLE_HOLD_MS);
    expect(plasmaTween.holdMs).toBe(ENEMY_DEFEAT_VISIBLE_HOLD_MS);
    expect(playerTween.holdMs).toBe(PLAYER_DEFEAT_VISIBLE_HOLD_MS);
    expect(stompTween.tween.scaleY).not.toBe(plasmaTween.tween.scaleY);
    expect(stompTween.tween.scaleY).toBeLessThan(0.3);
    expect(plasmaTween.tween.scaleX).toBeLessThan(0.4);
    expect(playerTween.tween.duration).toBeGreaterThan(plasmaTween.tween.duration as number);
  });

  it('applies the preset depth and bounded lifetime when spawning defeat bursts', () => {
    const emitter = {
      setDepth: vi.fn().mockReturnThis(),
      explode: vi.fn(),
      destroy: vi.fn(),
    };
    const delayedCall = vi.fn();
    const scene = {
      add: {
        particles: vi.fn(() => emitter),
      },
      time: {
        delayedCall,
      },
    } as unknown as Parameters<typeof spawnRetroParticleBurst>[0];

    spawnRetroParticleBurst(scene, 144, 88, 0xf7f3d6, 'enemy-defeat-plasma');

    expect(scene.add.particles).toHaveBeenCalledWith(
      144,
      88,
      'retro-particle-burst',
      expect.objectContaining({
        alpha: { start: 1, end: 0 },
        lifespan: 272,
      }),
    );
    expect(emitter.setDepth).toHaveBeenCalledWith(15);
    expect(emitter.explode).toHaveBeenCalledWith(32, 144, 88);
    expect(delayedCall).toHaveBeenCalledWith(320, expect.any(Function));
  });

  it('resets presentation targets through one bounded cleanup path', () => {
    const firstTarget = {
      setScale: vi.fn().mockReturnThis(),
      setRotation: vi.fn().mockReturnThis(),
      setAngle: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      clearTint: vi.fn().mockReturnThis(),
    };
    const secondTarget = {
      setScale: vi.fn().mockReturnThis(),
      setRotation: vi.fn().mockReturnThis(),
      setAngle: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };
    const scene = {
      tweens: {
        killTweensOf: vi.fn(),
      },
    } as unknown as Parameters<typeof resetRetroPresentationTargets>[0];

    resetRetroPresentationTargets(scene, [
      { target: firstTarget as any, depth: 7, visible: false, alpha: 0.25 },
      { target: secondTarget as any, depth: 5 },
    ]);

    expect(scene.tweens.killTweensOf).toHaveBeenCalledTimes(2);
    expect(firstTarget.setScale).toHaveBeenCalledWith(1, 1);
    expect(firstTarget.setRotation).toHaveBeenCalledWith(0);
    expect(firstTarget.setAngle).toHaveBeenCalledWith(0);
    expect(firstTarget.setAlpha).toHaveBeenCalledWith(0.25);
    expect(firstTarget.setVisible).toHaveBeenCalledWith(false);
    expect(firstTarget.setDepth).toHaveBeenCalledWith(7);
    expect(firstTarget.clearTint).toHaveBeenCalled();
    expect(secondTarget.setVisible).toHaveBeenCalledWith(true);
    expect(secondTarget.setAlpha).toHaveBeenCalledWith(1);
    expect(secondTarget.setDepth).toHaveBeenCalledWith(5);
  });
});