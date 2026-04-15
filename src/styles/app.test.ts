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
});