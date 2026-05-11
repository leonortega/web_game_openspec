import * as Phaser from 'phaser';

import { registerBootAudio } from '../assets/bootAudio';
import { registerBootTextures } from '../assets/bootTextures';
import { SceneBridge } from '../adapters/sceneBridge';
import { setCrtFilterEnabled } from '../retroPostFx';
import { bindScaleOuter, getAuthoredGameSize, getViewportMetrics } from '../ui/rexUiTheme';
import { RETRO_FONT_FAMILY } from '../view/retroPresentation';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    registerBootAudio(this);
  }

  create(): void {
    const authoredGameSize = getAuthoredGameSize(this);
    const loadingText = this.add
      .text(0, 0, 'Loading survey archive...', {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '16px',
        color: '#f7f3d6',
      })
      .setOrigin(0.5);
    bindScaleOuter(this);

    const syncLayout = (gameSize: { width: number; height: number }): void => {
      const { centerX, centerY } = getViewportMetrics(this, gameSize);
      loadingText.setPosition(centerX, centerY);
    };
    const handleResize = (): void => {
      syncLayout(authoredGameSize);
    };
    handleResize();
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);

    registerBootTextures(this);
    const bridge = this.registry.get('bridge') as SceneBridge;
    void bridge.loadPersistedProgress().finally(() => {
      setCrtFilterEnabled(this.game, bridge.getSession().getState().progress.runSettings.crtEnabled);
      loadingText.destroy();
      this.scene.start('menu');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }
}
