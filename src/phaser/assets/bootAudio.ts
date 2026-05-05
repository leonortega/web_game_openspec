import type Phaser from 'phaser';

import { getAllActiveSustainedMusic } from '../../audio/musicAssets';
import { getAllMappedSfxAssets } from '../../audio/sfxAssets';

export const registerBootAudio = (scene: Phaser.Scene): void => {
  for (const track of getAllActiveSustainedMusic()) {
    scene.load.audio(track.assetKey, track.localAssetPath);
  }

  for (const cue of getAllMappedSfxAssets()) {
    scene.load.audio(cue.assetKey, cue.localAssetPath);
  }
};
