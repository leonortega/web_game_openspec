import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('HUD message lane layout contract', () => {
  it('anchors transient gameplay messages in a lower-left safe area with mobile-safe insets', () => {
    const appCss = readFileSync(new URL('./app.css', import.meta.url), 'utf8');

    expect(appCss).toMatch(/\.message-panel\s*\{[\s\S]*left:\s*clamp\(8px,\s*1\.8vw,\s*14px\)/);
    expect(appCss).toMatch(/\.message-panel\s*\{[\s\S]*bottom:\s*max\(calc\(env\(safe-area-inset-bottom,\s*0px\)\s*\+\s*14px\),\s*clamp\(14px,\s*3\.2vh,\s*26px\)\)/);
    expect(appCss).toMatch(/\.message-panel\s*\{[\s\S]*max-width:\s*min\(340px,\s*calc\(100%\s*-\s*188px\)\)/);
    expect(appCss).toMatch(/\.message-panel\s*\{[\s\S]*white-space:\s*normal/);
    expect(appCss).not.toMatch(/\.message-panel\s*\{[\s\S]*top:/);
    expect(appCss).not.toMatch(/\.message-panel\s*\{[\s\S]*bottom:\s*clamp\(54px,\s*10vh,\s*92px\)/);
    expect(appCss).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.hud-meta\s*\{[\s\S]*bottom:\s*76px/);
    expect(appCss).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.hud-meta-line\s*\{[\s\S]*flex-direction:\s*column/);
    expect(appCss).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.message-panel\s*\{[\s\S]*left:\s*8px/);
    expect(appCss).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.message-panel\s*\{[\s\S]*bottom:\s*max\(calc\(env\(safe-area-inset-bottom,\s*0px\)\s*\+\s*12px\),\s*12px\)/);
    expect(appCss).toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.message-panel\s*\{[\s\S]*max-width:\s*min\(184px,\s*calc\(100%\s*-\s*136px\)\)/);
  });

  it('keeps the browser shell viewport-bounded while allowing a larger desktop presentation', () => {
    const appCss = readFileSync(new URL('./app.css', import.meta.url), 'utf8');

    expect(appCss).toMatch(/:root\s*\{[\s\S]*--app-shell-gap:\s*clamp\(12px,\s*2\.4vw,\s*32px\)/);
    expect(appCss).toMatch(/:root\s*\{[\s\S]*--game-shell-max-width:\s*1480px/);
    expect(appCss).toMatch(/#app\s*\{[\s\S]*min-height:\s*100vh/);
    expect(appCss).toMatch(/\.game-shell-frame\s*\{[\s\S]*width:\s*min\([\s\S]*calc\(100vw\s*-\s*\(var\(--app-shell-gap\)\s*\*\s*2\)\)/);
    expect(appCss).toMatch(/\.game-shell-frame\s*\{[\s\S]*calc\(\(100vh\s*-\s*\(var\(--app-shell-gap\)\s*\*\s*2\)\)\s*\*\s*16\s*\/\s*9\)/);
    expect(appCss).toMatch(/\.game-shell-frame\s*\{[\s\S]*var\(--game-shell-max-width\)/);
    expect(appCss).toMatch(/\.game-shell-frame\s*\{[\s\S]*aspect-ratio:\s*16\s*\/\s*9/);
    expect(appCss).toMatch(/\.game-shell\s*\{[\s\S]*width:\s*100%/);
    expect(appCss).toMatch(/\.game-shell\s*\{[\s\S]*height:\s*100%/);
    expect(appCss).not.toMatch(/\.game-shell\s*\{[\s\S]*width:\s*min\(100%,\s*1080px\)/);
    expect(appCss).not.toMatch(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.game-shell\s*\{[\s\S]*min-height:\s*88vh/);
  });
});