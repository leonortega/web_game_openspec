import type Phaser from 'phaser';

import { getAllActiveSustainedMusic } from '../../audio/musicAssets';

export const registerBootAudio = (scene: Phaser.Scene): void => {
  for (const track of getAllActiveSustainedMusic()) {
    scene.load.audio(track.assetKey, track.localAssetPath);
  }
};