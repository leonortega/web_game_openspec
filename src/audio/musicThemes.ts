import type { AuthoredMusicTheme, StageAudioThemeMetadata, VoicePattern } from './audioContract';

const square = (
  stepMs: number,
  durationMs: number,
  volume: number,
  notes: VoicePattern['notes'],
  startOffsetSteps = 0,
): VoicePattern => ({ stepMs, durationMs, type: 'square', volume, notes, startOffsetSteps });

const triangle = (
  stepMs: number,
  durationMs: number,
  volume: number,
  notes: VoicePattern['notes'],
  startOffsetSteps = 0,
): VoicePattern => ({ stepMs, durationMs, type: 'triangle', volume, notes, startOffsetSteps });

const saw = (
  stepMs: number,
  durationMs: number,
  volume: number,
  notes: VoicePattern['notes'],
  startOffsetSteps = 0,
): VoicePattern => ({ stepMs, durationMs, type: 'sawtooth', volume, notes, startOffsetSteps });

const sine = (
  stepMs: number,
  durationMs: number,
  volume: number,
  notes: VoicePattern['notes'],
  startOffsetSteps = 0,
): VoicePattern => ({ stepMs, durationMs, type: 'sine', volume, notes, startOffsetSteps });

export const STAGE_MUSIC_THEMES: Record<string, AuthoredMusicTheme> = {
  'verdant-runner': {
    themeId: 'verdant-runner',
    signature: 'rising buoyant hook with springing bass, late canopy replies, and a lifting restart pickup',
    surfaces: {
      'stage-intro': {
        label: 'canopy wake-up phrase',
        signature: 'quick rising hook statement that previews the stage climb',
        relationship: 'states the forest hook before the asset-backed loop takes over in gameplay',
        loop: false,
        sections: [
          {
            id: 'forest-intro',
            label: 'hook statement',
            role: 'statement',
            startMs: 0,
            voices: [
              square(140, 150, 0.022, [329.63, 392, 493.88, 587.33, 659.25]),
              triangle(280, 200, 0.015, [164.81, 196, 246.94, 293.66, 329.63]),
            ],
          },
        ],
      },
      'stage-clear': {
        label: 'beacon secured fanfare',
        signature: 'upward resolution that closes the buoyant climb on tonic',
        relationship: 'resolves the forest hook into a bright beacon-confirming cadence',
        loop: false,
        sections: [
          {
            id: 'forest-clear',
            label: 'tonic close',
            role: 'cadence',
            startMs: 0,
            voices: [
              square(150, 170, 0.022, [392, 493.88, 587.33, 659.25, 783.99]),
              triangle(300, 220, 0.014, [196, 246.94, 293.66, 392, 440]),
            ],
          },
        ],
      },
      'final-congrats': {
        label: 'orbital beacon coronation',
        signature: 'extended forest-family close with broader rising answer tones',
        relationship: 'culminates the forest hook with a longer celebratory close for the run ending',
        loop: false,
        sections: [
          {
            id: 'forest-final',
            label: 'extended close',
            role: 'extension',
            startMs: 0,
            voices: [
              square(150, 180, 0.023, [392, 493.88, 587.33, 783.99, 880, 987.77]),
              triangle(300, 220, 0.015, [196, 246.94, 293.66, 392, 440, 493.88]),
              sine(150, 90, 0.008, [783.99, null, 880, 987.77], 2),
            ],
          },
        ],
      },
    },
  },
  'resin-descent': {
    themeId: 'resin-descent',
    signature: 'compressed low-register march with clipped lead cells, heavy bass stomps, and a grit-loaded turnaround',
    surfaces: {
      'stage-intro': {
        label: 'furnace ignition phrase',
        signature: 'compressed descending hook statement with a low ignition push',
        relationship: 'states the amber motif as a tight heavy cell before gameplay widens into the asset loop',
        loop: false,
        sections: [
          {
            id: 'amber-intro',
            label: 'ignition statement',
            role: 'statement',
            startMs: 0,
            voices: [
              saw(150, 170, 0.021, [293.66, 261.63, 220, 246.94, 220]),
              triangle(300, 220, 0.015, [146.83, 130.81, 123.47, 146.83, 164.81]),
            ],
          },
        ],
      },
      'stage-clear': {
        label: 'reactor vault salute',
        signature: 'heavy hook resolution that opens upward after the compressed march',
        relationship: 'resolves the amber march by releasing the pressure into a firmer tonic close',
        loop: false,
        sections: [
          {
            id: 'amber-clear',
            label: 'reactor close',
            role: 'cadence',
            startMs: 0,
            voices: [
              square(160, 175, 0.021, [329.63, 392, 440, 523.25, 587.33]),
              triangle(320, 220, 0.014, [164.81, 196, 220, 261.63, 293.66]),
            ],
          },
        ],
      },
      'final-congrats': {
        label: 'reactor crown salute',
        signature: 'extended amber-family close that lifts the compressed motif into a broader finish',
        relationship: 'culminates the amber motif with a longer final release while keeping the heavy family identity',
        loop: false,
        sections: [
          {
            id: 'amber-final',
            label: 'vault triumph',
            role: 'extension',
            startMs: 0,
            voices: [
              square(150, 180, 0.022, [329.63, 392, 440, 523.25, 659.25, 783.99]),
              triangle(300, 230, 0.015, [164.81, 196, 220, 261.63, 329.63, 392]),
              saw(150, 90, 0.008, [440, null, 523.25, 659.25], 2),
            ],
          },
        ],
      },
    },
  },
  'halo-ascension': {
    themeId: 'halo-ascension',
    signature: 'high open hook with floating bass gaps, delayed halo replies, and a wide suspended turnaround',
    surfaces: {
      'stage-intro': {
        label: 'ion ascent phrase',
        signature: 'wide high hook statement that previews the floating gameplay contour',
        relationship: 'states the sky hook in a shorter suspended phrase before gameplay hands off to the asset loop',
        loop: false,
        sections: [
          {
            id: 'sky-intro',
            label: 'halo statement',
            role: 'statement',
            startMs: 0,
            voices: [
              square(150, 160, 0.021, [440, 587.33, 739.99, 880, 987.77]),
              triangle(300, 210, 0.014, [220, 293.66, 369.99, 440, 493.88]),
            ],
          },
        ],
      },
      'stage-clear': {
        label: 'array docking fanfare',
        signature: 'open suspended resolution that lands the sky hook without losing height',
        relationship: 'resolves the sky hook by closing the suspended shape into a brighter docked cadence',
        loop: false,
        sections: [
          {
            id: 'sky-clear',
            label: 'dock close',
            role: 'cadence',
            startMs: 0,
            voices: [
              square(150, 180, 0.0215, [587.33, 739.99, 880, 987.77, 1174.66]),
              triangle(300, 220, 0.014, [293.66, 369.99, 440, 493.88, 587.33]),
            ],
          },
        ],
      },
      'final-congrats': {
        label: 'crown array congratulations',
        signature: 'extended sky-family culmination with wide bright upper replies',
        relationship: 'culminates the sky hook into the run-ending congratulations phrase while preserving the open register',
        loop: false,
        sections: [
          {
            id: 'sky-final',
            label: 'crown culmination',
            role: 'extension',
            startMs: 0,
            voices: [
              square(140, 185, 0.023, [587.33, 739.99, 880, 987.77, 1174.66, 1318.51]),
              triangle(280, 230, 0.015, [293.66, 369.99, 440, 493.88, 587.33, 659.25]),
              sine(140, 90, 0.008, [1174.66, null, 1318.51, 1567.98], 2),
            ],
          },
        ],
      },
    },
  },
};

export const STAGE_AUDIO_METADATA: Record<string, StageAudioThemeMetadata> = {
  'forest-ruins': {
    themeId: 'verdant-runner',
    signature: STAGE_MUSIC_THEMES['verdant-runner'].signature,
    transitionPhrases: {
      intro: {
        label: 'canopy wake-up phrase',
        signature: STAGE_MUSIC_THEMES['verdant-runner'].surfaces['stage-intro']!.signature,
        relationship: STAGE_MUSIC_THEMES['verdant-runner'].surfaces['stage-intro']!.relationship,
      },
      clear: {
        label: 'beacon secured fanfare',
        signature: STAGE_MUSIC_THEMES['verdant-runner'].surfaces['stage-clear']!.signature,
        relationship: STAGE_MUSIC_THEMES['verdant-runner'].surfaces['stage-clear']!.relationship,
      },
      final: {
        label: 'orbital beacon coronation',
        signature: STAGE_MUSIC_THEMES['verdant-runner'].surfaces['final-congrats']!.signature,
        relationship: STAGE_MUSIC_THEMES['verdant-runner'].surfaces['final-congrats']!.relationship,
      },
    },
  },
  'amber-cavern': {
    themeId: 'resin-descent',
    signature: STAGE_MUSIC_THEMES['resin-descent'].signature,
    transitionPhrases: {
      intro: {
        label: 'furnace ignition phrase',
        signature: STAGE_MUSIC_THEMES['resin-descent'].surfaces['stage-intro']!.signature,
        relationship: STAGE_MUSIC_THEMES['resin-descent'].surfaces['stage-intro']!.relationship,
      },
      clear: {
        label: 'reactor vault salute',
        signature: STAGE_MUSIC_THEMES['resin-descent'].surfaces['stage-clear']!.signature,
        relationship: STAGE_MUSIC_THEMES['resin-descent'].surfaces['stage-clear']!.relationship,
      },
      final: {
        label: 'reactor crown salute',
        signature: STAGE_MUSIC_THEMES['resin-descent'].surfaces['final-congrats']!.signature,
        relationship: STAGE_MUSIC_THEMES['resin-descent'].surfaces['final-congrats']!.relationship,
      },
    },
  },
  'sky-sanctum': {
    themeId: 'halo-ascension',
    signature: STAGE_MUSIC_THEMES['halo-ascension'].signature,
    transitionPhrases: {
      intro: {
        label: 'ion ascent phrase',
        signature: STAGE_MUSIC_THEMES['halo-ascension'].surfaces['stage-intro']!.signature,
        relationship: STAGE_MUSIC_THEMES['halo-ascension'].surfaces['stage-intro']!.relationship,
      },
      clear: {
        label: 'array docking fanfare',
        signature: STAGE_MUSIC_THEMES['halo-ascension'].surfaces['stage-clear']!.signature,
        relationship: STAGE_MUSIC_THEMES['halo-ascension'].surfaces['stage-clear']!.relationship,
      },
      final: {
        label: 'crown array congratulations',
        signature: STAGE_MUSIC_THEMES['halo-ascension'].surfaces['final-congrats']!.signature,
        relationship: STAGE_MUSIC_THEMES['halo-ascension'].surfaces['final-congrats']!.relationship,
      },
    },
  },
};

export const getMusicThemeById = (themeId: string): AuthoredMusicTheme =>
  STAGE_MUSIC_THEMES[themeId] ?? STAGE_MUSIC_THEMES['verdant-runner'];

export const getStageMusicTheme = (stageId: string): AuthoredMusicTheme =>
  getMusicThemeById(STAGE_AUDIO_METADATA[stageId]?.themeId ?? 'verdant-runner');

export const getAllAuthoredThemes = (): AuthoredMusicTheme[] => Object.values(STAGE_MUSIC_THEMES);