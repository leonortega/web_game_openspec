import * as Phaser from 'phaser';

import type { CheckpointState, CollectibleState, RewardBlockState, RewardRevealState } from '../../../game/simulation/state';
import { getRetroMotionStep, RETRO_FONT_FAMILY } from '../../view/retroPresentation';
import {
  drawCheckpointGraphic,
  drawCollectibleGraphic,
  drawRewardBlockGraphic,
  drawRewardBlockIconGraphic,
} from '../../view/runtimeWorldGraphics';

const ignoreFromUiCamera = (scene: Phaser.Scene, target: Phaser.GameObjects.GameObject): void => {
  const uiCamera = (scene as Phaser.Scene & { uiCamera?: Phaser.Cameras.Scene2D.Camera }).uiCamera;
  uiCamera?.ignore(target);
};

export type GameSceneRewardRenderingContext = Phaser.Scene & {
  retroPalette: {
    safe: number;
    cool: number;
    warm: number;
    bright: number;
    border: number;
    shadow: string;
  };
  checkpointSprites: Map<string, Phaser.GameObjects.Graphics>;
  checkpointContactStrips: Map<string, Phaser.GameObjects.Rectangle>;
  collectibleSprites: Map<string, Phaser.GameObjects.Graphics>;
  rewardBlockSprites: Map<string, Phaser.GameObjects.Graphics>;
  rewardBlockIcons: Map<string, Phaser.GameObjects.Graphics>;
  rewardRevealTexts: Map<string, Phaser.GameObjects.Text>;
  rewardBlockColor(rewardBlock: RewardBlockState): number;
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
    ignoreFromUiCamera(scene, strip);
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
  const checkpointBottomY = (supportTopY ?? checkpoint.rect.y + checkpoint.rect.height) + 10;

  sprite
    .setPosition(checkpoint.rect.x, checkpointBottomY - checkpoint.rect.height)
    .setDepth(CHECKPOINT_VISUAL_DEPTH)
    .setAlpha(1);
  drawCheckpointGraphic(sprite, {
    width: checkpoint.rect.width,
    height: checkpoint.rect.height,
    color: tintColor,
    activated: checkpoint.activated,
    brightColor: scene.retroPalette.border,
    borderColor: scene.retroPalette.border,
  });

  syncCheckpointContactStrip(scene, checkpoint, tintColor, checkpointBottomY);
}

export function syncCollectible(scene: GameSceneRewardRenderingContext, collectible: CollectibleState): void {
  const sprite = scene.collectibleSprites.get(collectible.id);
  if (!sprite) return;
  sprite.setVisible(!collectible.collected);
  if (!collectible.collected) {
    const collectibleStep = getRetroMotionStep(scene.time.now + collectible.position.x, 140, 2);
    const scale = collectibleStep === 0 ? 1 : 1.12;
    const alpha = collectibleStep === 0 ? 1 : 0.86;
    sprite.setPosition(collectible.position.x - 8, collectible.position.y - 8);
    drawCollectibleGraphic(sprite, {
      color: scene.retroPalette.warm,
      brightColor: scene.retroPalette.cool,
      borderColor: scene.retroPalette.border,
      alpha,
      scale,
    });
  }
}

export function syncRewardBlock(scene: GameSceneRewardRenderingContext, rewardBlock: RewardBlockState): void {
  const sprite = scene.rewardBlockSprites.get(rewardBlock.id);
  const icon = scene.rewardBlockIcons.get(rewardBlock.id);
  if (!sprite || !icon) {
    return;
  }

  const flashProgress = Phaser.Math.Clamp(rewardBlock.hitFlashMs / 180, 0, 1);
  const bumpOffset = flashProgress > 0 ? Math.round((10 * flashProgress) / 2) * 2 : 0;
  const alpha = rewardBlock.used ? 0.35 : 1;

  sprite.setPosition(rewardBlock.x, rewardBlock.y - bumpOffset).setAlpha(alpha);
  drawRewardBlockGraphic(sprite, {
    rewardBlock,
    color: scene.rewardBlockColor(rewardBlock),
    borderColor: scene.retroPalette.border,
    brightColor: scene.retroPalette.cool,
    flashProgress,
    alpha,
  });
  icon.setPosition(rewardBlock.x, rewardBlock.y - bumpOffset).setAlpha(alpha);
  drawRewardBlockIconGraphic(icon, {
    rewardBlock,
    color: scene.rewardBlockColor(rewardBlock),
    borderColor: scene.retroPalette.border,
    brightColor: scene.retroPalette.bright,
    alpha,
  });
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
    ignoreFromUiCamera(scene, text);
    scene.rewardRevealTexts.set(rewardReveal.id, text);
  }

  const alpha = Phaser.Math.Clamp(rewardReveal.timerMs / rewardReveal.durationMs, 0, 1);
  const floatOffset = Math.round((((1 - alpha) * 24) / 3)) * 3;
  text.setText(scene.rewardRevealText(rewardReveal));
  text.setColor(scene.rewardRevealColor(rewardReveal));
  text.setPosition(rewardReveal.x, rewardReveal.y - floatOffset);
  text.setAlpha(alpha);
}
