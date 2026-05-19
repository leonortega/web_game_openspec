import { describe, expect, it } from 'vitest';

import { stageDefinitions } from '../content/stages';
import { GameSession } from './GameSession';
import { defaultInputState } from '../input/actions';

const getMutableState = (session: GameSession) => session.getState() as any;

describe('gameplay telemetry', () => {
  it('records deaths by segment and checkpoint retries on respawn', () => {
    const session = new GameSession();
    const state = getMutableState(session);
    const checkpoint = state.stageRuntime.checkpoints[0];

    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    session.update(16, defaultInputState());

    state.currentSegmentId = 'approach';

    (session as any).killPlayer();

    expect(state.progress.telemetry.stages['forest-ruins'].deathsBySegment.approach).toBe(1);

    (session as any).respawnPlayer();

    const respawned = getMutableState(session);
    expect(respawned.progress.telemetry.stages['forest-ruins'].checkpointRetries[checkpoint.id]).toBe(1);
  });

  it('records secret route usage once per attempt and objective completion timing per stage', () => {
    const skyStageIndex = stageDefinitions.findIndex((stage) => stage.id === 'sky-sanctum');
    const session = new GameSession();
    session.forceStartStage(skyStageIndex);
    const state = getMutableState(session);
    const secretRoute = state.stage.secretRoutes[0];

    state.player.x = secretRoute.entry.x;
    state.player.y = secretRoute.entry.y;

    (session as any).trackSecretRouteUsage();
    (session as any).trackSecretRouteUsage();

    expect(state.progress.telemetry.stages['sky-sanctum'].secretRouteUses[secretRoute.id]).toBe(1);

    state.stageElapsedMs = 4321;
    const completed = (session as any).completeStageObjective('scannerVolume', 'sky-halo-scanner');

    expect(completed).toBe(true);
    expect(state.progress.telemetry.stages['sky-sanctum'].objective).toEqual({
      completions: 1,
      totalCompletionMs: 4321,
      bestCompletionMs: 4321,
      lastCompletionMs: 4321,
    });
  });
});
