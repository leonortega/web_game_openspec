## MODIFIED Requirements

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
- **WHEN** the player ignores optional secret routes and follows the intended main route
- **THEN** the stage remains fully completable without requiring the optional branch content

## ADDED Requirements

### Requirement: Secret-route authoring remains discoverable, rewarding, and verifiable
The game SHALL author expedition secret routes so their discovery depends on authored layout cues and currently supported traversal mechanics rather than on new tracked runtime discovery state. Each authored secret route MUST present a readable clue, opening, elevation change, traversal affordance, or reward glimpse from a traversable part of the stage so that discovery feels earned rather than arbitrary. Each route MUST provide meaningful optional reward value through research samples, a worthwhile reward pocket, or a distinct traversal and recovery beat, and MUST reconnect to the main route later without trapping the player in a dead-end that breaks forward progression. Authored validation and scripted playtest coverage MUST confirm that the route can be discovered, that its optional reward value is reachable, that the main route remains completable when the secret route is skipped, and that the later reconnection behaves as authored.

#### Scenario: Loading a valid secret route
- **WHEN** a stage defines a secret route with a readable discovery cue, optional reward value, and a later reconnection point
- **THEN** authored validation accepts that route as a valid same-stage optional branch

#### Scenario: Rejecting a non-reconnecting secret route
- **WHEN** a stage defines a hidden branch that has no safe return, no downstream reconnection, or no meaningful optional value
- **THEN** authored validation or scripted coverage rejects the route until the branch is made rewarding and reconnectable

#### Scenario: Discovering and skipping during coverage
- **WHEN** scripted playtest coverage evaluates a stage with an authored secret route
- **THEN** the coverage demonstrates both that the route can be discovered and rewarded
- **AND** that the stage still completes correctly when the player stays on the main route instead