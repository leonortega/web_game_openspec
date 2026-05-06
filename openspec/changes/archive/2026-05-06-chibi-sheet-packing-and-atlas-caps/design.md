# Design: Exact Row Packing and Atlas Caps

## Context
Chibi budget ranges now exist, but production still needs exact sheet geometry and memory boundaries. Without hard row maps and cap limits, teams can satisfy frame ranges while still shipping inconsistent layouts or oversized atlases.

## Decisions

### 1. Deterministic row packing contract
Define row indices, clip assignments, and exact frame slots per row for:
- Player sheet (`player-sheet`) using 32x48 frames.
- Enemy class sheets using current runtime envelopes.

The contract includes reserved columns for variant swaps and future inserts so art can evolve without repacking the whole sheet.

### 2. Atlas memory cap contract
Define hard caps in MiB for:
- Actor atlas group (player + enemy sheets).
- World atlas group.
- Props/UI atlas group.
- Global pixel-art atlas budget.

### 3. Validation rule
Any production sheet or atlas that exceeds row slot limits or memory caps is a contract violation and must be revised before integration.

## Main File Updates
- `openspec/specs/retro-presentation-style/spec.md`
- `art.md`

## Verification
- Requirement text explicitly names row-packing and memory-cap compliance.
- `art.md` includes exact row maps and cap tables.
- Change archived with all tasks completed.
