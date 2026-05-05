import * as Phaser from 'phaser';
import type { CheckpointState, EnemyState, PlatformState } from '../../../game/simulation/state';

export type GameSceneDiagnosticContext = Phaser.Scene & {
  diagnosticGraphics?: Phaser.GameObjects.Graphics;
};

/**
 * Diagnostic overlay rendering for identifying object positioning issues.
 * DEBUGGING ONLY - Can be disabled by setting renderDiagnostics flag to false in GameScene.
 * 
 * Renders colored lines/rectangles showing:
 * - Green: platform top edges
 * - Red: checkpoint bottom edges  
 * - Blue: grounded enemy bottom edges
 * 
 * These show where objects SHOULD be positioned according to state.
 * Compare visual offsets against rendered sprites to identify gaps.
 */
export function renderDiagnosticOverlay(
  scene: GameSceneDiagnosticContext,
  platforms: PlatformState[],
  checkpoints: CheckpointState[],
  enemies: EnemyState[],
): void {
  if (!scene.diagnosticGraphics) {
    scene.diagnosticGraphics = scene.add
      .graphics()
      .setDepth(9999)
      .setScrollFactor(1, 1) // Follow camera scrolling
      .clear();
  }

  const g = scene.diagnosticGraphics;
  g.clear();
  const platformTopById = new Map(platforms.map((platform) => [platform.id, platform.y] as const));

  // Platform tops (green) - draw as thin rectangles for visibility
  g.fillStyle(0x00ff00, 0.5);
  for (const platform of platforms) {
    g.fillRect(platform.x, platform.y - 1, platform.width, 2);
  }

  // Checkpoint bottoms (red) - draw as thin rectangles
  g.fillStyle(0xff0000, 0.5);
  for (const checkpoint of checkpoints) {
    const supportTopY = checkpoint.supportPlatformId ? platformTopById.get(checkpoint.supportPlatformId) : undefined;
    const bottomY = supportTopY ?? checkpoint.rect.y + checkpoint.rect.height;
    g.fillRect(checkpoint.rect.x, bottomY - 1, checkpoint.rect.width, 2);
  }

  // Enemy bottoms (blue) - for grounded enemies only - draw as thin rectangles
  g.fillStyle(0x0088ff, 0.5);
  for (const enemy of enemies) {
    if (enemy.kind === 'flyer') {
      continue; // Skip flying enemies
    }
    const bottomY = enemy.y + enemy.height;
    g.fillRect(enemy.x, bottomY - 1, enemy.width, 2);
  }
}

export function clearDiagnosticOverlay(scene: GameSceneDiagnosticContext): void {
  if (scene.diagnosticGraphics) {
    scene.diagnosticGraphics.clear();
  }
}
