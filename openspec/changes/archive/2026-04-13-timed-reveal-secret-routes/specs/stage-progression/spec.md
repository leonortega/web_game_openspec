## MODIFIED Requirements

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

## ADDED Requirements

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