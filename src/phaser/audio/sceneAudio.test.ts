import { describe, expect, it, vi } from 'vitest';
import { AUDIO_CUES } from '../../audio/audioContract';
import { playMenuInteractionCue, runUnlockedAudioAction } from './sceneAudio';

describe('sceneAudio helpers', () => {
  it('runs deferred scene audio only after unlock resolves', async () => {
    const action = vi.fn();
    const audio = {
      unlock: vi.fn(async () => true),
    };

    const result = await runUnlockedAudioAction(audio, action);

    expect(result).toBe(true);
    expect(audio.unlock).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('plays menu interaction cues after unlock without blocking the caller', async () => {
    const audio = {
      unlock: vi.fn(async () => true),
      startMenuMusic: vi.fn(),
      playCue: vi.fn(),
    };

    const pending = playMenuInteractionCue(audio, AUDIO_CUES.menuConfirm);

    expect(audio.unlock).toHaveBeenCalledTimes(1);
    expect(audio.playCue).not.toHaveBeenCalled();

    await pending;

    expect(audio.startMenuMusic).toHaveBeenCalledTimes(1);
    expect(audio.playCue).toHaveBeenCalledWith(AUDIO_CUES.menuConfirm);
  });
});