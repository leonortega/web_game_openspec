# Design: 16-bit Pixel Art Sprite-Sheet Animation Migration (Slice 1)

## Overview
This change introduces a staged migration path from procedural/rectangle visuals to sprite-first 16-bit-like presentation with true frame animation. `art.md` defines the authoritative key contract, frame sizing, movement signatures, and animator checklist for this pass.

The apply slice prioritizes gameplay readability and implementation feasibility by focusing on player animation and route-critical world visuals first.

## Art Contract Source
`art.md` is authoritative for:
- Texture key names and recommended frame sizes
- Movement and timing references used by animation clips
- Animator state-enter and exit expectations
- Registration and first-consumer file mapping

Apply implementation MUST treat `art.md` as binding for key naming and animation wiring unless an explicit follow-up spec change updates those contracts.

## Slice 1 Asset Contract

### Required New Keys In This Slice
- Player animation: `player-sheet`, `player-idle`, `player-run`, `player-jump`, `player-fall`, `player-dash`, `player-hurt`, `player-defeat`
- Platform and terrain: `platform-tiles`, `terrain-sticky`, `terrain-brittle`
- Gravity and capsule components: `gravity-field-stream`, `gravity-field-invert`, `gravity-capsule-shell`, `gravity-capsule-entry-door`, `gravity-capsule-exit-door`, `gravity-capsule-button`
- Hazards and interactions: `hazard-spikes`, `reward-block`, `activation-node`
- Exit/arrival support: `exit-base`, `exit-beacon`, `arrival-base`, `arrival-beacon`

### Deferred Keys
The rest of `art.md` remains in the migration backlog for later slices (for example optional UI shell atlas migration and extended variant sheets).

## Animation System Design

### Player Animation State Mapping
The player animation resolver is state-driven and aligns to existing movement/state contracts:
1. `idle` -> idle clip
2. `run` -> run clip
3. `jump-start` and `jump-rise` -> jump clip chain
4. `fall`/`apex` -> fall or apex hold frame
5. `dash` -> dash clip for dash timer window
6. `hurt` -> hurt clip with bounded duration
7. `defeat` -> defeat clip during existing defeat window

Priority order follows the animator checklist from `art.md`:
- defeat -> hurt -> dash -> action overlays -> air states -> ground states

### Timing Alignment Rules
- Animation triggers are driven by existing runtime events and timers; no simulation constants are changed.
- Dash clip window stays bound to existing dash duration.
- Defeat and hurt presentation durations remain bounded by existing runtime windows.

## Rendering Integration Plan

### `src/phaser/assets/bootTextures.ts`
- Add Slice 1 keys to required boot texture list.
- Register generated or loaded pixel textures/sheets with nearest-neighbor constraints.
- Keep existing keys for fallback compatibility.

### `src/phaser/scenes/gameScene/bootstrap.ts`
- Wire creation paths to use sprite/sheet-backed objects for scoped entities.
- Keep fallback guards where migration has not yet replaced all consumers.

### `src/phaser/scenes/GameScene.ts`
- Add or update animation-state synchronization for gameplay player.
- Ensure animation state transitions remain deterministic and event-driven.

### `src/phaser/scenes/gameScene/platformRendering.ts`
- Replace rectangle terrain/platform style paths in scope with tile or sprite usage.
- Preserve authored footprint coverage and state readability (intact/warning/ready/broken for brittle).

### `src/phaser/scenes/gameScene/gravityRendering.ts`
- Replace scoped gravity fields and capsule piece visuals with dedicated sprite assets.
- Keep active/disabled readability cues and preserve traversal semantics.

### `src/phaser/scenes/gameScene/enemyRendering.ts`
- Replace scoped spike hazard presentation with sprite/tile hazard visuals.
- Preserve telegraph readability and threat cadence semantics.

### `src/phaser/scenes/gameScene/rewardRendering.ts`
- Replace reward block and activation-node rectangle reads with sprite visuals.
- Preserve hit/consumed and active/inactive state readability.

## No-Regression Constraints
1. No gameplay timing or movement constant changes.
2. No collider/body extents drift outside existing behavior contracts.
3. No tint-only visual substitutions counted as migration completion.
4. No unbounded tween-heavy behavior used in place of frame animation.

## Performance And Memory Boundaries
1. Keep atlas/sheet grouping bounded for scoped assets only.
2. Reuse animation definitions and avoid per-frame animation registration.
3. Preserve pixel-snap style and avoid smoothing.
4. Validate no obvious frame-time spikes in normal stage flow.

## Verification Targets For Apply
1. Build and tests remain green or unchanged relative to baseline failures.
2. Player animation states visually match movement and combat state transitions.
3. Scoped rectangle-driven visuals are replaced by sprite/tile visuals in listed touchpoints.
4. Readability/fairness remains equivalent in active play lanes.
