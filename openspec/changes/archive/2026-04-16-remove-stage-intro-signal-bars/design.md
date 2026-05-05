## Context

The current stage intro scene still renders a right-side signal-bars accent and debug surfaces expose `accentMode='signal-bars'`, which has leaked into the playtest expectations for the capsule-exit transition flow. The user direction is narrower than the prior archived accent cleanup: remove the intro signal-bars entirely rather than replacing them with a different non-figurative accent, while keeping the existing stage timing, status readability, and audio handoff behavior unchanged.

This is a small but cross-cutting transition change because the intro-scene presentation and the playtest contract both currently assume that a specific accent mode exists. The proposal therefore needs an explicit contract update so apply can remove that presentation path without being forced to invent a substitute accent just to satisfy the old expectation.

## Goals / Non-Goals

**Goals:**
- Remove the stage intro signal-bars accent without introducing a replacement intro-side motif.
- Update the transition spec so a no-accent intro surface is explicitly compliant.
- Update validation and playtest expectations that currently hardcode `accentMode='signal-bars'`.
- Preserve existing intro scene duration, scene ordering, status readability, and audio timing semantics.

**Non-Goals:**
- Redesigning the stage-clear or final-congratulations surfaces.
- Introducing new intro art motifs, new audio cues, or new transition motion systems.
- Changing stage progression rules, completion flow, or unrelated transition presentation.

## Decisions

### Remove the intro accent path instead of replacing it
Apply should delete the dedicated signal-bars presentation path from the stage intro scene and leave the screen centered on stage identity and player status. This matches the explicit user wording and keeps the scope tighter than inventing a replacement motif.

Alternative considered: replace signal-bars with another abstract accent. This was rejected because the live requirement does not force a pre-stage accent, and adding a new motif would broaden the change beyond simple removal.

### Treat intro accent output as optional or absent in debug and playtest surfaces
Any debug state or playtest output that currently encodes `accentMode='signal-bars'` should move to an absent, null, or explicit `none` representation that confirms no intro accent is being rendered. The exact representation can follow current code conventions, but the validation contract must stop requiring a named accent mode for the intro scene.

Alternative considered: keep reporting `signal-bars` even after the accent is visually removed. This was rejected because it would leave the validation surface lying about the rendered presentation and make future regressions harder to detect.

### Limit the spec delta to pre-stage optionality
The OpenSpec delta should only change the transition requirement enough to make intro accent motion optional and removable. Completion-surface behavior stays under the existing bounded-retro-motion contract because the user asked specifically for removing the intro signal-bars and not for broader transition cleanup.

Alternative considered: rewrite the full transition-accent requirement around accent elimination across all surfaces. This was rejected because it would exceed the requested scope and create unnecessary apply work.

## Risks / Trade-offs

- Removing the accent may make the intro layout feel barer than before. -> Mitigation: preserve stage title, status composition, and existing sparse motion elsewhere instead of backfilling with a new decorative element.
- Debug and playtest consumers may assume `accentMode` always has a concrete string value. -> Mitigation: update the relevant script expectations together with the scene change and keep the accepted representation explicit.
- A narrow delta could miss another test that depends on the removed accent. -> Mitigation: keep implementation requirements focused on the known playtest surface and verify any intro-scene debug outputs touched during apply.

## Migration Plan

No data migration is required. Apply should update the intro-scene rendering logic and the related playtest expectation in the same change so the behavior and validation contract stay aligned. Rollback is a straightforward revert of the scene change, playtest expectation update, and this spec delta if the no-accent presentation creates an unexpected readability regression.

## Open Questions

None. The proposal is apply-ready with the no-replacement direction fixed.