import { describe, expect, it, vi } from 'vitest';

const { drawRetroBackdrop, stopMusic, playStageClear } = vi.hoisted(() => ({
  drawRetroBackdrop: vi.fn(),
  stopMusic: vi.fn(),
  playStageClear: vi.fn(),
}));

vi.mock('phaser', () => ({
  Scene: class MockScene {
    constructor(_key?: string) {}
  },
  Scenes: {
    Events: {
      SHUTDOWN: 'shutdown',
    },
  },
}));

import { CompleteScene } from './CompleteScene';

vi.mock('../view/retroPresentation', () => ({
  RETRO_FONT_FAMILY: 'Courier New',
  createRetroPresentationPalette: () => ({
    panel: 0x111111,
    border: 0xf5f5f5,
    stageAccent: 0x88cc55,
    ink: 0x101010,
    panelAlt: 0x1f2a11,
    skyline: 0x222222,
    shadow: '#111111',
    text: '#f0f0e0',
    dimText: '#c0c0b0',
  }),
  drawRetroBackdrop,
}));

vi.mock('../audio/SynthAudio', () => ({
  SynthAudio: vi.fn().mockImplementation(() => ({
    playStageClear,
    stopMusic,
  })),
}));

vi.mock('../audio/sceneAudio', () => ({
  runUnlockedAudioAction: vi.fn(async (_audio: unknown, callback: () => void) => {
    callback();
  }),
}));

type FakeRectangle = {
  type: 'Rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  setStrokeStyle: ReturnType<typeof vi.fn>;
  setDepth: ReturnType<typeof vi.fn>;
};

type FakeText = {
  type: 'Text';
  x: number;
  y: number;
  text: string;
  style: Record<string, unknown>;
  setOrigin: ReturnType<typeof vi.fn>;
};

const createSceneFixture = (finalStage = false) => {
  const rectangles: FakeRectangle[] = [];
  const texts: FakeText[] = [];
  const delayedEvents: Array<{ delay: number; callback: () => void; remove: ReturnType<typeof vi.fn> }> = [];
  const keyboardHandlers: Record<string, Array<() => void>> = {};
  const pointerHandlers: Record<string, Array<() => void>> = {};
  const sceneTransitions: string[] = [];
  const restartStage = vi.fn();
  const advanceToNextStage = vi.fn();

  const stageState = {
    stageIndex: finalStage ? 2 : 0,
    stage: {
      name: finalStage ? 'Halo Spire Array' : 'Verdant Impact Crater',
      palette: {},
      presentation: {
        sectorLabel: finalStage ? 'Sector 3' : 'Sector 1',
        completionTitle: 'Sector Complete',
        biomeLabel: finalStage ? 'Ion halo spires' : 'Resin forest',
      },
    },
    progress: {
      activePowers: {
        doubleJump: true,
        shooter: false,
        invincible: false,
        dash: false,
      },
      powerTimers: {
        invincibleMs: 0,
      },
      runSettings: {
        masterVolume: 0.7,
        musicVolume: 0.7,
        sfxVolume: 0.8,
        difficulty: 'standard',
        enemyPressure: 'normal',
      },
      totalCoins: 75,
    },
    stageRuntime: {
      checkpoints: [{ activated: true }, { activated: false }, { activated: false }],
      collectedCoins: 28,
      totalCoins: 38,
    },
  };

  const bridge = {
    getSession: () => ({
      getState: () => stageState,
      restartStage,
      advanceToNextStage,
    }),
  };

  const rectangleFactory = (x: number, y: number, width: number, height: number): FakeRectangle => {
    const rectangle: FakeRectangle = {
      type: 'Rectangle',
      x,
      y,
      width,
      height,
      visible: true,
      setStrokeStyle: vi.fn(() => rectangle),
      setDepth: vi.fn(() => rectangle),
    };
    rectangles.push(rectangle);
    return rectangle;
  };

  const textFactory = (x: number, y: number, value: string, style: Record<string, unknown>): FakeText => {
    const textNode: FakeText = {
      type: 'Text',
      x,
      y,
      text: value,
      style,
      setOrigin: vi.fn(() => textNode),
    };
    texts.push(textNode);
    return textNode;
  };

  const scene = new CompleteScene() as CompleteScene & Record<string, unknown>;
  Object.assign(scene, {
    scale: { width: 1280, height: 720 },
    registry: { get: vi.fn(() => bridge) },
    add: {
      rectangle: vi.fn((x: number, y: number, width: number, height: number) => rectangleFactory(x, y, width, height)),
      text: vi.fn((x: number, y: number, value: string, style: Record<string, unknown>) => textFactory(x, y, value, style)),
    },
    input: {
      once: vi.fn((event: string, handler: () => void) => {
        pointerHandlers[event] ??= [];
        pointerHandlers[event].push(handler);
      }),
      keyboard: {
        once: vi.fn((event: string, handler: () => void) => {
          keyboardHandlers[event] ??= [];
          keyboardHandlers[event].push(handler);
        }),
      },
    },
    time: {
      delayedCall: vi.fn((delay: number, callback: () => void) => {
        const event = { delay, callback, remove: vi.fn() };
        delayedEvents.push(event);
        return event;
      }),
    },
    events: {
      once: vi.fn(),
    },
    scene: {
      start: vi.fn((key: string) => {
        sceneTransitions.push(key);
      }),
    },
  });

  return {
    scene,
    rectangles,
    texts,
    delayedEvents,
    sceneTransitions,
    restartStage,
    advanceToNextStage,
    keyboardHandlers,
    pointerHandlers,
  };
};

describe('CompleteScene', () => {
  it('renders the centered completion layout without the removed right-side widget', () => {
    const fixture = createSceneFixture();

    fixture.scene.create();

    expect(drawRetroBackdrop).toHaveBeenCalledTimes(1);
    expect(fixture.rectangles).toHaveLength(4);
    expect(fixture.rectangles.some((node) => node.x === 1280 - 176)).toBe(false);
    expect(fixture.texts.some((node) => node.text.includes('Run research samples: 75'))).toBe(true);
    expect(fixture.texts.some((node) => node.text.includes('Sector research samples: 28/38'))).toBe(true);
    expect(fixture.texts.some((node) => node.text.includes('Sector Complete'))).toBe(true);
    expect(fixture.scene.getDebugSnapshot()).toEqual({
      accentBurstCount: 0,
      accentTweenActive: false,
      accentVisible: false,
      accentMode: 'none',
      sideWidgetVisible: false,
    });
    expect(playStageClear).toHaveBeenCalledTimes(1);
    expect(fixture.delayedEvents).toHaveLength(1);
    expect(fixture.delayedEvents[0].delay).toBe(2800);
  });

  it('keeps final-stage completion screen stationary without auto-advance and without a side widget', () => {
    const fixture = createSceneFixture(true);

    fixture.scene.create();

    expect(fixture.rectangles).toHaveLength(4);
    expect(fixture.rectangles.some((node) => node.x === 1280 - 176)).toBe(false);
    expect(fixture.delayedEvents).toHaveLength(0);
    expect(fixture.scene.getDebugSnapshot().sideWidgetVisible).toBe(false);
    expect(fixture.sceneTransitions).toEqual([]);
  });
});