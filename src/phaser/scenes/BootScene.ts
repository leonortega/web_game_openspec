import * as Phaser from 'phaser';

import { getAllActiveSustainedMusic } from '../../audio/musicAssets';
import { createRetroPresentationPalette } from '../view/retroPresentation';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    for (const track of getAllActiveSustainedMusic()) {
      this.load.audio(track.assetKey, track.localAssetPath);
    }
  }

  create(): void {
    const retro = createRetroPresentationPalette({ accent: 0x8fdff2 });
    this.createPixelTexture('player', 26, 42, (context) => {
      this.outlinedRect(context, 7, 2, 12, 11, '#f7f3d6');
      this.fillRect(context, 9, 4, 8, 5, '#8fdff2');
      this.fillRect(context, 10, 10, 6, 2, '#31451d');
      this.fillRect(context, 8, 13, 10, 2, '#f5cf64');
      this.outlinedRect(context, 5, 15, 16, 14, '#f7f3d6');
      this.fillRect(context, 7, 17, 12, 4, '#8fdff2');
      this.fillRect(context, 7, 22, 5, 5, '#f5cf64');
      this.fillRect(context, 14, 22, 5, 5, '#f5cf64');
      this.fillRect(context, 10, 23, 6, 4, '#31451d');
      this.outlinedRect(context, 7, 29, 4, 10, '#f5cf64');
      this.outlinedRect(context, 15, 29, 4, 10, '#f5cf64');
      this.fillRect(context, 7, 33, 12, 2, '#31451d');
      this.fillRect(context, 8, 38, 3, 2, '#11141b');
      this.fillRect(context, 15, 38, 3, 2, '#11141b');
      this.fillRect(context, 4, 18, 2, 8, '#31451d');
      this.fillRect(context, 20, 18, 2, 8, '#31451d');
    });
    this.createPixelTexture('walker', 30, 28, (context) => {
      this.outlinedRect(context, 5, 7, 18, 11, '#f0c6a1');
      this.fillRect(context, 7, 10, 10, 3, '#11141b');
      this.fillRect(context, 19, 9, 3, 4, '#e97652');
      this.fillRect(context, 8, 14, 11, 2, '#e97652');
      this.fillRect(context, 6, 17, 16, 2, '#11141b');
      this.outlinedRect(context, 8, 19, 4, 7, '#f7f3d6');
      this.outlinedRect(context, 16, 19, 4, 7, '#f7f3d6');
      this.fillRect(context, 4, 14, 2, 6, '#11141b');
      this.fillRect(context, 23, 14, 3, 5, '#11141b');
      this.fillRect(context, 11, 5, 5, 2, '#f7f3d6');
    });
    this.createPixelTexture('hopper', 30, 28, (context) => {
      this.outlinedRect(context, 7, 7, 16, 10, '#dfe8bf');
      this.fillRect(context, 10, 9, 10, 4, '#31451d');
      this.fillRect(context, 11, 14, 8, 2, '#f5cf64');
      this.outlinedRect(context, 4, 17, 6, 8, '#f5cf64');
      this.outlinedRect(context, 20, 17, 6, 8, '#f5cf64');
      this.fillRect(context, 11, 4, 8, 3, '#f7f3d6');
      this.fillRect(context, 8, 14, 2, 4, '#f7f3d6');
      this.fillRect(context, 20, 14, 2, 4, '#f7f3d6');
      this.fillRect(context, 5, 13, 3, 2, '#11141b');
      this.fillRect(context, 22, 13, 3, 2, '#11141b');
    });
    this.createPixelTexture('turret', 28, 38, (context) => {
      this.outlinedRect(context, 9, 3, 10, 14, '#f7f3d6');
      this.fillRect(context, 11, 6, 6, 5, '#8fdff2');
      this.fillRect(context, 10, 12, 8, 2, '#11141b');
      this.outlinedRect(context, 7, 17, 14, 9, '#f0c6a1');
      this.fillRect(context, 9, 19, 10, 3, '#31451d');
      this.outlinedRect(context, 19, 10, 6, 4, '#f7f3d6');
      this.fillRect(context, 21, 11, 4, 2, '#11141b');
      this.outlinedRect(context, 5, 26, 18, 8, '#c6d2bf');
      this.fillRect(context, 9, 28, 10, 2, '#11141b');
      this.fillRect(context, 7, 31, 14, 2, '#31451d');
      this.fillRect(context, 8, 34, 3, 3, '#f5cf64');
      this.fillRect(context, 17, 34, 3, 3, '#f5cf64');
    });
    this.createPixelTexture('charger', 34, 30, (context) => {
      this.outlinedRect(context, 6, 8, 20, 12, '#e97652');
      this.fillRect(context, 9, 11, 10, 3, '#4d2312');
      this.fillRect(context, 8, 16, 12, 2, '#f5cf64');
      this.fillRect(context, 22, 10, 4, 5, '#f7f3d6');
      this.outlinedRect(context, 25, 10, 5, 6, '#f0c6a1');
      this.outlinedRect(context, 8, 20, 4, 7, '#f5cf64');
      this.outlinedRect(context, 18, 20, 4, 7, '#f5cf64');
      this.fillRect(context, 4, 12, 2, 4, '#f7f3d6');
      this.fillRect(context, 0, 13, 4, 2, '#11141b');
      this.fillRect(context, 28, 11, 4, 3, '#11141b');
    });
    this.createPixelTexture('flyer', 34, 24, (context) => {
      this.outlinedRect(context, 11, 5, 12, 10, '#9fdae8');
      this.fillRect(context, 14, 8, 6, 3, '#173848');
      this.fillRect(context, 12, 12, 10, 2, '#f5cf64');
      this.outlinedRect(context, 4, 11, 8, 4, '#f7f3d6');
      this.outlinedRect(context, 22, 11, 8, 4, '#f7f3d6');
      this.fillRect(context, 0, 13, 6, 2, '#8fdff2');
      this.fillRect(context, 28, 13, 6, 2, '#8fdff2');
      this.fillRect(context, 13, 0, 8, 4, '#f7f3d6');
      this.fillRect(context, 15, 16, 4, 4, '#f5cf64');
      this.fillRect(context, 9, 4, 2, 2, '#f7f3d6');
      this.fillRect(context, 23, 4, 2, 2, '#f7f3d6');
    });
    this.createPixelTexture('projectile', 12, 12, (context) => {
      this.outlinedRect(context, 4, 1, 4, 10, '#f7f3d6');
      this.fillRect(context, 5, 3, 2, 6, '#ffb34e');
      this.fillRect(context, 2, 4, 8, 4, '#f5cf64');
    });
    this.createPixelTexture('retro-particle', 4, 4, (context) => {
      this.fillRect(context, 1, 0, 2, 4, '#fff7d8');
      this.fillRect(context, 0, 1, 4, 2, '#f5cf64');
    });
    this.createPixelTexture('collectible', 20, 20, (context) => {
      this.outlinedRect(context, 4, 4, 12, 12, '#f5cf64');
      this.fillRect(context, 6, 6, 8, 8, '#f7f3d6');
      this.fillRect(context, 8, 4, 4, 12, '#fff7d8');
      this.fillRect(context, 4, 8, 12, 4, '#fff7d8');
    });
    this.createPixelTexture('checkpoint', 24, 80, (context) => {
      this.outlinedRect(context, 7, 4, 10, 12, '#f7f3d6');
      this.fillRect(context, 9, 7, 6, 4, '#8fdff2');
      this.outlinedRect(context, 9, 16, 6, 50, '#c6d2bf');
      this.fillRect(context, 7, 24, 10, 4, '#11141b');
      this.fillRect(context, 7, 40, 10, 4, '#11141b');
      this.fillRect(context, 8, 18, 8, 2, '#31451d');
      this.fillRect(context, 8, 56, 8, 2, '#31451d');
      this.outlinedRect(context, 4, 68, 16, 8, '#f5cf64');
      this.fillRect(context, 8, 70, 8, 4, '#fff7d8');
    });
    this.createPixelTexture('exit', 48, 80, (context) => {
      this.outlinedRect(context, 6, 8, 10, 64, '#f7f3d6');
      this.outlinedRect(context, 16, 8, 24, 12, '#c6d2bf');
      this.outlinedRect(context, 20, 24, 16, 42, `#${retro.warm.toString(16).padStart(6, '0')}`);
      this.fillRect(context, 23, 28, 10, 34, '#fff7d8');
      this.fillRect(context, 18, 12, 20, 4, '#8fdff2');
      this.fillRect(context, 20, 22, 16, 2, '#11141b');
      this.fillRect(context, 22, 34, 12, 2, '#f5cf64');
      this.fillRect(context, 22, 50, 12, 2, '#f5cf64');
      this.fillRect(context, 8, 18, 6, 48, '#11141b');
    });
    this.scene.start('menu');
  }

  private createPixelTexture(
    key: string,
    width: number,
    height: number,
    draw: (context: CanvasRenderingContext2D) => void,
  ): void {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error(`Unable to create placeholder texture ${key}`);
    }

    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    draw(context);

    this.textures.addCanvas(key, canvas);
  }

  private outlinedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
  ): void {
    context.fillStyle = '#11141b';
    context.fillRect(x - 1, y - 1, width + 2, height + 2);
    context.fillStyle = fill;
    context.fillRect(x, y, width, height);
  }

  private fillRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
  ): void {
    context.fillStyle = fill;
    context.fillRect(x, y, width, height);
  }
}
