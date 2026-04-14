## Why

The current presentation mixes smooth gradients, soft scenic backgrounds, modern DOM HUD styling, and polished transition panels with procedural placeholder gameplay art. That leaves the game without a cohesive visual identity and makes it hard to push the placeholder rendering toward a deliberate retro direction without a bounded spec for readability and scope.

## What Changes

- Establish a presentation-only gameplay rendering direction inspired by Atari 2600-era traits: coarse silhouettes, very small concurrent color vocabulary, flat fills, sparse pose-based animation, and stronger shape contrast than texture detail.
- Restyle active gameplay presentation, including terrain, props, player-facing visuals, and shared scene dressing, around that inspiration without redesigning movement, combat, stage flow, or authored mechanics.
- Restyle the gameplay HUD as a scoreboard-like status band that stays readable with limited colors and high-contrast text.
- Restyle stage intro and stage-complete screens to match the same inspiration while preserving current progression information and scene flow.
- Add explicit readability guardrails so power variants, enemy telegraphs, hazards, and other critical play-state cues remain distinguishable despite the reduced-detail art direction.
- Keep hardware-era effects such as scanlines, CRT warping, or flicker out of the required scope; if used later, they remain optional, subtle, and secondary to readability.
- Keep scope away from main-menu presentation changes unless a later change explicitly opts into that surface.

## Capabilities

### New Capabilities
- `retro-presentation-style`: bounded gameplay rendering requirements for an Atari 2600-inspired visual direction that is inspiration-based rather than strict hardware emulation

### Modified Capabilities
- `player-power-visual-variants`: power-specific player looks must remain visually distinct within the reduced-palette retro presentation
- `gameplay-hud`: the active-play HUD must adopt a scoreboard-like retro treatment while preserving status readability
- `stage-transition-flow`: stage intro and completion screens must use the same retro presentation language without changing stage flow or progression meaning
- `enemy-hazard-system`: enemy and hazard telegraphs must remain readable when rendered with flatter shapes and fewer simultaneous colors

## Impact

- `src/phaser/scenes/BootScene.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/phaser/scenes/StageIntroScene.ts`
- `src/phaser/scenes/CompleteScene.ts`
- `src/game/view/hud.ts`
- `src/game/state.ts`
- `src/game/content/stages.ts`
- `src/phaser/createGameApp.ts` only if a bounded global presentation hook is needed
- `styles/app.css` if DOM-backed shell surfaces remain visible during the updated presentation
- Visual/playtest coverage for HUD, transition screens, and gameplay readability