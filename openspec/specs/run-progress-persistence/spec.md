# run-progress-persistence Specification

## Purpose
TBD - created by archiving change document-persisted-run-settings-and-progress. Update Purpose after archive.
## Requirements
### Requirement: Run-level progress and settings persist across reloads
The game SHALL persist run-level progress and run settings to local storage and SHALL hydrate that saved payload during boot before the main menu appears. The persisted run-level payload MUST cover unlocked stage progression, total collected research samples, currently active powers, any active invincibility timer state, and current run settings. After a successful hydration, the game MUST enter the normal menu flow with that restored run-level state available, and it MUST NOT require the player to replay earlier unlocks or re-enter settings after a browser reload.

#### Scenario: Reloading after making run progress
- **WHEN** the player has unlocked later stages, collected research samples, or retained run-level powers and then reloads the app
- **THEN** boot restores that run-level progress before the main menu appears
- **AND** the menu and later stage starts use the restored unlocked progression, sample total, powers, and settings

#### Scenario: Reloading after changing run settings
- **WHEN** the player changes difficulty, enemy pressure, music volume, SFX volume, or CRT state and then reloads the app
- **THEN** boot restores those settings before the main menu appears
- **AND** the next menu presentation uses the restored settings instead of defaulting the surface again

### Requirement: Reload hydration restores run-level state without resuming an active attempt
The game SHALL treat boot hydration as run-level recovery rather than as mid-attempt resume. Reloading the app MUST restore the saved run-level payload, but it MUST NOT restore an in-progress stage snapshot, active checkpoint position, stage-local collectible removal, temporary route activation, or other live attempt state. After hydration, stage-local state MUST still begin from the normal authored start baseline for the next started stage attempt.

#### Scenario: Reloading during or after a partial stage attempt
- **WHEN** the player reloads the app after reaching a checkpoint or changing route-local stage state during a stage attempt
- **THEN** the next started stage uses the restored run-level progress and settings
- **AND** the stage-local checkpoint, collectible, and route-local attempt state does not resume from the interrupted attempt

### Requirement: Invalid or incompatible persisted payloads fail closed to a default run
The game SHALL treat persisted progress payloads as versioned input and MUST ignore malformed or incompatible saved data without blocking boot flow. If the stored payload is missing required run-level fields, has an unsupported version, or otherwise fails normalization, boot MUST continue into the main menu using the default run-level progress and default run settings. This fallback MUST preserve app usability and MUST NOT crash, hang, or prevent menu access.

#### Scenario: Encountering an invalid saved payload
- **WHEN** boot reads malformed, incomplete, or incompatible persisted progress data
- **THEN** the game discards that payload and enters the main menu with default run-level progress and settings
- **AND** boot flow remains usable without requiring manual storage cleanup

