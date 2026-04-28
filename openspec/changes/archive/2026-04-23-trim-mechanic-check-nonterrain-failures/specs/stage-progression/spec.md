## ADDED Requirements

### Requirement: Broad helper gravity-field readability follows live-scene renderer truth
The project SHALL keep broad automated `Mechanic Checks` gravity-field readability coverage aligned with the current live-scene renderer contract. When the helper evaluates a current playable gravity-field route, it MUST use the live scene's gravity-field styling and stable debug-snapshot signals to confirm the field remains readable, bounded, and visually distinct from neighboring traversal mechanics. The helper MUST NOT rely on a stale relative-alpha heuristic that predates the current renderer contract, and this non-terrain cleanup MUST leave terrain-variant extents and brittle or sticky readability drift outside the scope of this requirement.

#### Scenario: Evaluating the Halo Spire gravity-field route in the live scene
- **WHEN** broad automated coverage evaluates the current Halo Spire Array gravity-field route in the live scene
- **THEN** it accepts the route only if the current renderer and stable debug-snapshot signals show a readable bounded gravity field, regardless of whether an older relative-alpha heuristic would have failed it

#### Scenario: Reporting non-terrain gravity readability separately from terrain drift
- **WHEN** the broad helper runs this non-terrain gravity-field readability check alongside terrain-variant checks in the same `Mechanic Checks` bundle
- **THEN** the gravity-field readability result is determined from the live-scene renderer contract without folding terrain-variant extents or brittle or sticky readability drift into the same failure condition

## MODIFIED Requirements