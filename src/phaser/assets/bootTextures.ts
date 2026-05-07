import type Phaser from 'phaser';

import {
  EXIT_CAPSULE_ART_BOUNDS,
  EXIT_CAPSULE_OPEN_DOOR_ART_BOUNDS,
  EXIT_CAPSULE_ART_SIZE,
  EXIT_CAPSULE_TEXTURE_KEYS,
  drawExitCapsuleArt,
} from '../view/capsulePresentation';
import { createRetroPresentationPalette } from '../view/retroPresentation';

type CapsuleSection = 'base' | 'beacon' | 'shell' | 'door';

type PixelTextureArtist = {
  outlinedRect: (x: number, y: number, width: number, height: number, fill: string) => void;
  fillRect: (x: number, y: number, width: number, height: number, fill: string) => void;
};

const REQUIRED_BOOT_TEXTURE_KEYS = [
  'player-sheet',
  'player-idle',
  'player-run',
  'player-jump',
  'player-fall',
  'player-dash',
  'player-hurt',
  'player-defeat',
  'platform-tiles',
  'terrain-sticky',
  'terrain-brittle',
  'terrain-brittle-warning',
  'terrain-brittle-ready',
  'terrain-brittle-broken',
  'gravity-field-stream',
  'gravity-field-invert',
  'gravity-capsule-shell',
  'gravity-capsule-entry-door',
  'gravity-capsule-exit-door',
  'gravity-capsule-button',
  'gravity-capsule-button-core',
  'hazard-spikes',
  'hazard-spikes-warning',
  'reward-block',
  'reward-block-used',
  'activation-node',
  'exit-base',
  'exit-beacon',
  'arrival-base',
  'arrival-beacon',
  'walker',
  'hopper',
  'turret',
  'charger',
  'flyer',
  'projectile',
  'retro-particle',
  'retro-particle-burst',
  'collectible',
  'checkpoint',
  EXIT_CAPSULE_TEXTURE_KEYS.full,
  EXIT_CAPSULE_TEXTURE_KEYS.shell,
  EXIT_CAPSULE_TEXTURE_KEYS.door,
  EXIT_CAPSULE_TEXTURE_KEYS.doorOpen,
] as const;

const BOOT_TEXTURE_VERSION = 6;
const BOOT_TEXTURE_VERSION_KEY = '__bootTextureVersion';

const PLAYER_SHEET_FRAME_SIZE = {
  width: 32,
  height: 48,
} as const;

export const WALKER_TEXTURE_SIZE = {
  width: 30,
  height: 28,
} as const;

export const HOPPER_TEXTURE_SIZE = {
  width: 30,
  height: 28,
} as const;

export const TURRET_TEXTURE_SIZE = {
  width: 28,
  height: 38,
} as const;

export const CHARGER_TEXTURE_SIZE = {
  width: 34,
  height: 30,
} as const;

export const FLYER_TEXTURE_SIZE = {
  width: 34,
  height: 24,
} as const;

export const CHECKPOINT_TEXTURE_SIZE = {
  width: 24,
  height: 80,
} as const;

export const drawWalkerTextureArt = (artist: PixelTextureArtist): void => {
  artist.outlinedRect(8, 5, 14, 10, '#f2dfc0');
  artist.fillRect(11, 8, 8, 4, '#11141b');
  artist.fillRect(18, 9, 2, 2, '#f5cf64');
  artist.fillRect(10, 13, 10, 2, '#e97652');
  artist.outlinedRect(6, 15, 18, 8, '#d6b88f');
  artist.fillRect(8, 17, 14, 3, '#31451d');
  artist.fillRect(4, 16, 2, 5, '#31451d');
  artist.fillRect(24, 16, 2, 5, '#31451d');
  artist.outlinedRect(8, 23, 5, 5, '#f7f3d6');
  artist.outlinedRect(17, 23, 5, 5, '#f7f3d6');
  artist.fillRect(8, 27, 5, 1, '#11141b');
  artist.fillRect(17, 27, 5, 1, '#11141b');
};

export const drawHopperTextureArt = (artist: PixelTextureArtist): void => {
  artist.outlinedRect(8, 6, 14, 9, '#dfe8bf');
  artist.fillRect(10, 9, 10, 3, '#2e4030');
  artist.fillRect(12, 7, 6, 1, '#f7f3d6');
  artist.outlinedRect(7, 15, 16, 7, '#b8c986');
  artist.fillRect(9, 17, 12, 3, '#5e7d39');
  artist.fillRect(5, 17, 2, 3, '#11141b');
  artist.fillRect(23, 17, 2, 3, '#11141b');
  artist.outlinedRect(5, 22, 7, 6, '#f5cf64');
  artist.outlinedRect(18, 22, 7, 6, '#f5cf64');
  artist.fillRect(7, 26, 3, 2, '#11141b');
  artist.fillRect(20, 26, 3, 2, '#11141b');
};

export const drawTurretTextureArt = (artist: PixelTextureArtist): void => {
  artist.outlinedRect(8, 4, 12, 11, '#f7f3d6');
  artist.fillRect(10, 7, 8, 4, '#8fdff2');
  artist.fillRect(11, 12, 6, 2, '#31451d');
  artist.outlinedRect(19, 8, 6, 4, '#f0c6a1');
  artist.fillRect(22, 9, 3, 2, '#11141b');
  artist.outlinedRect(6, 16, 16, 8, '#d8c2a0');
  artist.fillRect(8, 18, 12, 3, '#31451d');
  artist.outlinedRect(5, 24, 18, 9, '#c6d2bf');
  artist.fillRect(8, 27, 12, 2, '#11141b');
  artist.fillRect(9, 30, 4, 2, '#f5cf64');
  artist.fillRect(15, 30, 4, 2, '#f5cf64');
  artist.fillRect(8, 33, 12, 3, '#31451d');
  artist.fillRect(9, 36, 10, 2, '#11141b');
};

export const drawChargerTextureArt = (artist: PixelTextureArtist): void => {
  artist.outlinedRect(8, 6, 16, 9, '#f08f6a');
  artist.fillRect(10, 9, 9, 3, '#5f2b1a');
  artist.fillRect(20, 8, 3, 5, '#f7f3d6');
  artist.fillRect(6, 8, 2, 4, '#f7f3d6');
  artist.outlinedRect(6, 15, 20, 8, '#e97652');
  artist.fillRect(9, 17, 14, 3, '#8a3d24');
  artist.fillRect(5, 18, 2, 3, '#11141b');
  artist.fillRect(26, 18, 2, 3, '#11141b');
  artist.outlinedRect(9, 23, 5, 7, '#f5cf64');
  artist.outlinedRect(18, 23, 5, 7, '#f5cf64');
  artist.fillRect(9, 29, 5, 1, '#11141b');
  artist.fillRect(18, 29, 5, 1, '#11141b');
};

export const drawFlyerTextureArt = (artist: PixelTextureArtist): void => {
  artist.outlinedRect(11, 4, 12, 5, '#d6edf2');
  artist.fillRect(14, 4, 6, 3, '#8fdff2');
  artist.fillRect(13, 7, 8, 1, '#173848');
  artist.outlinedRect(8, 8, 18, 4, '#f7f3d6');
  artist.fillRect(4, 11, 26, 3, '#c6d2bf');
  artist.fillRect(2, 12, 6, 2, '#9fdae8');
  artist.fillRect(26, 12, 6, 2, '#9fdae8');
  artist.fillRect(9, 14, 16, 2, '#d6edf2');
  artist.fillRect(11, 16, 12, 2, '#fff7d8');
  artist.fillRect(12, 18, 10, 2, '#f5cf64');
  artist.fillRect(15, 20, 4, 2, '#8fdff2');
};

export const drawCheckpointTextureArt = (artist: PixelTextureArtist): void => {
  artist.outlinedRect(7, 8, 10, 12, '#f7f3d6');
  artist.fillRect(9, 11, 6, 4, '#8fdff2');
  artist.outlinedRect(9, 20, 6, 50, '#c6d2bf');
  artist.fillRect(7, 28, 10, 4, '#11141b');
  artist.fillRect(7, 44, 10, 4, '#11141b');
  artist.fillRect(8, 22, 8, 2, '#31451d');
  artist.fillRect(8, 60, 8, 2, '#31451d');
  artist.outlinedRect(1, 68, 22, 12, '#f5cf64');
  artist.fillRect(4, 71, 16, 5, '#fff7d8');
  artist.fillRect(2, 77, 20, 3, '#31451d');
};

export const registerBootTextures = (scene: Phaser.Scene): void => {
  const retro = createRetroPresentationPalette({ accent: 0x8fdff2 });

  createPixelSpriteSheet(
    scene,
    'player-sheet',
    PLAYER_SHEET_FRAME_SIZE.width,
    PLAYER_SHEET_FRAME_SIZE.height,
    24,
    (context, frameIndex) => {
      drawPlayerSheetFrame(context, frameIndex);
    },
  );

  createPixelTexture(scene, 'player-idle', PLAYER_SHEET_FRAME_SIZE.width, PLAYER_SHEET_FRAME_SIZE.height, (context) => {
    drawPlayerSheetFrame(context, 0);
  });
  createPixelTexture(scene, 'player-run', PLAYER_SHEET_FRAME_SIZE.width, PLAYER_SHEET_FRAME_SIZE.height, (context) => {
    drawPlayerSheetFrame(context, 4);
  });
  createPixelTexture(scene, 'player-jump', PLAYER_SHEET_FRAME_SIZE.width, PLAYER_SHEET_FRAME_SIZE.height, (context) => {
    drawPlayerSheetFrame(context, 10);
  });
  createPixelTexture(scene, 'player-fall', PLAYER_SHEET_FRAME_SIZE.width, PLAYER_SHEET_FRAME_SIZE.height, (context) => {
    drawPlayerSheetFrame(context, 12);
  });
  createPixelTexture(scene, 'player-dash', PLAYER_SHEET_FRAME_SIZE.width, PLAYER_SHEET_FRAME_SIZE.height, (context) => {
    drawPlayerSheetFrame(context, 14);
  });
  createPixelTexture(scene, 'player-hurt', PLAYER_SHEET_FRAME_SIZE.width, PLAYER_SHEET_FRAME_SIZE.height, (context) => {
    drawPlayerSheetFrame(context, 17);
  });
  createPixelTexture(scene, 'player-defeat', PLAYER_SHEET_FRAME_SIZE.width, PLAYER_SHEET_FRAME_SIZE.height, (context) => {
    drawPlayerSheetFrame(context, 19);
  });

  createPixelTexture(scene, 'player', 26, 42, (context) => {
    // Legacy single-frame astronaut texture kept side-view (faces right by default).
    outlinedRect(context, 9, 4, 12, 12, '#fff6ee');
    fillRect(context, 10, 5, 10, 2, '#e9edf4');
    fillRect(context, 12, 7, 7, 6, '#d38a34');
    fillRect(context, 13, 7, 4, 2, '#f6c777');
    fillRect(context, 10, 8, 2, 3, '#67c8ec');
    fillRect(context, 9, 14, 12, 2, '#67c8ec');

    outlinedRect(context, 10, 16, 10, 14, '#fff6ee');
    fillRect(context, 11, 17, 8, 2, '#e9edf4');
    fillRect(context, 10, 19, 10, 3, '#67c8ec');
    fillRect(context, 11, 24, 8, 3, '#2a8fb8');
    fillRect(context, 12, 27, 6, 2, '#f6c777');

    fillRect(context, 8, 19, 2, 8, '#67c8ec');
    fillRect(context, 7, 21, 1, 3, '#2a8fb8');
    fillRect(context, 20, 18, 2, 8, '#fff6ee');
    fillRect(context, 21, 20, 2, 2, '#67c8ec');

    fillRect(context, 11, 30, 3, 9, '#fff6ee');
    fillRect(context, 16, 31, 3, 8, '#fff6ee');
    fillRect(context, 10, 35, 5, 2, '#67c8ec');
    fillRect(context, 15, 36, 5, 2, '#67c8ec');
    fillRect(context, 10, 39, 5, 3, '#17323c');
    fillRect(context, 15, 39, 5, 3, '#17323c');
    fillRect(context, 10, 39, 5, 2, '#67c8ec');
    fillRect(context, 15, 39, 5, 2, '#67c8ec');
  });

  createPixelTexture(scene, 'walker', WALKER_TEXTURE_SIZE.width, WALKER_TEXTURE_SIZE.height, (context) => {
    drawWalkerTextureArt({
      outlinedRect: (x, y, width, height, fill) => outlinedRect(context, x, y, width, height, fill),
      fillRect: (x, y, width, height, fill) => fillRect(context, x, y, width, height, fill),
    });
  });

  createPixelTexture(scene, 'hopper', HOPPER_TEXTURE_SIZE.width, HOPPER_TEXTURE_SIZE.height, (context) => {
    drawHopperTextureArt({
      outlinedRect: (x, y, width, height, fill) => outlinedRect(context, x, y, width, height, fill),
      fillRect: (x, y, width, height, fill) => fillRect(context, x, y, width, height, fill),
    });
  });

  createPixelTexture(scene, 'turret', TURRET_TEXTURE_SIZE.width, TURRET_TEXTURE_SIZE.height, (context) => {
    drawTurretTextureArt({
      outlinedRect: (x, y, width, height, fill) => outlinedRect(context, x, y, width, height, fill),
      fillRect: (x, y, width, height, fill) => fillRect(context, x, y, width, height, fill),
    });
  });

  createPixelTexture(scene, 'charger', CHARGER_TEXTURE_SIZE.width, CHARGER_TEXTURE_SIZE.height, (context) => {
    drawChargerTextureArt({
      outlinedRect: (x, y, width, height, fill) => outlinedRect(context, x, y, width, height, fill),
      fillRect: (x, y, width, height, fill) => fillRect(context, x, y, width, height, fill),
    });
  });

  createPixelTexture(scene, 'flyer', FLYER_TEXTURE_SIZE.width, FLYER_TEXTURE_SIZE.height, (context) => {
    drawFlyerTextureArt({
      outlinedRect: (x, y, width, height, fill) => outlinedRect(context, x, y, width, height, fill),
      fillRect: (x, y, width, height, fill) => fillRect(context, x, y, width, height, fill),
    });
  });

  createPixelTexture(scene, 'projectile', 12, 12, (context) => {
    outlinedRect(context, 4, 1, 4, 10, '#f7f3d6');
    fillRect(context, 5, 3, 2, 6, '#ffb34e');
    fillRect(context, 2, 4, 8, 4, '#f5cf64');
  });

  createPixelTexture(scene, 'retro-particle', 4, 4, (context) => {
    fillRect(context, 1, 0, 2, 4, '#fff7d8');
    fillRect(context, 0, 1, 4, 2, '#f5cf64');
  });

  createPixelTexture(scene, 'retro-particle-burst', 12, 12, (context) => {
    fillRect(context, 5, 0, 2, 12, '#fff7d8');
    fillRect(context, 0, 5, 12, 2, '#fff7d8');
    fillRect(context, 3, 1, 6, 10, '#f5cf64');
    fillRect(context, 1, 3, 10, 6, '#ffb34e');
    fillRect(context, 4, 4, 4, 4, '#ffffff');
    fillRect(context, 2, 2, 2, 2, '#fff7d8');
    fillRect(context, 8, 2, 2, 2, '#fff7d8');
    fillRect(context, 2, 8, 2, 2, '#fff7d8');
    fillRect(context, 8, 8, 2, 2, '#fff7d8');
  });

  createPixelTexture(scene, 'collectible', 20, 20, (context) => {
    outlinedRect(context, 4, 4, 12, 12, '#f5cf64');
    fillRect(context, 6, 6, 8, 8, '#f7f3d6');
    fillRect(context, 8, 4, 4, 12, '#fff7d8');
    fillRect(context, 4, 8, 12, 4, '#fff7d8');
  });

  createPixelTexture(scene, 'checkpoint', CHECKPOINT_TEXTURE_SIZE.width, CHECKPOINT_TEXTURE_SIZE.height, (context) => {
    drawCheckpointTextureArt({
      outlinedRect: (x, y, width, height, fill) => outlinedRect(context, x, y, width, height, fill),
      fillRect: (x, y, width, height, fill) => fillRect(context, x, y, width, height, fill),
    });
  });

  createPixelTexture(scene, 'platform-tiles', 16, 16, (context) => {
    outlinedRect(context, 1, 2, 14, 12, '#6a7d90');
    fillRect(context, 2, 3, 12, 3, '#9bb2c2');
    fillRect(context, 3, 7, 10, 2, '#4a5b6b');
    fillRect(context, 2, 11, 12, 2, '#2a3440');
  });
  createPixelTexture(scene, 'terrain-sticky', 16, 16, (context) => {
    outlinedRect(context, 1, 2, 14, 12, '#4e6535');
    fillRect(context, 2, 3, 12, 3, '#8fae58');
    fillRect(context, 3, 8, 10, 4, '#67863d');
    fillRect(context, 5, 12, 6, 2, '#2f4520');
  });
  createPixelTexture(scene, 'terrain-brittle', 16, 16, (context) => {
    outlinedRect(context, 1, 2, 14, 12, '#7c6d99');
    fillRect(context, 2, 3, 12, 3, '#b9a6e2');
    fillRect(context, 4, 8, 3, 3, '#f0e8ff');
    fillRect(context, 9, 8, 3, 3, '#d6c6ff');
    fillRect(context, 6, 11, 4, 2, '#5d4b7f');
  });
  createPixelTexture(scene, 'terrain-brittle-warning', 16, 16, (context) => {
    outlinedRect(context, 1, 2, 14, 12, '#7f5a30');
    fillRect(context, 2, 3, 12, 3, '#f4cc6a');
    fillRect(context, 4, 8, 3, 3, '#fff1bc');
    fillRect(context, 9, 8, 3, 3, '#f7dc8a');
    fillRect(context, 6, 11, 4, 2, '#6b4a22');
  });
  createPixelTexture(scene, 'terrain-brittle-ready', 16, 16, (context) => {
    outlinedRect(context, 1, 2, 14, 12, '#7a3a2f');
    fillRect(context, 2, 3, 12, 3, '#ef8a62');
    fillRect(context, 4, 8, 3, 3, '#ffd0b9');
    fillRect(context, 9, 8, 3, 3, '#f5ab87');
    fillRect(context, 6, 11, 4, 2, '#5f281e');
  });
  createPixelTexture(scene, 'terrain-brittle-broken', 16, 16, (context) => {
    outlinedRect(context, 1, 2, 14, 12, '#3f394a');
    fillRect(context, 2, 3, 12, 3, '#7d748f');
    fillRect(context, 3, 8, 10, 2, '#5a5268');
    fillRect(context, 5, 11, 6, 2, '#312c3a');
  });
  createPixelTexture(scene, 'gravity-field-stream', 16, 16, (context) => {
    fillRect(context, 2, 2, 3, 12, '#9be8f7');
    fillRect(context, 6, 1, 3, 13, '#d8f7ff');
    fillRect(context, 10, 3, 3, 11, '#7bc8e2');
  });
  createPixelTexture(scene, 'gravity-field-invert', 16, 16, (context) => {
    fillRect(context, 2, 2, 3, 12, '#ffd2a7');
    fillRect(context, 6, 1, 3, 13, '#fff2d6');
    fillRect(context, 10, 3, 3, 11, '#f3a467');
  });
  createPixelTexture(scene, 'gravity-capsule-shell', 48, 64, (context) => {
    outlinedRect(context, 6, 8, 36, 48, '#9aa5bf');
    fillRect(context, 10, 12, 28, 10, '#d8e5ff');
    fillRect(context, 10, 24, 28, 24, '#7484a5');
    fillRect(context, 18, 50, 12, 4, '#3c4a66');
  });
  createPixelTexture(scene, 'gravity-capsule-entry-door', 16, 32, (context) => {
    outlinedRect(context, 2, 2, 12, 28, '#8fb8ff');
    fillRect(context, 4, 4, 8, 6, '#dce9ff');
    fillRect(context, 4, 12, 8, 16, '#5673a8');
  });
  createPixelTexture(scene, 'gravity-capsule-exit-door', 16, 32, (context) => {
    outlinedRect(context, 2, 2, 12, 28, '#f2b98c');
    fillRect(context, 4, 4, 8, 6, '#ffebd6');
    fillRect(context, 4, 12, 8, 16, '#b77449');
  });
  createPixelTexture(scene, 'gravity-capsule-button', 24, 16, (context) => {
    outlinedRect(context, 2, 4, 20, 10, '#6f7f98');
    fillRect(context, 4, 6, 16, 4, '#c6d6f5');
    fillRect(context, 6, 11, 12, 2, '#4b5970');
  });
  createPixelTexture(scene, 'gravity-capsule-button-core', 12, 8, (context) => {
    outlinedRect(context, 1, 1, 10, 6, '#f7f3d6');
    fillRect(context, 3, 2, 6, 4, '#8fdff2');
  });
  createPixelTexture(scene, 'hazard-spikes', 16, 16, (context) => {
    fillRect(context, 0, 12, 16, 4, '#581f1f');
    fillRect(context, 1, 7, 3, 5, '#ff926a');
    fillRect(context, 6, 5, 3, 7, '#ffd1bf');
    fillRect(context, 11, 7, 3, 5, '#ff926a');
  });
  createPixelTexture(scene, 'hazard-spikes-warning', 16, 16, (context) => {
    fillRect(context, 0, 12, 16, 4, '#684521');
    fillRect(context, 1, 7, 3, 5, '#ffd36a');
    fillRect(context, 6, 5, 3, 7, '#fff3c9');
    fillRect(context, 11, 7, 3, 5, '#ffd36a');
  });
  createPixelTexture(scene, 'reward-block', 24, 24, (context) => {
    outlinedRect(context, 2, 2, 20, 20, '#b37b2a');
    fillRect(context, 4, 4, 16, 16, '#f1c35f');
    fillRect(context, 6, 6, 12, 4, '#fff2be');
    fillRect(context, 7, 12, 10, 6, '#df9e42');
  });
  createPixelTexture(scene, 'reward-block-used', 24, 24, (context) => {
    outlinedRect(context, 2, 2, 20, 20, '#67635c');
    fillRect(context, 4, 4, 16, 16, '#9e9688');
    fillRect(context, 6, 7, 12, 3, '#c9c1b2');
    fillRect(context, 7, 12, 10, 6, '#7f776b');
  });
  createPixelTexture(scene, 'activation-node', 20, 20, (context) => {
    outlinedRect(context, 2, 2, 16, 16, '#5f6f8f');
    fillRect(context, 4, 4, 12, 12, '#a8bfe5');
    fillRect(context, 7, 7, 6, 6, '#e8f2ff');
  });
  createPixelTexture(scene, 'exit-base', 64, 16, (context) => {
    outlinedRect(context, 2, 3, 60, 10, '#5f6e8a');
    fillRect(context, 4, 5, 56, 3, '#aabddf');
    fillRect(context, 6, 9, 52, 2, '#465471');
  });
  createPixelTexture(scene, 'exit-beacon', 16, 16, (context) => {
    outlinedRect(context, 3, 3, 10, 10, '#f7f3d6');
    fillRect(context, 5, 5, 6, 6, '#8fdff2');
  });
  createPixelTexture(scene, 'arrival-base', 48, 14, (context) => {
    outlinedRect(context, 2, 2, 44, 10, '#6c7e9e');
    fillRect(context, 4, 4, 40, 3, '#b8caeb');
    fillRect(context, 6, 8, 36, 2, '#4b5a79');
  });
  createPixelTexture(scene, 'arrival-beacon', 14, 14, (context) => {
    outlinedRect(context, 2, 2, 10, 10, '#f7f3d6');
    fillRect(context, 4, 4, 6, 6, '#9ce2f4');
  });

  const exitWarmHex = `#${retro.warm.toString(16).padStart(6, '0')}`;
  const drawCapsuleArt = (
    context: CanvasRenderingContext2D,
    sections: readonly CapsuleSection[],
    originX = 0,
    originY = 0,
    doorBounds = EXIT_CAPSULE_ART_BOUNDS.door,
  ) => {
    drawExitCapsuleArt(
      {
        outlinedRect: (x, y, width, height, fill) => outlinedRect(context, x, y, width, height, fill),
        fillRect: (x, y, width, height, fill) => fillRect(context, x, y, width, height, fill),
      },
      exitWarmHex,
      sections,
      originX,
      originY,
      { doorBounds },
    );
  };

  createPixelTexture(scene, EXIT_CAPSULE_TEXTURE_KEYS.full, EXIT_CAPSULE_ART_SIZE.width, EXIT_CAPSULE_ART_SIZE.height, (context) => {
    drawCapsuleArt(context, ['base', 'shell', 'door', 'beacon']);
  });
  createPixelTexture(scene, EXIT_CAPSULE_TEXTURE_KEYS.shell, EXIT_CAPSULE_ART_BOUNDS.shell.width, EXIT_CAPSULE_ART_BOUNDS.shell.height, (context) => {
    drawCapsuleArt(context, ['shell'], EXIT_CAPSULE_ART_BOUNDS.shell.x, EXIT_CAPSULE_ART_BOUNDS.shell.y);
  });
  createPixelTexture(scene, EXIT_CAPSULE_TEXTURE_KEYS.door, EXIT_CAPSULE_ART_BOUNDS.door.width, EXIT_CAPSULE_ART_BOUNDS.door.height, (context) => {
    drawCapsuleArt(context, ['door'], EXIT_CAPSULE_ART_BOUNDS.door.x, EXIT_CAPSULE_ART_BOUNDS.door.y);
  });
  createPixelTexture(scene, EXIT_CAPSULE_TEXTURE_KEYS.doorOpen, EXIT_CAPSULE_OPEN_DOOR_ART_BOUNDS.width, EXIT_CAPSULE_OPEN_DOOR_ART_BOUNDS.height, (context) => {
    drawCapsuleArt(
      context,
      ['door'],
      EXIT_CAPSULE_OPEN_DOOR_ART_BOUNDS.x,
      EXIT_CAPSULE_OPEN_DOOR_ART_BOUNDS.y,
      EXIT_CAPSULE_OPEN_DOOR_ART_BOUNDS,
    );
  });
};

export const ensureBootTexturesRegistered = (scene: Phaser.Scene): void => {
  const registeredVersion = scene.registry.get(BOOT_TEXTURE_VERSION_KEY);
  if (registeredVersion === BOOT_TEXTURE_VERSION && REQUIRED_BOOT_TEXTURE_KEYS.every((key) => scene.textures.exists(key))) {
    return;
  }

  registerBootTextures(scene);
  scene.registry.set(BOOT_TEXTURE_VERSION_KEY, BOOT_TEXTURE_VERSION);
};

function createPixelTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void,
): void {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error(`Unable to create placeholder texture ${key}`);
  }

  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;
  draw(context);

  try {
    quantizeCanvasTo565(context, width, height);
  } catch (err) {
    // If quantization fails for any reason, fall back to original canvas.
    // (Don't block game boot for non-critical visual processing.)
    // eslint-disable-next-line no-console
    console.warn('16-bit quantization failed for', key, err);
  }

  scene.textures.addCanvas(key, canvas);
}

function createPixelSpriteSheet(
  scene: Phaser.Scene,
  key: string,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
  drawFrame: (context: CanvasRenderingContext2D, frameIndex: number) => void,
): void {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const canvas = document.createElement('canvas');
  canvas.width = frameWidth * frameCount;
  canvas.height = frameHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error(`Unable to create sprite sheet texture ${key}`);
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    context.save();
    context.translate(frameIndex * frameWidth, 0);
    drawFrame(context, frameIndex);
    context.restore();
  }

  scene.textures.addCanvas(key, canvas);
  const texture = scene.textures.get(key);
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    texture.add(`${frameIndex}`, 0, frameIndex * frameWidth, 0, frameWidth, frameHeight);
  }
}

export function drawPlayerSheetFrame(context: CanvasRenderingContext2D, frameIndex: number): void {
  const suit = frameIndex >= 19 ? '#e7a17e' : '#fff6ee';
  const suitShade = frameIndex >= 19 ? '#d58461' : '#e9edf4';
  const trim = '#67c8ec';
  const trimDark = '#2a8fb8';
  const visor = frameIndex >= 19 ? '#fff0c8' : '#d38a34';
  const visorGlow = frameIndex >= 19 ? '#ffe1aa' : '#f6c777';
  const sole = '#17323c';
  const outline = '#1d252d';

  const frameGroup =
    frameIndex <= 3
      ? 'idle'
      : frameIndex <= 9
        ? 'run'
        : frameIndex <= 11
          ? 'jump'
          : frameIndex <= 13
            ? 'fall'
            : frameIndex <= 16
              ? 'dash'
              : frameIndex <= 18
                ? 'hurt'
                : 'defeat';

  const localFrame =
    frameGroup === 'run'
      ? frameIndex - 4
      : frameGroup === 'jump'
        ? frameIndex - 10
        : frameGroup === 'fall'
          ? frameIndex - 12
          : frameGroup === 'dash'
            ? frameIndex - 14
            : frameGroup === 'hurt'
              ? frameIndex - 17
              : frameIndex;
  const runPhase = localFrame % 4;
  let helmetY = 3;
  let bodyY = 15;
  let torsoHeight = 14;
  let suitStripeY = bodyY + 6;
  let packY = bodyY + 3;
  let packHeight = 8;
  let frontArmX = 20;
  let frontArmY = bodyY + 2;
  let frontArmHeight = 8;
  let handX = 21;
  let handY = bodyY + 4;
  let leftLegY = 31;
  let rightLegY = 31;
  let leftBootY = 41;
  let rightBootY = 41;
  let hurtShift = 0;
  let dashTrailWidth = 0;

  if (frameGroup === 'idle') {
    const idlePhase = frameIndex % 4;
    helmetY += idlePhase === 1 ? -1 : 0;
    bodyY += idlePhase === 1 ? -1 : 0;
    suitStripeY = bodyY + 6;
    packY = bodyY + (idlePhase >= 2 ? 4 : 3);
  } else if (frameGroup === 'run') {
    const helmetBob = [1, 0, -1, 0][runPhase] ?? 0;
    const bodyBob = [1, 0, -1, 0][runPhase] ?? 0;
    const frontArmLift = [-1, 1, 2, 0][runPhase] ?? 0;
    const leftLegLift = [-2, 0, 2, 0][runPhase] ?? 0;
    const rightLegLift = [1, 2, -2, 0][runPhase] ?? 0;

    helmetY += helmetBob;
    bodyY += bodyBob;
    suitStripeY = bodyY + 6;
    packY = bodyY + (runPhase === 1 ? 4 : runPhase === 2 ? 2 : 3);
    frontArmY = bodyY + 2 + frontArmLift;
    handY = bodyY + 4 + frontArmLift;
    leftLegY += leftLegLift;
    leftBootY += leftLegLift;
    rightLegY += rightLegLift;
    rightBootY += rightLegLift;
  } else if (frameGroup === 'jump') {
    helmetY += localFrame === 0 ? -1 : -3;
    bodyY += localFrame === 0 ? -2 : -4;
    torsoHeight = localFrame === 0 ? 13 : 12;
    suitStripeY = bodyY + 5;
    packY = bodyY + 2;
    frontArmX = 21;
    frontArmY = bodyY + (localFrame === 0 ? -1 : -2);
    frontArmHeight = localFrame === 0 ? 7 : 6;
    handX = 22;
    handY = bodyY + (localFrame === 0 ? 1 : 0);
    leftLegY -= localFrame === 0 ? 2 : 4;
    leftBootY -= localFrame === 0 ? 2 : 4;
    rightLegY -= localFrame === 0 ? 1 : 3;
    rightBootY -= localFrame === 0 ? 1 : 3;
  } else if (frameGroup === 'fall') {
    bodyY += localFrame === 0 ? 2 : 3;
    torsoHeight = localFrame === 0 ? 15 : 16;
    suitStripeY = bodyY + 6;
    packY = bodyY + (localFrame === 0 ? 4 : 5);
    frontArmY = bodyY + (localFrame === 0 ? 3 : 4);
    leftLegY += localFrame === 0 ? 1 : 2;
    leftBootY += localFrame === 0 ? 1 : 2;
    rightLegY += localFrame === 0 ? 2 : 3;
    rightBootY += localFrame === 0 ? 2 : 3;
  } else if (frameGroup === 'dash') {
    bodyY += 1;
    torsoHeight = 13;
    suitStripeY = bodyY + 5;
    packY = bodyY + 2;
    frontArmX = 21;
    frontArmY = bodyY;
    frontArmHeight = 7;
    handX = 22;
    handY = bodyY + 2;
    leftLegY -= 2;
    leftBootY -= 2;
    rightLegY -= 1;
    rightBootY -= 1;
    dashTrailWidth = localFrame === 0 ? 4 : localFrame === 1 ? 6 : 3;
  } else if (frameGroup === 'hurt') {
    hurtShift = localFrame === 0 ? 1 : 2;
    helmetY += localFrame === 0 ? 0 : 1;
    bodyY += 1;
    suitStripeY = bodyY + 6;
    packY = bodyY + 3;
    frontArmY = bodyY + (localFrame === 0 ? 3 : 4);
    leftLegY += 1;
    rightLegY += 2;
  }

  // Side-profile astronaut facing right by default; runtime flips for left.
  outlinedRect(context, 9 + hurtShift, helmetY, 12, 12, suit);
  fillRect(context, 10 + hurtShift, helmetY + 1, 10, 2, suitShade);
  fillRect(context, 12 + hurtShift, helmetY + 3, 7, 6, visor);
  fillRect(context, 13 + hurtShift, helmetY + 3, 4, 2, visorGlow);
  fillRect(context, 10 + hurtShift, helmetY + 4, 2, 3, trim);
  fillRect(context, 9 + hurtShift, helmetY + 10, 12, 2, trim);

  outlinedRect(context, 10 + hurtShift, bodyY, 10, torsoHeight, suit);
  fillRect(context, 11 + hurtShift, bodyY + 1, 8, 2, suitShade);
  fillRect(context, 10 + hurtShift, bodyY + 3, 10, 3, trim);
  fillRect(context, 11 + hurtShift, suitStripeY, 8, 3, trimDark);
  fillRect(context, 12 + hurtShift, bodyY + 8, 6, 2, visorGlow);
  fillRect(context, 11 + hurtShift, bodyY + 10, 8, 2, outline);

  // Backpack on back side (left side of sprite when facing right).
  fillRect(context, 8 + hurtShift, packY, 2, packHeight, trim);
  fillRect(context, 7 + hurtShift, bodyY + 5, 1, 3, trimDark);

  // Front arm (toward movement direction).
  fillRect(context, frontArmX + hurtShift, frontArmY, 2, frontArmHeight, suit);
  fillRect(context, handX + hurtShift, handY, 2, 2, trim);

  // Legs and boots reach the sprite bottom so the astronaut plants on the floor.
  fillRect(context, 11 + hurtShift, leftLegY, 3, 10, suit);
  fillRect(context, 16 + hurtShift, rightLegY, 3, 10, suit);
  fillRect(context, 10 + hurtShift, leftLegY + 5, 5, 2, trim);
  fillRect(context, 15 + hurtShift, rightLegY + 5, 5, 2, trim);
  fillRect(context, 10 + hurtShift, leftBootY, 5, 4, sole);
  fillRect(context, 15 + hurtShift, rightBootY, 5, 4, sole);
  fillRect(context, 10 + hurtShift, leftBootY, 5, 2, trim);
  fillRect(context, 15 + hurtShift, rightBootY, 5, 2, trim);

  if (dashTrailWidth > 0) {
    fillRect(context, 4, 20, dashTrailWidth, 8, visorGlow);
    fillRect(context, 2, 22, Math.max(2, dashTrailWidth - 2), 4, trim);
  }

  if (frameGroup === 'hurt') {
    fillRect(context, 21, 9, 4, 4, '#ef8b69');
  }

  if (frameGroup === 'defeat') {
    fillRect(context, 8, 40, 14, 4, '#d58461');
    fillRect(context, 11, 42, 8, 2, '#fff0c8');
  }
}

function quantizeCanvasTo565(context: CanvasRenderingContext2D, width: number, height: number): void {
  const imageData = context.getImageData(0, 0, width, height);
  const src = imageData.data;
  const len = src.length;

  // Use a float buffer for error diffusion calculations
  const buf = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    buf[i] = src[i];
  }

  const w = width;
  const h = height;

  const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      const oldR = buf[idx];
      const oldG = buf[idx + 1];
      const oldB = buf[idx + 2];

      const newR = Math.round((oldR * 31) / 255) * (255 / 31);
      const newG = Math.round((oldG * 63) / 255) * (255 / 63);
      const newB = Math.round((oldB * 31) / 255) * (255 / 31);

      buf[idx] = newR;
      buf[idx + 1] = newG;
      buf[idx + 2] = newB;

      const errR = oldR - newR;
      const errG = oldG - newG;
      const errB = oldB - newB;

      // Floyd–Steinberg distribution
      // Right: x+1, y       => 7/16
      // Bottom-left: x-1,y+1 => 3/16
      // Bottom: x,y+1        => 5/16
      // Bottom-right: x+1,y+1=> 1/16

      distributeError(buf, w, h, x + 1, y, errR * 7 / 16, errG * 7 / 16, errB * 7 / 16);
      distributeError(buf, w, h, x - 1, y + 1, errR * 3 / 16, errG * 3 / 16, errB * 3 / 16);
      distributeError(buf, w, h, x, y + 1, errR * 5 / 16, errG * 5 / 16, errB * 5 / 16);
      distributeError(buf, w, h, x + 1, y + 1, errR * 1 / 16, errG * 1 / 16, errB * 1 / 16);
    }
  }

  // Write back clamped values into imageData.data
  for (let i = 0; i < len; i++) {
    src[i] = clamp(Math.round(buf[i]));
  }

  context.putImageData(imageData, 0, 0);
}

function distributeError(buf: Float32Array, w: number, h: number, x: number, y: number, errR: number, errG: number, errB: number): void {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const idx = (y * w + x) * 4;
  buf[idx] = buf[idx] + errR;
  buf[idx + 1] = buf[idx + 1] + errG;
  buf[idx + 2] = buf[idx + 2] + errB;
}

function outlinedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
): void {
  context.fillStyle = '#11141b';
  context.fillRect(x - 1, y - 1, width + 2, height + 2);
  context.fillStyle = fill;
  context.fillRect(x, y, width, height);
}

function fillRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
): void {
  context.fillStyle = fill;
  context.fillRect(x, y, width, height);
}
