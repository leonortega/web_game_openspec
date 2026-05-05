## ADDED Requirements

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