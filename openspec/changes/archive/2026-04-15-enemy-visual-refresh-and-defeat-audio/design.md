## Context

The current enemy roster already routes defeat presentation through the recent readability pass, and the synthesized audio system already covers core gameplay events. The gap is identity rather than capability: flying enemies still read more like top-capped drones than underside-lit saucers, several supported enemy silhouettes can be pushed toward a clearer original retro sprite language, and defeat or death sounds need stronger separation without changing gameplay semantics.

This change is cross-cutting across scene wiring, retro presentation helpers, and synthesized audio presets, but it stays intentionally constrained. The exploration handoff fixes the scope to presentation and audio only, prohibits direct copying from the attached image, and requires compatibility with the existing synthesized path plus the current defeat-readability work.

## Goals / Non-Goals

**Goals:**
- Refresh supported enemy visuals toward a clearer original retro style while preserving silhouette readability in live play.
- Reposition flying-enemy light emphasis to the underside so flyer silhouettes read as saucers or ovnis at a glance.
- Strengthen and differentiate enemy-defeat and player-death cues inside the current synthesized audio path.
- Preserve all existing collision, behavior, timing, encounter layout, defeat resolution, and respawn semantics.
- Keep the recent defeat-readability hold, tween, and burst presentation compatible with the refreshed art and audio cues.

**Non-Goals:**
- Add new enemies, new enemy behaviors, new attack timing, or new encounter authoring.
- Introduce a bitmap or external art asset pipeline based on the supplied image.
- Replace the synthesized defeat or death path with recorded audio assets unless apply uncovers a compelling existing repository standard that already contradicts the current audio system.
- Rework unrelated HUD, menu, stage-layout, or backdrop systems beyond what is necessary to keep enemy visuals readable.

## Decisions

- Refresh enemy art through the existing retro-presentation drawing and generated-texture path rather than by importing copied reference art.
  - Rationale: the codebase already generates and composes retro visuals procedurally, which is the safest way to produce original enemy art that follows the reference direction without reproducing it.
  - Concrete direction: revise the shape language, accent placement, and palette allocation for supported enemies inside the current presentation helpers and any boot-time generated textures they depend on.
  - Alternative considered: add handcrafted image assets traced from the reference. Rejected because it conflicts with the style-direction-only constraint and expands scope into a new content pipeline.
- Make the flying-enemy silhouette change primarily through underside accent placement and belly-rim shaping instead of geometry or behavior changes.
  - Rationale: the readability problem is presentational. Moving the brightest accents to the underside and clarifying the lower hull keeps the same gameplay footprint while improving the ovni read.
  - Alternative considered: enlarge or reposition the enemy collision or body footprint. Rejected because the request explicitly forbids gameplay-semantics changes.
- Differentiate defeat and death sounds by revising synthesized cue presets, envelopes, pitch contours, and layering at existing event boundaries.
  - Rationale: the repo already supports synthesized gameplay audio, and the request calls for stronger identity rather than first-time support. Adjusting preset design within `SynthAudio` keeps the implementation aligned with the current path.
  - Concrete direction: keep separate cue classes for stomp defeat, projectile defeat, survivable player damage, and fatal player death, with player death remaining the strongest and most final-sounding cue.
  - Alternative considered: add sampled audio assets for defeat moments. Rejected unless apply finds an already-established asset-backed path for these exact interactions, which current specs do not indicate.
- Preserve the recent defeat-readability presentation contract and layer the refresh on top of it.
  - Rationale: the latest work already established victim hold timing, tween visibility, and bounded defeat bursts. This change should refine the enemy sprite shapes and audio identity while continuing to use those readable defeat windows.
  - Alternative considered: fold the new visual refresh into another defeat-presentation rewrite. Rejected because it would reopen recently stabilized behavior and exceed scope.

## Risks / Trade-offs

- [A stronger enemy refresh could reduce silhouette readability in mixed encounters] -> Keep the main changes focused on hull shape, underside accents, and bounded internal detail rather than dense ornamentation.
- [More distinctive death audio could overlap awkwardly with survivable-damage or defeat cues] -> Preserve one-shot event boundaries and tune the synthesized cues so their envelopes and pitch contours stay separable.
- [Updating generated textures or shared retro helpers could unintentionally affect unrelated presentation] -> Limit the refresh to supported enemy drawing branches and validate only the intended enemy roster during apply.
- [The request could sprawl from flying-enemy polish into a full art rewrite] -> Treat flyer underside lighting as the anchor requirement and keep other enemy refreshes bounded to silhouette and accent cleanup.

## Migration Plan

1. Update the proposal-linked spec deltas so the refreshed enemy visual contract and stronger defeat or death audio identity are explicitly captured.
2. In apply, revise enemy presentation helpers and any required generated textures without altering collision boxes, simulation state, or encounter data.
3. In apply, retune the synthesized defeat and death cues at the current event boundaries and validate that player death, enemy defeat, and survivable damage remain distinct.
4. Re-run the relevant presentation and audio tests, then confirm in play that the recent defeat-readability visuals still read correctly with the refreshed enemy art and updated cues.

## Open Questions

None for apply readiness. The implementation direction is fixed to original retro art refreshes plus stronger synthesized cue differentiation on top of the existing defeat-readability and gameplay semantics.