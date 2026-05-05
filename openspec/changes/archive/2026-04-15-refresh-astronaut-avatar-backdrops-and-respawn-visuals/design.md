## Context

The explore handoff fixed the scope for this change: create a new change instead of extending `defeat-freeze-and-explosion-readability`, keep the work presentation-focused, and touch the existing player visual composition, defeat reset path, and backdrop helper rather than introducing a separate rendering stack. The current game already uses procedural retro presentation in Phaser, stage-authored palette inputs, and bounded defeat feedback, so the most compatible implementation path is to evolve those systems into a stronger astronaut-and-planetary theme without replacing the runtime-generated style.

The visual refresh spans multiple modules because the player avatar is assembled and animated inside scene-level presentation code, while stage backdrops are shared helpers driven by authored palette inputs. The respawn bug also overlaps the defeat path that another active change touches, so this proposal needs explicit reset rules to avoid leaving detached suit pieces, stale tints, or unfinished tweens on the respawned player.

## Goals / Non-Goals

**Goals:**
- Deliver a more human-like astronaut silhouette for the base player and supported power variants while preserving the existing gameplay hitbox and bounded retro readability.
- Refresh stage backdrops toward extraterrestrial spacescapes that feel planetary and original while staying visually secondary to terrain, hazards, pickups, and HUD elements.
- Fix the player death and respawn presentation so any temporary defeat breakup fully resets before the player re-enters active play.
- Keep the implementation compatible with the current procedural Phaser pipeline and existing stage palette inputs.

**Non-Goals:**
- Add direct use of the supplied astronaut or background images as in-game assets, traced sprites, or palette-exact reproductions.
- Change player movement, collision bounds, damage timing, power durations, checkpoint behavior, or respawn selection.
- Replace the shared retro presentation system with a fully hand-authored asset pipeline.
- Rework unrelated enemy visuals, HUD layout, or transition copy beyond any necessary backdrop-helper reuse.

## Decisions

- Use an original runtime-authored astronaut built from denser retro body-part shapes instead of importing reference-image art.
  - Rationale: the codebase already favors procedural retro rendering, and the request explicitly limits the attached astronaut image to style direction only. A denser generated astronaut can introduce a clearer helmet dome, shoulder span, torso pack, arms, boots, and visor placement while keeping the existing palette and animation system.
  - Concrete direction: represent the player as a small set of explicitly named body-part sprites or generated textures inside the existing avatar composition, with a stable core silhouette shared across base and powered variants. Power variants should swap accent panels, backpack details, or visor trims rather than rebuilding the body from scratch.
  - Alternative considered: add a hand-drawn spritesheet. Rejected because it adds an asset pipeline and raises copying risk relative to the reference direction.
- Normalize avatar pose and defeat state through an explicit visual-reset routine that runs before respawn visibility returns.
  - Rationale: the reported broken-after-respawn state strongly suggests that defeat tweens, detached part offsets, or temporary alpha and rotation values are not fully restored. Apply should use a single reset path that restores container transforms, child offsets, tint, alpha, scale, visibility, and any temporary defeat-part state before the respawn handoff completes.
  - Alternative considered: patch only the currently observed broken body part. Rejected because that would treat symptoms and remain fragile when the new astronaut composition adds more parts.
- Drive planetary backdrops from stage-authored palette roles plus bounded extraterrestrial motif presets.
  - Rationale: the current specs already require background derivation from authored inputs. The safest thematic upgrade is to keep those palette hooks and layer in procedural motif families such as distant planet disks, crater ridges, ring arcs, sparse stars, and atmospheric bands that remain dimmer and less saturated than foreground play surfaces.
  - Concrete direction: define backdrop motif presets per stage palette family, use limited parallax or static banding rather than busy animation, and reserve high-contrast color roles for playable objects only.
  - Alternative considered: use detailed illustrative backgrounds. Rejected because they would compete with gameplay readability and drift away from the repo's retro style.
- Preserve defeat readability by letting the refreshed astronaut composition participate in the existing bounded retro defeat vocabulary.
  - Rationale: the separate active defeat-readability change already strengthens defeat presentation. This change should remain compatible by ensuring the refreshed astronaut can enter the defeat pose and break-apart effect, then reset cleanly, without redefining defeat timing.
  - Alternative considered: redesign defeat timing together with the avatar refresh. Rejected because that overlaps too heavily with the separate active change.

## Risks / Trade-offs

- [A more detailed astronaut silhouette could blur at gameplay scale] -> Keep the silhouette readable through large shape cues like helmet, torso, boots, and backpack, and limit interior detail to a few high-contrast pixels.
- [Planetary backdrops could steal contrast from routes or hazards] -> Constrain backdrop saturation and luminance below foreground roles and validate against hazard and platform palettes during apply.
- [The new avatar composition could increase reset complexity] -> Centralize all temporary visual-state mutations and make respawn call a full-state restore before re-enabling control.
- [Overlap with the active defeat-readability change could create conflicting expectations] -> Treat defeat timing as unchanged here and scope this change to composition compatibility plus reset correctness.

## Migration Plan

1. Update the player and presentation specs to require an original human-like astronaut silhouette, extraterrestrial backdrop motifs, and a full visual-state restore on respawn.
2. In apply, refactor the player visual composition into resettable named parts or equivalent generated textures, then wire movement and defeat poses through that structure.
3. In apply, extend the backdrop helper and stage palette inputs to support extraterrestrial motif presets while preserving foreground/background contrast.
4. Validate in active play that defeat and respawn leave no broken avatar state and that updated backdrops remain secondary across representative stages.

## Open Questions

None for apply readiness. The implementation direction is intentionally fixed to original procedural retro art, palette-derived planetary backdrops, and an explicit full visual reset before respawn.