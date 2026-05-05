## Context

This is a focused follow-up to the archived `2026-04-15-stage-message-placement-and-defeat-particles` change. That change already established the lower-left transient message lane and distinct defeat classes, so this follow-up should not reopen the broader feature set or invent a new presentation pipeline. The remaining problem is live readability: the message lane still sits too high above the bottom-left edge, and defeat particles are likely either rendering beneath ordinary gameplay objects or reading too faintly to hold up during busy encounters.

The likely implementation touchpoints are split across CSS HUD layout and Phaser presentation wiring. The follow-up must keep the existing transient stage-message flow, preserve defeat-cause semantics, and avoid any drift in defeat timing, damage rules, checkpoint behavior, or respawn cadence.

## Goals / Non-Goals

**Goals:**
- Move the transient gameplay-message lane perceptibly closer to the bottom-left edge while keeping it safely on-screen across standard and narrow viewports.
- Keep transient messages clear of persistent HUD and stage-readout overlaps without creating a new HUD region or separate overlay system.
- Ensure stomp, Plasma Blaster projectile, and player-death particles remain clearly visible in live gameplay above ordinary gameplay objects.
- Preserve the existing distinct defeat classes while allowing bounded readability tuning if the current particle presets are too weak.
- Preserve current gameplay semantics, defeat resolution, and respawn cadence.

**Non-Goals:**
- Redesign the top HUD band, bottom-right readout, or broader active-play information architecture.
- Add new combat rules, new defeat classes, new particle systems, or new overlay scenes.
- Change stomp rules, projectile damage behavior, player death timing, checkpoint semantics, or respawn selection.
- Introduce long-lived spectacle effects, screen-wide overlays, or persistent ambient particle passes.

## Decisions

- Treat this as a follow-up readability correction, not a reopen of the archived behavior change.
  - Rationale: the capability set is still correct. The problem is that the current live presentation does not satisfy the intended readability standard.
  - Alternative considered: reopen the archived change and replace its broader artifact history. Rejected because the previous change already archived valid behavior contracts that this follow-up is tightening.
- Require defeat bursts to render above the ordinary gameplay object stack through the existing retro-presentation path.
  - Rationale: the explore handoff points to missing or insufficient particle depth as the primary defect. An explicit above-gameplay visibility contract addresses the most likely root cause without changing simulation.
  - Alternative considered: solve visibility only by increasing particle size or duration. Rejected because a stronger preset still fails if particles remain layered behind scene content.
- Allow bounded readability tuning of particle presets while preserving the current class separation and timing.
  - Rationale: the handoff notes that enemy and player defeat presets may still be too small or brief even after fixing depth. The follow-up should permit stronger local contrast, spread, count, or lifetime, but only within the existing short-lived retro style.
  - Alternative considered: lock the current particle presets and only change depth. Rejected because that may leave the live feedback technically visible but still too weak to read during mixed encounters.
- Re-anchor the transient message lane with smaller bounded edge insets instead of the current larger bottom offset.
  - Rationale: the current lower-left lane exists, but it does not read as truly bottom-left because the bottom offset is too large. A tighter bounded inset keeps it near the edge while still respecting viewport safety and persistent readouts.
  - Alternative considered: keep the existing offsets and only reduce font or panel size. Rejected because the reported problem is lane position, not text scale.
- Preserve the existing message sources and defeat-cause event flow.
  - Rationale: stage progression and controller semantics are already routed correctly through the current transient-message and defeat-cause pathways. This follow-up should refine placement and presentation only.
  - Alternative considered: create separate special-case event paths for objective copy or player death. Rejected because it expands scope and risks semantic drift.

## Risks / Trade-offs

- [Particles may become noisier while increasing readability] -> Keep tuning bounded to local bursts and preserve the current short-lived retro timing so visibility improves without turning the effect into spectacle.
- [A lower message lane could collide with other persistent readouts on small screens] -> Define the lane as a safe-area contract that stays close to the bottom-left edge but remains clear of persistent HUD and readout regions across standard and narrow layouts.
- [Depth changes could accidentally place particles above overlays that should remain dominant] -> Limit the visibility requirement to ordinary gameplay objects rather than all UI and transition layers.
- [Redundant spec wording across gameplay and presentation capabilities could drift later] -> Keep each capability focused on its domain: HUD placement, stage-message reuse, enemy readability, retro effect visibility, and player-death handoff.

## Migration Plan

1. Tighten the transient-message safe-area contract in the affected capability specs so the apply phase can implement a lower bottom-left inset without changing message sources.
2. Tighten the defeat-visibility contract across retro presentation, enemy feedback, and player death so the apply phase can adjust render depth and bounded particle tuning together.
3. Implement and verify the CSS and Phaser changes in one pass, then confirm live gameplay still preserves defeat timing and respawn cadence.

## Open Questions

None for apply readiness. The explore handoff already resolved the key scope decisions: this is a new follow-up change, the bottom-left lane should move closer to the edge, and particle visibility must be fixed primarily through depth with bounded readability tuning if needed.