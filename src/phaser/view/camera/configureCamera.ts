import * as Phaser from 'phaser';

export const configureCamera = (
  camera: Phaser.Cameras.Scene2D.Camera,
  worldWidth: number,
  worldHeight: number,
): void => {
  camera.setBounds(0, 0, worldWidth, worldHeight);
  camera.setBackgroundColor('#091310');
  camera.roundPixels = true;
};
