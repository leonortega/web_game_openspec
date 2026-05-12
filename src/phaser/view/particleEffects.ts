/**
 * Particle effects system for Phaser 4 -- replaces beam effects
 * Provides utilities for projectile trails, burst effects, and continuous emitters
 */

import * as Phaser from 'phaser';

const ignoreFromUiCamera = (scene: Phaser.Scene, target: Phaser.GameObjects.GameObject): void => {
  const uiCamera = (scene as Phaser.Scene & { uiCamera?: Phaser.Cameras.Scene2D.Camera }).uiCamera;
  uiCamera?.ignore(target);
};

export interface ParticleEffectConfig {
  x: number;
  y: number;
  color: number;
  alpha?: number;
  depth?: number;
  durationMs?: number;
  speed?: number;
  lifespan?: number;
  count?: number;
}

export interface ProjectileTrailConfig extends ParticleEffectConfig {
  width?: number;
  height?: number;
  angle?: number;
}

/**
 * Create a projectile trail emitter
 */
export function createProjectileTrailEmitter(
  scene: Phaser.Scene,
  config: ProjectileTrailConfig,
): Phaser.GameObjects.Particles.ParticleEmitter {
  const { x, y, color, alpha = 0.6, depth = 8, speed = 50, lifespan = 400 } = config;

  const emitter = scene.add.particles(x, y, 'particle', {
    speed: { min: -speed, max: speed },
    lifespan,
    scale: { start: 0.6, end: 0 },
    alpha: { start: alpha, end: 0 },
    gravityY: 0,
    emitting: true,
    frequency: 10,
    quantity: 1,
    tint: color,
    blendMode: Phaser.BlendModes.ADD,
  });

  if (depth !== undefined) {
    emitter.setDepth(depth);
  }
  ignoreFromUiCamera(scene, emitter);

  return emitter;
}

/**
 * Create a burst particle effect
 */
export function createBurstEffect(
  scene: Phaser.Scene,
  config: ParticleEffectConfig,
): Phaser.GameObjects.Particles.ParticleEmitter {
  const { x, y, color, alpha = 0.95, depth = 9, durationMs = 260, lifespan = 320, speed = 140, count = 22 } = config;

  const emitter = scene.add.particles(x, y, 'particle', {
    speed: { min: speed * 0.4, max: speed },
    angle: { min: 0, max: 360 },
    lifespan,
    scale: { start: 1.2, end: 0.08, ease: 'quad.out' },
    alpha: { start: alpha, end: 0 },
    gravityY: 70,
    emitting: false,
    tint: color,
    blendMode: Phaser.BlendModes.ADD,
  });

  if (depth !== undefined) {
    emitter.setDepth(depth);
  }
  ignoreFromUiCamera(scene, emitter);

  emitter.explode(count, x, y);

  if (durationMs) {
    scene.time.delayedCall(durationMs, () => {
      emitter.stop();
      scene.time.delayedCall(420, () => {
        emitter.destroy();
      });
    });
  }

  return emitter;
}

/**
 * Create a fading region effect (replaces transient beam regions)
 */
export function createFadingRegionEffect(
  scene: Phaser.Scene,
  config: ParticleEffectConfig & { width: number; height: number },
): Phaser.GameObjects.Particles.ParticleEmitter {
  const { x, y, color, alpha = 0.72, depth = 9, durationMs = 300, lifespan = 600 } = config;

  const emitter = scene.add.particles(x, y, 'particle', {
    speed: { min: 20, max: 100 },
    angle: { min: 270 - 45, max: 270 + 45 },
    lifespan,
    scale: { start: 0.4, end: 0 },
    alpha: { start: alpha, end: 0 },
    gravityY: 50,
    emitting: true,
    frequency: 20,
    tint: color,
    blendMode: Phaser.BlendModes.ADD,
  });

  if (depth !== undefined) {
    emitter.setDepth(depth);
  }
  ignoreFromUiCamera(scene, emitter);

  // Gradual fade out - particles will naturally fade via lifespan
  if (durationMs) {
    scene.time.delayedCall(durationMs, () => {
      emitter.stop();
      scene.time.delayedCall(1000, () => {
        if (!emitter.isDestroyed) {
          emitter.destroy();
        }
      });
    });
  }

  return emitter;
}

export function createMuzzleSmokeEffect(
  scene: Phaser.Scene,
  config: {
    x: number;
    y: number;
    directionX: number;
    directionY: number;
    owner: 'enemy' | 'player';
    depth?: number;
  },
): Phaser.GameObjects.Particles.ParticleEmitter {
  const { x, y, directionX, directionY, owner, depth = 9 } = config;
  const tint = owner === 'enemy' ? 0xe6f6ff : 0xf2e8d8;
  const smokeCount = owner === 'enemy' ? 24 : 18;
  const speedXCenter = directionX * 58;
  const speedYCenter = directionY * 24 - 8;
  const emitter = scene.add.particles(x, y, 'particle', {
    speedX: {
      min: speedXCenter - 28,
      max: speedXCenter + 28,
    },
    speedY: {
      min: speedYCenter - 22,
      max: speedYCenter + 22,
    },
    angle: { min: 0, max: 360 },
    lifespan: { min: 260, max: 420 },
    scale: { start: 1.18, end: 0.14, ease: 'quad.out' },
    alpha: { start: 0.94, end: 0 },
    gravityY: -10,
    emitting: false,
    tint,
    blendMode: Phaser.BlendModes.NORMAL,
  });

  emitter.setDepth(depth);
  ignoreFromUiCamera(scene, emitter);
  emitter.explode(smokeCount, x, y);
  scene.time.delayedCall(560, () => emitter.destroy());
  spawnMuzzleSmokePuffs(scene, { x, y, directionX, directionY, owner, depth: depth + 0.1 });

  return emitter;
}

export function createCheckpointFireworkEffect(
  scene: Phaser.Scene,
  config: {
    x: number;
    y: number;
    depth?: number;
  },
): void {
  const { x, y, depth = 12 } = config;
  spawnCheckpointHalo(scene, x, y, depth + 0.2);
  const bursts = [
    { delayMs: 0, color: 0x8bff9f, count: 28, speed: 150, lifespan: 340, offsetX: 0, offsetY: 0, alpha: 0.98 },
    { delayMs: 36, color: 0x7df9ff, count: 22, speed: 176, lifespan: 360, offsetX: -10, offsetY: -12, alpha: 0.94 },
    { delayMs: 72, color: 0xffd166, count: 22, speed: 172, lifespan: 360, offsetX: 12, offsetY: -6, alpha: 0.9 },
  ];

  for (const burst of bursts) {
    scene.time.delayedCall(burst.delayMs, () => {
      createBurstEffect(scene, {
        x: x + burst.offsetX,
        y: y + burst.offsetY,
        color: burst.color,
        alpha: burst.alpha,
        depth,
        durationMs: 300,
        lifespan: burst.lifespan,
        speed: burst.speed,
        count: burst.count,
      });
      spawnCheckpointSparkBurst(scene, x + burst.offsetX, y + burst.offsetY, burst.color, depth + 0.3);
    });
  }
}

function spawnCheckpointHalo(scene: Phaser.Scene, x: number, y: number, depth: number): void {
  const halo = scene.add.circle(x, y, 10, 0xffffff, 0.9).setDepth(depth);
  ignoreFromUiCamera(scene, halo);
  scene.tweens.add({
    targets: halo,
    scaleX: 4.8,
    scaleY: 4.8,
    alpha: 0,
    duration: 260,
    ease: 'Quad.easeOut',
    onComplete: () => halo.destroy(),
  });
}

function spawnCheckpointSparkBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  depth: number,
): void {
  const sparkCount = 8;

  for (let index = 0; index < sparkCount; index += 1) {
    const angle = (Math.PI * 2 * index) / sparkCount + Phaser.Math.FloatBetween(-0.18, 0.18);
    const travel = Phaser.Math.FloatBetween(18, 42);
    const spark = scene.add.circle(x, y, Phaser.Math.FloatBetween(2.8, 4.8), color, 0.98).setDepth(depth);
    ignoreFromUiCamera(scene, spark);

    scene.tweens.add({
      targets: spark,
      x: x + Math.cos(angle) * travel,
      y: y + Math.sin(angle) * travel - Phaser.Math.FloatBetween(6, 18),
      scaleX: 0.18,
      scaleY: 0.18,
      alpha: 0,
      duration: Phaser.Math.Between(220, 320),
      ease: 'Cubic.easeOut',
      onComplete: () => spark.destroy(),
    });
  }
}

function spawnMuzzleSmokePuffs(
  scene: Phaser.Scene,
  config: {
    x: number;
    y: number;
    directionX: number;
    directionY: number;
    owner: 'enemy' | 'player';
    depth: number;
  },
): void {
  const { x, y, directionX, directionY, owner, depth } = config;
  const puffColor = owner === 'enemy' ? 0xeaf7ff : 0xf5ede0;
  const flashColor = owner === 'enemy' ? 0xfff1c2 : 0xffd59a;
  const flash = scene.add.circle(x, y, owner === 'enemy' ? 8 : 6, flashColor, 0.72).setDepth(depth + 0.1);
  ignoreFromUiCamera(scene, flash);

  scene.tweens.add({
    targets: flash,
    scaleX: 1.8,
    scaleY: 1.8,
    alpha: 0,
    duration: 110,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  const puffCount = owner === 'enemy' ? 7 : 5;
  const directionLength = Math.hypot(directionX, directionY) || 1;
  const forwardX = directionX / directionLength;
  const forwardY = directionY / directionLength;

  for (let index = 0; index < puffCount; index += 1) {
    const startOffset = Phaser.Math.FloatBetween(0, 10);
    const lateralOffset = Phaser.Math.FloatBetween(-8, 8);
    const puff = scene.add
      .ellipse(
        x - forwardX * startOffset - forwardY * lateralOffset * 0.4,
        y - forwardY * startOffset + forwardX * lateralOffset * 0.4,
        Phaser.Math.FloatBetween(10, 16),
        Phaser.Math.FloatBetween(8, 14),
        puffColor,
        0.8,
      )
      .setDepth(depth);
    ignoreFromUiCamera(scene, puff);

    const driftX = x - forwardX * Phaser.Math.FloatBetween(18, 42) - forwardY * Phaser.Math.FloatBetween(-12, 12);
    const driftY = y - forwardY * Phaser.Math.FloatBetween(18, 42) + Phaser.Math.FloatBetween(-16, 6);

    scene.tweens.add({
      targets: puff,
      x: driftX,
      y: driftY,
      scaleX: Phaser.Math.FloatBetween(1.4, 2.2),
      scaleY: Phaser.Math.FloatBetween(1.4, 2),
      alpha: 0,
      duration: Phaser.Math.Between(280, 460),
      ease: 'Cubic.easeOut',
      onComplete: () => puff.destroy(),
    });
  }
}

/**
 * Update projectile trail position and rotation
 */
export function updateTrailEmitter(
  emitter: Phaser.GameObjects.Particles.ParticleEmitter,
  x: number,
  y: number,
  angle?: number,
): void {
  emitter.setPosition(x, y);
  if (angle !== undefined) {
    emitter.setRotation(angle);
  }
}

/**
 * Ensure particle texture exists (fallback to basic circle if not available)
 */
export function ensureParticleTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('particle')) {
    return;
  }
  
  // Create canvas-based particle texture
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  scene.textures.addCanvas('particle', canvas);
}
