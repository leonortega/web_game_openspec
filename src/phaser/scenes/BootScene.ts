import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    this.createRectTexture('player', 26, 42, 0xf5cf64);
    this.createRectTexture('walker', 30, 28, 0xd96a4c);
    this.createRectTexture('hopper', 30, 28, 0x73c06b);
    this.createRectTexture('turret', 28, 38, 0x88a9ff);
    this.createRectTexture('charger', 34, 30, 0xff7f50);
    this.createRectTexture('flyer', 34, 24, 0x8ef0ff);
    this.createRectTexture('projectile', 12, 12, 0xffc15b);
    this.createRectTexture('collectible', 20, 20, 0x79f0ff);
    this.createRectTexture('checkpoint', 24, 80, 0x91f275);
    this.createRectTexture('exit', 48, 80, 0xf7f3d6);
    this.scene.start('menu');
  }

  private createRectTexture(key: string, width: number, height: number, color: number): void {
    const graphics = this.add.graphics();
    graphics.setVisible(false);
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(0, 0, width, height, 6);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}
