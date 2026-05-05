import { describe, expect, it } from 'vitest';

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
    bridge.pressThruster();
    bridge.pressDash();
    bridge.pressShoot();

    expect(bridge.pauseRun()).toBe(true);
    expect(bridge.isRunPaused()).toBe(true);
    expect((bridge as any).input).toEqual({
      left: false,
      right: false,
      jumpHeld: false,
      jumpPressed: false,
      thrusterPressed: false,
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

  it('drops buffered gameplay input without advancing the active run', () => {
    const bridge = new SceneBridge();
    const state = getMutableState(bridge);

    state.player.x = 144;
    state.player.y = 208;

    bridge.setLeft(true);
    bridge.setRight(true);
    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.pressThruster();
    bridge.pressDash();
    bridge.pressShoot();

    bridge.resetGameplayInput();

    expect((bridge as any).input).toEqual({
      left: false,
      right: false,
      jumpHeld: false,
      jumpPressed: false,
      thrusterPressed: false,
      dashPressed: false,
      shootPressed: false,
    });
    expect(state.player.x).toBe(144);
    expect(state.player.y).toBe(208);
    expect(bridge.isRunPaused()).toBe(false);
  });

  it('uses astronaut-themed stage and power presentation in the HUD model', () => {
    const bridge = new SceneBridge();
    const state = getMutableState(bridge);

    state.progress.activePowers.doubleJump = true;
    state.progress.activePowers.invincible = true;
    state.progress.powerTimers.invincibleMs = 5200;
    state.stageMessage = 'Objective: restore the survey beacon';

    const hud = bridge.getHudModel();

    expect(hud.stageName).toBe('Verdant Impact Crater');
    expect(hud.coins).toBe(`0/${state.stageRuntime.totalCoins} in sector (0 research samples total)`);
    expect(hud.powerLabel).toBe('Thruster Burst, Shield Field (6s)');
    expect(hud.segmentLabel).toBe('Landing Shelf');
    expect(hud.message).toBe('Objective: restore the survey beacon');
  });

  it('drives inverse jump takeoff through bridge input inside active gravity rooms and restores normal jump after disable', () => {
    const bridge = new SceneBridge();

    bridge.forceStartStage(2);
    let state = getMutableState(bridge);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];

    const support = state.stageRuntime.platforms.find((platform: any) => platform.id === 'platform-9010-480');
    const capsule = state.stageRuntime.gravityCapsules.find((entry: any) => entry.id === 'sky-anti-grav-capsule');
    const activeJumpVy = 640 + state.stage.world.gravity * -0.38 * 0.016;

    state.player.x = support.x + 20;
    state.player.y = support.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;

    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.consumeFrame(16);
    bridge.setJumpHeld(false);

    state = getMutableState(bridge);
    expect(state.player.vy).toBeGreaterThan(0);
    expect(state.player.vy).toBeCloseTo(activeJumpVy, 4);
    expect(state.player.gravityFieldId).toBe('sky-anti-grav-stream');
    expect(state.player.phaseThroughSupportPlatformId).toBe(support.id);

    capsule.enabled = false;
    capsule.button.activated = true;
    state.player.x = support.x + 20;
    state.player.y = support.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;
    state.player.phaseThroughSupportPlatformId = null;

    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.consumeFrame(16);
    bridge.setJumpHeld(false);

    state = getMutableState(bridge);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.gravityFieldId).toBeNull();
  });

  it('keeps sticky jump strength normal on seeded capsule floor after gravity-room disable', () => {
    const bridge = new SceneBridge();

    bridge.forceStartStage(2);
    let state = getMutableState(bridge);
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];

    const support = state.stageRuntime.platforms.find((platform: any) => platform.id === 'platform-9010-480');
    const capsule = state.stageRuntime.gravityCapsules.find((entry: any) => entry.id === 'sky-anti-grav-capsule');
    support.surfaceMechanic = { kind: 'stickySludge' };

    capsule.enabled = false;
    capsule.button.activated = true;
    state.player.x = support.x + 20;
    state.player.y = support.y - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = true;
    state.player.supportPlatformId = support.id;
    state.player.phaseThroughSupportPlatformId = null;

    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.consumeFrame(16);
    bridge.setJumpHeld(false);

    state = getMutableState(bridge);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.gravityFieldId).toBeNull();
  });
});