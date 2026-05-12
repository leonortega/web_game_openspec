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

const ensureRetroFontLoaded = async (): Promise<void> => {
  if (!('fonts' in document)) {
    return;
  }

  const fonts = document.fonts;
  const fontSpec = '16px "Press Start 2P"';
  const waitForFont = Promise.allSettled([
    fonts.load(fontSpec),
    fonts.ready,
  ]);
  const timeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, 2500);
  });

  await Promise.race([waitForFont, timeout]);
};

await ensureRetroFontLoaded();
await loadScript('/vendor/rex/rexlocalforagefilesplugin.min.js');
await loadScript('/vendor/rex/rexcrtfilterplugin.min.js');
await loadScript('/vendor/rex/rextagtextplugin.min.js');
await loadScript('/vendor/rex/rextextplayerplugin.min.js');
await loadScript('/vendor/rex/rexscaleouterplugin.min.js');
await loadScript('/vendor/rex/rexuiplugin.min.js');

const { createGameApp } = await import('./phaser/createGameApp');

createGameApp(document.getElementById('app'));
