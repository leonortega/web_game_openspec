## Context

The repo already has a working synthesized audio pipeline, scene-owned sustained music, and stage metadata that labels the current theme, intro phrase, gameplay loop, completion cue, and signature. The current request is not to add audio from scratch, but to deepen composition quality within that existing procedural direction so the menu and each playable stage feel authored, memorable, and less repetitive.

The explored gap is that music data is still too shallow: theme profiles are mostly short voice arrays with limited phrase structure, and stage metadata does not encode the compositional information needed for stronger hooks, clearer phrase form, or anti-fatigue variation. Implementation therefore needs a small authoring-model expansion that keeps the same synth runtime, browser unlock behavior, and scene timing semantics while making composition rules explicit and testable.

## Goals / Non-Goals

**Goals:**
- Keep the existing synthesized or procedural audio pipeline and improve composition quality through richer authored theme data.
- Give the menu a distinct title-theme grammar and give each current playable stage its own recognizable motif, phrase form, cadence behavior, and restart feel.
- Encode composition structure in data so the runtime can play intentional intros, gameplay loops, turnarounds, and completion phrases instead of raw short loops.
- Preserve current menu, intro, gameplay, clear, and final scene ownership and browser audio-unlock semantics.
- Make validation concrete enough to prove distinct motif identity and loop variation for the menu plus the current three playable stages.

**Non-Goals:**
- Replacing synthesized playback with external music files or sampled soundtrack assets.
- Introducing adaptive stem mixing, dynamic soundtrack layering, or a new music engine beyond the current synth scheduler.
- Changing menu flow, stage timing, hazard behavior, or transition durations.
- Requiring a fully different instrument palette for every stage; distinctiveness comes primarily from motif, contour, rhythm, cadence, and register.

## Decisions

- Expand the music authoring shape rather than replacing the synth runtime.
  - The implementation should extend the current theme definition model so a menu or stage theme can declare composition-focused fields such as motif cells, phrase template, bass or accompaniment rules, cadence or turnaround pattern, register range, counterline entry rules, and restart pickup behavior in addition to existing labels and signatures.
  - This keeps the runtime architecture stable and makes composition intent visible in data instead of burying it in ad hoc voice arrays.
  - Alternative considered: swap to imported chiptune tracks. Rejected because it breaks the repository's procedural synthesized-audio direction and adds asset-management scope that is unnecessary for this change.

- Use a shared phrase-family model for menu and stage themes.
  - Each theme package should define related surfaces for title or menu loop, stage intro, gameplay loop, stage clear, and final congratulations where applicable, so the same musical identity can be introduced, developed, and closed across scenes.
  - For stage themes, the intro should state the hook, the gameplay loop should develop it in an authored multi-phrase form, and the clear cue should cadence or resolve that material.
  - Alternative considered: keep every surface independent. Rejected because the requested improvement is specifically about stronger compositional relationships, not just more notes.

- Make current stage contrast explicit in the authoring contract.
  - The three currently playable stages should continue using their existing identities, but the composition rules should encode stronger contrast: `forest-ruins` as rising or buoyant, `amber-cavern` as compressed or heavier, and `sky-sanctum` as higher or more open and floating.
  - This contrast should be expressed mainly through contour, register, rhythmic density, cadence shape, and accompaniment motion rather than just oscillator choice.
  - Alternative considered: only require generic distinctness. Rejected because the request asks for better music for each stage, and the current stage set is small enough to define concrete contrast expectations.

- Standardize loop anti-monotony behavior.
  - Gameplay themes should use an authored phrase template equivalent to 8-bar or 16-bar form and must include at least one repeat-relief technique such as a turnaround bar, fill, second-phrase bass variation, delayed counterline entrance, or pickup into the restart.
  - This gives implementers multiple acceptable tactics while preventing endless identical phrase restarts.
  - Alternative considered: require a fixed AABA form for every theme. Rejected because it is more rigid than needed and could make the three stage identities converge.

- Validate both structure and perception.
  - Automated coverage should confirm that menu and stage theme definitions include the required composition fields, scene ownership remains clean, and phrase families do not collapse to reused unchanged patterns.
  - Playtest validation should compare the unlocked menu theme and the three stage themes to confirm audible distinction, related intro or clear phrasing, and non-fatiguing restarts.
  - Alternative considered: only validate that playback triggers occur. Rejected because the explored problem is that trigger coverage already exists while perceived composition quality is still weak.

## Risks / Trade-offs

- [Subjective quality judgments] Stronger music can still be interpreted differently by reviewers -> Define concrete authoring fields, stage-specific contrast expectations, and comparative validation steps rather than relying on taste alone.
- [Scope creep into the runtime] Richer composition data could grow into a new music system -> Limit the work to data-shape expansion plus modest scheduler support for phrase variation, turnarounds, and pickups.
- [Regression in scene handoff] More phrase types increase the risk of overlapping owners or timing drift -> Preserve the current sustained-owner model and require tests around menu, intro, gameplay, clear, and final transitions.
- [Overlap with active menu work] The active menu change also touches menu surfaces -> Keep this proposal strictly about music composition and cue behavior, not layout or interaction design.

## Migration Plan

1. Extend the theme authoring model used by the synth runtime and stage metadata so composition structure is explicit.
2. Re-author the menu theme and the three playable stage themes using the richer structure.
3. Update scene audio ownership to request the correct phrase family for menu, intro, gameplay, clear, and final surfaces without changing durations.
4. Expand unit and playtest validation to compare composition identity, restart variation, and transition continuity.

## Open Questions

None blocking apply readiness. The change assumes the current menu plus the current three playable stages remain the intended scope for this composition pass.