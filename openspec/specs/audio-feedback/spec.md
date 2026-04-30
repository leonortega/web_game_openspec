# audio-feedback Specification

## Purpose
Define music and sound behavior that improves action readability, reward feedback, and stage identity.
## Requirements
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

### Requirement: Menus and transition surfaces provide synthesized audio feedback
The game SHALL use the synthesized audio system for menu navigation and non-gameplay transition surfaces so entry, confirmation, and completion moments feel consistent with gameplay feedback.

#### Scenario: Unlocking menu audio after player interaction
- **WHEN** the main menu is shown before the browser has granted audio playback
- **THEN** the menu remains fully usable without sound
- **AND** the game begins menu music or the next eligible menu cue only after the player performs a qualifying keyboard or pointer interaction

#### Scenario: Navigating menu actions
- **WHEN** the player changes the selected menu option, confirms an action, or backs out of `Help` or `Options` while audio is available
- **THEN** the game plays a distinct synthesized navigation, confirm, or back cue for that action
- **AND** those cues do not prevent the action from completing

#### Scenario: Showing transition celebration surfaces
- **WHEN** the stage intro or stage-clear surface appears while audio is available
- **THEN** the game plays the authored synthesized intro or completion stinger for that surface
- **AND** the stinger does not change the existing scene duration or auto-advance timing

### Requirement: Core player and threat events produce sound feedback
The game SHALL play synthesized sound effects for major gameplay events so player actions, powers, interactive objects, moving gameplay objects, and threats feel readable, responsive, and intentionally authored in a recognizable 8-bit style. Enemy-defeat and player-death interactions MUST continue to use the synthesized audio path unless another already-established repository path is explicitly required during apply. Thruster-impact defeats, projectile-based enemy defeats, survivable player damage, and fatal player death MUST remain audibly distinct from one another through cue shape, pitch contour, layering, envelope, or equivalent synthesized identity choices. Fatal player death MUST play a dedicated synthesized death cue once for that death event, and that cue MUST read as more final than the survivable damage cue without blocking the existing death or respawn flow.

#### Scenario: Performing a core movement or power action
- **WHEN** the player jumps, double-jumps, lands, dashes, or fires an equipped attack power
- **THEN** the game plays an appropriate synthesized cue for that action
- **AND** those action cues remain audibly distinct from damage, reward, and menu feedback

#### Scenario: Triggering an interactive gameplay object
- **WHEN** the player activates a spring platform, collapsing surface, reward block, or equivalent authored interactive object that changes movement or state
- **THEN** the game plays a synthesized cue that matches the interaction outcome

#### Scenario: Resolving a threat interaction
- **WHEN** the player defeats an enemy with boot-thruster impact, hits with a projectile, is hit by a threat, or a turret fires
- **THEN** the game plays a synthesized cue that matches the event outcome
- **AND** thruster-impact defeats, projectile defeats, and survivable player-hit cues remain audibly distinct from one another

#### Scenario: Hearing moving threats and moving objects
- **WHEN** an enemy, hazard, platform, or comparable gameplay object enters an authored movement or attack state that players need to read
- **THEN** the game provides a recognizable synthesized motion, charge, or actuation cue for that state without requiring constant uninterrupted playback

#### Scenario: Taking fatal damage
- **WHEN** the player loses the last remaining health and enters the death or respawn sequence
- **THEN** the game plays a dedicated synthesized death cue once for that death event
- **AND** the survivable damage cue is not replayed as the death cue

#### Scenario: Comparing defeat and death interactions
- **WHEN** a reviewer compares thruster-impact defeat, projectile defeat, survivable player damage, and fatal player death during active play
- **THEN** each interaction produces a recognizable synthesized cue with its own readable identity
- **AND** the stronger fatal-death cue remains compatible with the current synthesized audio path

### Requirement: Reward and progression events are reinforced by sound
The game SHALL use synthesized sound to emphasize research-sample pickups, power acquisition, survey-beacon activation, stage completion, and final-run congratulations. These cues MUST read as positive, authored 8-bit feedback rather than generic copies of one another. The fiction rename MUST NOT change which collectible, checkpoint, power, or completion events trigger those cues. When a stage exit accepts a valid completion overlap, the game MUST play a dedicated synthesized capsule-entry teleport cue at the start of that exit-finish sequence. That cue MUST remain distinct from pickup, power, checkpoint, damage, and results-surface celebration audio, and it MUST NOT block the bounded finish animation, the later stage-clear handoff, or the results-surface stinger.

#### Scenario: Collecting a reward
- **WHEN** the player collects a research sample or equivalent reward pickup
- **THEN** the game plays a positive pickup cue

#### Scenario: Revealing or taking a power reward
- **WHEN** the player reveals a power reward block or gains a power from a gameplay reward source
- **THEN** the game plays a recognizable positive power cue distinct from basic sample pickup feedback

#### Scenario: Activating a checkpoint
- **WHEN** the player activates a survey beacon
- **THEN** the game plays a recognizable checkpoint confirmation cue

#### Scenario: Reaching the stage exit
- **WHEN** the player completes a stage by entering a valid exit
- **THEN** the game plays a dedicated capsule-entry teleport cue as the exit-finish sequence starts
- **AND** that cue resolves without preventing the later completion handoff

#### Scenario: Clearing the final stage
- **WHEN** the player reaches the final stage results surface
- **THEN** the game plays a synthesized congratulatory completion cue or music phrase distinct from the normal stage-exit cue

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

### Requirement: Audio can communicate danger or timing
The game SHALL use sound cues to support readable telegraphs for selected hazards, enemies, or unstable terrain.

#### Scenario: Entering a telegraphed attack pattern
- **WHEN** a threat begins a readable wind-up or timing window
- **THEN** the game may play a warning or charge cue before the dangerous state resolves

#### Scenario: Triggering unstable terrain
- **WHEN** the player activates a collapsing or time-sensitive platform
- **THEN** the game provides sound feedback that the terrain state has changed

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

### Requirement: Motion-heavy sound feedback stays readable and selective
The game SHALL use event-based or cadence-gated synthesized cues for moving threats and moving gameplay objects so motion becomes audible once the source enters the active viewport or another already-supported view-relevant lead-margin, without becoming a constant wall of sound. Continuous movement alone MUST NOT cause unbounded cue spam every frame or simulation tick, and off-screen threat motion MUST remain silent until the threat becomes visible or otherwise immediately relevant to the visible play space. Existing authored lead-margin telegraphs, including the turret exception used to warn of imminent in-view fire, MAY remain audible slightly before full visibility so long as they do not broaden into generic off-screen enemy noise.

#### Scenario: A moving threat enters active view
- **WHEN** an enemy or hazard becomes visible in the active camera view while audio is available
- **THEN** the game may play a synthesized motion, presence, or charge cue for that visible state
- **AND** repeated motion for the same source remains rate-limited by cooldown, cadence, or state-change gating

#### Scenario: A threat remains outside view relevance
- **WHEN** an enemy or hazard is still outside the active view and outside any supported lead-margin telegraph window while audio is available
- **THEN** the game does not repeatedly emit that threat's motion cue

#### Scenario: A turret reaches its supported lead-margin telegraph window
- **WHEN** a turret reaches the existing lead-margin state that warns of imminent in-view fire while audio is available
- **THEN** the game may play the corresponding telegraph or firing cue before the turret is fully visible
- **AND** that exception does not change projectile timing, attack cadence, or broaden to unrelated enemy behaviors

#### Scenario: A moving gameplay object changes state
- **WHEN** a platform, launcher, shuttle, or other moving gameplay object starts moving, reverses, locks, releases, or resolves an interaction state while audio is available
- **THEN** the game plays a synthesized cue that matches that motion change
- **AND** the cue does not repeat continuously while the object remains in the same steady movement state

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

### Requirement: Sustained music cleanup removes obsolete synthesized loop authoring
The game SHALL keep synthesized audio only for menu interaction cues, gameplay feedback cues, and transition stingers while sustained menu and stage music remain exclusively asset-backed. Active menu and stage music configuration MUST NOT require synthesized sustained-loop theme metadata, phrase templates, cadence presets, or completion-phrase authoring as a fallback ownership path.

#### Scenario: Auditing sustained music configuration after the cleanup pass
- **WHEN** a reviewer inspects the current menu and stage music configuration for a build
- **THEN** sustained music ownership resolves only through the approved asset-backed menu and stage mappings
- **AND** no active menu or stage surface depends on synthesized sustained-loop theme metadata, phrase templates, cadence presets, or completion-phrase authoring

#### Scenario: Preserving synthesized cues and transition stingers
- **WHEN** the player navigates menus, performs supported gameplay actions, or reaches an intro or completion transition while audio is available
- **THEN** the game still plays the synthesized interaction cue or stinger required for that moment
- **AND** removing obsolete sustained-loop authoring does not suppress those synthesized cues

#### Scenario: Validating the cleaned-up audio ownership model
- **WHEN** automated audio validation reviews a playable build after this cleanup pass
- **THEN** it confirms that sustained music remains asset-backed and non-overlapping across scene changes
- **AND** it separately confirms that synthesized cues and transition stingers still trigger on their expected surfaces

### Requirement: Music volume setting is exposed as a multiplier for sustained music
The game SHALL interpret the `musicVolume` run-setting (numeric 0..1) as an authoring-friendly multiplier when applied to sustained music playback so that the effective multiplier used by the audio path is `multiplier = musicVolume * 10`. The options UI SHALL display both the percent and computed multiplier (for example: `Music 70% (x7.0)`) so authors can reason about relative asset loudness. Short synthesized cues and sampled SFX SHALL continue to use a linear 0..1 attenuation via `sfxVolume` and MUST NOT be affected by the music multiplier.

#### Scenario: Viewing the music setting in options
- **WHEN** the player opens `Options` and views the `Music` slider
- **THEN** the UI displays both the percent and the computed multiplier (for example: `Music 50% (x5.0)`)

#### Scenario: Applying the multiplier during playback
- **WHEN** sustained music assets or synthesized theme tones play during a scene
- **THEN** the audio playback code applies `gain = baseGain * clamp(musicVolume * 10, 0, 1)` or an equivalent clamped multiplier so author-adjusted loudness remains predictable and non-destructive

#### Notes
- Existing saved `musicVolume` values remain compatible (e.g., 0.7 → x7 multiplier).
- Implementations SHOULD cap applied gain to 1.0 to avoid excessive amplification beyond the audio system's normalized range.

