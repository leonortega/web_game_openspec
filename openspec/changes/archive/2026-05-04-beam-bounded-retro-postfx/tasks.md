## 1. Shared Retro Postfx Plumbing

- [x] 1.1 Extend the current retro postfx and render-plugin path to support bounded world-local Beam or shader helpers for palette-ramp variants, object-local hit flashes, and localized scenery distortion without changing gameplay simulation or camera ownership
- [x] 1.2 Keep HUD, transient message lanes, and other overlay text outside those world-local effects while preserving the existing global CRT and quantize presentation

## 2. Enemy Variant And Hit-Flash Presentation

- [x] 2.1 Implement supported enemy palette-ramp variants so authored enemy color families read as bounded retro palette swaps rather than plain tint-only multipliers
- [x] 2.2 Implement short object-local hit-flash presets for supported enemies and the player that preserve silhouette, power readability, and existing damage or defeat timing semantics

## 3. Localized Water And Heat Distortion

- [x] 3.1 Add authored localized water or heat distortion presentation for safe scenery or non-mechanical surfaces only, with tight masking, short scope, and no HUD warping or gameplay-state ownership
- [x] 3.2 Ensure localized distortion remains secondary and optional per authored beat rather than becoming a full-camera or always-on stage filter

## 4. Coverage And Validation

- [x] 4.1 Add focused automated coverage for effect routing, teardown and reset behavior, HUD exclusion, and presentation-only semantics in the touched Phaser presentation helpers
- [x] 4.2 Validate the change with focused touched-surface tests and `npm run build`, and confirm through automated routing and teardown coverage that enemy, player-hit, scenery, and menu CRT cases remain local retro accents rather than dominant spectacle. Repo-wide `npm test` is informational only while unrelated baseline failures remain outside this change