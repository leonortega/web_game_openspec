## 1. Authoring Model and Validation

- [x] 1.1 Extend `src/game/content/stages.ts` validation so temporary bridge routes may opt into a linked reveal cue while still rejecting unsupported trigger combinations or malformed timed-reveal links.
- [x] 1.2 Author or update at least one stage fixture that uses a timed-reveal secret route with a nearby reveal cue, a linked scanner activator, and a safe main-route fallback when the secret is skipped or expires.

## 2. Runtime State and Scene Sync

- [x] 2.1 Update `src/game/simulation/state.ts` to represent timed-reveal route state as reveal-backed discovery plus temporary activation and expiry timing without introducing a generalized route-state framework.
- [x] 2.2 Update `src/game/simulation/GameSession.ts` so reveal discovery persists according to current reveal/checkpoint rules, scanner entry starts or refreshes timed activation only after the route is legible, and expiry never removes support while top-surface contact remains active.
- [x] 2.3 Update `src/phaser/scenes/GameScene.ts` to keep timed-reveal supports visually synchronized with the composed reveal and scanner activation state.

## 3. Verification Coverage

- [x] 3.1 Add or extend `src/game/simulation/state.test.ts` coverage for mixed persistence across reveal discovery, checkpoint snapshots, respawn, restart, and fresh attempts.
- [x] 3.2 Add or extend `src/game/simulation/GameSession.test.ts` coverage for validation of activation ordering, timer refresh on scanner re-entry, safe occupied expiry, and unsupported pre-legibility timer starts.
- [x] 3.3 Update `scripts/stage-playtest.mjs` to verify discovering, activating, skipping, and safely expiring a timed-reveal secret route while preserving a completable main route.