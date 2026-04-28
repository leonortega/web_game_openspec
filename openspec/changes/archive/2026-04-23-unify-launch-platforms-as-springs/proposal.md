## Why

Current launch-platform authoring carries three overlapping families: spring platforms, bounce pods, and gas vents. That split keeps stage data, runtime rules, presentation, and coverage more complex than needed, and it still leaves many main-stage support spans as plain static filler instead of readable traversal variation.

User wants one simpler contract: spring platforms as only authored launch-platform family, with brittle crystal and sticky sludge preserved as readable full-footprint terrain variants. This proposal updates OpenSpec so apply can retire bounce pods and gas vents completely rather than reskinning them or leaving dead launcher expectations behind.

## What Changes

- **BREAKING** Retire `bouncePod` and `gasVent` as authored, runtime, presentation, audio, and regression-tested platform families; spring platforms become only supported launch-platform family.
- Keep `brittleCrystal` and `stickySludge` as supported full-footprint terrain variants on static support, with no change to their readable authored role.
- Require shipped main stages and supporting validation to replace former bounce-pod and gas-vent beats with full-footprint spring-platform beats or other supported platform variations, not plain static substitutes and not narrow spring overlays on unchanged support.
- Require stage rollout to increase platform-variation density so current main routes use more authored spring, moving, unstable, lift-style, reveal, gravity, or other supported variation beats and rely less on long plain static support spans.
- Remove lingering spec, validation, and coverage requirements that still mention bounce pods, gas vents, launcher-only metadata, or tests that preserve those families.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: retire bounce pods and gas vents, keep springs as only launch-platform family, and require denser authored platform variation in main stages.
- `stage-progression`: remove launcher-family validation and regression expectations, require conversion of shipped bounce/gas beats to spring or other supported platform variations, and reject fake conversions that leave plain static support doing same job.
- `player-controller`: express launch-platform interaction rules in terms of springs plus remaining terrain and gravity composition, with no bounce-pod or gas-vent-specific behavior left in contract.
- `audio-feedback`: remove bounce-pod and gas-vent activation references so traversal-cue audio matches spring-only launch-platform contract.

## Impact

- Affects stage catalog, stage builders, validation, and authored-stage tests that still encode `bouncePod`, `gasVent`, launcher metadata, or plain-static fallback conversions.
- Affects runtime traversal/session state, controller launch resolution, renderer styling, and audio hooks that branch on bounce pods or gas vents.
- Affects automated regression coverage and any scripted analysis or fixtures that still require bounce-pod or gas-vent beats in shipped content.