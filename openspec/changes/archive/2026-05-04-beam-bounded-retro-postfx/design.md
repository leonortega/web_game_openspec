## Context

The explore handoff fixes the scope for this change: create a new change that adds Phaser 4 Beam or shader-backed presentation helpers for enemy palette-ramp variants, object-local hit flashes, and localized water or heat distortion. Existing behavior already includes a global camera CRT and quantize pass, tint-based enemy variants, and player defeat visuals that rely mostly on alpha and tint. The handoff also fixes the primary guardrails: readability first, short-lived or local effects only, palette-bounded output, no HUD warping, no simulation changes, no shader-first rewrite, and no invented water or heat gameplay.

Likely implementation touchpoints already exist in the render and presentation path: `createGameApp.ts`, `retroPostFx.ts`, `EnhancedRenderPlugin.ts`, `GameScene.ts`, `enemyRendering.ts`, `retroPresentation.ts`, and `platformRendering.ts`. The design therefore should extend the current world presentation pipeline rather than add a second renderer or a fullscreen effect scene.

## Goals / Non-Goals

**Goals:**

- Support enemy color variants through bounded palette-ramp presentation that reads as a retro sprite-family swap rather than a plain tint-only change.
- Support short object-local hit flashes for the player and supported enemies while preserving silhouette, power readability, and existing hit or defeat timing.
- Support authored localized water or heat distortion for safe scenery or non-mechanical surfaces only.
- Keep HUD text, transient copy, and other overlay readouts outside those world-local effects.
- Keep the work presentation-only and compatible with the existing retro pass.

**Non-Goals:**

- Rewrite the renderer around shaders, replace sprite art with fully procedural shading, or introduce a new fullscreen post-processing stack.
- Add new combat, traversal, hazard, water, or heat mechanics.
- Make distortion a required gameplay telegraph or allow it to own hazard readability.
- Warp the HUD, transition text, or safe-area message lanes.
- Add dominant blur, bloom, or other modern spectacle treatments.

## Decisions

- Extend the existing retro postfx and render-plugin surface with bounded world-local helpers instead of introducing a new renderer path.
  - Rationale: the current game already has retro presentation infrastructure and a global camera treatment. Adding one more bounded helper layer keeps apply work local to existing abstractions and avoids a shader-first rewrite.
  - Alternative considered: a dedicated fullscreen shader scene layered above gameplay. Rejected because it would violate the no-HUD-warp and no-whole-camera-distortion constraints.

- Treat enemy color variation as palette-ramp presentation, not as unrestricted shader coloring.
  - Rationale: the request is for palette-swapping enemy color variants as a classic 16-bit trick. Apply should therefore keep authored variants inside small ramp families and preserve sprite readability instead of allowing arbitrary gradients or glow-heavy recolors.
  - Concrete direction: supported enemy renderers may provide per-variant palette inputs or Beam-assisted ramp overlays, but the final result must still read as bounded sprite-era palette swapping and must not reduce to a one-value tint multiplier marketed as a shader system.
  - Alternative considered: keep current tint-only variants and rename them as postfx. Rejected because that would not satisfy the request and would create a false-positive implementation.

- Route hit flash through object-local presentation state owned by the player and enemy render paths.
  - Rationale: the request calls for local hit flash on player and enemies. Scene-level or camera-wide flashes would overreach and would compete with HUD or route readability.
  - Concrete direction: use short flash presets with tight duration bounds, preserve the underlying powered or unpowered player art during the flash, and keep enemy telegraph or projectile colors readable if the enemy flashes while still active.
  - Alternative considered: add a global damage flash on the camera. Rejected because it violates the local-only presentation rule and risks HUD readability.

- Scope water and heat distortion to authored safe scenery or non-mechanical surfaces only.
  - Rationale: there is no authored water or heat mechanic spec. The effect must therefore remain decorative and local, attached only to safe scenery or surfaces that already exist for presentation.
  - Concrete direction: distortion regions should be authored or derived from scenery or surface presentation data, masked tightly to their local patch, and excluded from HUD or overlay layers.
  - Alternative considered: use distortion to imply new hazard zones, wind, or current flow. Rejected because it invents new mechanics outside the request.

- Make HUD exclusion and teardown explicit validation targets.
  - Rationale: these effects are easy to scope incorrectly. Apply should prove that world-local postfx do not leak into HUD text and that any temporary hit flash or distortion state clears correctly when objects hide, die, or respawn.
  - Concrete direction: add focused automated coverage for routing, masking, reset, menu CRT toggle plumbing, and unchanged gameplay semantics, then validate with touched-surface tests plus `npm run build`. Repo-wide `npm test` may be rerun for signal, but existing unrelated red baseline must not block this presentation-only change.

## Risks / Trade-offs

- [Local postfx helpers could still leak into overlay layers] -> Keep the effect path world-scoped, explicitly exclude HUD containers or cameras, and cover that boundary in tests.
- [Palette-ramp variants could drift into blurry gradient shading] -> Constrain authored ramps, preserve sprite edges, and reject dominant bloom or smear treatment in apply review.
- [Hit flashes could wash out powered player variants or active enemy telegraphs] -> Keep flashes brief, clamp brightness, and preserve the readable base palette underneath.
- [Decorative distortion could accidentally imply gameplay affordances] -> Limit it to safe scenery or already-safe surface presentation and never use it as the sole telegraph for hazards or route decisions.

## Migration Plan

1. Update the affected spec deltas so the postfx contract, HUD exclusion, and presentation-only scenery shimmer rules are explicit.
2. In apply, extend the existing render and retro presentation helpers with bounded world-local effect routing and clear teardown semantics.
3. In apply, add focused coverage for HUD exclusion, local hit flash, palette-ramp variant routing, decorative distortion, and menu CRT toggle plumbing, then run touched-surface tests and `npm run build`. Repo-wide `npm test` remains informational until unrelated baseline failures are cleared.

## Open Questions

None for apply readiness. The handoff already fixes the scope tightly enough to implement without further product decisions.