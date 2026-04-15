## Context

The current repo already routes music and sound ownership through the synthesized audio system across menu, intro, gameplay, and completion scenes. The explored request is not asking for missing triggers; it is asking for a noticeably stronger retro 8-bit identity, broader cue coverage for interactive and moving entities, and clearer differentiation between menu, stage, reward, danger, death, and congratulations moments.

This change is cross-cutting because it affects shared audio utilities, scene ownership handoffs, stage-authored music identity, gameplay event hooks, and regression/playtest validation. It also overlaps active menu and turret work, so the audio proposal needs to stay tightly scoped to sound identity and coverage without reopening layout or hazard timing behavior.

The repo direction today is synthesized/procedural audio rather than imported authored audio files. The proposal should preserve that direction unless a later change intentionally revisits the audio pipeline.

## Goals / Non-Goals

**Goals:**
- Define a stronger 8-bit music identity for the menu, each playable stage, transition surfaces, and the final congratulations moment.
- Require a broader and more intentional sound-effect taxonomy for player actions, moving enemies, moving world objects, interactive objects, powers, death, and menu interactions.
- Keep motion-related sound readable by specifying cadence, cooldown, or state-change based triggering instead of continuous noise.
- Preserve current scene timing, browser-audio unlock behavior, and synthesized-audio ownership semantics.
- Make validation concrete enough that implementation can prove not only trigger presence but perceptible differentiation.

**Non-Goals:**
- Switching from synthesized audio to external recorded assets.
- Redesigning menu layout, hazard timing, or scene progression flow.
- Requiring every enemy subtype or every object instance to have a fully unique sound.
- Introducing adaptive music systems, layered stems, or runtime music composition beyond the current repo scale.

## Decisions

- Keep the existing synthesized audio pipeline as the implementation foundation and strengthen its authored phrase presets, envelopes, rhythmic patterns, and cue families instead of importing new audio assets.
  - Alternative considered: add external chiptune tracks and sampled retro effects. Rejected because it changes the repo's current audio direction, increases asset-management scope, and is unnecessary to satisfy the user's request for stronger style.

- Interpret "one different for each one" pragmatically as one recognizable menu theme and one recognizable gameplay loop or motif per authored playable stage, with matching intro/opening phrases and completion cues where applicable.
  - Alternative considered: require a completely different full-length composition for every scene surface and every stage state. Rejected because it would be disproportionate for the current game size and would slow implementation without materially improving apply readiness.

- Define sound coverage by cue families rather than by one-off event names: menu UI, player movement/action, player reward/progression, player damage/death, threat attack/contact, interactive object actuation, moving-object motion, transition intro, stage clear, and final congratulations.
  - Alternative considered: specify individual sounds only for currently known hooks. Rejected because the user explicitly called out broad categories such as moving things, powers, death, congratulations, and button clicks, so the contract needs stable behavioral families.

- Require motion-heavy enemy and object audio to trigger on state changes, cadence windows, or notable movement beats instead of every frame or every simulation tick.
  - Alternative considered: attach looping or very frequent sounds to all moving entities. Rejected because it would create audio fatigue and make the new retro cues less legible.

- Validate the change with both deterministic trigger ownership checks and perceptual regression expectations that compare menu, stage, danger, reward, and completion surfaces for recognizable differentiation.
  - Alternative considered: rely only on existing automated trigger tests. Rejected because the explored problem statement is specifically that previous validation passed while the perceived improvement remained weak.

## Risks / Trade-offs

- [Perceptual subjectivity] Stronger 8-bit identity can still be interpreted differently by reviewers -> Encode concrete expectations around waveform character, motif distinctness, cue families, and comparative validation across surfaces.
- [Audio fatigue] Expanding movement and interaction cues could produce clutter -> Gate moving-entity sounds behind cooldowns, state changes, or event beats rather than continuous playback.
- [Overlap risk] Menu and turret changes also touch audio-adjacent scenes -> Limit this change to audio identity and cue semantics, leaving layout and hazard-behavior ownership with their existing changes.
- [Authoring cost] Distinct per-stage motifs increase implementation work -> Allow motif reuse of instrumentation language while requiring clearly different melodic or rhythmic identity per stage.

## Migration Plan

1. Extend synthesized music and cue definitions so menu, stage intro, gameplay, completion, and UI surfaces have explicit 8-bit themed phrase families.
2. Thread stage-specific theme selection through existing stage metadata and scene-audio ownership without changing scene order or timing.
3. Add or refine gameplay event hooks for moving threats, moving objects, powers, death, completion, and menu interactions with cooldown-safe triggering.
4. Update automated regression coverage and playtest validation to prove clean scene ownership, cue coverage, and perceptible differentiation.

## Open Questions

- None blocking apply readiness. This change assumes the current synthesized/procedural audio direction remains the intended repository standard.