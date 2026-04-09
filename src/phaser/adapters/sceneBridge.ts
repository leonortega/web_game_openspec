import { stageDefinitions } from '../../game/content/stages';
import { defaultInputState, type InputState } from '../../game/input/actions';
import { GameSession } from '../../game/simulation/GameSession';
import { updateHud, type HudViewModel } from '../../ui/hud/hud';

export class SceneBridge {
  private readonly session = new GameSession();
  private readonly input: InputState = defaultInputState();

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

  consumeFrame(deltaMs: number): void {
    this.session.update(deltaMs, this.input);
    this.input.jumpPressed = false;
    this.input.dashPressed = false;
  }

  getSession(): GameSession {
    return this.session;
  }

  startStage(index: number): void {
    this.session.startStage(index);
  }

  forceStartStage(index: number): void {
    this.session.forceStartStage(index);
  }

  getHudModel(): HudViewModel {
    const state = this.session.getState();
    const currentSegment =
      state.stage.segments.find((segment) => segment.id === state.currentSegmentId) ?? state.stage.segments[0];
    return {
      stageName: state.stage.name,
      stageIndex: state.stageIndex,
      stageCount: stageDefinitions.length,
      targetMinutes: state.stage.targetDurationMinutes,
      segmentTitle: currentSegment?.title ?? 'Stage',
      crystals: state.progress.totalCrystals,
      health: state.player.health,
      powerLabel: state.progress.unlockedPowers.dash ? 'Air Dash' : 'Dormant',
      message: state.stageMessage,
    };
  }

  syncHud(hud: Parameters<typeof updateHud>[0]): void {
    updateHud(hud, this.getHudModel());
  }

  drainCues(): string[] {
    return this.session.consumeCues();
  }
}
