import * as Phaser from 'phaser';
import { SceneBridge, type SessionTelemetrySummary } from '../adapters/sceneBridge';
import { SynthAudio } from '../audio/SynthAudio';
import { AUDIO_CUES } from '../../audio/audioContract';
import { playMenuInteractionCue } from '../audio/sceneAudio';
import { applyConfiguredRetroPostFxToCamera } from '../retroPostFx';
import {
  bindScaleOuter,
  createNinePatch,
  createTagText,
  getAuthoredGameSize,
  getViewportMetrics,
  RETRO_TEXT_STYLE,
  UI_COLORS,
} from '../ui/rexUiTheme';

const formatDuration = (milliseconds: number | null): string => {
  if (milliseconds == null || milliseconds <= 0) {
    return '--';
  }

  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const buildTelemetryCopy = (summary: SessionTelemetrySummary): string => {
  const header = [
    '[title]Session Totals[/title]',
    `[danger]Deaths[/danger]: ${summary.totalDeaths}`,
    `[accent]Checkpoint retries[/accent]: ${summary.totalCheckpointRetries}`,
    `[ok]Secret routes used[/ok]: ${summary.totalSecretRouteUses}`,
    `[ok]Objectives cleared[/ok]: ${summary.totalObjectiveCompletions}`,
  ].join('\n');

  if (summary.stages.length === 0) {
    return `${header}\n\n[dim]No tracked telemetry events fired during this campaign session.[/dim]`;
  }

  const stageBlocks = summary.stages.map((stage) => {
    const lines = [`[title]${stage.stageName}[/title]`];

    if (stage.deathsBySegment.length > 0) {
      lines.push(
        `[danger]Deaths by segment[/danger]: ${stage.deathsBySegment.map((entry) => `${entry.title} x${entry.count}`).join(', ')}`,
      );
    }

    if (stage.checkpointRetries.length > 0) {
      lines.push(
        `[accent]Checkpoint retries[/accent]: ${stage.checkpointRetries.map((entry) => `${entry.checkpointId} x${entry.count}`).join(', ')}`,
      );
    }

    if (stage.secretRouteUses.length > 0) {
      lines.push(
        `[ok]Secret routes[/ok]: ${stage.secretRouteUses.map((entry) => `${entry.title} x${entry.count}`).join(', ')}`,
      );
    }

    if (stage.objective) {
      lines.push(
        `[ok]Objective timing[/ok]: ${stage.objective.completions} clear, avg ${formatDuration(stage.objective.averageCompletionMs)}, last ${formatDuration(stage.objective.lastCompletionMs)}`,
      );
    }

    return lines.join('\n');
  });

  return [header, ...stageBlocks].join('\n\n');
};

export class TelemetrySummaryScene extends Phaser.Scene {
  private audio!: SynthAudio;

  constructor() {
    super('telemetry-summary');
  }

  create(): void {
    const bridge = this.registry.get('bridge') as SceneBridge;
    const authoredGameSize = getAuthoredGameSize(this);
    const summary = bridge.getSessionTelemetrySummary();

    this.audio = new SynthAudio(
      this,
      () => bridge.getSession().getState().progress.runSettings.musicVolume,
      () => bridge.getSession().getState().progress.runSettings.sfxVolume,
    );
    this.audio.startMenuMusic();
    applyConfiguredRetroPostFxToCamera(this.game, this.cameras.main);
    bindScaleOuter(this);

    const baseBackdrop = this.add.rectangle(0, 0, 10, 10, 0x05090d, 1).setDepth(0.5);
    const baseBackdropGlow = this.add.rectangle(0, 0, 10, 10, 0x071014, 0.96).setDepth(1.6);
    const menuBackdrop = this.add.rectangle(0, 0, 10, 10, 0x0a1116, 0.985).setDepth(1.75);
    const starSeeds = [
      { offsetX: -364, offsetY: 40, color: 0xf7f3d6, alpha: 0.95 },
      { offsetX: -322, offsetY: 70, color: 0x8fdff2, alpha: 0.82 },
      { offsetX: 286, offsetY: 64, color: 0xf0b84b, alpha: 0.9 },
      { offsetX: 344, offsetY: 98, color: 0xf7f3d6, alpha: 0.88 },
      { offsetX: -396, offsetY: 108, color: 0xf7f3d6, alpha: 0.7 },
      { offsetX: 212, offsetY: 46, color: 0x8fdff2, alpha: 0.9 },
      { offsetX: -248, offsetY: 88, color: 0xf0b84b, alpha: 0.76 },
      { offsetX: 368, offsetY: 54, color: 0xf7f3d6, alpha: 0.72 },
    ];
    const backdropStars = starSeeds.map(({ color, alpha }) =>
      this.add.rectangle(0, 0, 3, 3, color, alpha).setDepth(1.76),
    );

    const menuFrame = createNinePatch(this, 0, 0, 10, 10).setDepth(2);
    const menuTitleText = this.add
      .text(0, 0, 'Orbital Survey', {
        ...RETRO_TEXT_STYLE,
        fontSize: '26px',
        color: '#f0b84b',
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setDepth(3);
    const titleText = this.add
      .text(0, 0, 'Session Debrief', {
        ...RETRO_TEXT_STYLE,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);
    const subtitleText = this.add
      .text(0, 0, 'Campaign telemetry for this survey session.', {
        ...RETRO_TEXT_STYLE,
        fontSize: '11px',
        color: '#bcc3a6',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(3);

    let panelWidth = 760;
    let panelHeight = 326;
    let viewportWidth = 660;
    let viewportHeight = 224;
    const panelBackground = createNinePatch(this, 0, 0, panelWidth, panelHeight).setDepth?.(3)
      ?? createNinePatch(this, 0, 0, panelWidth, panelHeight);
    const reportText = createTagText(this, 0, 0, buildTelemetryCopy(summary), viewportWidth, {
      fontSize: '11px',
      lineSpacing: 8,
    }).setDepth(4);
    let scrollOffset = 0;
    let maxScroll = Math.max(0, reportText.height - viewportHeight);
    const applyScroll = (): void => {
      reportText.setPosition(-viewportWidth / 2, -viewportHeight / 2 - scrollOffset);
      reportText.setCrop?.(0, scrollOffset, viewportWidth, viewportHeight);
    };
    const scroll = (direction: -1 | 1): void => {
      scrollOffset = Phaser.Math.Clamp(scrollOffset + direction * 28, 0, maxScroll);
      applyScroll();
    };
    applyScroll();

    const reportArea = this.add.container(0, 0, [panelBackground, reportText]).setDepth(3);
    const footerText = this.add
      .text(0, 0, 'ESC returns to the main menu. Mouse wheel or Up / Down scroll.', {
        ...RETRO_TEXT_STYLE,
        fontSize: '9px',
        color: UI_COLORS.dimText,
        letterSpacing: 1,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(3);

    const syncLayout = (gameSize: { width: number; height: number }): void => {
      const { centerX, centerY, width, height, safeInsetX, safeInsetY } = getViewportMetrics(this, gameSize);
      const frameWidth = Math.min(Math.max(360, width - safeInsetX * 2), 928);
      const frameHeight = Math.min(Math.max(420, height - safeInsetY * 2), 704);
      const frameTop = centerY - frameHeight / 2;

      baseBackdrop.setPosition(centerX, centerY).setSize(width + 24, height + 24);
      baseBackdropGlow.setPosition(centerX, centerY).setSize(width + 24, height + 24);
      menuBackdrop.setPosition(centerX, centerY).setSize(Math.min(width - 12, 1000), Math.min(height - 12, 740));
      if (typeof (menuFrame as any).resize === 'function') {
        (menuFrame as any).resize(frameWidth, frameHeight);
      } else {
        (menuFrame as any).setSize?.(frameWidth, frameHeight);
      }
      menuFrame.setPosition(centerX, centerY);

      backdropStars.forEach((star, index) => {
        const seed = starSeeds[index];
        star.setPosition(centerX + seed.offsetX, frameTop + seed.offsetY);
      });

      menuTitleText.setPosition(centerX, frameTop + 48);
      titleText.setPosition(centerX, frameTop + 90);
      subtitleText.setPosition(centerX, frameTop + 128);

      panelWidth = Math.min(780, Math.max(300, frameWidth - 72));
      panelHeight = Math.min(420, Math.max(240, frameHeight - 208));
      viewportWidth = Math.max(240, panelWidth - 96);
      viewportHeight = Math.max(140, panelHeight - 72);
      if (typeof (panelBackground as any).resize === 'function') {
        (panelBackground as any).resize(panelWidth, panelHeight);
      } else {
        (panelBackground as any).setSize?.(panelWidth, panelHeight);
      }
      reportText.setWordWrapWidth?.(viewportWidth);
      maxScroll = Math.max(0, reportText.height - viewportHeight);
      scrollOffset = Phaser.Math.Clamp(scrollOffset, 0, maxScroll);
      applyScroll();
      reportArea.setPosition(centerX, frameTop + 350);

      footerText.setPosition(centerX, centerY + frameHeight / 2 - 20);
      footerText.setWordWrapWidth(Math.max(280, Math.min(760, frameWidth - 120)), true);
    };

    const handleResize = (): void => {
      syncLayout(authoredGameSize);
    };
    handleResize();
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);

    this.input.keyboard?.on('keydown-ESC', () => {
      void playMenuInteractionCue(this.audio, AUDIO_CUES.menuBack);
      this.scene.start('menu');
    });
    this.input.keyboard?.on('keydown-UP', () => scroll(-1));
    this.input.keyboard?.on('keydown-DOWN', () => scroll(1));
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gos: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (dy === 0) {
        return;
      }
      scroll(dy > 0 ? 1 : -1);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
      this.audio?.stopMusic();
    });
  }
}
