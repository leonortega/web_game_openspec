## MODIFIED Requirements

### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing. While the player is still supported by a falling platform's top surface, that support MUST remain valid for normal movement and jump initiation, including falling platforms that are in contact-aware collapse timing states before or after arm. Falling-platform arming and collapse timing MUST use deterministic contact-pattern thresholds (`stayArmThresholdMs = 120`, `hopGapThresholdMs = 50`) without invalidating grounded jump eligibility during active support contact.

#### Scenario: Jumping during contact-aware falling-platform timing
- **WHEN** the player is in valid top-surface support contact with a falling platform while that platform is accumulating pre-arm stay time or consuming armed collapse time
- **THEN** jump initiation remains valid under normal controller jump rules

### Requirement: Support-detach frames preserve occupied fall position
The game SHALL preserve the player's occupied position on the single update where authored support motion ends valid top-surface contact without a player-initiated jump. On that detach update, collision resolution MUST ignore only the former support body for horizontal blocking if that body was the immediately preceding valid support and only if the player is leaving its top surface because the support moved away. All other solid bodies, including nearby walls and platforms, MUST still resolve normally on that update. The exemption MUST expire immediately after that update and MUST NOT alter jump initiation, coyote time, buffered jump resolution, dash motion, gravity-field behavior, or falling-platform support retention while top-surface contact remains valid. Contact-aware falling-platform timing thresholds MUST NOT broaden or weaken this single-update exemption.

#### Scenario: Detaching from support after contact-aware falling timing
- **WHEN** authored support motion clears a falling platform away from under the player's occupied footprint after any contact-aware arm/timer state transitions
- **THEN** the player begins airborne motion from the same occupied position on that detach update
- **AND** only the immediately former support is exempt from horizontal blocking on that one update
- **AND** other solids still block normally
