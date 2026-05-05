## Context

The current stage authoring model already supports optional detours, reveal platforms, scanner bridges, low gravity, terrain surfaces, launchers, and other bounded traversal mechanics inside a single stage. What it does not define clearly is how to author a stronger class of hidden expedition spaces that feel intentional, provide optional reward value, and reconnect to the critical path later without turning into alternate completion routes or a new progression graph.

This change is primarily an authored-content and validation change that will likely touch stage content definitions and scripted playtest coverage first. Runtime changes should remain minimal and only support validation or readability if the existing stage data cannot express secret-route entry and reconnection points clearly enough.

## Goals / Non-Goals

**Goals:**
- Define a bounded same-stage secret-route pattern that branches off the main route, enters a hidden micro-area or optional sample cave, and rejoins the critical path later.
- Make explicit what counts as an abandoned micro-area, an optional sample cave, and a secret exit in this project.
- Keep route discovery based on authored layout cues and currently supported traversal mechanics instead of a new branch-selection or secret-tracking system.
- Require validation and playtest coverage that proves secret routes are discoverable, provide meaningful optional reward value, and reconnect cleanly downstream.

**Non-Goals:**
- Add alternate stage-clear exits, branching unlock trees, or multiple completion outcomes.
- Introduce a new overworld, route-selection menu, map overlay, or persistent secret counter.
- Add new traversal mechanics when current reveal, bridge, launcher, low-gravity, terrain-surface, and optional-route tools are sufficient.
- Guarantee that every stage must use all secret-route variants; the change defines support and quality expectations, not a new mandatory global count beyond the authored requirement updates.

## Decisions

- Model secret routes as authored same-stage detours in stage content rather than as separate stage nodes or alternate completion flows.
  - Rationale: the requested scope is bounded to hidden connectors that rejoin later inside the same stage.
  - Alternative considered: represent secret routes as stage-level branching outcomes. Rejected because that would expand into progression branching and multiple stage-clear exits.

- Define an abandoned micro-area as a compact off-route authored pocket that reads as a previously used, partially collapsed, or partially scavenged expedition space and contains at least one meaningful reward, encounter, recovery, or traversal beat.
  - Rationale: this keeps the term concrete enough for stage authors and playtest review instead of leaving it as a purely visual theme.
  - Alternative considered: treat any small hidden room as a micro-area. Rejected because that would allow empty or decorative dead ends with no gameplay value.

- Define an optional sample cave as a hidden cave-like reward pocket that contains a meaningful research-sample cluster or equivalent optional reward and returns to the main route either through the entry path or through a downstream reconnecting secret exit.
  - Rationale: the cave should justify discovery with optional value and remain clearly non-mandatory.
  - Alternative considered: allow sample caves with only atmosphere or lore flavor. Rejected because the requested change emphasizes optional reward value.

- Define a secret exit as a hidden connector or branch exit that rejoins the main route later within the same stage and never as a second stage-completion exit.
  - Rationale: this enforces the bounded interpretation from the handoff and prevents scope drift.
  - Alternative considered: allow a secret route to terminate in a separate clear gate or hidden stage skip. Rejected because it changes stage-completion semantics.

- Default to authored layout and existing traversal mechanics for discovery, with no new tracked runtime discovery state required.
  - Rationale: the engine already supports optional routes and traversal modifiers, so the first implementation pass should stay content-driven.
  - Alternative considered: add per-run route discovery flags, HUD markers, or secret counters. Rejected because they add stateful systems that are outside the requested scope.

- Allow minimal authored metadata only if validation or scripted playtest coverage cannot infer route entry and reconnection reliably from existing layout data alone.
  - Rationale: automated verification may need bounded route markers, but those markers should remain authoring-time descriptors rather than player-facing gameplay state.
  - Alternative considered: require full runtime route tracking from the start. Rejected because validation needs do not justify new persistent gameplay state.

- Require both authoring validation and scripted playtest coverage for secret routes.
  - Rationale: this change is about route quality, so implementation needs both static content checks and a route-level probe that exercises discovery, optional reward value, and reconnection.
  - Alternative considered: rely only on manual playtest notes. Rejected because secret-route regressions are easy to miss without deterministic coverage.

## Risks / Trade-offs

- [Risk] Secret routes may become so hidden that average players never discover them. -> Mitigation: require readable layout cues from the traversable main route and validate discovery in scripted playtest coverage.
- [Risk] Optional micro-areas may feel like filler if they contain no meaningful payoff. -> Mitigation: require a reward, encounter, recovery beat, or traversal value instead of decorative dead ends.
- [Risk] Automated validation may be weak if route entry and reconnection cannot be identified from current stage data. -> Mitigation: permit minimal authored route markers that describe entry, reward pocket, and reconnection spans without creating runtime progression state.
- [Risk] Secret-route shortcuts could accidentally bypass too much intended stage pacing. -> Mitigation: require downstream reconnection that preserves the single stage-clear flow and review reward routes against critical-path pacing.

## Migration Plan

1. Update the stage-progression and platform-variation specs to define secret-route structure, bounded secret-exit behavior, and route-quality expectations.
2. Extend stage authoring validation and any needed route descriptors in stage content so secret-route entry, optional reward value, and downstream reconnection can be checked deterministically.
3. Update scripted playtest coverage to probe at least one authored secret route for discovery cue quality, optional reward payoff, and later reconnection while also confirming the main route remains completable when the detour is skipped.
4. Apply the new expectations to authored stages incrementally, preferring existing mechanics and only adding minimal metadata where automation requires it.

## Open Questions

- None blocking for proposal readiness. If implementation proves that scripted coverage cannot identify secret-route entry and rejoin points from existing stage data, add minimal authoring markers without introducing new player-visible runtime state.