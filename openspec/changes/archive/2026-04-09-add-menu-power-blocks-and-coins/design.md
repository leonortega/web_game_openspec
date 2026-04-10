## Context

The game already has a basic scene flow and a single stage-oriented progression model. That model is enough for a minimal platformer, but it does not expose run configuration or a flexible power economy. The requested change introduces a menu-driven entry point, authored reward blocks, and a persistence rule for powers across levels.

## Goals / Non-Goals

**Goals:**
- Add a main menu that lets the player start the game, read the rules, adjust volume, choose enemy pressure, and select difficulty.
- Make powers come from authored interactive blocks instead of stage-specific unlocks.
- Persist active powers across stages until the player is hurt or dies.
- Restore full energy when the player clears all coins in a level.

**Non-Goals:**
- Reworking the core platformer movement model beyond what is needed for the four powers.
- Introducing randomized reward drops.
- Replacing the existing stage structure or checkpoint system.

## Decisions

- Use a single menu scene with in-place panels or overlays for rules and settings rather than separate navigation-heavy screens. This keeps the boot flow short and avoids adding unnecessary scene churn.
- Treat volume as one master value. That is enough for the requested scope and keeps the settings model simple.
- Treat `Enemies` and `Difficulty` as distinct controls. Difficulty should change overall pressure, while the enemy control can tune how aggressive or dense encounters feel in authored stages.
- Represent powers as session state that lives outside the current stage. That lets the player keep a power into later levels without tying it to a specific map.
- Make reward blocks fixed and authored. Randomized rewards would weaken stage design readability and make testing harder.
- Track coin completion per level and trigger the full-energy restore only on complete collection. That gives the player a clear optional objective and a strong reward for full cleanup.

## Risks / Trade-offs

- [Risk] Menu settings may drift from gameplay if the state handoff is not centralized. → Keep selected settings in the same run/session state that launches gameplay.
- [Risk] Persistent powers can make later stages easier than intended. → Author later stages with that assumption and scale enemy pressure through difficulty.
- [Risk] Full-energy restore from coin completion can be overpowered on short stages. → Gate it strictly to collecting every coin in the current level.
- [Risk] Block-authored powers increase level-authoring work. → Use a small fixed power catalog and simple block metadata.

## Migration Plan

1. Add the menu/settings entry point and wire it into the existing scene start flow.
2. Introduce a reward-block model for level content.
3. Move power acquisition to the new block model and persist active powers across level transitions.
4. Add coin-completion tracking and the full-energy reward.
5. Update HUD and transition copy so the player can see settings, coin status, and active powers.

## Open Questions

- Should `Enemies` be a toggle, a count slider, or a small preset selector?
- Should difficulty use three named presets or a numeric scale?
- Should the rules panel pause the game loop if opened during gameplay, or be menu-only?
