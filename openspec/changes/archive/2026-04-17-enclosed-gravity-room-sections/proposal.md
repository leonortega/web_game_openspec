## Why

Current gravity capsule sections assume one nearby button, one door-adjacent route, and a dormant field that turns on after first contact. Requested enclosed gravity rooms need different contract: field starts active, interior button turns it off, room uses separate bottom entry and bottom exit openings, and authored validation must prove room-contained content and reachable routing instead of allowing cut-off or cropped sections.

## What Changes

- Replace one-door dormant gravity capsule semantics with enclosed gravity room semantics that start with gravity active and let one interior button disable the room field.
- Require every enclosed gravity room to support separate bottom entry and bottom exit door openings inside one readable room shell.
- Extend authoring and validation rules so linked field bounds, platforms, enemies, hazards, pickups, and other room content stay fully contained inside the room shell and the intended route inside the room stays reachable and not cut off.
- Preserve existing controller guardrails so room gravity still affects only player airborne vertical acceleration and never changes grounded orientation, jump impulse definitions, or non-player gravity.
- Update room presentation requirements so active versus disabled room states, entry versus exit door cues, and interior button cues remain readable and distinct from stage-completion exits.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `platform-variation`: gravity capsule requirements change from dormant one-button activation to active enclosed room sections with interior disable semantics, dual bottom doors, and stronger containment rules.
- `player-controller`: controller gravity-room behavior changes to treat enclosed room gravity as active until the linked interior button disables it, while preserving existing movement semantics.
- `stage-progression`: authored validation and retry-state rules change to require reachable interior disable routing, separate bottom entry and exit openings, and full room containment for all authored room content.
- `retro-presentation-style`: traversal gravity-room presentation changes to show active versus disabled room state, separate door roles, and clear distinction from stage exits.

## Impact

- `src/game/content/stages.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/GameScene.ts`
- traversal visual coverage and authored validation tests
- stage playtest scripts that exercise gravity room entry, disable flow, and contained routing