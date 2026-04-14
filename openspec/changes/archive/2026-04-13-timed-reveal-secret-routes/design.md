## Context

The codebase already supports two separate traversal-state patterns that this change needs to compose without broadening them. Reveal platforms represent attempt-scoped route discovery that can persist through later checkpoint snapshots, while scanner-switch temporary bridges represent live timing state that resets on death, checkpoint respawn, restart, and fresh attempts. Runtime active-platform checks already combine visibility and solidity from multiple conditions, but authored validation currently rejects temporary bridge content that also depends on reveal discovery, which blocks bounded secret routes such as short-lived hidden branches or temporary visible sky paths.

This work crosses authored content validation, simulation state, scene synchronization, tests, and scripted playtest coverage. The design therefore needs to make the authoring model explicit while avoiding a larger trigger-composition system.

## Goals / Non-Goals

**Goals:**
- Support a bounded timed-reveal secret-route pattern that uses existing reveal and scanner mechanics together.
- Preserve the mechanic split so reveal governs discovery and legibility while scanner governs timed activation.
- Encode the persistence split so discovered state can follow checkpoint-backed reveal behavior while active timing state resets like temporary bridges.
- Enforce readability and safety expectations for nearby cue placement, timer start timing, safe main-route fallback, and support-safe expiry.
- Cover authoring acceptance, rejection, and runtime progression with unit tests and scripted playtest expectations.

**Non-Goals:**
- Introduce arbitrary trigger chaining, shared multi-step route-state graphs, or a generalized secret-route state framework.
- Add new interaction inputs, projectile-only triggers, or HUD/UI systems for timed routes.
- Change unrelated reveal-platform, scanner-switch, or checkpoint rules outside the explicit timed-reveal composition behavior.

## Decisions

- Represent timed-reveal routes as a bounded composition of existing authored reveal and scanner links rather than as a new generalized trigger graph.
  - Rationale: the mechanic only needs two existing gates with distinct responsibilities, and a general framework would create unnecessary surface area in validation, runtime state, and tests.
  - Alternative considered: a generalized route-state graph that lets any trigger drive any hidden support segment. Rejected because it broadens scope far beyond the requested mechanic and would weaken readability guarantees.
- Treat reveal discovery as a prerequisite for legibility, but keep timer authority exclusively on scanner activation.
  - Rationale: the user-visible rule stays simple and learnable: discover the route through reveal, then intentionally activate its timed window through scanner entry.
  - Resulting rule: revealing a timed-reveal route may make the hidden path legible or visible, but it does not start the timer; the timer begins only when the player enters the linked scanner volume after the route is legible.
  - Alternative considered: start the timer as soon as the reveal cue fires. Rejected because it would hide the route-reading window and violate the bounded mechanic split.
- Compose persistence by snapshotting only the reveal-side discovery state into checkpoint progression while rebuilding timed activation from the inactive baseline on respawn and restart.
  - Rationale: this matches the existing mental model already defined by reveal platforms and temporary bridges, and it avoids restoring half-expired timers from checkpoint data.
  - Alternative considered: snapshot the remaining timer when a checkpoint is activated. Rejected because it would make respawn behavior hard to read and diverge from current temporary-bridge rules.
- Enforce readability and safety through narrow authoring constraints plus scripted verification instead of attempting a generalized geometry solver for “legible” routes.
  - Rationale: nearby cueing, readable activation order, and safe fallback are partly layout concerns that are better enforced through explicit authored links, validation guardrails, and route coverage than through brittle automatic inference.
  - Resulting rule: authoring must supply a reveal cue and scanner activator that belong to the same local route pocket, and playtest coverage must prove the player can read, skip, and survive the route as authored.
  - Alternative considered: derive legibility purely from world-space distance and camera overlap. Rejected because that would be fragile across stage shapes and would still not prove safe fallback.
- Reuse the existing support-safe expiry rule from temporary bridges for all timed-reveal support segments.
  - Rationale: expiry should never remove support from under the player while top-surface contact is still active, regardless of whether the route was previously hidden.
  - Alternative considered: let reveal-linked routes disappear immediately at timer expiry because they are optional content. Rejected because optional content still needs readable platforming fairness.

## Risks / Trade-offs

- [Authoring ambiguity] “Nearby” and “legible” are partly qualitative and can be interpreted inconsistently. → Mitigation: keep the mechanic bounded to explicit reveal plus scanner links and require scripted route verification for discover, activate, skip, and expire flows.
- [State regression] Mixed persistence behavior could accidentally preserve active timers or wrongly clear revealed state after checkpoint recovery. → Mitigation: add direct state tests for checkpoint snapshots before and after reveal, plus respawn/reset tests for timed activation.
- [Route safety drift] A stage could satisfy link validation but still strand the player if the secret route expires or is skipped. → Mitigation: require a safe main-route fallback in the spec and exercise both success and skip paths in stage-playtest coverage.
- [Scope creep] Implementation might drift toward generic trigger composition once both systems touch the same route. → Mitigation: keep the spec and tasks explicit that only reveal plus scanner composition is in scope.

## Migration Plan

1. Extend authored stage metadata and validation so a timed temporary route can explicitly depend on both an existing reveal cue and an existing scanner activation without enabling other trigger combinations.
2. Update simulation state and `GameSession` logic to compose persistent reveal discovery with reset-on-respawn timed activation and support-safe expiry.
3. Synchronize scene presentation so timed-reveal supports respect both reveal legibility and scanner-driven active timing.
4. Add tests and scripted playtest coverage for authoring validation, mixed persistence, readable activation order, safe fallback, and occupied expiry before implementation is considered complete.

## Open Questions

- No proposal-stage blocker remains. Exact authored fixture placement and timer duration tuning can be decided during apply as long as the implementation preserves legibility before timer start and the required fallback behavior.