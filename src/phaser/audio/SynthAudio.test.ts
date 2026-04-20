import type * as Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AUDIO_CUES } from '../../audio/audioContract';
import {
  ACTIVE_SUSTAINED_MUSIC_MANIFEST,
  MENU_SUSTAINED_MUSIC,
  getStageSustainedMusic,
} from '../../audio/musicAssets';
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

type MusicDebugEvent = Extract<DebugEvent, { type: 'music' }>;

type SectionDebugEvent = Extract<DebugEvent, { type: 'section' }>;

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

const isMusicEvent = (event: DebugEvent): event is MusicDebugEvent => event.type === 'music';

const getSectionEvents = (): SectionDebugEvent[] =>
  getSharedSynthAudioDebugStateForTests().events.filter(
    (event): event is SectionDebugEvent => event.type === 'section',
  );

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

    const audio = new SynthAudio(scene, () => 0.5);

    await audio.unlock();
    audio.playCue(AUDIO_CUES.jump);

    expect(AudioContextCtor).toHaveBeenCalledTimes(1);
    expect(fakeContext.resume).toHaveBeenCalledTimes(1);
    expect(fakeContext.createGain).toHaveBeenCalledTimes(2);
    expect(fakeContext.createOscillator).toHaveBeenCalledTimes(2);
  });

  it('maps differentiated cue families through synthesized playback', () => {
    const fakeContext = new FakeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));
    const audio = new SynthAudio(createScene(), () => 0.8);

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
    expect(fakeContext.createOscillator).toHaveBeenCalledTimes(12);
    expect(fakeContext.createGain).toHaveBeenCalledTimes(12);
    expect(debugEvents.find((event) => event.cue === AUDIO_CUES.capsuleTeleport)?.signature).toBe(
      'capsule dematerialization sweep',
    );
  });

  it('keeps stomp, projectile, hurt, and death cues distinct on the shared synth path', () => {
    const fakeContext = new FakeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));
    const audio = new SynthAudio(createScene(), () => 1);

    audio.playCue(AUDIO_CUES.stomp);
    audio.playCue(AUDIO_CUES.shootHit);
    audio.playCue(AUDIO_CUES.hurt);
    audio.playCue(AUDIO_CUES.death);

    const cueEvents = getSharedSynthAudioDebugStateForTests().events.filter(
      (event): event is Extract<DebugEvent, { type: 'cue' }> => event.type === 'cue',
    );

    expect(cueEvents.map((event) => event.cue)).toEqual([
      AUDIO_CUES.stomp,
      AUDIO_CUES.shootHit,
      AUDIO_CUES.hurt,
      AUDIO_CUES.death,
    ]);
    expect(new Set(cueEvents.map((event) => event.signature)).size).toBe(4);
    expect(cueEvents.find((event) => event.cue === AUDIO_CUES.death)?.family).toBe('death');
    expect(cueEvents.find((event) => event.cue === AUDIO_CUES.hurt)?.family).toBe('danger');
  });

  it('keeps a checked-in CC0 manifest for menu and per-stage sustained tracks', () => {
    expect(ACTIVE_SUSTAINED_MUSIC_MANIFEST).toHaveLength(4);
    expect(ACTIVE_SUSTAINED_MUSIC_MANIFEST.every((entry) => entry.license === 'CC0')).toBe(true);
    expect(MENU_SUSTAINED_MUSIC.title).toBe('Another space background track');
    expect(getStageSustainedMusic('forest-ruins')?.title).toBe('Magic Space');
    expect(getStageSustainedMusic('amber-cavern')?.title).toBe('I swear I saw it - background track');
    expect(getStageSustainedMusic('sky-sanctum')?.title).toBe('Party Sector');
  });

  it('limits authored synth themes to transition stingers instead of sustained loop ownership', () => {
    const themes = getAuthoredMusicThemesForTests();

    expect(themes).toHaveLength(3);
    expect(themes.every((theme) => theme.surfaces['menu-loop'] === undefined)).toBe(true);
    expect(themes.every((theme) => theme.surfaces['gameplay-loop'] === undefined)).toBe(true);
    expect(themes.every((theme) => theme.surfaces['stage-intro'] && theme.surfaces['stage-clear'] && theme.surfaces['final-congrats'])).toBe(true);
  });

  it('replaces the prior sustained owner when scenes hand off between asset loops and synth stingers', async () => {
    const fakeContext = new FakeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));

    const menuScene = createScene();
    const gameplayScene = createScene();
    const introScene = createScene();
    const completeScene = createScene();
    const menuAudio = new SynthAudio(menuScene, () => 1);
    const gameplayAudio = new SynthAudio(gameplayScene, () => 1);
    const introAudio = new SynthAudio(introScene, () => 1);
    const completeAudio = new SynthAudio(completeScene, () => 1);

    await menuAudio.unlock();

    menuAudio.startMenuMusic();
    gameplayAudio.startStageMusic(stageDefinitions[0]);
    introAudio.playStageIntro(stageDefinitions[1]);
    completeAudio.playStageClear(stageDefinitions[2], true);

    expect(menuScene.__sounds[0].stop).toHaveBeenCalledTimes(1);
    expect(menuScene.__sounds[0].destroy).toHaveBeenCalledTimes(1);
    expect(gameplayScene.__sounds[0].stop).toHaveBeenCalledTimes(1);
    expect(gameplayScene.__sounds[0].destroy).toHaveBeenCalledTimes(1);
    expect(introScene.__delayedEvents.length).toBeGreaterThan(0);
    expect(completeScene.__delayedEvents.length).toBeGreaterThan(0);

    const musicEvents = getSharedSynthAudioDebugStateForTests().events.filter(isMusicEvent);

    expect(musicEvents.map((event) => `${event.phrase}:${event.playback === 'asset' ? event.assetKey : event.themeId}`)).toEqual([
      `menu-loop:${MENU_SUSTAINED_MUSIC.assetKey}`,
      `gameplay-loop:${getStageSustainedMusic(stageDefinitions[0].id)?.assetKey}`,
      'stage-intro:resin-descent',
      'final-congrats:halo-ascension',
    ]);
  });

  it('starts sustained menu and gameplay playback from manifest-backed music assets', async () => {
    const scene = createScene();
    const audio = new SynthAudio(scene, () => 1);

    const fakeContext = new FakeAudioContext();
    fakeContext.state = 'running';
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));

    await audio.unlock();
    audio.startStageMusic(stageDefinitions[0]);

    expect(scene.__sounds).toHaveLength(1);
    expect(scene.__sounds[0].play).toHaveBeenCalledWith({ loop: true, volume: 0.3 });

    const musicEvent = getSharedSynthAudioDebugStateForTests().events.find(
      (event): event is MusicDebugEvent => event.type === 'music' && event.phrase === 'gameplay-loop',
    );
    expect(musicEvent?.playback).toBe('asset');
    expect(musicEvent?.assetTitle).toBe('Magic Space');
    expect(musicEvent?.assetPath).toBe('/audio/music/forest-magic-space.mp3');
  });

  it('defers sustained assets and transition stingers until unlock succeeds', async () => {
    const fakeContext = new FakeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));

    const scenarios = [
      {
        phrase: 'menu-loop',
        start: (audio: SynthAudio) => audio.startMenuMusic(),
        expectAssetPlayback: true,
      },
      {
        phrase: 'gameplay-loop',
        start: (audio: SynthAudio) => audio.startStageMusic(stageDefinitions[1]),
        expectAssetPlayback: true,
      },
      {
        phrase: 'stage-intro',
        start: (audio: SynthAudio) => audio.playStageIntro(stageDefinitions[0]),
        expectAssetPlayback: false,
      },
      {
        phrase: 'final-congrats',
        start: (audio: SynthAudio) => audio.playStageClear(stageDefinitions[2], true),
        expectAssetPlayback: false,
      },
    ] as const;

    for (const scenario of scenarios) {
      resetSharedSynthAudioStateForTests();
      vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));
      fakeContext.state = 'suspended';
      fakeContext.resume.mockClear();
      const scene = createScene();
      const audio = new SynthAudio(scene, () => 1);

      scenario.start(audio);

      expect(getSharedSynthAudioDebugStateForTests().events.filter((event) => event.type === 'music')).toHaveLength(0);
      expect(scene.__sounds).toHaveLength(0);
      expect(scene.__delayedEvents).toHaveLength(0);

      await audio.unlock();

      const musicEvents = getSharedSynthAudioDebugStateForTests().events.filter(
        (event) => event.type === 'music' && event.phrase === scenario.phrase,
      );

      expect(fakeContext.resume).toHaveBeenCalledTimes(1);
      expect(musicEvents).toHaveLength(1);
      if (scenario.expectAssetPlayback) {
        expect(scene.__sounds).toHaveLength(1);
      } else {
        expect(scene.__delayedEvents.length).toBeGreaterThan(0);
      }
    }
  });

  it('retries menu asset playback after unlock if the first loop start does not latch immediately', async () => {
    const fakeContext = new FakeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));

    const scene = createScene();
    (scene.sound.add as unknown as { mockImplementation: (factory: () => FakeSound) => void }).mockImplementation(() => {
      const sound = new FakeSound();
      let attempts = 0;
      sound.play.mockImplementation(() => {
        attempts += 1;
        sound.isPlaying = attempts > 1;
      });
      scene.__sounds.push(sound);
      return sound;
    });
    const audio = new SynthAudio(scene, () => 1);

    audio.startMenuMusic();
    await audio.unlock();
    await Promise.resolve();

    expect(scene.__sounds).toHaveLength(1);
    expect(scene.__sounds[0].play).toHaveBeenCalledTimes(2);
    expect(scene.__sounds[0].isPlaying).toBe(true);
  });

  it('retains authored synthesized intro and completion theme sections for transition stingers', async () => {
    const fakeContext = new FakeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => fakeContext as unknown as AudioContext));

    const introScene = createScene();
    const finalScene = createScene();
    const introAudio = new SynthAudio(introScene, () => 1);
    const finalAudio = new SynthAudio(finalScene, () => 1);

    introAudio.playStageIntro(stageDefinitions[2]);
    finalAudio.playStageClear(stageDefinitions[2], true);

    await introAudio.unlock();
    await finalAudio.unlock();

    for (const event of introScene.__delayedEvents) {
      event.trigger();
    }
    for (const event of finalScene.__delayedEvents) {
      event.trigger();
    }

    const themes = getAuthoredMusicThemesForTests();
    const haloTheme = themes.find((theme) => theme.themeId === 'halo-ascension');
    const haloSections = getSectionEvents().filter((event) => event.themeId === 'halo-ascension');

    expect(haloTheme?.surfaces['stage-intro']?.sections).toHaveLength(1);
    expect(haloTheme?.surfaces['final-congrats']?.sections).toHaveLength(1);
    expect(haloSections.filter((event) => event.phrase === 'stage-intro').map((event) => event.role)).toEqual(['statement']);
    expect(haloSections.filter((event) => event.phrase === 'final-congrats').map((event) => event.role)).toEqual(['extension']);
  });
});