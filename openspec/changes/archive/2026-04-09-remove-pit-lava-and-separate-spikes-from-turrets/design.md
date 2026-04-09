## Context

`pit` and `lava` are not separate gameplay systems; they are hazard kinds used to represent different visual treatments and collision outcomes. The current implementation also allows spikes and turrets to sit on the same support surface, which creates cluttered encounters and makes authored stages harder to read.

## Goals / Non-Goals

**Goals:**
- Remove `pit` as an authored hazard kind and runtime rendering path.
- Replace `lava` authored hazards with `spikes` in stage content.
- Keep spikes and turrets separated on supported terrain so encounters remain readable.

**Non-Goals:**
- Changing player death rules for falling out of bounds.
- Rebalancing enemy behavior or adding new enemy archetypes.
- Building a general-purpose placement editor or pathfinding system.

## Decisions

- Remove `pit` from the hazard model instead of keeping it as a hidden alias.
  - Rationale: the black kill block is not adding a distinct gameplay concept once out-of-bounds death already exists.
  - Alternative considered: keep `pit` as a visual marker only. Rejected because it preserves duplicate semantics.

- Convert `lava` authored hazards into `spikes`.
  - Rationale: the game already has spikes as the readable damaging hazard and the user requested a single hazard vocabulary.
  - Alternative considered: keep lava and re-theme it. Rejected because it adds another hazard concept with no gameplay gain.

- Enforce turret/spike separation by moving authored placements, and keep a deterministic runtime check to preserve that rule for future stages.
  - Rationale: authored stages need to stay readable, but future content also needs guardrails.
  - Alternative considered: rely on manual content review only. Rejected because it does not prevent regressions.

## Risks / Trade-Offs

- [Risk] Removing `pit` may make some stages look less explicit about fall danger.
  - Mitigation: keep out-of-bounds death behavior and use platform layout to communicate risk.

- [Risk] Replacing lava with spikes may reduce visual variety.
  - Mitigation: keep spike placement intentional and use terrain shape to differentiate encounters.

- [Risk] Turret repositioning may shift encounter pacing slightly.
  - Mitigation: keep changes local and verify the affected stages after editing placements.

## Migration Plan

1. Remove `pit` from the hazard model and rendering path.
2. Replace all authored `lava` hazards with `spikes`.
3. Move spikes or turrets in the affected stages so they no longer share the same support surface.
4. Run validation and playtests to confirm the updated hazard layout remains readable.

## Open Questions

- None. The requested behavior is specific enough to implement directly.
