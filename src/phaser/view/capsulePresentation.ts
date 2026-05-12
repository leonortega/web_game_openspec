export const CAPSULE_PRESENTATION = {
  baseHeight: 12,
  baseWidth: 72,
  baseShadowHeight: 10,
  baseShadowWidth: 76,
  baseYOffset: 4,
  baseShadowYOffset: 10,
  beaconWidth: 14,
  beaconHeight: 8,
  beaconYOffset: 5,
  shellWidth: 32,
  shellHeight: 44,
  shellYOffset: -8,
  shellStrokeAlpha: 0.5,
  doorHeight: 36,
  doorOpenWidth: 10,
  doorClosedWidth: 24,
  walkoutDistance: 18,
  walkoutLift: 2,
} as const;

export const EXIT_FINISH_DOOR_OPEN_WINDOW = {
  startProgress: 0.08,
  endProgress: 0.28,
} as const;

const EXIT_CAPSULE_DOOR_CENTER_X = 24;
const EXIT_CAPSULE_DOOR_Y = 30;

const getExitCapsuleDoorArtBounds = (doorWidth: number) => ({
  x: EXIT_CAPSULE_DOOR_CENTER_X - doorWidth / 2,
  y: EXIT_CAPSULE_DOOR_Y,
  width: doorWidth,
  height: CAPSULE_PRESENTATION.doorHeight,
});

export const EXIT_CAPSULE_ART_BOUNDS = {
  shell: {
    x: 6,
    y: 26,
    width: 36,
    height: CAPSULE_PRESENTATION.shellHeight,
  },
  door: getExitCapsuleDoorArtBounds(CAPSULE_PRESENTATION.doorClosedWidth),
} as const;

export const getExitFinishDoorOpenProgress = (exitFinishProgress: number): number => {
  const clampedProgress = Math.max(0, Math.min(1, exitFinishProgress));

  if (clampedProgress <= EXIT_FINISH_DOOR_OPEN_WINDOW.startProgress) {
    return 0;
  }

  if (clampedProgress >= EXIT_FINISH_DOOR_OPEN_WINDOW.endProgress) {
    return 1;
  }

  return (
    (clampedProgress - EXIT_FINISH_DOOR_OPEN_WINDOW.startProgress) /
    (EXIT_FINISH_DOOR_OPEN_WINDOW.endProgress - EXIT_FINISH_DOOR_OPEN_WINDOW.startProgress)
  );
};

export const STAGE_START_SEQUENCE = {
  rematerializeMs: 320,
  walkOutMs: 320,
  closeMs: 220,
} as const;

export type StageStartCapsulePhase = 'rematerialize' | 'walkout' | 'closing' | 'inert';

export type StageStartCapsuleSequenceState = {
  totalMs: number;
  elapsedMs: number;
  overallProgress: number;
  phase: StageStartCapsulePhase;
  phaseProgress: number;
  revealProgress: number;
  walkoutProgress: number;
  doorClosedProgress: number;
  playerControlLocked: boolean;
};

export type StageStartCapsuleLayout = {
  capsuleCenterX: number;
  capsuleCenterY: number;
  baseY: number;
  baseShadowY: number;
  playerStartX: number;
  playerTargetX: number;
  playerY: number;
};

export type StageStartCapsuleAnchor = {
  centerX: number;
  baseY: number;
  facing: 1 | -1;
};

const STAGE_START_CABIN_CENTER_OFFSET_Y = 33;
const STAGE_START_CABIN_SHADOW_OFFSET_Y = 6;

export const getStageStartSequenceTotalMs = (): number =>
  STAGE_START_SEQUENCE.rematerializeMs + STAGE_START_SEQUENCE.walkOutMs + STAGE_START_SEQUENCE.closeMs;

export const getStageStartSequenceState = (remainingMs: number): StageStartCapsuleSequenceState => {
  const totalMs = getStageStartSequenceTotalMs();
  const clampedRemainingMs = Math.max(0, remainingMs);
  const elapsedMs = Math.min(totalMs, Math.max(0, totalMs - clampedRemainingMs));
  const rematerializeEndMs = STAGE_START_SEQUENCE.rematerializeMs;
  const walkOutEndMs = rematerializeEndMs + STAGE_START_SEQUENCE.walkOutMs;
  const overallProgress = totalMs <= 0 ? 1 : Math.min(1, elapsedMs / totalMs);

  if (elapsedMs >= totalMs) {
    return {
      totalMs,
      elapsedMs,
      overallProgress: 1,
      phase: 'inert',
      phaseProgress: 1,
      revealProgress: 1,
      walkoutProgress: 1,
      doorClosedProgress: 1,
      playerControlLocked: false,
    };
  }

  if (elapsedMs < rematerializeEndMs) {
    const phaseProgress = rematerializeEndMs <= 0 ? 1 : elapsedMs / rematerializeEndMs;
    return {
      totalMs,
      elapsedMs,
      overallProgress,
      phase: 'rematerialize',
      phaseProgress,
      revealProgress: phaseProgress,
      walkoutProgress: 0,
      doorClosedProgress: 0,
      playerControlLocked: true,
    };
  }

  if (elapsedMs < walkOutEndMs) {
    const phaseElapsedMs = elapsedMs - rematerializeEndMs;
    const phaseProgress = STAGE_START_SEQUENCE.walkOutMs <= 0 ? 1 : phaseElapsedMs / STAGE_START_SEQUENCE.walkOutMs;
    return {
      totalMs,
      elapsedMs,
      overallProgress,
      phase: 'walkout',
      phaseProgress,
      revealProgress: 1,
      walkoutProgress: phaseProgress,
      doorClosedProgress: 0,
      playerControlLocked: true,
    };
  }

  const phaseElapsedMs = elapsedMs - walkOutEndMs;
  const phaseProgress = STAGE_START_SEQUENCE.closeMs <= 0 ? 1 : phaseElapsedMs / STAGE_START_SEQUENCE.closeMs;
  return {
    totalMs,
    elapsedMs,
    overallProgress,
    phase: 'closing',
    phaseProgress,
    revealProgress: 1,
    walkoutProgress: 1,
    doorClosedProgress: phaseProgress,
    playerControlLocked: true,
  };
};

export const resolveStageStartCapsuleAnchor = (
  anchor: StageStartCapsuleAnchor,
): StageStartCapsuleAnchor => {
  return {
    ...anchor,
  };
};

export const getStageStartCapsuleLayout = (
  anchor: StageStartCapsuleAnchor,
  player: { x: number; y: number; width: number; height: number },
): StageStartCapsuleLayout => ({
  capsuleCenterX: anchor.centerX,
  capsuleCenterY: anchor.baseY - STAGE_START_CABIN_CENTER_OFFSET_Y,
  baseY: anchor.baseY,
  baseShadowY: anchor.baseY + STAGE_START_CABIN_SHADOW_OFFSET_Y,
  playerStartX: anchor.centerX - player.width / 2,
  playerTargetX: player.x,
  playerY: player.y,
});
