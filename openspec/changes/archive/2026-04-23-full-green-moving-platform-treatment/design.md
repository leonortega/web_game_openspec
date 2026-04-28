## Context

`platform-variation` already treats moving platforms as part of assisted movement and already requires category-level traversal readability in play. User handoff narrows missing behavior further: moving platforms currently map to screenshot platform 2's darker body plus cool-top treatment, but requested target is screenshot platform 1's full-green safe-support body treatment with assisted-movement markers preserved. This is a presentation-only adjustment and must not alter moving-platform paths, carry semantics, collision, timing, or any broader traversal taxonomy.

Likely apply work sits in shared scene styling and platform rendering helpers such as `src/phaser/view/gameSceneStyling.ts` and `src/phaser/scenes/gameScene/platformRendering.ts`. That makes design useful even for a small change because the repo already has overlapping platform visual-language rules and apply needs a clear rule for what changes versus what must stay invariant.

## Goals / Non-Goals

**Goals:**
- Make moving platforms reuse plain safe platform full-green body treatment instead of a darker split-body treatment.
- Preserve a local assisted-movement cue on moving platforms through existing vertical markers or a clearly equivalent bounded marker treatment.
- Keep moving platforms readable as carry surfaces within assisted movement without making them look like ordinary static support only.
- Keep validation for this change manual and visual, with no new scripted playtest requirement added by proposal artifacts.

**Non-Goals:**
- Changing moving-platform route authoring, motion profiles, support behavior, detach behavior, or jump timing.
- Reworking bounce pods, gas vents, unstable supports, or static safe platforms beyond whatever comparison is needed to align moving-platform body color treatment.
- Introducing a new texture pipeline, screenshot baseline system, or broad traversal-visual redesign.
- Expanding scope into `stage-progression` or other specs unless implementation later proves a separate contract gap.

## Decisions

### 1. Reuse safe-platform body treatment, not moving-platform-specific dark fill

Apply should treat moving platforms as safe-support geometry first for body fill, using same full-green body language as screenshot platform 1 and plain safe support. The old screenshot platform 2 dark-body plus cool-top split should be removed from moving-platform presentation.

Alternative considered: keep dark moving-platform body and only tweak top stripe hue. Rejected because user request explicitly maps target look to platform 1 full-green treatment, not a softened version of platform 2.

### 2. Preserve assisted-movement identity with markers, not body-color contrast

Moving platforms still need to read as assisted movement, so apply should preserve existing vertical markers or replace them with a similarly bounded local cue attached to moving-platform footprint. Distinction should come from those markers and motion-aware accents, not from reverting body fill to a darker family.

Alternative considered: remove moving-platform markers entirely once body color matches safe platforms. Rejected because it would weaken traversal readability and violate source handoff.

### 3. Keep change presentation-only and local to renderer helpers

Apply should stay inside styling and rendering helpers unless a tiny neighboring refactor is required to share the safe-platform palette cleanly. No stage data, simulation, or traversal-state logic should change for this request.

Alternative considered: add authored metadata or new platform subtypes to drive separate moving-platform visuals. Rejected because current ask is visual alignment, not new content semantics.

### 4. Use manual visual verification as proposal-level validation target

Tasks for this change should require manual in-game confirmation that moving platforms now match full-green safe support while still reading as assisted movement. Proposal artifacts should not require scripted playtests for this pass.

Alternative considered: require new scripted playtests or screenshot fixtures. Rejected because user explicitly asked for manual test only and current request is narrow presentation alignment.

## Risks / Trade-offs

- [Risk] Moving platforms could blend too closely with ordinary static support. -> Mitigation: keep vertical markers or equivalent bounded moving-platform cues visible at gameplay scale.
- [Risk] Apply may touch shared platform palette helpers and accidentally drift plain safe-platform visuals. -> Mitigation: design calls for reusing safe-platform body treatment, not redefining it.
- [Risk] Manual-only validation may miss subtle edge cases in unusual lighting or overlap scenes. -> Mitigation: require focused manual checks in representative moving-platform encounters against nearby static green support.
- [Risk] Renderer code may currently couple body fill and marker treatment. -> Mitigation: allow a small local renderer refactor, but keep data and mechanic contracts unchanged.

## Migration Plan

No data migration required. Apply can ship as a local rendering change and can roll back by restoring prior moving-platform styling if readability regresses.

## Open Questions

None. Handoff already fixes target mapping: screenshot platform 2 becomes screenshot platform 1 full-green look while assisted-movement markers remain present or equivalent.