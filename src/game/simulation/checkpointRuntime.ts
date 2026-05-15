import type { StageDefinition } from '../content/stages';
import { resolveCheckpointRect, resolveCheckpointRespawnPoint } from '../content/stages/builders';
import type { CheckpointState, StageRuntime } from './state';

export type CheckpointRestoreState = {
  collectedCollectibleIds: Set<string>;
  coinRewardBlocks: Map<string, { used: boolean; remainingHits: number }>;
  collectedCoins: number;
  allCoinsRecovered: boolean;
  objectiveCompleted: boolean;
};

export const captureCheckpointRestoreState = (
  stageRuntime: Pick<
    StageRuntime,
    'collectibles' | 'rewardBlocks' | 'collectedCoins' | 'allCoinsRecovered' | 'objective'
  >,
): CheckpointRestoreState => ({
  collectedCollectibleIds: new Set(
    stageRuntime.collectibles.filter((collectible) => collectible.collected).map((collectible) => collectible.id),
  ),
  coinRewardBlocks: new Map(
    stageRuntime.rewardBlocks
      .filter((rewardBlock) => rewardBlock.reward.kind === 'coins')
      .map((rewardBlock) => [
        rewardBlock.id,
        {
          used: rewardBlock.used,
          remainingHits: rewardBlock.remainingHits,
        },
      ]),
  ),
  collectedCoins: stageRuntime.collectedCoins,
  allCoinsRecovered: stageRuntime.allCoinsRecovered,
  objectiveCompleted: stageRuntime.objective?.completed ?? false,
});

export const resolvePlayerSpawnFromCheckpoint = (
  stage: StageDefinition,
  activeCheckpointId: string | null,
  playerWidth: number,
  playerHeight: number,
): { x: number; y: number } => {
  const respawnCheckpoint = activeCheckpointId
    ? stage.checkpoints.find((checkpoint) => checkpoint.id === activeCheckpointId) ?? null
    : null;
  const respawnAnchor = respawnCheckpoint
    ? resolveCheckpointRespawnPoint(stage, respawnCheckpoint.rect, playerWidth, playerHeight)
    : null;

  return {
    x: respawnAnchor?.x ?? stage.playerSpawn.x,
    y: respawnAnchor?.y ?? stage.playerSpawn.y,
  };
};

export const createRuntimeCheckpoints = (
  stage: StageDefinition,
  activeCheckpointId: string | null,
  playerWidth: number,
  playerHeight: number,
): CheckpointState[] =>
  stage.checkpoints.map<CheckpointState>((checkpoint) => {
    const checkpointRect = resolveCheckpointRect(stage, checkpoint.rect);
    const checkpointRespawn = resolveCheckpointRespawnPoint(stage, checkpoint.rect, playerWidth, playerHeight);
    if (!checkpointRespawn || !checkpointRect) {
      throw new Error(`Checkpoint is missing grounded visible support at runtime: ${checkpoint.id}`);
    }

    return {
      ...checkpoint,
      rect: checkpointRect,
      activated: checkpoint.id === activeCheckpointId,
      supportPlatformId: checkpointRespawn.supportPlatformId,
      respawn: {
        x: checkpointRespawn.x,
        y: checkpointRespawn.y,
      },
    };
  });
