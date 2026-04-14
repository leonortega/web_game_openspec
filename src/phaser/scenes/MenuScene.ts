import * as Phaser from 'phaser';
import {
  DIFFICULTY_LABELS,
  ENEMY_PRESSURE_LABELS,
  getPowerHelpSummary,
  getPowerLabel,
} from '../../game/simulation/state';
import { SceneBridge } from '../adapters/sceneBridge';
import {
  RETRO_FONT_FAMILY,
  createRetroMenuPalette,
  drawRetroBackdrop,
} from '../view/retroPresentation';

type MenuMode = 'main';
type MenuView = 'root' | 'options' | 'help';
type RootOptionId = 'primary' | 'options' | 'help';
type OptionsOptionId = 'difficulty' | 'enemies' | 'volume';

const difficultyValues = ['casual', 'standard', 'expert'] as const;
const enemyValues = ['low', 'normal', 'high'] as const;
const rootOptions: RootOptionId[] = ['primary', 'options', 'help'];
const optionEntries: OptionsOptionId[] = ['difficulty', 'enemies', 'volume'];

const HELP_LINES = [
  'Controls: Move with Arrow keys or A / D. Jump with Up, W, or Space. Trigger Booster Dash with Shift and fire Plasma Blaster shots with F when that system is active.',
  'Powers',
  `${getPowerLabel('doubleJump')}: ${getPowerHelpSummary('doubleJump')}`,
  `${getPowerLabel('shooter')}: ${getPowerHelpSummary('shooter')}`,
  `${getPowerLabel('invincible')}: ${getPowerHelpSummary('invincible')}`,
  `${getPowerLabel('dash')}: ${getPowerHelpSummary('dash')}`,
  'Damage Rules: A hit strips non-Shield Field powers before it costs a heart, so a pickup can absorb one mistake before health drops.',
  'Enemies And Hazards',
  'Spikes: Deal contact damage immediately and usually guard ledges, pits, or short landing zones.',
  'Turrets: Flash before firing, so use the telegraph and cross the lane after the shot leaves the barrel.',
  'Walkers: Patrol horizontal footing and pressure narrow landing pads with steady movement.',
  'Hoppers: Leap in arcs that punish late jumps or slow approaches near ledges.',
  'Chargers: Pause briefly before rushing forward, so bait the wind-up and then move through the opened lane.',
  'Flyers: Sweep across the screen at fixed heights and often defend the optional upper survey routes.',
  'Help Controls: When this panel is longer than the visible window, use Up or Down to scroll and use the mouse wheel to read the hidden sections.',
];

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const wrapIndex = (value: number, length: number): number => {
  if (length <= 0) {
    return 0;
  }

  return ((value % length) + length) % length;
};

export class MenuScene extends Phaser.Scene {
  private mode: MenuMode = 'main';

  private view: MenuView = 'root';

  private rootSelectedIndex = 0;

  private optionsSelectedIndex = 0;

  private visibleTexts: Phaser.GameObjects.Text[] = [];

  private helpScrollOffset = 0;

  private helpScrollMax = 0;

  private helpScrollbarVisible = false;

  private helpPanelHeight = 0;

  private helpViewportHeight = 0;

  private helpViewportTop = 0;

  private helpParagraphDebug: Array<{
    text: string;
    top: number;
    bottom: number;
    visible: boolean;
    cropY: number;
    cropHeight: number;
  }> = [];

  constructor() {
    super('menu');
  }

  create(): void {
    const bridge = this.registry.get('bridge') as SceneBridge;
    const retro = createRetroMenuPalette();
    this.view = 'root';
    this.rootSelectedIndex = 0;
    this.optionsSelectedIndex = 0;
    this.helpScrollOffset = 0;
    this.helpScrollMax = 0;
    this.helpScrollbarVisible = false;

    const { width, height } = this.scale;
    const cleanup: Array<() => void> = [];
    const rootTexts = new Map<RootOptionId, Phaser.GameObjects.Text>();
    const optionsTexts = new Map<OptionsOptionId, Phaser.GameObjects.Text>();

    drawRetroBackdrop(this, 0, 0, width, height, retro, 'transition');
    this.add
      .rectangle(width / 2, height / 2, width - 112, height - 110, retro.panel, 0.98)
      .setOrigin(0.5)
      .setStrokeStyle(4, retro.border, 0.92);
    this.add.rectangle(width / 2, 82, width - 146, 26, retro.stageAccent, 1).setStrokeStyle(2, retro.ink, 1);
    this.add.rectangle(width / 2, height - 54, width - 146, 26, retro.panelAlt, 1).setStrokeStyle(2, retro.border, 0.58);

    const eyebrowText = this.add
      .text(width / 2, 82, 'Orbital Survey', {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '30px',
        color: retro.shadow,
        fontStyle: 'bold',
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const titleText = this.add
      .text(width / 2, 134, '', {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '28px',
        color: retro.text,
        fontStyle: 'bold',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const subtitleText = this.add
      .text(width / 2, 176, '', {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '16px',
        color: retro.dimText,
        align: 'center',
        wordWrap: { width: width - 220 },
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    rootOptions.forEach((option, index) => {
      const text = this.add
        .text(width / 2, 258 + index * 58, '', {
          fontFamily: RETRO_FONT_FAMILY,
          fontSize: '24px',
          color: retro.text,
          backgroundColor: '#11161c',
          padding: { x: 20, y: 8 },
          letterSpacing: 2,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        this.rootSelectedIndex = index;
        render();
      });
      text.on('pointerdown', () => {
        this.rootSelectedIndex = index;
        activateRootOption(rootOptions[this.rootSelectedIndex]);
      });

      rootTexts.set(option, text);
    });

    optionEntries.forEach((option, index) => {
      const text = this.add
        .text(width / 2, 238 + index * 58, '', {
          fontFamily: RETRO_FONT_FAMILY,
          fontSize: '22px',
          color: retro.text,
          backgroundColor: '#11161c',
          padding: { x: 20, y: 8 },
          letterSpacing: 2,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        this.optionsSelectedIndex = index;
        render();
      });
      text.on('pointerdown', () => {
        this.optionsSelectedIndex = index;
        cycleValue(optionEntries[this.optionsSelectedIndex], 1);
      });

      optionsTexts.set(option, text);
    });

    const optionsHintText = this.add
      .text(width / 2, 432, '', {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '15px',
        color: retro.dimText,
        align: 'center',
        wordWrap: { width: width - 260 },
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    const helpPanel = this.add.container(width / 2, 316);
    const helpPanelWidth = Math.min(width - 132, 860);
    const helpPanelHeight = Math.min(height - 160, 420);
    const helpViewportPadding = 34;
    const helpViewportTop = -helpPanelHeight / 2 + 76;
    const helpViewportHeight = helpPanelHeight - 134;
    this.helpPanelHeight = helpPanelHeight;
    this.helpViewportHeight = helpViewportHeight;
    this.helpViewportTop = helpViewportTop;
    const helpViewportWidth = helpPanelWidth - 112;
    const helpTrackX = helpPanelWidth / 2 - 28;
    const helpTrackHeight = helpViewportHeight;
    const helpScrollStep = 56;
    const helpBackground = this.add
      .rectangle(0, 0, helpPanelWidth, helpPanelHeight, retro.panel, 0.99)
      .setStrokeStyle(4, retro.border, 0.92);
    const helpTitle = this.add
      .text(0, -helpPanelHeight / 2 + 38, 'Help', {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '26px',
        color: retro.text,
        fontStyle: 'bold',
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    const helpViewport = this.add.container(0, 0);
    const helpParagraphs = HELP_LINES.map((line) =>
      this.add
        .text(-helpPanelWidth / 2 + helpViewportPadding, 0, line, {
          fontFamily: RETRO_FONT_FAMILY,
          fontSize: '16px',
          color: retro.text,
          align: 'left',
          lineSpacing: 6,
          wordWrap: { width: helpViewportWidth },
        })
        .setOrigin(0, 0),
    );
    helpViewport.add(helpParagraphs);
    const helpScrollbarTrack = this.add
      .rectangle(helpTrackX, helpViewportTop + helpTrackHeight / 2, 10, helpTrackHeight, retro.panelAlt, 1)
      .setOrigin(0.5)
      .setVisible(false);
    const helpScrollbarThumb = this.add
      .rectangle(helpTrackX, helpViewportTop + 36, 14, 72, retro.warm, 1)
      .setOrigin(0.5)
      .setVisible(false);
    helpPanel.add([helpBackground, helpTitle, helpViewport, helpScrollbarTrack, helpScrollbarThumb]);

    let helpContentHeight = 0;

    const syncHelpParagraphLayout = (): void => {
      let cursorY = helpViewportTop - this.helpScrollOffset;
      const visibleBottom = helpViewportTop + helpViewportHeight;
      this.helpParagraphDebug = [];

      for (const paragraph of helpParagraphs) {
        paragraph.setPosition(-helpPanelWidth / 2 + helpViewportPadding, cursorY);
        const paragraphBottom = cursorY + paragraph.height;
        const visibleTop = Math.max(cursorY, helpViewportTop);
        const clippedBottom = Math.min(paragraphBottom, visibleBottom);
        const cropY = Math.max(0, visibleTop - cursorY);
        const cropHeight = Math.max(0, clippedBottom - visibleTop);
        const isVisible = cropHeight > 0;

        paragraph.setVisible(isVisible);
        if (isVisible) {
          paragraph.setCrop(0, cropY, helpViewportWidth, cropHeight);
        } else {
          paragraph.setCrop();
        }

        this.helpParagraphDebug.push({
          text: paragraph.text,
          top: cursorY,
          bottom: paragraphBottom,
          visible: isVisible,
          cropY,
          cropHeight,
        });
        cursorY += paragraph.height + 24;
      }
    };

    const setHelpScroll = (nextOffset: number): void => {
      this.helpScrollOffset = clamp(nextOffset, 0, this.helpScrollMax);
      syncHelpParagraphLayout();

      if (!this.helpScrollbarVisible) {
        return;
      }

      const visibleRatio = helpViewportHeight / Math.max(helpContentHeight, helpViewportHeight);
      const thumbHeight = Math.max(52, Math.min(helpTrackHeight, helpTrackHeight * visibleRatio));
      const trackTravel = helpTrackHeight - thumbHeight;
      const scrollRatio = this.helpScrollMax <= 0 ? 0 : this.helpScrollOffset / this.helpScrollMax;
      helpScrollbarThumb.setSize(14, thumbHeight);
      helpScrollbarThumb.setPosition(
        helpTrackX,
        helpViewportTop + thumbHeight / 2 + trackTravel * scrollRatio,
      );
    };

    const refreshHelpOverflow = (): void => {
      let cursorY = helpViewportTop;
      for (const paragraph of helpParagraphs) {
        paragraph.setPosition(-helpPanelWidth / 2 + helpViewportPadding, cursorY);
        cursorY += paragraph.height + 24;
      }

      helpContentHeight = Math.max(0, cursorY - helpViewportTop - 24);
      this.helpScrollMax = Math.max(0, helpContentHeight - helpViewportHeight);
      this.helpScrollbarVisible = this.helpScrollMax > 0;
      helpScrollbarTrack.setVisible(this.view === 'help' && this.helpScrollbarVisible);
      helpScrollbarThumb.setVisible(this.view === 'help' && this.helpScrollbarVisible);
      setHelpScroll(Math.min(this.helpScrollOffset, this.helpScrollMax));
    };

    const scrollHelp = (delta: number): void => {
      if (this.view !== 'help' || this.helpScrollMax <= 0) {
        return;
      }

      setHelpScroll(this.helpScrollOffset + delta);
      render();
    };

    const footerText = this.add
      .text(width / 2, height - 52, '', {
        fontFamily: RETRO_FONT_FAMILY,
        fontSize: '14px',
        color: retro.text,
        align: 'center',
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    const startRun = (stageIndex = bridge.getSession().getState().stageIndex): void => {
      bridge.startStage(stageIndex);
      this.scene.start('stage-intro');
    };

    const openView = (nextView: 'options' | 'help'): void => {
      this.view = nextView;
      render();
    };

    const returnToRoot = (): void => {
      this.view = 'root';
      setHelpScroll(0);
      render();
    };

    const cycleValue = (option: OptionsOptionId, direction: -1 | 1): void => {
      const state = bridge.getSession().getState();
      if (option === 'difficulty') {
        const currentIndex = difficultyValues.indexOf(state.progress.runSettings.difficulty);
        const nextIndex = wrapIndex(currentIndex + direction, difficultyValues.length);
        bridge.updateRunSettings({ difficulty: difficultyValues[nextIndex] });
        render();
        return;
      }

      if (option === 'enemies') {
        const currentIndex = enemyValues.indexOf(state.progress.runSettings.enemyPressure);
        const nextIndex = wrapIndex(currentIndex + direction, enemyValues.length);
        bridge.updateRunSettings({ enemyPressure: enemyValues[nextIndex] });
        render();
        return;
      }

      bridge.updateRunSettings({
        masterVolume: clamp(state.progress.runSettings.masterVolume + direction * 0.1, 0, 1),
      });
      render();
    };

    const activateRootOption = (option: RootOptionId): void => {
      if (option === 'primary') {
        startRun();
        return;
      }

      openView(option);
    };

    const handleBack = (): void => {
      if (this.view !== 'root') {
        returnToRoot();
      }
    };

    const render = (): void => {
      const state = bridge.getSession().getState();
      const rootLabels: Record<RootOptionId, string> = {
        primary: 'Start',
        options: 'Options',
        help: 'Help',
      };
      const optionLabels: Record<OptionsOptionId, string> = {
        difficulty: `Difficulty  ${DIFFICULTY_LABELS[state.progress.runSettings.difficulty]}`,
        enemies: `Enemies  ${ENEMY_PRESSURE_LABELS[state.progress.runSettings.enemyPressure]}`,
        volume: `Volume  ${Math.round(state.progress.runSettings.masterVolume * 100)}%`,
      };

      eyebrowText.setText('Orbital Survey');
      titleText.setText(
        this.view === 'root'
          ? 'Main Menu'
          : this.view === 'options'
            ? 'Options'
            : 'Help',
      );
      subtitleText.setText(
        this.view === 'root'
          ? 'Launch the astronaut survey, tune the run, or review power systems and alien hazards before drop-in.'
          : this.view === 'options'
            ? 'Choose the run settings that will be used when the next stage begins.'
            : 'Shared quick reference for astronaut powers, enemy hazards, and scrolling controls.',
      );

      this.visibleTexts = [];

      rootOptions.forEach((option, index) => {
        const text = rootTexts.get(option);
        if (!text) {
          return;
        }

        const selected = this.view === 'root' && index === this.rootSelectedIndex;
        text.setVisible(this.view === 'root');
        text.setText(rootLabels[option]);
        text.setColor(selected ? '#080a0d' : retro.text);
        text.setBackgroundColor(selected ? '#f0b84b' : '#11161c');
        if (this.view === 'root') {
          this.visibleTexts.push(text);
        }
      });

      optionEntries.forEach((option, index) => {
        const text = optionsTexts.get(option);
        if (!text) {
          return;
        }

        const selected = this.view === 'options' && index === this.optionsSelectedIndex;
        text.setVisible(this.view === 'options');
        text.setText(optionLabels[option]);
        text.setColor(selected ? '#080a0d' : retro.text);
        text.setBackgroundColor(selected ? '#f0b84b' : '#11161c');
        if (this.view === 'options') {
          this.visibleTexts.push(text);
        }
      });

      const showOptions = this.view === 'options';
      optionsHintText.setVisible(showOptions);
      optionsHintText.setText(
        showOptions
          ? 'Left / Right adjust the highlighted setting. ESC returns to the main menu root.'
          : '',
      );

      helpPanel.setVisible(this.view === 'help');
      helpScrollbarTrack.setVisible(this.view === 'help' && this.helpScrollbarVisible);
      helpScrollbarThumb.setVisible(this.view === 'help' && this.helpScrollbarVisible);
      if (this.view === 'help') {
        this.visibleTexts.push(helpTitle, ...helpParagraphs.filter((paragraph) => paragraph.visible));
      }

      footerText.setText(
        this.view === 'help'
          ? this.helpScrollbarVisible
            ? 'Up / Down scroll. Mouse wheel also scrolls. ESC returns to the previous menu layer.'
            : 'ESC returns to the previous menu layer.'
          : this.view === 'root'
          ? 'Enter selects. Arrow keys move through the menu.'
          : 'ESC returns to the previous menu layer.',
      );
    };

    const keyboard = this.input.keyboard;
    const bindKey = (eventName: string, handler: () => void): void => {
      keyboard?.on(eventName, handler);
      cleanup.push(() => keyboard?.off(eventName, handler));
    };

    bindKey('keydown-UP', () => {
      if (this.view === 'help') {
        scrollHelp(-helpScrollStep);
        return;
      }

      if (this.view === 'root') {
        this.rootSelectedIndex = wrapIndex(this.rootSelectedIndex - 1, rootOptions.length);
      } else {
        this.optionsSelectedIndex = wrapIndex(this.optionsSelectedIndex - 1, optionEntries.length);
      }
      render();
    });

    bindKey('keydown-DOWN', () => {
      if (this.view === 'help') {
        scrollHelp(helpScrollStep);
        return;
      }

      if (this.view === 'root') {
        this.rootSelectedIndex = wrapIndex(this.rootSelectedIndex + 1, rootOptions.length);
      } else {
        this.optionsSelectedIndex = wrapIndex(this.optionsSelectedIndex + 1, optionEntries.length);
      }
      render();
    });

    bindKey('keydown-LEFT', () => {
      if (this.view !== 'options') {
        return;
      }

      cycleValue(optionEntries[this.optionsSelectedIndex], -1);
    });

    bindKey('keydown-RIGHT', () => {
      if (this.view !== 'options') {
        return;
      }

      cycleValue(optionEntries[this.optionsSelectedIndex], 1);
    });

    bindKey('keydown-ENTER', () => {
      if (this.view === 'root') {
        activateRootOption(rootOptions[this.rootSelectedIndex]);
        return;
      }

      if (this.view === 'options') {
        cycleValue(optionEntries[this.optionsSelectedIndex], 1);
      }
    });

    bindKey('keydown-SPACE', () => {
      if (this.view === 'root') {
        activateRootOption(rootOptions[this.rootSelectedIndex]);
        return;
      }

      if (this.view === 'options') {
        cycleValue(optionEntries[this.optionsSelectedIndex], 1);
      }
    });

    bindKey('keydown-ESC', handleBack);

    const wheelHandler = (
      _pointer: Phaser.Input.Pointer,
      _gameObjects: Phaser.GameObjects.GameObject[],
      _deltaX: number,
      deltaY: number,
    ): void => {
      scrollHelp(deltaY);
    };
    this.input.on('wheel', wheelHandler);
    cleanup.push(() => this.input.off('wheel', wheelHandler));

    for (const key of ['ONE', 'TWO', 'THREE'] as const) {
      bindKey(`keydown-${key}`, () => {
        if (this.mode !== 'main' || this.view !== 'root') {
          return;
        }

        const stageIndex = { ONE: 0, TWO: 1, THREE: 2 }[key];
        startRun(stageIndex);
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      cleanup.forEach((dispose) => dispose());
      this.visibleTexts = [];
    });

    refreshHelpOverflow();
    render();
  }

  getDebugSnapshot(): {
    mode: MenuMode;
    view: MenuView;
    selectedText: string | null;
    texts: string[];
    joined: string;
    helpPanelHeight: number;
    helpViewportHeight: number;
    helpViewportTop: number;
    helpViewportBottom: number;
    helpScrollOffset: number;
    helpScrollMax: number;
    helpScrollbarVisible: boolean;
    helpParagraphs: Array<{
      text: string;
      top: number;
      bottom: number;
      visible: boolean;
      cropY: number;
      cropHeight: number;
      visibleTop: number;
      visibleBottom: number;
    }>;
  } {
    const bridge = this.registry.get('bridge') as SceneBridge;
    const settings = bridge.getSession().getState().progress.runSettings;
    const texts =
      this.view === 'root'
        ? ['Orbital Survey', 'Start', 'Options', 'Help']
        : this.view === 'options'
          ? [
              'Options',
              `Difficulty  ${DIFFICULTY_LABELS[settings.difficulty]}`,
              `Enemies  ${ENEMY_PRESSURE_LABELS[settings.enemyPressure]}`,
              `Volume  ${Math.round(settings.masterVolume * 100)}%`,
            ]
          : ['Help', ...HELP_LINES];

    return {
      mode: this.mode,
      view: this.view,
      selectedText:
        this.view === 'root'
          ? rootOptions[this.rootSelectedIndex] === 'primary'
            ? 'Start'
            : rootOptions[this.rootSelectedIndex] === 'options'
              ? 'Options'
              : 'Help'
          : this.view === 'options'
            ? this.visibleTexts[this.optionsSelectedIndex]?.text ?? null
            : null,
      helpPanelHeight: this.helpPanelHeight,
      helpViewportHeight: this.helpViewportHeight,
      helpViewportTop: this.helpViewportTop,
      helpViewportBottom: this.helpViewportTop + this.helpViewportHeight,
      texts,
      joined: texts.join('\n'),
      helpScrollOffset: this.helpScrollOffset,
      helpScrollMax: this.helpScrollMax,
      helpScrollbarVisible: this.helpScrollbarVisible,
      helpParagraphs: this.helpParagraphDebug.map((paragraph) => ({
        ...paragraph,
        visibleTop: paragraph.top + paragraph.cropY,
        visibleBottom: paragraph.top + paragraph.cropY + paragraph.cropHeight,
      })),
    };
  }
}
