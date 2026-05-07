import { stageDefinitions } from '../../game/content/stages';
import { defaultInputState, type InputState } from '../../game/input/actions';
import { GameSession } from '../../game/simulation/GameSession';
import type { AudioCue } from '../../audio/audioContract';
import { DIFFICULTY_LABELS, formatActivePowerSummary, formatHudCollectibleSummary } from '../../game/simulation/state';
import type { SessionProgress } from '../../game/simulation/state';
import type { RunProgressStore } from '../persistence/RunProgressStore';
import type { RexHudBindings } from '../ui/rexHud';
import type { HudViewModel } from '../../ui/hud/hud';

export class SceneBridge {
  private readonly session = new GameSession();
  private readonly progressStore?: RunProgressStore;
  private readonly input: InputState = defaultInputState();
  private runPaused = false;
  private resumeFrameSkipsRemaining = 0;
  private lastSavedProgressJson = '';
  private saveQueue = Promise.resolve();

  constructor(progressStore?: RunProgressStore) {
    this.progressStore = progressStore;
    this.lastSavedProgressJson = this.serializeProgress(this.session.getState().progress);
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
    this.persistProgressIfChanged();
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
      return;
    }

    this.session.hydrateProgress(progress);
    this.lastSavedProgressJson = this.serializeProgress(this.session.getState().progress);
  }

  startStage(index: number): void {
    this.runPaused = false;
    this.resumeFrameSkipsRemaining = 0;
    this.clearGameplayInput();
    this.session.startStage(index);
    this.persistProgressIfChanged();
  }

  forceStartStage(index: number): void {
    this.runPaused = false;
    this.resumeFrameSkipsRemaining = 0;
    this.clearGameplayInput();
    this.session.forceStartStage(index);
    this.persistProgressIfChanged();
  }

  restartStage(): void {
    this.runPaused = false;
    this.resumeFrameSkipsRemaining = 0;
    this.clearGameplayInput();
    this.session.restartStage();
    this.persistProgressIfChanged();
  }

  updateRunSettings(next: Parameters<GameSession['updateRunSettings']>[0]): void {
    this.session.updateRunSettings(next);
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
