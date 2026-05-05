## Context

Current authored launcher count in shipped catalog is two: `forest-bounce-pod-route` in Verdant Impact Crater on support platform at `y460`, and `sky-gas-vent-route` in Halo Spire Array on support platform at `y480`. No authored launcher currently exists off a support platform. Launcher behavior differs materially from springs because launcher footprints can be narrower than their support, can carry authored directional bias, and fire as first-contact impulse surfaces, while springs are full-platform traversal surfaces with vertical boost only.

The requested change is intentionally narrow. It restores current shipped platform-top launcher beats to springs instead of rolling back the launcher mechanic globally. Pre-implementation decisions matter because specs currently prefer bounce pods and gas vents over a separate spring-platform mechanic for these green contact-launch surfaces, and validation plus tests likely assume launcher-backed catalog examples remain present.

## Goals / Non-Goals

**Goals:**
- Replace the two shipped support-platform launcher beats with spring platforms while preserving route shape and traversal readability.
- Update OpenSpec contracts so current shipped support-platform green launch surfaces read as full spring platforms, not narrower launcher overlays.
- Keep bounce-pod and gas-vent support available in runtime, validation, and tests for future authored use.
- Keep launcher regression coverage independent from whether shipped stages currently use launcher annotations.

**Non-Goals:**
- Remove bounce-pod or gas-vent mechanics from the engine.
- Add new launcher placements elsewhere in shipped stages.
- Redesign spring behavior, retune launcher impulses, or broaden spring mechanics beyond current platform semantics.
- Require scripted playtest or manual gameplay validation for this proposal stage.

## Decisions

- Replace each shipped support platform plus launcher overlay with a spring-platform footprint covering the full readable contact surface.
  - Decision: the implementation should convert the underlying authored support platform itself into a spring platform instead of keeping a normal support plus a smaller spring-like overlay.
  - Rationale: route readability currently comes from the whole green top surface. Matching spring footprint to full support preserves jump timing, contact expectation, and visual legibility better than a narrower replacement.
  - Alternative considered: keep the support platform and swap only the launcher metadata for a smaller spring trigger. Rejected because it keeps the same footprint ambiguity that motivated the change.

- Keep launcher mechanic support, but detach it from shipped-catalog dependency.
  - Decision: validation and tests should continue supporting `bouncePod` and `gasVent`, but regression coverage should rely on dedicated fixtures or focused test data rather than on current shipped-stage catalog entries.
  - Rationale: user asked for shipped catalog replacement, not mechanic rollback. Coverage should still protect launcher behavior without forcing shipped content to carry it.
  - Alternative considered: remove launcher support entirely because shipped catalog no longer uses it. Rejected because handoff explicitly scopes change to current shipped beats only.

- Update spec language from launcher preference to spring preference for current shipped support-platform green launch surfaces.
  - Decision: platform-variation requirement text should keep springs, bounce pods, and gas vents as distinct traversal tools, but current shipped catalog support-platform launch beats must prefer springs.
  - Rationale: this matches requested direction and resolves the existing spec conflict without erasing future launcher use.
  - Alternative considered: leave current spec language and implement a catalog-only exception. Rejected because it would leave product code knowingly out of contract.

- Preserve launcher-specific constraints where launchers still exist.
  - Decision: stage-progression should still require launcher metadata to stay distinct from spring-platform authoring, use bounded aligned support footprints, reset readiness across attempts, and remain covered by automated regression even if shipped catalog has zero launchers.
  - Rationale: launcher contract still matters for future content and for non-catalog fixtures.
  - Alternative considered: collapse launcher validation into generic platform validation. Rejected because launcher-specific footprint and cooldown rules stay unique.

## Risks / Trade-offs

- [Risk] Full-platform spring conversion could subtly change route timing or landing leniency at the two affected beats. -> Mitigation: require implementation to preserve route shape/readability and target the exact existing support footprints.
- [Risk] Launcher coverage could weaken once shipped stages stop exercising it. -> Mitigation: require dedicated validation and automated test fixtures for bounce pods, gas vents, cooldown reuse, and composition cases.
- [Risk] Spec text could accidentally imply launcher deprecation everywhere. -> Mitigation: state explicitly that bounce pods and gas vents remain supported, just not preferred for current shipped support-platform green beats.
- [Risk] Validation could continue rejecting spring authoring because of old launcher-era assumptions. -> Mitigation: update stage-progression contract to allow spring platforms as separate authoring while still rejecting deprecated spring-as-launcher metadata.