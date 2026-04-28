## ADDED Requirements

### Requirement: Support-detach frames preserve occupied fall position
The game SHALL preserve the player's occupied position on the single update where authored support motion ends valid top-surface contact without a player-initiated jump. On that detach update, collision resolution MUST ignore only the former support body for horizontal blocking if that body was the immediately preceding valid support and only if the player is leaving its top surface because the support moved away. All other solid bodies, including nearby walls and platforms, MUST still resolve normally on that update. The exemption MUST expire immediately after that update and MUST NOT alter jump initiation, coyote time, buffered jump resolution, dash motion, gravity-field behavior, or falling-platform support retention while top-surface contact remains valid.

#### Scenario: Detaching from moving support without edge shove
- **WHEN** authored support motion clears the player's immediately previous support away from under their occupied footprint
- **THEN** the player begins airborne motion from the same occupied position instead of being pushed to the former support's edge

#### Scenario: Other walls still block on the detach update
- **WHEN** the player loses top-surface support because the former support moved away and another solid wall is still in horizontal collision range on that same update
- **THEN** that other wall continues to resolve as a normal blocker

#### Scenario: Former support blocks again after the detach frame
- **WHEN** the player reaches the side of the former support after the single detach update has passed
- **THEN** collisions with that platform resolve normally again

#### Scenario: Coyote timing remains unchanged after support-driven detach
- **WHEN** the player presses jump during the normal coyote window after support motion ended valid top-surface contact
- **THEN** the controller uses the existing coyote-jump rules without any detach-specific jump rewrite