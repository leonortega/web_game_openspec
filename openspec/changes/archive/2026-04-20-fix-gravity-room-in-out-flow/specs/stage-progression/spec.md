## MODIFIED Requirements

### Requirement: Gravity capsule activation resets on retry and stays authorably reachable
The game SHALL treat enclosed gravity room disable buttons and linked room sections as live traversal activation state rather than checkpoint-persistent route discovery. Every enclosed gravity room MUST begin with its linked field active on a fresh attempt, and death, checkpoint respawn, or manual stage restart MUST rebuild that room from the same active baseline instead of preserving prior disabled state. A checkpoint snapshot MUST NOT restore a previously disabled enclosed gravity room, even if the checkpoint was reached after the room had been disabled. Authored validation MUST accept an enclosed gravity room only when its bottom entry and bottom exit openings lie on intended reachable route segments, the bottom entry opening has a reachable exterior-side approach path on the authored route, the bottom exit opening has both a reachable interior-side route through the room and a usable exterior-side reconnect after the player leaves the room, its interior disable button is reachable after entering the room while the field is still active, its shell fully contains the linked field and all authored room-local content, and no authored enemy, moving platform, or other traversal content path intrudes through sealed shell wall bands outside the authored door openings. For the current playable gravity-room rollout, authored validation and authored data updates MUST treat `IN` as left-side room entry and `OUT` as right-side room exit from the player-facing room flow. Validation MUST reject any arrangement that passes only because the player can technically thread through a wrong-side door pairing, a yellow-marked surrogate doorway arrangement, a doorway-only compliance platform, a helper ledge, or a fake low bottom-door workaround. For the current four-room rollout, `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule` MUST each preserve the enclosed-room shell, linked field, interior disable button, and reset behavior while satisfying the same player-facing IN-left and OUT-right rule. Existing geometry MAY remain only if it no longer counts as doorway flow, and a code or spec pass with wrong player-facing room flow MUST be treated as failure rather than as an acceptable false positive. The intended room route MUST remain reachable and not cut off in authored play space.

#### Scenario: Dying after disabling an enclosed gravity room
- **WHEN** the player disables an enclosed gravity room and then dies before finishing the route it gates
- **THEN** the next life restores that room to its active baseline until the interior button is triggered again

#### Scenario: Respawning from a later checkpoint after room disable
- **WHEN** the player disables an enclosed gravity room, later reaches a checkpoint, and then dies afterward in the same stage
- **THEN** respawning from that checkpoint does not preserve the disabled room state

#### Scenario: Rejecting an enclosed gravity room entry door without correct-side approach
- **WHEN** authored validation evaluates an enclosed gravity room whose bottom entry opening lacks a reachable exterior-side approach path on its intended route
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting an enclosed gravity room exit door without correct-side reconnect
- **WHEN** authored validation evaluates an enclosed gravity room whose bottom exit opening lacks a reachable interior-side route or a usable exterior-side reconnect after leaving the room
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting shell-band intrusion
- **WHEN** authored validation evaluates an enclosed gravity room whose enemy, moving-platform, or other traversal-content path crosses a sealed shell wall band outside the authored door openings
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting doorway support that depends on a dedicated helper platform
- **WHEN** authored validation evaluates a current playable enclosed gravity room whose entry-side or exit-side doorway support exists only because of a dedicated extra platform added solely to satisfy door-side rules
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting a technically valid but player-facing wrong forest or amber flow
- **WHEN** authored validation evaluates `forest-anti-grav-canopy-room` or `amber-inversion-smelter-room` and the room can technically be traversed but still reads as entering from the wrong side, exiting from the wrong side, or using a yellow-marked surrogate doorway solution
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting a technically valid but player-facing wrong sky flow
- **WHEN** authored validation evaluates `sky-anti-grav-capsule` or `sky-gravity-inversion-capsule` and the room can technically be traversed but still depends on a helper ledge, doorway-only compliance platform, fake low bottom-door workaround, or other wrong-side doorway read
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Accepting a contained enclosed gravity room with correct IN and OUT flow
- **WHEN** authored validation evaluates an enclosed gravity room with separate bottom entry and exit openings, correct-side player-facing door access, a reachable interior disable button, and fully contained reachable room content
- **THEN** validation accepts that section as a valid bounded traversal segment