import * as Phaser from 'phaser';
import {
  getPrimaryPowerVariant,
  PLAYER_POWER_VARIANTS,
} from '../../game/simulation/state';
import { SceneBridge } from '../adapters/sceneBridge';
import { SynthAudio } from '../audio/SynthAudio';
import { ensureBootTexturesRegistered } from '../assets/bootTextures';
import { runUnlockedAudioAction } from '../audio/sceneAudio';
import { applyConfiguredRetroPostFxToCamera } from '../retroPostFx';
import { bindScaleOuter, createNinePatch, getAuthoredGameSize, getViewportMetrics, RETRO_TEXT_STYLE, UI_COLORS } from '../ui/rexUiTheme';

const INTRO_DURATION_MS = 2400;
const describePowerVariant = (value: keyof typeof PLAYER_POWER_VARIANTS): string => {
  if (value === 'base') {
    return 'Regular Astronaut';
  }
  if (value === 'doubleJump') {
    return 'Thruster Burst';
  }
  if (value === 'shooter') {
    return 'Plasma Blaster';
  }
  if (value === 'invincible') {
    return 'Shield Field';
  }
  return 'Booster Dash';
};

export class StageIntroScene extends Phaser.Scene {
  private audio?: SynthAudio;

  private introEvent?: Phaser.Time.TimerEvent;

  private accentBurstCount = 0;

  private accentTweenActive = false;

  constructor() {
    super('stage-intro');
  }

  create(): void {
    const bridge = this.registry.get('bridge') as SceneBridge;
    const authoredGameSize = getAuthoredGameSize(this);
    const state = bridge.getSession().getState();
    const stagePresentation = state.stage.presentation;
    const stageSampleCount = state.stageRuntime.totalCoins;
    const powerVariant = state.player.presentationPower ?? getPrimaryPowerVariant(state.progress.activePowers, state.progress.powerTimers);
    const variantStyle = PLAYER_POWER_VARIANTS[powerVariant];
    this.audio = new SynthAudio(
      this,
      () => bridge.getSession().getState().progress.runSettings.musicVolume,
      () => bridge.getSession().getState().progress.runSettings.sfxVolume,
    );
    ensureBootTexturesRegistered(this);
    applyConfiguredRetroPostFxToCamera(this.game, this.cameras.main);
    bindScaleOuter(this);

    const baseBackdrop = this.add.rectangle(0, 0, 10, 10, 0x05090d, 1).setDepth(0.5);
    const baseBackdropGlow = this.add.rectangle(0, 0, 10, 10, 0x071014, 0.96).setDepth(0.6);
    const staticStars = [
      { x: 74, y: 58, size: 3, color: 0xf7f3d6, alpha: 0.95 },
      { x: 118, y: 96, size: 2, color: 0x8fdff2, alpha: 0.82 },
      { x: 188, y: 64, size: 2, color: 0xf0b84b, alpha: 0.76 },
      { x: 246, y: 118, size: 3, color: 0xf7f3d6, alpha: 0.9 },
      { x: 332, y: 78, size: 2, color: 0x8fdff2, alpha: 0.72 },
      { x: 406, y: 102, size: 3, color: 0xf7f3d6, alpha: 0.88 },
      { x: 514, y: 70, size: 2, color: 0xf0b84b, alpha: 0.8 },
      { x: 612, y: 90, size: 3, color: 0xf7f3d6, alpha: 0.92 },
      { x: 704, y: 60, size: 2, color: 0x8fdff2, alpha: 0.78 },
      { x: 812, y: 112, size: 3, color: 0xf7f3d6, alpha: 0.86 },
      { x: 892, y: 82, size: 2, color: 0xf0b84b, alpha: 0.72 },
      { x: 948, y: 54, size: 3, color: 0xf7f3d6, alpha: 0.9 },
      { x: 96, y: 188, size: 2, color: 0x8fdff2, alpha: 0.74 },
      { x: 214, y: 226, size: 3, color: 0xf7f3d6, alpha: 0.82 },
      { x: 684, y: 208, size: 2, color: 0xf0b84b, alpha: 0.7 },
      { x: 826, y: 242, size: 3, color: 0xf7f3d6, alpha: 0.78 },
    ];
    const menuStars = staticStars.map(({ size, color, alpha }) => this.add.rectangle(0, 0, size, size, color, alpha).setDepth(0.61));
    const frame = createNinePatch(this, 0, 0, 10, 10).setDepth(2);

    const sectorText = this.add
      .text(0, 0, stagePresentation.sectorLabel, {
        ...RETRO_TEXT_STYLE,
        fontSize: '14px',
        color: '#f0b84b',
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setDepth(3);

    const stageNameText = this.add
      .text(0, 0, state.stage.name, {
        ...RETRO_TEXT_STYLE,
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);

    const loadoutTitleText = this.add
      .text(0, 0, 'Survey Loadout', {
        ...RETRO_TEXT_STYLE,
        fontSize: '12px',
        color: '#f0b84b',
      })
      .setOrigin(0, 0)
      .setDepth(3);
    const loadoutBodyText = this.add
      .text(0, 0, `Samples: ${stageSampleCount}\nBiome: ${stagePresentation.biomeLabel}\nStatus: ${describePowerVariant(powerVariant)}`, {
        ...RETRO_TEXT_STYLE,
        fontSize: '11px',
        color: UI_COLORS.text,
        lineSpacing: 8,
        wordWrap: { width: 280, useAdvancedWrap: true },
      })
      .setOrigin(0, 0)
      .setDepth(3);

    const astronaut = this.add
      .sprite(0, 0, 'player-sheet', '0')
      .setDisplaySize(132, 168)
      .setTint(variantStyle.bodyColor)
      .setOrigin(0.5, 1)
      .setDepth(3);

    const astronautShadow = this.add.ellipse(0, 0, 132, 20, 0x121a21, 0.3).setDepth(2.5);
    const astronautDetail = this.add.rectangle(0, 0, 8, 18, variantStyle.detailColor, 0.88).setDepth(3.5);
    const astronautAccent = this.add.rectangle(0, 0, 14, 8, variantStyle.accentColor, 0.92).setDepth(3.6);
    const astronautAura = this.add.ellipse(0, 0, 164, 206, variantStyle.auraColor ?? variantStyle.accentColor, 0.12).setDepth(2);

    const syncLayout = (gameSize: { width: number; height: number }): void => {
      const { centerX, centerY, width, height, safeInsetX, safeInsetY } = getViewportMetrics(this, gameSize);
      const frameWidth = Math.min(Math.max(360, width - safeInsetX * 2 - 32), 860);
      const frameHeight = Math.min(Math.max(280, height - safeInsetY * 2 - 32), 430);
      const frameLeft = centerX - frameWidth / 2;
      const frameTop = centerY - frameHeight / 2;
      const textColumnLeft = frameLeft + Math.max(28, frameWidth * 0.1);
      const astronautX = frameLeft + frameWidth * 0.72;
      const astronautY = frameTop + frameHeight - 24;

      baseBackdrop.setPosition(centerX, centerY).setSize(width + 24, height + 24);
      baseBackdropGlow.setPosition(centerX, centerY).setSize(width + 24, height + 24);
      menuStars.forEach((star, index) => {
        const seed = staticStars[index];
        star.setPosition(frameLeft + Math.min(seed.x, frameWidth - 20), frameTop + Math.min(seed.y, frameHeight - 20));
      });
      if (typeof frame.resize === 'function') {
        frame.resize(frameWidth, frameHeight);
      } else if (typeof frame.setSize === 'function') {
        frame.setSize(frameWidth, frameHeight);
      }
      frame.setPosition(centerX, centerY);

      sectorText.setPosition(centerX, frameTop + 52);
      stageNameText.setPosition(centerX, frameTop + 96);
      loadoutTitleText.setPosition(textColumnLeft, frameTop + 154);
      loadoutBodyText.setPosition(textColumnLeft, frameTop + 182);
      loadoutBodyText.setWordWrapWidth(Math.max(200, Math.min(320, frameWidth * 0.38)), true);

      astronaut.setPosition(astronautX, astronautY);
      astronautAura.setPosition(astronautX, astronautY - 60);
      astronautShadow.setPosition(astronautX, astronautY - 8);
      astronautDetail.setPosition(astronautX - 24, astronautY - 88);
      astronautAccent.setPosition(astronautX - 24, astronautY - 70);
    };
    const handleResize = (): void => {
      syncLayout(authoredGameSize);
    };
    handleResize();
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);

    this.audio.playStageIntro(state.stage);
    const retryIntroAudio = () => {
      if (!this.audio) {
        return;
      }
      void runUnlockedAudioAction(this.audio, () => {
        this.audio?.playStageIntro(state.stage);
      });
    };
    this.input.keyboard?.once('keydown', retryIntroAudio);
    this.input.once('pointerdown', retryIntroAudio);

    this.introEvent = this.time.delayedCall(INTRO_DURATION_MS, () => {
      this.scene.start('game');
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
      this.introEvent?.remove(false);
      this.introEvent = undefined;
      this.accentTweenActive = false;
      this.audio?.stopMusic();
      this.audio = undefined;
    });
  }

  getDebugSnapshot(): { accentBurstCount: number; accentTweenActive: boolean; accentVisible: boolean; accentMode: string } {
    return {
      accentBurstCount: this.accentBurstCount,
      accentTweenActive: this.accentTweenActive,
      accentVisible: false,
      accentMode: 'none',
    };
  }
}
