## ADDED Requirements

### Requirement: Controller events expose bounded movement and checkpoint feedback
The game SHALL attach readable event-based visual feedback to supported controller moments without changing controller behavior. Jump and double-jump initiation, grounded landing recovery, and survey-beacon checkpoint activation MUST be allowed to trigger short retro-styled motion accents or particles, but those effects MUST be driven by discrete gameplay events rather than continuous per-frame emission. The added feedback MUST NOT change jump buffering, coyote time, dash priority, checkpoint semantics, damage rules, or respawn behavior.

#### Scenario: Triggering jump feedback
- **WHEN** the player performs a supported jump or double jump
- **THEN** the game may emit a short takeoff accent or particle burst tied to that jump event
- **AND** the feedback does not change the jump's physics or input timing

#### Scenario: Triggering landing feedback
- **WHEN** the player lands from an airborne state onto valid support
- **THEN** the game may emit a short landing accent that communicates recovery or contact
- **AND** the effect remains event-based rather than repeating while the player stays grounded

#### Scenario: Activating a checkpoint
- **WHEN** the player activates a survey beacon checkpoint
- **THEN** the game plays a readable checkpoint pulse, burst, or equivalent bounded accent near that beacon event
- **AND** the activation feedback does not change respawn location, checkpoint persistence, or controller state timing