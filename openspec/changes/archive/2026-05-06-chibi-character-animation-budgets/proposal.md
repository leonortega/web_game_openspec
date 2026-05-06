# Proposal: Chibi Character Animation Budgets for 16-bit Pixel Art

## Summary
Review and tighten the 16-bit pixel-art character direction by formalizing a chibi proportion contract for the player and enemy cast, plus explicit frame and canvas budgets per state. The goal is to unlock richer character detail and clearer animation readability while staying inside practical sprite-sheet limits.

## Why
Current art contracts describe movement clips and key names, but they do not yet enforce a consistent chibi proportion language or hard frame budgets across player and enemies. Without those limits, visual detail can drift between actors and animation scope can grow beyond feasible apply slices.

## Goals
1. Define a shared chibi character contract (head/body ratio, silhouette readability, and per-actor size envelopes) for gameplay-facing sprites.
2. Define explicit animation frame budgets that allow richer motion without over-scoping atlas memory or runtime complexity.
3. Keep gameplay behavior unchanged: no collision, timing, or mechanic changes.
4. Keep the source of truth centralized in `art.md` and aligned with OpenSpec requirements.

## In Scope
- Spec updates for retro presentation direction, player power variants, and enemy hazard presentation.
- `art.md` updates with a concrete chibi size matrix and frame-budget table for player and enemy clips.
- Consistency pass to ensure requirements reference the same budget language.

## Out of Scope
- Drawing or importing final production sprite sheets.
- Rewriting player/enemy simulation constants.
- New enemy mechanics, attack cadence changes, or hitbox redesign.

## Success Criteria
- [ ] A shared chibi presentation contract exists in OpenSpec requirements.
- [ ] Player and enemy frame budgets are explicit, bounded, and aligned with `art.md`.
- [ ] Contracts explicitly preserve existing collision/timing behavior.
- [ ] Change is archive-ready with no unchecked tasks.
