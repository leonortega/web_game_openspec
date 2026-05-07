import * as Phaser from 'phaser';

import {
  CHARGER_TEXTURE_SIZE,
  FLYER_TEXTURE_SIZE,
  HOPPER_TEXTURE_SIZE,
  TURRET_TEXTURE_SIZE,
  WALKER_TEXTURE_SIZE,
} from '../../assets/bootTextures';
import { TURRET_VARIANT_CONFIG, type EnemyState, type HazardState, type ProjectileState } from '../../../game/simulation/state';
import {
  getRetroDefeatTweenPreset,
  getRetroEnemyPaletteRamp,
  getRetroEnemyPose,
  getRetroHitFlashBlend,
  mixColor,
  snapRetroValue,
  type RetroPresentationPalette,
} from '../../view/retroPresentation';
import { drawEnemyGraphic } from '../../view/runtimeCharacterGraphics';
import { drawHazardGraphic, drawProjectileGraphic } from '../../view/runtimeWorldGraphics';

const ENEMY_VISUAL_HEIGHTS = {
  walker: WALKER_TEXTURE_SIZE.height,
  hopper: HOPPER_TEXTURE_SIZE.height,
  turret: TURRET_TEXTURE_SIZE.height,
  charger: CHARGER_TEXTURE_SIZE.height,
  flyer: FLYER_TEXTURE_SIZE.height,
} as const;

export type GameSceneEnemyRenderingContext = Phaser.Scene & {
  retroPalette: RetroPresentationPalette;
  hazardSprites: Map<string, Phaser.GameObjects.Graphics>;
  enemySprites: Map<string, Phaser.GameObjects.Graphics>;
  enemyContactStrips: Map<string, Phaser.GameObjects.Rectangle>;
  enemyAccentSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  projectileSprites: Map<string, Phaser.GameObjects.Graphics>;
  enemyDefeatVisibleUntilMs: Map<string, number>;
  enemyHitFlashUntilMs: Map<string, number>;
};

export const getSpikeHazardToothRects = (
  hazardRect: { x: number; y: number; width: number; height: number },
): Array<{ x: number; y: number; width: number; height: number }> => {
  const toothWidth = Math.max(8, Math.floor(hazardRect.width / 3));
  const toothHeight = Math.max(4, Math.floor(hazardRect.height / 2));
  const toothCount = Math.max(2, Math.floor(hazardRect.width / toothWidth));

  return Array.from({ length: toothCount }, (_entry, index) => ({
    x: hazardRect.x + toothWidth / 2 + toothWidth * index,
    y: hazardRect.y + 2,
    width: Math.max(4, toothWidth - 2),
    height: toothHeight,
  }));
};

export function drawHazard(scene: GameSceneEnemyRenderingContext, hazard: HazardState): void {
  const base = scene.add.graphics().setDepth(4);
  base.setPosition(hazard.rect.x, hazard.rect.y);
  drawHazardGraphic(base, {
    hazard,
    color: scene.retroPalette.alert,
    brightColor: scene.retroPalette.warm,
    borderColor: scene.retroPalette.border,
  });

  scene.hazardSprites.set(hazard.id, base);
}

function syncEnemyContactStrip(scene: GameSceneEnemyRenderingContext, enemy: EnemyState): void {
  const strip = scene.enemyContactStrips.get(enemy.id);
  if (strip) {
    strip.destroy();
    scene.enemyContactStrips.delete(enemy.id);
  }
}

export function syncEnemy(scene: GameSceneEnemyRenderingContext, enemy: EnemyState): void {
  const sprite = scene.enemySprites.get(enemy.id);
  const accents = scene.enemyAccentSprites.get(enemy.id) ?? [];
  if (!sprite) {
    return;
  }
  const defeatHoldUntilMs = scene.enemyDefeatVisibleUntilMs.get(enemy.id) ?? Number.NEGATIVE_INFINITY;
  const defeatHoldActive = !enemy.alive && scene.time.now < defeatHoldUntilMs;
  const hitFlashBlend = getRetroHitFlashBlend(scene.time.now, scene.enemyHitFlashUntilMs.get(enemy.id) ?? Number.NEGATIVE_INFINITY, 'enemy-hit');
  if (hitFlashBlend === 0) {
    scene.enemyHitFlashUntilMs.delete(enemy.id);
  }
  sprite.setVisible(enemy.alive || defeatHoldActive);
  if (enemy.alive) {
    const motion = getRetroEnemyPose(enemy, scene.time.now);
    const visualHeight = ENEMY_VISUAL_HEIGHTS[enemy.kind];
    const plantedOffsetY = enemy.kind !== 'flyer' && enemy.supportY !== null && Math.abs(enemy.y - enemy.supportY) <= 4 ? 0 : motion.yOffset;
    const renderY =
      enemy.kind === 'flyer'
        ? enemy.y + motion.yOffset
        : enemy.y + enemy.height - visualHeight * motion.scaleY + plantedOffsetY;
    const snappedEnemyX = snapRetroValue(enemy.x);
    const snappedRenderY = snapRetroValue(renderY);
    sprite.setPosition(snappedEnemyX, snappedRenderY);
    sprite.setData('visualWidth', enemy.width);
    sprite.setData('visualHeight', visualHeight);
    sprite.setScale(motion.scaleX, motion.scaleY);
    sprite.setAlpha(motion.alpha);
    sprite.setAngle(0);
    sprite.setDepth(0);
    const turretVariant = enemy.variant ? TURRET_VARIANT_CONFIG[enemy.variant] : null;
    const ramp = getRetroEnemyPaletteRamp(enemy, scene.retroPalette);
    let tint =
      enemy.kind === 'charger'
        ? scene.retroPalette.alert
        : enemy.kind === 'flyer'
          ? scene.retroPalette.cool
          : turretVariant
            ? turretVariant.baseColor
            : enemy.kind === 'hopper'
              ? scene.retroPalette.safe
              : scene.retroPalette.warm;
    if (enemy.kind === 'charger' && enemy.charger?.state === 'windup') {
      tint = scene.retroPalette.warm;
    }
    if (enemy.kind === 'turret' && turretVariant && enemy.turret?.telegraphMs) {
      tint = turretVariant.telegraphColor;
    }
    if (ramp) {
      tint = ramp.baseTint;
    }
    drawEnemyGraphic(sprite, {
      enemy,
      pose: motion,
      tint,
      alpha: hitFlashBlend > 0 ? Math.max(motion.alpha, 0.88) : motion.alpha,
      hitFlashBlend,
      brightColor: scene.retroPalette.bright,
      borderColor: scene.retroPalette.border,
    });
    for (const accent of accents) {
      accent.setVisible(false);
    }
    if (enemy.kind === 'flyer' && accents.length === 2) {
      accents[0]
        .setPosition(snapRetroValue(snappedEnemyX + 14), snapRetroValue(enemy.y + 7 + motion.accentOffsetY))
        .setFillStyle(scene.retroPalette.cool, motion.accentAlpha)
        .setVisible(true);
      accents[1]
        .setPosition(snapRetroValue(snappedEnemyX + 10), snapRetroValue(enemy.y + 16 + motion.accentOffsetY))
        .setFillStyle(scene.retroPalette.bright, 0.16 + motion.accentAlpha * 0.5)
        .setVisible(true);
    } else if (ramp && accents.length === 2) {
      accents[0]
        .setPosition(snapRetroValue(snappedEnemyX + 4), snapRetroValue(snappedRenderY + 5))
        .setSize(Math.max(10, enemy.width - 8), 4)
        .setFillStyle(ramp.highlightTint, Math.min(0.92, ramp.stripeAlpha + hitFlashBlend * 0.22))
        .setVisible(true);
      accents[1]
        .setPosition(snapRetroValue(snappedEnemyX + 6), snapRetroValue(snappedRenderY + enemy.height - 9))
        .setSize(Math.max(8, enemy.width - 12), 3)
        .setFillStyle(ramp.shadowTint, Math.min(0.9, 0.34 + hitFlashBlend * 0.2))
        .setVisible(true);
    }
    syncEnemyContactStrip(scene, enemy);
    return;
  }

  if (defeatHoldActive) {
    const defeatPreset = getRetroDefeatTweenPreset(enemy.defeatCause === 'plasma-blast' ? 'plasma-blast' : 'stomp');
    sprite.setData('visualWidth', enemy.width);
    sprite.setData('visualHeight', ENEMY_VISUAL_HEIGHTS[enemy.kind]);
    sprite.setDepth(defeatPreset.depth);
    sprite.setAlpha(1);
    const defeatTint = enemy.defeatCause === 'plasma-blast' ? scene.retroPalette.bright : scene.retroPalette.alert;
    drawEnemyGraphic(sprite, {
      enemy,
      pose: { state: 'idle', yOffset: 0, scaleX: 1, scaleY: 1, alpha: 1, accentAlpha: 0, accentOffsetX: 0, accentOffsetY: 0 },
      tint: hitFlashBlend > 0 ? mixColor(defeatTint, scene.retroPalette.border, hitFlashBlend) : defeatTint,
      alpha: 1,
      hitFlashBlend,
      brightColor: scene.retroPalette.bright,
      borderColor: scene.retroPalette.border,
    });
    for (const accent of accents) {
      accent.setVisible(false);
    }
    return;
  }

  scene.enemyDefeatVisibleUntilMs.delete(enemy.id);
  scene.enemyHitFlashUntilMs.delete(enemy.id);

  for (const accent of accents) {
    accent.setVisible(false);
  }

  syncEnemyContactStrip(scene, enemy);
}

export function syncProjectile(scene: GameSceneEnemyRenderingContext, projectile: ProjectileState): void {
  let sprite = scene.projectileSprites.get(projectile.id);
  if (!projectile.alive) {
    sprite?.destroy();
    scene.projectileSprites.delete(projectile.id);
    return;
  }

  if (!sprite) {
    sprite = scene.add.graphics();
    scene.projectileSprites.set(projectile.id, sprite);
  }

  sprite.setPosition(snapRetroValue(projectile.x), snapRetroValue(projectile.y));
  drawProjectileGraphic(sprite, {
    projectile,
    color: projectile.variant ? TURRET_VARIANT_CONFIG[projectile.variant].projectileColor : 0xffc15b,
    brightColor: scene.retroPalette.bright,
    borderColor: scene.retroPalette.border,
    alpha: projectile.variant ? 0.96 : 0.9,
  });
}
