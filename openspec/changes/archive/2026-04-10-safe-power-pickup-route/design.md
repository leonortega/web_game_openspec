## Context

Reward blocks already have placement validation, but the current rule set is too permissive if the player can still be cornered into taking enemy damage immediately after collecting a power. The result is a trap state: the game grants a reward, then the authored route strips it away before the player can use it.

This change needs to cover two surfaces: authoring-time validation for stages and verification coverage in the stage playtest script.

## Goals / Non-Goals

**Goals:**
- Prevent authored reward blocks from creating a forced-hit continuation immediately after pickup.
- Keep valid reward layouts available when the player has a safe continuation path.
- Add a regression probe that fails on the unsafe layout and passes on a safe alternative.
- Adjust affected stage content so it respects the stricter rule.

**Non-Goals:**
- Redesign enemy AI, combat, or power behavior.
- Change the core reward block reveal animation or pickup effect.
- Introduce runtime pathfinding or dynamic stage re-authoring.

## Decisions

- Extend the stage authoring validator with a post-pickup safety check rather than relying only on direct overlap or same-lane obstruction. This is the right boundary because the bug is authored layout, not player input.
- Treat "safe continuation" as a deterministic stage-layout rule, not a runtime heuristic. That keeps validation reproducible and makes the regression probe stable.
- Update affected stage content to preserve a clean escape lane after power pickup instead of compensating in controller code. The player should not need special handling to survive the authored route.
- Add one negative and one positive playtest fixture in `scripts/stage-playtest.mjs` so verification proves both rejection of the trap and acceptance of a safe nearby enemy layout.

## Risks / Trade-offs

- [Risk] The new validator could become too strict and reject dense but still escapable layouts. → Keep the safety check narrow and tied to the immediate post-pickup route window.
- [Risk] Verification fixtures could be brittle if they encode too much frame-specific behavior. → Prefer layout assertions and a short traversal probe over long scripted play sequences.
- [Risk] Existing stages may need small content shifts to satisfy the new rule. → Limit the content changes to authored reward placements and adjacent enemy timing.

## Migration Plan

1. Update affected stage content to remove forced-hit power pickups.
2. Extend the authoring validator to reject unsafe post-pickup routes.
3. Add regression coverage in `scripts/stage-playtest.mjs` for unsafe and safe cases.
4. Run the stage playtest suite and fix any remaining authored layouts.

## Open Questions

- How many tiles or frames should define the "immediate" safety window after pickup?
- Should the validator consider lateral escape routes, or only the forward route directly after the reward block?
- Do we want a dedicated fixture for every supported power, or is one representative power block enough for regression coverage?
