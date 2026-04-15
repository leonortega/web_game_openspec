# stage-progression Specification

## Purpose
TBD - created by archiving change mvp-platform-game. Update Purpose after archive.
## Requirements
### Requirement: Stages have a clear start-to-exit completion flow
The game SHALL organize play into discrete stages with a defined start position, traversable route, intermediate gameplay segments, and completion exit. A stage MUST begin with a short pre-play presentation step before active control starts, and completion MUST flow through a readable stage-clear results step before continuing. A stage MUST only be marked complete when the player reaches the exit in a valid active state and any authored lightweight stage objective for that stage is already complete. Stages without an authored lightweight stage objective MUST continue to complete immediately on valid exit contact. Stages with an authored lightweight stage objective MUST keep the route to that exit readable and MUST provide immediate in-stage feedback if the player touches the exit before the required objective is complete.

#### Scenario: Beginning a stage
- **WHEN** the player enters a level
- **THEN** the game shows a short stage presentation before gameplay begins in an active state

#### Scenario: Advancing through a long stage
- **WHEN** the player moves from one major stage segment to the next
- **THEN** the game preserves a clear sense of forward progress toward the exit

#### Scenario: Reaching the exit on a standard stage
- **WHEN** the player reaches the exit while alive on a stage without an authored lightweight objective
- **THEN** the stage is marked complete and the stage-clear flow begins

#### Scenario: Reaching the exit before completing the objective
- **WHEN** the player reaches the exit while alive on a stage whose authored lightweight objective is still incomplete
- **THEN** the stage is not marked complete
- **AND** the game presents immediate feedback that the objective still remains

#### Scenario: Reaching the exit after completing the objective
- **WHEN** the player reaches the exit while alive on a stage whose authored lightweight objective is complete
- **THEN** the stage is marked complete and the stage-clear flow begins

### Requirement: Selected stages can author lightweight mission objectives
The game SHALL allow a bounded subset of stages to author one lightweight mission objective using existing contact, volume, checkpoint, or activation patterns instead of a separate mission system. For this change, supported objective fiction MUST be limited to restoring a beacon, reactivating a relay, or powering a lift tower. Each objective-authored stage MUST track a single stage-local objective that starts incomplete on a fresh attempt, becomes complete when its authored target interaction succeeds, and remains complete for the rest of that stage attempt including later checkpoint respawns. Manual restart or a fresh stage start MUST reset that objective to incomplete. The game MUST communicate objective briefing and incomplete-exit reminders through the existing transient stage-message flow rather than requiring a new mission screen or separate persistent HUD panel.

#### Scenario: Starting an objective-authored stage
- **WHEN** the player begins a stage that authors a lightweight mission objective
- **THEN** the game communicates the current objective through the existing stage-message flow near the start of active play

#### Scenario: Completing an authored objective target
- **WHEN** the player triggers the authored contact, volume, checkpoint, or activation target bound to that stage objective
- **THEN** the stage objective becomes complete for the current attempt

#### Scenario: Respawning after objective completion
- **WHEN** the player dies after completing the authored stage objective and then respawns from a checkpoint in the same stage attempt
- **THEN** the objective remains complete after the respawn

#### Scenario: Starting a fresh attempt after prior objective progress
- **WHEN** the player manually restarts the stage or begins a new attempt after previously completing its lightweight objective
- **THEN** the objective resets to incomplete for that new attempt

### Requirement: Checkpoints update respawn progress within a stage
The game SHALL support in-level checkpoints that update the player's respawn location after activation. Stages targeting the long-form duration requirement MUST include enough checkpoint coverage that a late-stage failure does not force the player to replay most of the stage. Player-facing gameplay and stage messaging for those checkpoints MUST present them as survey beacons while preserving the existing checkpoint activation, respawn, and persistence behavior. A checkpoint MUST appear on an intended reachable route before the terminal exit it serves and MUST NOT be positioned past the stage exit door or other stage-completion trigger. A checkpoint respawn within the same stage run MUST preserve already collected finite level coins and the current stage coin total, while fresh stage starts or manual restarts MUST rebuild collectible state normally.

#### Scenario: Activating a checkpoint
- **WHEN** the player touches an inactive survey beacon
- **THEN** that checkpoint becomes the active respawn point for the current stage

#### Scenario: Dying after checkpoint activation
- **WHEN** the player dies after activating a survey beacon
- **THEN** the game respawns the player at that checkpoint

#### Scenario: Respawning with prior coin progress
- **WHEN** the player respawns from an activated survey beacon after collecting research samples earlier in the same stage run
- **THEN** the checkpoint restore keeps those collected coins removed and preserves the current stage coin total

#### Scenario: Failing late in a long stage
- **WHEN** the player fails in a late stage segment after activating the nearest survey beacon
- **THEN** the active checkpoint places them near that portion of progress instead of near the stage start

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
The game SHALL structure stages with meaningful terrain variations such as moving traversal, unstable surfaces, or mobility-assisted routes so progress is shaped by more than static jumps and enemy placement.

#### Scenario: Reaching a terrain-driven segment
- **WHEN** the player enters a segment built around dynamic terrain
- **THEN** the stage pacing shifts through traversal timing, positioning, or movement planning

#### Scenario: Recovering after a terrain challenge
- **WHEN** the player clears a high-pressure terrain section
- **THEN** the stage provides a readable transition or recovery beat before the next escalation

### Requirement: Optional rewards can support progression systems
The game SHALL allow optional stage rewards such as collectibles to contribute to broader progression without making full collection mandatory for stage completion.

#### Scenario: Completing a stage with partial rewards
- **WHEN** the player reaches the exit without collecting every optional item
- **THEN** the stage still completes successfully

#### Scenario: Reaching a progression threshold through rewards
- **WHEN** the player accumulates enough optional rewards for a defined unlock milestone
- **THEN** the game grants the associated progression benefit

### Requirement: Checkpoints are placed on safe and stable footing
The game SHALL place checkpoints only on authored locations that are safely reachable and supported by stable terrain. A checkpoint MUST NOT be positioned on moving, falling, or otherwise unsafe footing, and it MUST avoid overlapping immediate enemy or hazard threat zones.

#### Scenario: Reaching a checkpoint
- **WHEN** the player arrives at a checkpoint location
- **THEN** the checkpoint stands on stable support and can be activated without requiring unsafe contact

#### Scenario: Respawning at a checkpoint
- **WHEN** the player respawns from an activated checkpoint
- **THEN** they return to a safe location that does not immediately drop them into danger

### Requirement: Authored interactives remain on intended routes
The game SHALL place collectibles and other authored interactives only in positions that belong to intended reachable traversal routes or optional authored detours. Punchable interactive blocks MUST leave enough vertical clearance between the floor and the block for the player to reach them from below, and the intended route after collecting any reward from a block MUST remain safely traversable without requiring immediate enemy contact, including contact with non-stompable hazard enemies.

#### Scenario: Spotting an interactive element
- **WHEN** the player sees a collectible or similar authored interactive
- **THEN** there is a valid reachable route to that element within the intended stage flow

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

#### Scenario: Respawning from a later checkpoint after platform activation
- **WHEN** the player powers a magnetic platform, later reaches a checkpoint, and then dies afterward in the same stage
- **THEN** respawning from that checkpoint does not preserve the powered state and requires the route to follow its authored retry-safe behavior

#### Scenario: Starting a fresh attempt after prior magnetic-route use
- **WHEN** the player restarts the stage or begins a fresh attempt after previously activating a magnetic platform
- **THEN** every activation node and linked magnetic platform starts again from its dormant and unpowered baseline

#### Scenario: Authoring a retry-safe magnetic route
- **WHEN** a stage defines a route that uses an activation-node magnetic platform
- **THEN** authored validation or scripted coverage accepts it only if the stage remains safely completable when that powered route is unavailable until retriggered

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

### Requirement: Authored terrain-surface metadata stays valid and verifiable
The game SHALL validate authored brittle crystal and sticky sludge surface metadata before runtime setup. Each authored surface annotation MUST use a supported surface kind, MUST define a positive bounded rectangular footprint, and MUST align to existing solid walkable stage support instead of floating independently. Brittle crystal floors MUST map to real supporting tiles so their warning, support, and break states remain readable. The authored surface extents used by simulation MUST match the extents rendered in-stage, and regression coverage MUST include at least one brittle-floor traversal fixture and one sticky-sludge traversal fixture in automated or scripted playtest coverage.

#### Scenario: Loading malformed terrain-surface metadata
- **WHEN** a stage contains an authored brittle or sticky surface with an unknown kind, invalid rectangle, or no valid supporting terrain
- **THEN** stage validation rejects that authored data before the stage is accepted for runtime use

#### Scenario: Loading valid terrain-surface metadata
- **WHEN** a stage contains valid authored brittle crystal and sticky sludge surface annotations
- **THEN** the stage accepts those annotations for both simulation and rendering using the same authored extents

#### Scenario: Running surface traversal regression coverage
- **WHEN** automated tests or scripted playtest coverage run for the new terrain surfaces
- **THEN** the suite exercises at least one brittle-floor route and one sticky-sludge route instead of relying only on manual inspection

### Requirement: Authored launcher metadata stays valid and resets cleanly across attempts
The game SHALL validate authored bounce pod and gas vent launcher metadata before runtime setup and SHALL treat launcher readiness as transient traversal state. Each launcher annotation MUST use a supported launcher kind, MUST define a positive bounded top-contact footprint aligned to existing solid walkable support, and MAY define an optional upward-biased launch direction no more than 25 degrees off vertical. Launcher annotations MUST remain distinct from spring-platform metadata, low-gravity zones, sticky-sludge surface annotations, and other traversal annotations used for different mechanics. A launcher annotation MUST NOT overlap another launcher or spring footprint in a way that makes first-contact launch behavior ambiguous. Every launcher MUST begin ready on a fresh attempt, and death, checkpoint respawn, or manual stage restart MUST rebuild launcher readiness from that ready baseline instead of preserving any remaining cooldown timer. Regression coverage MUST include at least one bounce-pod fixture, one gas-vent fixture, one suppression-or-cooldown fixture, and one scripted or automated traversal probe that exercises launcher composition with low gravity or sticky sludge.

#### Scenario: Loading malformed launcher metadata
- **WHEN** a stage contains a launcher annotation with an unknown kind, invalid footprint, unsupported direction, or missing valid support
- **THEN** stage validation rejects that authored data before the stage is accepted for runtime use

#### Scenario: Rejecting ambiguous launcher overlap
- **WHEN** a stage authors a bounce pod or gas vent so its trigger footprint overlaps another launcher or spring footprint
- **THEN** validation rejects the layout until the first-contact launch area is unambiguous

#### Scenario: Loading valid launcher metadata
- **WHEN** a stage contains valid bounce pod or gas vent annotations with aligned support and an allowed optional direction
- **THEN** the stage accepts those annotations for simulation and rendering as launcher-specific authored content

#### Scenario: Respawning after using a launcher
- **WHEN** the player fires a launcher and then dies, respawns from a checkpoint, or manually restarts the stage
- **THEN** that launcher returns in its ready state instead of preserving its prior cooldown progress

#### Scenario: Running launcher regression coverage
- **WHEN** automated tests or scripted playtest coverage run for the new launcher mechanic
- **THEN** the suite exercises both launcher kinds, suppression or cooldown reuse, and at least one launcher route combined with low gravity or sticky sludge

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
The game SHALL author every current main stage with at least one terrain-surface section and at least one gravity-field section that satisfy the platform-variation contract for that stage's route role. Validation MUST reject any current main stage that omits terrain-surface authored data, omits gravity-field authored data, or places those mechanics only in unreadable dead-end space disconnected from the intended route or optional reconnecting branch. Scripted or automated playtest coverage MUST exercise at least one authored terrain-surface beat and one authored gravity-field beat in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array, and those checks MUST confirm the routes remain readable, completable, and reset-consistent across death, checkpoint respawn, and fresh attempts.

#### Scenario: Loading a main stage with missing rollout data
- **WHEN** a current main stage is authored without either a terrain-surface section or a gravity-field section
- **THEN** validation rejects that stage before runtime use

#### Scenario: Running campaign rollout coverage
- **WHEN** scripted or automated playtest coverage runs for the current three-stage campaign
- **THEN** the suite exercises one terrain-surface beat and one gravity-field beat in each main stage
- **AND** it confirms those sections remain completable after retry or respawn

