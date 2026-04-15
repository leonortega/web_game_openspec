## 1. Palette Separation Rules

- [x] 1.1 Finalize the retro-presentation-style spec delta for stage-authored backdrop separation and readability-safe secondary effects
- [x] 1.2 Identify the authored stage palette inputs and fallback rules needed to keep backdrop colors distinct from playable surfaces

## 2. Implementation

- [x] 2.1 Refactor the retro backdrop helper so background bands and decorative columns derive from the stage backdrop palette instead of reusing foreground-facing panel or platform colors
- [x] 2.2 Update the gameplay-facing scenes that consume the retro backdrop so they pass or resolve the separated stage palette consistently
- [x] 2.3 Tune any subtle backdrop-only separation effect so it improves foreground/background contrast without reducing hazard, player-power, HUD, or transition-text readability

## 3. Verification

- [x] 3.1 Add or update focused regression or playtest coverage for stages whose previous backdrop treatment blended with terrain or props
- [x] 3.2 Validate readability for hazards, player powers, HUD text, and stage transition text against the updated backdrop treatment
- [x] 3.3 Run `npm run build` and the relevant focused playtest validation, then record the results