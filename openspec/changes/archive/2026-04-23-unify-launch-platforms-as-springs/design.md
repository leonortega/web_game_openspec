## Context

Current OpenSpec contract still splits launch behavior across three families: spring platforms, bounce pods, and gas vents. That forces stage data, validation, runtime handling, visuals, audio cues, and tests to carry duplicate launch-surface concepts even though user wants simpler terrain and platform vocabulary. It also leaves stage authoring vulnerable to false-positive conversions where a former launch beat becomes plain static support with little or no added variation.

This change takes stronger direction than earlier launcher work: `bouncePod` and `gasVent` are retired entirely, not merely removed from shipped stages. Spring platforms become only authored launch-platform family, while `brittleCrystal` and `stickySludge` remain full-footprint static terrain variants. Main-stage rollout must also use more authored platform variation so route shaping does not collapse back into long plain static spans.

## Goals / Non-Goals

**Goals:**
- Make spring platforms only supported launch-platform family across specs, validation, runtime expectations, visuals, audio, and tests.
- Preserve brittle crystal and sticky sludge as readable full-footprint static terrain variants.
- Require shipped stage conversions to replace bounce/gas beats with full-footprint spring beats or other supported variation beats, not plain static filler and not tiny spring overlays on unchanged support.
- Require denser main-stage platform variation so supported stages rely less on ordinary static support for route interest.
- Remove launcher metadata, launcher readiness requirements, and launcher-only regression expectations from implementation contract.

**Non-Goals:**
- Introduce a new fourth launch family or keep bounce/gas as hidden compatibility aliases.
- Rework brittle crystal or sticky sludge into moving-platform or overlay mechanics.
- Redesign unrelated traversal systems such as gravity fields, reveal routes, magnetic platforms, or enemy routing beyond what is needed for spring-heavy stage variation.
- Require scripted playtest or manual gameplay evidence as part of this proposal-stage contract.

## Decisions

- Retire bounce/gas completely instead of shipped-authoring-only retirement.
  - Decision: proposal treats `bouncePod` and `gasVent` as removed capability surface across authored data, runtime semantics, presentation, audio, and verification.
  - Rationale: user asked to unify bouncepod, gasvent, and spring as spring platforms and to simplify terrains and platforms. Full retirement keeps repo simpler than carrying dead aliases or fixture-only launcher paths.
  - Alternative considered: remove bounce/gas only from shipped catalog while keeping validation and fixtures alive. Rejected because it preserves duplicate concepts and leaves specs/tests still requiring bounce/gas.

- Keep spring as full-footprint authored platform, never as narrow overlay.
  - Decision: converted beats must use full support footprint spring authoring or another supported full readable variation; specs explicitly reject tiny spring patches laid over unchanged support.
  - Rationale: user called out false positives. This rule forces real route-language cleanup instead of presentation-only swaps.
  - Alternative considered: allow small spring trigger zones on plain support to approximate old bounce/gas footprints. Rejected because it recreates launcher-like complexity under new name.

- Separate terrain simplification from platform-variation density.
  - Decision: brittle/sticky remain only full-footprint static terrain variants, while route-interest requirement shifts toward more spring, moving, unstable, lift, reveal, gravity, and other supported platform variation beats.
  - Rationale: user wants simpler terrain/platform taxonomy but also less static support. Keeping terrain scope narrow while increasing variation density avoids conflating visual terrain with traversal devices.
  - Alternative considered: replace static spans mostly with more brittle/sticky. Rejected because request keeps those as readable terrain variants, not blanket route filler.

- Remove launcher-state contract and migrate verification to spring- and variation-focused coverage.
  - Decision: stage-progression deltas remove launcher metadata validation and launcher reset requirements, replacing them with spring authoring validation, converted-stage checks, and coverage that proves bounce/gas references are gone.
  - Rationale: if launcher state survives in tests or specs, apply work remains half-migrated.
  - Alternative considered: preserve old launcher fixtures for backward compatibility. Rejected because proposal direction is full retirement, not dual-path support.

## Risks / Trade-offs

- [Risk] Some current bounce/gas beats may lose route nuance if converted to identical spring copies. -> Mitigation: require more platform variation overall and forbid conversions that collapse into plain static support or token spring patches.
- [Risk] Removing launcher-specific wording from controller and audio contracts could accidentally drop useful spring interaction rules. -> Mitigation: carry forward only behavior that still matters for springs, sticky sludge, gravity fields, jump suppression, and dash composition.
- [Risk] Existing archived change history in repo points in conflicting directions about springs versus launchers. -> Mitigation: this proposal states one clear final contract for apply: spring-only launch family, no bounce/gas leftovers.
- [Risk] Verification could drift if old bounce/gas scripts or tests remain named but semantically repurposed. -> Mitigation: require coverage and validation to remove bounce/gas expectations explicitly rather than merely changing visuals.