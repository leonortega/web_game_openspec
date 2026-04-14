## Context

The current runtime models enemies by a small global `EnemyKind` union and keeps most authored behavior in stage data plus kind-specific update branches inside `GameSession`. That has worked well for readable platformer encounters, but it means biome identity is expressed mostly through layout, palette, and traversal rather than through enemy presentation. The requested change needs a bounded path that adds stage-specific enemy flavor without expanding into a generic enemy-system rewrite or breaking the repo's existing readability rules around safe staging points, clear telegraphs, lane separation, and deterministic authored patterns.

The most constrained implementation path is to keep the existing global kinds intact and add a small authored variant layer on top of one existing kind. Turrets are the best first target because they already have deterministic timing, strong lane ownership, and clear support requirements. A turret-only rollout also matches the current runtime touchpoints: authored enemy metadata in `src/game/content/stages.ts`, enemy state shape in `src/game/simulation/state.ts`, and turret update/projectile timing in `src/game/simulation/GameSession.ts`, with only small rendering/playtest updates needed for visible telegraph distinction.

## Goals / Non-Goals

**Goals:**
- Add biome-linked enemy variants without adding a new global enemy family.
- Keep the initial rollout limited to two turret variants: an Ember Rift `resinBurst` turret and a Halo Spire `ionPulse` turret.
- Require variant introduction through isolated teaching beats before any later mixed encounter reuse.
- Preserve deterministic encounter behavior, safe footholds, lane separation, and readable telegraph timing in existing authored stages.
- Add validation that demonstrates the new variants still satisfy the current encounter-readability and safety expectations.

**Non-Goals:**
- Reworking walker, hopper, charger, or flyer behavior in this change.
- Building a generic trait stack or data-driven enemy behavior framework for all future enemy ideas.
- Changing player abilities, projectile collision rules, or platform mechanics.
- Retuning every existing stage encounter; only the selected teaching and follow-up encounters should move.

## Decisions

- Keep `EnemyKind` unchanged and add an optional authored/runtime enemy variant identifier for supported combinations only.
  - Rationale: this preserves the current simulation architecture and avoids turning a bounded variant rollout into a taxonomy rewrite.
  - Alternative considered: add new enemy kinds for each biome enemy. Rejected because it would broaden the change across all enemy creation, rendering, and help surfaces.

- Limit the first rollout to turret-only variants with narrow firing-pattern overrides.
  - Rationale: turrets already have deterministic support placement and attack cadence, so small cadence changes can remain readable while giving stages a stronger biome signature.
  - Alternative considered: spread the change across walkers, flyers, and turrets. Rejected because it would multiply implementation and balancing risk before the repo proves the variant pattern works.

- Implement exactly two biome-linked turret variants in this change.
  - `resinBurst` in Ember Rift Warrens keeps the standard turret lane role but replaces the normal single shot with a longer amber telegraph followed by a short two-shot burst.
  - `ionPulse` in Halo Spire Array keeps the standard turret lane role but uses a longer cyan charge telegraph followed by a single faster pulse shot.
  - Rationale: these are mechanically distinct enough to be teachable, but still preserve the turret's stationary support-based readability.
  - Alternative considered: only visual recolors with no timing change. Rejected because the resulting encounters would not create meaningful biome-linked variation.

- Author each variant into a teaching-beat-first rollout.
  - Rationale: the spec handoff explicitly prioritizes readable introduction before mixed use. Each variant should first appear alone with a recovery foothold and then later appear in one mixed encounter that still preserves lane separation or a safe staging point.
  - Alternative considered: swap existing mid-stage turrets directly into mixed encounters. Rejected because it weakens player learning and makes readability harder to validate.

- Validate the change through both deterministic checks and playtest evidence.
  - Rationale: encounter readability is partly spatial and partly temporal. Implementation should therefore validate authored placement/timing in scripted checks and also run the existing stage playtest flow against the affected stages to confirm the new variants remain fair in practice.
  - Alternative considered: rely only on manual playthrough notes. Rejected because the runtime timing and authored placement boundaries need repeatable regression coverage.

## Risks / Trade-offs

- [Readability drift] Variant cadence changes could make mixed turret encounters feel denser than intended -> Keep the rollout to two authored encounters per variant, require a solo teaching beat first, and preserve a recovery foothold or separate lane in the mixed reuse.
- [Architecture creep] A variant field could expand into an ad hoc enemy-trait system -> Restrict this change to turret-only supported variants and explicit `switch`-style handling in state/setup and turret update code.
- [Presentation mismatch] Visual telegraphs could drift from actual firing timing -> Drive telegraph color/timing from the same authored variant metadata used by the simulation path and verify it in playtests.
- [Stage regression] Replacing existing turrets might accidentally remove current safe approaches -> Update only the selected authored encounters and re-run validation against the affected routes before widening usage.

## Migration Plan

1. Extend authored enemy data and runtime enemy state with a bounded optional turret variant identifier.
2. Add turret-variant timing/presentation handling in simulation and the minimum rendering support needed to show distinct readable telegraphs.
3. Update selected Ember Rift and Halo Spire turret placements so each variant appears in one isolated teaching beat before one later mixed encounter reuse.
4. Add or update deterministic validation and run the existing stage playtest flow for the affected stages.
5. If either variant reduces encounter fairness, remove the mixed encounter reuse and keep only the teaching beat until the cadence is retuned.

## Open Questions

- None. The rollout is intentionally constrained to the two turret variants above so implementation can proceed without further proposal-stage decisions.