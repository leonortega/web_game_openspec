import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
      Wrap: (value: number, min: number, max: number) => {
        const range = max - min;
        return range <= 0 ? min : ((((value - min) % range) + range) % range) + min;
      },
    },
  },
}));

import { SceneBridge } from './sceneBridge';

const getMutableState = (bridge: SceneBridge) => bridge.getSession().getState() as any;

describe('SceneBridge pause flow regression coverage', () => {
  it('pauses the active run, clears latched input, and resumes the exact suspended run in place', () => {
    const bridge = new SceneBridge();
    const state = getMutableState(bridge);

    state.player.x = 184;
    state.player.y = 212;
    state.player.vx = 28;
    state.player.vy = -14;
    state.stageMessage = 'Before pause';

    bridge.setLeft(true);
    bridge.setRight(true);
    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.pressDash();
    bridge.pressShoot();

    expect(bridge.pauseRun()).toBe(true);
    expect(bridge.isRunPaused()).toBe(true);
    expect((bridge as any).input).toEqual({
      left: false,
      right: false,
      jumpHeld: false,
      jumpPressed: false,
      dashPressed: false,
      shootPressed: false,
    });

    const snapshotBefore = JSON.stringify({
      player: state.player,
      stageRuntime: state.stageRuntime,
      stageMessage: state.stageMessage,
    });

    bridge.consumeFrame(1000);

    expect(JSON.stringify({
      player: state.player,
      stageRuntime: state.stageRuntime,
      stageMessage: state.stageMessage,
    })).toBe(snapshotBefore);

    const stageRuntimeRef = state.stageRuntime;
    const playerPosition = { x: state.player.x, y: state.player.y };
    expect(bridge.resumeRun()).toBe(true);
    expect(bridge.isRunPaused()).toBe(false);

    for (let frame = 0; frame < 5; frame += 1) {
      bridge.consumeFrame(16);
    }

    expect(state.stageRuntime).toBe(stageRuntimeRef);
    expect(state.player.x).toBe(playerPosition.x);
    expect(state.player.y).toBe(playerPosition.y);
  });

  it('rejects duplicate pause and resume requests so ESC acts as a clean toggle', () => {
    const bridge = new SceneBridge();

    expect(bridge.pauseRun()).toBe(true);
    expect(bridge.pauseRun()).toBe(false);
    expect(bridge.resumeRun()).toBe(true);
    expect(bridge.resumeRun()).toBe(false);
  });

  it('clears pause state before rebuild-based starts and restarts', () => {
    const bridge = new SceneBridge();

    bridge.pauseRun();
    bridge.restartStage();
    expect(bridge.isRunPaused()).toBe(false);

    bridge.pauseRun();
    bridge.startStage(0);
    expect(bridge.isRunPaused()).toBe(false);

    bridge.pauseRun();
    bridge.forceStartStage(1);
    expect(bridge.isRunPaused()).toBe(false);
  });
});