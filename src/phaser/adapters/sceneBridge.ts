import { stageDefinitions } from '../../game/content/stages';
import { defaultInputState, type InputState } from '../../game/input/actions';
import { GameSession } from '../../game/simulation/GameSession';
import type { AudioCue } from '../../audio/audioContract';
import {
  DIFFICULTY_LABELS,
  createDefaultGameplayTelemetry,
  createDefaultStageTelemetry,
  formatActivePowerSummary,
  formatHudCollectibleSummary,
} from '../../game/simulation/state';
import type { GameplayTelemetry, SessionProgress, StageTelemetry } from '../../game/simulation/state';
import type { RunProgressStore } from '../persistence/RunProgressStore';
import type { RexHudBindings } from '../ui/rexHud';
import type { HudViewModel } from '../../ui/hud/hud';

export class SceneBridge {
  private static readonly SAVE_THROTTLE_MS = 250;

  private readonly session = new GameSession();
  private readonly progressStore?: RunProgressStore;
  private readonly input: InputState = defaultInputState();
  private runPaused = false;
  private resumeFrameSkipsRemaining = 0;
  private lastSavedProgressJson = '';
  private saveQueue = Promise.resolve();
  private pendingSaveElapsedMs = 0;
  private telemetrySessionBaseline: GameplayTelemetry;

  constructor(progressStore?: RunProgressStore) {
    this.progressStore = progressStore;
    this.lastSavedProgressJson = this.serializeProgress(this.session.getState().progress);
    this.telemetrySessionBaseline = cloneTelemetry(this.session.getState().progress.telemetry);
  }

  setLeft(active: boolean): void {
    this.input.left = active;
  }

  setRight(active: boolean): void {
    this.input.right = active;
  }

  setJumpHeld(active: boolean): void {
    this.input.jumpHeld = active;
  }

  pressJump(): void {
    this.input.jumpPressed = true;
  }

  pressThruster(): void {
    this.input.thrusterPressed = true;
  }

  pressDash(): void {
    this.input.dashPressed = true;
  }

  pressShoot(): void {
    this.input.shootPressed = true;
  }

  consumeFrame(deltaMs: number): void {
    if (this.runPaused) {
      return;
    }
    if (this.resumeFrameSkipsRemaining > 0) {
      this.resumeFrameSkipsRemaining -= 1;
      return;
    }
    this.session.update(deltaMs, this.input);
    this.input.jumpPressed = false;
    this.input.thrusterPressed = false;
    this.input.dashPressed = false;
    this.input.shootPressed = false;
    this.pendingSaveElapsedMs += deltaMs;
    if (this.pendingSaveElapsedMs >= SceneBridge.SAVE_THROTTLE_MS) {
      this.pendingSaveElapsedMs = 0;
      this.persistProgressIfChanged();
    }
  }

  pauseRun(): boolean {
    if (this.runPaused) {
      return false;
    }

    this.runPaused = true;
    this.clearGameplayInput();
    return true;
  }

  resumeRun(): boolean {
    if (!this.runPaused) {
      return false;
    }

    this.runPaused = false;
    this.resumeFrameSkipsRemaining = 5;
    this.clearGameplayInput();
    return true;
  }

  isRunPaused(): boolean {
    return this.runPaused;
  }

  getSession(): GameSession {
    return this.session;
  }

  async loadPersistedProgress(): Promise<void> {
    const progress = await this.progressStore?.load();
    if (!progress) {
      this.telemetrySessionBaseline = cloneTelemetry(this.session.getState().progress.telemetry);
      return;
    }

    this.session.hydrateProgress(progress);
    this.lastSavedProgressJson = this.serializeProgress(this.session.getState().progress);
    this.pendingSaveElapsedMs = 0;
    this.telemetrySessionBaseline = cloneTelemetry(this.session.getState().progress.telemetry);
  }

  beginTelemetrySession(): void {
    this.telemetrySessionBaseline = cloneTelemetry(this.session.getState().progress.telemetry);
  }

  startStage(index: number): void {
    this.runPaused = false;
    this.resumeFrameSkipsRemaining = 0;
    this.clearGameplayInput();
    this.session.startStage(index);
    this.pendingSaveElapsedMs = 0;
    this.persistProgressIfChanged();
  }

  forceStartStage(index: number): void {
    this.runPaused = false;
    this.resumeFrameSkipsRemaining = 0;
    this.clearGameplayInput();
    this.session.forceStartStage(index);
    this.pendingSaveElapsedMs = 0;
    this.persistProgressIfChanged();
  }

  restartStage(): void {
    this.runPaused = false;
    this.resumeFrameSkipsRemaining = 0;
    this.clearGameplayInput();
    this.session.restartStage();
    this.pendingSaveElapsedMs = 0;
    this.persistProgressIfChanged();
  }

  updateRunSettings(next: Parameters<GameSession['updateRunSettings']>[0]): void {
    this.session.updateRunSettings(next);
    this.pendingSaveElapsedMs = 0;
    this.persistProgressIfChanged();
  }

  setCameraViewBox(viewBox: { x: number; y: number; width: number; height: number } | null): void {
    this.session.setCameraViewBox(viewBox);
  }

  getHudModel(): HudViewModel {
    const state = this.session.getState();
    const currentSegment =
      state.stage.segments.find((segment) => segment.id === state.currentSegmentId) ?? state.stage.segments[0];
    return {
      stageName: state.stage.name,
      stageIndex: state.stageIndex,
      stageCount: stageDefinitions.length,
      coins: formatHudCollectibleSummary(
        state.stageRuntime.collectedCoins,
        state.stageRuntime.totalCoins,
        state.progress.totalCoins,
      ),
      health: state.player.health,
      powerLabel: formatActivePowerSummary(state.progress.activePowers, state.progress.powerTimers),
      difficultyLabel: DIFFICULTY_LABELS[state.progress.runSettings.difficulty],
      segmentLabel: currentSegment?.title ?? 'Stage',
      message: state.stageMessage,
    };
  }

  syncHud(hud: RexHudBindings): void {
    hud.sync(this.getHudModel());
  }

  drainCues(): AudioCue[] {
    return this.session.consumeCues();
  }

  getSessionTelemetrySummary(): SessionTelemetrySummary {
    const currentTelemetry = this.session.getState().progress.telemetry;
    const stages = stageDefinitions
      .map<SessionTelemetryStageSummary | null>((stage) => {
        const currentStage = currentTelemetry.stages[stage.id] ?? createDefaultStageTelemetry();
        const baselineStage = this.telemetrySessionBaseline.stages[stage.id] ?? createDefaultStageTelemetry();
        const deathsBySegment = Object.entries(currentStage.deathsBySegment)
          .map(([segmentId, count]) => ({
            segmentId,
            title: stage.segments.find((segment) => segment.id === segmentId)?.title ?? segmentId,
            count: Math.max(0, count - (baselineStage.deathsBySegment[segmentId] ?? 0)),
          }))
          .filter((entry) => entry.count > 0);
        const checkpointRetries = Object.entries(currentStage.checkpointRetries)
          .map(([checkpointId, count]) => ({
            checkpointId,
            count: Math.max(0, count - (baselineStage.checkpointRetries[checkpointId] ?? 0)),
          }))
          .filter((entry) => entry.count > 0);
        const secretRouteUses = Object.entries(currentStage.secretRouteUses)
          .map(([routeId, count]) => ({
            routeId,
            title: stage.secretRoutes.find((route) => route.id === routeId)?.title ?? routeId,
            count: Math.max(0, count - (baselineStage.secretRouteUses[routeId] ?? 0)),
          }))
          .filter((entry) => entry.count > 0);
        const objectiveCompletions = Math.max(0, currentStage.objective.completions - baselineStage.objective.completions);
        const objectiveTotalCompletionMs = Math.max(
          0,
          currentStage.objective.totalCompletionMs - baselineStage.objective.totalCompletionMs,
        );
        const totalDeaths = deathsBySegment.reduce((total, entry) => total + entry.count, 0);
        const totalCheckpointRetries = checkpointRetries.reduce((total, entry) => total + entry.count, 0);
        const totalSecretRouteUses = secretRouteUses.reduce((total, entry) => total + entry.count, 0);

        if (
          totalDeaths <= 0 &&
          totalCheckpointRetries <= 0 &&
          totalSecretRouteUses <= 0 &&
          objectiveCompletions <= 0
        ) {
          return null;
        }

        return {
          stageId: stage.id,
          stageName: stage.name,
          deathsBySegment,
          checkpointRetries,
          secretRouteUses,
          totalDeaths,
          totalCheckpointRetries,
          totalSecretRouteUses,
          objective:
            objectiveCompletions > 0
              ? {
                  completions: objectiveCompletions,
                  totalCompletionMs: objectiveTotalCompletionMs,
                  averageCompletionMs: Math.round(objectiveTotalCompletionMs / objectiveCompletions),
                  lastCompletionMs: currentStage.objective.lastCompletionMs,
                }
              : null,
        };
      })
      .filter((stage): stage is SessionTelemetryStageSummary => stage !== null);

    return {
      totalDeaths: stages.reduce((total, stage) => total + stage.totalDeaths, 0),
      totalCheckpointRetries: stages.reduce((total, stage) => total + stage.totalCheckpointRetries, 0),
      totalSecretRouteUses: stages.reduce((total, stage) => total + stage.totalSecretRouteUses, 0),
      totalObjectiveCompletions: stages.reduce((total, stage) => total + (stage.objective?.completions ?? 0), 0),
      stages,
    };
  }

  resetGameplayInput(): void {
    this.clearGameplayInput();
  }

  private clearGameplayInput(): void {
    this.input.left = false;
    this.input.right = false;
    this.input.jumpHeld = false;
    this.input.jumpPressed = false;
    this.input.thrusterPressed = false;
    this.input.dashPressed = false;
    this.input.shootPressed = false;
  }

  private persistProgressIfChanged(): void {
    if (!this.progressStore) {
      return;
    }

    const progress = this.session.getState().progress;
    const nextJson = this.serializeProgress(progress);
    if (nextJson === this.lastSavedProgressJson) {
      return;
    }

    this.lastSavedProgressJson = nextJson;
    this.saveQueue = this.saveQueue.then(() => this.progressStore?.save(progress));
  }

  private serializeProgress(progress: SessionProgress): string {
    return JSON.stringify(progress);
  }
}

type SessionTelemetryStageSummary = {
  stageId: string;
  stageName: string;
  deathsBySegment: Array<{ segmentId: string; title: string; count: number }>;
  checkpointRetries: Array<{ checkpointId: string; count: number }>;
  secretRouteUses: Array<{ routeId: string; title: string; count: number }>;
  totalDeaths: number;
  totalCheckpointRetries: number;
  totalSecretRouteUses: number;
  objective: {
    completions: number;
    totalCompletionMs: number;
    averageCompletionMs: number;
    lastCompletionMs: number | null;
  } | null;
};

export type SessionTelemetrySummary = {
  totalDeaths: number;
  totalCheckpointRetries: number;
  totalSecretRouteUses: number;
  totalObjectiveCompletions: number;
  stages: SessionTelemetryStageSummary[];
};

const cloneTelemetry = (telemetry: GameplayTelemetry | undefined): GameplayTelemetry => ({
  ...createDefaultGameplayTelemetry(),
  ...telemetry,
  stages: Object.fromEntries(
    Object.entries(telemetry?.stages ?? {}).map(([stageId, stageTelemetry]) => [
      stageId,
      cloneStageTelemetry(stageTelemetry),
    ]),
  ),
});

const cloneStageTelemetry = (stageTelemetry: StageTelemetry): StageTelemetry => ({
  ...createDefaultStageTelemetry(),
  ...stageTelemetry,
  deathsBySegment: { ...stageTelemetry.deathsBySegment },
  checkpointRetries: { ...stageTelemetry.checkpointRetries },
  secretRouteUses: { ...stageTelemetry.secretRouteUses },
  objective: { ...stageTelemetry.objective },
});
