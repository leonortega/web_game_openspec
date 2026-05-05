## Context

The archived `safe-power-pickup-route` change already closed the case where stompable grounded enemies could trap a newly granted power. The remaining failure mode is narrower but different: a power block can still reveal a power into a route that is blocked by a non-stompable hazard enemy, so the only continuation is unavoidable contact and immediate power loss.

The fix needs to stay in the authoring and verification layers. This is a layout problem, not a combat-system problem.

## Goals / Non-Goals

**Goals:**
- Prevent authored power blocks from creating an unavoidable post-pickup hazard contact route.
- Keep valid reward placements available when the player has a safe continuation path.
- Add regression coverage that fails on the unsafe hazard-enemy layout and passes on a safe alternative.
- Adjust any affected stage content so it respects the stricter safety rule.

**Non-Goals:**
- Change enemy AI, collision behavior, or power behavior.
- Add new player abilities or new reward types.
- Introduce runtime pathfinding or dynamic stage rewrites.

## Decisions

- Extend the stage authoring validator to reason about post-pickup continuation against hazard enemies as well as stompable blockers. This keeps the rule aligned with the actual failure mode instead of only checking whether the block itself is reachable.
- Treat the continuation rule as a deterministic authored-layout check. The stage should be rejected if the intended route after pickup still collapses into required enemy contact, rather than trying to infer a broader tactical escape state at runtime.
- Update stage content directly where needed rather than compensating in player movement or damage logic. The authored route should be safe on its own.
- Extend `scripts/stage-playtest.mjs` with one negative hazard-enemy fixture, one safe bypass fixture, and one live runtime probe so verification exercises both the authored rule and the actual in-game traversal.

## Risks / Trade-offs

- [Risk] The new rule could reject dense but still playable layouts. -> Keep the validation narrow to the immediate post-pickup route window.
- [Risk] Verification could become brittle if it overfits to a single stage setup. -> Use a representative hazard-enemy fixture plus a live traversal probe instead of a long scripted play sequence.
- [Risk] Small content edits may be needed in existing stages. -> Limit stage changes to reward placement and adjacent enemy routing.
