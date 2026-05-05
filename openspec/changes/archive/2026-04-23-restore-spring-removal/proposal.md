## Why

Current branch still carries spring authoring and spring runtime paths even though live OpenSpec requirements already moved launcher family to bounce pods and gas vents only. That drift keeps deprecated spring category in stage data, validation, simulation, rendering, audio, and coverage, and it risks a visual-only reskin that leaves hidden launch behavior under plain green support.

## What Changes

- Remove spring mechanic and spring category from implementation-facing stage types, builders, validation, runtime state, renderer branches, audio hooks, and regression fixtures.
- Replace each current spring-authored route beat with plain green support plus explicit bounce-pod launcher composition that preserves readable footing, route timing, and intended launch behavior.
- Keep bounce-pod and gas-vent families as only supported launcher family in this traversal space.
- Align tests and scripted playtests with existing launcher-only spec contract and reject any lingering spring authoring.

## Capabilities

### Modified Capabilities

- `platform-variation`: springs remain removed from supported traversal variants; converted beats must read as support plus bounce pod rather than hidden launch behavior.
- `player-controller`: launcher composition rules continue in terms of bounce pods and gas vents only, with no lingering spring-only launch semantics.
- `stage-progression`: authored validation and regression coverage continue rejecting spring metadata and require launcher-only fixtures and readable converted support.
- `audio-feedback`: traversal and interactive-object audio continues to cover bounce pods and gas vents without spring-specific branches.

## Spec Position

No new capability delta needed. Current source-of-truth specs already describe desired outcome in:

- `openspec/specs/platform-variation/spec.md`
- `openspec/specs/player-controller/spec.md`
- `openspec/specs/stage-progression/spec.md`
- `openspec/specs/audio-feedback/spec.md`

This change exists to bring current branch implementation back into alignment with those already-updated specs and with archived change intent from `2026-04-23-replace-springs-with-bounce-pods`.

## Impact

- Affects stage catalog and any stage-authoring helpers that still accept spring data.
- Affects runtime launcher/session state, traversal resolution, presentation, and synthesized traversal audio where spring still branches.
- Affects automated tests, playtest scripts, and analysis outputs that still expect spring behavior.