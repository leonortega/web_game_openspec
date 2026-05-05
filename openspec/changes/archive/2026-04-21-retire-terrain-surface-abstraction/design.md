## Context

The codebase already treats brittle crystal and sticky sludge as full-platform behavior in the player-facing experience, but the authoring, runtime, and rendering model still carries a parallel terrain-surface abstraction. That leftover model shows up through dedicated terrain-surface types, collections, helper maps, identifiers, and spec wording that describe brittle and sticky as if they were separate authored shapes instead of platform-owned variants.

This change is a cross-cutting cleanup because the obsolete abstraction spans stage types, builders, validation, runtime state, rendering helpers, scripted playtests, and OpenSpec wording. The main constraint is that brittle delayed break, sticky grounded drag, full-footprint presentation, and the static-platform-only rule must remain unchanged. The cleanup must remove the stale abstraction without creating empty compatibility fields, overlay rectangles, or parallel platform and terrain-surface pathways.

## Goals / Non-Goals

**Goals:**
- Make the platform record the only source of truth for brittle and sticky authored data.
- Remove obsolete terrain-surface schema, runtime state, rendering helpers, and identifier references.
- Migrate route and fixture references that still target `terrainSurfaceIds` to platform-centric references.
- Keep existing brittle and sticky mechanics, visuals, and authored limitations intact.
- Leave the implementation with one coherent naming model that matches the specs.

**Non-Goals:**
- Removing brittle crystal or sticky sludge mechanics.
- Broadening brittle or sticky support onto moving, unstable, launcher, or other non-static platforms.
- Introducing a compatibility shim that preserves legacy `terrainSurfaces` or `terrainSurfaceIds` alongside platform variants.
- Changing stage pacing, encounter routing, or gravity-room rules beyond the reference-model cleanup.

## Decisions

### 1. Use platform-owned variant data as the sole authored model
The implementation will treat `platform.terrainVariant` on supported static platforms as the only valid authored source for brittle and sticky behavior. Separate terrain-surface schema and collections will be removed instead of partially preserved.

This keeps authored data aligned with current mechanics and removes ambiguity about which record owns brittle or sticky state. The alternative was to keep a compatibility layer that copied terrain-surface inputs into platform state, but that would preserve the same duplication and future drift this change is meant to eliminate.

### 2. Collapse runtime and rendering state onto platform identity
Any runtime state, maps, or rendering helpers that still key brittle or sticky behavior through terrain-surface-specific structures will be rewritten around platform identity. Platform IDs will become the only durable reference for simulation, presentation, and reset behavior in this slice.

This avoids split state between platform collections and terrain-surface collections. The alternative was a rename-only pass that kept terrain-surface-shaped containers under new names, but that would still preserve an unnecessary extra abstraction.

### 3. Migrate authored references atomically instead of keeping mixed IDs
Secret-route, gravity-capsule, and similar authored references that still point to `terrainSurfaceIds` will move directly to platform-centric references in the same implementation pass. Mixed platform and terrain-surface reference support will be treated as transitional drift, not as a supported authored model.

This keeps stage data, validation, and scripts coherent. The alternative was a staged migration with both ID families accepted temporarily, but that would complicate validation and make later cleanup harder.

### 4. Reject legacy terrain-surface leftovers rather than storing empty placeholders
Validation and stage ingestion will reject leftover terrain-surface collections, IDs, or overlay-style records for brittle and sticky content. The cleanup must not leave empty `terrainSurfaces` schema stubs, dead arrays, or unused maps behind solely for backward compatibility.

This makes the cleanup enforceable and prevents silent drift. The alternative was to keep empty fields in schema or state for compatibility, but those leftovers would continue to imply a distinct system and invite accidental reuse.

### 5. Treat tests and scripted playtests as migration guards
Automated tests and stage playtest scripts will be updated to assert platform-centric naming and references, and to continue covering brittle and sticky mechanics after the abstraction removal.

This ensures the cleanup is not only a rename pass but a verified model change. The alternative was to rely on type errors and ad hoc playtesting alone, which would miss lingering terrain-surface references in fixtures or scripts.

## Risks / Trade-offs

- Cross-cutting rename and model cleanup could miss a terrain-surface reference in fixtures or scripts -> Update tests and playtest scripts in the same pass, and fail validation on leftover terrain-surface fields or IDs.
- Removing compatibility fields may require broader authored-data updates than a partial migration -> Keep migration scope explicit in tasks and update all known touchpoints together rather than preserving mixed-mode support.
- Platform-owned state may expose places where rendering or simulation previously depended on terrain-surface helper maps -> Refactor those paths around platform IDs and rerun focused coverage for brittle and sticky behavior.
- Spec wording can drift from code cleanup if route references are renamed only in implementation -> Include explicit delta requirements for platform-centric references and visual ownership before apply begins.

## Migration Plan

1. Remove obsolete terrain-surface schema and identifiers from stage types and validation contracts.
2. Refactor runtime state and rendering helpers to derive brittle and sticky behavior from platform-owned variant data only.
3. Migrate authored content, fixtures, and scripts from terrain-surface references to platform references.
4. Run focused automated tests and scripted playtests that cover brittle, sticky, secret-route, and gravity-capsule paths.

Rollback, if needed, would restore the prior terrain-surface-aware implementation from version control. No runtime dual-write or compatibility path is planned in this change.

## Open Questions

No blocking design questions remain for proposal readiness. The working assumption is explicit: this is a model cleanup that preserves brittle and sticky mechanics rather than removing or redesigning them.