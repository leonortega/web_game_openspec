## Context

The game currently ships as a Phaser-based platformer with authored stages, static platforms, simple enemy definitions, checkpoints, collectibles, and a HUD. Simulation logic is centralized in `GameSession`, while stage geometry and enemy placements are authored in `stages.ts`. This makes mechanic expansion feasible without a major architectural rewrite, but it also means new traversal and progression systems should remain data-driven so stage content stays easy to author and reason about.

## Goals / Non-Goals

**Goals:**
- Add dynamic platform behaviors without replacing the current authored stage model.
- Add a compact progression model that deepens movement and combat expression.
- Add a small number of new enemy roles that create distinct spatial pressure.
- Add sound and music hooks that improve feedback without making audio mandatory for playability.

**Non-Goals:**
- Boss encounters or narrative systems.
- Save-file persistence across browser sessions.
- Procedural level generation.
- A full animation or art overhaul.

## Decisions

### Keep new mechanics authored through stage data
Dynamic platforms and enemy variants will be added as new authored data types in stage definitions rather than hardcoded per scene. This keeps level behavior colocated with current content and fits the existing architecture better than scene-specific logic.

Alternative considered: embedding custom behavior in Phaser scene code per stage.
Rejected because it would fragment gameplay rules across multiple files and make balancing slower.

### Introduce powers as a lightweight session progression state
Player powers will be tracked as explicit runtime progression state, similar to stage unlocks and crystal totals, instead of inferred indirectly from collectibles alone. This allows HUD visibility, clear gating, and controlled unlock milestones.

Alternative considered: using only total crystals as the implicit source of truth.
Rejected because it makes ability state less explicit and complicates UI and testability.

### Expand enemy roles with readable single-purpose archetypes
New enemies should each introduce one clear pressure pattern such as charging, aerial lane control, or ambush timing. Mixed encounters will be authored intentionally using those roles instead of increasing density of existing walkers, hoppers, and turrets.

Alternative considered: adding only parameter variations of existing enemy types.
Rejected because it increases quantity without materially changing encounter decisions.

### Add audio as a non-blocking feedback layer
Audio integration will focus first on event-driven SFX hooks and one music loop per stage. The system should degrade gracefully if audio is muted or unsupported, so gameplay rules remain fully legible through visuals and system behavior.

Alternative considered: adding reactive layered music from the start.
Rejected for the first pass because it adds asset and state complexity before baseline audio coverage exists.

## Risks / Trade-offs

- [Dynamic platform collision edge cases] -> Keep the first pass to predictable routes and verify player/platform interaction during movement and respawn.
- [Powers trivialize intended jumps] -> Gate abilities carefully and rebalance stage routes where powers introduce alternate traversal.
- [Too many new mechanics at once reduce readability] -> Introduce new terrain and enemy roles in isolated beats before mixed sections.
- [Audio asset overhead slows implementation] -> Start with minimal placeholder-safe assets and clear playback hooks before expanding content.
