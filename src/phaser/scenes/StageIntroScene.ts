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
import {
  RETRO_FONT_FAMILY,
  createRetroPresentationPalette,
  drawRetroBackdrop,
} from '../view/retroPresentation';

const INTRO_DURATION_MS = 2400;

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
    const state = bridge.getSession().getState();
    const { width, height } = this.scale;
    const stagePresentation = state.stage.presentation;
    const samplesTaken = state.progress.totalCoins;
    const retro = createRetroPresentationPalette(state.stage.palette);
    const powerVariant = state.player.presentationPower ?? getPrimaryPowerVariant(state.progress.activePowers, state.progress.powerTimers);
    const variantStyle = PLAYER_POWER_VARIANTS[powerVariant];
    this.audio = new SynthAudio(
      this,
      () => bridge.getSession().getState().progress.runSettings.musicVolume,
      () => bridge.getSession().getState().progress.runSettings.sfxVolume,
    );
    ensureBootTexturesRegistered(this);
    applyConfiguredRetroPostFxToCamera(this.game, this.cameras.main);

    drawRetroBackdrop(this, 0, 0, width, height, retro, 'transition');
    this.add
      .rectangle(width / 2, height / 2, width - 140, height - 140, retro.panel, 0.95)
      .setStrokeStyle(4, retro.border, 0.9);
    this.add.rectangle(width / 2, 106, width - 180, 44, retro.stageAccent, 0.92).setStrokeStyle(2, retro.ink, 1);
    this.add.rectangle(width / 2, 180, width - 220, 40, retro.panelAlt, 0.94).setStrokeStyle(2, retro.border, 0.78);
    this.add.rectangle(width / 2, height - 68, width - 180, 34, retro.skyline, 0.9).setStrokeStyle(2, retro.border, 0.55);

    this.add
      .text(width / 2, 108, stagePresentation.sectorLabel, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '16px',
        color: retro.shadow,
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 182, state.stage.name, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '30px',
        color: retro.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 228, `Muestras tomadas: ${samplesTaken}`, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '18px',
        color: '#f0b84b',
        align: 'center',
      })
      .setOrigin(0.5);

    const astronautX = width / 2 + 120;
    const astronautY = 410;
    const astronaut = this.add
      .sprite(astronautX, astronautY, 'player-sheet', '0')
      .setDisplaySize(128, 164)
      .setTint(variantStyle.bodyColor)
      .setOrigin(0.5, 1);

    this.add
      .rectangle(astronautX - 18, astronautY - 70, 12, 28, variantStyle.detailColor, 0.9)
      .setOrigin(0.5)
      .setVisible(powerVariant !== 'base');

    this.add
      .rectangle(astronautX + 18, astronautY - 70, 12, 28, variantStyle.detailColor, 0.9)
      .setOrigin(0.5)
      .setVisible(powerVariant === 'dash');

    // Double jump: downward-pointing rocket
    this.add
      .rectangle(astronautX + 20, astronautY - 50, 8, 24, variantStyle.accentColor, 0.95)
      .setOrigin(0.5)
      .setVisible(powerVariant === 'doubleJump');
    this.add
      .rectangle(astronautX + 12, astronautY - 38, 5, 8, variantStyle.accentColor, 0.9)
      .setOrigin(0.5)
      .setVisible(powerVariant === 'doubleJump');
    this.add
      .rectangle(astronautX + 28, astronautY - 38, 5, 8, variantStyle.accentColor, 0.9)
      .setOrigin(0.5)
      .setVisible(powerVariant === 'doubleJump');
    this.add
      .triangle(astronautX + 20, astronautY - 26, 0, -8, -5, 8, 5, 8, variantStyle.detailColor, 0.95)
      .setOrigin(0.5)
      .setVisible(powerVariant === 'doubleJump');

    this.add
      .rectangle(astronautX + 48, astronautY - 50, 18, 10, variantStyle.accentColor, 0.95)
      .setOrigin(0.5)
      .setVisible(powerVariant === 'shooter');

    this.add
      .ellipse(astronautX, astronautY - 60, 164, 206, variantStyle.auraColor ?? variantStyle.accentColor, 0.12)
      .setStrokeStyle(powerVariant === 'invincible' ? 2 : 0, variantStyle.detailColor, powerVariant === 'invincible' ? 0.46 : 0)
      .setVisible(powerVariant === 'invincible');

    astronaut.setDepth(10);

    const statusLabelMap: Record<string, string> = {
      base: 'Regular Astronaut',
      doubleJump: 'Double Jump Power',
      shooter: 'Plasma Blaster',
      dash: 'Booster Dash',
      invincible: 'Invincible Shield',
    };

    const statusLabel = statusLabelMap[powerVariant] || 'Unknown Status';
    this.add
      .text(width / 2 - 120, 280, `Status:\n${statusLabel}`, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '14px',
        color: '#ffffff',
        align: 'left',
        lineSpacing: 6,
      })
      .setOrigin(0, 0.5);

    this.add
      .text(width / 2, 526, stagePresentation.introLine, {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '14px',
        color: retro.dimText,
        align: 'center',
        wordWrap: { width: width - 240 },
      })
      .setOrigin(0.5);

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
