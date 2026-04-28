## MODIFIED Requirements

### Requirement: Unstable platforms create timing pressure
The game SHALL support unstable or collapsing platforms that remain usable briefly before falling or becoming unsafe, and SHALL support brittle crystal platforms that behave as one-shot delayed-collapse static support. For falling-platform collapse timing, collapse progression MUST be contact-aware rather than first-touch fixed. A falling platform MUST NOT arm collapse countdown from a skim contact alone. A falling platform collapse countdown MUST arm only after the player accumulates at least 120 ms of top-surface support contact on that platform (`stayArmThresholdMs`). While unarmed, an unsupported gap of 50 ms or less (`hopGapThresholdMs`) MUST preserve that accumulated pre-arm support-contact time, and a longer unsupported gap MUST reset that pre-arm accumulation. After the falling platform is armed, remaining collapse time MUST decrease only while top-surface support contact with that platform is active. A falling platform MUST continue to act as valid support for grounded movement and jump initiation while the player still has top-surface contact with it. Brittle crystal platform behavior in this requirement remains unchanged.

#### Scenario: Skimming a falling platform
- **WHEN** the player touches a falling platform from above and leaves before accumulating 120 ms of support contact
- **THEN** the falling platform does not arm its collapse countdown

#### Scenario: Staying on a falling platform long enough to arm
- **WHEN** the player accumulates at least 120 ms of top-surface support contact on a falling platform
- **THEN** that platform arms its collapse countdown

#### Scenario: Brief hop while preparing to arm
- **WHEN** the player briefly loses top-surface support on an unarmed falling platform for 50 ms or less and then re-contacts it
- **THEN** pre-arm accumulated support-contact time is preserved

#### Scenario: Leaving too long before arming
- **WHEN** the player loses top-surface support on an unarmed falling platform for longer than 50 ms
- **THEN** pre-arm accumulated support-contact time resets before any later re-contact

#### Scenario: Armed timer while not supported
- **WHEN** a falling platform is armed and the player is not in top-surface support contact with it
- **THEN** the platform's remaining collapse time does not decrease during that unsupported interval

#### Scenario: Jumping from armed falling support
- **WHEN** the player is still in top-surface support contact with an armed falling platform and presses jump
- **THEN** jump initiation remains valid until that support contact ends
