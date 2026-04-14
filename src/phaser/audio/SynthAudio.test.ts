import type * as Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynthAudio } from './SynthAudio';

class FakeGainNode {
  public readonly gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };

  connect = vi.fn();
}

class FakeOscillatorNode {
  public readonly frequency = {
    setValueAtTime: vi.fn(),
  };

  public type: OscillatorType = 'sine';

  connect = vi.fn();

  start = vi.fn();

  stop = vi.fn();
}

class FakeAudioContext {
  public state: AudioContextState = 'suspended';

  public currentTime = 2;

  public destination = {} as AudioDestinationNode;

  public readonly resume = vi.fn(async () => {
    this.state = 'running';
  });

  public readonly createGain = vi.fn(() => new FakeGainNode());

  public readonly createOscillator = vi.fn(() => new FakeOscillatorNode());
}

describe('SynthAudio', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses a browser audio context without reading scene.sound.context', async () => {
    const fakeContext = new FakeAudioContext();
    const AudioContextCtor = vi.fn(() => fakeContext as unknown as AudioContext);
    vi.stubGlobal('AudioContext', AudioContextCtor);

    const scene = {
      sound: {
        get context(): never {
          throw new Error('scene.sound.context should not be used');
        },
      },
      time: {
        addEvent: vi.fn(() => ({ remove: vi.fn() })),
      },
    } as unknown as Phaser.Scene;

    const audio = new SynthAudio(scene, () => 0.5);

    audio.unlock();
    await Promise.resolve();
    audio.playCue('jump');

    expect(AudioContextCtor).toHaveBeenCalledTimes(1);
    expect(fakeContext.resume).toHaveBeenCalledTimes(1);
    expect(fakeContext.createGain).toHaveBeenCalledTimes(1);
    expect(fakeContext.createOscillator).toHaveBeenCalledTimes(1);
  });
});