import * as Phaser from 'phaser';
import { TURRET_VARIANT_CONFIG, type EnemyDefeatCause, type EnemyState, type PlatformState, type PowerType } from '../../game/simulation/state';

const ignoreFromUiCamera = (scene: Phaser.Scene, target: Phaser.GameObjects.GameObject): void => {
  const uiCamera = (scene as Phaser.Scene & { uiCamera?: Phaser.Cameras.Scene2D.Camera }).uiCamera;
  uiCamera?.ignore(target);
};

type StagePalette = {
  accent: number;
  skyTop?: number;
  skyBottom?: number;
  ground?: number;
};

type Rgb = {
  r: number;
  g: number;
  b: number;
};

const RETRO_FALLBACK_SKY_TOP = 0x1d2731;
const RETRO_FALLBACK_SKY_BOTTOM = 0x0b0d11;
const RETRO_FALLBACK_GROUND = 0x312c1d;
const RETRO_FOREGROUND_PANEL = 0x11161c;
const RETRO_FOREGROUND_PANEL_ALT = 0x27301c;
const RETRO_TEXT = 0xf7f3d6;

const clampChannel = (value: number): number => Phaser.Math.Clamp(Math.round(value), 0, 255);

const toRgb = (color: number): Rgb => ({
  r: (color >> 16) & 0xff,
  g: (color >> 8) & 0xff,
  b: color & 0xff,
});

const toColor = ({ r, g, b }: Rgb): number => (clampChannel(r) << 16) | (clampChannel(g) << 8) | clampChannel(b);

export const mixColor = (left: number, right: number, amount: number): number => {
  const ratio = Phaser.Math.Clamp(amount, 0, 1);
  const leftRgb = toRgb(left);
  const rightRgb = toRgb(right);

  return toColor({
    r: leftRgb.r + (rightRgb.r - leftRgb.r) * ratio,
    g: leftRgb.g + (rightRgb.g - leftRgb.g) * ratio,
    b: leftRgb.b + (rightRgb.b - leftRgb.b) * ratio,
  });
};

export const RETRO_WORLD_LOCAL_EFFECT_ROUTING = {
  scope: 'world-local',
  usesExistingPostFxPipeline: true,
  hudExcluded: true,
  overlayExcluded: true,
} as const;

const colorDistance = (left: number, right: number): number => {
  const leftRgb = toRgb(left);
  const rightRgb = toRgb(right);

  return Math.abs(leftRgb.r - rightRgb.r) + Math.abs(leftRgb.g - rightRgb.g) + Math.abs(leftRgb.b - rightRgb.b);
};

const ensureSeparated = (
  color: number,
  references: number[],
  target: number,
  minimumDistance: number,
): number => {
  if (references.every((reference) => colorDistance(color, reference) >= minimumDistance)) {
    return color;
  }

  let nextColor = color;
  for (const amount of [0.16, 0.28, 0.4, 0.52, 0.64]) {
    nextColor = mixColor(color, target, amount);
    if (references.every((reference) => colorDistance(nextColor, reference) >= minimumDistance)) {
      return nextColor;
    }
  }

  return nextColor;
};

export type RetroPresentationPalette = {
  background: number;
  skyline: number;
  groundBand: number;
  backdropColumn: number;
  backdropAccent: number;
  backdropGlow: number;
  panel: number;
  panelAlt: number;
  border: number;
  ink: number;
  warm: number;
  cool: number;
  safe: number;
  alert: number;
  muted: number;
  bright: number;
  stageAccent: number;
  text: string;
  dimText: string;
  shadow: string;
};

export type RetroEnemyPaletteRamp = {
  baseTint: number;
  shadowTint: number;
  highlightTint: number;
  stripeTint: number;
  alpha: number;
  stripeAlpha: number;
};

export type RetroHitFlashPresetName = 'player-hit' | 'enemy-hit';

type RetroHitFlashPreset = {
  durationMs: number;
  blend: number;
  auraAlpha: number;
};

export type RetroSurfaceDistortionProfile = {
  kind: 'water-shimmer';
  routing: typeof RETRO_WORLD_LOCAL_EFFECT_ROUTING;
  bandOffsets: number[];
  bandWidths: number[];
  bandAlphas: number[];
  colors: [number, number, number];
};

const RETRO_HIT_FLASH_PRESETS: Record<RetroHitFlashPresetName, RetroHitFlashPreset> = {
  'player-hit': { durationMs: 84, blend: 0.34, auraAlpha: 0.44 },
  'enemy-hit': { durationMs: 72, blend: 0.28, auraAlpha: 0.3 },
};

export type RetroBackdropMotifPalette = {
  planetFill: number;
  planetShade: number;
  ring: number;
  craterLight: number;
  craterDark: number;
  horizonGlow: number;
  starWarm: number;
  starCool: number;
  auroraA: number;
  auroraB: number;
  rockLight: number;
  rockDark: number;
};

export const RETRO_FONT_FAMILY = '"Courier New", monospace';

// Optional analog overlays stay disabled in the required baseline.
export const RETRO_ANALOG_TREATMENT_ENABLED = false;

export const RETRO_MOTION_STEP_MS = 140;
export const RETRO_GRID_STEP = 4;

export const createRetroPresentationPalette = (stagePalette: StagePalette): RetroPresentationPalette => {
  const skyTop = stagePalette.skyTop ?? RETRO_FALLBACK_SKY_TOP;
  const skyBottom = stagePalette.skyBottom ?? RETRO_FALLBACK_SKY_BOTTOM;
  const ground = stagePalette.ground ?? RETRO_FALLBACK_GROUND;

  const background = ensureSeparated(
    mixColor(skyBottom, 0x040506, 0.34),
    [ground, RETRO_FOREGROUND_PANEL_ALT, RETRO_FOREGROUND_PANEL],
    0x040506,
    96,
  );
  const skyline = ensureSeparated(
    mixColor(skyBottom, skyTop, 0.52),
    [background, ground, RETRO_FOREGROUND_PANEL_ALT],
    skyTop,
    78,
  );
  const groundBand = ensureSeparated(
    mixColor(ground, skyBottom, 0.5),
    [skyline, ground, RETRO_FOREGROUND_PANEL_ALT],
    background,
    72,
  );
  const backdropColumn = ensureSeparated(
    mixColor(skyTop, ground, 0.3),
    [groundBand, RETRO_FOREGROUND_PANEL_ALT, RETRO_FOREGROUND_PANEL],
    background,
    72,
  );
  const backdropAccent = ensureSeparated(
    mixColor(stagePalette.accent, skyTop, 0.58),
    [backdropColumn, stagePalette.accent, RETRO_FOREGROUND_PANEL_ALT],
    background,
    68,
  );
  const backdropGlow = ensureSeparated(
    mixColor(skyTop, stagePalette.accent, 0.22),
    [background, RETRO_TEXT],
    skyTop,
    64,
  );

  return {
    background,
    skyline,
    groundBand,
    backdropColumn,
    backdropAccent,
    backdropGlow,
    panel: RETRO_FOREGROUND_PANEL,
    panelAlt: RETRO_FOREGROUND_PANEL_ALT,
    border: 0xf7f3d6,
    ink: 0x080a0d,
    warm: 0xf0b84b,
    cool: 0x79c8d6,
    safe: 0x9fcf54,
    alert: 0xe05b3d,
    muted: 0x5d6655,
    bright: 0xfff7d8,
    stageAccent: stagePalette.accent,
    text: '#f7f3d6',
    dimText: '#aab197',
    shadow: '#080a0d',
  };
};

export const createRetroMenuPalette = (): RetroPresentationPalette =>
  createRetroPresentationPalette({ accent: 0xe05b3d });

export const createRetroBackdropMotifPalette = (palette: RetroPresentationPalette): RetroBackdropMotifPalette => {
  const separationReferences = [palette.cool, palette.warm, palette.safe, palette.alert, palette.border, palette.panel, palette.panelAlt];
  const hueCore = ensureSeparated(mixColor(palette.stageAccent, palette.cool, 0.18), separationReferences, palette.background, 52);
  const hueBright = ensureSeparated(mixColor(hueCore, palette.bright, 0.34), separationReferences, palette.background, 56);
  const hueShadow = ensureSeparated(mixColor(hueCore, palette.ink, 0.42), separationReferences, palette.background, 44);

  return {
    planetFill: ensureSeparated(mixColor(hueCore, hueBright, 0.34), separationReferences, palette.background, 58),
    planetShade: ensureSeparated(mixColor(hueShadow, palette.background, 0.18), separationReferences, palette.background, 52),
    ring: ensureSeparated(mixColor(hueBright, palette.bright, 0.24), separationReferences, palette.background, 56),
    craterLight: ensureSeparated(mixColor(hueCore, palette.bright, 0.18), separationReferences, palette.background, 48),
    craterDark: ensureSeparated(mixColor(hueShadow, palette.ink, 0.18), separationReferences, palette.background, 42),
    horizonGlow: ensureSeparated(mixColor(hueCore, hueBright, 0.18), separationReferences, palette.background, 54),
    starWarm: ensureSeparated(mixColor(hueBright, palette.bright, 0.18), separationReferences, palette.background, 56),
    starCool: ensureSeparated(mixColor(hueCore, hueBright, 0.26), separationReferences, palette.background, 56),
    auroraA: ensureSeparated(mixColor(hueCore, palette.bright, 0.12), separationReferences, palette.background, 52),
    auroraB: ensureSeparated(mixColor(hueCore, hueShadow, 0.24), separationReferences, palette.background, 50),
    rockLight: ensureSeparated(mixColor(hueCore, palette.bright, 0.14), separationReferences, palette.background, 54),
    rockDark: ensureSeparated(mixColor(hueShadow, palette.ink, 0.2), separationReferences, palette.background, 48),
  };
};

export const getRetroMotionStep = (
  timeMs: number,
  frameMs = RETRO_MOTION_STEP_MS,
  frameCount = 2,
): number => {
  if (frameCount <= 1) {
    return 0;
  }

  return Math.floor(timeMs / Math.max(frameMs, 1)) % frameCount;
};

export const snapRetroValue = (value: number, step = RETRO_GRID_STEP): number => {
  if (step <= 1) {
    return value;
  }

  return Math.round(value / step) * step;
};

export const getRetroEnemyPaletteRamp = (
  enemy: Pick<EnemyState, 'kind' | 'variant' | 'turret'>,
  palette: Pick<RetroPresentationPalette, 'bright' | 'warm' | 'cool' | 'ink'>,
): RetroEnemyPaletteRamp | null => {
  if (enemy.kind !== 'turret' || !enemy.variant) {
    return null;
  }

  const variant = TURRET_VARIANT_CONFIG[enemy.variant];
  const telegraphActive = Boolean(enemy.turret?.telegraphMs);
  const baseTint = telegraphActive ? variant.telegraphColor : variant.baseColor;

  return {
    baseTint,
    shadowTint: mixColor(baseTint, palette.ink, 0.44),
    highlightTint: mixColor(baseTint, palette.bright, telegraphActive ? 0.38 : 0.24),
    stripeTint: enemy.variant === 'ionPulse' ? mixColor(baseTint, palette.cool, 0.34) : mixColor(baseTint, palette.warm, 0.28),
    alpha: telegraphActive ? 0.98 : 0.92,
    stripeAlpha: telegraphActive ? 0.8 : 0.62,
  };
};

export const getRetroHitFlashPreset = (preset: RetroHitFlashPresetName): RetroHitFlashPreset =>
  RETRO_HIT_FLASH_PRESETS[preset];

export const getRetroHitFlashBlend = (
  timeMs: number,
  untilMs: number,
  preset: RetroHitFlashPresetName,
): number => {
  if (!Number.isFinite(untilMs) || timeMs >= untilMs) {
    return 0;
  }

  const config = RETRO_HIT_FLASH_PRESETS[preset];
  return Phaser.Math.Clamp((untilMs - timeMs) / config.durationMs, 0, 1) * config.blend;
};

export const getRetroSurfaceDistortionProfile = (
  platform: Pick<PlatformState, 'kind' | 'width'>,
  palette: Pick<RetroPresentationPalette, 'warm' | 'alert' | 'bright'>,
  timeMs: number,
  anchorX: number,
): RetroSurfaceDistortionProfile | null => {
  if (platform.kind !== 'magnet') {
    return null;
  }

  const motionSeed = (timeMs + anchorX) / 140;
  const widthFactor = Math.max(platform.width, 1);
  return {
    kind: 'water-shimmer',
    routing: RETRO_WORLD_LOCAL_EFFECT_ROUTING,
    bandOffsets: [
      Math.sin(motionSeed) * Math.max(4, widthFactor * 0.04),
      Math.sin(motionSeed + 0.9) * Math.max(3, widthFactor * 0.035),
      Math.sin(motionSeed + 1.8) * Math.max(4, widthFactor * 0.04),
    ],
    bandWidths: [0.84, 0.62, 0.74],
    bandAlphas: [0.42, 0.3, 0.42],
    colors: [palette.alert, palette.warm, palette.bright],
  };
};

export type RetroPlayerPose = {
  state: 'idle' | 'run-a' | 'run-b' | 'jump' | 'fall' | 'dash';
  bodyOffsetY: number;
  bodyHeight: number;
  helmetOffsetY: number;
  chestOffsetY: number;
  packOffsetY: number;
  bootLeftOffsetY: number;
  bootRightOffsetY: number;
  kneeLeftOffsetY: number;
  kneeRightOffsetY: number;
  headbandOffsetY: number;
  accentOffsetY: number;
  wingLift: number;
  auraAlpha: number;
};

export const getRetroPlayerPose = (params: {
  timeMs: number;
  velocityX: number;
  velocityY: number;
  onGround: boolean;
  dashTimerMs: number;
}): RetroPlayerPose => {
  const running = Math.abs(params.velocityX) >= 40;
  const step = getRetroMotionStep(params.timeMs, 100, 2);

  if (params.dashTimerMs > 0) {
    return {
      state: 'dash',
      bodyOffsetY: 2,
      bodyHeight: 37,
      helmetOffsetY: 1,
      chestOffsetY: 1,
      packOffsetY: -2,
      bootLeftOffsetY: -3,
      bootRightOffsetY: -2,
      kneeLeftOffsetY: -3,
      kneeRightOffsetY: -2,
      headbandOffsetY: -1,
      accentOffsetY: 1,
      wingLift: -3,
      auraAlpha: 0.34,
    };
  }

  if (!params.onGround) {
    const rising = params.velocityY < 0;
    return {
      state: rising ? 'jump' : 'fall',
      bodyOffsetY: rising ? -3 : 2,
      bodyHeight: rising ? 38 : 42,
      helmetOffsetY: rising ? -3 : 0,
      chestOffsetY: rising ? -2 : 2,
      packOffsetY: rising ? 0 : 3,
      bootLeftOffsetY: rising ? -6 : 0,
      bootRightOffsetY: rising ? -3 : 2,
      kneeLeftOffsetY: rising ? -5 : 1,
      kneeRightOffsetY: rising ? -3 : 2,
      headbandOffsetY: rising ? -3 : 0,
      accentOffsetY: rising ? -2 : 1,
      wingLift: rising ? -5 : -1,
      auraAlpha: rising ? 0.28 : 0.2,
    };
  }

  if (running) {
    const leftStep = step === 0 ? -2 : 1;
    const rightStep = step === 0 ? 1 : -2;
    return {
      state: step === 0 ? 'run-a' : 'run-b',
      bodyOffsetY: step === 0 ? -2 : 1,
      bodyHeight: 40,
      helmetOffsetY: step === 0 ? -2 : 0,
      chestOffsetY: step === 0 ? -2 : 1,
      packOffsetY: step === 0 ? -1 : 2,
      bootLeftOffsetY: step === 0 ? leftStep - 1 : leftStep + 1,
      bootRightOffsetY: step === 0 ? rightStep + 1 : rightStep - 1,
      kneeLeftOffsetY: step === 0 ? leftStep - 1 : leftStep,
      kneeRightOffsetY: step === 0 ? rightStep : rightStep - 1,
      headbandOffsetY: step === 0 ? -2 : 0,
      accentOffsetY: step === 0 ? -1 : 1,
      wingLift: step === 0 ? -3 : 0,
      auraAlpha: 0.18,
    };
  }

  const idleBob = getRetroMotionStep(params.timeMs, 180, 2) === 0 ? 0 : -1;
  return {
    state: 'idle',
    bodyOffsetY: idleBob,
    bodyHeight: 40,
    helmetOffsetY: idleBob,
    chestOffsetY: idleBob,
    packOffsetY: 0,
    bootLeftOffsetY: 0,
    bootRightOffsetY: 0,
    kneeLeftOffsetY: 0,
    kneeRightOffsetY: 0,
    headbandOffsetY: idleBob,
    accentOffsetY: 0,
    wingLift: 0,
    auraAlpha: 0.14,
  };
};

export type RetroEnemyPose = {
  state:
    | 'idle'
    | 'walk-a'
    | 'walk-b'
    | 'hop-crouch'
    | 'hop-rise'
    | 'hop-fall'
    | 'hover'
    | 'windup'
    | 'charge'
    | 'telegraph';
  yOffset: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  accentAlpha: number;
  accentOffsetX: number;
  accentOffsetY: number;
};

export const getRetroEnemyPose = (
  enemy: Pick<EnemyState, 'kind' | 'vx' | 'vy' | 'x' | 'turret' | 'charger' | 'flyer' | 'hop' | 'boss'>,
  timeMs: number,
): RetroEnemyPose => {
  if (enemy.kind === 'boss' && enemy.boss) {
    if (enemy.vy < -40) {
      return { state: 'hop-rise', yOffset: -8, scaleX: 0.96, scaleY: 1.06, alpha: 1, accentAlpha: 0, accentOffsetX: 0, accentOffsetY: 0 };
    }
    if (enemy.vy > 40) {
      return { state: 'hop-fall', yOffset: 4, scaleX: 1.04, scaleY: 0.94, alpha: 1, accentAlpha: 0, accentOffsetX: 0, accentOffsetY: 0 };
    }
    if (Math.abs(enemy.vx) >= 16) {
      const runStep = getRetroMotionStep(timeMs + enemy.x, 90, 2);
      return {
        state: runStep === 0 ? 'walk-a' : 'walk-b',
        yOffset: runStep === 0 ? -5 : 3,
        scaleX: runStep === 0 ? 1.04 : 0.98,
        scaleY: runStep === 0 ? 0.97 : 1.03,
        alpha: 1,
        accentAlpha: 0,
        accentOffsetX: 0,
        accentOffsetY: 0,
      };
    }
  }

  if (enemy.kind === 'turret' && enemy.turret && enemy.turret.telegraphMs > 0) {
    const progress = 1 - enemy.turret.telegraphMs / Math.max(enemy.turret.telegraphDurationMs, 1);
    const pulse = Math.min(2, Math.floor(progress * 3));
    return {
      state: 'telegraph',
      yOffset: [0, -1, -2][pulse] ?? 0,
      scaleX: [1, 1.04, 1.1][pulse] ?? 1,
      scaleY: [1, 0.98, 0.94][pulse] ?? 1,
      alpha: [0.8, 0.9, 1][pulse] ?? 0.8,
      accentAlpha: 0,
      accentOffsetX: 0,
      accentOffsetY: 0,
    };
  }

  if (enemy.kind === 'charger' && enemy.charger) {
    if (enemy.charger.state === 'windup') {
      return { state: 'windup', yOffset: 1, scaleX: 1.08, scaleY: 0.92, alpha: 1, accentAlpha: 0, accentOffsetX: 0, accentOffsetY: 0 };
    }
    if (enemy.charger.state === 'charge') {
      return { state: 'charge', yOffset: -1, scaleX: 1.14, scaleY: 0.92, alpha: 1, accentAlpha: 0, accentOffsetX: 0, accentOffsetY: 0 };
    }
  }

  if (enemy.kind === 'flyer' && enemy.flyer) {
    const hoverStep = getRetroMotionStep(timeMs + enemy.x * 2, 140, 3);
    const shimmerStep = getRetroMotionStep(timeMs + enemy.x * 3, 300, 3);
    return {
      state: 'hover',
      yOffset: [-2, 0, 1][hoverStep] ?? 0,
      scaleX: [0.98, 1.02, 1][hoverStep] ?? 1,
      scaleY: [1.02, 0.98, 1][hoverStep] ?? 1,
      alpha: 0.97,
      accentAlpha: [0.24, 0.38, 0.3][shimmerStep] ?? 0.3,
      accentOffsetX: 0,
      accentOffsetY: [0, 1, 1][hoverStep] ?? 1,
    };
  }

  if (enemy.kind === 'hopper' && enemy.hop) {
    if (enemy.vy < -40) {
      return {
        state: 'hop-rise',
        yOffset: -2,
        scaleX: 0.92,
        scaleY: 1.12,
        alpha: 1,
        accentAlpha: 0,
        accentOffsetX: 0,
        accentOffsetY: 0,
      };
    }

    if (enemy.vy > 40) {
      return {
        state: 'hop-fall',
        yOffset: 1,
        scaleX: 1.1,
        scaleY: 0.9,
        alpha: 1,
        accentAlpha: 0,
        accentOffsetX: 0,
        accentOffsetY: 0,
      };
    }

    if (enemy.hop.timerMs <= Math.min(220, enemy.hop.intervalMs * 0.22)) {
      return {
        state: 'hop-crouch',
        yOffset: 2,
        scaleX: 1.12,
        scaleY: 0.86,
        alpha: 1,
        accentAlpha: 0,
        accentOffsetX: 0,
        accentOffsetY: 0,
      };
    }
  }

  const moving = Math.abs(enemy.vx) >= 16 || Math.abs(enemy.vy) >= 16;
  const patrolStep = getRetroMotionStep(timeMs + enemy.x, 120, 2);
  return {
    state: moving ? (patrolStep === 0 ? 'walk-a' : 'walk-b') : 'idle',
    yOffset: moving ? (patrolStep === 0 ? -1 : 1) : 0,
    scaleX: moving ? (patrolStep === 0 ? 1.06 : 0.98) : 1,
    scaleY: moving ? (patrolStep === 0 ? 0.96 : 1.04) : 1,
    alpha: 1,
    accentAlpha: 0,
    accentOffsetX: 0,
    accentOffsetY: 0,
  };
};

export type RetroFeedbackSnapshot = {
  checkpoints: Array<{ id: string; activated: boolean; x: number; y: number; width: number; height: number }>;
  collectibles: Array<{ id: string; collected: boolean; x: number; y: number }>;
  rewardReveals: Array<{ id: string; kind: 'coins' | 'power'; x: number; y: number; power?: PowerType }>;
  brittlePlatforms?: Array<{ id: string; phase: 'intact' | 'warning' | 'ready' | 'broken'; x: number; y: number; width: number; height: number }>;
  allCoinsRecovered: boolean;
  presentationPower: PowerType | null;
  player: { dead: boolean; x: number; y: number; width: number; height: number; health: number; invulnerableMs: number };
  enemies: Array<{
    id: string;
    alive: boolean;
    defeatCause: EnemyDefeatCause | null;
    x: number;
    y: number;
    width: number;
    height: number;
    kind: EnemyState['kind'];
  }>;
};

export type RetroFeedbackEvent =
  | { kind: 'checkpoint'; id: string; x: number; y: number }
  | { kind: 'coin'; id: string; x: number; y: number }
  | { kind: 'reward'; id: string; x: number; y: number }
  | { kind: 'platform-break'; id: string; x: number; y: number; width: number; height: number }
  | { kind: 'power'; power: PowerType; x: number; y: number }
  | { kind: 'heal'; x: number; y: number }
  | { kind: 'player-hit'; x: number; y: number }
  | { kind: 'player-defeat'; x: number; y: number }
  | { kind: 'enemy-defeat'; id: string; cause: EnemyDefeatCause; enemyKind: EnemyState['kind']; x: number; y: number };

export const detectRetroFeedbackEvents = (
  previous: RetroFeedbackSnapshot,
  current: RetroFeedbackSnapshot,
): RetroFeedbackEvent[] => {
  const events: RetroFeedbackEvent[] = [];

  for (const checkpoint of current.checkpoints) {
    const prior = previous.checkpoints.find((entry) => entry.id === checkpoint.id);
    if (!prior?.activated && checkpoint.activated) {
      events.push({
        kind: 'checkpoint',
        id: checkpoint.id,
        x: checkpoint.x + checkpoint.width / 2,
        y: checkpoint.y + checkpoint.height / 2,
      });
    }
  }

  for (const collectible of current.collectibles) {
    const prior = previous.collectibles.find((entry) => entry.id === collectible.id);
    if (!prior?.collected && collectible.collected) {
      events.push({ kind: 'coin', id: collectible.id, x: collectible.x, y: collectible.y });
    }
  }

  for (const reveal of current.rewardReveals) {
    const known = previous.rewardReveals.some((entry) => entry.id === reveal.id);
    if (known) {
      continue;
    }

    if (reveal.kind === 'coins') {
      events.push({ kind: 'reward', id: reveal.id, x: reveal.x, y: reveal.y });
      continue;
    }

    events.push({ kind: 'power', power: reveal.power ?? 'doubleJump', x: reveal.x, y: reveal.y });
  }

  for (const platform of current.brittlePlatforms ?? []) {
    const prior = (previous.brittlePlatforms ?? []).find((entry) => entry.id === platform.id);
    if (prior?.phase !== 'broken' && platform.phase === 'broken') {
      events.push({
        kind: 'platform-break',
        id: platform.id,
        x: platform.x + platform.width / 2,
        y: platform.y + platform.height / 2,
        width: platform.width,
        height: platform.height,
      });
    }
  }

  if (!previous.allCoinsRecovered && current.allCoinsRecovered) {
    const healAnchor = current.collectibles.find((collectible) => collectible.collected) ?? current.collectibles[0];
    events.push({ kind: 'heal', x: healAnchor?.x ?? 0, y: healAnchor?.y ?? 0 });
  }

  if (previous.presentationPower !== current.presentationPower && current.presentationPower) {
    const existingPowerEvent = events.some((event) => event.kind === 'power' && event.power === current.presentationPower);
    if (!existingPowerEvent) {
      events.push({ kind: 'power', power: current.presentationPower, x: 0, y: 0 });
    }
  }

  const playerRecoveredFromHitWindow =
    !previous.player.dead &&
    !current.player.dead &&
    current.player.invulnerableMs > 0 &&
    (current.player.health < previous.player.health ||
      current.presentationPower !== previous.presentationPower ||
      current.player.invulnerableMs > previous.player.invulnerableMs + 120);

  if (playerRecoveredFromHitWindow) {
    events.push({
      kind: 'player-hit',
      x: current.player.x + current.player.width / 2,
      y: current.player.y + current.player.height / 2,
    });
  }

  if (!previous.player.dead && current.player.dead) {
    events.push({
      kind: 'player-defeat',
      x: current.player.x + current.player.width / 2,
      y: current.player.y + current.player.height / 2,
    });
  }

  for (const enemy of current.enemies) {
    const prior = previous.enemies.find((entry) => entry.id === enemy.id);
    if (prior?.alive && !enemy.alive) {
      events.push({
        kind: 'enemy-defeat',
        id: enemy.id,
        cause: enemy.defeatCause ?? 'thruster-impact',
        enemyKind: enemy.kind,
        x: prior.x + prior.width / 2,
        y: prior.y + prior.height / 2,
      });
    }
  }

  return events;
};

export type RetroTweenPresetName = 'jump' | 'land' | 'checkpoint' | 'coin' | 'reward' | 'power' | 'transition';

export type RetroDefeatTweenPresetName = 'stomp' | 'plasma-blast' | 'player-death';

export type RetroDefeatFlashPresetName = RetroDefeatTweenPresetName;

export const ENEMY_DEFEAT_VISIBLE_HOLD_MS = 96;

export const PLAYER_DEFEAT_VISIBLE_HOLD_MS = 120;

export const RETRO_DEFEAT_PRESENTATION_MAX_MS = 320;

const RETRO_TWEEN_PRESETS: Record<RetroTweenPresetName, Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>> = {
  jump: { y: '-=4', scaleX: 1.05, scaleY: 0.95, duration: 90, yoyo: true, ease: 'Linear' },
  land: { scaleX: 1.08, scaleY: 0.92, duration: 80, yoyo: true, ease: 'Linear' },
  checkpoint: { scaleX: 1.14, scaleY: 1.14, duration: 120, yoyo: true, ease: 'Linear' },
  coin: { y: '-=3', scaleX: 1.16, scaleY: 1.16, duration: 80, yoyo: true, ease: 'Linear' },
  reward: { y: '-=6', scaleX: 1.12, scaleY: 1.12, duration: 110, yoyo: true, ease: 'Linear' },
  power: { scaleX: 1.18, scaleY: 1.18, duration: 140, yoyo: true, ease: 'Linear' },
  transition: { y: '-=8', scaleX: 1.08, scaleY: 1.08, duration: 220, yoyo: true, repeat: 1, ease: 'Linear' },
};

type RetroDefeatTweenPreset = {
  holdMs: number;
  depth: number;
  tween: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>;
};

type RetroDefeatFlashPreset = {
  width: number;
  height: number;
  alpha: number;
  depth: number;
  duration: number;
  scaleStart: number;
  scaleEnd: number;
};

const RETRO_DEFEAT_TWEEN_PRESETS: Record<RetroDefeatTweenPresetName, RetroDefeatTweenPreset> = {
  stomp: {
    holdMs: ENEMY_DEFEAT_VISIBLE_HOLD_MS,
    depth: 12,
    tween: { scaleX: 1.52, scaleY: 0.24, angle: 18, alpha: 0.5, duration: 96, ease: 'Quad.easeOut' },
  },
  'plasma-blast': {
    holdMs: ENEMY_DEFEAT_VISIBLE_HOLD_MS,
    depth: 12,
    tween: { scaleX: 0.34, scaleY: 1.72, angle: 28, alpha: 0.44, duration: 108, ease: 'Cubic.easeOut' },
  },
  'player-death': {
    holdMs: PLAYER_DEFEAT_VISIBLE_HOLD_MS,
    depth: 12,
    tween: { scaleX: 0.18, scaleY: 1.92, angle: -32, alpha: 0.34, duration: 120, ease: 'Cubic.easeOut' },
  },
};

export const getRetroDefeatTweenPreset = (preset: RetroDefeatTweenPresetName): RetroDefeatTweenPreset =>
  RETRO_DEFEAT_TWEEN_PRESETS[preset];

export const playRetroTweenPreset = (
  scene: Phaser.Scene,
  targets: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  preset: RetroTweenPresetName,
  overrides: Partial<Phaser.Types.Tweens.TweenBuilderConfig> = {},
): Phaser.Tweens.Tween => {
  const normalizedTargets = Array.isArray(targets) ? targets : [targets];
  for (const target of normalizedTargets) {
    scene.tweens.killTweensOf(target);
  }

  return scene.tweens.add({
    ...RETRO_TWEEN_PRESETS[preset],
    ...overrides,
    targets: normalizedTargets,
  });
};

export const playRetroDefeatTweenPreset = (
  scene: Phaser.Scene,
  targets: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  preset: RetroDefeatTweenPresetName,
  overrides: Partial<Phaser.Types.Tweens.TweenBuilderConfig> = {},
): Phaser.Tweens.Tween => {
  const normalizedTargets = Array.isArray(targets) ? targets : [targets];
  for (const target of normalizedTargets) {
    scene.tweens.killTweensOf(target);
  }

  return scene.tweens.add({
    ...RETRO_DEFEAT_TWEEN_PRESETS[preset].tween,
    ...overrides,
    targets: normalizedTargets,
  });
};

type RetroResettableTarget = {
  target: Phaser.GameObjects.GameObject;
  depth?: number;
  visible?: boolean;
  alpha?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
};

export const resetRetroPresentationTargets = (
  scene: Phaser.Scene,
  targets: RetroResettableTarget[],
): void => {
  for (const entry of targets) {
    scene.tweens.killTweensOf(entry.target);

    if ('setScale' in entry.target && typeof entry.target.setScale === 'function') {
      entry.target.setScale(entry.scaleX ?? 1, entry.scaleY ?? entry.scaleX ?? 1);
    }
    if ('setRotation' in entry.target && typeof entry.target.setRotation === 'function') {
      entry.target.setRotation(0);
    }
    if ('setAngle' in entry.target && typeof entry.target.setAngle === 'function') {
      entry.target.setAngle(entry.angle ?? 0);
    }
    if ('setAlpha' in entry.target && typeof entry.target.setAlpha === 'function') {
      entry.target.setAlpha(entry.alpha ?? 1);
    }
    if ('clearTint' in entry.target && typeof entry.target.clearTint === 'function') {
      entry.target.clearTint();
    }
    if ('setVisible' in entry.target && typeof entry.target.setVisible === 'function') {
      entry.target.setVisible(entry.visible ?? true);
    }
    if (entry.depth !== undefined && 'setDepth' in entry.target && typeof entry.target.setDepth === 'function') {
      entry.target.setDepth(entry.depth);
    }
  }
};

export const spawnRetroDefeatFlash = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  tint: number,
  preset: RetroDefeatFlashPresetName,
): Phaser.GameObjects.Ellipse => {
  const config = RETRO_DEFEAT_FLASH_PRESETS[preset];
  const flash = scene.add
    .ellipse(x, y, config.width, config.height, tint, config.alpha)
    .setDepth(config.depth)
    .setStrokeStyle(2, 0xffffff, 0.94)
    .setScale(config.scaleStart);
  ignoreFromUiCamera(scene, flash);

  scene.tweens.add({
    targets: flash,
    scaleX: config.scaleEnd,
    scaleY: config.scaleEnd,
    alpha: 0,
    duration: config.duration,
    ease: 'Cubic.easeOut',
    onComplete: () => flash.destroy(),
  });

  return flash;
};

export type RetroParticlePresetName =
  | 'jump'
  | 'land'
  | 'checkpoint'
  | 'coin'
  | 'reward'
  | 'power'
  | 'heal'
  | 'transition'
  | 'player-defeat'
  | 'enemy-defeat-stomp'
  | 'enemy-defeat-plasma';

type RetroParticlePreset = {
  count: number;
  speed: [number, number];
  lifespan: number;
  angle: [number, number];
  scaleStart: number;
  scaleEnd: number;
  alphaStart: number;
  depth: number;
  gravityY?: number;
  textureKey?: string;
  cleanupDelayMs?: number;
};

const RETRO_PARTICLE_PRESETS: Record<RetroParticlePresetName, RetroParticlePreset> = {
  jump: { count: 5, speed: [22, 58], lifespan: 220, angle: [205, 335], scaleStart: 1.2, scaleEnd: 0.2, alphaStart: 0.86, depth: 8, gravityY: 140 },
  land: { count: 6, speed: [20, 66], lifespan: 240, angle: [185, 355], scaleStart: 1.3, scaleEnd: 0.24, alphaStart: 0.88, depth: 8, gravityY: 160 },
  checkpoint: { count: 10, speed: [34, 90], lifespan: 320, angle: [0, 360], scaleStart: 1.4, scaleEnd: 0.18, alphaStart: 0.88, depth: 9 },
  coin: { count: 6, speed: [28, 68], lifespan: 240, angle: [0, 360], scaleStart: 1.1, scaleEnd: 0.18, alphaStart: 0.84, depth: 9 },
  reward: { count: 8, speed: [30, 74], lifespan: 280, angle: [0, 360], scaleStart: 1.2, scaleEnd: 0.2, alphaStart: 0.86, depth: 9 },
  power: { count: 12, speed: [32, 96], lifespan: 340, angle: [0, 360], scaleStart: 1.5, scaleEnd: 0.22, alphaStart: 0.9, depth: 9 },
  heal: { count: 14, speed: [26, 88], lifespan: 360, angle: [0, 360], scaleStart: 1.6, scaleEnd: 0.18, alphaStart: 0.9, depth: 9 },
  transition: { count: 10, speed: [22, 72], lifespan: 320, angle: [0, 360], scaleStart: 1.2, scaleEnd: 0.18, alphaStart: 0.9, depth: 12 },
  'player-defeat': {
    count: 42,
    speed: [110, 240],
    lifespan: 296,
    angle: [0, 360],
    scaleStart: 4.4,
    scaleEnd: 0.42,
    alphaStart: 1,
    depth: 16,
    gravityY: 156,
    textureKey: 'retro-particle-burst',
    cleanupDelayMs: 320,
  },
  'enemy-defeat-stomp': {
    count: 26,
    speed: [56, 150],
    lifespan: 248,
    angle: [198, 342],
    scaleStart: 3.6,
    scaleEnd: 0.4,
    alphaStart: 1,
    depth: 15,
    gravityY: 184,
    textureKey: 'retro-particle-burst',
    cleanupDelayMs: 300,
  },
  'enemy-defeat-plasma': {
    count: 32,
    speed: [78, 210],
    lifespan: 272,
    angle: [0, 360],
    scaleStart: 4.2,
    scaleEnd: 0.28,
    alphaStart: 1,
    depth: 15,
    textureKey: 'retro-particle-burst',
    cleanupDelayMs: 320,
  },
};

export const getRetroParticlePreset = (preset: RetroParticlePresetName): RetroParticlePreset => RETRO_PARTICLE_PRESETS[preset];

export const spawnRetroParticleBurst = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  tint: number,
  preset: RetroParticlePresetName,
): Phaser.GameObjects.Particles.ParticleEmitter => {
  const config = getRetroParticlePreset(preset);
  const emitter = scene.add.particles(x, y, config.textureKey ?? 'retro-particle', {
    emitting: false,
    tint,
    speed: { min: config.speed[0], max: config.speed[1] },
    lifespan: config.lifespan,
    angle: { min: config.angle[0], max: config.angle[1] },
    scale: { start: config.scaleStart, end: config.scaleEnd },
    alpha: { start: config.alphaStart, end: 0 },
    gravityY: config.gravityY ?? 0,
  });
  emitter.setDepth(config.depth);
  ignoreFromUiCamera(scene, emitter);
  emitter.explode(config.count, x, y);
  scene.time.delayedCall(config.cleanupDelayMs ?? config.lifespan + 80, () => emitter.destroy());
  return emitter;
};

type RetroBackdropRuntime = {
  timers: Phaser.Time.TimerEvent[];
  tweens: Phaser.Tweens.Tween[];
};

const createRetroBackdropRuntime = (scene: Phaser.Scene): RetroBackdropRuntime => {
  const runtime: RetroBackdropRuntime = { timers: [], tweens: [] };
  (scene as any).__retroBackdropRuntime = runtime;
  return runtime;
};

const cleanupRetroBackdropArtifacts = (scene: Phaser.Scene): void => {
  const runtime = (scene as any).__retroBackdropRuntime as RetroBackdropRuntime | undefined;
  if (runtime) {
    for (const timer of runtime.timers) {
      timer.remove(false);
    }
    for (const tween of runtime.tweens) {
      tween.remove();
    }
    delete (scene as any).__retroBackdropRuntime;
  }

  for (const child of [...scene.children.list]) {
    const gameObject = child as Phaser.GameObjects.GameObject & {
      name?: string;
      depth?: number;
      destroy: () => void;
    };
    const name = gameObject.name ?? '';
    const depth = gameObject.depth ?? 0;
    const isNamedBackdropObject = name.startsWith('__retro-backdrop-');
    const isBackdropGraphics = child instanceof Phaser.GameObjects.Graphics && depth >= -30 && depth <= -24;

    if (isNamedBackdropObject || isBackdropGraphics) {
      gameObject.destroy();
    }
  }
};

const fillBackdropCircle = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number,
): void => {
  graphics.fillStyle(color, alpha);
  graphics.fillCircle(Math.round(x), Math.round(y), Math.round(radius));
};

const strokeBackdropEllipseArc = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  color: number,
  alpha: number,
  startAngle: number,
  endAngle: number,
): void => {
  const points = Math.max(16, Math.ceil((radiusX + radiusY) / 6));
  graphics.fillStyle(color, alpha);
  for (let index = 0; index <= points; index += 1) {
    const t = index / points;
    const angle = startAngle + (endAngle - startAngle) * t;
    const px = x + Math.cos(angle) * radiusX;
    const py = y + Math.sin(angle) * radiusY;
    graphics.fillRect(Math.round(px), Math.round(py), 3, 3);
  }
};

const drawBackdropPlanet = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  fill: number,
  shade: number,
  ring: number | null,
  craterLight: number,
  craterDark: number,
  seed: number,
  craterDetail: number = 1,
): void => {
  if (ring !== null) {
    strokeBackdropEllipseArc(graphics, x, y + radius * 0.06, radius * 1.95, Math.max(10, radius * 0.36), ring, 0.24, Math.PI * 0.94, Math.PI * 1.98);
    strokeBackdropEllipseArc(graphics, x, y + radius * 0.06, radius * 1.66, Math.max(8, radius * 0.28), mixColor(ring, shade, 0.24), 0.14, Math.PI * 0.96, Math.PI * 1.96);
  }

  fillBackdropCircle(graphics, x + radius * 0.08, y + radius * 0.08, radius, shade, 0.55);
  fillBackdropCircle(graphics, x, y, radius, fill, 0.92);
  fillBackdropCircle(graphics, x - radius * 0.2, y - radius * 0.18, Math.max(6, radius * 0.42), mixColor(fill, 0xffffff, 0.18), 0.2);
  fillBackdropCircle(graphics, x + radius * 0.28, y - radius * 0.26, Math.max(4, radius * 0.18), mixColor(fill, 0xffffff, 0.12), 0.1 * craterDetail);

  const craterCount = Math.max(2, Math.round((radius >= 60 ? 6 : radius >= 34 ? 4 : radius >= 24 ? 3 : 2) * craterDetail));
  const craterPlacements: Array<{ x: number; y: number; radius: number }> = [];
  for (let index = 0; index < craterCount; index += 1) {
    const craterSeed = (seed + index * 977) >>> 0;
    const craterRadius = Math.max(2, Math.round(radius * (0.055 + ((craterSeed & 0x0f) * 0.009) + craterDetail * 0.012)));
    let craterX = x;
    let craterY = y;
    let placed = false;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const attemptSeed = (craterSeed + attempt * 1999) >>> 0;
      const angle = ((attemptSeed & 0xff) / 255) * Math.PI * 2;
      const radialBand = attempt < 4
        ? 0.18 + (((attemptSeed >> 8) & 0x0f) / 15) * 0.24
        : 0.56 + (((attemptSeed >> 12) & 0x0f) / 15) * 0.28;
      const radialDistance = radius * radialBand;
      const candidateX = x + Math.cos(angle) * radialDistance;
      const candidateY = y + Math.sin(angle) * radialDistance * 0.82;
      const insidePlanet = Math.hypot((candidateX - x) / radius, (candidateY - y) / (radius * 0.9)) <= 0.98;
      const overlapsExisting = craterPlacements.some((placement) => (
        Phaser.Math.Distance.Between(candidateX, candidateY, placement.x, placement.y) < craterRadius + placement.radius + Math.max(2, radius * 0.015)
      ));
      if (!insidePlanet || overlapsExisting) {
        continue;
      }

      craterX = candidateX;
      craterY = candidateY;
      placed = true;
      break;
    }

    if (!placed) {
      continue;
    }

    craterPlacements.push({ x: craterX, y: craterY, radius: craterRadius });
    const craterMid = mixColor(craterDark, fill, 0.24);
    fillBackdropCircle(graphics, craterX + craterRadius * 0.08, craterY + craterRadius * 0.08, craterRadius, craterDark, 0.2 + craterDetail * 0.04);
    fillBackdropCircle(graphics, craterX, craterY, Math.max(1, craterRadius * 0.9), craterMid, 0.12 + craterDetail * 0.03);
    fillBackdropCircle(graphics, craterX - craterRadius * 0.22, craterY - craterRadius * 0.22, Math.max(1, craterRadius * 0.56), craterLight, 0.1 + craterDetail * 0.02);
  }

  if (ring !== null) {
    strokeBackdropEllipseArc(graphics, x, y + radius * 0.06, radius * 1.95, Math.max(10, radius * 0.36), ring, 0.72, Math.PI * 0.02, Math.PI * 0.94);
    strokeBackdropEllipseArc(graphics, x, y + radius * 0.06, radius * 1.66, Math.max(8, radius * 0.28), mixColor(ring, fill, 0.22), 0.4, Math.PI * 0.04, Math.PI * 0.92);
  }
};

const drawMountainRange = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  width: number,
  baseY: number,
  minPeakHeight: number,
  maxPeakHeight: number,
  minMountainWidth: number,
  maxMountainWidth: number,
  color: number,
  alpha: number,
  seed: number,
): void => {
  let cursor = x - Math.floor(minMountainWidth * 0.5);
  let index = 0;
  graphics.fillStyle(color, alpha);

  while (cursor < x + width + maxMountainWidth) {
    const localSeed = (seed + index * 131) >>> 0;
    const mountainWidth = minMountainWidth + (localSeed % Math.max(1, maxMountainWidth - minMountainWidth + 1));
    const peakHeight = minPeakHeight + ((localSeed >> 5) % Math.max(1, maxPeakHeight - minPeakHeight + 1));
    const peakOffset = (((localSeed >> 10) & 0x07) - 3) * 0.08 * mountainWidth;
    const leftX = cursor;
    const rightX = cursor + mountainWidth;
    const peakX = Phaser.Math.Clamp(cursor + mountainWidth * 0.5 + peakOffset, leftX + mountainWidth * 0.18, rightX - mountainWidth * 0.18);
    const peakY = baseY - peakHeight;

    graphics.fillTriangle(leftX, baseY, peakX, peakY, rightX, baseY);
    cursor += mountainWidth * (0.52 + (((localSeed >> 14) & 0x03) * 0.08));
    index += 1;
  }
};

const fillBackdropPolygon = (
  graphics: Phaser.GameObjects.Graphics,
  points: number[],
): void => {
  graphics.beginPath();
  graphics.moveTo(points[0] ?? 0, points[1] ?? 0);
  for (let index = 2; index < points.length; index += 2) {
    graphics.lineTo(points[index] ?? 0, points[index + 1] ?? 0);
  }
  graphics.closePath();
  graphics.fillPath();
};

const drawCaveFormation = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alpha: number,
  detailColor: number,
  detailAlpha: number,
  seed: number,
): void => {
  graphics.fillStyle(color, alpha);
  const skew = (((seed >> 2) & 0x0f) / 15 - 0.5) * 0.18;
  const leftRise = 0.78 - (((seed >> 6) & 0x07) * 0.04);
  const midPeak = 0.3 + (((seed >> 9) & 0x07) * 0.035);
  const rightPeak = 0.22 + (((seed >> 12) & 0x07) * 0.03);
  const shoulder = 0.56 + (((seed >> 15) & 0x07) * 0.02);
  const notch = 0.76 + (((seed >> 18) & 0x07) * 0.02);
  const baseHeight = Math.max(48, height * 0.42);
  const baseBottom = y + height + baseHeight * 0.7;

  graphics.fillRect(x, y + height - baseHeight, width, baseBottom - (y + height - baseHeight));

  fillBackdropPolygon(graphics, [
    x,
    y + height - baseHeight,
    x + width * 0.08,
    y + Math.min(height * leftRise, height - baseHeight * 0.8),
    x + width * (0.18 + skew * 0.35),
    y + Math.min(height * (0.52 - (leftRise - 0.5) * 0.2), height - baseHeight),
    x + width * (0.28 + skew),
    y + height * midPeak,
    x + width * (0.42 + skew * 0.5),
    y + height * shoulder,
    x + width * (0.56 + skew * 0.25),
    y + height * (0.44 - (shoulder - 0.56) * 0.3),
    x + width * notch,
    y + height * rightPeak,
    x + width * 0.9,
    y + Math.min(height * 0.8, height - baseHeight * 0.7),
    x + width,
    y + baseBottom,
    x,
    y + baseBottom,
  ]);

  graphics.fillStyle(detailColor, detailAlpha);
  fillBackdropPolygon(graphics, [
    x + width * 0.04,
    y + baseBottom,
    x + width * 0.08,
    y + height * (leftRise - 0.08),
    x + width * 0.14,
    y + height * (leftRise - 0.18),
    x + width * 0.18,
    y + height * (leftRise - 0.06),
    x + width * 0.14,
    y + baseBottom,
  ]);
  fillBackdropPolygon(graphics, [
    x + width * (0.34 + skew * 0.2),
    y + baseBottom,
    x + width * (0.42 + skew * 0.16),
    y + height * 0.82,
    x + width * (0.48 + skew * 0.14),
    y + height * 0.66,
    x + width * (0.54 + skew * 0.1),
    y + height * 0.88,
    x + width * (0.5 + skew * 0.1),
    y + baseBottom,
  ]);
  fillBackdropPolygon(graphics, [
    x + width * 0.78,
    y + baseBottom,
    x + width * 0.84,
    y + height * 0.82,
    x + width * 0.9,
    y + height * (rightPeak + 0.1),
    x + width * 0.96,
    y + height * 0.9,
    x + width * 0.92,
    y + baseBottom,
  ]);
};

type RetroBackdropTheme = 'verdant' | 'ember' | 'violet';

const getRetroBackdropTheme = (palette: RetroPresentationPalette): RetroBackdropTheme => {
  if (colorDistance(palette.stageAccent, 0xffb768) < 90) {
    return 'ember';
  }
  if (colorDistance(palette.stageAccent, 0xc794ff) < 120 || colorDistance(palette.stageAccent, 0x9ee8ff) < 90) {
    return 'violet';
  }
  return 'verdant';
};

const drawCaveCeiling = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alpha: number,
  seed: number,
): void => {
  graphics.fillStyle(color, alpha);
  const ceilingA = 0.08 + (((seed >> 3) & 0x07) * 0.008);
  const ceilingB = 0.14 + (((seed >> 7) & 0x07) * 0.012);
  const ceilingC = 0.1 + (((seed >> 11) & 0x07) * 0.01);
  fillBackdropPolygon(graphics, [
    x,
    y,
    x + width,
    y,
    x + width,
    y + height * ceilingA,
    x + width * 0.88,
    y + height * (ceilingB + 0.03),
    x + width * 0.72,
    y + height * ceilingC,
    x + width * 0.58,
    y + height * (ceilingB + 0.05),
    x + width * 0.42,
    y + height * (ceilingA + 0.02),
    x + width * 0.24,
    y + height * (ceilingB + 0.02),
    x + width * 0.1,
    y + height * ceilingC,
    x,
    y + height * (ceilingA + 0.01),
  ]);
};

const drawAtmosphereBand = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alpha: number,
): void => {
  graphics.fillStyle(color, alpha);
  graphics.fillRect(x, y, width, height);
};


export const drawRetroBackdrop = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: RetroPresentationPalette,
  variant: 'gameplay' | 'transition' = 'gameplay',
): Phaser.GameObjects.Graphics => {
  cleanupRetroBackdropArtifacts(scene);
  const runtime = createRetroBackdropRuntime(scene);
  const baseLayer = scene.add.graphics().setDepth(-30).setName('__retro-backdrop-base');
  const farPlanetLayer = scene.add.graphics().setDepth(-29).setName('__retro-backdrop-far-planets');
  const farMountainLayer = scene.add.graphics().setDepth(-28).setName('__retro-backdrop-far-mountains');
  const heroPlanetLayer = scene.add.graphics().setDepth(-27).setName('__retro-backdrop-hero-planet');
  const midPlanetLayer = scene.add.graphics().setDepth(-26.5).setName('__retro-backdrop-mid-planets');
  const midMountainLayer = scene.add.graphics().setDepth(-26).setName('__retro-backdrop-mid-mountains');
  const nearMountainLayer = scene.add.graphics().setDepth(-25).setName('__retro-backdrop-near-mountains');
  const caveLayer = scene.add.graphics().setDepth(-24).setName('__retro-backdrop-cave');

  if (variant === 'gameplay') {
    baseLayer.setScrollFactor(0, 0);
    farPlanetLayer.setScrollFactor(0.04, 0.04);
    heroPlanetLayer.setScrollFactor(0.08, 0.08);
    farMountainLayer.setScrollFactor(0.1, 0.1);
    midPlanetLayer.setScrollFactor(0.14, 0.14);
    midMountainLayer.setScrollFactor(0.22, 0.22);
    nearMountainLayer.setScrollFactor(0.34, 0.34);
    caveLayer.setScrollFactor(0.56, 0);
  }

  const motif = createRetroBackdropMotifPalette(palette);
  const backdropTheme = getRetroBackdropTheme(palette);
  const deepSky = mixColor(palette.background, palette.ink, 0.18);
  const farTone = mixColor(palette.background, motif.craterDark, 0.22);
  const midTone = mixColor(motif.planetShade, palette.background, 0.08);
  const nearTone = mixColor(motif.planetFill, motif.planetShade, 0.2);
  const caveTone = mixColor(palette.ink, motif.craterDark, 0.08);
  const caveDetailTone = mixColor(motif.planetShade, motif.planetFill, 0.18);
  const fogTone = mixColor(motif.planetShade, deepSky, 0.18);
  const highlightTone = mixColor(motif.horizonGlow, palette.bright, 0.08);
  const layoutWidth = variant === 'gameplay' ? scene.scale.width : width;
  const layoutHeight = variant === 'gameplay' ? scene.scale.height : height;
  const farBaseY = y + Math.floor(height * (variant === 'gameplay' ? 0.66 : 0.62));
  const midBaseY = y + Math.floor(height * (variant === 'gameplay' ? 0.76 : 0.7));
  const nearBaseY = y + Math.floor(height * (variant === 'gameplay' ? 0.88 : 0.82));
  const seed = (palette.stageAccent ^ palette.skyline ^ palette.groundBand ^ width ^ height) >>> 0;
  const starCount = variant === 'gameplay' ? Math.max(36, Math.floor(layoutWidth / 14)) : Math.max(18, Math.floor(width / 26));
  const heroPlanetRadiusFactor = backdropTheme === 'ember' ? 0.3 : backdropTheme === 'violet' ? 0.38 : 0.34;
  const heroPlanetRadius = variant === 'gameplay'
    ? Math.max(120, Math.floor(layoutHeight * heroPlanetRadiusFactor))
    : Math.max(88, Math.floor(layoutHeight * (heroPlanetRadiusFactor - 0.1)));
  const heroPlanetX = backdropTheme === 'ember' ? 0.44 : backdropTheme === 'violet' ? 0.58 : 0.5;
  const heroPlanetY = backdropTheme === 'ember' ? 0.22 : backdropTheme === 'violet' ? 0.17 : 0.19;
  const farPlanetSpecs = backdropTheme === 'ember'
    ? [
        { x: -0.12, y: 0.14, size: 0.28, ring: true, detail: 1.2, seedOffset: 0x201 },
        { x: 1.04, y: 0.22, size: 0.18, ring: false, detail: 0.95, seedOffset: 0x287 },
      ]
    : backdropTheme === 'violet'
      ? [
          { x: -0.04, y: 0.1, size: 0.19, ring: false, detail: 1.05, seedOffset: 0x201 },
          { x: 0.92, y: 0.07, size: 0.22, ring: true, detail: 1.16, seedOffset: 0x287 },
          { x: 1.16, y: 0.26, size: 0.12, ring: false, detail: 0.9, seedOffset: 0x2f1 },
        ]
      : [
          { x: -0.08, y: 0.17, size: 0.24, ring: true, detail: 1.1, seedOffset: 0x201 },
          { x: 1.08, y: 0.14, size: 0.11, ring: true, detail: 1.05, seedOffset: 0x287 },
        ];
  const midPlanetSpecs = backdropTheme === 'ember'
    ? [
        { x: 0.18, y: 0.36, size: 0.1, ring: false, detail: 1.1, seedOffset: 0x3d9 },
        { x: 0.84, y: 0.3, size: 0.14, ring: true, detail: 1.18, seedOffset: 0x451 },
      ]
    : backdropTheme === 'violet'
      ? [
          { x: 0.24, y: 0.26, size: 0.16, ring: true, detail: 1.28, seedOffset: 0x3d9 },
          { x: 0.86, y: 0.38, size: 0.11, ring: false, detail: 1.08, seedOffset: 0x451 },
        ]
      : [
          { x: 0.1, y: 0.33, size: 0.12, ring: false, detail: 1.15, seedOffset: 0x3d9 },
          { x: 0.9, y: 0.34, size: 0.13, ring: true, detail: 1.2, seedOffset: 0x451 },
        ];

  baseLayer.fillStyle(deepSky, 1);
  baseLayer.fillRect(x, y, width, height);
  baseLayer.fillStyle(caveTone, 0.22);
  baseLayer.fillRect(x, y, width, Math.floor(layoutHeight * 0.1));
  baseLayer.fillStyle(highlightTone, 0.08);
  baseLayer.fillRect(x, farBaseY - 10, width, 18);

  for (let index = 0; index < starCount; index += 1) {
    const starSeed = (seed + index * 1733) >>> 0;
    const starX = x + 8 + (starSeed % Math.max(1, layoutWidth - 16));
    const starY = y + 8 + (((starSeed >> 6) * 19) % Math.max(24, Math.min(layoutHeight, farBaseY - y) - 16));
    const starSize = ((starSeed >> 4) & 0x03) === 0 ? 1 : 2;
    const starColor = index % 4 === 0 ? motif.starWarm : motif.starCool;
    const starAlpha = 0.34 + ((starSeed >> 10) & 0x03) * 0.1;
    const heroDx = starX - (x + layoutWidth * 0.5);
    const heroDy = starY - (y + layoutHeight * 0.2);
    if (Math.hypot(heroDx / Math.max(1, heroPlanetRadius * 1.18), heroDy / Math.max(1, heroPlanetRadius * 0.72)) < 1.04) {
      continue;
    }

    const star = scene.add
      .rectangle(starX, starY, starSize, starSize, starColor, starAlpha)
      .setOrigin(0.5)
      .setDepth(-29.5)
      .setName('__retro-backdrop-star');
    if (variant === 'gameplay') {
      star.setScrollFactor(0, 0);
    }

    const twinkleTween = scene.tweens.add({
      targets: star,
      alpha: { from: Math.max(0.12, starAlpha * 0.38), to: Math.min(0.86, starAlpha + 0.22) },
      duration: 820 + ((starSeed >> 12) % 1400),
      delay: (starSeed >> 8) % 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    runtime.tweens.push(twinkleTween);
  }

  for (const spec of farPlanetSpecs) {
    drawBackdropPlanet(
      farPlanetLayer,
      x + layoutWidth * spec.x,
      y + layoutHeight * spec.y,
      Math.max(30, Math.floor(layoutHeight * spec.size)),
      mixColor(motif.planetShade, motif.planetFill, backdropTheme === 'ember' ? 0.18 : 0.22),
      mixColor(deepSky, motif.craterDark, backdropTheme === 'violet' ? 0.24 : 0.3),
      spec.ring ? mixColor(motif.ring, deepSky, backdropTheme === 'ember' ? 0.22 : 0.28) : null,
      mixColor(motif.craterLight, motif.planetFill, 0.12),
      mixColor(motif.craterDark, deepSky, 0.14),
      seed ^ spec.seedOffset,
      spec.detail,
    );
  }

  drawBackdropPlanet(
    heroPlanetLayer,
    x + layoutWidth * heroPlanetX,
    y + layoutHeight * heroPlanetY,
    heroPlanetRadius,
    mixColor(motif.planetFill, palette.bright, 0.22),
    mixColor(motif.planetShade, motif.craterDark, 0.08),
    mixColor(motif.ring, motif.horizonGlow, backdropTheme === 'ember' ? 0.14 : 0.18),
    mixColor(motif.craterLight, palette.bright, 0.14),
    mixColor(motif.craterDark, motif.planetShade, 0.14),
    seed ^ 0x3a1,
    1.9,
  );

  for (const spec of midPlanetSpecs) {
    drawBackdropPlanet(
      midPlanetLayer,
      x + layoutWidth * spec.x,
      y + layoutHeight * spec.y,
      Math.max(30, Math.floor(layoutHeight * spec.size)),
      mixColor(motif.planetFill, spec.ring ? palette.bright : motif.horizonGlow, 0.14),
      mixColor(motif.planetShade, motif.craterDark, 0.15),
      spec.ring ? mixColor(motif.ring, motif.horizonGlow, 0.12) : null,
      mixColor(motif.craterLight, motif.planetFill, 0.15),
      mixColor(motif.craterDark, motif.planetShade, 0.09),
      seed ^ spec.seedOffset,
      spec.detail,
    );
  }

  farMountainLayer.fillStyle(farTone, 0.72);
  farMountainLayer.fillRect(x, farBaseY, width, y + height - farBaseY);
  drawMountainRange(
    farMountainLayer,
    x,
    width,
    farBaseY,
    Math.max(34, Math.floor(height * 0.08)),
    Math.max(72, Math.floor(height * 0.16)),
    Math.max(90, Math.floor(width * 0.08)),
    Math.max(180, Math.floor(width * 0.16)),
    mixColor(farTone, motif.craterDark, 0.1),
    0.78,
    seed ^ 0x12731,
  );

  midMountainLayer.fillStyle(midTone, 0.88);
  midMountainLayer.fillRect(x, midBaseY, width, y + height - midBaseY);
  drawMountainRange(
    midMountainLayer,
    x,
    width,
    midBaseY,
    Math.max(46, Math.floor(height * 0.1)),
    Math.max(110, Math.floor(height * 0.22)),
    Math.max(100, Math.floor(width * 0.1)),
    Math.max(220, Math.floor(width * 0.2)),
    mixColor(midTone, motif.planetShade, 0.08),
    0.86,
    seed ^ 0x8821,
  );

  nearMountainLayer.fillStyle(nearTone, 0.98);
  nearMountainLayer.fillRect(x, nearBaseY, width, y + height - nearBaseY);
  drawAtmosphereBand(
    nearMountainLayer,
    x,
    midBaseY - Math.floor(layoutHeight * 0.05),
    width,
    Math.max(10, Math.floor(layoutHeight * 0.04)),
    fogTone,
    0.12,
  );
  drawMountainRange(
    nearMountainLayer,
    x,
    width,
    nearBaseY,
    Math.max(60, Math.floor(height * 0.14)),
    Math.max(150, Math.floor(height * 0.28)),
    Math.max(120, Math.floor(width * 0.12)),
    Math.max(260, Math.floor(width * 0.24)),
    mixColor(nearTone, motif.planetFill, 0.04),
    0.94,
    seed ^ 0x45ab3,
  );

  drawCaveCeiling(
    caveLayer,
    x,
    y,
    width,
    layoutHeight,
    caveTone,
    0.86,
    seed ^ 0x51a9,
  );
  const caveFormationCount = backdropTheme === 'ember' ? 9 : backdropTheme === 'violet' ? 11 : 10;
  for (let caveIndex = 0; caveIndex < caveFormationCount; caveIndex += 1) {
    const caveSeed = (seed + caveIndex * 541) >>> 0;
    const segmentStart = x + (width / caveFormationCount) * caveIndex;
    const segmentWidth = width / caveFormationCount;
    const baseWidthFactor = backdropTheme === 'ember' ? 0.28 : backdropTheme === 'violet' ? 0.22 : 0.24;
    const widthVariance = backdropTheme === 'ember' ? 0.18 : backdropTheme === 'violet' ? 0.26 : 0.22;
    const formationWidth = Math.max(140, Math.floor(layoutWidth * (baseWidthFactor + ((caveSeed & 0x0f) / 15) * widthVariance)));
    const formationHeight = Math.max(
      220,
      Math.floor(layoutHeight * (
        backdropTheme === 'ember'
          ? 0.74 + (((caveSeed >> 6) & 0x0f) / 15) * 0.18
          : backdropTheme === 'violet'
            ? 0.9 + (((caveSeed >> 6) & 0x0f) / 15) * 0.2
            : 0.84 + (((caveSeed >> 6) & 0x0f) / 15) * 0.22
      )),
    );
    const formationLeft = segmentStart + Math.floor(
      segmentWidth * (
        backdropTheme === 'violet'
          ? 0.02 + (((caveSeed >> 17) & 0x0f) / 15) * 0.24
          : 0.04 + (((caveSeed >> 17) & 0x0f) / 15) * 0.18
      ),
    );
    const formationTop = y + layoutHeight - formationHeight;
    const localAlpha = 1;
    const localDetailAlpha = 0.22 + (((caveSeed >> 12) & 0x03) * 0.04);
    drawCaveFormation(
      caveLayer,
      formationLeft,
      formationTop,
      formationWidth,
      formationHeight,
      caveTone,
      localAlpha,
      caveDetailTone,
      localDetailAlpha,
      caveSeed,
    );
  }

  return baseLayer;
};

const RETRO_DEFEAT_FLASH_PRESETS: Record<RetroDefeatFlashPresetName, RetroDefeatFlashPreset> = {
  stomp: { width: 44, height: 22, alpha: 0.78, depth: 14, duration: 120, scaleStart: 0.7, scaleEnd: 1.75 },
  'plasma-blast': { width: 40, height: 40, alpha: 0.72, depth: 14, duration: 132, scaleStart: 0.68, scaleEnd: 1.9 },
  'player-death': { width: 58, height: 44, alpha: 0.82, depth: 15, duration: 148, scaleStart: 0.64, scaleEnd: 2.05 },
};
