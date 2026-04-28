## Context

Current OpenSpec text treats `brittleCrystal` and `stickySludge` as platform-owned static-platform variants while `bouncePod` and `gasVent` remain separate launcher annotations with separate validation and runtime setup. That split is now counter to requested direction. User wants these four mechanics unified as platform-authored mechanics applied on static platforms in multiple stages, with no false-positive solution that preserves `stage.launchers` as source of truth and no fallback that rebrands bounce or gas as springs.

The design therefore needs to do two things at once: broaden the platform-owned authored surface contract so all four mechanics share one source-of-truth shape, and preserve the distinct runtime semantics that make brittle, sticky, bounce, and gas feel different from one another. Proposal-stage decisions should keep implementation narrow, static-platform-only, and compatible with current route readability work.

## Goals / Non-Goals

**Goals:**
- Use one platform-owned static-platform authoring model for `brittleCrystal`, `stickySludge`, `bouncePod`, and `gasVent`.
- Preserve current brittle and sticky behavior semantics while preserving bounce-pod and gas-vent one-shot launch, cooldown, reset, and optional directional-bias semantics.
- Retire separate bounce-pod and gas-vent launcher collections as the authoritative shipped-stage authoring path.
- Add live platform-authored bounce-pod and gas-vent beats on static platforms across multiple shipped stages without removing existing brittle and sticky rollout.

**Non-Goals:**
- Convert bounce pods or gas vents into spring platforms or reuse spring semantics as compatibility wrappers.
- Broaden any of the four mechanics onto moving, unstable, lift-style, or other non-static platform kinds.
- Introduce manual gameplay validation or scripted playtest requirements as proposal-stage acceptance criteria.
- Redesign unrelated traversal systems such as gravity fields, reveal routes, magnetic platforms, or dash behavior.

## Decisions

- Use one platform-owned source of truth for all four static-platform surface mechanics.
  - Decision: apply should migrate bounce-pod and gas-vent authoring onto the same owning static platform record used for brittle and sticky, whether by widening the current `terrainVariant` field or by renaming it to a broader platform-surface field. The important contract is one platform-owned authored source, not a separate launcher collection.
  - Rationale: this directly resolves the current split and matches user intent without overcommitting to a field name before implementation inspects the type surface.
  - Alternative considered: keep `stage.launchers` and add a cross-reference back to platforms. Rejected because it preserves the same dual-source ambiguity the request is trying to remove.

- Keep bounce-pod and gas-vent semantics distinct from spring platforms.
  - Decision: platform-authored bounce pods and gas vents stay first-contact, single-impulse, cooldown-gated traversal surfaces with optional upward-biased direction, while springs remain separate full-platform vertical-boost mechanics.
  - Rationale: user explicitly does not want bounce or gas treated as springs, and current route language depends on bounce pods and gas vents staying a distinct traversal family.
  - Alternative considered: replace bounce or gas beats with spring authoring on the same platforms. Rejected because it changes mechanic identity instead of unifying authoring.

- Keep rollout bounded to static platforms and multiple main stages.
  - Decision: apply should place live platform-authored `bouncePod` and `gasVent` beats on supported static platforms in at least two of the current main stages while preserving existing live brittle or sticky rollout across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array.
  - Rationale: this matches the request for static-platform rollout in different stages without inventing a global every-stage quota for every mechanic.
  - Alternative considered: migrate bounce or gas to fixtures only and defer live stage use. Rejected because user explicitly wants some static-platform rollout in shipped stages.

- Replace launcher-era validation and regression assumptions with platform-surface validation and focused coverage.
  - Decision: stage validation should reject legacy bounce-pod and gas-vent launcher annotations as authoritative authored data, accept platform-owned static-platform surface records instead, and keep readiness-reset and composition coverage through focused automated tests.
  - Rationale: authoring, runtime setup, and tests all need the same source-of-truth contract or the migration will remain half-finished.
  - Alternative considered: leave launcher validation intact as a hidden compatibility path. Rejected because it keeps conflicting contracts alive and weakens future authoring discipline.

## Risks / Trade-offs

- [Risk] Widening a terrain-focused platform field to include bounce and gas could blur naming or type intent. -> Mitigation: make the contract about one platform-owned surface-mechanic source of truth, and let apply choose whether that means widening or renaming the field after inspecting local types.
- [Risk] Full-footprint bounce or gas beats may change route timing or leniency compared with narrower launcher footprints. -> Mitigation: require rollout on existing readable static support surfaces and preserve bounce or gas impulse semantics instead of spring substitution.
- [Risk] Legacy launcher-specific tests could fail or become misleading after source-of-truth migration. -> Mitigation: retarget regression coverage around platform-authored bounce or gas fixtures, readiness reset, ambiguity rejection, and sticky or gravity composition.
- [Risk] Spec text could still imply spring preference for support-platform assisted-launch beats. -> Mitigation: explicitly modify both platform-variation and stage-progression so platform-authored bounce or gas is the expected path and launcher overlays are no longer normative.