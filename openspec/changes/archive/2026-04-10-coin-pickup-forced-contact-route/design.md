## Context

Reward-block validation already blocks some unsafe placements, but the current safety rule was introduced around power pickups and does not explicitly cover coin blocks in the same way. That leaves a gap where a coin block can be valid by the basic overlap check while still forcing the player into unavoidable enemy contact immediately after pickup.

## Goals / Non-Goals

**Goals:**
- Apply the immediate post-pickup safety rule to coin blocks.
- Keep the rule aligned with the existing power-block safety behavior instead of creating a separate coin-only system.
- Expand verification so the new rule is exercised by both authored fixtures and a live traversal probe.

**Non-Goals:**
- Reworking the underlying reward system or coin economy.
- Changing how coins are displayed, counted, or faded out after collection.
- Adding new reward types or enemy classes.

## Decisions

- Generalize the existing forced-contact safety check to all reward blocks instead of duplicating a coin-specific branch.
  - Rationale: the safety problem is about continuation routes after pickup, not the reward type.
  - Alternative considered: keep separate power and coin validators. Rejected because it would split the authoring rule and risk future drift.
- Keep the authored requirement focused on route safety, not enemy damage rules.
  - Rationale: the validator should reject bad layouts, not reinterpret combat balance.
  - Alternative considered: allow coin pickups to be “safe” only if the player can survive one hit. Rejected because that still makes the reward effectively forced-contact.
- Extend playtest coverage with one negative fixture, one safe fixture, and one live movement probe.
  - Rationale: static validation catches authored layouts, while the runtime probe proves the player can actually continue after pickup in the game flow.
  - Alternative considered: only update static fixtures. Rejected because it would not prove the route works in motion.

## Risks / Trade-offs

- [Risk] A broader safety rule could reject some dense but still playable layouts. → Mitigation: keep the rule tied to immediate continuation routes and validate against safe positive fixtures.
- [Risk] Existing coin-block placements may become invalid. → Mitigation: audit and adjust affected authored blocks during implementation.
- [Risk] The runtime probe may be brittle if stage timing changes. → Mitigation: anchor the probe to a specific authored fixture and assert only on route continuity and no forced damage.

## Open Questions

- None. The desired behavior is to treat coin blocks the same as power blocks for immediate post-pickup route safety.
