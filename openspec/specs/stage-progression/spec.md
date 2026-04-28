# stage-progression Specification

## Purpose
TBD - created by archiving change mvp-platform-game. Update Purpose after archive.
## Requirements
### Requirement: Stages have a clear start-to-exit completion flow
The game SHALL organize play into discrete stages with a defined start position, traversable route, intermediate gameplay segments, and completion exit. A stage MUST begin with a short pre-play presentation step followed by a short bounded in-world capsule-arrival appearance beat before active control starts. Fresh stage starts, including direct stage entry from the menu or replay flow and automatic advance into the next stage after a normal results handoff, MUST use that arrival beat. The stage-start arrival MUST present the same grounded capsule design used by the completion exit, MUST place that start cabin at a fixed grounded stage position separate from the player body, MUST reverse the exit-style disappearance language into an appearance or rematerialization beat, MUST keep the player non-interactive during that beat, and MUST continue into a short scripted walk-out from the cabin before the cabin resolves through a short door-close animation and active control begins. The fixed start cabin MUST remain in the world afterward as a non-interactive grounded prop at that same stage position. Checkpoint respawns within the same stage attempt MUST NOT replay the pre-play presentation or the stage-start capsule arrival sequence. Completion MUST flow through a readable in-world capsule-entry finish before continuing into the stage-clear results step. A stage MUST only be marked complete when the player reaches the exit in a valid active state and any authored lightweight stage objective for that stage is already complete. Stages without an authored lightweight stage objective MUST continue to accept valid exit contact immediately, but that accepted contact MUST start a short bounded exit-finish sequence before the normal stage-clear handoff. Stages with an authored lightweight stage objective MUST keep the route to that exit readable and MUST provide immediate in-stage feedback if the player touches the exit before the required objective is complete. The authored completion exit MUST remain a route-grounded endpoint with readable supporting footing or base geometry rather than a floating unsupported rectangle, and authored validation MUST reject exit placement that lacks that local support. The exit-finish sequence MUST keep the player non-interactive, MUST begin from that same grounded exit-cabin position, MUST play a short independent door-open animation on the exit cabin before the finish fully resolves, MUST visually resolve the capsule-entry or dematerialization moment before the player disappears, MUST NOT restore normal player visibility after that disappearance begins, and MUST hand off to the normal stage-clear flow without changing stage ordering, unlock behavior, or objective gating semantics.

#### Scenario: Beginning a stage
- **WHEN** the player enters a fresh stage attempt
- **THEN** the game shows a short stage presentation before gameplay begins in an active state
- **AND** that presentation hands off into a short capsule-arrival appearance beat anchored to a fixed grounded start-cabin position before player control starts

#### Scenario: Auto-advancing into the next stage
- **WHEN** the player completes a non-final stage and the game advances into the next stage
- **THEN** the next stage still begins through the normal pre-play presentation flow
- **AND** the new stage uses the same bounded fixed-cabin arrival and scripted walk-out before active control starts

#### Scenario: Respawning from a checkpoint
- **WHEN** the player dies after activating a checkpoint and respawns within the same stage attempt
- **THEN** the game restores play from the active checkpoint without replaying the pre-stage presentation
- **AND** the checkpoint respawn does not trigger the stage-start fixed-cabin arrival sequence or scripted walk-out

#### Scenario: Walking out from the start cabin
- **WHEN** the stage-start arrival finishes materializing the player inside the fixed grounded start cabin
- **THEN** the player automatically performs a short deterministic walk-out from that cabin while remaining non-interactive
- **AND** normal active play does not begin until that walk-out and the following cabin close beat resolve

#### Scenario: Closing the persistent start cabin
- **WHEN** the scripted start-cabin walk-out completes on a fresh stage start
- **THEN** the remaining start cabin plays a short bounded door-close animation before active control begins
- **AND** the cabin stays in the world afterward as a non-interactive grounded prop at its fixed stage position

#### Scenario: Advancing through a long stage
- **WHEN** the player moves from one major stage segment to the next
- **THEN** the game preserves a clear sense of forward progress toward the exit

#### Scenario: Reaching the exit on a standard stage
- **WHEN** the player reaches the exit while alive on a stage without an authored lightweight objective
- **THEN** the stage is marked complete and the bounded capsule-entry finish begins
- **AND** the normal stage-clear flow begins after that finish resolves

#### Scenario: Reaching the exit before completing the objective
- **WHEN** the player reaches the exit while alive on a stage whose authored lightweight objective is still incomplete
- **THEN** the stage is not marked complete
- **AND** the game presents immediate feedback that the objective still remains

#### Scenario: Reaching the exit after completing the objective
- **WHEN** the player reaches the exit while alive on a stage whose authored lightweight objective is complete
- **THEN** the stage is marked complete and the bounded capsule-entry finish begins
- **AND** the normal stage-clear flow begins after that finish resolves

#### Scenario: Watching the exit finish resolve
- **WHEN** a valid stage exit overlap starts the capsule-entry finish
- **THEN** player control stops and the player disappears through a short in-world teleport or dematerialization beat
- **AND** the grounded exit cabin performs a short independent door-open beat during that finish window
- **AND** normal player-part visibility does not resume before the results handoff
- **AND** the game does not create an alternate completion branch or require extra player input before the results handoff

#### Scenario: Rejecting an unsupported exit endpoint
- **WHEN** authored stage validation evaluates a completion exit whose rectangle lacks readable supporting footing or base geometry on the intended route
- **THEN** validation rejects that stage data before runtime use

### Requirement: Selected stages can author lightweight mission objectives
The game SHALL allow a bounded subset of stages to author one lightweight mission objective using existing contact, volume, checkpoint, or activation patterns instead of a separate mission system. For this change, supported objective fiction MUST be limited to restoring a beacon, reactivating a relay, or powering a lift tower. Each objective-authored stage MUST track a single stage-local objective that starts incomplete on a fresh attempt, becomes complete when its authored target interaction succeeds, and remains complete for the rest of that stage attempt including later checkpoint respawns. Manual restart or a fresh stage start MUST reset that objective to incomplete. The game MUST communicate objective briefing and incomplete-exit reminders through the existing transient stage-message flow rather than requiring a new mission screen or separate persistent HUD panel. During active play, that transient stage-message flow MUST use the lower-left HUD safe-area lane close to the bottom-left edge so briefings and reminders stay readable without displacing the primary top HUD band or colliding with persistent readouts. That same transient flow MAY also communicate checkpoint activation, route reveal, temporary bridge activation, power pickup, and major collectible milestone feedback, but it MUST NOT be seeded with long authored stage hints or segment-focus text on stage start and MUST NOT narrate generic combat outcomes that do not change player decisions.

#### Scenario: Starting an objective-authored stage
- **WHEN** the player begins a stage that authors a lightweight mission objective
- **THEN** the game communicates the current objective through the existing lower-left stage-message flow near the bottom-left edge at the start of active play

#### Scenario: Starting a non-objective stage
- **WHEN** the player begins a stage without an authored lightweight mission objective
- **THEN** the transient message lane does not open with a long authored route summary
- **AND** the player still gets persistent stage and segment context from the existing HUD labels

#### Scenario: Completing an authored objective target
- **WHEN** the player triggers the authored contact, volume, checkpoint, or activation target bound to that stage objective
- **THEN** the stage objective becomes complete for the current attempt

#### Scenario: Reminding the player about an incomplete objective
- **WHEN** the player reaches the exit while the authored lightweight objective is still incomplete
- **THEN** the reminder reuses the transient lower-left stage-message flow near the bottom-left edge during active play
- **AND** the game does not create a separate persistent mission panel for that reminder

#### Scenario: Respawning after objective completion
- **WHEN** the player dies after completing the authored stage objective and then respawns from a checkpoint in the same stage attempt
- **THEN** the objective remains complete after the respawn

#### Scenario: Starting a fresh attempt after prior objective progress
- **WHEN** the player manually restarts the stage or begins a new attempt after previously completing its lightweight objective
- **THEN** the objective resets to incomplete for that new attempt

#### Scenario: Reaching a new authored segment
- **WHEN** the player crosses into a later authored segment during active play
- **THEN** the persistent segment label continues updating
- **AND** the transient message lane does not show the segment focus as a separate banner

### Requirement: Checkpoints update respawn progress within a stage
The game SHALL support in-level checkpoints that update the player's respawn location after activation. Stages targeting the long-form duration requirement MUST include enough checkpoint coverage that a late-stage failure does not force the player to replay most of the stage. Player-facing gameplay and stage messaging for those checkpoints MUST present them as survey beacons while preserving the existing checkpoint activation, respawn, and persistence behavior. A checkpoint MUST appear on an intended reachable route before the terminal exit it serves and MUST NOT be positioned past the stage exit door or other stage-completion trigger. Every valid survey beacon MUST be visibly grounded on stable authored support at the same route location where it is activated, and checkpoint recovery MUST restore the player from that grounded support contract rather than from an unchecked beacon rectangle or a respawn-only vertical offset. A checkpoint respawn within the same stage run MUST preserve already collected finite level coins and the current stage coin total, while fresh stage starts or manual restarts MUST rebuild collectible state normally.

#### Scenario: Activating a checkpoint
- **WHEN** the player touches an inactive survey beacon
- **THEN** that checkpoint becomes the active respawn point for the current stage
- **AND** the active beacon remains visibly grounded on the same stable authored support where it was reached

#### Scenario: Dying after checkpoint activation
- **WHEN** the player dies after activating a survey beacon
- **THEN** the game respawns the player at that checkpoint
- **AND** the recovery position resolves from the grounded authored support at that survey beacon instead of from a respawn-only Y correction

#### Scenario: Respawning with prior coin progress
- **WHEN** the player respawns from an activated survey beacon after collecting research samples earlier in the same stage run
- **THEN** the checkpoint restore keeps those collected coins removed and preserves the current stage coin total

#### Scenario: Failing late in a long stage
- **WHEN** the player fails in a late stage segment after activating the nearest survey beacon
- **THEN** the active checkpoint places them near that portion of progress instead of near the stage start
- **AND** that late-stage recovery still starts from grounded stable support on the intended route

#### Scenario: Approaching the final exit
- **WHEN** authored stage data places checkpoints near the final exit route
- **THEN** every valid checkpoint remains before the exit trigger on an intended reachable route
- **AND** no checkpoint is authored beyond the point where stage completion already occurs

#### Scenario: Restarting the stage after prior checkpoint progress
- **WHEN** the player manually restarts the stage or begins a fresh stage attempt
- **THEN** the stage rebuilds its collectible state instead of preserving prior survey-beacon coin progress

### Requirement: Stages support optional collectible rewards
The game SHALL include collectible items within stages that reward exploration or clean traversal without blocking stage completion. In long-form stages, collectibles MUST be distributed across early, middle, and late segments so optional rewards remain relevant throughout the run. Player-facing pickup messaging, HUD progress labels, and transition totals for those optional rewards MUST present them as research samples without changing collectible counts or broader progression thresholds.

#### Scenario: Collecting an item
- **WHEN** the player touches a research sample pickup
- **THEN** the item is removed from the stage and added to the player's current collection total

#### Scenario: Completing a stage without all collectibles
- **WHEN** the player reaches the exit without collecting every research sample
- **THEN** the stage still completes successfully

#### Scenario: Optional content appears beyond the opening segment
- **WHEN** the player reaches middle or late portions of a long stage
- **THEN** optional research samples are still available in those later segments

### Requirement: Stage completion unlocks forward progression
The game SHALL unlock the next stage in the MVP sequence after the current stage is completed, and the normal non-final completion flow SHALL continue automatically toward that next stage after the stage-clear results screen.

#### Scenario: Completing an early stage
- **WHEN** the player completes a stage that is not the final stage in the MVP sequence
- **THEN** the next stage becomes available and the game continues automatically after the results screen

#### Scenario: Returning after prior completion
- **WHEN** the player returns to the stage selection flow after completing a stage
- **THEN** previously unlocked stages remain available

### Requirement: Main stages sustain at least 20 minutes of first-time play
The game SHALL author each main stage so that an average first-time player requires at least 20 minutes to complete it under intended play conditions. The stage duration MUST be achieved through meaningful gameplay content such as traversal segments, hazards, enemy encounters, optional detours, and checkpointed sub-goals rather than empty travel distance.

#### Scenario: First-time stage completion target
- **WHEN** a main stage is playtested by a first-time average player following the intended route
- **THEN** the stage takes at least 20 minutes to complete

#### Scenario: Stage duration is driven by gameplay content
- **WHEN** stage content is extended to meet the duration target
- **THEN** the added time comes from authored gameplay segments and not from long empty movement sections

### Requirement: Stages are divided into multiple pacing segments
The game SHALL structure each main stage into multiple authored segments with distinct challenge emphasis, recovery beats, or environmental transitions so that progression remains readable across the extended route length. Each main stage MUST include additional playable space beyond its current critical path through at least one optional detour, elevated alternate line, or hidden secret route that reconnects to the main route later within the same stage. At least one supported hidden secret route in a qualifying main stage MUST pass through either an abandoned micro-area or an optional sample cave. An abandoned micro-area MUST be a compact off-route authored pocket that reads as a previously used, partially collapsed, or partially scavenged expedition space and MUST contain at least one meaningful reward, encounter, recovery, or traversal beat. An optional sample cave MUST be a hidden cave-like reward pocket that contains research samples or equivalent optional reward value and returns to the primary route either by backtracking safely or by using a hidden connector that rejoins downstream. Any secret exit used by these routes MUST mean a hidden connector or branch exit that rejoins the critical path later in the same stage and MUST NOT create a second stage-completion exit, alternate clear outcome, branching unlock, or separate stage-clear path. These extra spaces MUST add meaningful traversal, encounter, recovery, or collectible value rather than empty travel distance.

#### Scenario: Progressing through an expanded main stage
- **WHEN** the player advances through a main stage
- **THEN** they encounter multiple recognizable authored segments with clear pacing changes instead of one continuous challenge band

#### Scenario: Taking a hidden reconnecting route
- **WHEN** the player discovers a hidden branch off the main route
- **THEN** that branch leads through an abandoned micro-area or optional sample cave with meaningful optional value
- **AND** the route rejoins the primary stage flow later without becoming mandatory for completion

#### Scenario: Using a secret exit
- **WHEN** the player leaves a hidden branch through a secret exit
- **THEN** that exit reconnects to the same stage's critical path downstream
- **AND** it does not count as a second stage-completion exit or alternate clear outcome

#### Scenario: Staying on the critical path
- **WHEN** the player ignores optional detours and follows the intended main route
- **THEN** the stage remains fully completable without requiring the optional branch content

### Requirement: Secret-route authoring remains discoverable, rewarding, and verifiable
The game SHALL author expedition secret routes so their discovery depends on authored layout cues and currently supported traversal mechanics rather than on new tracked runtime discovery state. Each authored secret route MUST present a readable clue, opening, elevation change, traversal affordance, or reward glimpse from a traversable part of the stage so that discovery feels earned rather than arbitrary. Each route MUST provide meaningful optional reward value through research samples, a worthwhile reward pocket, or a distinct traversal and recovery beat, and MUST reconnect to the main route later without trapping the player in a dead-end that breaks forward progression. Timed-reveal secret routes MUST additionally present a nearby reveal cue and scanner activator that make the route legible before the timed window starts, and verification MUST confirm both that the route can be discovered and used and that the main route remains safe and completable when the timed branch is skipped or expires. Authored validation and scripted playtest coverage MUST confirm that the route can be discovered, that its optional reward value is reachable, that the main route remains completable when the secret route is skipped, and that the later reconnection behaves as authored.

#### Scenario: Loading a valid secret route
- **WHEN** a stage defines a secret route with a readable discovery cue, optional reward value, and a later reconnection point
- **THEN** authored validation accepts that route as a valid same-stage optional branch

#### Scenario: Verifying a timed-reveal secret route
- **WHEN** a stage defines a timed-reveal secret route with a nearby reveal cue, scanner activator, optional reward value, and downstream reconnection
- **THEN** validation and scripted coverage accept it only if the route becomes legible before timing begins and the main route remains safe when the branch is skipped or expires

#### Scenario: Rejecting a non-reconnecting secret route
- **WHEN** a stage defines a hidden branch that has no safe return, no downstream reconnection, or no meaningful optional value
- **THEN** authored validation or scripted coverage rejects the route until the branch is made rewarding and reconnectable

#### Scenario: Discovering and skipping during coverage
- **WHEN** scripted playtest coverage evaluates a stage with an authored secret route
- **THEN** the coverage demonstrates both that the route can be discovered and rewarded
- **AND** that the stage still completes correctly when the player stays on the main route instead

### Requirement: Timed-reveal route state composes reveal persistence with temporary activation reset
The game SHALL treat timed-reveal secret routes as a composition of reveal-platform discovery state and scanner-triggered temporary activation state. The reveal-discovery portion of a timed-reveal route MUST follow the current reveal-platform checkpoint behavior: it starts hidden on a fresh attempt, becomes discovered for the rest of the current attempt after the reveal cue is triggered, and is restored on later checkpoint respawns only when the checkpoint was activated after that reveal occurred. The timed-activation portion of the same route MUST follow the current temporary-bridge timing behavior: scanner-triggered support starts inactive on a fresh attempt, begins timing only after scanner activation, and MUST reset to inactive with no running timer on death, checkpoint respawn, manual restart, or a fresh stage start. A checkpoint snapshot MUST NOT restore a running timer or active temporary support for a timed-reveal route, even when the route's reveal-discovery state persists.

#### Scenario: Revealing before a checkpoint and dying after activation
- **WHEN** the player reveals a timed-reveal route, activates a checkpoint, later activates the route's scanner window, and then dies
- **THEN** respawning from that checkpoint restores the route as revealed
- **AND** the timed support returns inactive until the scanner is triggered again

#### Scenario: Activating a checkpoint before revealing the route
- **WHEN** the player activates a checkpoint before discovering a timed-reveal route and later reveals and uses it before dying
- **THEN** respawning from that earlier checkpoint restores the route as undiscovered and inactive

#### Scenario: Restarting after prior use
- **WHEN** the player restarts the stage or begins a fresh attempt after previously discovering and activating a timed-reveal route
- **THEN** the route starts again from its fresh-attempt hidden and inactive baseline

### Requirement: Stages include terrain variation that changes pacing
The game SHALL structure stages with meaningful platform variation such as moving traversal, unstable surfaces, full-platform brittle or sticky variants, spring traversal, reveal-platform routes, scanner-switch temporary bridges, activation-node magnetic platforms, or bounded gravity-field traversal so progress is shaped by more than static jumps and enemy placement. For qualifying empty-platform traversal sections, stage progression authoring MUST distribute mechanic families across early, middle, and late route segments so variety ramps over time instead of clustering in a single stage slice. A qualifying stage MUST NOT satisfy this requirement by using only jump-related beats in every empty-platform section.

#### Scenario: Reaching a terrain-driven segment
- **WHEN** the player enters a segment built around dynamic or variant-driven platforms
- **THEN** the stage pacing shifts through traversal timing, positioning, or movement planning

#### Scenario: Recovering after a terrain challenge
- **WHEN** the player clears a high-pressure platform-variation section
- **THEN** the stage provides a readable transition or recovery beat before the next escalation

#### Scenario: Reviewing empty-platform variety distribution
- **WHEN** authored stage validation checks qualifying empty-platform traversal sections across early, middle, and late stage segments
- **THEN** validation confirms mechanic-family variety is distributed across progression segments instead of concentrated in one segment only

#### Scenario: Rejecting jump-only empty-platform progression
- **WHEN** qualifying empty-platform traversal sections across a stage are authored as jump-only beats without broader mechanic families
- **THEN** validation rejects the stage authoring before runtime use

### Requirement: Optional rewards can support progression systems
The game SHALL allow optional stage rewards such as collectibles to contribute to broader progression without making full collection mandatory for stage completion.

#### Scenario: Completing a stage with partial rewards
- **WHEN** the player reaches the exit without collecting every optional item
- **THEN** the stage still completes successfully

#### Scenario: Reaching a progression threshold through rewards
- **WHEN** the player accumulates enough optional rewards for a defined unlock milestone
- **THEN** the game grants the associated progression benefit

### Requirement: Checkpoints are placed on safe and stable footing
The game SHALL place checkpoints only on authored locations that are safely reachable and supported by stable terrain or equally stable route support that is visible to the player. A checkpoint MUST read as grounded at its beacon base and MUST NOT be positioned on moving, falling, temporary, hidden, or otherwise unsafe footing. A checkpoint MUST avoid overlapping immediate enemy or hazard threat zones. The visible beacon footing and the checkpoint respawn anchor MUST resolve from the same authored grounded-support contract at that route location rather than from separate trigger-box expansion, render-only placement nudges, respawn-only Y correction, invisible helper support, default runtime snap-to-ground normalization, or globally loosened support tolerances. Validation, stage building, runtime setup, and focused checkpoint audit coverage MUST reject placements that depend on those cheats or on isolated one-off content nudges instead of reusable grounded-support guardrails.

#### Scenario: Reaching a checkpoint
- **WHEN** the player arrives at a checkpoint location
- **THEN** the checkpoint stands on visible stable support and can be activated without requiring unsafe contact

#### Scenario: Respawning at a checkpoint
- **WHEN** the player respawns from an activated checkpoint
- **THEN** they return to a safe location that does not immediately drop them into danger
- **AND** that recovery location still corresponds to the beacon's grounded support rather than to hidden helper geometry, runtime snap correction, or a respawn-only offset

#### Scenario: Rejecting an unsupported checkpoint
- **WHEN** authored stage validation evaluates a checkpoint whose beacon base lacks visible stable support on the intended route or only passes by using hidden helper support, trigger-box expansion, render-only placement nudges, respawn-only offset correction, or runtime snap-to-ground normalization
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Auditing authored checkpoints under grounded guardrails
- **WHEN** focused validation or checkpoint audit coverage runs across authored stage checkpoints after the grounded-support guardrails are introduced
- **THEN** every checkpoint either passes the reusable grounded-support rule or is reported for authored correction
- **AND** each valid checkpoint keeps its visible beacon footing and respawn anchor aligned to the same stable authored support

### Requirement: Authored interactives remain on intended routes
The game SHALL place collectibles and other authored interactives only in positions that belong to intended reachable traversal routes or optional authored detours. Any authored interactive or route prop that visually rests on floor support, including grounded checkpoint-adjacent rewards or comparable floor-anchored static stage elements, MUST already use visible authored support in source data instead of relying on runtime snap, hidden helper support, or render-only vertical correction. Punchable interactive blocks MUST leave enough vertical clearance between the floor and the block for the player to reach them from below, and the intended route after collecting any reward from a block MUST remain safely traversable without requiring immediate enemy contact, including contact with non-stompable hazard enemies.


#### Scenario: Spotting an interactive element
- **WHEN** the player sees a collectible or similar authored interactive
- **THEN** there is a valid reachable route to that element within the intended stage flow

#### Scenario: Loading a floor-anchored route prop or interactive
- **WHEN** a stage loads an authored interactive or static route prop that is intended to sit on local floor support
- **THEN** that object resolves from visible authored support at the same route location
- **AND** it does not depend on hidden support, snap fallback, or render-only Y nudges to look grounded

#### Scenario: Punching a block from below
- **WHEN** the player jumps upward beneath an interactive block
- **THEN** the block is reachable from below without requiring an impossible jump arc

#### Scenario: Continuing after collecting a coin
- **WHEN** the player collects a coin reward from an authored block
- **THEN** the intended route ahead remains safely traversable without forcing an immediate enemy hit or unavoidable contact with a hazard enemy

### Requirement: Reveal-platform traversal state follows attempt and checkpoint progression
The game SHALL treat reveal-platform discovery as traversal state within the current stage attempt. Every reveal platform MUST start hidden and non-solid on a fresh attempt. When the player enters the linked reveal volume, that platform MUST become visible and solid for the rest of the current attempt. If the player activates a checkpoint after that reveal occurs, the checkpoint state MUST preserve the revealed platform and restore it on later respawns from that checkpoint. If the player respawns from a checkpoint that was activated before the reveal occurred, or starts a fresh attempt, the platform MUST reset to hidden and non-solid.

#### Scenario: Revealing a platform before activating a checkpoint
- **WHEN** the player reveals a platform and then activates a checkpoint in the same attempt
- **THEN** later respawns from that checkpoint restore the platform in its revealed and solid state

#### Scenario: Activating a checkpoint before revealing a platform
- **WHEN** the player activates a checkpoint and only later reveals a platform before dying
- **THEN** respawning from that earlier checkpoint resets the platform to hidden and non-solid

#### Scenario: Starting a fresh attempt after a prior reveal
- **WHEN** the player restarts the stage or begins a new attempt after previously revealing a platform
- **THEN** each reveal platform starts hidden and non-solid again until its reveal volume is triggered

### Requirement: Temporary bridge state resets on respawn and fresh attempts
The game SHALL treat scanner-switch temporary bridges as live traversal timing state rather than checkpoint-persistent route discovery. Every scanner switch and temporary bridge MUST start inactive, hidden, and non-solid on a fresh attempt. Death, checkpoint respawn, and manual stage restart MUST rebuild temporary bridge state from that inactive baseline instead of preserving any prior activation or remaining timer value. A checkpoint snapshot MUST NOT restore an already active temporary bridge, even if the checkpoint was activated while that bridge was live before the player died.

#### Scenario: Dying after activating a temporary bridge
- **WHEN** the player activates a scanner switch, starts its linked bridge timer, and then dies before completing the route
- **THEN** the next life restores the scanner switch and bridge as inactive, hidden, and non-solid until retriggered

#### Scenario: Respawning from a later checkpoint after bridge activation
- **WHEN** the player activates a temporary bridge and then reaches a checkpoint before dying later in the same stage
- **THEN** respawning from that checkpoint does not preserve the bridge activation or remaining timer and requires the bridge to be retriggered

#### Scenario: Starting a fresh attempt after prior use
- **WHEN** the player restarts the stage or begins a fresh attempt after previously activating a temporary bridge
- **THEN** every scanner switch and temporary bridge starts again from its inactive, hidden, and non-solid state

### Requirement: Activation-node magnetic platform state resets on respawn and fresh attempts
The game SHALL treat activation-node magnetic platforms as live traversal power state rather than checkpoint-persistent route discovery. Every activation node and linked magnetic platform MUST start inactive, visibly dormant, and non-solid on a fresh attempt. Death, checkpoint respawn, and manual stage restart MUST rebuild activation-node and magnetic-platform state from that dormant baseline instead of preserving prior powered state. A checkpoint snapshot MUST NOT restore a previously powered magnetic platform, even if the checkpoint was activated after its linked node had already been triggered. Stages that use this mechanic MUST remain safely completable when the powered route is skipped or resets on retry, either because the magnetic route is optional or because the activation node can be re-encountered before the route is required again.

#### Scenario: Dying after powering a magnetic platform
- **WHEN** the player triggers an activation node, powers its linked magnetic platform, and then dies before finishing the route
- **THEN** the next life restores the node and platform to their dormant, non-solid baseline until retriggered

### Requirement: Terrain readability cues remain covered by the verification path
The game SHALL keep regression coverage for the readability of existing brittle and sticky platform variants while also confirming that the current shipped main campaign once again contains live brittle and sticky rollout. The documented verification path for terrain-variant behavior, presentation changes, or campaign stage-authoring changes MUST include automated authored-stage coverage that confirms Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array each contain at least one live brittle or sticky platform variant and that the combined main-stage rollout includes at least one `brittleCrystal` beat and at least one `stickySludge` beat. That same verification path MUST continue to confirm that brittle and sticky variants remain visually distinguishable in play and that brittle warning and post-break presentation reset back to the intact readable baseline on retry, checkpoint respawn, or fresh attempts. This verification path MAY use targeted authored-stage tests, bounded analysis helpers, or other automated checks and MUST NOT depend on reviving legacy overlay data.

#### Scenario: Verifying readable terrain cues in current main-stage rollout
- **WHEN** automated terrain-variant coverage runs for campaign authoring or terrain presentation changes
- **THEN** it confirms Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array each contain at least one live brittle or sticky platform variant
- **AND** it confirms the combined current main-stage rollout includes both `brittleCrystal` and `stickySludge`

#### Scenario: Verifying readable live terrain cues in campaign coverage
- **WHEN** automated terrain-variant coverage exercises current shipped main-stage brittle or sticky sections
- **THEN** it confirms those variant surfaces are visually distinguishable in play rather than hidden under unchanged normal-platform presentation

#### Scenario: Verifying brittle readability after retry
- **WHEN** coverage triggers a brittle crystal warning or break and then retries from a respawn or fresh attempt
- **THEN** the brittle surface returns to its intact readable baseline presentation for that new attempt

### Requirement: Brittle crystal floor state resets with attempt and checkpoint recovery
The game SHALL treat brittle crystal floor breakage as live traversal state rather than checkpoint-persistent route discovery. Every brittle crystal floor MUST begin intact and solid on a fresh attempt. Death, checkpoint respawn, and manual stage restart MUST restore every brittle crystal floor to its intact untriggered state, regardless of whether the floor had already warned or broken earlier in that run. A checkpoint snapshot MUST NOT preserve a brittle floor's warned, broken, or partially expired state.

#### Scenario: Dying after breaking a brittle floor
- **WHEN** the player triggers and breaks a brittle crystal floor and then dies before finishing the route
- **THEN** the next life restores that floor as intact and untriggered

#### Scenario: Respawning from a later checkpoint after brittle-floor use
- **WHEN** the player breaks a brittle crystal floor and later dies after reaching a checkpoint
- **THEN** respawning from that checkpoint does not preserve the brittle floor's warned or broken state

#### Scenario: Starting a fresh attempt after prior brittle-floor use
- **WHEN** the player restarts the stage or begins a new attempt after previously triggering a brittle crystal floor
- **THEN** every brittle crystal floor starts again as intact and untriggered until top-surface contact triggers it

### Requirement: Authored brittle and sticky data migrates to platform variants only
The game SHALL remove authored brittle crystal and sticky sludge support from separate `terrainSurfaces` overlays, `terrainSurfaceIds` references, and related terrain-surface schema before runtime setup. Supported stage data for these terrain types MUST identify the variant on the platform itself, MUST use that one platform record as the source of truth for validation, runtime, rendering, and route references, and MUST reject legacy terrain-surface authoring for brittle or sticky content. This migration MUST include authored stage catalog data, builders, validation fixtures, runtime fixtures, and scripted playtest fixtures that currently assume terrain-surface collections or IDs.

#### Scenario: Loading legacy overlay-authored brittle or sticky terrain
- **WHEN** a stage still defines brittle crystal or sticky sludge through separate terrain-surface overlays, collections, or identifier lists
- **THEN** authored validation rejects that stage data before runtime use

#### Scenario: Loading migrated platform-variant terrain
- **WHEN** a stage defines brittle crystal or sticky sludge as full-platform variant data on supported platforms
- **THEN** the stage accepts that data for validation, runtime, rendering, and route references from the same authored platform source

### Requirement: Terrain-variant migration remains covered by regression verification
The game SHALL keep brittle and sticky platform-variant migration verifiable through automated tests and scripted playtest coverage without relying on the current main campaign stages to supply live brittle or sticky routes. Regression coverage MUST include validation checks for legacy overlay or terrain-surface-reference rejection, runtime checks for brittle state transitions on full-platform variants, controller checks that sticky no longer modifies jump strength, and scripted or automated stage coverage that confirms migrated authored data appears with matching runtime and rendering extents and with platform-centric route references. The same verification path MUST also confirm that current main-stage green-top routes in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array no longer author `brittleCrystal` or `stickySludge` as hidden terrain behavior under plain normal-platform presentation.

#### Scenario: Running automated regression coverage for migrated terrain variants
- **WHEN** automated tests run after brittle and sticky have been migrated to platform variants
- **THEN** the suite verifies brittle state behavior, sticky grounded drag behavior, and rejection of legacy overlay authoring or terrain-surface references

#### Scenario: Running scripted stage coverage for migrated terrain variants
- **WHEN** scripted playtest coverage evaluates a stage with brittle or sticky platform variants
- **THEN** the coverage confirms the migrated stage data, runtime behavior, rendered platform footprint, and platform-centric route references stay aligned

#### Scenario: Auditing current main-stage green routes
- **WHEN** validation or scripted campaign coverage evaluates Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array
- **THEN** plain green-top route platforms in those stages are not authored with `brittleCrystal` or `stickySludge`
- **AND** those stages do not preserve hidden terrain-mechanic behavior under unchanged normal-platform visuals

### Requirement: Unified platform surface-mechanic rollout remains covered by verification
The game SHALL keep regression coverage for platform-owned `brittleCrystal` and `stickySludge` surface mechanics while confirming that current shipped main stages use spring platforms as the only launch-platform family. The documented verification path for platform-surface behavior, stage-authoring changes, or presentation changes MUST include automated authored-stage coverage that confirms current shipped rollout still includes live brittle or sticky beats, includes live spring-platform beats across the current main campaign, and no longer encodes `bouncePod`, `gasVent`, launcher annotations, or unchanged plain-static stand-ins where converted launch beats are expected. This verification path MAY use targeted authored-stage tests, bounded analysis helpers, or other automated checks and MUST NOT require scripted playtest coverage or manual gameplay proof.

#### Scenario: Verifying terrain and spring rollout
- **WHEN** automated stage-authoring coverage runs for platform-surface or launch-platform changes
- **THEN** it confirms live brittle or sticky rollout still exists in the shipped main campaign
- **AND** it confirms the current shipped rollout includes live spring-platform beats across current main stages

#### Scenario: Verifying bounce and gas retirement
- **WHEN** automated validation or authored-stage analysis audits converted launch-platform beats
- **THEN** it confirms shipped-stage data no longer uses `bouncePod`, `gasVent`, or launcher annotations
- **AND** it confirms those beats are not implemented as unchanged plain support or token spring overlays

### Requirement: Gravity-field traversal stays stateless, bounded, and respawn-safe
The game SHALL treat gravity inversion columns and anti-grav streams as always-authored traversal geometry rather than as discovered, timed, or checkpoint-persistent route state. Every gravity field MUST begin each fresh attempt in its authored always-on baseline with no activation, cooldown, or saved traversal state. Checkpoint respawn and manual restart MUST rebuild gravity-field behavior solely from authored geometry and the player's restored position. Checkpoints used near gravity-field sections MUST place the player on stable support outside immediate forced field motion, and authored validation plus scripted playtest coverage MUST confirm that the Halo Spire Array sky rollout remains readable, completable, and reset-consistent after respawn or restart.

#### Scenario: Respawning near a gravity-field section
- **WHEN** the player dies after using an authored gravity inversion column or anti-grav stream and respawns from a checkpoint in that stage
- **THEN** the field behavior resumes from its always-on authored baseline without any preserved activation or temporary state

#### Scenario: Starting a fresh attempt after prior field use
- **WHEN** the player restarts the stage or begins a fresh attempt after previously traversing a gravity-field route
- **THEN** every gravity inversion column and anti-grav stream behaves exactly as authored with no carried-over runtime state

#### Scenario: Activating a checkpoint near a gravity-field route
- **WHEN** the player reaches a checkpoint associated with a gravity-field traversal section
- **THEN** the checkpoint stands on stable support and does not respawn the player into immediate forced airborne field motion

#### Scenario: Validating the bounded rollout
- **WHEN** authored validation or scripted playtest coverage evaluates the Halo Spire Array sky route that uses gravity fields
- **THEN** it accepts the route only if the section remains readable, completable, and bounded to the intended stage-authored rollout

### Requirement: Main-stage terrain and gravity rollout stays authored and verifiable
The game SHALL author every current main stage with at least one platform-variant section and at least one gravity-field section that satisfy the platform-variation contract for that stage's route role. Validation MUST reject any current main stage that omits platform-variant authored data, omits gravity-field authored data, or places those mechanics only in unreadable dead-end space disconnected from the intended route or optional reconnecting branch. Scripted or automated playtest coverage MUST exercise at least one authored platform-variant beat and one authored gravity-field beat in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array, and those checks MUST confirm the routes remain readable, completable, and reset-consistent across death, checkpoint respawn, and fresh attempts.

#### Scenario: Loading a main stage with missing rollout data
- **WHEN** a current main stage is authored without either a platform-variant section or a gravity-field section
- **THEN** validation rejects that stage before runtime use

#### Scenario: Running campaign rollout coverage
- **WHEN** scripted or automated playtest coverage runs for the current three-stage campaign
- **THEN** the suite exercises one platform-variant beat and one gravity-field beat in each main stage
- **AND** it confirms those sections remain completable after retry or respawn

### Requirement: Gravity capsule activation resets on retry and stays authorably reachable
The game SHALL treat enclosed gravity room disable buttons and linked room sections as live traversal activation state rather than checkpoint-persistent route discovery. Every enclosed gravity room MUST begin with its linked field active on a fresh attempt, and death, checkpoint respawn, or manual stage restart MUST rebuild that room from the same active baseline instead of preserving prior disabled state. A checkpoint snapshot MUST NOT restore a previously disabled enclosed gravity room, even if the checkpoint was reached after the room had been disabled. Authored validation MUST accept an enclosed gravity room only when its side-wall entry opening lies on an intended reachable route segment, that entry opening has a reachable exterior-side approach path on the authored route, its side-wall exit opening has both a reachable interior-side route through the room and a usable exterior-side reconnect after the player leaves the room, and its interior disable button is reachable after entering the room while the field is still active. That active-field button route MUST remain readable with the room's inverse jump semantics and existing contact interaction rules rather than depending on a legacy normal-jump assumption, a new input, a jump-triggered gravity toggle, or a dedicated compliance-only support piece. Its shell fully contains the linked full-room player gravity volume and all authored room-local content, and no authored enemy, moving platform, or other traversal content path intrudes through sealed shell wall bands outside the authored door openings. The full bottom shell edge of an enclosed gravity room MUST remain sealed, and validation MUST reject any doorway or pass-through that still exists on that bottom edge. Authored validation MUST NOT reject a gravity room solely because it contains an enemy inside the room. Instead, validation MUST accept interior enemies only when they remain assigned to the room interior and preserve a readable route to the room's interior disable button under inverse jump semantics, and MUST reject any room whose authored enemy placement, patrol, or other expected motion would allow an interior enemy to leave through a side-wall door, allow an exterior enemy to enter through a side-wall door, or crowd, pin, or replace the only intended deactivation path to the button. Those enemy-containment and button-reachability expectations MUST remain in force whether the room field is active or disabled. For the current playable gravity-room rollout, authored validation and authored data updates MUST keep `IN` as left-side side-wall room entry and `OUT` as right-side side-wall room exit from the player-facing room flow. Validation MUST reject any arrangement that passes only because the player can technically thread through a wrong-side door pairing, a leftover bottom-edge doorway, shell-band-only blocking that still leaves doors enemy-passable, a misleading active-gravity button route that depends on legacy upward jump assumptions, or a dedicated compliance-only support piece.

#### Scenario: Dying after disabling an enclosed gravity room
- **WHEN** the player disables an enclosed gravity room and then dies before finishing the route it gates
- **THEN** the next life restores that room to its active baseline until the interior button is triggered again

#### Scenario: Accepting a gravity room with contained interior enemies
- **WHEN** authored validation evaluates an enclosed gravity room with correct side-wall player flow, a reachable interior disable button, and one or more enemies that remain contained to the room interior
- **THEN** validation accepts that section as a valid bounded traversal segment

#### Scenario: Rejecting an unreadable active-field button route
- **WHEN** authored validation evaluates an enclosed gravity room whose active gravity setup, button placement, or support geometry makes the intended route to the interior disable button unreadable or effectively unreachable under inverse jump semantics
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting an interior enemy escape path
- **WHEN** authored validation evaluates an enclosed gravity room whose interior enemy placement or expected motion would allow that enemy to leave through a side-wall door
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting an exterior enemy intrusion path
- **WHEN** authored validation evaluates an enclosed gravity room whose exterior enemy placement or expected motion would allow that enemy to enter through a side-wall door
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting an interior enemy that blocks the button lane
- **WHEN** authored validation evaluates an enclosed gravity room whose contained interior enemy placement makes the only intended active-field route to the disable button depend on unavoidable blocking enemy contact
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Respawning a gravity room with contained interior enemies
- **WHEN** the player dies or restarts after reaching an enclosed gravity room that contains valid room-local enemies
- **THEN** the room resets to its active baseline
- **AND** those enemies remain assigned to their authored side of the room boundary after the reset

### Requirement: Platform-owned route references replace legacy terrain-surface references
The game SHALL represent brittle and sticky route dependencies through platform-centric references instead of legacy terrain-surface identifiers. Any secret route, gravity-capsule support beat, playtest fixture, or other authored route metadata that currently points at `terrainSurfaceIds` MUST migrate to platform-owned identifiers or equivalent platform-centric references in the same cleanup pass. Supported stage data and fixtures MUST NOT keep parallel platform and terrain-surface reference lists for the same route behavior.

#### Scenario: Loading route metadata with platform-owned references
- **WHEN** a secret route, gravity-capsule support beat, or scripted fixture refers to brittle or sticky authored support
- **THEN** that reference resolves through platform-owned identifiers rather than legacy terrain-surface identifiers

#### Scenario: Loading route metadata with leftover terrain-surface identifiers
- **WHEN** authored route metadata or scripted fixtures still depend on `terrainSurfaceIds` for brittle or sticky traversal
- **THEN** validation or fixture setup rejects that data until it is migrated to platform-centric references

### Requirement: Spring-platform authoring stays valid and false-positive-free
The game SHALL validate spring-platform authoring as full-footprint traversal support and SHALL reject retired bounce-pod and gas-vent authoring before runtime setup. Stage validation MUST reject stage data that still encodes `bouncePod`, `gasVent`, legacy launcher annotations, or spring-only sub-footprints layered over unchanged normal support for a beat intended as launch-platform traversal. Spring-platform authoring MUST remain distinct from brittle-crystal and sticky-sludge surface annotations, low-gravity zones, and other traversal annotations used for different mechanics. Death, checkpoint respawn, and manual stage restart MUST rebuild spring behavior solely from authored platform data and normal scene state rather than from launcher-style readiness or cooldown state.

#### Scenario: Loading retired launcher authoring
- **WHEN** a stage contains `bouncePod`, `gasVent`, or launcher annotation data
- **THEN** stage validation rejects that authored data before the stage is accepted for runtime use

#### Scenario: Rejecting a token spring overlay conversion
- **WHEN** a stage attempts to replace a former launch beat with a tiny spring strip or equivalent spring-only patch on otherwise unchanged normal support
- **THEN** validation rejects that authored data until the beat is expressed as a full-footprint spring platform or another supported variation beat

#### Scenario: Loading valid spring-platform authoring
- **WHEN** a stage replaces a former `bouncePod` or `gasVent` beat with a full-footprint spring platform that uses readable authored support geometry
- **THEN** stage validation accepts that spring authoring without requiring launcher metadata for the same beat

#### Scenario: Respawning after using a spring platform
- **WHEN** the player uses a spring platform and then dies, respawns from a checkpoint, or manually restarts the stage
- **THEN** the spring platform behaves from its normal authored baseline with no preserved launcher-style readiness or cooldown state

### Requirement: Broad helper gravity-field readability follows live-scene renderer truth
The project SHALL keep broad automated `Mechanic Checks` gravity-field readability coverage aligned with the current live-scene renderer contract. When the helper evaluates a current playable gravity-field route, it MUST use the live scene's gravity-field styling and stable debug-snapshot signals to confirm the field remains readable, bounded, and visually distinct from neighboring traversal mechanics. The helper MUST NOT rely on a stale relative-alpha heuristic that predates the current renderer contract, and this non-terrain cleanup MUST leave terrain-variant extents and brittle or sticky readability drift outside the scope of this requirement.

#### Scenario: Evaluating the Halo Spire gravity-field route in the live scene
- **WHEN** broad automated coverage evaluates the current Halo Spire Array gravity-field route in the live scene
- **THEN** it accepts the route only if the current renderer and stable debug-snapshot signals show a readable bounded gravity field, regardless of whether an older relative-alpha heuristic would have failed it

#### Scenario: Reporting non-terrain gravity readability separately from terrain drift
- **WHEN** the broad helper runs this non-terrain gravity-field readability check alongside terrain-variant checks in the same `Mechanic Checks` bundle
- **THEN** the gravity-field readability result is determined from the live-scene renderer contract without folding terrain-variant extents or brittle or sticky readability drift into the same failure condition

### Requirement: Broad helper terrain checks follow platform surface-mechanic and live-scene snapshot truth
The project SHALL keep terrain-related broad automated `Mechanic Checks` coverage aligned with the current platform-owned surface-mechanic contract and the current live-scene debug snapshot contract. When the helper seeds or audits brittle or sticky terrain probes, it MUST use the same `surfaceMechanic.kind` source of truth already exercised by runtime, renderer bootstrap, and runtime fixtures rather than mutating deprecated `terrainVariant` fields as authoritative helper state. Terrain extent and cue assertions MUST derive their pass or fail from stable live-scene snapshot signals mapped back to the authored platform footprint, and the resulting `Mechanic Checks` report notes MUST communicate terrain-specific pass or fail outcomes without folding stale terrain drift into unrelated helper results. This cleanup MUST stay bounded to terrain-related helper failures and MUST NOT broaden into non-terrain `Mechanic Checks` scope.

#### Scenario: Seeding terrain probes for broad helper checks
- **WHEN** broad automated `Mechanic Checks` coverage prepares brittle and sticky terrain probes
- **THEN** the helper seeds those probes through platform-owned `surfaceMechanic.kind`
- **AND** it evaluates terrain results against live-scene snapshot signals that correspond to the same authored platform extents

#### Scenario: Reporting terrain-specific helper outcomes
- **WHEN** terrain-related broad-helper assertions pass or fail during `Mechanic Checks`
- **THEN** the report notes describe terrain extent and terrain-cue outcomes from those terrain-specific assertions
- **AND** those notes stay separate from unrelated non-terrain helper failures in the same bundle

### Requirement: Change-scoped stage-playtest analysis honors explicit narrow report scopes
The project SHALL let change-scoped stage-playtest analysis output narrow report rows through explicit `CHANGE_RESULT_SCOPE` entries without rewriting fallback behavior for unmapped changes. When a change name has an explicit scope entry, `scripts/stage-playtest-analysis.mjs` MUST filter report rows to exactly that scoped subset before emitting change-scoped output. Narrow cleanup changes whose archived intent is limited to broad-helper `Mechanic Checks`, including `trim-mechanic-check-nonterrain-failures` and `trim-mechanic-check-terrain-failures`, MUST scope their change-scoped analysis output to `Mechanic Checks` only so unrelated rows do not appear in those reports. Changes without explicit entries MAY continue using the existing fallback behavior, and this requirement MUST NOT introduce pattern-based inference for future change names.

#### Scenario: Scoping recent narrow mechanic-check cleanup changes
- **WHEN** change-scoped analysis runs for `trim-mechanic-check-nonterrain-failures` or `trim-mechanic-check-terrain-failures`
- **THEN** the emitted report rows include only `Mechanic Checks`
- **AND** unrelated report sections do not appear in that change-scoped output

#### Scenario: Preserving fallback behavior for unmapped changes
- **WHEN** change-scoped analysis runs for a change name without an explicit `CHANGE_RESULT_SCOPE` entry
- **THEN** the existing fallback behavior remains in effect
- **AND** analysis does not infer a new scope from change-name patterns alone






