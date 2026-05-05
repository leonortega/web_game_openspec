## Context

The current support pipeline in `GameSession` retains moving or falling support long enough to preserve grounded movement and jump timing, but the same update can later process that former support as a horizontal blocker after top-surface contact ends. In the reported failure, a platform clears out from under the player and the player is shoved to the support's edge before falling, which breaks traversal readability and makes the occupied position depend on collision ordering rather than authored motion.

This change is intentionally narrow. The fix must preserve normal side collisions, jump and coyote timing, dash overrides, gravity-field behavior, and falling-platform support semantics while contact remains valid. The change also must avoid tolerance-only hacks that hide the symptom without encoding why the former support should be treated differently for one update.

## Goals / Non-Goals

**Goals:**
- Preserve the player's occupied position on the single update where authored support motion ends valid top-surface contact.
- Exempt only the immediately previous support from same-frame horizontal wall resolution on that detach update.
- Keep normal controller and collision behavior unchanged outside that one detach frame.
- Add regression tests that capture the shove-to-edge failure and guard adjacent wall-collision behavior.

**Non-Goals:**
- Rewriting the broader collision system or platform-motion pipeline.
- Adding global collision tolerances or generic wall-pass exceptions.
- Changing jump, coyote, dash, gravity-field, or falling-platform rules beyond the detach-frame exemption.
- Altering stage content, authored platform paths, or presentation.

## Decisions

### Decision: derive the exemption from prior support identity, not from loose spatial tolerance

The implementation should record the immediately previous valid support and create a detach-frame exemption only when that specific body was supporting the player from above and authored support motion caused that support contact to end. This makes the rule explainable and bounded.

Alternative considered: expanding collision tolerances or adding a generic overlap grace window. Rejected because it would hide the symptom without distinguishing former support from ordinary side walls and would risk broad collision regressions.

### Decision: scope the exemption to horizontal resolution for one update only

The failure occurs because the former support re-enters same-frame horizontal blocking after support clears, so the narrowest fix is to ignore that former support only during horizontal collision resolution on the detach update. Vertical collision, future side collisions, and collisions with every other solid should remain unchanged.

Alternative considered: suppressing all collisions with the former support until distance opens up. Rejected because it would broaden the behavior beyond the detach frame and could let the player clip through legitimate later side contact.

### Decision: prove the fix with simulation tests that cover both preservation and boundaries

Tests should assert that the player falls from the occupied position they had on the platform, that nearby non-support walls still block normally on the same update, and that later side collisions with the former support still resolve after the detach frame passes. Focused tests are preferable to stage-only playtest evidence because the failure depends on update ordering.

Alternative considered: relying on broad playtest coverage alone. Rejected because broad traversal tests are less precise about the one-frame collision boundary this change is tightening.

## Risks / Trade-offs

- [Risk] Detach detection could accidentally trigger on jump or walk-off cases instead of support-driven separation. -> Mitigation: gate the exemption on prior top-surface support identity plus support-motion-driven loss, not on any airborne transition.
- [Risk] Nearby geometry could be skipped too broadly if the exemption is shape- or category-based instead of body-specific. -> Mitigation: exempt only the single former support body and only during horizontal resolution on one update.
- [Risk] A too-narrow test suite could miss adjacent regressions in coyote time or falling-platform support. -> Mitigation: add targeted regression tests for detach behavior plus a focused follow-up validation pass over related movement tests.

## Migration Plan

No content migration is required. Apply should update simulation code and tests in place, then validate with targeted movement tests.

## Open Questions

No open design questions remain for proposal. The main implementation requirement is to keep the exemption body-specific and single-frame.