## Context

The repo already defines a bounded fresh-stage arrival sequence that mirrors the completion capsule and leaves a persistent inert prop after the player walks out. The remaining gap is ownership of that prop: current layout behavior still derives the start cabin from player-related placement and scene-side reapplication, which makes the cabin feel like part of the player spawn effect instead of a separate fixed world object.

This change is a narrow follow-up that keeps the existing stage-start flow, checkpoint bypass, and bounded transition timing, but requires the start cabin to live at a stable grounded world position independent of the player body. The solution should prefer an authored static anchor, but it should avoid broad stage-data expansion unless a minimal anchor field is truly needed.

## Goals / Non-Goals

**Goals:**
- Make the start cabin a separate grounded world prop with a fixed stage position that does not derive from the player rectangle.
- Keep the player rematerialization, scripted walk-out, and control handoff tied to that fixed cabin rather than making the cabin follow the player.
- Preserve checkpoint respawn bypass, fresh-start-only ownership, and existing bounded transition flow.
- Allow apply to satisfy the static anchor requirement with minimal plumbing, preferably through small authored data or scene-local anchor resolution rather than a broad new stage-authoring system.

**Non-Goals:**
- Reworking exit-capsule completion behavior beyond any helper separation needed to mirror its layout primitives.
- Adding new audio, HUD, or unrelated transition behaviors.
- Broadening stage content schema beyond the minimum needed to express or resolve a fixed start-cabin anchor.
- Changing checkpoint state, respawn behavior, or general player spawn semantics outside the fresh-start sequence.

## Decisions

### Resolve a dedicated start-cabin anchor before the sequence begins
Apply should establish a single cabin anchor for each fresh start before rematerialization begins. That anchor should come from authored stage data when available, or from a deterministic stage-fixed fallback derived from existing spawn and ground context, but once resolved it must remain stable for the full sequence and inert-prop lifetime.

This separates cabin ownership from the player rect while avoiding a requirement that every stage immediately adopt a wide new authoring schema.

Alternative considered: continue deriving the cabin from the live player rect and only freeze it after spawn. This was rejected because the user request is specifically about the cabin not being part of the player.

### Keep cabin presentation and player sequencing as separate state holders
The cabin should be treated as its own world prop or presentation entity with independent placement, while the player rematerialization and walk-out sequence references that prop's doorway or threshold. Scene logic may coordinate both, but the cabin position must not be recomputed from the player's walk-out motion once the sequence starts.

This keeps the start cabin grounded and persistent even after the player exits.

Alternative considered: use one composite start-sequence object that owns both player and cabin transforms. This was rejected because it risks reintroducing implicit coupling and makes inert persistence harder to reason about.

### Define walk-out from cabin threshold onto grounded support
The player should appear inside the resolved cabin footprint, then follow a short deterministic walk-out path from the cabin doorway onto supported stage ground before control begins. The path may be computed relative to the fixed cabin anchor, but it must remain separate from cabin placement and must not lift the cabin into the air to satisfy animation spacing.

Alternative considered: let cabin placement shift to fit the player's existing spawn rect or walk-out line. This was rejected because it produces the exact floating or player-derived cabin behavior the change is meant to remove.

### Preserve existing checkpoint bypass and transition ownership
Only fresh stage starts and normal next-stage auto-advance should resolve the fixed-cabin arrival sequence. Checkpoint respawns should continue to restore play directly without replaying the cabin arrival or instantiating a new persistent start-cabin sequence.

Alternative considered: unify all respawns through the cabin anchor system. This was rejected because it widens scope and conflicts with existing requirements.

## Risks / Trade-offs

- [Some stages may not have enough authored information to place a grounded cabin cleanly] -> Prefer a minimal authored anchor if needed, and otherwise use a deterministic grounded fallback that validates against nearby support.
- [Separating cabin and player state can expose hidden assumptions in current start-sequence helpers] -> Factor shared placement and presentation primitives deliberately so the cabin and player transforms are explicit.
- [A fixed cabin may overlap nearby geometry on some stage starts] -> Validate representative stages through focused stage-start playtests and, if needed, add minimal per-stage anchor overrides instead of broad authoring changes.
- [Sharing visual design with the exit while keeping start behavior static may still confuse semantics] -> Preserve distinction through grounded persistent placement, arrival-only timing, reversed effect direction, and lack of interactivity.

## Migration Plan

No player-facing migration flow is required. Apply can ship this as a fresh-start runtime behavior update, with optional minimal stage-data additions only where fallback placement is insufficient. Rollback is a straightforward revert of the separate anchor plumbing and related start-sequence adjustments.

## Open Questions

None.