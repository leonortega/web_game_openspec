import { describe, expect, it } from 'vitest';

import {
  CAPSULE_PRESENTATION,
  EXIT_CAPSULE_ART_BOUNDS,
  EXIT_CAPSULE_OPEN_DOOR_ART_BOUNDS,
  EXIT_CAPSULE_TEXTURE_KEYS,
  EXIT_FINISH_DOOR_OPEN_WINDOW,
  STAGE_START_SEQUENCE,
  getExitFinishDoorOpenProgress,
  getStageStartCapsuleLayout,
  getExitCapsuleDoorArtBounds,
  getStageStartSequenceState,
  getStageStartSequenceTotalMs,
  resolveStageStartCapsuleAnchor,
} from './capsulePresentation';

describe('capsulePresentation', () => {
  it('keeps stage-start shell and door metrics aligned with grounded exit capsule art', () => {
    expect(CAPSULE_PRESENTATION.shellWidth).toBe(32);
    expect(CAPSULE_PRESENTATION.shellHeight).toBe(44);
    expect(CAPSULE_PRESENTATION.doorClosedWidth).toBe(24);
    expect(CAPSULE_PRESENTATION.doorHeight).toBe(36);
    expect(CAPSULE_PRESENTATION.baseWidth).toBeGreaterThan(CAPSULE_PRESENTATION.shellWidth);
  });

  it('exposes shared exit shell and door textures for exact stage-start art reuse', () => {
    expect(EXIT_CAPSULE_TEXTURE_KEYS.full).toBe('exit');
    expect(EXIT_CAPSULE_TEXTURE_KEYS.shell).toBe('exit-shell');
    expect(EXIT_CAPSULE_TEXTURE_KEYS.door).toBe('exit-door');
    expect(EXIT_CAPSULE_TEXTURE_KEYS.doorOpen).toBe('exit-door-open');
    expect(EXIT_CAPSULE_ART_BOUNDS.shell.height).toBe(CAPSULE_PRESENTATION.shellHeight);
    expect(EXIT_CAPSULE_ART_BOUNDS.shell.width).toBeGreaterThanOrEqual(CAPSULE_PRESENTATION.shellWidth);
    expect(EXIT_CAPSULE_ART_BOUNDS.door.width).toBe(CAPSULE_PRESENTATION.doorClosedWidth);
    expect(EXIT_CAPSULE_ART_BOUNDS.door.height).toBe(CAPSULE_PRESENTATION.doorHeight);
    expect(EXIT_CAPSULE_OPEN_DOOR_ART_BOUNDS.width).toBe(CAPSULE_PRESENTATION.doorOpenWidth);
    expect(EXIT_CAPSULE_OPEN_DOOR_ART_BOUNDS.height).toBe(CAPSULE_PRESENTATION.doorHeight);
    expect(EXIT_CAPSULE_OPEN_DOOR_ART_BOUNDS.x).toBeGreaterThan(EXIT_CAPSULE_ART_BOUNDS.door.x);
    expect(getExitCapsuleDoorArtBounds(CAPSULE_PRESENTATION.doorOpenWidth)).toEqual(EXIT_CAPSULE_OPEN_DOOR_ART_BOUNDS);
  });

  it('opens exit door early in finish window without changing stage-start close timing', () => {
    expect(getExitFinishDoorOpenProgress(0)).toBe(0);
    expect(getExitFinishDoorOpenProgress(EXIT_FINISH_DOOR_OPEN_WINDOW.startProgress)).toBe(0);

    const midBeatProgress =
      EXIT_FINISH_DOOR_OPEN_WINDOW.startProgress +
      (EXIT_FINISH_DOOR_OPEN_WINDOW.endProgress - EXIT_FINISH_DOOR_OPEN_WINDOW.startProgress) / 2;

    expect(getExitFinishDoorOpenProgress(midBeatProgress)).toBeCloseTo(0.5, 5);
    expect(getExitFinishDoorOpenProgress(EXIT_FINISH_DOOR_OPEN_WINDOW.endProgress)).toBe(1);
    expect(getExitFinishDoorOpenProgress(1)).toBe(1);
    expect(getStageStartSequenceState(0).doorClosedProgress).toBe(1);
  });

  it('reports deterministic rematerialize, walkout, closing, and inert phases', () => {
    const totalMs = getStageStartSequenceTotalMs();

    expect(getStageStartSequenceState(totalMs).phase).toBe('rematerialize');
    expect(getStageStartSequenceState(totalMs - STAGE_START_SEQUENCE.rematerializeMs + 1).phase).toBe('rematerialize');
    expect(getStageStartSequenceState(totalMs - STAGE_START_SEQUENCE.rematerializeMs).phase).toBe('walkout');
    expect(getStageStartSequenceState(STAGE_START_SEQUENCE.closeMs + 1).phase).toBe('walkout');
    expect(getStageStartSequenceState(STAGE_START_SEQUENCE.closeMs).phase).toBe('closing');
    expect(getStageStartSequenceState(0).phase).toBe('inert');
    expect(getStageStartSequenceState(0).playerControlLocked).toBe(false);
    expect(getStageStartSequenceState(STAGE_START_SEQUENCE.closeMs).doorClosedProgress).toBe(0);
    expect(getStageStartSequenceState(0).doorClosedProgress).toBe(1);
  });

  it('keeps fresh starts, replays, and auto-advance entries locked until the close beat completes', () => {
    const totalMs = getStageStartSequenceTotalMs();
    const freshStart = getStageStartSequenceState(totalMs);
    const replayStart = getStageStartSequenceState(totalMs - STAGE_START_SEQUENCE.rematerializeMs);
    const autoAdvanceStart = getStageStartSequenceState(STAGE_START_SEQUENCE.closeMs + 1);
    const resolved = getStageStartSequenceState(0);

    expect(freshStart.phase).toBe('rematerialize');
    expect(freshStart.playerControlLocked).toBe(true);
    expect(replayStart.phase).toBe('walkout');
    expect(replayStart.walkoutProgress).toBe(0);
    expect(replayStart.playerControlLocked).toBe(true);
    expect(autoAdvanceStart.phase).toBe('walkout');
    expect(autoAdvanceStart.walkoutProgress).toBeGreaterThan(0);
    expect(autoAdvanceStart.playerControlLocked).toBe(true);
    expect(resolved.phase).toBe('inert');
    expect(resolved.playerControlLocked).toBe(false);
  });

  it('places inert stage-start capsule behind final player control position', () => {
    const layout = getStageStartCapsuleLayout(
      resolveStageStartCapsuleAnchor({ centerX: 105, baseY: 566, facing: 1 }),
      { x: 110, y: 520, width: 24, height: 32 },
    );

    expect(layout.capsuleCenterX).toBeLessThan(layout.playerTargetX + 12);
    expect(layout.playerStartX).toBeLessThan(layout.playerTargetX);
    expect(layout.baseY).toBeGreaterThan(layout.playerY);
  });

  it('uses stage-owned cabin anchor instead of deriving cabin position from player body', () => {
    const player = { x: 220, y: 140, width: 24, height: 32 };
    const anchor = resolveStageStartCapsuleAnchor({ centerX: 96, baseY: 188, facing: 1 });
    const layout = getStageStartCapsuleLayout(anchor, player);

    expect(layout.capsuleCenterX).toBe(96);
    expect(layout.baseY).toBe(188);
    expect(layout.playerStartX).toBe(84);
    expect(layout.playerTargetX).toBe(220);
    expect(layout.playerY).toBe(140);
  });

  it('keeps cabin anchor fixed even when later player target changes', () => {
    const anchor = resolveStageStartCapsuleAnchor({ centerX: 96, baseY: 188, facing: 1 });
    const movedLayout = getStageStartCapsuleLayout(anchor, { x: 460, y: 84, width: 24, height: 32 });

    expect(movedLayout.capsuleCenterX).toBe(96);
    expect(movedLayout.baseY).toBe(188);
    expect(movedLayout.playerTargetX).toBe(460);
    expect(movedLayout.playerY).toBe(84);
  });
});
