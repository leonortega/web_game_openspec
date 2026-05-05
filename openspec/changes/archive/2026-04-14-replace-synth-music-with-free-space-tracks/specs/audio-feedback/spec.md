## ADDED Requirements

### Requirement: Sustained music assets keep explicit provenance and mapping
The game SHALL source sustained menu and gameplay music only from vendored CC0 or Public Domain assets with an explicit checked-in source manifest. That manifest MUST record the source page, creator name, license, original archive or file name, local asset path, and intended menu or stage mapping for each sustained track. The manifest MUST also record vetted backup candidates when the project has already identified them during proposal work.

#### Scenario: Reviewing sustained music provenance
- **WHEN** a reviewer inspects the sustained music source manifest for a build
- **THEN** every menu or stage music asset lists its source page, creator, license, original file name, local asset path, and intended mapping
- **AND** every listed sustained music source is CC0 or Public Domain rather than a license that requires attribution or additional downstream obligations

#### Scenario: Auditing approved backups
- **WHEN** a reviewer checks the manifest notes for replacement options
- **THEN** the manifest includes the vetted backup candidates that were approved during proposal work
- **AND** those backups are clearly marked as alternates rather than active mappings

## MODIFIED Requirements

### Requirement: Stages have distinct music identity
The game SHALL provide distinct sustained space-themed music for the main menu and each authored playable stage using downloaded free music assets instead of procedural synthesized loops. The active mappings MUST be `menu` to `Another space background track` by `yd` (CC0, archive `ObservingTheStar.zip`), `forest-ruins` to `Magic Space` by `CodeManu` (CC0, file `magic space.mp3`), `amber-cavern` to `I swear I saw it - background track` by `yd` (CC0, file `IswearIsawit.ogg`), and `sky-sanctum` to `Party Sector` by `Joth` (CC0, file `Party Sector.mp3`). These sustained tracks MUST remain distinct from short synthesized menu cues, gameplay SFX, and transition stingers. The implementation MUST no longer require procedural synthesized motif, phrase-template, cadence, or completion-phrase authoring for sustained menu and gameplay loops.

#### Scenario: Starting the menu and a stage
- **WHEN** the player unlocks audio on the main menu and later enters a stage intro and gameplay for a stage
- **THEN** the menu surface plays the mapped menu track for the current build
- **AND** the stage presentation may play a short synthesized intro stinger without extending scene timing
- **AND** the stage gameplay loop begins once gameplay starts using the mapped asset for that specific stage rather than a synthesized procedural loop

#### Scenario: Comparing the current playable stage themes
- **WHEN** a reviewer compares the gameplay music for `forest-ruins`, `amber-cavern`, and `sky-sanctum`
- **THEN** `forest-ruins` uses `Magic Space`, `amber-cavern` uses `I swear I saw it - background track`, and `sky-sanctum` uses `Party Sector`
- **AND** the three stages present clearly different sustained music identities appropriate to uplifting, darker, and more open space-travel play respectively

#### Scenario: Repeating a gameplay track without overlap fatigue
- **WHEN** any mapped gameplay track restarts after reaching its loop boundary or is re-entered after a scene handoff
- **THEN** the restart or resume occurs cleanly without a second copy of the same track continuing underneath it
- **AND** the loop transition does not feel like multiple overlapping restarts from separate scenes

### Requirement: Audio behavior remains consistent and non-blocking
The game SHALL apply sustained music assets and synthesized audio cues consistently without preventing gameplay or menus from remaining understandable if sound is unavailable, muted, unsupported, an asset fails to load, or audio is not yet unlocked by the browser.

#### Scenario: Repeating the same gameplay action
- **WHEN** the player repeats the same event under the same conditions
- **THEN** the same class of synthesized feedback is produced consistently

#### Scenario: Playing with audio disabled
- **WHEN** sound is unavailable, muted, unsupported, or a sustained music asset is unavailable
- **THEN** the game remains playable through visual and systemic feedback alone

#### Scenario: Entering a scene before audio unlock
- **WHEN** a menu, intro, gameplay, or completion scene appears before the browser allows audio playback
- **THEN** the scene remains fully functional without sound
- **AND** the game does not throw errors or stall scene flow while waiting for audio unlock

#### Scenario: Changing scenes with active music
- **WHEN** the game changes between menu, intro, gameplay, and completion scenes
- **THEN** the outgoing sustained loop stops or is replaced cleanly before another sustained loop begins
- **AND** the game does not leave multiple scene music loops playing at the same time

### Requirement: Audio validation proves sustained music coverage and differentiation
The game SHALL validate not only that music and sound cues trigger, but also that the unlocked menu music and every currently playable stage use the approved asset-backed track mapping with explicit provenance, clean loop ownership, and recognizable differentiation. Validation for this music-replacement pass MUST cover the menu track, every current stage gameplay track, the source manifest, unlock-safe playback, and the continued presence of synthesized interaction cues and transition stingers where applicable.

#### Scenario: Validating source manifest integrity
- **WHEN** automated audio validation inspects the sustained music configuration for a build
- **THEN** it confirms that every mapped menu or stage track has a manifest entry with source, creator, license, original file name, and local asset path
- **AND** validation fails if any active sustained track is missing provenance or uses a disallowed license

#### Scenario: Comparing menu and stage music during validation
- **WHEN** automated coverage and playtest validation review the unlocked menu music plus the gameplay music for `forest-ruins`, `amber-cavern`, and `sky-sanctum`
- **THEN** the validation proves that each surface selects its mapped asset-backed track and that no two sustained loops remain active after a scene handoff
- **AND** the validation records that synthesized menu cues and transition stingers still trigger on their expected surfaces