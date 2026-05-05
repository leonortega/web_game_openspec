import * as Phaser from 'phaser';

export function createOptimizedSprite(scene: Phaser.Scene, x: number, y: number, key: string): Phaser.GameObjects.Sprite {
  const addAny = (scene as any).add;
  if (addAny && typeof addAny.gpuSprite === 'function') {
    try {
      return addAny.gpuSprite(x, y, key) as Phaser.GameObjects.Sprite;
    } catch (e) {
      // fallback
    }
  }
  return scene.add.sprite(x, y, key);
}

export default createOptimizedSprite;
