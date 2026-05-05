## Why

The current enemy roster is globally uniform across stages, which limits how strongly each biome can differentiate its encounters without relying only on layout or palette changes. This change introduces a tightly bounded set of biome-linked enemy variants that keep the existing readability-first encounter rules intact while making a small number of authored encounters feel more specific to their stage identity.

## What Changes

- Add support for authored biome-linked enemy variants as explicit modifiers on a small subset of existing enemy kinds instead of introducing a broad enemy-system rewrite.
- Limit the first rollout to one or two mechanically clear variants that preserve the base role of the parent enemy kind and remain readable inside current stage layouts.
- Require each new variant to appear first in an isolated teaching beat with safe footing, clear telegraph space, and no forced mixed-threat pressure before later authored reuse.
- Update targeted authored encounters and visible enemy presentation so the selected variants are visually legible and biome-specific without obscuring attack timing or lane ownership.
- Add validation coverage that proves the new variants still respect critical-path safety, support-based fairness, and mixed-encounter readability expectations.

## Capabilities

### New Capabilities

### Modified Capabilities
- `enemy-hazard-system`: Add bounded biome-linked enemy variant rules covering authored rollout, telegraph readability, and encounter-safety expectations.

## Impact

- Affects authored enemy metadata and selected encounter placements in `src/game/content/stages.ts`.
- Affects enemy runtime state/setup and variant-specific behavior hooks in `src/game/simulation/state.ts` and `src/game/simulation/GameSession.ts`.
- Affects only the rendering or playtest surfaces needed to make variant identity and telegraphs visibly readable.
- Requires spec coverage in `openspec/specs/enemy-hazard-system/spec.md` and implementation validation through the existing playtest flow.