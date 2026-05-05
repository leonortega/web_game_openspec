import { type AudioCue } from '../../audio/audioContract';

type UnlockableAudio = {
  unlock(): Promise<boolean>;
  playCue(cue: AudioCue): void;
  startMenuMusic?(): void;
};

export const runUnlockedAudioAction = async (
  audio: Pick<UnlockableAudio, 'unlock'>,
  action: () => void,
): Promise<boolean> => {
  try {
    const available = await audio.unlock();
    if (available) {
      action();
    }
    return available;
  } catch {
    return false;
  }
};

export const playMenuInteractionCue = async (
  audio: UnlockableAudio,
  cue: AudioCue,
): Promise<boolean> =>
  runUnlockedAudioAction(audio, () => {
    audio.startMenuMusic?.();
    audio.playCue(cue);
  });