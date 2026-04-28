## ADDED Requirements

### Requirement: Hover enemies preserve hover-only fairness while using refreshed ovni presentation
Supported hover enemies SHALL keep their current hover-only threat role while using an original retro ovni presentation. Their refreshed art MUST preserve the existing collision or body footprint, fixed-lane patrol behavior, bobbing motion, and route fairness. The visible silhouette MUST read as a symmetric saucer or ovni with a bounded underside-light cue and clearer canopy-versus-hull separation than the current capped-drone read. This refresh MUST NOT add new attacks, change movement semantics, or depend on direct copying of supplied reference art.

#### Scenario: Reading a hover enemy in active play
- **WHEN** the player approaches a visible hover enemy after the refresh
- **THEN** the enemy reads as a symmetric ovni or saucer through silhouette and underside-light placement
- **AND** it still behaves like the same hover-only lane-patrol threat

#### Scenario: Preserving hover-enemy fairness
- **WHEN** the refreshed hover enemy patrols, bobs, or crosses the same authored route
- **THEN** its collision footprint and reach remain unchanged
- **AND** the player does not need to relearn spacing because of the presentation refresh

#### Scenario: Avoiding copied-reference art
- **WHEN** the refreshed hover enemy art is evaluated against supplied style reference
- **THEN** it reads as original project art inspired by that direction
- **AND** it does not directly trace or reproduce the supplied image

### Requirement: Hover-enemy blink polish remains optional and non-distracting
If refreshed hover enemies use blinking or shimmering running lights, that polish SHALL remain optional and visually secondary. Any blink treatment MUST stay local, low-frequency, and low-intensity enough that the enemy silhouette, path, and danger read remain clearer than the blink itself. The blink MUST NOT act as a new attack telegraph, state dependency, or distracting strobe effect.

#### Scenario: Showing a subtle blink accent
- **WHEN** a hover enemy uses optional light-blink polish during active play
- **THEN** the blink stays secondary to the enemy silhouette and movement read
- **AND** it does not pull attention away from nearby route-critical hazards or terrain

#### Scenario: Comparing blink to gameplay state
- **WHEN** the player reads the hover enemy threat during patrol
- **THEN** the enemy remains understandable without relying on the blink pattern
- **AND** no new gameplay timing or attack meaning is communicated only through that light accent