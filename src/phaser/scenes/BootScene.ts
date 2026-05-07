import * as Phaser from 'phaser';

import { registerBootAudio } from '../assets/bootAudio';
import { registerBootTextures } from '../assets/bootTextures';
import { SceneBridge } from '../adapters/sceneBridge';
import { setCrtFilterEnabled } from '../retroPostFx';
import { RETRO_FONT_FAMILY } from '../view/retroPresentation';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    registerBootAudio(this);
  }

  create(): void {
    const loadingText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Loading survey archive...', {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '16px',
        color: '#f7f3d6',
      })
      .setOrigin(0.5);

    registerBootTextures(this);
    const bridge = this.registry.get('bridge') as SceneBridge;
    void bridge.loadPersistedProgress().finally(() => {
      setCrtFilterEnabled(this.game, bridge.getSession().getState().progress.runSettings.crtEnabled);
      loadingText.destroy();
      this.scene.start('menu');
    });
  }
}
