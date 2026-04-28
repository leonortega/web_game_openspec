## MODIFIED Requirements

### Requirement: Unstable platforms create timing pressure
The game SHALL support unstable or collapsing platforms that remain usable briefly before falling or becoming unsafe, and SHALL support brittle crystal platforms that behave as one-shot delayed-collapse static support. For falling-platform collapse timing, collapse progression MUST remain contact-aware rather than first-touch fixed, including `stayArmThresholdMs` and `hopGapThresholdMs` behavior defined in the existing contract. For brittle crystal platforms, warning progression MUST be occupancy-driven: brittle warning elapsed time MUST increase only while the player has top-surface support contact on that brittle platform. Staying, walking, and short hop-jump recontacts on the same brittle platform MUST continue that same occupancy progression when unsupported gaps are at or below `hopGapThresholdMs`, while larger unsupported gaps before readiness MUST reset brittle warning progression back to intact. A brittle platform whose warning progression reaches full duration MUST enter a ready-to-break state but MUST remain valid support while top-surface support contact remains active. That ready brittle platform MUST break and fall on the first update where that top-surface support contact ends. Falling-platform behavior in this requirement remains unchanged.

#### Scenario: Building brittle warning while occupied
- **WHEN** the player stays or walks on a brittle crystal platform with valid top-surface support contact
- **THEN** brittle warning progression advances while that support contact remains active

#### Scenario: Hop-jumping on brittle support
- **WHEN** the player performs short hop-jump movement over the same brittle platform and unsupported gaps stay at or below `hopGapThresholdMs`
- **THEN** brittle warning progression continues as one occupancy window rather than resetting

#### Scenario: Leaving brittle too long before readiness
- **WHEN** the player loses top-surface support on a brittle platform for longer than `hopGapThresholdMs` before warning progression completes
- **THEN** brittle warning progression resets to intact before any later re-contact

#### Scenario: Ready brittle while still supported
- **WHEN** brittle warning progression reaches full duration and the player still has top-surface support contact on that platform
- **THEN** the platform enters ready-to-break state but remains valid support until that support contact ends

#### Scenario: Break on leave after readiness
- **WHEN** a brittle platform is already in ready-to-break state and player top-surface support contact ends
- **THEN** that platform breaks and falls on that leave transition update

### Requirement: Existing special terrain surfaces remain visually distinct in play
The game SHALL present authored `brittleCrystal` and `stickySludge` platform variants with distinct readable cues that communicate their traversal identity across the full authored platform footprint rather than through smaller overlay patches or separate terrain-surface render layers. A brittle crystal platform MUST read as crystalline and fragile while intact, MUST show a clearly intensifying warning cue while occupancy-driven brittle progression is active, and MUST show a distinct ready-to-break read before collapse if warning completion occurs while still occupied. A sticky sludge platform MUST read as viscous and drag-inducing across the whole platform surface, using a layered or subtly animated cue that remains legible during normal movement. These cues MUST stay consistent with the same authored platform extents used by simulation and validation.

#### Scenario: Reading brittle occupancy progression
- **WHEN** the player stays, walks, or hop-jumps on a brittle crystal platform during warning progression
- **THEN** the platform's warning visuals visibly intensify across the full authored footprint while progression is active

#### Scenario: Reading ready-to-break brittle support
- **WHEN** brittle warning progression completes while the player still occupies the platform
- **THEN** the platform shows a distinct ready-to-break visual state before collapse on leave

#### Scenario: Comparing terrain visuals with authored data
- **WHEN** brittle or sticky platform variants are rendered in a migrated stage
- **THEN** their visible coverage matches the authored platform variant footprint rather than a legacy overlay rectangle or separate terrain-surface render primitive