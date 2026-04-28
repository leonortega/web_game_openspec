## Context

Live specs already push flying enemies toward underside-lit saucer reads, and archived changes already distinguish ovni hover presentation from grounded enemy motion states. Remaining gap is narrower and mostly visual: current hover enemy still skews top-heavy, the dome or front-window separation is weak, and the overall read lands closer to capped drone than original retro saucer during active play.

This change should stay tightly bounded to procedural art and presentation wiring. User handoff explicitly keeps hover-only role, fixed patrol lane, bobbing, fairness, and collision footprint; forbids direct copying of supplied art, new attacks, or broad runtime renames; and treats blink lights as secondary polish rather than core requirement.

## Goals / Non-Goals

**Goals:**
- Refresh hover enemies into an original symmetric ovni silhouette that reads clearly from canopy through lower hull during active play.
- Preserve existing hover-only movement role, patrol lane behavior, bobbing, collision footprint, and route fairness.
- Allow an optional subtle blink-light accent only if it reinforces identity without becoming primary telegraph or visual noise.
- Keep player-facing wording changes, if any, narrow and presentation-focused rather than broad runtime or data renames.

**Non-Goals:**
- Add new attacks, hover behaviors, defeat logic, collision changes, or encounter rebalance.
- Replace procedural or generated retro art flow with traced or imported reference-derived assets.
- Rename internal enemy kinds, authoring identifiers, or simulation contracts unless implementation finds a very small player-facing label dependency.
- Expand this change into a general enemy roster refresh beyond supported hover enemies and any tiny menu-preview touchups needed for consistency.

## Decisions

- Refresh hover enemies through existing generated-texture and retro-presentation helpers rather than introducing external art assets.
  - Rationale: current repo already expresses retro art procedurally, which is safest path for producing original ovni art without copying supplied image details.
  - Alternative considered: import a hand-drawn sprite sheet based on the image. Rejected because it increases pipeline scope and raises direct-copy risk.
- Make ovni readability hinge on silhouette balance, underside-light placement, and clearer canopy-versus-hull separation instead of changing physics bounds or movement.
  - Rationale: user asks for art gain, not new mechanics. Keeping body footprint and hover path fixed protects fairness and avoids retuning authored encounters.
  - Alternative considered: sell saucer read by widening body or moving collision center. Rejected because footprint changes violate handoff and create unnecessary balance risk.
- Treat blink lights as optional low-amplitude polish routed through existing presentation timing, not as a required state signal.
  - Rationale: subtle blink can help sell ovni identity, but fast or high-contrast blinking would compete with route readability and could look like a telegraph.
  - Alternative considered: constant multi-light strobe pattern. Rejected because handoff forbids distracting blink and because hover enemies already communicate danger through position and motion.
- Keep naming changes documentation- or player-facing only if needed, while preserving current internal kinds and authoring vocabulary.
  - Rationale: request explicitly prefers visible art gain over text-only rename semantics. Internal renames would create churn without player benefit.
  - Alternative considered: fully rename flyer systems to ovni in runtime code. Rejected because it broadens scope far beyond presentation refresh.

## Risks / Trade-offs

- [Saucer refresh could still read too close to existing drone shape] -> Anchor apply work on silhouette checkpoints: symmetric hull, readable underside light, and distinct but subordinate canopy.
- [Optional blink could overpower route readability] -> Keep blink sparse, low-frequency, low-area, and removable if tests or play checks show distraction.
- [Shared retro helpers could unintentionally alter unrelated enemy rendering] -> Limit changes to hover-enemy drawing branches and any directly paired menu-preview wiring only.
- [Player-facing naming cleanup could sprawl into internal renames] -> Constrain any wording changes to visible labels or docs and avoid simulation or authoring identifier churn.

## Migration Plan

1. Update proposal-linked spec deltas to lock presentation scope and hover-enemy guardrails before implementation.
2. In apply, revise generated hover-enemy shapes, palette placement, and optional blink timing inside existing retro presentation path.
3. Validate that menu or preview surfaces match the refreshed art where they already expose the hover enemy, without adding new presentation surfaces.
4. Re-run focused presentation tests and scripted playtest coverage to confirm unchanged patrol fairness, collision footprint, and readability.

## Open Questions

None for apply readiness. Direction is fixed to original ovni presentation refresh with optional subtle blink polish on top of unchanged hover behavior.