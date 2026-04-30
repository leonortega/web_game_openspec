## MODIFIED Requirements

### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing. Jump readability MAY use a short bounded jump-pose hold window that keeps jump intent visible immediately after jump initiation, including brief airborne transitions after takeoff, as long as that hold remains presentation-level and does not alter jump physics, coyote timing, buffered-jump timing, dash priority, or support-contact truth.

#### Scenario: Holding jump-readability pose after takeoff
- **WHEN** the player initiates a jump from valid support
- **THEN** a short bounded jump-pose hold may remain visible immediately after takeoff to preserve readability
- **AND** controller physics and input windows remain unchanged