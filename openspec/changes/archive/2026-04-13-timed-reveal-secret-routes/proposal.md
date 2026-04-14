## Why

The runtime already has the pieces to compose reveal-gated traversal with temporary activation, but the authored change contract still treats reveal platforms and scanner bridges as separate mechanics and rejects reveal-linked temporary routes during validation. This change adds a bounded secret-route variant for short-lived hidden paths and temporary visible sky routes without expanding into a generalized trigger-combination or route-state system.

## What Changes

- Allow authored timed-reveal secret routes that combine a nearby reveal cue with a scanner-triggered temporary support path.
- Keep the mechanic bounded: reveal remains the discovery cue, scanner remains the timer activator, and the change does not introduce arbitrary trigger combinations or a generalized route-state framework.
- Define readability and safety rules for timed-reveal routes, including nearby cue placement, legibility before timer start, safe main-route fallback, and support-safe expiry while the player still has top-surface contact.
- Define persistence rules so reveal discovery follows current reveal/checkpoint behavior while timed activation follows current temporary-bridge reset behavior across death, respawn, restart, and fresh attempts.
- Add validation and playtest expectations for discovering, activating, skipping, expiring, and safely recovering from timed-reveal secret routes.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `platform-variation`: extend reveal and scanner traversal rules to support bounded timed-reveal secret routes with readability and safety constraints.
- `stage-progression`: define how timed-reveal secret routes compose reveal persistence with temporary activation reset rules and route-verification expectations.

## Impact

- `src/game/content/stages.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/game/simulation/state.test.ts`
- `src/game/simulation/GameSession.test.ts`
- `scripts/stage-playtest.mjs`
- Authored stage layouts that use reveal cues, scanner switches, and optional reconnecting secret routes