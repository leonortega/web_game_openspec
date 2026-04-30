import type * as Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AUDIO_CUES } from '../../audio/audioContract';
import {
  ACTIVE_SUSTAINED_MUSIC_MANIFEST,
  MENU_SUSTAINED_MUSIC,
  getStageSustainedMusic,
} from '../../audio/musicAssets';
import { getAllMappedSfxAssets } from '../../audio/sfxAssets';
import { stageDefinitions } from '../../game/content/stages';
import {
  SynthAudio,
  getAuthoredMusicThemesForTests,
  getSharedSynthAudioDebugStateForTests,
  resetSharedSynthAudioStateForTests,
} from './SynthAudio';

class FakeTimerEvent {
  constructor(private readonly callback?: () => void) {}

  remove = vi.fn();

  trigger(): void {
    this.callback?.();
  }
}

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

class FakeSound {
  isPlaying = false;

  play = vi.fn();

  stop = vi.fn(() => {
    this.isPlaying = false;
  });

  destroy = vi.fn(() => {
    this.isPlaying = false;
  });

  constructor() {
    this.play.mockImplementation(() => {
      this.isPlaying = true;
    });
  }
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

type FakeScene = Phaser.Scene & {
  __loopEvents: FakeTimerEvent[];
  __delayedEvents: FakeTimerEvent[];
  __sounds: FakeSound[];
};

type DebugEvent = ReturnType<typeof getSharedSynthAudioDebugStateForTests>['events'][number];

const createScene = (): FakeScene => {
  const loopEvents: FakeTimerEvent[] = [];
  const delayedEvents: FakeTimerEvent[] = [];
  const sounds: FakeSound[] = [];

  return {
    sound: {
      add: vi.fn(() => {
        const sound = new FakeSound();
        sounds.push(sound);
        return sound;
      }),
    },
    time: {
      addEvent: vi.fn(({ callback }: { callback?: () => void }) => {
        const event = new FakeTimerEvent(callback);
        loopEvents.push(event);
        return event;
      }),
      delayedCall: vi.fn((_: number, callback: () => void) => {
        const event = new FakeTimerEvent(callback);
        delayedEvents.push(event);
        return event;
      }),
    },
    __loopEvents: loopEvents,
    __delayedEvents: delayedEvents,
    __sounds: sounds,
  } as unknown as FakeScene;
};

describe('SynthAudio', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetSharedSynthAudioStateForTests();
  });

  it('uses a browser audio context without reading scene.sound.context', async () => {
    const fakeContext = new FakeAudioContext();
    const AudioContextCtor = vi.fn(() => fakeContext as unknown as AudioContext);
    vi.stubGlobal('AudioContext', AudioContextCtor);

    const scene = {
      sound: {
        add: vi.fn(() => new FakeSound()),
        get context(): never {
          throw new Error('scene.sound.context should not be used');
        },
      },
      time: {
        addEvent: vi.fn(() => ({ remove: vi.fn() })),
      },
    } as unknown as Phaser.Scene;

    const audio = new SynthAudio(scene, () => 0.5, () => 0.5);

    await audio.unlock();
    audio.playCue(AUDIO_CUES.jump);

    expect(AudioContextCtor).toHaveBeenCalledTimes(1);
    expect(fakeContext.resume).toHaveBeenCalledTimes(1);
    expect(fakeContext.createGain).toHaveBeenCalledTimes(0);
    expect(fakeContext.createOscillator).toHaveBeenCalledTimes(0);
    expect(scene.sound.add).toHaveBeenCalledWith('sfx-jump');
  });

  it('maps differentiated cue families through sampled playback', async () => {
    const fakeContext = new FakeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));
    const scene = createScene();
    const audio = new SynthAudio(scene, () => 0.8, () => 0.8);

    await audio.unlock();

    audio.playCue(AUDIO_CUES.menuNavigate);
    audio.playCue(AUDIO_CUES.collect);
    audio.playCue(AUDIO_CUES.danger);
    audio.playCue(AUDIO_CUES.capsuleTeleport);
    audio.playCue(AUDIO_CUES.finalCongrats);

    const debugEvents = getSharedSynthAudioDebugStateForTests().events.filter((event) => event.type === 'cue');

    expect(new Set(debugEvents.map((event) => event.family))).toEqual(
      new Set(['menu-ui', 'reward', 'danger', 'completion']),
    );
    expect(new Set(debugEvents.map((event) => event.signature)).size).toBe(5);
    expect(fakeContext.createOscillator).toHaveBeenCalledTimes(0);
    expect(fakeContext.createGain).toHaveBeenCalledTimes(0);
    expect(scene.__sounds).toHaveLength(5);
    expect(debugEvents.every((event) => event.playback === 'sample')).toBe(true);
    expect(debugEvents.find((event) => event.cue === AUDIO_CUES.capsuleTeleport)?.signature).toBe(
      'sampled capsule portal sweep',
    );
  });

  it('keeps thruster, projectile, hurt, and death cues distinct on the sampled path', () => {
    const fakeContext = new FakeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));
    fakeContext.state = 'running';
    const audio = new SynthAudio(createScene(), () => 1, () => 1);

    audio.playCue(AUDIO_CUES.thrusterImpact);
    audio.playCue(AUDIO_CUES.shootHit);
    audio.playCue(AUDIO_CUES.hurt);
    audio.playCue(AUDIO_CUES.death);

    const cueEvents = getSharedSynthAudioDebugStateForTests().events.filter(
      (event): event is Extract<DebugEvent, { type: 'cue' }> => event.type === 'cue',
    );

    expect(cueEvents.map((event) => event.cue)).toEqual([
      AUDIO_CUES.thrusterImpact,
      AUDIO_CUES.shootHit,
      AUDIO_CUES.hurt,
      AUDIO_CUES.death,
    ]);
    expect(new Set(cueEvents.map((event) => event.signature)).size).toBe(4);
    expect(cueEvents.find((event) => event.cue === AUDIO_CUES.death)?.family).toBe('death');
    expect(cueEvents.find((event) => event.cue === AUDIO_CUES.hurt)?.family).toBe('danger');
    expect(cueEvents.every((event) => event.playback === 'sample')).toBe(true);
  });

  it('keeps mapped cues non-blocking while locked or muted', () => {
    const fakeContext = new FakeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));
    const scene = createScene();
    const audio = new SynthAudio(scene, () => 0, () => 0);

    audio.playCue(AUDIO_CUES.movingPlatform);

    const cueEvents = getSharedSynthAudioDebugStateForTests().events.filter(
      (event): event is Extract<DebugEvent, { type: 'cue' }> => event.type === 'cue',
    );

    expect(cueEvents.map((event) => event.cue)).toEqual([AUDIO_CUES.movingPlatform]);
    expect(cueEvents[0].playback).toBe('sample');
    expect(fakeContext.createOscillator).toHaveBeenCalledTimes(0);
    expect(fakeContext.createGain).toHaveBeenCalledTimes(0);
    expect(scene.__sounds).toHaveLength(0);
  });

  it('keeps checked-in provenance manifests for menu, per-stage music, and sampled cues', () => {
    expect(ACTIVE_SUSTAINED_MUSIC_MANIFEST).toHaveLength(4);
    expect(ACTIVE_SUSTAINED_MUSIC_MANIFEST.every((entry) => entry.license === 'CC-BY-4.0')).toBe(true);
    expect(MENU_SUSTAINED_MUSIC.title).toBe('Call For Love');
    expect(getStageSustainedMusic('forest-ruins')?.title).toBe('Hour For Two');
    expect(getStageSustainedMusic('amber-cavern')?.title).toBe('Give Her Shadow');
    expect(getStageSustainedMusic('sky-sanctum')?.title).toBe('Get Out');
    expect(getAllMappedSfxAssets()).toHaveLength(Object.keys(AUDIO_CUES).length);
    expect(getAllMappedSfxAssets().every((entry) => entry.license === 'CC0')).toBe(true);
    expect(getAllMappedSfxAssets().every((entry) => entry.localAssetPath.startsWith('/audio/sfx/juhani-junkala-512/'))).toBe(true);
    expect(ACTIVE_SUSTAINED_MUSIC_MANIFEST.every((entry) => entry.localAssetPath.startsWith('/audio/music/chillmindscapes-pack-4/'))).toBe(true);
    expect([...ACTIVE_SUSTAINED_MUSIC_MANIFEST, ...getAllMappedSfxAssets()].every((entry) => !entry.localAssetPath.includes('source-packs'))).toBe(true);
  });

  it('limits authored synth themes to transition stingers instead of sustained loop ownership', () => {
    const themes = getAuthoredMusicThemesForTests();

    expect(themes).toHaveLength(3);
    expect(themes.every((theme) => theme.surfaces['menu-loop'] === undefined)).toBe(true);
    expect(themes.every((theme) => theme.surfaces['gameplay-loop'] === undefined)).toBe(true);
    expect(themes.every((theme) => theme.surfaces['stage-intro'] && theme.surfaces['stage-clear'] && theme.surfaces['final-congrats'])).toBe(true);
  });

  it('generates background music for menu, gameplay, intro, and completion paths', async () => {
    const fakeContext = new FakeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));

    const menuScene = createScene();
    const gameplayScene = createScene();
    const introScene = createScene();
    const completeScene = createScene();
    const menuAudio = new SynthAudio(menuScene, () => 1, () => 1);
    const gameplayAudio = new SynthAudio(gameplayScene, () => 1, () => 1);
    const introAudio = new SynthAudio(introScene, () => 1, () => 1);
    const completeAudio = new SynthAudio(completeScene, () => 1, () => 1);

    menuAudio.startMenuMusic();
    gameplayAudio.startStageMusic(stageDefinitions[0]);
    introAudio.playStageIntro(stageDefinitions[1]);
    completeAudio.playStageClear(stageDefinitions[2], true);

    await Promise.all([menuAudio.unlock(), gameplayAudio.unlock(), introAudio.unlock(), completeAudio.unlock()]);

    expect(menuScene.__sounds).toHaveLength(1);
    expect(gameplayScene.__sounds).toHaveLength(1);
    expect(introScene.__delayedEvents.length).toBeGreaterThan(0);
    expect(completeScene.__delayedEvents.length).toBeGreaterThan(0);

    const musicEvents = getSharedSynthAudioDebugStateForTests().events.filter((event) => event.type === 'music');
    expect(musicEvents.length).toBeGreaterThanOrEqual(4);
  });

  it('keeps authored transition themes in catalog and schedules them when requested', async () => {
    const fakeContext = new FakeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));

    const introScene = createScene();
    const finalScene = createScene();
    const introAudio = new SynthAudio(introScene, () => 1, () => 1);
    const finalAudio = new SynthAudio(finalScene, () => 1, () => 1);

    introAudio.playStageIntro(stageDefinitions[2]);
    finalAudio.playStageClear(stageDefinitions[2], true);

    await introAudio.unlock();
    await finalAudio.unlock();

    const themes = getAuthoredMusicThemesForTests();
    const haloTheme = themes.find((theme) => theme.themeId === 'halo-ascension');

    expect(haloTheme?.surfaces['stage-intro']?.sections).toHaveLength(1);
    expect(haloTheme?.surfaces['final-congrats']?.sections).toHaveLength(1);
    expect(introScene.__delayedEvents.length).toBeGreaterThan(0);
    expect(finalScene.__delayedEvents.length).toBeGreaterThan(0);
  });
});
