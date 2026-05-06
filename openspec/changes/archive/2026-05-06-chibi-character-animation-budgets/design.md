# Design: Chibi 16-bit Character Contract

## Context
The project already targets denser 8-bit/16-bit-like presentation and sprite-sheet animation migration. The remaining gap is a shared character language: how detailed characters may become and how many frames each movement state may consume before scope or readability regresses.

## Design Decisions

### 1. Chibi proportion baseline
Use a gameplay-scale chibi baseline that keeps a readable oversized head with short torso/limbs while preserving current collision semantics.
- Player frame envelope remains 32x48.
- Enemy envelopes remain within existing key budgets (walker/hopper/turret/charger/flyer current canvases).
- Head-to-body read target for character sprites: approximately 1:1 to 1:1.4 (head block to remaining body mass), tuned per actor silhouette.

### 2. Detail budget instead of unrestricted complexity
Allow richer internal pixel detail (visor segmentation, limb separation, suit accents, enemy face/plate cues) but require:
- Strong silhouette at 1x scale.
- Maximum 3 accent clusters per actor state to avoid noisy readability.
- Palette-bounded highlights and shadows consistent with retro constraints.

### 3. Frame-budget contract
Define min/max frame counts by state to encourage expressive animation without atlas bloat.
- Player locomotion and action clips get bounded ranges (for example run 6-10, dash 3-5, defeat 5-8).
- Enemy core loops and telegraphs get bounded ranges per class.
- Transitional clips remain short and event-driven.

### 4. Behavior-safety guardrail
All sprite/detail/frame improvements are presentation-only.
- No movement constant changes.
- No collision body expansion.
- No threat cadence changes.

## Files Affected
- `openspec/specs/retro-presentation-style/spec.md`
- `openspec/specs/player-power-visual-variants/spec.md`
- `openspec/specs/enemy-hazard-system/spec.md`
- `art.md`

## Verification
- Requirement language aligns across the three specs.
- `art.md` contains concrete size and frame-budget tables for player and enemies.
- Tasks complete and change folder archived.
