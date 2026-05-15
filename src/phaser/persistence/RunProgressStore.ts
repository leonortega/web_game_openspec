import type Phaser from 'phaser';
import {
  createDefaultGameplayTelemetry,
  createDefaultObjectiveTelemetry,
  createDefaultRunSettings,
  createDefaultStageTelemetry,
  type SessionProgress,
} from '../../game/simulation/state';

const STORAGE_NAMESPACE = 'crystal-run-progress';
const FILE_ID = 'session-progress';
const STORAGE_VERSION = 1;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isBooleanRecord = (value: unknown): value is Record<string, boolean> =>
  isObject(value) && Object.values(value).every((entry) => typeof entry === 'boolean');

const isString = (value: unknown): value is string => typeof value === 'string';

const isNumberRecord = (value: unknown): value is Record<string, number> =>
  isObject(value) && Object.values(value).every((entry) => isNumber(entry));

const normalizeTelemetry = (value: unknown): SessionProgress['telemetry'] => {
  const fallback = createDefaultGameplayTelemetry();
  if (!isObject(value) || !isObject(value.stages)) {
    return fallback;
  }

  const stages = Object.fromEntries(
    Object.entries(value.stages).flatMap(([stageId, stageValue]) => {
      if (!isObject(stageValue)) {
        return [];
      }

      const objective = isObject(stageValue.objective) ? stageValue.objective : {};
      const normalizedStage = {
        ...createDefaultStageTelemetry(),
        deathsBySegment: isNumberRecord(stageValue.deathsBySegment) ? stageValue.deathsBySegment : {},
        checkpointRetries: isNumberRecord(stageValue.checkpointRetries) ? stageValue.checkpointRetries : {},
        secretRouteUses: isNumberRecord(stageValue.secretRouteUses) ? stageValue.secretRouteUses : {},
        objective: {
          ...createDefaultObjectiveTelemetry(),
          completions: isNumber(objective.completions) ? objective.completions : 0,
          totalCompletionMs: isNumber(objective.totalCompletionMs) ? objective.totalCompletionMs : 0,
          bestCompletionMs: isNumber(objective.bestCompletionMs) ? objective.bestCompletionMs : null,
          lastCompletionMs: isNumber(objective.lastCompletionMs) ? objective.lastCompletionMs : null,
        },
      };

      return [[stageId, normalizedStage]];
    }),
  );

  return {
    stages,
  };
};

export class RunProgressStore {
  private readonly files: {
    load(fileId: string): Promise<{ content: unknown }>;
    save(fileId: string, header?: Record<string, unknown>, content?: Record<string, unknown>): Promise<unknown>;
  };

  constructor(game: Phaser.Game) {
    const plugin = game.plugins.get('rexFiles') as unknown as
      | {
          add(config?: Record<string, unknown>): {
            load(fileId: string): Promise<{ content: unknown }>;
            save(fileId: string, header?: Record<string, unknown>, content?: Record<string, unknown>): Promise<unknown>;
          };
        }
      | undefined;
    if (!plugin) {
      throw new Error('Missing rexFiles global plugin');
    }

    this.files = plugin.add({ name: STORAGE_NAMESPACE, zip: true });
  }

  async load(): Promise<SessionProgress | null> {
    try {
      const result = await this.files.load(FILE_ID);
      return this.normalizeStoredProgress(result.content);
    } catch {
      return null;
    }
  }

  async save(progress: SessionProgress): Promise<void> {
    await this.files.save(
      FILE_ID,
      {
        version: STORAGE_VERSION,
        savedAt: new Date().toISOString(),
      },
      {
        version: STORAGE_VERSION,
        progress,
      },
    );
  }

  private normalizeStoredProgress(value: unknown): SessionProgress | null {
    if (!isObject(value)) {
      return null;
    }

    const version = value.version;
    const progress = value.progress;
    if (version !== STORAGE_VERSION || !isObject(progress)) {
      return null;
    }

    const activePowers = progress.activePowers;
    const powerTimers = progress.powerTimers;
    const runSettings = progress.runSettings;

    if (
      !isNumber(progress.unlockedStageIndex) ||
      !isNumber(progress.totalCoins) ||
      !isBooleanRecord(activePowers) ||
      !isObject(powerTimers) ||
      !isNumber(powerTimers.invincibleMs) ||
      !isObject(runSettings) ||
      !isNumber(runSettings.masterVolume) ||
      !isNumber(runSettings.musicVolume) ||
      !isNumber(runSettings.sfxVolume) ||
      !isString(runSettings.difficulty) ||
      !isString(runSettings.enemyPressure)
    ) {
      return null;
    }

    const defaultRunSettings = createDefaultRunSettings();

    return {
      ...(progress as SessionProgress),
      runSettings: {
        ...defaultRunSettings,
        ...(progress.runSettings as SessionProgress['runSettings']),
        crtEnabled: typeof runSettings.crtEnabled === 'boolean' ? runSettings.crtEnabled : defaultRunSettings.crtEnabled,
      },
      telemetry: normalizeTelemetry(progress.telemetry),
    };
  }
}
