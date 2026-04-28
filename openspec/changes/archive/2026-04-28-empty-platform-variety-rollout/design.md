## Context

Empty-platform stretches currently over-index on jump timing beats, which compresses route expression and makes repeated attempts feel samey. The change affects cross-cutting stage systems: authored stage catalog entries, stage platform typing, authoring-time validation, and tests that guard progression pacing. Existing platform contracts already support several mechanics (moving, unstable, spring, sticky, brittle, reveal, temporary bridge, magnetic), but empty-platform sections are not required to use those mechanics in a distributed way.

## Goals / Non-Goals

**Goals:**
- Require empty-platform segments to use broader platform mechanics instead of jump-only sequences.
- Define authoring and validation rules that enforce mechanic distribution across stage progression.
- Keep platform behavior contracts deterministic and compatible with existing traversal semantics.
- Ensure test coverage detects regressions in mechanic diversity and empty-platform pacing.

**Non-Goals:**
- Introducing entirely new movement abilities or controller physics models.
- Reworking enemy AI or hazard systems unrelated to platform mechanic diversity.
- Changing stage unlock flow, objective gating, or unrelated progression requirements.

## Decisions

1. Use requirement-level updates in existing `platform-variation` and `stage-progression` capabilities instead of adding a new capability.
- Rationale: The requested behavior changes are extensions of existing platform and pacing contracts, not a separate domain.
- Alternative considered: Add a new capability for empty-platform authoring. Rejected to avoid spec fragmentation and duplicate validation rules.

2. Treat empty-platform variety as a mechanic-family distribution rule, not as fixed per-stage coordinates.
- Rationale: Distribution constraints remain robust as stage layouts evolve.
- Alternative considered: Hard-code stage-specific beat positions. Rejected because it would be brittle and overfit current layouts.

3. Enforce diversity through authoring validation over stage metadata and platform tags.
- Rationale: Validation catches under-varied sections before runtime and keeps contracts testable.
- Alternative considered: Runtime-only detection. Rejected due to delayed feedback and weaker authoring workflow.

4. Scope implementation to stage catalog/types/validation/tests with no runtime gameplay-system rewrite.
- Rationale: Existing mechanic implementations already exist; the gap is composition and enforcement.
- Alternative considered: Rewrite traversal sequencing runtime. Rejected as unnecessary risk for this requirement set.

## Risks / Trade-offs

- [Over-constraining authored creativity] -> Mitigation: Define mechanic-family minima and progression distribution ranges, not single mandatory templates.
- [Validation false positives on legacy stages] -> Mitigation: Introduce clear error messages and targeted fixture updates for known legacy layouts.
- [Spec ambiguity between jump-related and non-jump mechanics] -> Mitigation: Enumerate accepted mechanic families directly in the modified requirements.
- [Test maintenance cost] -> Mitigation: Prefer data-driven tests over snapshot-heavy route fixtures.

## Migration Plan

1. Extend stage typing and metadata to represent empty-platform mechanic families explicitly where needed.
2. Update stage catalog authoring for impacted empty-platform sections so each qualifying run has multi-family mechanics.
3. Add or tighten validation rules for empty-platform variety and progression distribution checks.
4. Update and add tests covering schema validation and stage progression distribution behavior.
5. Run project test suite and resolve any fixture or validation drift.

## Open Questions

- Should the minimum mechanic-family count for an empty-platform run be globally fixed or stage-tier dependent?
- Should transitional support beats (for example plain recovery tiles) count toward variety totals, or only primary traversal beats?
- Do we need a temporary compatibility flag for legacy authored test fixtures during rollout?
