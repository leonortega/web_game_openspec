import * as Phaser from 'phaser';

import { createRetroPresentationPalette } from '../view/retroPresentation';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    const retro = createRetroPresentationPalette({ accent: 0x8fdff2 });
    this.createPixelTexture('player', 26, 42, (context) => {
      this.outlinedRect(context, 6, 4, 14, 22, '#f7f3d6');
      this.outlinedRect(context, 4, 10, 18, 8, '#8fdff2');
      this.outlinedRect(context, 8, 28, 4, 10, '#f5cf64');
      this.outlinedRect(context, 14, 28, 4, 10, '#f5cf64');
    });
    this.createPixelTexture('walker', 30, 28, (context) => {
      this.outlinedRect(context, 5, 6, 20, 12, '#ffffff');
      this.outlinedRect(context, 9, 18, 4, 8, '#ffffff');
      this.outlinedRect(context, 17, 18, 4, 8, '#ffffff');
      this.outlinedRect(context, 21, 8, 4, 4, '#11141b');
    });
    this.createPixelTexture('hopper', 30, 28, (context) => {
      this.outlinedRect(context, 6, 7, 18, 12, '#ffffff');
      this.outlinedRect(context, 3, 18, 6, 7, '#ffffff');
      this.outlinedRect(context, 21, 18, 6, 7, '#ffffff');
      this.outlinedRect(context, 11, 4, 8, 4, '#f7f3d6');
    });
    this.createPixelTexture('turret', 28, 38, (context) => {
      this.outlinedRect(context, 8, 5, 12, 20, '#ffffff');
      this.outlinedRect(context, 12, 0, 4, 5, '#f7f3d6');
      this.outlinedRect(context, 18, 10, 7, 4, '#ffffff');
      this.outlinedRect(context, 6, 25, 16, 9, '#ffffff');
    });
    this.createPixelTexture('charger', 34, 30, (context) => {
      this.outlinedRect(context, 5, 8, 22, 14, '#ffffff');
      this.outlinedRect(context, 24, 10, 6, 6, '#ffffff');
      this.outlinedRect(context, 8, 21, 5, 6, '#ffffff');
      this.outlinedRect(context, 16, 21, 5, 6, '#ffffff');
      this.outlinedRect(context, 2, 12, 4, 4, '#f7f3d6');
    });
    this.createPixelTexture('flyer', 34, 24, (context) => {
      this.outlinedRect(context, 4, 10, 26, 6, '#ffffff');
      this.outlinedRect(context, 11, 5, 12, 14, '#ffffff');
      this.outlinedRect(context, 13, 0, 8, 5, '#f7f3d6');
    });
    this.createPixelTexture('projectile', 12, 12, (context) => {
      this.outlinedRect(context, 4, 2, 4, 8, '#ffffff');
      this.outlinedRect(context, 2, 4, 8, 4, '#ffffff');
    });
    this.createPixelTexture('collectible', 20, 20, (context) => {
      this.outlinedRect(context, 4, 4, 12, 12, '#f5cf64');
      this.outlinedRect(context, 7, 7, 6, 6, '#f7f3d6');
    });
    this.createPixelTexture('checkpoint', 24, 80, (context) => {
      this.outlinedRect(context, 8, 4, 8, 12, '#ffffff');
      this.outlinedRect(context, 6, 16, 12, 52, '#ffffff');
      this.outlinedRect(context, 4, 68, 16, 8, '#f5cf64');
    });
    this.createPixelTexture('exit', 48, 80, (context) => {
      this.outlinedRect(context, 6, 8, 10, 64, '#ffffff');
      this.outlinedRect(context, 16, 8, 24, 12, '#ffffff');
      this.outlinedRect(context, 22, 24, 12, 40, `#${retro.warm.toString(16).padStart(6, '0')}`);
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
}
