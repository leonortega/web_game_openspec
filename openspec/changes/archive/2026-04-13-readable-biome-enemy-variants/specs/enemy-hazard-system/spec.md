## ADDED Requirements

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