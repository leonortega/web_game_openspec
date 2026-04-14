# enemy-hazard-system Specification

## Purpose
Define encounter spacing, threat readability, and bounded enemy or hazard presentation rules that keep stage threats fair and recognizable.
## Requirements
### Requirement: Enemy encounters are authored with readable spacing and density
The game SHALL author enemy and hazard placements in readable encounter bands across each main stage. The critical path MUST provide enough footing, telegraph space, or lane separation for the player to parse each encounter before entering it, and optional detours MAY carry higher pressure only when they remain clearly optional and offer extra reward or faster traversal value. Major support surfaces MUST NOT stack multiple simultaneous threats so tightly that the authored route lacks a safe staging point or alternate lane.

#### Scenario: Entering a critical-path encounter
- **WHEN** the player reaches an enemy or hazard setup on the intended main route
- **THEN** there is enough readable space to identify the threat and choose a response before forced contact occurs

#### Scenario: Taking a higher-pressure optional branch
- **WHEN** the player enters an optional detour or reward pocket
- **THEN** that branch may present denser enemy pressure than the critical path while still preserving a readable route through it

#### Scenario: Recovering after a pressure spike
- **WHEN** the player clears a dense encounter band
- **THEN** the next safe foothold or transition beat gives them room to reset before the following escalation

### Requirement: Biome-linked turret variants remain bounded and readable
The game SHALL support authored biome-linked enemy variants as a bounded extension of existing enemy kinds rather than a generic enemy-system rewrite. For this change, the supported rollout MUST remain limited to the `turret` kind and MUST provide no more than two biome-specific turret variants: `resinBurst` for Ember Rift Warrens and `ionPulse` for Halo Spire Array. Each supported variant MUST preserve the turret's stationary support-based role, MUST expose a biome-specific visual telegraph before firing, and MUST keep its attack timing deterministic across retries.

#### Scenario: Encountering a turret variant for the first time
- **WHEN** the player reaches the first authored `resinBurst` or `ionPulse` turret encounter in its stage
- **THEN** that encounter introduces the variant in isolation with a safe foothold and enough telegraph space to read its firing pattern before forced contact

#### Scenario: Repeating a biome-linked turret encounter
- **WHEN** the player retries a stage containing a `resinBurst` or `ionPulse` turret
- **THEN** the turret uses the same authored telegraph timing and firing cadence for that variant on each attempt

#### Scenario: Rendering a biome-linked turret variant
- **WHEN** a supported turret variant begins its firing windup
- **THEN** its visible telegraph matches that variant's biome presentation and starts early enough to communicate the upcoming shot cadence before the projectile is spawned

### Requirement: Biome-linked turret variants are taught before mixed-encounter reuse
The game SHALL introduce each supported biome-linked turret variant through an authored teaching beat before reusing that variant in any later mixed encounter. A teaching beat MUST present the turret variant without simultaneous forced-contact pressure from another enemy or hazard in the same immediate lane. Any later mixed encounter using that variant MUST preserve the existing readability-first rules by keeping a safe staging point, separate lane, or other clear response window available to the player.

#### Scenario: Introducing the Ember Rift turret variant
- **WHEN** the player first reaches the authored `resinBurst` turret teaching beat in Ember Rift Warrens
- **THEN** the route provides safe support and recovery space to observe the longer telegraph and short burst before the player is asked to parse any additional pressure

#### Scenario: Reusing a turret variant in a later mixed encounter
- **WHEN** the player reaches a later encounter that combines a biome-linked turret variant with another enemy or hazard
- **THEN** the authored layout still provides lane separation, a safe staging foothold, or another readable response window before simultaneous pressure closes in

#### Scenario: Validating supported variant usage
- **WHEN** authored stage data assigns a biome-linked turret variant
- **THEN** that assignment is limited to the supported biome and turret kind combinations for this change and does not broaden into unrelated enemy kinds or unsupported stages

### Requirement: Enemy and hazard visuals remain readable under the reduced-detail presentation
The game SHALL preserve enemy and hazard readability under the Atari 2600-inspired presentation pass. Dangerous enemies, hazard sources, active projectiles, and telegraph states MUST remain distinguishable from terrain and non-dangerous scenery through silhouette contrast, reserved accent colors, or explicit state-shape changes rather than subtle shading alone. Under the second-pass tightening, enemy and hazard rendering MUST use harsher palette quantization and tighter sprite-like visual motion limits than the current baseline presentation while keeping routing-critical threat differences readable. This presentation tightening MUST NOT change enemy behavior, projectile cadence, hazard timing, or encounter authoring.

#### Scenario: Reading a hazard against the stage backdrop
- **WHEN** the player views a damaging enemy or hazard in front of the flatter stage presentation
- **THEN** its dangerous silhouette remains distinguishable from the surrounding terrain and props

#### Scenario: Reading a telegraph state
- **WHEN** an enemy or hazard enters a telegraph or windup state before becoming dangerous
- **THEN** that state is visible through a clear shape, cadence, or accent change that is readable in the reduced palette

#### Scenario: Tightening threat visuals without changing threat timing
- **WHEN** the second-pass retro tightening is applied to enemies, hazards, and projectiles
- **THEN** their visuals become more quantized and sprite-like
- **AND** their telegraph timing and active danger cadence remain unchanged

#### Scenario: Preserving routing-critical readability under the tighter pass
- **WHEN** the player compares different enemies or hazards under the harsher palette limits
- **THEN** the threats remain distinguishable through shape, spacing, motion state, or reserved accent placement rather than fine texture detail alone

### Requirement: Reduced-palette rendering does not hide routing-critical threat differences
The game SHALL keep routing-critical threat differences readable even when multiple enemies or hazards share a limited color vocabulary. Threats that require materially different player responses MUST remain distinguishable through shape, spacing, motion state, or reserved accent placement rather than depending only on small texture details.

#### Scenario: Comparing different threat types in the same stage
- **WHEN** the player sees two different enemy or hazard types during a stage
- **THEN** the threats remain distinguishable enough to support route planning and response choice within the flatter presentation style

#### Scenario: Reading an active projectile
- **WHEN** a hazard or enemy projectile crosses the screen
- **THEN** the projectile remains visually distinct from background decoration and passive props

