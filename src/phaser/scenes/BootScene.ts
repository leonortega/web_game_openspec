import * as Phaser from 'phaser';

import { registerBootAudio } from '../assets/bootAudio';
import { registerBootTextures } from '../assets/bootTextures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    registerBootAudio(this);
  }

  create(): void {
    registerBootTextures(this);
    this.scene.start('menu');
  }
}
