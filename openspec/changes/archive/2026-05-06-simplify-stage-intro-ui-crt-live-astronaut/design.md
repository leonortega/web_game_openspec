# Design: Minimal Pre-Stage UI + Live Astronaut

## Context
Current pre-stage UI includes many informational rows and no astronaut figure due to previous transition constraints. New direction asks for a minimal panel with stage name, sample count, gameplay-like CRT look, and a live astronaut visual with active power appearance.

## Design
1. Apply configured retro postfx to intro camera using the same helper used by menu/game scenes.
2. Simplify intro content to:
   - Stage title
   - Samples taken summary
3. Render one astronaut sprite (`player-sheet` frame) in intro scene.
4. Determine displayed power variant by:
   - `state.player.presentationPower` if present
   - otherwise `getPrimaryPowerVariant(state.progress.activePowers, state.progress.powerTimers)`
5. Use variant colors and minimal power cues so avatar reflects active loadout.

## Spec Update
Adjust stage-transition-flow requirement language so pre-stage screen MAY include a bounded astronaut status avatar while completion layout continues without the removed side widget.

## Verification
- Intro scene renders with CRT postfx.
- Intro text reduced to required minimal fields.
- Power-aware astronaut appears.
- Existing flow timing preserved.
