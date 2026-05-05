## ADDED Requirements

### Requirement: Authored water and heat shimmer accents stay decorative and bounded
The game MAY use localized water or heat shimmer presentation as a decorative accent on safe scenery or on non-mechanical authored surfaces that already exist in the world presentation. Any such shimmer MUST remain tightly local to the authored patch it decorates, MUST stay visually secondary to route-critical terrain and hazards, and MUST NOT alter collision, support truth, hazard timing, traversal semantics, or controller behavior. This contract MUST NOT introduce new water or heat mechanics, MUST NOT make shimmer the sole telegraph for a hazard or traversal state, and MUST NOT broaden safe-surface presentation into a generalized distortion system for every platform.

#### Scenario: Reading a safe decorative shimmer patch
- **WHEN** the player sees an authored water or heat shimmer accent on safe scenery or a non-mechanical surface
- **THEN** the shimmer reads as local environmental flavor rather than as a new gameplay rule
- **AND** nearby traversable terrain and hazards remain easier to read than the shimmer itself

#### Scenario: Comparing decorative shimmer with platform behavior
- **WHEN** the player traverses a route near a decorative shimmer patch
- **THEN** platform support, movement timing, and hazard behavior remain identical to the authored underlying route rules
- **AND** the player does not gain or lose traversal affordances because of the effect