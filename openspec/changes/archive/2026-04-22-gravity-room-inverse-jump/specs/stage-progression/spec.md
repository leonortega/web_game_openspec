## MODIFIED Requirements

### Requirement: Gravity capsule activation resets on retry and stays authorably reachable
The game SHALL treat enclosed gravity room disable buttons and linked room sections as live traversal activation state rather than checkpoint-persistent route discovery. Every enclosed gravity room MUST begin with its linked field active on a fresh attempt, and death, checkpoint respawn, or manual stage restart MUST rebuild that room from the same active baseline instead of preserving prior disabled state. A checkpoint snapshot MUST NOT restore a previously disabled enclosed gravity room, even if the checkpoint was reached after the room had been disabled. Authored validation MUST accept an enclosed gravity room only when its side-wall entry opening lies on an intended reachable route segment, that entry opening has a reachable exterior-side approach path on the authored route, its side-wall exit opening has both a reachable interior-side route through the room and a usable exterior-side reconnect after the player leaves the room, and its interior disable button is reachable after entering the room while the field is still active. That active-field button route MUST remain readable with the room's inverse jump semantics and existing contact interaction rules rather than depending on a legacy normal-jump assumption, a new input, a jump-triggered gravity toggle, or a dedicated compliance-only support piece. Its shell fully contains the linked full-room player gravity volume and all authored room-local content, and no authored enemy, moving platform, or other traversal content path intrudes through sealed shell wall bands outside the authored door openings. The full bottom shell edge of an enclosed gravity room MUST remain sealed, and validation MUST reject any doorway or pass-through that still exists on that bottom edge. Authored validation MUST NOT reject a gravity room solely because it contains an enemy inside the room. Instead, validation MUST accept interior enemies only when they remain assigned to the room interior and preserve a readable route to the room's interior disable button under inverse jump semantics, and MUST reject any room whose authored enemy placement, patrol, or other expected motion would allow an interior enemy to leave through a side-wall door, allow an exterior enemy to enter through a side-wall door, or crowd, pin, or replace the only intended deactivation path to the button. Those enemy-containment and button-reachability expectations MUST remain in force whether the room field is active or disabled. For the current playable gravity-room rollout, authored validation and authored data updates MUST keep `IN` as left-side side-wall room entry and `OUT` as right-side side-wall room exit from the player-facing room flow. Validation MUST reject any arrangement that passes only because the player can technically thread through a wrong-side door pairing, a leftover bottom-edge doorway, shell-band-only blocking that still leaves doors enemy-passable, a misleading active-gravity button route that depends on legacy upward jump assumptions, or a dedicated compliance-only support piece.

#### Scenario: Dying after disabling an enclosed gravity room
- **WHEN** the player disables an enclosed gravity room and then dies before finishing the route it gates
- **THEN** the next life restores that room to its active baseline until the interior button is triggered again

#### Scenario: Accepting a gravity room with contained interior enemies
- **WHEN** authored validation evaluates an enclosed gravity room with correct side-wall player flow, a reachable interior disable button, and one or more enemies that remain contained to the room interior
- **THEN** validation accepts that section as a valid bounded traversal segment

#### Scenario: Rejecting an unreadable active-field button route
- **WHEN** authored validation evaluates an enclosed gravity room whose active gravity setup, button placement, or support geometry makes the intended route to the interior disable button unreadable or effectively unreachable under inverse jump semantics
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting an interior enemy escape path
- **WHEN** authored validation evaluates an enclosed gravity room whose interior enemy placement or expected motion would allow that enemy to leave through a side-wall door
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting an exterior enemy intrusion path
- **WHEN** authored validation evaluates an enclosed gravity room whose exterior enemy placement or expected motion would allow that enemy to enter through a side-wall door
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting an interior enemy that blocks the button lane
- **WHEN** authored validation evaluates an enclosed gravity room whose contained interior enemy placement makes the only intended active-field route to the disable button depend on unavoidable blocking enemy contact
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Respawning a gravity room with contained interior enemies
- **WHEN** the player dies or restarts after reaching an enclosed gravity room that contains valid room-local enemies
- **THEN** the room resets to its active baseline
- **AND** those enemies remain assigned to their authored side of the room boundary after the reset