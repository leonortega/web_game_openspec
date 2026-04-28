import * as Phaser from 'phaser';
import {
  AUDIO_CUES,
  type AudioCue,
  type MusicPhrase,
  type PatternStep,
  type ThemeSectionRole,
  type SustainedAudioOwner,
  type ThemeSurfaceDefinition,
  type VoicePattern,
} from '../../audio/audioContract';
import {
  MENU_SUSTAINED_MUSIC,
  getStageSustainedMusic,
  type ActiveSustainedMusicManifestEntry,
} from '../../audio/musicAssets';
import { getAllAuthoredThemes, getStageMusicTheme } from '../../audio/musicThemes';
import type { StageDefinition } from '../../game/content/stages';

type ToneInstruction = {
  frequency: number;
  durationMs: number;
  type: OscillatorType;
  volume: number;
  offsetMs?: number;
};

type CueProfile = {
  family: string;
  signature: string;
  tones: ToneInstruction[];
};

type StageAudioSource = Pick<StageDefinition, 'id'>;

const CUE_PROFILES: Record<AudioCue, CueProfile> = {
  [AUDIO_CUES.jump]: { family: 'player-action', signature: 'two-step launch chirp', tones: [{ frequency: 587.33, durationMs: 80, type: 'square', volume: 0.03 }, { frequency: 739.99, durationMs: 90, type: 'square', volume: 0.022, offsetMs: 36 }] },
  [AUDIO_CUES.doubleJump]: { family: 'player-action', signature: 'spiral mid-air kick', tones: [{ frequency: 659.25, durationMs: 80, type: 'square', volume: 0.03 }, { frequency: 830.61, durationMs: 90, type: 'triangle', volume: 0.022, offsetMs: 30 }, { frequency: 987.77, durationMs: 110, type: 'square', volume: 0.018, offsetMs: 64 }] },
  [AUDIO_CUES.land]: { family: 'player-action', signature: 'short landing thunk', tones: [{ frequency: 164.81, durationMs: 75, type: 'triangle', volume: 0.025 }] },
  [AUDIO_CUES.dash]: { family: 'player-action', signature: 'rushing dash sweep', tones: [{ frequency: 659.25, durationMs: 120, type: 'sawtooth', volume: 0.028 }, { frequency: 392, durationMs: 140, type: 'triangle', volume: 0.02, offsetMs: 18 }] },
  [AUDIO_CUES.checkpoint]: { family: 'progress', signature: 'survey beacon confirmation fanfare', tones: [{ frequency: 440, durationMs: 110, type: 'square', volume: 0.025 }, { frequency: 659.25, durationMs: 140, type: 'square', volume: 0.022, offsetMs: 48 }, { frequency: 880, durationMs: 180, type: 'triangle', volume: 0.018, offsetMs: 96 }] },
  [AUDIO_CUES.collect]: { family: 'reward', signature: 'bright sample pickup sparkle', tones: [{ frequency: 783.99, durationMs: 70, type: 'square', volume: 0.024 }, { frequency: 1046.5, durationMs: 110, type: 'square', volume: 0.02, offsetMs: 34 }] },
  [AUDIO_CUES.rewardReveal]: { family: 'reward', signature: 'reward block reveal pop', tones: [{ frequency: 523.25, durationMs: 60, type: 'square', volume: 0.022 }, { frequency: 659.25, durationMs: 80, type: 'square', volume: 0.018, offsetMs: 28 }, { frequency: 880, durationMs: 110, type: 'triangle', volume: 0.016, offsetMs: 58 }] },
  [AUDIO_CUES.heal]: { family: 'reward', signature: 'restoration chord rise', tones: [{ frequency: 523.25, durationMs: 150, type: 'triangle', volume: 0.022 }, { frequency: 659.25, durationMs: 170, type: 'triangle', volume: 0.02, offsetMs: 44 }, { frequency: 783.99, durationMs: 220, type: 'sine', volume: 0.018, offsetMs: 92 }] },
  [AUDIO_CUES.danger]: { family: 'danger', signature: 'warning pulse alarm', tones: [{ frequency: 220, durationMs: 80, type: 'square', volume: 0.024 }, { frequency: 196, durationMs: 80, type: 'square', volume: 0.024, offsetMs: 92 }] },
  [AUDIO_CUES.hurt]: {
    family: 'danger',
    signature: 'jagged suit impact rasp',
    tones: [
      { frequency: 196, durationMs: 70, type: 'square', volume: 0.026 },
      { frequency: 155.56, durationMs: 140, type: 'sawtooth', volume: 0.03, offsetMs: 18 },
      { frequency: 130.81, durationMs: 170, type: 'triangle', volume: 0.018, offsetMs: 48 },
    ],
  },
  [AUDIO_CUES.death]: {
    family: 'death',
    signature: 'collapsing reactor shutdown',
    tones: [
      { frequency: 220, durationMs: 110, type: 'square', volume: 0.026 },
      { frequency: 174.61, durationMs: 180, type: 'sawtooth', volume: 0.028, offsetMs: 40 },
      { frequency: 130.81, durationMs: 240, type: 'triangle', volume: 0.022, offsetMs: 110 },
      { frequency: 87.31, durationMs: 360, type: 'sine', volume: 0.02, offsetMs: 180 },
    ],
  },
  [AUDIO_CUES.stomp]: {
    family: 'combat',
    signature: 'compressed boot-pop thud',
    tones: [
      { frequency: 185, durationMs: 56, type: 'square', volume: 0.03 },
      { frequency: 123.47, durationMs: 92, type: 'triangle', volume: 0.022, offsetMs: 10 },
    ],
  },
  [AUDIO_CUES.shoot]: { family: 'combat', signature: 'plasma shot pulse', tones: [{ frequency: 587.33, durationMs: 70, type: 'square', volume: 0.028 }] },
  [AUDIO_CUES.shootHit]: {
    family: 'combat',
    signature: 'plasma fracture zap',
    tones: [
      { frequency: 415.3, durationMs: 44, type: 'square', volume: 0.024 },
      { frequency: 659.25, durationMs: 58, type: 'square', volume: 0.018, offsetMs: 12 },
      { frequency: 246.94, durationMs: 120, type: 'triangle', volume: 0.018, offsetMs: 30 },
    ],
  },
  [AUDIO_CUES.turretFire]: { family: 'danger', signature: 'mechanical cannon bark', tones: [{ frequency: 349.23, durationMs: 90, type: 'square', volume: 0.026 }, { frequency: 233.08, durationMs: 110, type: 'triangle', volume: 0.018, offsetMs: 20 }] },
  [AUDIO_CUES.enemyPatrol]: { family: 'danger', signature: 'patrol turn tick', tones: [{ frequency: 277.18, durationMs: 60, type: 'square', volume: 0.02 }, { frequency: 233.08, durationMs: 70, type: 'triangle', volume: 0.015, offsetMs: 28 }] },
  [AUDIO_CUES.enemyHop]: { family: 'danger', signature: 'enemy leap boing', tones: [{ frequency: 392, durationMs: 70, type: 'square', volume: 0.022 }, { frequency: 523.25, durationMs: 90, type: 'triangle', volume: 0.018, offsetMs: 34 }] },
  [AUDIO_CUES.enemyCharge]: { family: 'danger', signature: 'charge burst sweep', tones: [{ frequency: 261.63, durationMs: 90, type: 'sawtooth', volume: 0.025 }, { frequency: 329.63, durationMs: 120, type: 'sawtooth', volume: 0.022, offsetMs: 34 }] },
  [AUDIO_CUES.exit]: { family: 'completion', signature: 'portal restore cue', tones: [{ frequency: 523.25, durationMs: 120, type: 'square', volume: 0.024 }, { frequency: 783.99, durationMs: 170, type: 'triangle', volume: 0.02, offsetMs: 52 }] },
  [AUDIO_CUES.capsuleTeleport]: {
    family: 'completion',
    signature: 'capsule dematerialization sweep',
    tones: [
      { frequency: 392, durationMs: 90, type: 'triangle', volume: 0.02 },
      { frequency: 523.25, durationMs: 130, type: 'sawtooth', volume: 0.022, offsetMs: 26 },
      { frequency: 783.99, durationMs: 170, type: 'triangle', volume: 0.018, offsetMs: 78 },
      { frequency: 1046.5, durationMs: 140, type: 'sine', volume: 0.014, offsetMs: 136 },
    ],
  },
  [AUDIO_CUES.stageClear]: { family: 'completion', signature: 'stage clear fanfare', tones: [{ frequency: 587.33, durationMs: 120, type: 'square', volume: 0.024 }, { frequency: 783.99, durationMs: 160, type: 'square', volume: 0.02, offsetMs: 44 }, { frequency: 987.77, durationMs: 220, type: 'triangle', volume: 0.018, offsetMs: 92 }] },
  [AUDIO_CUES.finalCongrats]: { family: 'completion', signature: 'final congratulations anthem', tones: [{ frequency: 659.25, durationMs: 140, type: 'square', volume: 0.024 }, { frequency: 880, durationMs: 180, type: 'square', volume: 0.02, offsetMs: 46 }, { frequency: 1174.66, durationMs: 260, type: 'triangle', volume: 0.018, offsetMs: 108 }] },
  [AUDIO_CUES.unlock]: { family: 'progress', signature: 'unlock shimmer', tones: [{ frequency: 523.25, durationMs: 100, type: 'square', volume: 0.022 }, { frequency: 659.25, durationMs: 120, type: 'triangle', volume: 0.018, offsetMs: 36 }, { frequency: 783.99, durationMs: 170, type: 'sine', volume: 0.015, offsetMs: 74 }] },
  [AUDIO_CUES.power]: { family: 'power', signature: 'power gain anthem', tones: [{ frequency: 493.88, durationMs: 100, type: 'square', volume: 0.024 }, { frequency: 659.25, durationMs: 130, type: 'triangle', volume: 0.02, offsetMs: 40 }, { frequency: 880, durationMs: 180, type: 'square', volume: 0.018, offsetMs: 84 }] },
  [AUDIO_CUES.block]: { family: 'interactive', signature: 'reward block thunk', tones: [{ frequency: 311.13, durationMs: 80, type: 'square', volume: 0.02 }] },
  [AUDIO_CUES.collapse]: { family: 'interactive', signature: 'crumbling platform drop', tones: [{ frequency: 233.08, durationMs: 110, type: 'sawtooth', volume: 0.024 }, { frequency: 174.61, durationMs: 150, type: 'triangle', volume: 0.018, offsetMs: 34 }] },
  [AUDIO_CUES.spring]: { family: 'interactive', signature: 'spring launch pop', tones: [{ frequency: 659.25, durationMs: 70, type: 'square', volume: 0.025 }, { frequency: 783.99, durationMs: 100, type: 'triangle', volume: 0.018, offsetMs: 28 }] },
  [AUDIO_CUES.movingPlatform]: { family: 'interactive', signature: 'removed moving platform cue', tones: [] },
  [AUDIO_CUES.menuNavigate]: { family: 'menu-ui', signature: 'cursor tick', tones: [{ frequency: 659.25, durationMs: 70, type: 'square', volume: 0.02 }] },
  [AUDIO_CUES.menuConfirm]: { family: 'menu-ui', signature: 'menu confirm chirp', tones: [{ frequency: 698.46, durationMs: 80, type: 'square', volume: 0.022 }, { frequency: 932.33, durationMs: 110, type: 'triangle', volume: 0.018, offsetMs: 34 }] },
  [AUDIO_CUES.menuBack]: { family: 'menu-ui', signature: 'menu back descend', tones: [{ frequency: 493.88, durationMs: 80, type: 'triangle', volume: 0.02 }, { frequency: 369.99, durationMs: 110, type: 'sine', volume: 0.016, offsetMs: 34 }] },
};

type AudioDebugEvent =
  | { type: 'cue'; cue: AudioCue; family: string; signature: string; at: number }
  | {
      type: 'music';
      owner: SustainedAudioOwner;
      stageId: string | null;
      phrase: MusicPhrase;
      playback: 'asset' | 'synth';
      themeId?: string;
      label: string;
      signature: string;
      relationship: string;
      assetKey?: string;
      assetTitle?: string;
      creator?: string;
      assetLicense?: string;
      assetPath?: string;
      sourceUrl?: string;
      at: number;
    }
  | {
      type: 'section';
      owner: SustainedAudioOwner;
      themeId: string;
      stageId: string | null;
      phrase: MusicPhrase;
      sectionId: string;
      label: string;
      role: ThemeSectionRole;
      cycle: number;
      at: number;
    }
  | { type: 'owner'; owner: SustainedAudioOwner | null; at: number }
  | { type: 'unlock'; state: AudioContextState | 'unsupported' | 'error'; at: number };

type AudioDebugState = {
  activeOwner: SustainedAudioOwner | null;
  events: AudioDebugEvent[];
  lastCue: AudioCue | null;
  unlockCount: number;
};

type AudioContextLike = typeof globalThis & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
  __CRYSTAL_RUN_AUDIO_DEBUG__?: AudioDebugState;
};

let sharedAudioContext: AudioContext | undefined;
let sharedActiveMusic:
  | {
      instanceId: number;
      owner: SustainedAudioOwner;
      requestKey: string;
      stop: () => void;
    }
  | undefined;
let nextInstanceId = 1;

type ThemePlaybackRequest = {
  kind: 'theme';
  owner: SustainedAudioOwner;
  profile: ReturnType<typeof getStageMusicTheme>;
  phrase: MusicPhrase;
  stageId: string | null;
};

type AssetPlaybackRequest = {
  kind: 'asset';
  owner: SustainedAudioOwner;
  asset: ActiveSustainedMusicManifestEntry;
  phrase: Extract<MusicPhrase, 'menu-loop' | 'gameplay-loop'>;
  stageId: string | null;
};

type PlaybackRequest = ThemePlaybackRequest | AssetPlaybackRequest;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const BACKGROUND_MUSIC_ENABLED = true;

const getDebugState = (): AudioDebugState => {
  const audioGlobal = globalThis as AudioContextLike;
  if (!audioGlobal.__CRYSTAL_RUN_AUDIO_DEBUG__) {
    audioGlobal.__CRYSTAL_RUN_AUDIO_DEBUG__ = {
      activeOwner: null,
      events: [],
      lastCue: null,
      unlockCount: 0,
    };
  }

  return audioGlobal.__CRYSTAL_RUN_AUDIO_DEBUG__;
};

const pushDebugEvent = (event: AudioDebugEvent): void => {
  const debug = getDebugState();
  debug.events.push(event);
  if (debug.events.length > 120) {
    debug.events.splice(0, debug.events.length - 120);
  }
  if (event.type === 'cue') {
    debug.lastCue = event.cue;
  }
  if (event.type === 'owner') {
    debug.activeOwner = event.owner;
  }
  if (event.type === 'unlock') {
    debug.unlockCount += 1;
  }
};

const resolveStageAudioSource = (stage: StageAudioSource | string): StageAudioSource => {
  if (typeof stage === 'string') {
    return {
      id: stage,
    };
  }

  return stage;
};

const resolveMusicProfile = (stage: StageAudioSource | string) => {
  const source = resolveStageAudioSource(stage);
  return getStageMusicTheme(source.id);
};

const getSurfaceDuration = (surface: ThemeSurfaceDefinition): number =>
  surface.sections.reduce((longest, section) => {
    const sectionDuration = section.voices.reduce((sectionLongest, voice) => {
      const voiceOffsetMs = (voice.startOffsetSteps ?? 0) * voice.stepMs;
      const voiceDuration = voiceOffsetMs + voice.notes.length * voice.stepMs;
      return Math.max(sectionLongest, section.startMs + voiceDuration);
    }, section.startMs);

    return Math.max(longest, sectionDuration);
  }, 0);

const playStep = (
  playTone: (frequency: number, durationMs: number, type: OscillatorType, volume: number, offsetMs?: number) => void,
  step: PatternStep,
  durationMs: number,
  type: OscillatorType,
  volume: number,
  offsetMs = 0,
): void => {
  if (step == null) {
    return;
  }

  if (Array.isArray(step)) {
    for (const note of step) {
      playTone(note, durationMs, type, volume, offsetMs);
    }
    return;
  }

  playTone(step, durationMs, type, volume, offsetMs);
};

const resolveAudioContext = (): AudioContext | undefined => {
  if (sharedAudioContext) {
    return sharedAudioContext;
  }

  const audioGlobal = globalThis as AudioContextLike;
  const AudioContextCtor = audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;
  if (!AudioContextCtor) {
    return undefined;
  }

  sharedAudioContext = new AudioContextCtor();
  return sharedAudioContext;
};

export class SynthAudio {
  private readonly instanceId = nextInstanceId++;

  private activeStopper?: () => void;

  private pendingPlaybackRequest?: PlaybackRequest;

  private waitingForSoundManagerUnlock = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly getMasterVolume: () => number,
  ) {}

  async unlock(): Promise<boolean> {
    try {
      const context = this.getContext();
      if (!context) {
        pushDebugEvent({ type: 'unlock', state: 'unsupported', at: Date.now() });
        return false;
      }

      if (context.state === 'suspended') {
        await context.resume();
      }

      this.ensureSoundManagerUnlocked();

      pushDebugEvent({ type: 'unlock', state: context.state, at: Date.now() });
      if (context.state === 'running') {
        this.flushPendingPlaybackRequest();
      }
      return context.state === 'running';
    } catch {
      pushDebugEvent({ type: 'unlock', state: 'error', at: Date.now() });
      return false;
    }
  }

  startMenuMusic(): void {
    this.requestAssetMusic({
      kind: 'asset',
      owner: 'menu',
      asset: MENU_SUSTAINED_MUSIC,
      phrase: 'menu-loop',
      stageId: null,
    });
  }

  startStageMusic(stage: StageAudioSource | string): void {
    const source = resolveStageAudioSource(stage);
    const asset = getStageSustainedMusic(source.id);
    if (!asset) {
      return;
    }

    this.requestAssetMusic({
      kind: 'asset',
      owner: 'gameplay',
      asset,
      phrase: 'gameplay-loop',
      stageId: source.id,
    });
  }

  playStageIntro(stage: StageAudioSource | string): void {
    const source = resolveStageAudioSource(stage);
    const profile = resolveMusicProfile(source);
    this.requestThemeMusic({ kind: 'theme', owner: 'transition', profile, phrase: 'stage-intro', stageId: source.id });
  }

  playStageClear(stage: StageAudioSource | string, finalStage: boolean): void {
    const source = resolveStageAudioSource(stage);
    const profile = resolveMusicProfile(source);
    if (finalStage) {
      this.requestThemeMusic({ kind: 'theme', owner: 'transition', profile, phrase: 'final-congrats', stageId: source.id });
      return;
    }

    this.requestThemeMusic({ kind: 'theme', owner: 'transition', profile, phrase: 'stage-clear', stageId: source.id });
  }

  stopMusic(): void {
    this.pendingPlaybackRequest = undefined;
    this.activeStopper?.();
    this.activeStopper = undefined;
    if (sharedActiveMusic?.instanceId === this.instanceId) {
      sharedActiveMusic = undefined;
      pushDebugEvent({ type: 'owner', owner: null, at: Date.now() });
    }
  }

  playCue(cue: AudioCue): void {
    const profile = CUE_PROFILES[cue];
    pushDebugEvent({ type: 'cue', cue, family: profile.family, signature: profile.signature, at: Date.now() });

    for (const tone of profile.tones) {
      this.playTone(tone.frequency, tone.durationMs, tone.type, tone.volume, tone.offsetMs);
    }
  }

  private requestThemeMusic(request: ThemePlaybackRequest): void {
    this.requestPlayback(request);
  }

  private requestAssetMusic(request: AssetPlaybackRequest): void {
    this.requestPlayback(request);
  }

  private requestPlayback(request: PlaybackRequest): void {
    if (!BACKGROUND_MUSIC_ENABLED) {
      this.pendingPlaybackRequest = undefined;
      this.stopMusic();
      return;
    }

    if (!this.isPlaybackUnlocked()) {
      this.pendingPlaybackRequest = request;
      return;
    }

    if (request.kind === 'asset' && this.isSoundManagerLocked()) {
      this.pendingPlaybackRequest = request;
      this.ensureSoundManagerUnlocked();
      return;
    }

    const requestKey = this.getPlaybackRequestKey(request);
    if (sharedActiveMusic?.instanceId === this.instanceId && sharedActiveMusic.requestKey === requestKey) {
      this.pendingPlaybackRequest = undefined;
      return;
    }

    this.pendingPlaybackRequest = undefined;
    if (request.kind === 'asset') {
      this.startAssetMusic(request, requestKey);
      return;
    }

    this.startThemeMusic(request, requestKey);
  }

  private flushPendingPlaybackRequest(): void {
    const request = this.pendingPlaybackRequest;
    if (!request) {
      return;
    }

    this.pendingPlaybackRequest = undefined;
    this.requestPlayback(request);
  }

  private getPlaybackRequestKey(request: PlaybackRequest): string {
    if (request.kind === 'asset') {
      return `${request.owner}:${request.asset.assetKey}:${request.phrase}:${request.stageId ?? 'menu'}`;
    }

    return `${request.owner}:${request.profile.themeId}:${request.phrase}:${request.stageId ?? 'menu'}`;
  }

  private startAssetMusic(request: AssetPlaybackRequest, requestKey: string): void {
    const { owner, asset, phrase, stageId } = request;
    const masterVolume = clamp(this.getMasterVolume(), 0, 1);
    if (masterVolume <= 0) {
      this.pendingPlaybackRequest = request;
      return;
    }

    try {
      const sound = this.scene.sound.add(asset.assetKey) as Phaser.Sound.BaseSound & { isPlaying?: boolean };
      const playConfig = { loop: true, volume: clamp(asset.volume * masterVolume, 0, 1) };
      const playLoop = (): void => {
        if (sharedActiveMusic?.instanceId !== this.instanceId || sharedActiveMusic.requestKey !== requestKey) {
          return;
        }

        try {
          if (!sound.isPlaying) {
            sound.play(playConfig);
          }
        } catch {}
      };
      pushDebugEvent({
        type: 'music',
        owner,
        stageId,
        phrase,
        playback: 'asset',
        label: asset.title,
        signature: 'vendored CC0 sustained music asset',
        relationship: 'replaces synthesized sustained loop ownership for this surface',
        assetKey: asset.assetKey,
        assetTitle: asset.title,
        creator: asset.creator,
        assetLicense: asset.license,
        assetPath: asset.localAssetPath,
        sourceUrl: asset.sourceUrl,
        at: Date.now(),
      });
      this.startOwnedMusic(owner, requestKey, () => {
        try {
          sound.stop();
        } catch {}
        try {
          sound.destroy();
        } catch {}
      });
      playLoop();
      queueMicrotask(playLoop);
    } catch {}
  }

  private startThemeMusic(request: ThemePlaybackRequest, requestKey: string): void {
    const { owner, profile, phrase, stageId } = request;
    const surface = profile.surfaces[phrase];
    if (!surface) {
      return;
    }

    pushDebugEvent({
      type: 'music',
      owner,
      stageId,
      phrase,
      playback: 'synth',
      themeId: profile.themeId,
      label: surface.label,
      signature: surface.signature,
      relationship: surface.relationship,
      at: Date.now(),
    });
    const events = surface.loop
      ? this.scheduleSurfaceLoop(owner, profile.themeId, phrase, stageId, surface)
      : this.scheduleSurfacePhrase(owner, profile.themeId, phrase, stageId, surface);
    this.startOwnedMusic(owner, requestKey, () => {
      for (const event of events) {
        event.remove(false);
      }
    });
  }

  private startOwnedMusic(
    owner: SustainedAudioOwner,
    requestKey: string,
    stop: () => void,
  ): void {
    sharedActiveMusic?.stop();
    this.activeStopper = stop;
    sharedActiveMusic = { instanceId: this.instanceId, owner, requestKey, stop };
    pushDebugEvent({ type: 'owner', owner, at: Date.now() });
  }

  private scheduleSurfaceLoop(
    owner: SustainedAudioOwner,
    themeId: string,
    phrase: MusicPhrase,
    stageId: string | null,
    surface: ThemeSurfaceDefinition,
  ): Phaser.Time.TimerEvent[] {
    const events: Phaser.Time.TimerEvent[] = [];
    const cycleDuration = Math.max(1, getSurfaceDuration(surface));
    let nextCycleIndex = 1;
    const scheduleCycle = (baseOffsetMs: number, cycle: number): void => {
      for (const section of surface.sections) {
        events.push(this.scheduleSectionProgress(owner, themeId, phrase, stageId, section, baseOffsetMs, cycle));
        for (const voice of section.voices) {
          events.push(...this.scheduleVoice(voice, baseOffsetMs + section.startMs));
        }
      }
    };

    scheduleCycle(0, 0);
    events.push(
      this.scene.time.addEvent({
        delay: cycleDuration,
        loop: true,
        callback: () => {
          scheduleCycle(0, nextCycleIndex);
          nextCycleIndex += 1;
        },
      }),
    );

    return events;
  }

  private scheduleSurfacePhrase(
    owner: SustainedAudioOwner,
    themeId: string,
    phrase: MusicPhrase,
    stageId: string | null,
    surface: ThemeSurfaceDefinition,
  ): Phaser.Time.TimerEvent[] {
    return surface.sections.flatMap((section) => [
      this.scheduleSectionProgress(owner, themeId, phrase, stageId, section, 0, 0),
      ...section.voices.flatMap((voice) => this.scheduleVoice(voice, section.startMs)),
    ]);
  }

  private scheduleSectionProgress(
    owner: SustainedAudioOwner,
    themeId: string,
    phrase: MusicPhrase,
    stageId: string | null,
    section: ThemeSurfaceDefinition['sections'][number],
    baseOffsetMs: number,
    cycle: number,
  ): Phaser.Time.TimerEvent {
    return this.scene.time.delayedCall(baseOffsetMs + section.startMs, () => {
      pushDebugEvent({
        type: 'section',
        owner,
        themeId,
        stageId,
        phrase,
        sectionId: section.id,
        label: section.label,
        role: section.role,
        cycle,
        at: Date.now(),
      });
    });
  }

  private scheduleVoice(voice: VoicePattern, baseOffsetMs: number): Phaser.Time.TimerEvent[] {
    const startOffsetMs = (voice.startOffsetSteps ?? 0) * voice.stepMs;
    return voice.notes.map((note, index) =>
      this.scene.time.delayedCall(baseOffsetMs + startOffsetMs + voice.stepMs * index, () => {
        playStep(this.playTone.bind(this), note, voice.durationMs, voice.type, voice.volume);
      }),
    );
  }

  private playTone(
    frequency: number,
    durationMs: number,
    type: OscillatorType,
    volume: number,
    offsetMs = 0,
  ): void {
    try {
      const context = this.getContext();
      if (!context) {
        return;
      }
      const masterVolume = clamp(this.getMasterVolume(), 0, 1);
      if (masterVolume <= 0) {
        return;
      }

      const startAt = context.currentTime + offsetMs / 1000;
      const gain = context.createGain();
      const oscillator = context.createOscillator();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * masterVolume), startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + durationMs / 1000 + 0.02);
    } catch {}
  }

  private getContext(): AudioContext | undefined {
    return resolveAudioContext();
  }

  private getSoundManager():
    | (Phaser.Sound.BaseSoundManager & {
        locked?: boolean;
        unlock?: () => void;
        once?: (event: string, listener: () => void) => void;
      })
    | undefined {
    return this.scene.sound as Phaser.Sound.BaseSoundManager & {
      locked?: boolean;
      unlock?: () => void;
      once?: (event: string, listener: () => void) => void;
    };
  }

  private isSoundManagerLocked(): boolean {
    return Boolean(this.getSoundManager()?.locked);
  }

  private ensureSoundManagerUnlocked(): void {
    const soundManager = this.getSoundManager();
    if (!soundManager?.locked) {
      this.waitingForSoundManagerUnlock = false;
      return;
    }

    if (!this.waitingForSoundManagerUnlock) {
      this.waitingForSoundManagerUnlock = true;
      soundManager.once?.('unlocked', () => {
        this.waitingForSoundManagerUnlock = false;
        this.flushPendingPlaybackRequest();
      });
    }

    try {
      soundManager.unlock?.();
    } catch {}

    if (!soundManager.locked) {
      this.waitingForSoundManagerUnlock = false;
      this.flushPendingPlaybackRequest();
    }
  }

  private isPlaybackUnlocked(): boolean {
    return sharedAudioContext?.state === 'running';
  }
}

export const getSharedSynthAudioDebugStateForTests = (): AudioDebugState => getDebugState();

export const getAuthoredMusicThemesForTests = () => getAllAuthoredThemes();

export const resetSharedSynthAudioStateForTests = (): void => {
  sharedAudioContext = undefined;
  sharedActiveMusic = undefined;
  nextInstanceId = 1;
  const debug = getDebugState();
  debug.activeOwner = null;
  debug.events = [];
  debug.lastCue = null;
  debug.unlockCount = 0;
};
