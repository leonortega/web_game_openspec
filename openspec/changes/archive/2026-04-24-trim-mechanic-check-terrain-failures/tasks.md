## 1. Terrain Probe Alignment

- [x] 1.1 Update broad-helper terrain probe setup in `scripts/stage-playtest.mjs` to seed brittle and sticky platforms through platform-owned `surfaceMechanic.kind`
- [x] 1.2 Remove deprecated `terrainVariant` mutations and other stale helper assumptions that still act as terrain source of truth inside `Mechanic Checks`

## 2. Terrain Assertion And Note Cleanup

- [x] 2.1 Replace stale terrain extent and cue checks with assertions derived from current live-scene debug snapshot signals and authored platform extents
- [x] 2.2 Update `Mechanic Checks` terrain notes so terrain-specific pass or fail messaging reflects the new helper signals instead of stale broad-bundle noise

## 3. Focused Validation

- [x] 3.1 Run targeted automated coverage for broad-helper terrain checks and adjacent runtime tests that already seed `surfaceMechanic.kind`
- [x] 3.2 Confirm terrain-related `Mechanic Checks` notes clear when helper setup matches current surface-mechanic truth and still fail explicitly for genuine terrain drift