## Context

Current runtime and renderer logic treat `platform.surfaceMechanic.kind` as the source of truth for brittle and sticky terrain behavior. The broad helper terrain probe in `scripts/stage-playtest.mjs` still mutates `terrainVariant`, reads `terrainVariantVisuals`, and gates pass or fail on hard-coded detail-count and ratio heuristics. That leaves helper setup out of sync with live runtime state and makes `Mechanic Checks` terrain notes vulnerable to stale failures even when the shipped simulation and renderer agree.

This change is intentionally narrow. It should clean only the remaining terrain-related broad-helper failures and notes, while leaving non-terrain `Mechanic Checks`, gravity readability, falling-platform behavior, and broader stage failures untouched.

## Goals / Non-Goals

**Goals:**
- Seed broad-helper brittle and sticky terrain probes through `surfaceMechanic.kind` instead of deprecated `terrainVariant` mutations.
- Derive terrain pass or fail from stable live-scene snapshot signals that still reflect full-platform terrain extents and distinct brittle or sticky cues.
- Make `Mechanic Checks` terrain notes the success criterion, so the report clearly distinguishes real terrain drift from stale helper assumptions.

**Non-Goals:**
- Change runtime brittle or sticky mechanics in `GameSession`.
- Redesign renderer output or rename existing debug snapshot payloads outside what helper assertions consume.
- Clean non-terrain `Mechanic Checks` failures, including falling-platform or gravity-field readability issues.

## Decisions

- Use platform-owned `surfaceMechanic.kind` as helper fixture truth.
  - Decision: apply should update the broad helper terrain probe to seed brittle and sticky platforms through `surfaceMechanic.kind`, matching runtime, renderer bootstrap, and existing runtime test fixtures.
  - Rationale: this removes the stale data path at the root instead of layering compatibility logic onto deprecated helper mutations.
  - Alternative considered: keep mutating `terrainVariant` and map it back into current runtime state inside the helper. Rejected because it preserves the same drift the change is meant to eliminate.

- Anchor terrain assertions to stable live-scene snapshot signals, not brittle shape heuristics.
  - Decision: apply should keep extent and cue checks only where they correspond to stable snapshot fields and authored platform extents, and should retire or relax magic thresholds that no longer represent the renderer contract.
  - Rationale: the helper should fail only when current live-scene terrain presentation actually drifts from authored brittle or sticky support.
  - Alternative considered: preserve the current detail-count and size-ratio checks as strict gates. Rejected because those checks already drift from the renderer contract and create stale failures.

- Treat `Mechanic Checks` terrain notes as the primary success signal.
  - Decision: apply should update note generation so terrain-specific pass or fail text reflects the new helper outputs directly and remains separate from unrelated broad-helper results.
  - Rationale: user wants report-signal cleanup, not only a passing process exit.
  - Alternative considered: leave note text unchanged and only fix helper booleans. Rejected because stale notes would continue to misreport terrain state even after the helper logic improves.

- Keep cleanup scoped to terrain-only helper paths.
  - Decision: apply should touch only terrain-related broad-helper setup, terrain assertions, and adjacent targeted validation.
  - Rationale: this follow-up change exists to remove leftover terrain failures without reopening non-terrain helper cleanup.
  - Alternative considered: batch terrain, gravity-field, and falling-platform helper cleanup together. Rejected because it broadens the change beyond the requested follow-up slice.

## Risks / Trade-offs

- [Risk] Live-scene snapshot fields may still evolve and break helper assertions again. -> Mitigation: consume only stable snapshot fields that already map to authored platform extents or terrain-visual identity.
- [Risk] Narrowing or replacing terrain cue heuristics could hide a real visual regression. -> Mitigation: preserve explicit extent and distinct-cue checks, but express them through current snapshot truth instead of legacy magic numbers.
- [Risk] Terrain probe mutations could leak into adjacent helper checks if state reset remains incomplete. -> Mitigation: keep terrain probe setup isolated and continue forcing fresh stage state before each terrain-specific check.