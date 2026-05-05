## MODIFIED Requirements

### Requirement: Phaser 4 migration preserves current generated presentation assets and audio cues
The migration SHALL preserve the current placeholder boot textures, scrollable menu help panel, vendored asset-backed menu and stage music, and synthesized gameplay cue coverage under Phaser 4 without depending on Phaser 3-only GeometryMask behavior, Phaser 3 Graphics texture-generation behavior, or direct sound-manager context internals. Any replacement implementation MUST keep the same authored UI affordances, help readability, browser audio-unlock behavior, per-surface music mapping, and cue coverage for player actions and hazards.

#### Scenario: Viewing the menu help panel
- **WHEN** the player opens the help view and scrolls through its content after the migration
- **THEN** the help text remains clipped to the intended viewport, the scrollbar reflects the same overflow behavior, and unrelated menu elements do not render inside the help window

#### Scenario: Unlocking sustained music and gameplay cues
- **WHEN** the player enters the menu or gameplay after migration and performs input that unlocks audio
- **THEN** the migrated game resumes audio when input unlocks it and plays the mapped asset-backed sustained music plus the same class of synthesized cue feedback as before the upgrade