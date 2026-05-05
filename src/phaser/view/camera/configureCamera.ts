import * as Phaser from 'phaser';

export const configureCamera = (
  camera: Phaser.Cameras.Scene2D.Camera,
  worldWidth: number,
  worldHeight: number,
  backgroundColor = '#091310',
): void => {
  camera.setBounds(0, 0, worldWidth, worldHeight);
  camera.setBackgroundColor(backgroundColor);
  camera.roundPixels = true;
};
