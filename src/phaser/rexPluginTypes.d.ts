import 'phaser';

declare module 'phaser' {
  interface Scene {
    rexUI: any;
    rexScaleOuter: any;
  }
}
