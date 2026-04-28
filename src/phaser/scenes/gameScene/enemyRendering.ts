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
  getRetroEnemyPose,
  type RetroPresentationPalette,
} from '../../view/retroPresentation';

const ENEMY_VISUAL_HEIGHTS = {
  walker: WALKER_TEXTURE_SIZE.height,
  hopper: HOPPER_TEXTURE_SIZE.height,
  turret: TURRET_TEXTURE_SIZE.height,
  charger: CHARGER_TEXTURE_SIZE.height,
  flyer: FLYER_TEXTURE_SIZE.height,
} as const;

const ENEMY_CONTACT_STRIP_DEPTH = -0.1;
const ENEMY_CONTACT_STRIP_HEIGHT = 2;

export type GameSceneEnemyRenderingContext = Phaser.Scene & {
  retroPalette: RetroPresentationPalette;
  hazardSprites: Map<string, Phaser.GameObjects.Rectangle>;
  enemySprites: Map<string, Phaser.GameObjects.Sprite>;
  enemyContactStrips: Map<string, Phaser.GameObjects.Rectangle>;
  enemyAccentSprites: Map<string, Phaser.GameObjects.Rectangle[]>;
  projectileSprites: Map<string, Phaser.GameObjects.Sprite>;
  enemyDefeatVisibleUntilMs: Map<string, number>;
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

  for (const tooth of getSpikeHazardToothRects(hazard.rect)) {
    scene.add
      .rectangle(
        tooth.x,
        tooth.y,
        tooth.width,
        tooth.height,
        scene.retroPalette.warm,
      )
      .setOrigin(0.5, 0)
      .setDepth(5);
  }

  scene.hazardSprites.set(hazard.id, base);
}

function syncEnemyContactStrip(scene: GameSceneEnemyRenderingContext, enemy: EnemyState, tintColor: number): void {
  const supportY = enemy.supportY;
  const isGrounded = enemy.kind !== 'flyer' && supportY !== null && Math.abs(enemy.y - supportY) <= 4;
  if (!isGrounded) {
    scene.enemyContactStrips.delete(enemy.id);
    return;
  }

  let strip = scene.enemyContactStrips.get(enemy.id);
  if (!strip) {
    strip = scene.add
      .rectangle(enemy.x, supportY + ENEMY_CONTACT_STRIP_HEIGHT / 2, enemy.width, ENEMY_CONTACT_STRIP_HEIGHT, tintColor)
      .setOrigin(0.5, 0.5)
      .setDepth(ENEMY_CONTACT_STRIP_DEPTH);
    scene.enemyContactStrips.set(enemy.id, strip);
  } else {
    strip
      .setPosition(enemy.x, supportY + ENEMY_CONTACT_STRIP_HEIGHT / 2)
      .setDisplaySize(enemy.width, ENEMY_CONTACT_STRIP_HEIGHT)
      .setFillStyle(tintColor);
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
  sprite.setVisible(enemy.alive || defeatHoldActive);
  if (enemy.alive) {
    const motion = getRetroEnemyPose(enemy, scene.time.now);
    const visualHeight = ENEMY_VISUAL_HEIGHTS[enemy.kind];
    const plantedOffsetY = enemy.kind !== 'flyer' && enemy.supportY !== null && Math.abs(enemy.y - enemy.supportY) <= 4 ? 0 : motion.yOffset;
    const renderY =
      enemy.kind === 'flyer'
        ? enemy.y + motion.yOffset
        : enemy.y + enemy.height - visualHeight * motion.scaleY + plantedOffsetY;
    sprite.setPosition(enemy.x, renderY);
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
        .setPosition(enemy.x + 14, enemy.y + 7 + motion.accentOffsetY)
        .setFillStyle(scene.retroPalette.cool, motion.accentAlpha)
        .setVisible(true);
      accents[1]
        .setPosition(enemy.x + 10, enemy.y + 16 + motion.accentOffsetY)
        .setFillStyle(scene.retroPalette.bright, 0.16 + motion.accentAlpha * 0.5)
        .setVisible(true);
    }
    syncEnemyContactStrip(scene, enemy, tint);
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

  scene.enemyContactStrips.delete(enemy.id);
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
