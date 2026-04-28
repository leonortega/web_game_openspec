import * as Phaser from 'phaser';

import type { CheckpointState, CollectibleState, RewardBlockState, RewardRevealState } from '../../../game/simulation/state';
import { getRetroMotionStep, RETRO_FONT_FAMILY } from '../../view/retroPresentation';

export type GameSceneRewardRenderingContext = Phaser.Scene & {
  retroPalette: {
    safe: number;
    cool: number;
    warm: number;
    border: number;
    shadow: string;
  };
  checkpointSprites: Map<string, Phaser.GameObjects.Sprite>;
  checkpointContactStrips: Map<string, Phaser.GameObjects.Rectangle>;
  collectibleSprites: Map<string, Phaser.GameObjects.Sprite>;
  rewardBlockSprites: Map<string, Phaser.GameObjects.Rectangle>;
  rewardBlockLabels: Map<string, Phaser.GameObjects.Text>;
  rewardRevealTexts: Map<string, Phaser.GameObjects.Text>;
  rewardBlockColor(rewardBlock: RewardBlockState): number;
  rewardBlockLabel(rewardBlock: RewardBlockState): string;
  rewardRevealText(rewardReveal: RewardRevealState): string;
  rewardRevealColor(rewardReveal: RewardRevealState): string;
};

const CHECKPOINT_VISUAL_DEPTH = 4.2;
const CHECKPOINT_CONTACT_STRIP_DEPTH = 4.1;
const CHECKPOINT_CONTACT_STRIP_HEIGHT = 2;

function syncCheckpointContactStrip(
  scene: GameSceneRewardRenderingContext,
  checkpoint: CheckpointState,
  tintColor: number,
  checkpointBottomY: number,
): void {
  let strip = scene.checkpointContactStrips.get(checkpoint.id);
  if (!strip) {
    strip = scene.add
      .rectangle(
        checkpoint.rect.x + checkpoint.rect.width / 2,
        checkpointBottomY + CHECKPOINT_CONTACT_STRIP_HEIGHT / 2,
        checkpoint.rect.width,
        CHECKPOINT_CONTACT_STRIP_HEIGHT,
        tintColor,
      )
      .setOrigin(0.5, 0.5)
      .setDepth(CHECKPOINT_CONTACT_STRIP_DEPTH);
    scene.checkpointContactStrips.set(checkpoint.id, strip);
  } else {
    strip
      .setPosition(checkpoint.rect.x + checkpoint.rect.width / 2, checkpointBottomY + CHECKPOINT_CONTACT_STRIP_HEIGHT / 2)
      .setDisplaySize(checkpoint.rect.width, CHECKPOINT_CONTACT_STRIP_HEIGHT)
      .setFillStyle(tintColor);
  }
}

export function syncCheckpoint(
  scene: GameSceneRewardRenderingContext,
  checkpoint: CheckpointState,
  supportTopY?: number,
): void {
  const sprite = scene.checkpointSprites.get(checkpoint.id);
  if (!sprite) {
    return;
  }

  const tintColor = checkpoint.activated ? scene.retroPalette.safe : scene.retroPalette.cool;
  const checkpointBottomY = supportTopY ?? checkpoint.rect.y + checkpoint.rect.height;

  sprite
    .setOrigin(0.5, 1)
    .setPosition(
      checkpoint.rect.x + checkpoint.rect.width / 2,
      checkpointBottomY,
    )
    .setDisplaySize(checkpoint.rect.width, checkpoint.rect.height)
    .setDepth(CHECKPOINT_VISUAL_DEPTH)
    .setTint(tintColor);

  syncCheckpointContactStrip(scene, checkpoint, tintColor, checkpointBottomY);
}

export function syncCollectible(scene: GameSceneRewardRenderingContext, collectible: CollectibleState): void {
  const sprite = scene.collectibleSprites.get(collectible.id);
  if (!sprite) {
    return;
  }
  sprite.setVisible(!collectible.collected);
  if (!collectible.collected) {
    const collectibleStep = getRetroMotionStep(scene.time.now + collectible.position.x, 140, 2);
    sprite.setPosition(collectible.position.x, collectible.position.y);
    sprite.setTint(scene.retroPalette.warm);
    sprite.setScale(collectibleStep === 0 ? 1 : 1.12);
    sprite.setAlpha(collectibleStep === 0 ? 1 : 0.86);
  }
}

export function syncRewardBlock(scene: GameSceneRewardRenderingContext, rewardBlock: RewardBlockState): void {
  const sprite = scene.rewardBlockSprites.get(rewardBlock.id);
  const label = scene.rewardBlockLabels.get(rewardBlock.id);
  if (!sprite || !label) {
    return;
  }

  const flashProgress = Phaser.Math.Clamp(rewardBlock.hitFlashMs / 180, 0, 1);
  const bumpOffset = flashProgress > 0 ? Math.round((10 * flashProgress) / 2) * 2 : 0;
  const alpha = rewardBlock.used ? 0.35 : 1;

  sprite.setPosition(rewardBlock.x + rewardBlock.width / 2, rewardBlock.y + rewardBlock.height / 2 - bumpOffset);
  sprite.setFillStyle(scene.rewardBlockColor(rewardBlock));
  sprite.setStrokeStyle(2, flashProgress > 0 ? 0xffffff : scene.retroPalette.border, flashProgress > 0 ? 0.8 : 0.55);
  sprite.setAlpha(alpha);
  label.setPosition(rewardBlock.x + rewardBlock.width / 2, rewardBlock.y + rewardBlock.height / 2 - bumpOffset);
  label.setText(scene.rewardBlockLabel(rewardBlock));
  label.setAlpha(alpha);
}

export function syncRewardReveal(scene: GameSceneRewardRenderingContext, rewardReveal: RewardRevealState): void {
  let text = scene.rewardRevealTexts.get(rewardReveal.id);
  if (!text) {
    text = scene.add
      .text(rewardReveal.x, rewardReveal.y, scene.rewardRevealText(rewardReveal), {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '18px',
        color: scene.rewardRevealColor(rewardReveal),
        fontStyle: 'bold',
        stroke: scene.retroPalette.shadow,
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(12);
    scene.rewardRevealTexts.set(rewardReveal.id, text);
  }

  const alpha = Phaser.Math.Clamp(rewardReveal.timerMs / rewardReveal.durationMs, 0, 1);
  const floatOffset = Math.round((((1 - alpha) * 24) / 3)) * 3;
  text.setText(scene.rewardRevealText(rewardReveal));
  text.setColor(scene.rewardRevealColor(rewardReveal));
  text.setPosition(rewardReveal.x, rewardReveal.y - floatOffset);
  text.setAlpha(alpha);
}
