## 1. Types and schema cleanup

- [x] 1.1 Remove obsolete terrain-surface types, fields, and schema entries such as `TerrainSurfaceKind`, `TerrainSurfaceState`, `terrainSurfaces`, and `terrainSurfaceIds` from stage content contracts and validation inputs.
- [x] 1.2 Update stage builders, catalog ingestion, and validation to accept brittle and sticky data only through supported platform-owned variant fields.
- [x] 1.3 Migrate secret-route, gravity-capsule, and related authored references from terrain-surface identifiers to platform-centric references without leaving empty terrain-surface placeholders behind.

## 2. Runtime and rendering refactor

- [x] 2.1 Refactor simulation and game-session state so brittle and sticky behavior is keyed by platform identity instead of terrain-surface-specific collections or state maps.
- [x] 2.2 Replace terrain-surface render helpers, lookup maps, and naming with platform-variant presentation derived from full platform footprints.
- [x] 2.3 Preserve current brittle delayed-break, sticky grounded drag, full-platform coverage, and static-platform-only behavior while removing the parallel terrain-surface abstraction.

## 3. Tests and scripted coverage

- [x] 3.1 Update automated tests and fixtures to remove legacy terrain-surface collections and to assert rejection of leftover terrain-surface overlays or IDs.
- [x] 3.2 Update scripted playtest coverage for brittle, sticky, secret-route, and gravity-capsule paths so it uses platform-centric references and still covers the same mechanics.
- [x] 3.3 Run focused validation for platform-variant runtime behavior, route-reference migration, and presentation alignment after the cleanup.

## 4. Spec and terminology alignment

- [x] 4.1 Align implementation naming, authored data terminology, and developer-facing comments with the platform-variant model so brittle and sticky no longer read as a separate terrain-surface system.
- [x] 4.2 Confirm OpenSpec delta wording, tests, and playtest scripts all describe platform-owned variants and route references consistently before verify and archive.