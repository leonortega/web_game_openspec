## Context

Sustained music currently lives inside the synthesized audio path and is started by scenes such as the menu, stage intro, gameplay, and completion flow. `BootScene` does not preload external music assets, and the existing validation path in `scripts/stage-playtest.mjs` focuses on unlock behavior and stage or theme transitions from the current synthesized direction. The requested change is to replace only the long-running menu and gameplay loops with downloaded free music that better fits the space-fiction framing, while keeping short synthesized interaction cues and transition stingers that already carry readable feedback.

The current playable stage set is `forest-ruins`, `amber-cavern`, and `sky-sanctum`, so the design only needs one menu track plus one gameplay track per current stage. Because the request explicitly prefers license-safe sourcing without attribution burden, the sustained-music pipeline needs a provenance rule as well as a technical loading and ownership plan.

## Goals / Non-Goals

**Goals:**
- Replace sustained menu music and stage gameplay loops with vendored free music assets mapped to the menu and each currently playable stage.
- Keep synthesized menu navigation cues, gameplay feedback cues, and short stage intro, clear, and final stingers.
- Preserve browser audio unlock safety, scene flow timing, and the no-overlap rule for sustained music ownership across menu, intro, gameplay, and completion scenes.
- Record explicit provenance for each chosen track so future updates can verify source, license, and intended mapping.
- Update automated validation so it proves the mapped asset-backed loops play on the correct surfaces and stop cleanly during scene changes.

**Non-Goals:**
- Recompose synthesized sustained music or preserve the old motif-template authoring model for long-running loops.
- Replace short menu interaction cues, moment-to-moment gameplay SFX, or transition stingers with downloaded samples.
- Add runtime downloading, streaming, or online asset resolution.
- Expand the playable stage count or redesign scene ordering.

## Decisions

- Use a strict CC0 or Public Domain sourcing policy for sustained music assets, recorded in a checked-in source manifest.
  - Rationale: the user explicitly wants free music from the internet with minimal licensing burden, and a manifest keeps provenance visible even when attribution is not required.
  - Alternatives considered: CC-BY or broader royalty-free libraries were rejected because they add attribution or provenance risk; FreePD was rejected because it is closed and not acceptable for this change.
- Lock the first-pass track mapping to four concrete OpenGameArt candidates and treat the listed alternates as backups rather than parallel options.
  - Chosen mapping:
    - Menu: `Another space background track` by `yd`, CC0, archive `ObservingTheStar.zip`
    - `forest-ruins`: `Magic Space` by `CodeManu`, CC0, file `magic space.mp3`
    - `amber-cavern`: `I swear I saw it - background track` by `yd`, CC0, file `IswearIsawit.ogg`
    - `sky-sanctum`: `Party Sector` by `Joth`, CC0, file `Party Sector.mp3`
  - Backup candidates to keep in the proposal rationale or manifest notes: `Galactic Temple`, `Space Music: Out There`, and `Tragic ambient main menu`.
  - Rationale: explicit mapping keeps implementation deterministic and makes validation straightforward.
  - Alternative considered: pick tracks during implementation after broader auditioning. Rejected because it would leave the change under-specified and make spec validation subjective.
- Centralize sustained music ownership behind a single asset-backed music controller, while leaving synthesized cues and stingers in the existing synthesized path.
  - Rationale: one owner for long-running loops is the safest way to prevent overlaps when scenes hand off control, and it avoids scattering stop or restart logic across four scenes.
  - Alternative considered: let each scene load and own its own loop independently. Rejected because it increases overlap risk and makes unlock sequencing harder to reason about.
- Preload sustained music assets during boot using explicit asset keys and stage-aware metadata instead of ad hoc scene-local loading.
  - Rationale: the menu can only start promptly after unlock if the track is already available, and gameplay stages need deterministic keys for validation.
  - Alternative considered: lazy-load music on first scene entry. Rejected because it complicates transition timing and increases the chance of silent or delayed starts during playtests.
- Keep transition surfaces on short synthesized stingers and do not require them to be phrase-family continuations of the downloaded loops.
  - Rationale: the requested scope is pragmatic replacement of sustained music only, and forcing motif continuity between downloaded tracks and synthesized stingers would add unnecessary composition work.
  - Alternative considered: replace transition stingers with downloaded clips from the same music sources. Rejected because it would expand sourcing, editing, and timing complexity without clear user benefit.
- Extend validation to cover manifest integrity, asset mapping, unlock-safe playback, and single-loop ownership across scene changes.
  - Rationale: the existing playtest already touches audio unlock and theme behavior, so it is the right place to catch regressions caused by asset-backed music.
  - Alternative considered: rely only on manual listening checks. Rejected because overlap and unlock regressions are easy to miss without automation.

## Risks / Trade-offs

- [Risk] Downloaded tracks may have inconsistent loudness or mastering relative to synthesized cues. → Mitigation: add per-track gain configuration and validate relative levels during implementation.
- [Risk] Mixed source formats such as MP3 and OGG can complicate loading behavior if asset keys are not normalized. → Mitigation: vendor the chosen files deliberately, expose stable asset keys, and keep loader metadata format-aware.
- [Risk] Short synthesized stingers may feel less thematically connected once long-running synthesized loops are gone. → Mitigation: keep the stingers brief, timing-focused, and clearly transitional rather than trying to imply full melodic continuity.
- [Risk] A centralized sustained-music controller adds one more abstraction around the existing audio code. → Mitigation: keep its responsibility narrow to load-state checks, loop ownership, and stop or replace behavior.
- [Risk] Upstream source pages could change or disappear after vendoring. → Mitigation: preserve the original source metadata and chosen archive or file names in the manifest so provenance does not depend on a live site lookup.

## Migration Plan

1. Vendor the approved music files into the served asset tree and add the manifest that records source and mapping.
2. Add boot-time loading and a centralized sustained-music ownership path that can switch between menu and per-stage loops after unlock.
3. Update the scenes that currently start synthesized sustained music so they instead request the mapped asset-backed loop or stop active music when a stinger-only surface takes over.
4. Extend automated validation to assert correct track selection, unlock-safe playback, and clean loop handoff.
5. If a shipped build needs rollback, restore the previous synthesized sustained-music calls and remove the asset-backed mapping without changing synthesized cues or stingers.

## Open Questions

None. The requested sourcing policy, track choices, and scope boundaries are specific enough to leave this change apply-ready.