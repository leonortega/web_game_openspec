import * as Phaser from 'phaser';

export const UI_PANEL_TEXTURE_KEY = 'rex-ui-panel';

export const UI_COLORS = {
  ink: 0x11141b,
  panel: 0x19212a,
  panelAlt: 0x223041,
  panelBright: 0x2d3d51,
  border: 0xf7f3d6,
  warm: 0xf0b84b,
  cool: 0x8fdff2,
  text: '#f7f3d6',
  dimText: '#aab197',
  darkText: '#11141b',
} as const;

export const RETRO_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: '"Press Start 2P", monospace',
  color: UI_COLORS.text,
};

export const ensureUiPanelTexture = (scene: Phaser.Scene): void => {
  if (!(scene as Partial<Phaser.Scene>).textures) {
    return;
  }

  if (scene.textures.exists(UI_PANEL_TEXTURE_KEY)) {
    return;
  }

  const graphics = scene.add.graphics();
  graphics.setVisible(false);
  graphics.fillStyle(UI_COLORS.border, 1);
  graphics.fillRoundedRect(0, 0, 48, 48, 10);
  graphics.fillStyle(UI_COLORS.ink, 1);
  graphics.fillRoundedRect(4, 4, 40, 40, 7);
  graphics.fillStyle(UI_COLORS.panel, 1);
  graphics.fillRoundedRect(8, 8, 32, 32, 4);
  graphics.fillStyle(UI_COLORS.panelBright, 1);
  graphics.fillRect(8, 8, 32, 10);
  graphics.fillStyle(UI_COLORS.panelAlt, 1);
  graphics.fillRect(8, 18, 32, 22);
  graphics.lineStyle(2, UI_COLORS.warm, 0.9);
  graphics.strokeRoundedRect(6, 6, 36, 36, 5);
  graphics.generateTexture(UI_PANEL_TEXTURE_KEY, 48, 48);
  graphics.destroy();
};

export const createNinePatch = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): any => {
  if (!(scene as Partial<Phaser.Scene>).rexUI || !(scene as Partial<Phaser.Scene>).textures) {
    return scene.add.rectangle(x, y, width, height, UI_COLORS.panelAlt, 0.96).setStrokeStyle(3, UI_COLORS.border, 0.9);
  }

  ensureUiPanelTexture(scene);

  return (scene.rexUI as any).add
    .ninePatch(x, y, width, height, UI_PANEL_TEXTURE_KEY, [12, 24, 12], [12, 24, 12])
    .setOrigin(0.5);
};

export const createTagText = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  width: number,
  extraStyle: Phaser.Types.GameObjects.Text.TextStyle = {},
): any =>
  (scene.add as any).rexTagText
    ? (scene.add as any).rexTagText(x, y, text, {
        ...RETRO_TEXT_STYLE,
        fontSize: '14px',
        lineSpacing: 10,
        wordWrap: { width },
        tags: {
          title: { color: '#f0b84b' },
          dim: { color: '#aab197' },
          accent: { color: '#8fdff2' },
          danger: { color: '#ff8a6b' },
          ok: { color: '#d6f58b' },
        },
        ...extraStyle,
      })
    : scene.add.text(x, y, text.replace(/\[[^\]]+\]/g, ''), {
        ...RETRO_TEXT_STYLE,
        fontSize: '14px',
        lineSpacing: 10,
        wordWrap: { width },
        ...extraStyle,
      });

export const bindScaleOuter = (scene: Phaser.Scene): void => {
  if (!(scene as Partial<Phaser.Scene>).rexScaleOuter) {
    return;
  }

  const apply = (): void => {
    scene.rexScaleOuter.scale();
  };

  apply();
  scene.scale.on(Phaser.Scale.Events.RESIZE, apply);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, apply);
  });
};

export const getAuthoredGameSize = (
  scene: Phaser.Scene,
): {
  width: number;
  height: number;
} => ({
  width: Number(scene.game.config.width) || 960,
  height: Number(scene.game.config.height) || 540,
});

export const getViewportMetrics = (
  scene: Phaser.Scene,
  gameSize?: { width: number; height: number },
): {
  left: number;
  top: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  safeInsetX: number;
  safeInsetY: number;
} => {
  const width = gameSize?.width || scene.scale.width;
  const height = gameSize?.height || scene.scale.height;
  const left = 0;
  const top = 0;
  const safeInsetX = Math.max(28, Math.min(64, Math.floor(width * 0.065)));
  const safeInsetY = Math.max(34, Math.min(72, Math.floor(height * 0.1)));

  return {
    left,
    top,
    width,
    height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    safeInsetX,
    safeInsetY,
  };
};
