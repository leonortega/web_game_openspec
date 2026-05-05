## Context

This repository runs a small Phaser 3 game through a thin adapter layer in `src/phaser/`, with gameplay authority held in `src/game/simulation/`. The requested change is intentionally bounded: migrate the current game from Phaser 3 to Phaser 4 without redesigning gameplay systems or reopening existing OpenSpec contracts unless the engine swap forces one narrow runtime compatibility adjustment.

Exploration identified a small set of concrete Phaser 3 risks that need explicit decisions before implementation: `createGameApp.ts` boot/config setup, scene startup and shutdown behavior across Boot/Menu/StageIntro/Game/Complete, `MenuScene` help scrolling via `GeometryMask`, `BootScene` runtime `Graphics.generateTexture`, direct `scene.sound.context` access in `SynthAudio`, and `GameSession` reliance on `Phaser.Math` helpers even though simulation should remain engine-agnostic. The stage playtest script and debug bridge also need to keep working after the migration so the change can be validated without redefining gameplay.

## Goals / Non-Goals

**Goals:**
- Upgrade the runtime dependency and Phaser adapter layer from Phaser 3 to Phaser 4 as one bounded change.
- Preserve the current player-visible flow, including the game shell mount, 960x540 FIT layout, bridge wiring, scene sequence, pause behavior, HUD synchronization, and completion flow.
- Replace identified Phaser 3-only APIs with Phaser 4-compatible implementations that preserve the current menu, boot, audio, and camera behavior.
- Keep simulation and automation behavior stable by isolating engine-specific helpers away from `GameSession` and maintaining the current playtest path.
- Capture the only acceptable spec impact as a narrow runtime-compatibility contract rather than broad gameplay changes.

**Non-Goals:**
- Redesign gameplay, authored content, HUD copy, scene layout, or stage progression behavior beyond compatibility-preserving migration work.
- Introduce new renderer effects, new menu interactions, or new audio features that are unrelated to the engine upgrade.
- Split the migration into multiple OpenSpec changes or use this change to perform unrelated refactors in simulation, UI, or content.

## Decisions

- Keep the migration centered in the existing Phaser adapter layer and preserve the current bridge-owned gameplay architecture.
  - Rationale: the current code already isolates most engine usage to `src/phaser/`, with `SceneBridge` and `GameSession` separating scene presentation from simulation authority. Preserving that boundary minimizes risk and keeps the migration bounded.
  - Alternative considered: rewrite larger gameplay/view boundaries during the upgrade. Rejected because it would turn a compatibility migration into an architecture change and blur regression ownership.
- Preserve the existing boot contract in `createGameApp.ts`, but update it to a Phaser 4-compatible game configuration and renderer setup.
  - Rationale: the game shell mount node, 960x540 canvas, FIT scaling, registry bridge setup, and scene array order are part of the current user-visible experience and automation setup.
  - Compatibility adjustment: if Phaser 4-compatible masking and rendering force a narrower renderer target, the migrated runtime may standardize on a WebGL-backed configuration in the supported browser playtest environment instead of depending on Phaser 3's AUTO plus Canvas fallback.
  - Alternative considered: preserve a Canvas-capable fallback at all costs. Rejected because the migration guidance explicitly warns that masks and advanced rendering changed substantially in Phaser 4, making fallback preservation a secondary concern compared with stable behavior in the supported environment.
- Replace `MenuScene` help-panel `GeometryMask` usage with a Phaser 4-compatible clipped viewport strategy that stays renderer-safe under WebGL.
  - Rationale: the current help panel depends on a simple rectangular scroll viewport. Phaser 4 unifies masks under filters and does not support relying on the same GeometryMask path for a WebGL-first runtime, so the implementation should move to a compatible clipping primitive while preserving current scroll limits, scrollbar behavior, and cleanup.
  - Alternative considered: keep the current code and force a Canvas renderer for the menu. Rejected because it would fragment renderer expectations across scenes and work against the upgrade goal.
- Replace `BootScene` runtime `Graphics.generateTexture` usage with a dedicated Phaser 4-compatible boot texture factory.
  - Rationale: the game currently creates a fixed set of placeholder textures at boot. That behavior should remain, but the implementation needs to use Phaser 4-supported texture generation semantics rather than depending on the Phaser 3 graphics API surface.
  - Alternative considered: replace the generated textures with committed image assets. Rejected because it changes the current asset strategy and is unnecessary for a bounded migration.
- Refactor `SynthAudio` around a Phaser 4-compatible audio backend abstraction instead of direct `scene.sound.context` access.
  - Rationale: direct sound-manager context access is a fragile internal dependency. A small wrapper that resolves and unlocks the underlying audio context through supported APIs or an owned browser context preserves current synthesized cue behavior while isolating engine differences.
  - Alternative considered: defer audio migration and rely on `any` casts around internal sound-manager fields. Rejected because it would preserve the riskiest compatibility point unchanged.
- Remove `GameSession`'s direct `Phaser.Math` dependency by introducing local simulation math helpers or another engine-neutral abstraction.
  - Rationale: simulation should not depend on the rendering engine namespace. Converting clamp and similar numeric helpers to local utilities reduces migration surface area and makes future runtime upgrades safer.
  - Alternative considered: update all helper calls to Phaser 4 equivalents in-place. Rejected because it keeps the simulation coupled to engine math for no gameplay benefit.
- Preserve current scene lifecycle behavior explicitly, including startup order, delayed transitions, resize listeners, and shutdown cleanup.
  - Rationale: the current flow relies on scene start ordering, event cleanup, music start and stop timing, and delayed scene transitions from intro and completion screens. Phaser 4 scene semantics are similar but not identical enough to assume parity without explicit migration tasks.
  - Implementation direction: keep the existing scene keys and transition flow, and migrate timer or cleanup code where needed to scene-managed handles that shut down safely.
  - Alternative considered: opportunistically rewrite scene flow around a new transition framework. Rejected because it would expand scope without improving the requested compatibility outcome.

## Risks / Trade-offs

- [Renderer compatibility risk] Phaser 4 mask and render behavior may force a WebGL-only supported runtime. -> Mitigation: document that as the single allowed compatibility adjustment and validate the supported browser playtest path end-to-end.
- [Scene regression risk] Small lifecycle differences can break intro auto-advance, restart flow, pause toggling, or completion routing. -> Mitigation: keep the scene order and keys unchanged, migrate timers and cleanup deliberately, and validate the whole flow with tests and playtests.
- [Audio regression risk] Replacing direct audio-context access can break unlock timing or synthesized cues on first input. -> Mitigation: isolate audio context access behind one wrapper and validate stage music and gameplay cues after the migration.
- [Simulation drift risk] Removing `Phaser.Math` helpers from `GameSession` could accidentally alter clamp or numeric edge behavior. -> Mitigation: use minimal engine-neutral helpers with identical semantics and cover the touched paths with targeted tests.
- [Automation risk] The stage playtest script depends on the existing debug boot path and scene flow. -> Mitigation: treat `scripts/stage-playtest.mjs` as a first-class migration touchpoint and validate it against the Phaser 4 build before considering the change complete.

## Migration Plan

1. Upgrade the Phaser dependency and adapt the root game configuration in `createGameApp.ts`, preserving the existing shell mount, registry bridge setup, scale, physics, and scene ordering.
2. Migrate scene-level compatibility points: boot-time generated textures, menu help clipping, camera configuration, resize handling, and explicit scene transition and cleanup behavior.
3. Refactor audio and simulation touchpoints by moving `SynthAudio` to a supported backend abstraction and removing direct `Phaser.Math` coupling from `GameSession`.
4. Update tests and the stage playtest flow, then validate that the migrated game satisfies the compatibility spec in the supported browser environment.

Rollback strategy: keep the migration work concentrated in the Phaser adapter, audio wrapper, and local helper extraction so that a failed apply can revert to the prior Phaser 3 dependency and adapter surface without rewriting gameplay content or OpenSpec gameplay specs.

## Open Questions

- Which exact Phaser 4 API surface from the local migration skills best fits boot-time rectangle texture generation and clipped help-panel rendering in this repo's current setup?
- Whether intro and completion auto-advance timers should remain browser timers with cleanup guards or move fully to scene-managed timer events during apply.
- No proposal-stage blocker remains; these questions guide implementation choice, not scope.