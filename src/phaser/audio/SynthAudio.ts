import * as Phaser from 'phaser';

const MUSIC_PATTERNS: Record<string, number[]> = {
  'forest-ruins': [261.63, 329.63, 392, 329.63, 440, 392],
  'amber-cavern': [196, 246.94, 293.66, 246.94, 349.23, 293.66],
  'sky-sanctum': [293.66, 369.99, 440, 493.88, 440, 369.99],
};

type AudioContextLike = typeof globalThis & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

let sharedAudioContext: AudioContext | undefined;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

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
  private musicEvent?: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly getMasterVolume: () => number,
  ) {}

  unlock(): void {
    try {
      const context = this.getContext();
      if (context?.state === 'suspended') {
        void context.resume();
      }
    } catch {}
  }

  startStageMusic(stageId: string): void {
    this.stopMusic();
    const pattern = MUSIC_PATTERNS[stageId] ?? MUSIC_PATTERNS['forest-ruins'];
    let index = 0;
    this.musicEvent = this.scene.time.addEvent({
      delay: 320,
      loop: true,
      callback: () => {
        const note = pattern[index % pattern.length];
        this.playTone(note, 220, 'triangle', 0.018);
        if (index % 2 === 0) {
          this.playTone(note / 2, 260, 'sine', 0.01);
        }
        index += 1;
      },
    });
  }

  stopMusic(): void {
    this.musicEvent?.remove(false);
    this.musicEvent = undefined;
  }

  playCue(cue: string): void {
    switch (cue) {
      case 'jump':
        this.playTone(520, 90, 'square', 0.03);
        break;
      case 'double-jump':
        this.playTone(620, 90, 'square', 0.03);
        this.playTone(760, 110, 'triangle', 0.02);
        break;
      case 'land':
        this.playTone(180, 70, 'triangle', 0.025);
        break;
      case 'dash':
        this.playTone(720, 110, 'sawtooth', 0.03);
        this.playTone(420, 120, 'triangle', 0.02);
        break;
      case 'checkpoint':
        this.playTone(440, 120, 'triangle', 0.03);
        this.playTone(660, 150, 'triangle', 0.025);
        break;
      case 'collect':
        this.playTone(700, 90, 'sine', 0.03);
        this.playTone(880, 120, 'sine', 0.025);
        break;
      case 'heal':
        this.playTone(640, 130, 'sine', 0.03);
        this.playTone(820, 160, 'triangle', 0.024);
        break;
      case 'hurt':
        this.playTone(150, 180, 'sawtooth', 0.035);
        break;
      case 'stomp':
        this.playTone(260, 90, 'square', 0.03);
        break;
      case 'shoot':
        this.playTone(540, 70, 'square', 0.03);
        break;
      case 'shoot-hit':
        this.playTone(420, 80, 'triangle', 0.028);
        break;
      case 'turret-fire':
        this.playTone(340, 100, 'square', 0.03);
        break;
      case 'exit':
        this.playTone(523.25, 140, 'triangle', 0.03);
        this.playTone(783.99, 180, 'triangle', 0.025);
        break;
      case 'unlock':
        this.playTone(523.25, 120, 'sine', 0.03);
        this.playTone(659.25, 140, 'sine', 0.025);
        this.playTone(783.99, 180, 'sine', 0.022);
        break;
      case 'power':
        this.playTone(493.88, 120, 'triangle', 0.03);
        this.playTone(659.25, 140, 'sine', 0.025);
        break;
      case 'block':
        this.playTone(310, 90, 'square', 0.02);
        break;
      case 'collapse':
        this.playTone(210, 120, 'sawtooth', 0.025);
        break;
      case 'spring':
        this.playTone(610, 80, 'square', 0.03);
        break;
      case 'bounce-pod':
        this.playTone(700, 95, 'triangle', 0.032);
        this.playTone(940, 120, 'square', 0.024);
        break;
      case 'gas-vent':
        this.playTone(380, 120, 'sine', 0.026);
        this.playTone(520, 150, 'triangle', 0.02);
        break;
      default:
        break;
    }
  }

  private playTone(frequency: number, durationMs: number, type: OscillatorType, volume: number): void {
    try {
      const context = this.getContext();
      if (!context) {
        return;
      }
      const masterVolume = clamp(this.getMasterVolume(), 0, 1);
      if (masterVolume <= 0) {
        return;
      }

      const startAt = context.currentTime;
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
}
