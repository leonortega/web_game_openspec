## Context

The current platformer already enforces grounded hazards and enemies, but recent playtesting shows that “grounded” is not enough for good readability or control feel. Static threats such as turrets and fixed spike hazards can still sit too close to platform corners, hoppers do not create enough vertical pressure to stand apart from walkers, and the player can lose a valid jump window too early once a falling platform starts descending.

This change touches three connected areas:
- stage authoring in [stages.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/game/content/stages.ts)
- player and enemy runtime behavior in [GameSession.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/game/simulation/GameSession.ts)
- validator coverage in [stage-playtest.mjs](C:/Endava/EndevLocal/Personal/web_game_openspec/scripts/stage-playtest.mjs)

## Goals / Non-Goals

**Goals:**
- Keep static hazards and turrets away from platform corners and bias them toward safer center placement.
- Make hopping enemies read as a much stronger vertical threat by increasing their jump arc.
- Preserve full player movement and jump response while the player is still physically supported by a falling platform.
- Catch these authoring and control issues in automated validation.

**Non-Goals:**
- Reworking flyer behavior or general enemy roster composition.
- Redesigning all enemy placements from scratch.
- Changing moving-platform carry behavior beyond what is needed for falling-platform jump support.
- Introducing new abilities or traversal systems.

## Decisions

### Decision: Treat static threats as center-biased authored elements
Static hazards and turrets will be held to a stricter placement rule than general grounded entities. They should keep explicit horizontal margin from platform edges and favor placement in the middle region of the supporting platform unless a stage-specific exception is deliberately authored.

Rationale:
- Static threats near corners feel unfair because they compress jump landing space.
- Center-biased placement is a readability rule, not just a support rule.
- This can be enforced both by authoring cleanup and by validator thresholds.

Alternatives considered:
- Allow edge placement if technically reachable: rejected because this keeps the main feel problem.
- Add special case metadata for every exception now: rejected as too much authoring overhead for a narrow polish pass.

### Decision: Raise hopper identity through stronger impulse, not new behavior
Hoppers will remain the same archetype but receive higher jump impulses so their role is clearer and more threatening in vertical space.

Rationale:
- This keeps the implementation small and preserves encounter readability.
- Stronger jump height is enough to differentiate the role without new state machines.

Alternatives considered:
- Add a second hopper subtype: rejected because this is tuning, not a new capability.

### Decision: Falling platforms remain valid support while contact exists
A falling platform should continue to count as jumpable support while the player remains in contact with its top surface, even after the falling state begins. Support should be lost only when physical contact is actually broken.

Rationale:
- Descent alone should not invalidate grounded jump control.
- This matches player expectation for platformer feel: “if I am still standing on it, I can still jump.”

Alternatives considered:
- Extend coyote time specifically for falling platforms: rejected because the player should not need a fallback grace rule while still visibly standing on the platform.
- Stop support as soon as falling starts: rejected because that is the bug being fixed.

## Risks / Trade-offs

- [Center-biased threat rules may reduce encounter variety on small platforms] → Apply the stricter rule specifically to static threats and keep some flexibility for larger authored sections.
- [Higher hopper impulses may cause overshoot on narrow lanes] → Rebalance per-stage hopper values and validate landing behavior on existing authored platforms.
- [Falling-platform support changes may reintroduce sticky-contact edge cases] → Limit the support rule to real top-surface contact and keep jump/detach logic explicit.
