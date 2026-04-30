export const AUDIO_CUES = {
  jump: 'jump',
  doubleJump: 'double-jump',
  land: 'land',
  dash: 'dash',
  checkpoint: 'checkpoint',
  collect: 'collect',
  rewardReveal: 'reward-reveal',
  heal: 'heal',
  danger: 'danger',
  chargerWindup: 'charger-windup',
  hurt: 'hurt',
  death: 'death',
  stomp: 'stomp',
  thrusterPulse: 'thruster-pulse',
  thrusterImpact: 'thruster-impact',
  shoot: 'shoot',
  shootHit: 'shoot-hit',
  turretFire: 'turret-fire',
  enemyPatrol: 'enemy-patrol',
  enemyHop: 'enemy-hop',
  enemyCharge: 'enemy-charge',
  exit: 'exit',
  capsuleTeleport: 'capsule-teleport',
  stageClear: 'stage-clear',
  finalCongrats: 'final-congrats',
  unlock: 'unlock',
  power: 'power',
  block: 'block',
  collapse: 'collapse',
  spring: 'spring',
  movingPlatform: 'moving-platform',
  menuNavigate: 'menu-navigate',
  menuConfirm: 'menu-confirm',
  menuBack: 'menu-back',
} as const;

export type AudioCue = (typeof AUDIO_CUES)[keyof typeof AUDIO_CUES];

export type SustainedAudioOwner = 'menu' | 'gameplay' | 'transition';

export type MusicPhrase = 'menu-loop' | 'stage-intro' | 'gameplay-loop' | 'stage-clear' | 'final-congrats';

export type PatternStep = number | number[] | null;

export type VoicePattern = {
  stepMs: number;
  durationMs: number;
  type: OscillatorType;
  volume: number;
  notes: PatternStep[];
  startOffsetSteps?: number;
};

export type ThemeSectionRole = 'statement' | 'answer' | 'development' | 'turnaround' | 'pickup' | 'cadence' | 'extension';

export type ThemeSectionDefinition = {
  id: string;
  label: string;
  role: ThemeSectionRole;
  startMs: number;
  voices: VoicePattern[];
};

export type ThemeSurfaceDefinition = {
  label: string;
  signature: string;
  relationship: string;
  loop: boolean;
  sections: ThemeSectionDefinition[];
};

export type AuthoredMusicTheme = {
  themeId: string;
  signature: string;
  surfaces: Partial<Record<MusicPhrase, ThemeSurfaceDefinition>>;
};

export type ThemePhraseMetadata = {
  label: string;
  signature: string;
  relationship: string;
};

export type StageAudioThemeMetadata = {
  themeId: string;
  signature: string;
  transitionPhrases: {
    intro: ThemePhraseMetadata;
    clear: ThemePhraseMetadata;
    final: ThemePhraseMetadata;
  };
};