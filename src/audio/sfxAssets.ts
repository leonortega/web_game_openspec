import { AUDIO_CUES, type AudioCue } from './audioContract';

type SfxLicense = 'CC0';

export type SfxAssetManifestEntry = {
  cue: AudioCue;
  assetKey: string;
  family: string;
  signature: string;
  creator: string;
  license: SfxLicense;
  sourcePack: string;
  sourceUrl: string;
  originalFileName: string;
  originalSourcePackRelativePath: string;
  localAssetPath: string;
  webFormat: 'wav';
  intendedMapping: string;
  volume: number;
};

const sourcePack = 'The Essential Retro Video Game Sound Effects Collection [512 sounds] By Juhani Junkala';
const sourceUrl = 'https://opengameart.org/content/512-sound-effects-8-bit-style';
const localPath = (fileName: string): string => `/audio/sfx/juhani-junkala-512/${fileName}`;
const sourceFileName = (sourceRelativePath: string): string => {
  const parts = sourceRelativePath.split('\\');
  return parts[parts.length - 1] ?? sourceRelativePath;
};

const defineSfx = (
  cue: AudioCue,
  family: string,
  signature: string,
  sourceRelativePath: string,
  fileName: string,
  volume = 0.5,
): SfxAssetManifestEntry => ({
  cue,
  assetKey: `sfx-${cue}`,
  family,
  signature,
  creator: 'Juhani Junkala',
  license: 'CC0',
  sourcePack,
  sourceUrl,
  originalFileName: sourceFileName(sourceRelativePath),
  originalSourcePackRelativePath: sourceRelativePath,
  localAssetPath: localPath(fileName),
  webFormat: 'wav',
  intendedMapping: cue,
  volume,
});

export const SFX_ASSET_MANIFEST: SfxAssetManifestEntry[] = [
  defineSfx(AUDIO_CUES.jump, 'player-action', 'short jump', 'Movement\\Jumping and Landing\\sfx_movement_jump1.wav', 'jump.wav', 0.42),
  defineSfx(AUDIO_CUES.doubleJump, 'player-action', 'short double jump', 'Movement\\Jumping and Landing\\sfx_movement_jump2.wav', 'double-jump.wav', 0.42),
  defineSfx(AUDIO_CUES.land, 'player-action', 'short landing', 'Movement\\Jumping and Landing\\sfx_movement_jump1_landing.wav', 'land.wav', 0.45),
  defineSfx(AUDIO_CUES.dash, 'player-action', 'short dash', 'General Sounds\\Impacts\\sfx_sounds_impact2.wav', 'dash.wav', 0.36),
  defineSfx(AUDIO_CUES.checkpoint, 'progress', 'short checkpoint', 'General Sounds\\Positive Sounds\\sfx_sounds_powerup3.wav', 'checkpoint.wav', 0.45),
  defineSfx(AUDIO_CUES.collect, 'reward', 'short collect', 'General Sounds\\Coins\\sfx_coin_single1.wav', 'collect.wav', 0.42),
  defineSfx(AUDIO_CUES.rewardReveal, 'reward', 'short reward reveal', 'General Sounds\\Positive Sounds\\sfx_sounds_powerup5.wav', 'reward-reveal.wav', 0.4),
  defineSfx(AUDIO_CUES.heal, 'reward', 'short heal', 'General Sounds\\Positive Sounds\\sfx_sounds_powerup7.wav', 'heal.wav', 0.38),
  defineSfx(AUDIO_CUES.danger, 'danger', 'short danger', 'General Sounds\\Alarms\\Alarms\\sfx_alarm1.wav', 'danger.wav', 0.28),
  defineSfx(AUDIO_CUES.hurt, 'danger', 'short hurt', 'General Sounds\\Simple Damage Sounds\\sfx_damage_hit2.wav', 'hurt.wav', 0.48),
  defineSfx(AUDIO_CUES.death, 'death', 'short death', 'General Sounds\\Simple Damage Sounds\\sfx_damage_hit7.wav', 'death.wav', 0.5),
  defineSfx(AUDIO_CUES.stomp, 'combat', 'short stomp', 'General Sounds\\Impacts\\sfx_sounds_impact1.wav', 'stomp.wav', 0.45),
  defineSfx(AUDIO_CUES.thrusterPulse, 'combat', 'short crunch', 'General Sounds\\Impacts\\sfx_sounds_impact1.wav', 'block.wav', 0.34),
  defineSfx(AUDIO_CUES.thrusterImpact, 'combat', 'short thruster impact', 'General Sounds\\Impacts\\sfx_sounds_impact4.wav', 'thruster-impact.wav', 0.42),
  defineSfx(AUDIO_CUES.shoot, 'combat', 'short shoot', 'Weapons\\Lasers\\sfx_laser1.wav', 'shoot.wav', 0.38),
  defineSfx(AUDIO_CUES.shootHit, 'combat', 'short shoot hit', 'General Sounds\\Impacts\\sfx_sounds_impact5.wav', 'shoot-hit.wav', 0.4),
  defineSfx(AUDIO_CUES.turretFire, 'danger', 'short turret fire', 'Weapons\\Single Shot Sounds\\sfx_shot_single1.wav', 'turret-fire.wav', 0.4),
  defineSfx(AUDIO_CUES.enemyPatrol, 'danger', 'short enemy patrol', 'Movement\\Footsteps\\sfx_footstep1.wav', 'enemy-patrol.wav', 0.24),
  defineSfx(AUDIO_CUES.enemyHop, 'danger', 'short enemy hop', 'Movement\\Jumping and Landing\\sfx_movement_jump2.wav', 'enemy-hop.wav', 0.32),
  defineSfx(AUDIO_CUES.enemyCharge, 'danger', 'short enemy charge', 'General Sounds\\Impacts\\sfx_sounds_impact3.wav', 'stomp.wav', 0.34),
  defineSfx(AUDIO_CUES.chargerWindup as any, 'danger', 'short charger windup', 'General Sounds\\Impacts\\sfx_sounds_impact1.wav', 'block.wav', 0.32),
  defineSfx(AUDIO_CUES.exit, 'completion', 'short exit', 'General Sounds\\Positive Sounds\\sfx_sounds_powerup9.wav', 'exit.wav', 0.38),
  defineSfx(AUDIO_CUES.capsuleTeleport, 'completion', 'short capsule teleport', 'Movement\\Portals and Transitions\\sfx_portal1.wav', 'capsule-teleport.wav', 0.44),
  defineSfx(AUDIO_CUES.stageClear, 'completion', 'short stage clear', 'General Sounds\\Fanfares\\sfx_fanfare1.wav', 'stage-clear.wav', 0.5),
  defineSfx(AUDIO_CUES.finalCongrats, 'completion', 'short final congrats', 'General Sounds\\Fanfares\\sfx_fanfare2.wav', 'final-congrats.wav', 0.5),
  defineSfx(AUDIO_CUES.unlock, 'progress', 'short unlock', 'General Sounds\\Positive Sounds\\sfx_sounds_powerup11.wav', 'unlock.wav', 0.38),
  defineSfx(AUDIO_CUES.power, 'power', 'short power', 'General Sounds\\Positive Sounds\\sfx_sounds_powerup13.wav', 'power.wav', 0.46),
  defineSfx(AUDIO_CUES.block, 'interactive', 'short block', 'General Sounds\\Impacts\\sfx_sounds_impact6.wav', 'block.wav', 0.36),
  defineSfx(AUDIO_CUES.collapse, 'interactive', 'short collapse', 'Explosions\\Short\\sfx_explosion_short1.wav', 'collapse.wav', 0.38),
  defineSfx(AUDIO_CUES.spring, 'interactive', 'short spring', 'General Sounds\\Positive Sounds\\sfx_sounds_powerup8.wav', 'spring.wav', 0.4),
  defineSfx(AUDIO_CUES.movingPlatform, 'interactive', 'short moving platform', 'Movement\\Vehicles\\sfx_vehicle1.wav', 'moving-platform.wav', 0.18),
  defineSfx(AUDIO_CUES.menuNavigate, 'menu-ui', 'short menu navigate', 'General Sounds\\Menu Sounds\\sfx_menu_move1.wav', 'menu-navigate.wav', 0.34),
  defineSfx(AUDIO_CUES.menuConfirm, 'menu-ui', 'short menu confirm', 'General Sounds\\Menu Sounds\\sfx_menu_select1.wav', 'menu-confirm.wav', 0.38),
  defineSfx(AUDIO_CUES.menuBack, 'menu-ui', 'short menu back', 'General Sounds\\Negative Sounds\\sfx_sounds_negative1.wav', 'menu-back.wav', 0.34),
];

export const SFX_ASSET_MANIFEST_BY_CUE = Object.fromEntries(
  SFX_ASSET_MANIFEST.map((entry) => [entry.cue, entry]),
) as Record<AudioCue, SfxAssetManifestEntry>;

export const getAllMappedSfxAssets = (): SfxAssetManifestEntry[] => SFX_ASSET_MANIFEST;

export const getSfxAsset = (cue: AudioCue): SfxAssetManifestEntry | undefined => SFX_ASSET_MANIFEST_BY_CUE[cue];
