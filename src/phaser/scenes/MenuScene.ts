import Phaser from 'phaser';
import { DIFFICULTY_LABELS, ENEMY_PRESSURE_LABELS } from '../../game/simulation/state';
import { SceneBridge } from '../adapters/sceneBridge';

type MenuMode = 'main';
type MenuView = 'root' | 'options' | 'help';
type RootOptionId = 'primary' | 'options' | 'help';
type OptionsOptionId = 'difficulty' | 'enemies' | 'volume';

const difficultyValues = ['casual', 'standard', 'expert'] as const;
const enemyValues = ['low', 'normal', 'high'] as const;
const rootOptions: RootOptionId[] = ['primary', 'options', 'help'];
const optionEntries: OptionsOptionId[] = ['difficulty', 'enemies', 'volume'];

const HELP_LINES = [
  'Controls: Move with Arrow keys or A / D. Jump with Up, W, or Space. Dash with Shift and fire shooter shots with F when that power is active.',
  'Powers',
  'Double Jump: Grants one extra mid-air jump after takeoff, which is useful for correcting long platform routes or recovering after a late jump.',
  'Shooter: Fires forward projectiles that clear pressure in tight lanes without forcing direct contact with enemies.',
  'Invincible: Protects health for 10 seconds and ignores hit loss while the timer remains active.',
  'Dash: Bursts forward quickly, helps clear long gaps, and can be used to break through dangerous timing windows.',
  'Damage Rules: A hit removes non-invincible powers before it costs a heart, so power pickups can absorb mistakes once before health drops.',
  'Enemies And Hazards',
  'Spikes: Deal contact damage immediately and usually guard ledges, pits, or short landing zones.',
  'Turrets: Fire on a rhythm, so watch their telegraph and move after a shot instead of into the firing lane.',
  'Walkers: Patrol horizontal platforms and pressure narrow footing with steady movement.',
  'Hoppers: Leap into arcs that punish late jumps or slow approaches near ledges.',
  'Chargers: Pause briefly before rushing forward, so bait the wind-up and then move through the opened lane.',
  'Flyers: Sweep across the screen at fixed heights and can overlap platform routes if you move too early.',
  'Help Controls: When this panel is longer than the visible window, use Up or Down to scroll and use the mouse wheel to read the hidden sections.',
];

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

  constructor() {
    super('menu');
  }

  create(): void {
    const bridge = this.registry.get('bridge') as SceneBridge;
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

    this.add
      .rectangle(width / 2, height / 2, width, height, 0x091310, 1)
      .setOrigin(0.5);
    this.add
      .rectangle(width / 2, height / 2, width - 128, height - 132, 0x11201c, 0.94)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0xf5cf64, 0.22);

    const eyebrowText = this.add
      .text(width / 2, 82, 'Crystal Run', {
        fontFamily: 'Trebuchet MS',
        fontSize: '42px',
        color: '#f7f3d6',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const titleText = this.add
      .text(width / 2, 134, '', {
        fontFamily: 'Trebuchet MS',
        fontSize: '32px',
        color: '#d9e7d6',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const subtitleText = this.add
      .text(width / 2, 176, '', {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#b9cab8',
        align: 'center',
        wordWrap: { width: width - 220 },
      })
      .setOrigin(0.5);

    rootOptions.forEach((option, index) => {
      const text = this.add
        .text(width / 2, 258 + index * 58, '', {
          fontFamily: 'Trebuchet MS',
          fontSize: '28px',
          color: '#d3dfd0',
          backgroundColor: '#13201c',
          padding: { x: 18, y: 10 },
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
          fontFamily: 'Trebuchet MS',
          fontSize: '27px',
          color: '#d3dfd0',
          backgroundColor: '#13201c',
          padding: { x: 18, y: 10 },
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
        fontFamily: 'Trebuchet MS',
        fontSize: '17px',
        color: '#b9cab8',
        align: 'center',
        wordWrap: { width: width - 260 },
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
    const helpViewportWidth = helpPanelWidth - 112;
    const helpTrackX = helpPanelWidth / 2 - 28;
    const helpTrackHeight = helpViewportHeight;
    const helpScrollStep = 56;
    const helpBackground = this.add
      .rectangle(0, 0, helpPanelWidth, helpPanelHeight, 0x0d1715, 0.96)
      .setStrokeStyle(2, 0xf5cf64, 0.28);
    const helpTitle = this.add
      .text(0, -helpPanelHeight / 2 + 38, 'Help', {
        fontFamily: 'Trebuchet MS',
        fontSize: '30px',
        color: '#f7f3d6',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const helpViewport = this.add.container(0, 0);
    const helpBody = this.add
      .text(-helpPanelWidth / 2 + helpViewportPadding, helpViewportTop, HELP_LINES.join('\n\n'), {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#d5e1d4',
        align: 'left',
        lineSpacing: 8,
        wordWrap: { width: helpViewportWidth },
      })
      .setOrigin(0, 0);
    helpViewport.add(helpBody);
    const helpMaskGraphics = this.make.graphics();
    helpMaskGraphics.setVisible(false);
    helpMaskGraphics.fillStyle(0xffffff, 1);
    helpMaskGraphics.fillRect(
      width / 2 - helpPanelWidth / 2 + helpViewportPadding,
      316 + helpViewportTop,
      helpViewportWidth,
      helpViewportHeight,
    );
    helpViewport.setMask(helpMaskGraphics.createGeometryMask());
    const helpScrollbarTrack = this.add
      .rectangle(helpTrackX, helpViewportTop + helpTrackHeight / 2, 10, helpTrackHeight, 0x23312c, 0.92)
      .setOrigin(0.5)
      .setVisible(false);
    const helpScrollbarThumb = this.add
      .rectangle(helpTrackX, helpViewportTop + 36, 14, 72, 0xf5cf64, 0.95)
      .setOrigin(0.5)
      .setVisible(false);
    helpPanel.add([helpBackground, helpTitle, helpViewport, helpScrollbarTrack, helpScrollbarThumb]);

    const setHelpScroll = (nextOffset: number): void => {
      this.helpScrollOffset = Phaser.Math.Clamp(nextOffset, 0, this.helpScrollMax);
      helpBody.setY(helpViewportTop - this.helpScrollOffset);

      if (!this.helpScrollbarVisible) {
        return;
      }

      const visibleRatio = helpViewportHeight / (helpBody.height || helpViewportHeight);
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
      this.helpScrollMax = Math.max(0, helpBody.height - helpViewportHeight);
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
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#b9cab8',
        align: 'center',
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
        const nextIndex = Phaser.Math.Wrap(currentIndex + direction, 0, difficultyValues.length);
        bridge.updateRunSettings({ difficulty: difficultyValues[nextIndex] });
        render();
        return;
      }

      if (option === 'enemies') {
        const currentIndex = enemyValues.indexOf(state.progress.runSettings.enemyPressure);
        const nextIndex = Phaser.Math.Wrap(currentIndex + direction, 0, enemyValues.length);
        bridge.updateRunSettings({ enemyPressure: enemyValues[nextIndex] });
        render();
        return;
      }

      bridge.updateRunSettings({
        masterVolume: Phaser.Math.Clamp(state.progress.runSettings.masterVolume + direction * 0.1, 0, 1),
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

      eyebrowText.setText('Crystal Run');
      titleText.setText(
        this.view === 'root'
          ? 'Main Menu'
          : this.view === 'options'
            ? 'Options'
            : 'Help',
      );
      subtitleText.setText(
        this.view === 'root'
          ? 'Start a run, configure settings, or review powers and enemy hazards before entering.'
          : this.view === 'options'
            ? 'Choose the run settings that will be used when the next stage begins.'
            : 'Shared quick reference for powers, enemies, and hazards.',
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
        text.setColor(selected ? '#11150f' : '#d3dfd0');
        text.setBackgroundColor(selected ? '#f5cf64' : '#13201c');
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
        text.setColor(selected ? '#11150f' : '#d3dfd0');
        text.setBackgroundColor(selected ? '#f5cf64' : '#13201c');
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
        this.visibleTexts.push(helpTitle, helpBody);
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
        this.rootSelectedIndex = Phaser.Math.Wrap(this.rootSelectedIndex - 1, 0, rootOptions.length);
      } else {
        this.optionsSelectedIndex = Phaser.Math.Wrap(this.optionsSelectedIndex - 1, 0, optionEntries.length);
      }
      render();
    });

    bindKey('keydown-DOWN', () => {
      if (this.view === 'help') {
        scrollHelp(helpScrollStep);
        return;
      }

      if (this.view === 'root') {
        this.rootSelectedIndex = Phaser.Math.Wrap(this.rootSelectedIndex + 1, 0, rootOptions.length);
      } else {
        this.optionsSelectedIndex = Phaser.Math.Wrap(this.optionsSelectedIndex + 1, 0, optionEntries.length);
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
      helpMaskGraphics.destroy();
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
    helpScrollOffset: number;
    helpScrollMax: number;
    helpScrollbarVisible: boolean;
  } {
    const bridge = this.registry.get('bridge') as SceneBridge;
    const settings = bridge.getSession().getState().progress.runSettings;
    const texts =
      this.view === 'root'
        ? ['Crystal Run', 'Start', 'Options', 'Help']
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
      texts,
      joined: texts.join('\n'),
      helpScrollOffset: this.helpScrollOffset,
      helpScrollMax: this.helpScrollMax,
      helpScrollbarVisible: this.helpScrollbarVisible,
    };
  }
}
