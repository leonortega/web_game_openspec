import * as Phaser from 'phaser';
import type { EnemyDefeatCause, EnemyState, PowerType } from '../../game/simulation/state';

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

const mixColor = (left: number, right: number, amount: number): number => {
  const ratio = Phaser.Math.Clamp(amount, 0, 1);
  const leftRgb = toRgb(left);
  const rightRgb = toRgb(right);

  return toColor({
    r: leftRgb.r + (rightRgb.r - leftRgb.r) * ratio,
    g: leftRgb.g + (rightRgb.g - leftRgb.g) * ratio,
    b: leftRgb.b + (rightRgb.b - leftRgb.b) * ratio,
  });
};

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

export type RetroBackdropMotifPalette = {
  planetFill: number;
  planetShade: number;
  ring: number;
  craterLight: number;
  craterDark: number;
  horizonGlow: number;
  starWarm: number;
  starCool: number;
};

export const RETRO_FONT_FAMILY = '"Courier New", monospace';

// Optional analog overlays stay disabled in the required baseline.
export const RETRO_ANALOG_TREATMENT_ENABLED = false;

export const RETRO_MOTION_STEP_MS = 120;

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

  return {
    planetFill: ensureSeparated(mixColor(palette.skyline, palette.stageAccent, 0.2), separationReferences, palette.background, 58),
    planetShade: ensureSeparated(mixColor(palette.background, palette.groundBand, 0.42), separationReferences, palette.background, 52),
    ring: ensureSeparated(mixColor(palette.bright, palette.backdropGlow, 0.52), separationReferences, palette.background, 56),
    craterLight: ensureSeparated(mixColor(palette.groundBand, palette.backdropAccent, 0.3), separationReferences, palette.background, 48),
    craterDark: ensureSeparated(mixColor(palette.background, palette.ink, 0.36), separationReferences, palette.background, 42),
    horizonGlow: ensureSeparated(mixColor(palette.backdropGlow, palette.bright, 0.18), separationReferences, palette.background, 54),
    starWarm: ensureSeparated(mixColor(palette.warm, palette.bright, 0.42), separationReferences, palette.background, 56),
    starCool: ensureSeparated(mixColor(palette.cool, palette.bright, 0.34), separationReferences, palette.background, 56),
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

export const snapRetroValue = (value: number, step = 2): number => {
  if (step <= 1) {
    return value;
  }

  return Math.round(value / step) * step;
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
      bodyOffsetY: 1,
      bodyHeight: 38,
      helmetOffsetY: 1,
      chestOffsetY: 0,
      packOffsetY: -1,
      bootLeftOffsetY: -2,
      bootRightOffsetY: -2,
      kneeLeftOffsetY: -2,
      kneeRightOffsetY: -2,
      headbandOffsetY: -1,
      accentOffsetY: 0,
      wingLift: -2,
      auraAlpha: 0.32,
    };
  }

  if (!params.onGround) {
    const rising = params.velocityY < 0;
    return {
      state: rising ? 'jump' : 'fall',
      bodyOffsetY: rising ? -2 : 1,
      bodyHeight: rising ? 39 : 41,
      helmetOffsetY: rising ? -2 : 0,
      chestOffsetY: rising ? -1 : 1,
      packOffsetY: rising ? 1 : 2,
      bootLeftOffsetY: rising ? -4 : -1,
      bootRightOffsetY: rising ? -2 : 1,
      kneeLeftOffsetY: rising ? -4 : 0,
      kneeRightOffsetY: rising ? -2 : 1,
      headbandOffsetY: rising ? -2 : 0,
      accentOffsetY: rising ? -1 : 1,
      wingLift: rising ? -4 : -1,
      auraAlpha: rising ? 0.26 : 0.18,
    };
  }

  if (running) {
    const leftStep = step === 0 ? -2 : 1;
    const rightStep = step === 0 ? 1 : -2;
    return {
      state: step === 0 ? 'run-a' : 'run-b',
      bodyOffsetY: step === 0 ? -1 : 0,
      bodyHeight: 40,
      helmetOffsetY: step === 0 ? -1 : 0,
      chestOffsetY: step === 0 ? -1 : 0,
      packOffsetY: step === 0 ? 0 : 1,
      bootLeftOffsetY: leftStep,
      bootRightOffsetY: rightStep,
      kneeLeftOffsetY: leftStep,
      kneeRightOffsetY: rightStep,
      headbandOffsetY: step === 0 ? -1 : 0,
      accentOffsetY: step === 0 ? 0 : -1,
      wingLift: step === 0 ? -2 : 0,
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
  enemy: Pick<EnemyState, 'kind' | 'vx' | 'vy' | 'x' | 'turret' | 'charger' | 'flyer' | 'hop'>,
  timeMs: number,
): RetroEnemyPose => {
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
  allCoinsRecovered: boolean;
  presentationPower: PowerType | null;
  player: { dead: boolean; x: number; y: number; width: number; height: number };
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
  | { kind: 'power'; power: PowerType; x: number; y: number }
  | { kind: 'heal'; x: number; y: number }
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
        cause: enemy.defeatCause ?? 'stomp',
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
  emitter.explode(config.count, x, y);
  scene.time.delayedCall(config.cleanupDelayMs ?? config.lifespan + 80, () => emitter.destroy());
  return emitter;
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
  const backdrop = scene.add.graphics().setDepth(0);
  const horizonY = y + Math.floor(height * (variant === 'gameplay' ? 0.7 : 0.64));
  const skylineY = y + Math.floor(height * (variant === 'gameplay' ? 0.5 : 0.46));
  const motifPalette = createRetroBackdropMotifPalette(palette);
  const paletteSeed = (palette.stageAccent ^ palette.skyline ^ palette.groundBand) >>> 0;
  const celestialSpacing = variant === 'gameplay' ? 1800 : 1100;
  const celestialCount = Math.max(2, Math.ceil(width / celestialSpacing));
  const planetRadius = variant === 'gameplay' ? Math.max(28, Math.floor(height * 0.11)) : Math.max(22, Math.floor(height * 0.1));
  const starCount = Math.max(14, celestialCount * (variant === 'gameplay' ? 7 : 5));
  const craterCount = variant === 'gameplay' ? 7 : 5;
  const ridgeSegments = variant === 'gameplay' ? 8 : 6;

  backdrop.fillStyle(palette.background, 1);
  backdrop.fillRect(x, y, width, height);

  backdrop.fillStyle(palette.ink, 1);
  backdrop.fillRect(x, y, width, Math.max(18, Math.floor(height * 0.08)));

  backdrop.fillStyle(palette.backdropGlow, variant === 'gameplay' ? 0.12 : 0.14);
  const glowStartY = y + Math.floor(height * (variant === 'gameplay' ? 0.16 : 0.13));
  const glowSpacing = variant === 'gameplay' ? 38 : 28;
  const glowLines = variant === 'gameplay' ? 3 : 4;
  for (let index = 0; index < glowLines; index += 1) {
    const glowY = glowStartY + index * glowSpacing;
    if (glowY >= skylineY - 12) {
      break;
    }
    backdrop.fillRect(x, glowY, width, 3);
  }

  for (let index = 0; index < starCount; index += 1) {
    const offsetSeed = (paletteSeed + index * 97) >>> 0;
    const starX = x + 18 + (offsetSeed % Math.max(width - 36, 1));
    const starY = y + 18 + (((offsetSeed >> 3) * 29) % Math.max(Math.floor(height * 0.34), 28));
    const starSize = index % 4 === 0 ? 3 : 2;
    backdrop.fillStyle(index % 3 === 0 ? motifPalette.starWarm : motifPalette.starCool, index % 5 === 0 ? 0.94 : 0.82);
    backdrop.fillRect(starX, starY, starSize, starSize);
    if (index % 4 === 0) {
      backdrop.fillRect(starX - 2, starY + 1, starSize + 4, 1);
      backdrop.fillRect(starX + 1, starY - 2, 1, starSize + 4);
    }
  }

  for (let index = 0; index < celestialCount; index += 1) {
    const sectionLeft = x + Math.floor((index / celestialCount) * width);
    const sectionWidth = Math.ceil(width / celestialCount);
    const sectionSeed = (paletteSeed + index * 173) >>> 0;
    const bodyX = sectionLeft + Math.floor(sectionWidth * (0.34 + ((sectionSeed & 0x1f) / 255) * 0.32));
    const bodyY = y + Math.floor(height * (0.16 + (((sectionSeed >> 5) & 0x0f) / 255) * 0.16));
    const bodyRadius = Math.max(variant === 'gameplay' ? 24 : 18, planetRadius - (index % 2 === 0 ? 0 : 8));
    const moonRadius = Math.max(10, Math.floor(bodyRadius * 0.4));
    const moonX = bodyX - Math.floor(bodyRadius * (1.15 + (index % 3) * 0.12));
    const moonY = bodyY + Math.floor(bodyRadius * (0.22 - (index % 2) * 0.12));

    backdrop.fillStyle(motifPalette.planetShade, 0.42);
    backdrop.fillCircle(bodyX + 8, bodyY + 7, bodyRadius);
    backdrop.fillStyle(motifPalette.planetFill, 0.58);
    backdrop.fillCircle(bodyX, bodyY, bodyRadius);
    backdrop.fillStyle(motifPalette.craterDark, 0.34);
    backdrop.fillCircle(bodyX - Math.floor(bodyRadius * 0.24), bodyY + Math.floor(bodyRadius * 0.18), Math.max(6, Math.floor(bodyRadius * 0.22)));
    backdrop.fillCircle(bodyX + Math.floor(bodyRadius * 0.22), bodyY - Math.floor(bodyRadius * 0.14), Math.max(4, Math.floor(bodyRadius * 0.16)));
    if (index % 2 === 0) {
      backdrop.lineStyle(4, motifPalette.ring, 0.46);
      backdrop.strokeEllipse(bodyX - 2, bodyY + 3, bodyRadius * 2.8, Math.max(20, bodyRadius * 0.82));
    }

    backdrop.fillStyle(motifPalette.planetFill, variant === 'gameplay' ? 0.34 : 0.28);
    backdrop.fillCircle(moonX, moonY, moonRadius);
    backdrop.fillStyle(motifPalette.craterLight, 0.24);
    backdrop.fillCircle(moonX + Math.floor(moonRadius * 0.14), moonY + Math.floor(moonRadius * 0.18), Math.max(4, Math.floor(moonRadius * 0.2)));
  }

  backdrop.fillStyle(palette.skyline, 1);
  backdrop.fillRect(x, skylineY, width, Math.max(36, horizonY - skylineY));

  backdrop.fillStyle(motifPalette.horizonGlow, 0.16);
  backdrop.fillRect(x, skylineY - 8, width, 4);
  backdrop.fillStyle(palette.backdropAccent, 0.08);
  backdrop.fillRect(x, skylineY + 6, width, 6);

  const ridgeWidth = Math.ceil(width / ridgeSegments);
  for (let index = 0; index < ridgeSegments; index += 1) {
    const ridgeX = x + index * ridgeWidth;
    const ridgeHeight = 18 + ((paletteSeed >> (index % 8)) & 0x07) * 5 + (index % 2 === 0 ? 8 : 0);
    const ridgeTop = horizonY - ridgeHeight;
    const ridgeColor = index % 2 === 0 ? motifPalette.craterDark : motifPalette.craterLight;
    backdrop.fillStyle(ridgeColor, index % 2 === 0 ? 0.72 : 0.48);
    backdrop.fillRect(ridgeX, ridgeTop, Math.min(ridgeWidth + 2, x + width - ridgeX), ridgeHeight + 10);
    backdrop.fillStyle(palette.ink, 0.18);
    backdrop.fillEllipse(ridgeX + Math.floor(ridgeWidth * 0.46), ridgeTop + Math.max(6, Math.floor(ridgeHeight * 0.34)), Math.max(18, Math.floor(ridgeWidth * 0.5)), Math.max(10, Math.floor(ridgeHeight * 0.22)));
  }

  backdrop.fillStyle(palette.groundBand, 1);
  backdrop.fillRect(x, horizonY, width, y + height - horizonY);

  backdrop.fillStyle(motifPalette.horizonGlow, 0.22);
  backdrop.fillRect(x, horizonY - 16, width, 8);

  for (let index = 0; index < craterCount; index += 1) {
    const craterX = x + Math.floor(((index + 1) / (craterCount + 1)) * width);
    const craterY = horizonY + 20 + (index % 3) * 18;
    const craterWidth = variant === 'gameplay' ? 44 + (index % 3) * 10 : 34 + (index % 2) * 10;
    const craterHeight = 12 + (index % 2) * 5;
    backdrop.fillStyle(motifPalette.craterDark, 0.26);
    backdrop.fillEllipse(craterX, craterY, craterWidth, craterHeight);
    backdrop.fillStyle(motifPalette.craterLight, 0.16);
    backdrop.fillEllipse(craterX, craterY - 2, craterWidth - 8, Math.max(6, craterHeight - 4));
  }

  const scanlineStart = skylineY + 10;
  const scanlineSpacing = variant === 'gameplay' ? 22 : 16;
  backdrop.fillStyle(palette.ink, 0.18);
  for (let lineY = scanlineStart; lineY < horizonY - 8; lineY += scanlineSpacing) {
    backdrop.fillRect(x, lineY, width, 2);
  }

  const groundLineSpacing = variant === 'gameplay' ? 22 : 16;
  backdrop.fillStyle(motifPalette.horizonGlow, 0.08);
  for (let lineY = horizonY + 10; lineY < y + height - 8; lineY += groundLineSpacing) {
    backdrop.fillRect(x, lineY, width, 2);
  }

  if (variant === 'transition') {
    backdrop.fillStyle(palette.ink, 1);
    backdrop.fillRect(x, y + height - 22, width, 22);
  }

  return backdrop;
};

const RETRO_DEFEAT_FLASH_PRESETS: Record<RetroDefeatFlashPresetName, RetroDefeatFlashPreset> = {
  stomp: { width: 44, height: 22, alpha: 0.78, depth: 14, duration: 120, scaleStart: 0.7, scaleEnd: 1.75 },
  'plasma-blast': { width: 40, height: 40, alpha: 0.72, depth: 14, duration: 132, scaleStart: 0.68, scaleEnd: 1.9 },
  'player-death': { width: 58, height: 44, alpha: 0.82, depth: 15, duration: 148, scaleStart: 0.64, scaleEnd: 2.05 },
};