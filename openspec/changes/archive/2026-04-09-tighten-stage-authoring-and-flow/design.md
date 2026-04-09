## Context

The current platformer already has checkpoint safety fixes and a unified top HUD, but recent playtesting still exposes authored-content drift and incomplete scene flow. Amber Cavern still contains hazards that appear unsupported, grounded enemies can spawn or patrol with slight vertical mismatch because their authored coordinates are trusted too directly, and the current experience moves from menu to gameplay without a short stage briefing while stage clear still depends on manual input.

The code paths involved are cross-cutting:
- stage authoring in [stages.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/game/content/stages.ts)
- runtime enemy/platform behavior in [GameSession.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/game/simulation/GameSession.ts)
- scene flow in [MenuScene.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/phaser/scenes/MenuScene.ts), [GameScene.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/phaser/scenes/GameScene.ts), and [CompleteScene.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/phaser/scenes/CompleteScene.ts)
- authored-content validation in [stage-playtest.mjs](C:/Endava/EndevLocal/Personal/web_game_openspec/scripts/stage-playtest.mjs)

## Goals / Non-Goals

**Goals:**
- Ensure authored non-pit hazards are visibly anchored to reachable supporting surfaces.
- Ensure grounded enemies spawn on platform tops and remain constrained to valid platform-supported movement lanes.
- Add a brief pre-stage presentation flow that shows stage and player status before gameplay begins.
- Change the post-clear flow so a results screen appears and advances automatically to the next stage.
- Tighten automated authored-content validation so unsupported hazards and off-platform enemy placement fail playtest.

**Non-Goals:**
- Reworking flying-enemy lane behavior.
- Adding new enemy archetypes, powers, or combat systems.
- Replacing the active top HUD during gameplay.
- Building a full stage-select or save-system overhaul.

## Decisions

### Decision: Treat grounded authored entities as platform-anchored, not free-positioned
Grounded enemies and non-pit hazards will be treated as authored against support surfaces, not as arbitrary world coordinates. Authoring can still use coordinates for convenience, but validation and runtime setup will resolve those placements against actual platform tops.

Rationale:
- This removes visible hover/sink drift from hand-authored `y` values.
- It aligns patrol and threat readability with the stage geometry the player actually uses.
- It allows the validator to reject content that is merely “close enough” but not intentionally grounded.

Alternatives considered:
- Manual cleanup only: rejected because the same class of bug can return on future edits.
- Fully replacing coordinates with explicit platform references: rejected for now because it adds more authoring churn than needed for this fix pass.

### Decision: Add a grounding pass during runtime initialization for non-flying enemies
During snapshot creation, non-flying enemies will be snapped to their supporting platform top if a valid support span exists. Grounded patrol enemies will derive their effective movement limits from reachable support instead of trusting raw left/right values blindly.

Rationale:
- Spawn correction prevents small authored offsets from producing visible clipping.
- Runtime clamping protects against patrol ranges extending beyond real platform edges.
- This keeps the current stage definition shape mostly intact while enforcing better behavior.

Alternatives considered:
- Perform all corrections only in stage authoring: rejected because runtime still needs to defend against invalid or stale data.
- Add per-enemy physics identical to the player for all grounded enemies: rejected as unnecessary complexity for patrol and turret actors.

### Decision: Tighten validator semantics from “supported enough” to “authored on support”
The stage playtest will move from permissive overlap checks to stronger authored-content rules:
- non-pit hazards must sit on floor or platform tops with clean vertical grounding
- grounded enemies must have supporting terrain at spawn
- grounded patrol lanes must remain within supported reachable spans

Rationale:
- Current checks pass content that still looks wrong to a human player.
- The validator should enforce presentation-quality placement, not just gross reachability.

Alternatives considered:
- Rely on visual manual review only: rejected because this is exactly the class of regression automation should catch.

### Decision: Introduce transition scenes instead of overloading gameplay HUD
Pre-stage status presentation and post-clear results should be implemented as dedicated transition scenes or scene states, not as temporary HUD overlays inside active gameplay.

Rationale:
- Stage intro and stage clear are discrete flow moments, not live combat UI.
- Dedicated scenes simplify timing, audio, and automatic transition behavior.
- This keeps the top gameplay HUD focused on active play.

Alternatives considered:
- Reuse MenuScene for per-stage intros: rejected because menu and stage intro have different timing and context.
- Show results in GameScene overlay: rejected because auto-advance and pause behavior become harder to reason about.

## Risks / Trade-offs

- [Validator becomes too strict for intentional edge cases] → Keep rules targeted to non-flying enemies and non-pit hazards, and encode explicit exceptions only if a real stage design needs them.
- [Runtime snapping masks bad content instead of exposing it] → Keep validator failures in place so content still has to be authored correctly even if runtime is defensive.
- [Auto-advance reduces player control after stage clear] → Keep the delay readable and preserve replay/menu options on the results screen, especially for the final stage.
- [Transition scenes add flow bugs between menu, game, and complete states] → Centralize stage-start and stage-advance handoff through the scene bridge and test the flow in automation.
