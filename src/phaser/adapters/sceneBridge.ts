import { stageDefinitions } from '../../game/content/stages';
import { defaultInputState, type InputState } from '../../game/input/actions';
import { GameSession } from '../../game/simulation/GameSession';
import { formatActivePowerSummary, formatHudCollectibleSummary, formatRunSettings } from '../../game/simulation/state';
import { updateHud, type HudViewModel } from '../../ui/hud/hud';

export class SceneBridge {
  private readonly session = new GameSession();
  private readonly input: InputState = defaultInputState();
  private runPaused = false;
  private resumeFrameSkipsRemaining = 0;

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
    this.input.dashPressed = false;
    this.input.shootPressed = false;
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

  startStage(index: number): void {
    this.runPaused = false;
    this.resumeFrameSkipsRemaining = 0;
    this.clearGameplayInput();
    this.session.startStage(index);
  }

  forceStartStage(index: number): void {
    this.runPaused = false;
    this.resumeFrameSkipsRemaining = 0;
    this.clearGameplayInput();
    this.session.forceStartStage(index);
  }

  restartStage(): void {
    this.runPaused = false;
    this.resumeFrameSkipsRemaining = 0;
    this.clearGameplayInput();
    this.session.restartStage();
  }

  updateRunSettings(next: Parameters<GameSession['updateRunSettings']>[0]): void {
    this.session.updateRunSettings(next);
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
      runLabel: formatRunSettings(state.progress.runSettings),
      segmentLabel: currentSegment?.title ?? 'Stage',
      message: state.stageMessage,
    };
  }

  syncHud(hud: Parameters<typeof updateHud>[0]): void {
    updateHud(hud, this.getHudModel());
  }

  drainCues(): string[] {
    return this.session.consumeCues();
  }

  private clearGameplayInput(): void {
    this.input.left = false;
    this.input.right = false;
    this.input.jumpHeld = false;
    this.input.jumpPressed = false;
    this.input.dashPressed = false;
    this.input.shootPressed = false;
  }
}
