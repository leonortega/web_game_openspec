## Context

The game already supports bounded authored traversal variants such as reveal platforms, temporary bridges, launchers, and terrain-surface modifiers, but it does not yet support a powered support surface that becomes usable after the player triggers a nearby authored activator. This change needs to touch authored stage metadata, simulation-owned traversal state, scene synchronization, and regression coverage while staying deliberately narrow: one magnetic platform variant, one nearby activation-node pattern, binary powered solidity only, and no new HUD or generalized traversal framework.

The exploration handoff also narrows the mechanic family aggressively. Magnetic behavior in this first rollout means only "powered equals solid floor support" and "unpowered equals non-supporting." There is no attraction, repulsion, wall cling, ceiling traversal, polarity puzzle logic, or authored node graph. The resulting route should behave like an optional or alternate line inside the existing authored platformer model rather than a new systemic movement layer.

## Goals / Non-Goals

**Goals:**
- Add a single authored magnetic platform variant with binary powered solidity.
- Add a nearby authored activation-node pattern that powers linked platforms through existing proximity or contact-style activation semantics.
- Keep the platform readable in both dormant and powered states without expanding HUD surface area.
- Define reset behavior across death, checkpoint respawn, manual restart, and fresh attempts.
- Require authoring and validation coverage so the mechanic remains bounded, readable, and safe.

**Non-Goals:**
- Polarity-specific runtime behavior, attraction or repulsion forces, or any generalized magnetic physics.
- Wall cling, ceiling traversal, upside-down support, or arbitrary directional movement.
- Multi-node graphs, chained activation logic, or a generalized puzzle-state framework.
- New interact buttons, persistent HUD state, or separate mission UI for the mechanic.
- Broad multi-stage rollout beyond the first bounded authored route added during apply.

## Decisions

- Model magnetic platforms as authored support records linked to one stable activation-node identifier, with simulation-owned runtime power state.
  - Rationale: this matches existing authored-mechanic patterns in the repo where stable content identifiers map to simple runtime state, and it avoids introducing adjacency inference or graph logic.
  - Alternative considered: derive links from spatial overlap or ordered arrays. Rejected because authoring changes would make those links fragile and hard to validate.
- Use a single latched activation pattern: entering or contacting the nearby authored activation node powers its linked platform on that same simulation update and keeps it powered until a reset event.
  - Rationale: a one-way latched state is the smallest useful mechanic, keeps the route legible, and avoids needing toggle-off timing or branching-state rules.
  - Alternative considered: toggle platforms on each activation. Rejected because it would immediately broaden the mechanic into timing or puzzle logic not requested for this rollout.
- Keep magnetic platforms visibly present in both dormant and powered states, with the dormant state non-solid and clearly distinguished from a usable support surface.
  - Rationale: readability is stronger when the player can see both the route piece and its local activator before use rather than discovering an invisible support rule.
  - Alternative considered: keep dormant platforms hidden. Rejected because it would blur the mechanic with reveal platforms and make activation cause and effect less obvious.
- Restrict powered behavior to floor-like top-surface support only.
  - Rationale: the exploration handoff explicitly confines rollout to the current authored platformer model with no wall cling, no ceiling traversal, and no force-based movement.
  - Explicit rule: while powered, magnetic platforms behave like ordinary solid support only for top-surface grounded traversal and jump initiation.
  - Alternative considered: add side adhesion or ceiling traversal once powered. Rejected because it would require controller and collision rewrites beyond the bounded scope.
- Treat activation-node power state as live traversal state that resets on death, checkpoint respawn, manual restart, and fresh stage starts instead of checkpoint-persistent route discovery.
  - Rationale: this keeps reset behavior deterministic, avoids checkpoint snapshots carrying powered-route assumptions, and stays aligned with the request for explicit reset rules.
  - Resulting authoring rule: routes using magnetic platforms must remain safely recoverable when the platform resets, either because the route is optional or because the activator is re-encountered before the route is needed again.
  - Alternative considered: persist powered state through checkpoints activated after node use. Rejected because it would couple checkpoint snapshots to mechanic-specific power state and increase authoring edge cases.
- Keep simulation authoritative for node activation and platform solidity, while the scene mirrors powered versus dormant presentation from simulation state.
  - Rationale: solidity and support affect gameplay directly, so the state transition cannot live only in rendering.
  - Alternative considered: scene-only presentation toggles with static collision. Rejected because presentation and support would drift.
- Require bounded validation and playtest coverage centered on a single authored route.
  - Rationale: repo precedent favors new authored mechanics shipping with explicit validation and scripted coverage, and that guardrail matters here because resets and support readability are easy to regress.
  - Alternative considered: rely only on manual stage iteration. Rejected because the mechanic crosses authoring, simulation, and scene synchronization.

## Risks / Trade-offs

- [Readability risk] If dormant and powered platform presentation are too similar, players may misread unusable support as safe footing. -> Mitigation: require clear powered-versus-dormant presentation and validate that node placement is nearby and visually associated with the route.
- [Reset risk] Resetting powered state on checkpoint respawn can strand players if a route is authored as mandatory after the checkpoint. -> Mitigation: require safe fallback or re-encounterable activation in the spec and cover it in playtest validation.
- [Scope risk] Seemingly small requests for polarity names or extra activation patterns can expand into generalized mechanic families. -> Mitigation: state explicitly that polarity, force-based motion, node graphs, and toggle logic are out of scope for this change.
- [Implementation risk] Collision or support bugs may appear if powered-state transitions are handled outside simulation. -> Mitigation: keep simulation as the source of truth and add state plus route-coverage tests during apply.

## Migration Plan

1. Extend stage content definitions and validation for activation nodes, linked magnetic platforms, stable identifiers, and bounded placement rules.
2. Update simulation state and `GameSession` logic so node activation powers linked platforms, resets rebuild them to their dormant baseline, and top-surface support follows powered state only.
3. Update scene presentation so dormant and powered magnetic platforms remain visibly distinct while staying synchronized with simulation solidity.
4. Add or extend authored stage fixtures, unit coverage, and scripted stage playtests for activation, readability, and reset behavior before implementation is considered complete.

## Open Questions

No apply blocker remains. Exact naming and art-facing presentation details for the activation node and dormant versus powered platform can be decided during apply as long as the mechanic stays binary, nearby-linked, floor-only, and reset-consistent.