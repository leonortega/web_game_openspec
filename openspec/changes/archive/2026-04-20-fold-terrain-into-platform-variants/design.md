## Context

The current terrain model treats brittle crystal and sticky sludge as separate rectangular overlays attached to static platforms. That split leaks into authoring, validation, runtime, and rendering: stage data carries two different representations for one piece of traversal footing, renderer and simulation must agree on separate overlay extents, and tests need to reason about a platform plus an attached modifier rectangle. Explore already concluded that this is broader than needed and that the right modeling choice is to fold brittle and sticky into the platform itself.

This proposal therefore converts brittle and sticky from partial overlay rectangles into bounded full-platform variants. The implementation still needs to preserve the important behavior split between the two variants: brittle remains a one-shot delayed-collapse support rule, while sticky remains a grounded drag rule only. Jump-specific terrain behavior is removed because the game already has explicit launch and jump mechanics elsewhere and sticky jump coupling adds unnecessary controller branching.

## Goals / Non-Goals

**Goals:**
- Replace authored brittle and sticky `terrainSurfaces` overlays with full-platform variant metadata.
- Keep brittle and sticky bounded to full static-platform footprints unless a future change explicitly justifies broader support.
- Preserve brittle warning, fair support expiry, break, and reset semantics after the model migration.
- Remove sticky-driven jump impulse or coyote-jump modifiers while keeping sticky grounded acceleration and grounded speed penalties.
- Require coordinated migration across validation, runtime ingestion, rendering, authored stage data, unit tests, and scripted playtests.

**Non-Goals:**
- Introduce a generalized material system, composable terrain physics stack, or freeform per-rectangle traversal modifiers.
- Broaden brittle or sticky to moving platforms, lift platforms, launchers, falling platforms, or other dynamic platform families in this change.
- Redesign jump, launcher, dash, or gravity-field mechanics beyond removing sticky jump coupling.
- Rewrite main specs outside this change folder during propose stage.

## Decisions

- Represent brittle and sticky as platform-level variants, not separate overlay records.
  - Resulting rule: authored stage data expresses terrain identity on the platform itself, and the variant applies to the full supported platform footprint.
  - Rationale: one platform model is easier to validate, render, migrate, and test than a platform-plus-overlay pair.
  - Alternative considered: keep overlays but force them to match full platform extents. Rejected because it preserves duplicate modeling and sync risk without meaningful flexibility.

- Keep brittle and sticky static-only for now.
  - Resulting rule: brittle and sticky variants are valid only on authored static platforms unless another change later expands support with explicit semantics and tests.
  - Rationale: brittle collapse and sticky drag already have enough migration surface. Mixing them with moving, unstable, lift, or launcher platforms would multiply controller and rendering edge cases.
  - Alternative considered: allow variants on any platform kind during migration. Rejected because semantics become underspecified for falling support, moving carriers, and launcher contacts.

- Preserve brittle as a full-platform delayed-collapse variant.
  - Resulting rule: first eligible top-surface contact arms the brittle platform, warning stays readable across the whole platform, and breakage removes support from the full platform footprint. If expiry happens while support contact remains, support persists only until that contact ends, then the platform breaks immediately.
  - Rationale: this keeps existing brittle gameplay identity while aligning the runtime state to the full platform footprint instead of a nested overlay rectangle.
  - Alternative considered: break only a contacted subsection. Rejected because it recreates the overlay concept under a different name.

- Remove sticky jump coupling entirely.
  - Resulting rule: sticky affects grounded acceleration and grounded maximum horizontal speed only. Grounded jumps, coyote jumps, buffered jumps, springs, launchers, dash, and gravity-field composition keep their existing jump or impulse rules.
  - Rationale: sticky still changes footing feel without competing with the game's existing launch and jump mechanics.
  - Alternative considered: keep reduced jump impulse for backward compatibility. Rejected because explore explicitly called out that jump-related terrain behavior should be dropped.

- Migrate validation by rejecting legacy overlay authoring and enforcing full-platform variant integrity.
  - Resulting rule: validation must reject separate brittle or sticky overlay records, require supported platform variants, ensure the variant covers a valid static platform footprint, and prevent contradictory mixed authoring for the same platform.
  - Rationale: migration should fail fast instead of silently supporting both models.
  - Alternative considered: temporarily support both overlay and variant forms. Rejected because it prolongs ambiguity and increases blast radius.

- Treat rendering and runtime as consumers of one shared platform-variant source of truth.
  - Resulting rule: bootstrap, simulation, and platform rendering ingest the same platform variant metadata; brittle runtime state keys to platform identity; sticky visuals cover the same footprint that grounded drag uses.
  - Rationale: this reduces extent drift between gameplay and presentation.

- Require authored-data and verification migration as part of apply, not later cleanup.
  - Resulting rule: apply must update staged content, tests, and scripted playtests in the same change so no legacy brittle/sticky overlay authoring remains in supported content.
  - Rationale: partial migration would leave validator exceptions or dead code paths behind.

## Risks / Trade-offs

- [Risk] Removing sticky jump coupling may slightly change feel in legacy sludge sections. -> Mitigation: make the change explicit in specs and update affected tests and playtests to assert the new controller contract.
- [Risk] Legacy authored content may still depend on `terrainSurfaces` overlay parsing. -> Mitigation: migrate stage catalog/builders in same change and add validator coverage that rejects stale overlay usage.
- [Risk] Brittle visual state may drift from runtime state during migration. -> Mitigation: key brittle state by platform identity and require rendering to derive extents from platform variants only.
- [Risk] Static-only scoping may block a tempting future stage layout. -> Mitigation: keep the restriction explicit so any later broadening happens through a separate deliberate spec change instead of accidental support.