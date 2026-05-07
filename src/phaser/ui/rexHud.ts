import * as Phaser from 'phaser';
import type { HudViewModel } from '../../ui/hud/hud';
import { createNinePatch, ensureUiPanelTexture, RETRO_TEXT_STYLE, UI_COLORS } from './rexUiTheme';

type HudSection = {
  root: Phaser.GameObjects.Container;
  background: any;
  title: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  setBounds(width: number, height: number): void;
};

export type RexHudBindings = {
  root: Phaser.GameObjects.Container;
  topBar: Phaser.GameObjects.Container;
  metaDock: Phaser.GameObjects.Container;
  messageBox: Phaser.GameObjects.Container;
  stageValue: Phaser.GameObjects.Text;
  coinsValue: Phaser.GameObjects.Text;
  healthValue: Phaser.GameObjects.Text;
  powerValue: Phaser.GameObjects.Text;
  difficultyValue: Phaser.GameObjects.Text;
  segmentValue: Phaser.GameObjects.Text;
  messageValue: any;
  sync(model: HudViewModel): void;
};

const PANEL_PADDING_X = 14;
const PANEL_GAP = 10;
const TOP_BAR_HEIGHT = 64;
const META_CHIP_HEIGHT = 48;
const MESSAGE_BOX_HEIGHT = 42;

const createText = (
  scene: Phaser.Scene,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text => scene.add.text(0, 0, text, style);

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

const createHudSection = (
  scene: Phaser.Scene,
  title: string,
  valueFontSize: number,
  valueColor: string = UI_COLORS.text,
): HudSection => {
  const background = createNinePatch(scene, 0, 0, 200, TOP_BAR_HEIGHT);
  const titleText = createText(scene, title, {
    ...RETRO_TEXT_STYLE,
    fontSize: '8px',
    color: UI_COLORS.dimText,
    letterSpacing: 1,
  }).setOrigin(0, 0);
  const valueText = createText(scene, '--', {
    ...RETRO_TEXT_STYLE,
    fontSize: `${valueFontSize}px`,
    color: valueColor,
    fontStyle: 'bold',
    wordWrap: { width: 150, useAdvancedWrap: true },
  }).setOrigin(0, 0);

  const root = scene.add.container(0, 0, [background, titleText, valueText]).setScrollFactor(0);

  return {
    root,
    background,
    title: titleText,
    value: valueText,
    setBounds(width: number, height: number) {
      resizePanel(background, width, height);
      background.setPosition(width / 2, height / 2);
      titleText.setPosition(PANEL_PADDING_X, 8);
      valueText.setPosition(PANEL_PADDING_X, 24);
      valueText.setWordWrapWidth(Math.max(48, width - PANEL_PADDING_X * 2), true);
    },
  };
};

const createMetaChip = (
  scene: Phaser.Scene,
  title: string,
): { root: Phaser.GameObjects.Container; value: Phaser.GameObjects.Text; setBounds(width: number, height: number): void } => {
  const background = createNinePatch(scene, 0, 0, 220, META_CHIP_HEIGHT);
  const titleText = createText(scene, title, {
    ...RETRO_TEXT_STYLE,
    fontSize: '8px',
    color: UI_COLORS.dimText,
  }).setOrigin(0, 0);
  const valueText = createText(scene, '--', {
    ...RETRO_TEXT_STYLE,
    fontSize: '10px',
    color: title === 'DIFFICULTY' ? '#f5cf64' : '#f7f3d6',
    fontStyle: 'bold',
    wordWrap: { width: 140, useAdvancedWrap: true },
  }).setOrigin(0, 0);

  const root = scene.add.container(0, 0, [background, titleText, valueText]).setScrollFactor(0);

  return {
    root,
    value: valueText,
    setBounds(width: number, height: number) {
      resizePanel(background, width, height);
      background.setPosition(width / 2, height / 2);
      titleText.setPosition(12, 8);
      valueText.setPosition(12, 22);
      valueText.setWordWrapWidth(Math.max(60, width - 24), true);
    },
  };
};

export const createRexHud = (scene: Phaser.Scene): RexHudBindings => {
  ensureUiPanelTexture(scene);

  const stageSection = createHudSection(scene, 'STAGE', 12, '#f5cf64');
  const coinsSection = createHudSection(scene, 'RESEARCH', 10);
  const healthSection = createHudSection(scene, 'HEALTH', 16, '#d6f58b');
  const powerSection = createHudSection(scene, 'POWER', 10, '#8fdff2');

  const topBar = scene.add
    .container(0, 0, [
      stageSection.root,
      coinsSection.root,
      healthSection.root,
      powerSection.root,
    ])
    .setDepth(200)
    .setScrollFactor(0);

  const difficultyChip = createMetaChip(scene, 'DIFFICULTY');
  const segmentChip = createMetaChip(scene, 'SEGMENT');
  const metaDock = scene.add
    .container(0, 0, [difficultyChip.root, segmentChip.root])
    .setDepth(200)
    .setScrollFactor(0);

  const messageValue = createText(scene, '', {
    ...RETRO_TEXT_STYLE,
    fontSize: '10px',
    color: UI_COLORS.text,
    wordWrap: { width: 300, useAdvancedWrap: true },
    lineSpacing: 2,
  }).setOrigin(0, 0);
  const messageBackground = createNinePatch(scene, 0, 0, 360, MESSAGE_BOX_HEIGHT);
  const messageBox = scene.add
    .container(0, 0, [messageBackground, messageValue])
    .setDepth(200)
    .setScrollFactor(0)
    .setVisible(false);

  const root = scene.add.container(0, 0, [topBar, metaDock, messageBox]).setDepth(200).setScrollFactor(0);

  const syncLayout = ({ width }: { width: number; height: number }): void => {
    const gutter = 10;
    const availableWidth = Math.max(560, width - gutter * 2);
    const stageWidth = Math.floor(availableWidth * 0.24);
    const coinsWidth = Math.floor(availableWidth * 0.4);
    const healthWidth = Math.floor(availableWidth * 0.12);
    const powerWidth = availableWidth - stageWidth - coinsWidth - healthWidth - PANEL_GAP * 3;

    stageSection.setBounds(stageWidth, TOP_BAR_HEIGHT);
    coinsSection.setBounds(coinsWidth, TOP_BAR_HEIGHT);
    healthSection.setBounds(healthWidth, TOP_BAR_HEIGHT);
    powerSection.setBounds(powerWidth, TOP_BAR_HEIGHT);

    stageSection.root.setPosition(0, 0);
    coinsSection.root.setPosition(stageWidth + PANEL_GAP, 0);
    healthSection.root.setPosition(stageWidth + coinsWidth + PANEL_GAP * 2, 0);
    powerSection.root.setPosition(stageWidth + coinsWidth + healthWidth + PANEL_GAP * 3, 0);
    topBar.setPosition(gutter, gutter);

    const chipWidth = Math.min(320, Math.max(220, Math.floor(width * 0.28)));
    const chipHeight = META_CHIP_HEIGHT;
    difficultyChip.setBounds(chipWidth, chipHeight);
    segmentChip.setBounds(chipWidth, chipHeight);
    difficultyChip.root.setPosition(0, 0);
    segmentChip.root.setPosition(0, chipHeight + 6);
    metaDock.setPosition(width - gutter - chipWidth, gutter + TOP_BAR_HEIGHT + 8);

    const messageWidth = Math.min(width - gutter * 2, width - chipWidth - gutter * 3 - 16);
    const resolvedMessageWidth = Math.max(320, messageWidth);
    resizePanel(messageBackground, resolvedMessageWidth, MESSAGE_BOX_HEIGHT);
    messageBackground.setPosition(resolvedMessageWidth / 2, MESSAGE_BOX_HEIGHT / 2);
    messageValue.setWordWrapWidth(Math.max(240, resolvedMessageWidth - 28), true);
    messageValue.setPosition(14, 12);
    messageBox.setPosition(gutter, gutter + TOP_BAR_HEIGHT + 8);
  };

  syncLayout({ width: scene.scale.width, height: scene.scale.height });
  scene.scale.on(Phaser.Scale.Events.RESIZE, syncLayout);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, syncLayout);
  });

  return {
    root,
    topBar,
    metaDock,
    messageBox,
    stageValue: stageSection.value,
    coinsValue: coinsSection.value,
    healthValue: healthSection.value,
    powerValue: powerSection.value,
    difficultyValue: difficultyChip.value,
    segmentValue: segmentChip.value,
    messageValue,
    sync(model: HudViewModel) {
      updateRexHud(this, model);
    },
  };
};

export const updateRexHud = (hud: RexHudBindings, model: HudViewModel): void => {
  hud.stageValue.setText(model.stageName);
  hud.coinsValue.setText(model.coins);
  hud.healthValue.setText(model.health.toString().padStart(2, '0'));
  hud.powerValue.setText(model.powerLabel);
  hud.difficultyValue.setText(model.difficultyLabel);
  hud.segmentValue.setText(model.segmentLabel);

  const message = model.message ?? '';
  if (message !== hud.messageValue.text) {
    if (message) {
      hud.messageBox.setVisible(true);
      hud.messageValue.setText(message);
    } else {
      hud.messageValue.setText('');
      hud.messageBox.setVisible(false);
    }
  }
};
