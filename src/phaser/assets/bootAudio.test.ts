import type * as Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

import { getAllActiveSustainedMusic } from '../../audio/musicAssets';
import { getAllMappedSfxAssets } from '../../audio/sfxAssets';
import { registerBootAudio } from './bootAudio';

describe('registerBootAudio', () => {
  it('preloads every active music and mapped SFX asset from stable app paths', () => {
    const audio = vi.fn();
    const scene = {
      load: {
        audio,
      },
    } as unknown as Phaser.Scene;

    registerBootAudio(scene);

    const expectedMusic = getAllActiveSustainedMusic().map((entry) => [entry.assetKey, entry.localAssetPath]);
    const expectedSfx = getAllMappedSfxAssets().map((entry) => [entry.assetKey, entry.localAssetPath]);
    const calls = audio.mock.calls;

    expect(calls).toEqual([...expectedMusic, ...expectedSfx]);
    expect(calls).toHaveLength(expectedMusic.length + expectedSfx.length);
    expect(calls.every(([, path]) => typeof path === 'string' && path.startsWith('/audio/'))).toBe(true);
    expect(calls.every(([, path]) => !String(path).includes('source-packs'))).toBe(true);
  });
});
