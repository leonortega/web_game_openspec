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

const BOOT_TEXTURE_VERSION = 2;
const BOOT_TEXTURE_VERSION_KEY = '__bootTextureVersion';

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
  artist.outlinedRect(6, 11, 17, 10, '#d8c2a0');
  artist.fillRect(9, 13, 7, 3, '#11141b');
  artist.fillRect(17, 13, 3, 3, '#f5cf64');
  artist.fillRect(8, 17, 12, 2, '#e97652');
  artist.fillRect(11, 9, 6, 2, '#f7f3d6');
  artist.fillRect(4, 15, 3, 5, '#31451d');
  artist.fillRect(22, 15, 4, 6, '#31451d');
  artist.outlinedRect(8, 21, 4, 7, '#f7f3d6');
  artist.outlinedRect(16, 21, 4, 7, '#f7f3d6');
  artist.fillRect(7, 23, 14, 2, '#11141b');
  artist.fillRect(5, 20, 2, 4, '#11141b');
  artist.fillRect(22, 20, 3, 4, '#11141b');
};

export const drawHopperTextureArt = (artist: PixelTextureArtist): void => {
  artist.outlinedRect(7, 11, 16, 9, '#dfe8bf');
  artist.fillRect(10, 13, 10, 3, '#31451d');
  artist.fillRect(11, 16, 8, 3, '#f5cf64');
  artist.fillRect(12, 8, 6, 3, '#f7f3d6');
  artist.fillRect(6, 17, 3, 2, '#11141b');
  artist.fillRect(21, 17, 3, 2, '#11141b');
  artist.fillRect(8, 20, 14, 2, '#31451d');
  artist.outlinedRect(4, 21, 6, 7, '#f5cf64');
  artist.outlinedRect(20, 21, 6, 7, '#f5cf64');
  artist.fillRect(6, 24, 2, 4, '#11141b');
  artist.fillRect(22, 24, 2, 4, '#11141b');
};

export const drawTurretTextureArt = (artist: PixelTextureArtist): void => {
  artist.outlinedRect(9, 6, 10, 12, '#f7f3d6');
  artist.fillRect(11, 9, 6, 4, '#8fdff2');
  artist.fillRect(10, 14, 8, 2, '#11141b');
  artist.outlinedRect(6, 19, 15, 8, '#d8c2a0');
  artist.fillRect(9, 21, 9, 3, '#31451d');
  artist.outlinedRect(18, 11, 7, 5, '#f0c6a1');
  artist.fillRect(21, 12, 4, 2, '#11141b');
  artist.fillRect(4, 23, 3, 3, '#31451d');
  artist.outlinedRect(5, 27, 18, 8, '#c6d2bf');
  artist.fillRect(8, 29, 12, 2, '#11141b');
  artist.fillRect(7, 32, 14, 2, '#31451d');
  artist.fillRect(8, 35, 4, 3, '#f5cf64');
  artist.fillRect(16, 35, 4, 3, '#f5cf64');
};

export const drawChargerTextureArt = (artist: PixelTextureArtist): void => {
  artist.outlinedRect(7, 12, 18, 11, '#e97652');
  artist.fillRect(10, 14, 8, 3, '#4d2312');
  artist.fillRect(9, 19, 11, 2, '#f5cf64');
  artist.fillRect(22, 13, 4, 6, '#f7f3d6');
  artist.outlinedRect(25, 14, 5, 5, '#f0c6a1');
  artist.fillRect(5, 15, 2, 4, '#f7f3d6');
  artist.fillRect(2, 16, 3, 2, '#11141b');
  artist.fillRect(29, 15, 3, 2, '#11141b');
  artist.outlinedRect(9, 23, 4, 7, '#f5cf64');
  artist.outlinedRect(18, 23, 4, 7, '#f5cf64');
  artist.fillRect(8, 24, 15, 2, '#11141b');
};

export const drawFlyerTextureArt = (artist: PixelTextureArtist): void => {
  artist.outlinedRect(12, 4, 10, 4, '#d6edf2');
  artist.fillRect(14, 5, 6, 2, '#8fdff2');
  artist.fillRect(13, 7, 8, 1, '#173848');
  artist.outlinedRect(7, 9, 20, 4, '#f7f3d6');
  artist.fillRect(5, 11, 24, 3, '#c6d2bf');
  artist.fillRect(3, 12, 6, 2, '#9fdae8');
  artist.fillRect(25, 12, 6, 2, '#9fdae8');
  artist.fillRect(9, 14, 16, 2, '#d6edf2');
  artist.fillRect(10, 16, 14, 2, '#fff7d8');
  artist.fillRect(13, 18, 8, 2, '#f5cf64');
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

  createPixelTexture(scene, 'player', 26, 42, (context) => {
    outlinedRect(context, 7, 2, 12, 11, '#f7f3d6');
    fillRect(context, 9, 4, 8, 5, '#8fdff2');
    fillRect(context, 10, 10, 6, 2, '#31451d');
    fillRect(context, 8, 13, 10, 2, '#f5cf64');
    outlinedRect(context, 5, 15, 16, 14, '#f7f3d6');
    fillRect(context, 7, 17, 12, 4, '#8fdff2');
    fillRect(context, 7, 22, 5, 5, '#f5cf64');
    fillRect(context, 14, 22, 5, 5, '#f5cf64');
    fillRect(context, 10, 23, 6, 4, '#31451d');
    outlinedRect(context, 7, 29, 4, 10, '#f5cf64');
    outlinedRect(context, 15, 29, 4, 10, '#f5cf64');
    fillRect(context, 7, 33, 12, 2, '#31451d');
    fillRect(context, 8, 38, 3, 2, '#11141b');
    fillRect(context, 15, 38, 3, 2, '#11141b');
    fillRect(context, 4, 18, 2, 8, '#31451d');
    fillRect(context, 20, 18, 2, 8, '#31451d');
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

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error(`Unable to create placeholder texture ${key}`);
  }

  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;
  draw(context);

  scene.textures.addCanvas(key, canvas);
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
