## MODIFIED Requirements

### Requirement: Unstable platforms create timing pressure
The game SHALL support unstable or collapsing platforms that remain usable briefly before falling or becoming unsafe, and SHALL support brittle crystal platforms that behave as one-shot delayed-collapse static support. For falling-platform collapse timing, collapse progression MUST remain contact-aware rather than first-touch fixed, including `stayArmThresholdMs` and `hopGapThresholdMs` behavior defined in the existing contract. For brittle crystal platforms, warning progression MUST remain occupancy-driven: brittle warning elapsed time MUST increase only while the player has top-surface support contact on that brittle platform. Staying, walking, and short hop-jump recontacts on the same brittle platform MUST continue that same occupancy progression when unsupported gaps are at or below `hopGapThresholdMs`, while larger unsupported gaps before readiness MUST reset brittle warning progression back to intact. A brittle platform whose warning progression reaches full duration MUST enter a ready-to-break state and MUST start a deterministic final-transition timer with `readyBreakDelayMs = 220`. While that ready timer has remaining time, the platform MUST remain valid solid top-surface support and MUST allow normal grounded movement and jump initiation, including landing onto that ready platform from a nearby platform. The ready timer MUST continue decreasing regardless of current occupancy or support contact. On the first update where ready-state elapsed time reaches or exceeds `readyBreakDelayMs`, that brittle platform MUST break and fall even if support contact is still active. Falling-platform behavior in this requirement remains unchanged.

#### Scenario: Entering ready-to-break state starts timer
- **WHEN** brittle warning progression first reaches full duration
- **THEN** the platform enters ready-to-break state and starts its 220 ms final-transition timer on that same update

#### Scenario: Ready brittle remains usable before timer expiry
- **WHEN** a brittle platform is in ready-to-break state and its final-transition timer has remaining time
- **THEN** the platform remains solid and landable as normal support
- **AND** the player can still initiate a grounded jump from that support

#### Scenario: Landing onto ready brittle from adjacent support
- **WHEN** the player jumps from a neighboring platform and lands on a brittle platform already in ready-to-break state before timer expiry
- **THEN** that landing resolves as valid top-surface support
- **AND** normal jump initiation remains available until timer expiry

#### Scenario: Break by time while still occupied
- **WHEN** a brittle platform stays occupied through the full ready-to-break delay
- **THEN** it still transitions to broken/falling immediately when the ready timer reaches 220 ms
- **AND** it does not require a leave transition to break

#### Scenario: Falling platform behavior is unaffected
- **WHEN** falling platforms run their contact-aware arm and countdown logic in the same stage
- **THEN** their `stayArmThresholdMs` and `hopGapThresholdMs` semantics remain unchanged by brittle final-transition timing
