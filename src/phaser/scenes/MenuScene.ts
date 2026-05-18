import * as Phaser from 'phaser';
import { AUDIO_CUES } from '../../audio/audioContract';
import { stageDefinitions } from '../../game/content/stages';
import {
  DIFFICULTY_LABELS,
  ENEMY_PRESSURE_LABELS,
  getPowerHelpSummary,
  getPowerLabel,
} from '../../game/simulation/state';
import { SceneBridge } from '../adapters/sceneBridge';
import { SynthAudio } from '../audio/SynthAudio';
import { playMenuInteractionCue, runUnlockedAudioAction } from '../audio/sceneAudio';
import {
  applyConfiguredRetroPostFxToCamera,
  setCrtFilterEnabled,
} from '../retroPostFx';
import { bindScaleOuter, createNinePatch, getAuthoredGameSize, getViewportMetrics, RETRO_TEXT_STYLE, UI_COLORS } from '../ui/rexUiTheme';

type MenuView = 'root' | 'options' | 'help' | 'levelSelect';
type RootOptionId = 'primary' | 'options' | 'help';
type OptionsOptionId = 'difficulty' | 'enemies' | 'musicVolume' | 'sfxVolume' | 'crt';

type MenuButton = {
  id: string;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.GameObject;
  hitArea: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
};

const difficultyValues = ['casual', 'standard', 'expert'] as const;
const enemyValues = ['low', 'normal', 'high'] as const;
const rootOptions: RootOptionId[] = ['primary', 'options', 'help'];
const optionEntries: OptionsOptionId[] = ['difficulty', 'enemies', 'musicVolume', 'sfxVolume', 'crt'];
const stageShortcutKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'] as const;
const stageTierLabels = ['Easy', 'Easy+', 'Medium', 'Medium+', 'Hard', 'Hardest'] as const;

const HELP_TEXT = [
  '[title]Controls[/title]',
  'Move with [accent]Arrow keys[/accent] or [accent]A / D[/accent]. Jump with [accent]Up[/accent], [accent]W[/accent], or [accent]Space[/accent]. Trigger [accent]Booster Dash[/accent] with [accent]Shift[/accent] and fire the [accent]Plasma Blaster[/accent] with [accent]F[/accent] when unlocked.',
  '[title]Powers[/title]',
  `[ok]${getPowerLabel('doubleJump')}[/ok]: ${getPowerHelpSummary('doubleJump')}`,
  `[ok]${getPowerLabel('shooter')}[/ok]: ${getPowerHelpSummary('shooter')}`,
  `[ok]${getPowerLabel('invincible')}[/ok]: ${getPowerHelpSummary('invincible')}`,
  `[ok]${getPowerLabel('dash')}[/ok]: ${getPowerHelpSummary('dash')}`,
  '[title]Hazards[/title]',
  '[danger]Spikes[/danger]: Immediate contact damage, mostly guarding ledges and short landing zones.',
  '[danger]Turrets[/danger]: Flash before firing. Cross after the shot leaves the barrel.',
  '[danger]Walkers[/danger]: Patrol narrow pads and punish slow landings.',
  '[danger]Hoppers[/danger]: Leap in arcs that punish late jump timing.',
  '[danger]Chargers[/danger]: Bait the wind-up, then move through the lane they abandon.',
  '[danger]Flyers[/danger]: Sweep fixed heights and pressure optional upper routes.',
].join('\n\n');

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const stripMarkup = (value: string): string => value.replace(/\[[^\]]+\]/g, '');
const resizePanel = (panel: any, width: number, height: number): void => {
  if (typeof panel.resize === 'function') {
    panel.resize(width, height);
    return;
  }
  if (typeof panel.setSize === 'function') {
    panel.setSize(width, height);
  }
  if (typeof panel.setDisplaySize === 'function') {
    panel.setDisplaySize(width, height);
  }
};

const wrapIndex = (value: number, length: number): number => {
  if (length <= 0) {
    return 0;
  }

  return ((value % length) + length) % length;
};

export class MenuScene extends Phaser.Scene {
  private audio!: SynthAudio;

  private view: MenuView = 'root';

  private rootSelectedIndex = 0;

  private optionsSelectedIndex = 0;

  private levelSelectedIndex = 0;

  private createMenuButton(
    x: number,
    y: number,
    width: number,
    height: number,
    labelText: string,
    onHover: () => void,
    onClick: () => void,
  ): {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.GameObject;
    hitArea: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
  } {
    const background = createNinePatch(this, 0, 0, width, height).setDepth?.(3) ?? createNinePatch(this, 0, 0, width, height);
    const text = this.add
      .text(0, 0, labelText, {
        ...RETRO_TEXT_STYLE,
        fontSize: '16px',
        fontStyle: 'bold',
        color: UI_COLORS.text,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(4);

    const hitArea = this.add
      .rectangle(0, 0, width, height, 0xffffff, 0.001)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);

    hitArea.on('pointerover', onHover);
    hitArea.on('pointerdown', onClick);

    const container = this.add.container(x, y, [background, text, hitArea]).setDepth(3);
    return { container, background, hitArea, text };
  }

  constructor() {
    super('menu');
  }

  create(): void {
    const bridge = this.registry.get('bridge') as SceneBridge;
    const authoredGameSize = getAuthoredGameSize(this);
    this.audio = new SynthAudio(
      this,
      () => bridge.getSession().getState().progress.runSettings.musicVolume,
      () => bridge.getSession().getState().progress.runSettings.sfxVolume,
    );
    applyConfiguredRetroPostFxToCamera(this.game, this.cameras.main);
    bindScaleOuter(this);

    const baseBackdrop = this.add.rectangle(0, 0, 10, 10, 0x05090d, 1).setDepth(0.5);
    const baseBackdropGlow = this.add.rectangle(0, 0, 10, 10, 0x071014, 0.96).setDepth(1.6);
    [
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
    ].forEach(({ x, y, size, color, alpha }) => {
      this.add.rectangle(x, y, size, size, color, alpha).setDepth(1.61);
    });

    const menuBackdrop = this.add.rectangle(0, 0, 10, 10, 0x0a1116, 0.985).setDepth(1.75);
    const backdropStarSeeds = [
      { offsetX: -364, offsetY: 40, color: 0xf7f3d6, alpha: 0.95 },
      { offsetX: -322, offsetY: 70, color: 0x8fdff2, alpha: 0.82 },
      { offsetX: 286, offsetY: 64, color: 0xf0b84b, alpha: 0.9 },
      { offsetX: 344, offsetY: 98, color: 0xf7f3d6, alpha: 0.88 },
      { offsetX: -396, offsetY: 108, color: 0xf7f3d6, alpha: 0.7 },
      { offsetX: 212, offsetY: 46, color: 0x8fdff2, alpha: 0.9 },
      { offsetX: -248, offsetY: 88, color: 0xf0b84b, alpha: 0.76 },
      { offsetX: 368, offsetY: 54, color: 0xf7f3d6, alpha: 0.72 },
    ];
    const backdropStars = backdropStarSeeds.map(({ color, alpha }) =>
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
      .text(0, 0, 'Main Menu', {
        ...RETRO_TEXT_STYLE,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);

    const subtitleText = this.add
      .text(0, 0, '', {
        ...RETRO_TEXT_STYLE,
        fontSize: '11px',
        color: '#bcc3a6',
        align: 'center',
        wordWrap: { width: 700 },
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(3);

    const rootButtons: MenuButton[] = rootOptions.map((option, index) => {
      const button = this.createMenuButton(
        0,
        0,
        300,
        52,
        option === 'primary' ? 'Start Survey' : option === 'options' ? 'Options' : 'Field Guide',
        () => {
          this.rootSelectedIndex = index;
          syncSelection();
        },
        () => {
          this.rootSelectedIndex = index;
          activateRootOption(rootOptions[this.rootSelectedIndex]);
        },
      );
      return {
        id: option,
        container: button.container,
        background: button.background,
        hitArea: button.hitArea,
        text: button.text,
      };
    });

    const optionButtons: MenuButton[] = optionEntries.map((option, index) => {
      const button = this.createMenuButton(
        0,
        0,
        620,
        48,
        '',
        () => {
          this.optionsSelectedIndex = index;
          syncSelection();
        },
        () => {
          this.optionsSelectedIndex = index;
          cycleValue(optionEntries[this.optionsSelectedIndex], 1);
        },
      );
      button.text.setFontSize('15px');
      return {
        id: option,
        container: button.container,
        background: button.background,
        hitArea: button.hitArea,
        text: button.text,
      };
    });

    const levelButtons: MenuButton[] = stageDefinitions.map((stage, index) => {
      const button = this.createMenuButton(
        0,
        0,
        620,
        50,
        '',
        () => {
          this.levelSelectedIndex = index;
          syncSelection();
        },
        () => {
          this.levelSelectedIndex = index;
          startSelectedLevel();
        },
      );
      button.text.setFontSize('14px');
      return {
        id: stage.id,
        container: button.container,
        background: button.background,
        hitArea: button.hitArea,
        text: button.text,
      };
    });

    let helpPanelWidth = 760;
    let helpPanelHeight = 326;
    let helpViewportWidth = 660;
    let helpViewportHeight = 224;
    const helpScrollStep = 22;
    const helpBackground = createNinePatch(this, 0, 0, helpPanelWidth, helpPanelHeight).setDepth?.(3)
      ?? createNinePatch(this, 0, 0, helpPanelWidth, helpPanelHeight);
    const helpTextObject = this.add
      .text(0, 0, stripMarkup(HELP_TEXT), {
        ...RETRO_TEXT_STYLE,
        fontSize: '11px',
        color: UI_COLORS.text,
        lineSpacing: 6,
        wordWrap: { width: helpViewportWidth, useAdvancedWrap: true },
      })
      .setDepth(4);
    let helpScrollOffset = 0;
    let helpMaxScroll = Math.max(0, helpTextObject.height - helpViewportHeight);
    const applyHelpScroll = (): void => {
      helpTextObject.setPosition(-helpViewportWidth / 2, -helpViewportHeight / 2 - helpScrollOffset);
      helpTextObject.setCrop(0, helpScrollOffset, helpViewportWidth, helpViewportHeight);
    };
    const scrollHelp = (direction: -1 | 1): void => {
      helpScrollOffset = clamp(helpScrollOffset + direction * helpScrollStep, 0, helpMaxScroll);
      applyHelpScroll();
    };
    applyHelpScroll();
    const resetHelpScroll = (): void => {
      helpScrollOffset = 0;
      applyHelpScroll();
    };
    const helpArea = this.add
      .container(0, 0, [helpBackground, helpTextObject])
      .setDepth(3)
      .setVisible(false);

    const footerText = this.add
      .text(0, 0, '', {
        ...RETRO_TEXT_STYLE,
        fontSize: '9px',
        color: UI_COLORS.dimText,
        letterSpacing: 1,
        align: 'center',
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5)
      .setDepth(3);

    const syncLayout = (gameSize: { width: number; height: number }): void => {
      const { centerX, centerY, width, height, safeInsetX, safeInsetY } = getViewportMetrics(this, gameSize);
      const frameWidth = Math.min(Math.max(360, width - safeInsetX * 2), 928);
      const frameHeight = Math.min(Math.max(420, height - safeInsetY * 2), 704);
      const frameTop = centerY - frameHeight / 2;
      const rootButtonWidth = Math.min(300, Math.max(240, frameWidth - 120));
      const optionButtonWidth = Math.min(620, Math.max(280, frameWidth - 92));

      baseBackdrop.setPosition(centerX, centerY).setSize(width + 24, height + 24);
      baseBackdropGlow.setPosition(centerX, centerY).setSize(width + 24, height + 24);
      menuBackdrop.setPosition(centerX, centerY).setSize(Math.min(width - 12, 1000), Math.min(height - 12, 740));
      resizePanel(menuFrame, frameWidth, frameHeight);
      menuFrame.setPosition(centerX, centerY);

      backdropStars.forEach((star, index) => {
        const seed = backdropStarSeeds[index];
        star.setPosition(centerX + seed.offsetX, frameTop + seed.offsetY);
      });

      const titleY = frameTop + 48;
      const headingY = frameTop + 90;
      const subtitleY = frameTop + 128;
      const rootStartY = frameTop + 232;
      const optionsStartY = frameTop + 168;
      const helpCenterY = frameTop + Math.min(frameHeight - 178, 310);
      const footerY = centerY + frameHeight / 2 - (this.view === 'help' ? 14 : 12);

      menuTitleText.setPosition(centerX, titleY);
      subtitleText.setPosition(centerX, subtitleY);
      subtitleText.setWordWrapWidth(Math.max(260, Math.min(700, frameWidth - 140)), true);
      titleText.setPosition(centerX, headingY);

      rootButtons.forEach((button, index) => {
        resizePanel(button.background, rootButtonWidth, 52);
        button.hitArea.setSize(rootButtonWidth, 52);
        button.container.setPosition(centerX, rootStartY + index * 68);
      });

      optionButtons.forEach((button, index) => {
        resizePanel(button.background, optionButtonWidth, 48);
        button.hitArea.setSize(optionButtonWidth, 48);
        button.container.setPosition(centerX, optionsStartY + index * 54);
      });

      const levelButtonWidth = Math.min(620, Math.max(280, frameWidth - 92));
      const levelStartY = frameTop + 166;
      levelButtons.forEach((button, index) => {
        resizePanel(button.background, levelButtonWidth, 50);
        button.hitArea.setSize(levelButtonWidth, 50);
        button.container.setPosition(centerX, levelStartY + index * 56);
      });

      helpPanelWidth = Math.min(760, Math.max(300, frameWidth - 72));
      helpPanelHeight = Math.min(326, Math.max(220, frameHeight - 192));
      helpViewportWidth = Math.max(240, helpPanelWidth - 100);
      helpViewportHeight = Math.max(120, helpPanelHeight - 102);
      resizePanel(helpBackground, helpPanelWidth, helpPanelHeight);
      helpTextObject.setWordWrapWidth(helpViewportWidth, true);
      helpMaxScroll = Math.max(0, helpTextObject.height - helpViewportHeight);
      helpScrollOffset = clamp(helpScrollOffset, 0, helpMaxScroll);
      applyHelpScroll();
      helpArea.setPosition(centerX, helpCenterY);

      footerText.setPosition(centerX, footerY);
      footerText.setWordWrapWidth(Math.max(280, Math.min(760, frameWidth - 120)), true);
    };

    this.audio.startMenuMusic();
    const unlockSceneAudio = () => {
      void runUnlockedAudioAction(this.audio, () => {
        this.audio.startMenuMusic();
        this.input.keyboard?.off('keydown', unlockSceneAudio);
        this.input.off('pointerdown', unlockSceneAudio);
        this.input.off('pointerup', unlockSceneAudio);
      });
    };
    this.input.keyboard?.on('keydown', unlockSceneAudio);
    this.input.on('pointerdown', unlockSceneAudio);
    this.input.on('pointerup', unlockSceneAudio);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', unlockSceneAudio);
      this.input.off('pointerdown', unlockSceneAudio);
      this.input.off('pointerup', unlockSceneAudio);
    });

    const renderOptionLabels = (): void => {
      const state = bridge.getSession().getState();
      const labels: Record<OptionsOptionId, string> = {
        difficulty: `Difficulty  ${DIFFICULTY_LABELS[state.progress.runSettings.difficulty]}`,
        enemies: `Enemy Pressure  ${ENEMY_PRESSURE_LABELS[state.progress.runSettings.enemyPressure]}`,
        musicVolume: `Music Volume  ${Math.round(state.progress.runSettings.musicVolume * 100)}%`,
        sfxVolume: `SFX Volume  ${Math.round(state.progress.runSettings.sfxVolume * 100)}%`,
        crt: `CRT  ${state.progress.runSettings.crtEnabled ? 'ON' : 'OFF'}`,
      };

      optionButtons.forEach((button) => {
        button.text.setText(labels[button.id as OptionsOptionId]);
      });
    };

    const renderLevelLabels = (): void => {
      const unlockedStageIndex = bridge.getSession().getState().progress.unlockedStageIndex;
      levelButtons.forEach((button, index) => {
        const stage = stageDefinitions[index];
        const locked = index > unlockedStageIndex;
        const tierLabel = stageTierLabels[index] ?? 'Survey';
        button.text.setText(`${index + 1}. ${stage.name}  ${tierLabel}${locked ? '  [LOCKED]' : ''}`);
        button.container.setAlpha(locked ? 0.7 : 0.92);
      });
    };

    const setButtonState = (button: MenuButton, active: boolean): void => {
      button.text.setColor(active ? '#fff7cc' : UI_COLORS.text);
      button.text.setStroke(active ? '#5c3a00' : '#11141b', active ? 4 : 2);
      button.container.setScale(active ? 1.03 : 1);
      button.container.setAlpha(active ? 1 : 0.92);
      if ('setTint' in (button.background as any)) {
        (button.background as any).setTint?.(active ? 0xffd36b : 0xffffff);
      }
    };

    const syncSelection = (): void => {
      rootButtons.forEach((button, index) => {
        const active = this.view === 'root' && index === this.rootSelectedIndex;
        button.container.setVisible(this.view === 'root');
        setButtonState(button, active);
      });

      optionButtons.forEach((button, index) => {
        const active = this.view === 'options' && index === this.optionsSelectedIndex;
        button.container.setVisible(this.view === 'options');
        setButtonState(button, active);
      });

      levelButtons.forEach((button, index) => {
        const active = this.view === 'levelSelect' && index === this.levelSelectedIndex;
        button.container.setVisible(this.view === 'levelSelect');
        setButtonState(button, active);
      });

      titleText.setText(
        this.view === 'root'
          ? 'Main Menu'
          : this.view === 'options'
            ? 'Options'
            : this.view === 'help'
              ? 'Help'
              : 'Level Select',
      );
      subtitleText.setText(
        this.view === 'root'
          ? 'Start the next survey run, tune the mission settings, or review powers and alien hazards before drop-in.'
          : this.view === 'options'
            ? 'Adjust run settings. Left / Right changes the highlighted row.'
            : this.view === 'help'
              ? 'Field reference for powers, hazards, and controls.'
              : 'Choose an unlocked stage.',
      );
      helpArea.setVisible(this.view === 'help');
      footerText.setText(
        this.view === 'root'
          ? 'Enter selects. Arrow keys move.'
          : this.view === 'options'
            ? 'ESC returns to the root menu.'
            : this.view === 'help'
              ? 'Mouse wheel or Up / Down scroll. ESC returns to the root menu.'
              : 'Enter starts the highlighted unlocked stage. ESC returns to the root menu.',
      );
      syncLayout(authoredGameSize);
    };

    const startRun = (stageIndex = bridge.getSession().getState().stageIndex): void => {
      void playMenuInteractionCue(this.audio, AUDIO_CUES.menuConfirm);
      bridge.beginTelemetrySession();
      bridge.startStage(stageIndex);
      this.scene.start('stage-intro');
    };

    const startSelectedLevel = (): void => {
      const unlockedStageIndex = bridge.getSession().getState().progress.unlockedStageIndex;
      if (this.levelSelectedIndex > unlockedStageIndex) {
        void playMenuInteractionCue(this.audio, AUDIO_CUES.menuBack);
        return;
      }
      startRun(this.levelSelectedIndex);
    };

    const openLevelSelect = (): void => {
      void playMenuInteractionCue(this.audio, AUDIO_CUES.menuConfirm);
      this.levelSelectedIndex = clamp(
        bridge.getSession().getState().stageIndex,
        0,
        Math.max(0, stageDefinitions.length - 1),
      );
      this.view = 'levelSelect';
      renderLevelLabels();
      syncSelection();
    };

    const activateRootOption = (option: RootOptionId): void => {
      if (option === 'primary') {
        startRun();
        return;
      }

      void playMenuInteractionCue(this.audio, AUDIO_CUES.menuConfirm);
      this.view = option;
      if (option === 'help') {
        resetHelpScroll();
      } else {
        renderOptionLabels();
      }
      syncSelection();
    };

    const cycleValue = (option: OptionsOptionId, direction: -1 | 1): void => {
      const state = bridge.getSession().getState();
      if (option === 'difficulty') {
        const currentIndex = difficultyValues.indexOf(state.progress.runSettings.difficulty);
        bridge.updateRunSettings({ difficulty: difficultyValues[wrapIndex(currentIndex + direction, difficultyValues.length)] });
      } else if (option === 'enemies') {
        const currentIndex = enemyValues.indexOf(state.progress.runSettings.enemyPressure);
        bridge.updateRunSettings({ enemyPressure: enemyValues[wrapIndex(currentIndex + direction, enemyValues.length)] });
      } else if (option === 'musicVolume') {
        bridge.updateRunSettings({ musicVolume: clamp(state.progress.runSettings.musicVolume + direction * 0.1, 0, 1) });
        this.audio.applyMusicVolume();
      } else if (option === 'sfxVolume') {
        bridge.updateRunSettings({ sfxVolume: clamp(state.progress.runSettings.sfxVolume + direction * 0.1, 0, 1) });
      } else if (option === 'crt') {
        const crtEnabled = !state.progress.runSettings.crtEnabled;
        bridge.updateRunSettings({ crtEnabled });
        setCrtFilterEnabled(this.game, crtEnabled);
        applyConfiguredRetroPostFxToCamera(this.game, this.cameras.main);
      }

      void playMenuInteractionCue(this.audio, AUDIO_CUES.menuConfirm);
      renderOptionLabels();
      syncSelection();
    };

    const returnToRoot = (): void => {
      if (this.view === 'root') {
        return;
      }

      void playMenuInteractionCue(this.audio, AUDIO_CUES.menuBack);
      this.view = 'root';
      syncSelection();
    };

    this.input.keyboard?.on('keydown-UP', () => {
      if (this.view === 'help') {
        scrollHelp(-1);
        return;
      }

      if (this.view === 'root') {
        this.rootSelectedIndex = wrapIndex(this.rootSelectedIndex - 1, rootButtons.length);
      } else if (this.view === 'levelSelect') {
        this.levelSelectedIndex = wrapIndex(this.levelSelectedIndex - 1, levelButtons.length);
      } else {
        this.optionsSelectedIndex = wrapIndex(this.optionsSelectedIndex - 1, optionButtons.length);
      }
      void playMenuInteractionCue(this.audio, AUDIO_CUES.menuNavigate);
      syncSelection();
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      if (this.view === 'help') {
        scrollHelp(1);
        return;
      }

      if (this.view === 'root') {
        this.rootSelectedIndex = wrapIndex(this.rootSelectedIndex + 1, rootButtons.length);
      } else if (this.view === 'levelSelect') {
        this.levelSelectedIndex = wrapIndex(this.levelSelectedIndex + 1, levelButtons.length);
      } else {
        this.optionsSelectedIndex = wrapIndex(this.optionsSelectedIndex + 1, optionButtons.length);
      }
      void playMenuInteractionCue(this.audio, AUDIO_CUES.menuNavigate);
      syncSelection();
    });

    this.input.keyboard?.on('keydown-LEFT', () => {
      if (this.view === 'options') {
        cycleValue(optionEntries[this.optionsSelectedIndex], -1);
      }
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      if (this.view === 'options') {
        cycleValue(optionEntries[this.optionsSelectedIndex], 1);
      }
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.view === 'root') {
        activateRootOption(rootOptions[this.rootSelectedIndex]);
      } else if (this.view === 'levelSelect') {
        startSelectedLevel();
      } else if (this.view === 'options') {
        cycleValue(optionEntries[this.optionsSelectedIndex], 1);
      }
    });
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.view === 'root') {
        activateRootOption(rootOptions[this.rootSelectedIndex]);
      } else if (this.view === 'levelSelect') {
        startSelectedLevel();
      } else if (this.view === 'options') {
        cycleValue(optionEntries[this.optionsSelectedIndex], 1);
      }
    });
    const escCtrlSHandler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        returnToRoot();
        return;
      }
      if ((event.key === 's' || event.key === 'S') && event.ctrlKey && !event.metaKey && !event.altKey && this.view === 'root') {
        event.preventDefault();
        openLevelSelect();
      }
    };
    window.addEventListener('keydown', escCtrlSHandler, true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', escCtrlSHandler, true);
    });
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gos: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (this.view === 'help') {
        scrollHelp(dy > 0 ? 1 : -1);
      }
    });

    for (const key of stageShortcutKeys.slice(0, stageDefinitions.length)) {
      this.input.keyboard?.on(`keydown-${key}`, () => {
        if (this.view !== 'root') {
          return;
        }
        const stageIndex = stageShortcutKeys.indexOf(key);
        startRun(stageIndex);
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audio.stopMusic();
    });
    const handleResize = (): void => {
      syncLayout(authoredGameSize);
    };
    handleResize();
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });

    renderOptionLabels();
    renderLevelLabels();
    syncSelection();
  }

  getDebugSnapshot(): {
    view: MenuView;
    selectedText: string | null;
    texts: string[];
    joined: string;
  } {
    const texts =
      this.view === 'root'
        ? ['Orbital Survey', 'Start', 'Options', 'Help']
        : this.view === 'options'
          ? ['Options', ...optionEntries]
          : this.view === 'levelSelect'
            ? ['Level Select', ...stageDefinitions.map((stage) => stage.name)]
            : ['Help'];
    return {
      view: this.view,
      selectedText:
        this.view === 'root'
          ? rootOptions[this.rootSelectedIndex]
          : this.view === 'options'
            ? optionEntries[this.optionsSelectedIndex]
            : 'help',
      texts,
      joined: texts.join('\n'),
    };
  }
}
