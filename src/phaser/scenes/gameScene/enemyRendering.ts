import * as Phaser from 'phaser';

import { TURRET_VARIANT_CONFIG, type EnemyState, type HazardState, type ProjectileState } from '../../../game/simulation/state';
import {
  getRetroDefeatTweenPreset,
  getRetroEnemyPose,
  type RetroPresentationPalette,
} from '../../view/retroPresentation';

export type GameSceneEnemyRenderingContext = Phaser.Scene & {
  retroPalette: RetroPresentationPalette;
  hazardSprites: Map<string, Phaser.GameObjects.Rectangle>;
  enemySprites: Map<string, Phaser.GameObjects.Sprite>;
  enemyAccentSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  projectileSprites: Map<string, Phaser.GameObjects.Sprite>;
  enemyDefeatVisibleUntilMs: Map<string, number>;
};

export function drawHazard(scene: GameSceneEnemyRenderingContext, hazard: HazardState): void {
  const base = scene.add
    .rectangle(
      hazard.rect.x + hazard.rect.width / 2,
      hazard.rect.y + hazard.rect.height / 2,
      hazard.rect.width,
      hazard.rect.height,
      scene.retroPalette.alert,
    )
    .setOrigin(0.5)
    .setDepth(4)
    .setStrokeStyle(2, scene.retroPalette.ink, 1);

  const toothWidth = Math.max(8, Math.floor(hazard.rect.width / 3));
  for (let index = 0; index < Math.max(2, Math.floor(hazard.rect.width / toothWidth)); index += 1) {
    scene.add
      .rectangle(
        hazard.rect.x + toothWidth / 2 + toothWidth * index,
        hazard.rect.y + 2,
        Math.max(4, toothWidth - 2),
        Math.max(4, Math.floor(hazard.rect.height / 2)),
        scene.retroPalette.warm,
      )
      .setOrigin(0.5, 0)
      .setDepth(5);
  }

  scene.hazardSprites.set(hazard.id, base);
}

export function syncEnemy(scene: GameSceneEnemyRenderingContext, enemy: EnemyState): void {
  const sprite = scene.enemySprites.get(enemy.id);
  const accents = scene.enemyAccentSprites.get(enemy.id) ?? [];
  if (!sprite) {
    return;
  }
  const defeatHoldUntilMs = scene.enemyDefeatVisibleUntilMs.get(enemy.id) ?? Number.NEGATIVE_INFINITY;
  const defeatHoldActive = !enemy.alive && scene.time.now < defeatHoldUntilMs;
  sprite.setVisible(enemy.alive || defeatHoldActive);
  if (enemy.alive) {
    const motion = getRetroEnemyPose(enemy, scene.time.now);
    sprite.setPosition(enemy.x, enemy.y + motion.yOffset);
    sprite.setFlipX(enemy.direction < 0);
    sprite.setScale(motion.scaleX, motion.scaleY);
    sprite.setAlpha(motion.alpha);
    sprite.setAngle(0);
    sprite.setDepth(0);
    const turretVariant = enemy.variant ? TURRET_VARIANT_CONFIG[enemy.variant] : null;
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
    sprite.setTint(tint);
    for (const accent of accents) {
      accent.setVisible(false);
    }
    if (enemy.kind === 'flyer' && accents.length === 2) {
      accents[0]
        .setPosition(enemy.x + 7 + motion.accentOffsetX, enemy.y + 13 + motion.accentOffsetY)
        .setFillStyle(scene.retroPalette.bright, motion.accentAlpha)
        .setVisible(true);
      accents[1]
        .setPosition(enemy.x + 11 - motion.accentOffsetX, enemy.y + 17 + motion.accentOffsetY)
        .setFillStyle(scene.retroPalette.cool, Math.max(0.24, motion.accentAlpha * 0.76))
        .setVisible(true);
    }
    return;
  }

  if (defeatHoldActive) {
    const defeatPreset = getRetroDefeatTweenPreset(enemy.defeatCause === 'plasma-blast' ? 'plasma-blast' : 'stomp');
    sprite.setDepth(defeatPreset.depth);
    sprite.setAlpha(1);
    sprite.setTint(enemy.defeatCause === 'plasma-blast' ? scene.retroPalette.bright : scene.retroPalette.alert);
    for (const accent of accents) {
      accent.setVisible(false);
    }
    return;
  }

  scene.enemyDefeatVisibleUntilMs.delete(enemy.id);

  for (const accent of accents) {
    accent.setVisible(false);
  }
}

export function syncProjectile(scene: GameSceneEnemyRenderingContext, projectile: ProjectileState): void {
  let sprite = scene.projectileSprites.get(projectile.id);
  if (!projectile.alive) {
    sprite?.destroy();
    scene.projectileSprites.delete(projectile.id);
    return;
  }

  if (!sprite) {
    sprite = scene.add.sprite(projectile.x, projectile.y, 'projectile').setOrigin(0, 0);
    scene.projectileSprites.set(projectile.id, sprite);
  }

  sprite.setPosition(projectile.x, projectile.y);
  sprite.setTint(projectile.variant ? TURRET_VARIANT_CONFIG[projectile.variant].projectileColor : 0xffc15b);
  sprite.setScale(projectile.variant ? 1.18 : 1.06);
  sprite.setAlpha(projectile.variant ? 0.96 : 0.9);
}
