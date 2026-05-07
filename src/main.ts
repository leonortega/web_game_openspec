import './styles/app.css';
import * as Phaser from 'phaser';

const phaserGlobal = globalThis as typeof globalThis & { Phaser?: typeof Phaser };
phaserGlobal.Phaser = Phaser;

const loadScript = async (src: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
};

await loadScript('/vendor/rex/rexlocalforagefilesplugin.min.js');
await loadScript('/vendor/rex/rexcrtfilterplugin.min.js');
await loadScript('/vendor/rex/rextagtextplugin.min.js');
await loadScript('/vendor/rex/rextextplayerplugin.min.js');
await loadScript('/vendor/rex/rexscaleouterplugin.min.js');
await loadScript('/vendor/rex/rexuiplugin.min.js');

const { createGameApp } = await import('./phaser/createGameApp');

createGameApp(document.getElementById('app'));
