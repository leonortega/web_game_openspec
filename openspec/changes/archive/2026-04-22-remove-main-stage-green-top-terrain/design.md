## Context

The current repo state already preserves brittle/sticky engine support and already moves terrain-readability verification off the main campaign in the abstract spec. The remaining apply work is narrower: main-stage authored green-top platforms still carry `brittleCrystal` or `stickySludge` in the stage catalog, and campaign-facing validation or scripted checks may still tolerate or depend on those hidden terrain mechanics even when the visuals should read as plain support.

This change crosses authored stage data, validation, authoring tests, and scripted playtest coverage. Those surfaces must move together so the campaign no longer ships hidden terrain behavior under normal green platforms while brittle/sticky support remains available and tested in bounded non-campaign coverage.

## Goals / Non-Goals

**Goals:**
- Replace current main-stage green-top brittle/sticky platforms with plain static platforms that preserve route geometry and pacing.
- Make current main-stage plain green platforms read and behave as plain support instead of hidden terrain mechanics.
- Keep brittle/sticky engine support, platform-owned terrain-variant authoring, and legacy overlay rejection intact.
- Keep targeted regression coverage for brittle/sticky behavior, readability, and reset semantics outside the current main-stage routes.
- Leave launcher, spring, gas vent, gravity-room, and other non-terrain traversal distinctions unchanged.

**Non-Goals:**
- Removing brittle/sticky support from runtime, controller, renderer, or validation entirely.
- Reintroducing legacy terrain overlays, terrain-surface collections, or non-platform-owned brittle/sticky authoring.
- Redesigning unrelated main-stage routes, enemy placement, or gravity sections beyond small local geometry adjustments needed to preserve existing jump lines.
- Changing launcher, spring, or gas-vent semantics or collapsing those traversal concepts together.

## Decisions

### 1. Replace terrain variants in place instead of rebuilding main-stage route beats

Apply should convert the affected main-stage green-top `terrainVariant` placements to normal static platforms with the same footprints by default. Small local geometry edits are allowed only when needed to preserve the prior route timing or footing after terrain behavior is removed.

Alternative considered: redesign each affected route around different traversal gimmicks. Rejected because it broadens scope beyond de-authoring hidden terrain and creates unnecessary pacing churn.

### 2. Add a contract that plain green main-stage platforms cannot hide brittle/sticky behavior

Spec changes should not merely say brittle/sticky are optional in the campaign. They should also make current main-stage plain green-top routes behave as ordinary support unless a platform is visibly authored as a distinct supported traversal modifier. This gives apply a clear validation target and prevents hidden brittle/sticky behavior from surviving under unchanged platform presentation.

Alternative considered: rely only on content cleanup without a spec guard. Rejected because later authoring drift could silently reintroduce the same hidden mechanic.

### 3. Keep terrain regression coverage, but isolate it from campaign-stage assumptions

Automated tests and scripted playtests should keep covering brittle warning, brittle reset, sticky drag, and legacy overlay rejection using bounded fixtures, targeted sample stages, or other non-campaign surfaces. Separate campaign validation should assert absence of brittle/sticky on the current main-stage green-top routes.

Alternative considered: drop terrain-variant coverage once the main campaign stops using it. Rejected because engine support remains live and still needs regression protection.

## Risks / Trade-offs

- [Route drift] Plain-platform replacement could make a prior terrain beat too easy or too flat. -> Mitigation: preserve footprints first and allow only small local support edits when route readability demands them.
- [Coverage confusion] Playtests may still read the old campaign terrain assumptions. -> Mitigation: split targeted terrain-variant coverage from campaign-stage absence checks in tasks and validation.
- [Overreach] Apply could delete runtime terrain support because campaign usage is removed. -> Mitigation: keep proposal and spec text explicit that engine support and non-campaign regression coverage stay required.
- [Presentation mismatch] A platform could keep special rendering or metadata after behavior removal. -> Mitigation: require validation and scripted coverage to confirm plain green main-stage platforms no longer carry hidden brittle/sticky authoring.