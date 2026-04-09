## Context

The project currently uses fully authored stage coordinates and a simple custom simulation loop inside `GameSession`. That architecture is easy to reason about, but it relies on careful stage placement and basic collision assumptions. The newest mechanics pass introduced dynamic platforms and more enemy variety, which exposed missing safety rules for checkpoints and authored interactives, plus insufficient support-state handling for moving platforms. The HUD also expanded but remained visually split between the top and bottom edges of the screen.

## Goals / Non-Goals

**Goals:**
- Guarantee checkpoints are placed on stable, safe, reachable footing.
- Guarantee hazards and stage interactives remain within intended reachable space.
- Make moving platforms behave like supportive ground rather than pushy dynamic walls.
- Consolidate core HUD information into a single top bar during gameplay.

**Non-Goals:**
- New stage content themes or additional mechanics.
- Full physics-engine migration.
- New menu systems or out-of-game UI redesign.

## Decisions

### Treat checkpoint and hazard safety as authored-content validation rules
The first pass should fix incorrect coordinates in stage data and encode clear placement rules in specs and playtests. This is lower risk than inventing runtime auto-correction for bad content.

Alternative considered: dynamically snapping checkpoints or hazards at runtime.
Rejected because it hides bad authored data and can create surprising playtest results.

### Improve moving-platform behavior by tracking support motion explicitly
The player should inherit platform motion while grounded on a moving platform, and horizontal collision should avoid treating the supporting platform like an opposing wall. This should be implemented inside the existing simulation loop rather than replacing it with Arcade physics bodies.

Alternative considered: rewriting gameplay around Phaser physics bodies.
Rejected because it is a much larger refactor than needed for this bug-fix pass.

### Keep gameplay HUD content in one top-aligned layer
Core gameplay data such as stage, crystals, health, power, and progress should be grouped together at the top of the screen. Controls and nonessential guidance should move out of the main persistent HUD.

Alternative considered: keeping the split layout but tightening spacing.
Rejected because the split itself is the readability problem.

## Risks / Trade-offs

- [Moving platform fixes introduce new collision regressions] -> Keep the change focused on supported grounded interaction and verify jump/ride/walk scenarios explicitly.
- [Content fixes become one-off manual cleanup] -> Capture safety rules in specs and add playtest checks for checkpoint and reachable-element validation.
- [Top-only HUD becomes crowded on mobile] -> Keep the top bar compact and remove nonessential persistent cards.
