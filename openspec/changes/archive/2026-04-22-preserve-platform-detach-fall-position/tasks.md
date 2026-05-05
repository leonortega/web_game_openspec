## 1. Support Detach Detection

- [x] 1.1 Update `GameSession` support bookkeeping so apply can identify the immediately previous valid support on the frame top-surface contact ends because support motion moved away.
- [x] 1.2 Apply a one-frame horizontal-collision exemption for only that former support body, without broadening collision skips to other solids or later frames.

## 2. Regression Coverage

- [x] 2.1 Add focused simulation tests that prove the player falls from the occupied platform position when moving support clears away, rather than being shoved to the support edge.
- [x] 2.2 Add coverage that nearby non-support walls still block normally on the detach update and that later side collisions with the former support still resolve after the exemption expires.

## 3. Validation

- [x] 3.1 Run targeted simulation tests for the detach-from-support scenarios in `GameSession.test.ts`.
- [x] 3.2 Run the relevant broader movement validation needed to confirm jump, coyote, dash, gravity-field, and falling-platform behavior remain unchanged.