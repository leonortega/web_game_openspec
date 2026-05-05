## Context

The current project renders gameplay with procedural placeholder textures, soft gradients, and modern UI surfaces spread across Phaser scenes and DOM-backed shell styling. The requested change is a cross-cutting presentation pass that must touch active gameplay rendering, the HUD, and the stage intro/completion scenes while staying out of movement, combat, progression, authored stage mechanics, and active main-menu work.

The main ambiguity is not technical feasibility but scope control: the game needs a recognizable retro direction without drifting into literal Atari 2600 emulation, unreadable low-detail art, or overlap with ongoing menu and stage-layout changes. This design resolves those ambiguities up front so implementation can stay bounded.

## Goals / Non-Goals

**Goals:**
- Apply a single Atari 2600-inspired visual language across gameplay rendering, gameplay HUD, and stage intro/completion scenes.
- Favor coarse silhouettes, flat fills, very small local color sets, and sparse pose-based animation over gradients, shading, and decorative texture detail.
- Preserve or improve readability for powers, enemy telegraphs, hazards, checkpoints, reward blocks, and stage labels under the reduced-detail style.
- Keep the implementation compatible with the existing Phaser scene flow and current authoring model.
- Leave a concrete task list that can be implemented in bounded scene and HUD updates.

**Non-Goals:**
- Rework movement, combat balance, progression, checkpoint logic, or authored stage routes.
- Redesign the main menu or overlap with the active `main-menu-simplification` change.
- Introduce strict hardware emulation requirements such as authentic sprite limits, color-clash simulation, or mandatory CRT artifacts.
- Expand the change into a general art pipeline replacement with full sprite-sheet production.

## Decisions

- Use an inspiration-first rendering contract rather than a hardware-accurate emulation target.
  - Rationale: the user requested Atari 2600-inspired traits, not a literal hardware simulation. This keeps implementation flexible enough to preserve modern readability and existing Phaser constraints.
  - Alternative considered: enforce hardware-faithful limits and analog artifacts globally. Rejected because it would create unnecessary compatibility and readability risk for a placeholder-heavy codebase.
- Scope the shared rendering change to gameplay, stage intro, and completion surfaces, and explicitly leave the main menu unchanged.
  - Rationale: this satisfies the requested presentation pass while avoiding direct overlap with the active menu change.
  - Alternative considered: apply the style to every scene immediately. Rejected because it widens the change surface and increases merge risk without being required.
- Prefer generated geometry, palette-driven fills, and tiny authored pixel textures only where simple primitives cannot communicate the needed silhouette.
  - Rationale: the current code already leans on procedural assets, so a palette-and-shape pass is cheaper and more consistent than introducing a broad sprite-content pipeline.
  - Alternative considered: replace the placeholder system with fully authored sprite sheets. Rejected because it exceeds the intended presentation-only scope.
- Preserve readability through silhouette changes, reserved accent colors, and explicit state transitions rather than subtle hue shifts.
  - Rationale: the reduced palette makes pure color swapping unreliable for powers, hazards, and telegraphs.
  - Alternative considered: rely mostly on tint changes. Rejected because it would be fragile against backgrounds and low-resolution shapes.
- Exclude scanline, CRT, and flicker treatment from the required implementation baseline.
  - Rationale: the user marked those effects as optional and subtle if used. Keeping them out of the baseline prevents speculative renderer work from blocking the change.
  - Alternative considered: require a screen-space overlay by default. Rejected because it adds risk to runtime behavior without being necessary for the requested direction.

## Risks / Trade-offs

- [Readability regression] Flatter shapes and fewer colors can make powers, hazards, and pickups blend together -> Reserve accent colors by gameplay meaning and require silhouette/state changes for critical cues.
- [Cross-scene inconsistency] Gameplay, HUD, and transition scenes can drift if each is restyled independently -> Centralize the palette and visual rules in shared scene/HUD helpers or constants during implementation.
- [Overlap risk] Active menu and stage-layout changes touch nearby files and concepts -> Keep this change out of main-menu requirements and avoid any authored-layout rule changes.
- [Implementation creep] Retro inspiration can easily expand into a full art rewrite -> Bound the work to existing scenes, placeholder asset generation, and HUD/transition presentation only.

## Migration Plan

1. Define the shared palette, silhouette rules, and scene-level presentation constraints in code comments/constants used by gameplay scenes and HUD rendering.
2. Update gameplay rendering surfaces first so the core player, terrain, pickups, hazards, and enemy telegraphs share the new visual language.
3. Restyle the gameplay HUD to the scoreboard-like treatment while preserving the existing information hierarchy.
4. Restyle stage intro and completion scenes to the same language without changing progression data or scene ordering.
5. Run build and playtest coverage focused on scene flow plus visual/readability assertions for power variants, hazards, and HUD text.

## Open Questions

- None for proposal readiness. This change intentionally leaves menu styling and optional analog-display overlays outside the required implementation baseline.