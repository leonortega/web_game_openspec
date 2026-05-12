## Context

The game currently persists a run-level `SessionProgress` payload through the Rex localforage files plugin and hydrates that payload during `BootScene` before entering the menu. That payload includes unlocked stage progression, total collected samples, active powers, invincibility timer state, and run settings. The same codebase also exposes a shipped menu options surface with difficulty, enemy pressure, music volume, SFX volume, and a CRT toggle, but the current OpenSpec set still describes an older master-volume-centric contract and does not describe boot hydration or persistence boundaries.

## Goals / Non-Goals

**Goals:**
- Document the already-shipped persisted progress contract at the spec level.
- Document the actual current menu options surface at the spec level.
- Clarify the boundary between persisted run-level state and reset-on-start stage-local attempt state.

**Non-Goals:**
- Changing runtime persistence behavior or storage schema.
- Introducing a new save-slot system, manual save UI, or mid-stage resume feature.
- Correcting unrelated pre-existing spec or implementation drift outside menu options and persistence.

## Decisions

### Document run-level persistence as a dedicated capability
The persistence behavior crosses boot flow, scene bridge, storage, simulation progress, and menu settings. Treating it as its own capability keeps the storage and hydration contract explicit instead of hiding it inside stage or menu specs.

Alternative considered:
- Fold persistence into `player-progression` or `main-menu`.
Why not:
- That would bury a cross-cutting runtime contract inside narrower user-surface specs and make reset boundaries harder to reason about.

### Modify `main-menu` only where the options contract changed
The rest of the menu requirement still matches shipped behavior well enough. The needed delta is the options payload itself: separate music and SFX volume, plus CRT on or off, rather than the older master-volume-only wording.

Alternative considered:
- Create a new settings capability instead of changing `main-menu`.
Why not:
- The options surface is already owned by the main menu capability, so splitting it would create unnecessary overlap.

### Specify reset boundaries explicitly
The implementation persists only run-level progress. It does not persist a live stage snapshot, checkpoint position, temporary route state, or collectible state within an attempt. The new spec should say that clearly so future work does not accidentally reinterpret the current code as a resume system.

Alternative considered:
- Describe only the stored fields and omit reset semantics.
Why not:
- The most important behavioral boundary is what does not come back after reload.

## Risks / Trade-offs

- [Risk] Existing broader spec drift remains outside this focused change. → Mitigation: keep this change scoped to the concrete persistence and menu-options gaps verified in code.
- [Risk] The implementation contains a compatibility-oriented `masterVolume` field that is not meaningfully exposed in the shipped UI. → Mitigation: specify the user-visible options contract and persisted run settings behavior without treating the dormant field as a required surface feature.
- [Risk] Future save-schema work may evolve the payload shape. → Mitigation: document versioned payload acceptance and invalid-payload fallback so later changes have a clear baseline to modify.
