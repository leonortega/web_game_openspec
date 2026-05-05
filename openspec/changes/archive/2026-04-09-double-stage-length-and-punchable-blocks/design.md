## Context

The current game already has long-form authored stages, checkpointed progress, and reward blocks that can be activated from below. The new request does not add a new subsystem; it tightens stage pacing and block interaction so the levels feel longer and the reward blocks behave like punch blocks with visible feedback.

The main constraint is that stage geometry, combat spacing, and block spacing all depend on authored content in `stages.ts`, while block resolution happens in the simulation and render layers. That means the change must update both the level data and the runtime response together.

## Goals / Non-Goals

**Goals:**

- Double the authored length of each stage in a way that preserves pacing.
- Require interactive blocks to be punchable from below with enough vertical clearance.
- Support multi-hit coin blocks where each punch consumes one coin reward.
- Show a short-lived reward reveal for punched coins or powers.

**Non-Goals:**

- Adding new enemy types, power types, or collectible categories.
- Changing menu flow, progression rules, or player ability rules beyond the block interaction changes.
- Procedural stage generation or automatic stage scaling.

## Decisions

1. Scale stages by reauthoring content rather than applying a blind numeric multiplier.
   The stage data already mixes segment pacing, checkpoints, enemies, and reward placement. A literal 2x content pass keeps those authored beats readable.
   Alternatives considered: a global world-width multiplier or camera scaling. Those are faster to implement but produce empty travel and break route intent.

2. Track reward blocks as punchable entities with remaining reward counts.
   Coin blocks need to survive multiple underside hits, while power blocks remain single-hit. This keeps the data model aligned with block behavior instead of treating every block as a one-shot pickup.
   Alternatives considered: spawning separate coin blocks for each coin or converting everything into collectible clusters. Both make the block interaction less readable.

3. Spawn transient reveal objects when a block is punched.
   The reveal should be a short visual confirmation, not a persistent collectible or HUD message. A one-second lifetime with fade-out gives the player feedback without cluttering the screen.
   Alternatives considered: only updating text/UI, or leaving the punch silent. Those do not provide enough moment-to-moment reward feedback.

4. Encode vertical clearance as authored layout, not runtime auto-fixup.
   The stage content should place punchable blocks high enough above the floor for a jump to reach them. Auto-adjusting block heights at runtime would hide layout mistakes and make authored pacing harder to reason about.
   Alternatives considered: dynamically shifting blocks or adding block-specific collision offsets. Those complicate validation without improving the player experience.

## Risks / Trade-offs

- [Risk] Longer stages can feel padded if content spacing is not reauthored carefully. [Mitigation] Rebalance segment lengths, enemy placement, and reward density instead of only extending the exit distance.
- [Risk] Multi-hit coin blocks increase interaction count and can slow traversal. [Mitigation] Limit multi-hit blocks to authored spots where the repeated punches are intentional.
- [Risk] Reveal effects can become noisy if too many are stacked in the same area. [Mitigation] Keep the effect short, small, and tied to the block hit location.
- [Risk] Stage data changes may invalidate playtest assumptions. [Mitigation] Update stage playtests after the content pass and verify the route from spawn to exit in each stage.

## Migration Plan

1. Update stage content to double the authored route length and adjust spacing.
2. Change reward-block state so coin blocks can track remaining hits.
3. Add punch-hit resolution and reveal spawning in the simulation and renderer.
4. Run stage playtests to confirm the longer routes still read cleanly and the blocks are reachable from below.
5. If the layout needs rollback, revert the stage content first and then revert the block interaction changes.

## Open Questions

- Should the reveal use the block's reward icon, the actual coin sprite, or a simplified pop-up marker?
- Should multi-hit coin blocks show their remaining hits visually on the block itself, or only through the repeated punch behavior?
- Should every stage be exactly 2x the previous authored length, or just close enough to meet the new pacing target?
