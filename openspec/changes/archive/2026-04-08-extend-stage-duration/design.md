## Context

The current MVP platformer change defines short handcrafted stages intended to validate the core gameplay loop quickly. That scope is appropriate for the first playable, but it does not satisfy a target of at least 10 minutes of first-time play per main stage.

Longer stages cannot be achieved by simply extending level width. The game needs multi-segment layouts, repeated pacing arcs, and checkpoints that support recovery across a larger challenge footprint. This affects authored stage data, the progression model, and how encounters are sequenced.

## Goals / Non-Goals

**Goals:**
- Increase each main stage to a minimum 10-minute first-time completion target.
- Preserve readability by structuring stages into clear segments with escalation and recovery beats.
- Ensure checkpoints and collectibles scale with longer levels so the player is not forced into excessive replay after failure.
- Keep the stage model compatible with the existing browser runtime and progression flow.

**Non-Goals:**
- Changing the core player-controller rules.
- Adding new movement abilities solely to extend playtime.
- Converting the game into an open-world or hub-based structure.
- Requiring a boss encounter in every stage.

## Decisions

### Structure each stage as multiple authored segments

Each stage should be divided into distinct segments such as introduction, traversal challenge, hazard gauntlet, enemy pressure, and final ascent. This produces meaningful duration through varied play rather than empty traversal.

Alternatives considered:
- Make the current levels wider with repeated jumps: rejected because it increases duration without improving pacing.
- Split content into many short stages instead of fewer long ones: rejected because the request specifically calls for longer stage duration.

### Add pacing targets instead of exact geometry rules

The specification should define minimum duration and pacing expectations rather than exact map sizes. This gives implementation freedom to tune stage length through route complexity, encounter count, and recovery spaces.

Alternatives considered:
- Require fixed tile counts or world widths: rejected because time-to-complete depends on more than map size.

### Require multiple checkpoints in long stages

Stages targeting 10 minutes of play should include multiple checkpoints distributed across major segments. This keeps failure costs proportional to the increased stage length.

Alternatives considered:
- Keep one checkpoint per stage: rejected because longer levels would become frustrating after late-stage failure.
- Use infinite instant retries at every obstacle: rejected because it removes meaningful stage-level progression.

### Scale optional content with stage length

Collectibles and optional detours should be distributed across the full stage so exploration remains relevant throughout a longer run.

Alternatives considered:
- Keep collectibles only near the stage start: rejected because later stage sections would feel sparse.

## Risks / Trade-offs

- [Longer stages become repetitive] -> Use segment-based pacing with distinct challenge types and visual transitions.
- [Failure frustration increases with duration] -> Require multiple checkpoints and recovery spaces between intense sequences.
- [Implementation scope expands sharply] -> Reuse core mechanics and enemy archetypes while increasing authored content and pacing variety.
- [Duration targets vary by skill level] -> Define the target for first-time average play rather than speedrun or expert execution.
- [Longer stages dilute progression clarity] -> Keep each segment tied to a clear sub-goal or environmental change so advancement remains legible.

## Migration Plan

1. Update stage progression requirements to define minimum duration and segmented pacing.
2. Redesign stage content plans to include multiple segments and checkpoint placements per main stage.
3. Re-author current stage data to match the new duration target.
4. Playtest first-time clears and adjust encounter density until each main stage consistently lands at or above the target duration.

## Open Questions

- Should every stage target the same duration, or should later stages exceed 10 minutes while earlier ones only meet the minimum?
- Should longer stages include mid-stage visual theme shifts to reinforce segment boundaries?
- Should the stage select menu expose estimated stage duration to the player?
