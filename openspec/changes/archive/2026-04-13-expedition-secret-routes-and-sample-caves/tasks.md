## 1. Secret-Route Authoring Support

- [x] 1.1 Update stage content authoring in `src/game/content/stages.ts` so stages can describe reconnecting secret routes, abandoned micro-areas, optional sample caves, and any minimal route markers needed for validation
- [x] 1.2 Keep secret-route discovery grounded in existing traversal mechanics and avoid adding alternate completion exits, branching unlocks, or persistent secret-discovery runtime state
- [x] 1.3 If current stage data cannot express route entry and downstream reconnection clearly enough for automation, add only minimal non-player-facing authoring metadata needed to identify those spans

## 2. Validation and Runtime Integration

- [x] 2.1 Extend stage validation so secret routes must include a readable discovery cue, meaningful optional reward value, and a safe reconnection to the main route later in the same stage
- [x] 2.2 Update any simulation or scene integration needed to surface authored route markers for validation or readability without introducing new branch-selection or stage-clear behavior
- [x] 2.3 Adjust authored stage content to include at least one bounded reconnecting secret route that passes through an abandoned micro-area or optional sample cave

## 3. Playtest and Regression Coverage

- [x] 3.1 Extend `scripts/stage-playtest.mjs` to probe secret-route discovery, optional reward payoff, and downstream reconnection while also confirming the main route remains completable when the detour is skipped
- [x] 3.2 Add or update automated tests around any new validation rules or route-marker handling introduced for secret-route authoring
- [x] 3.3 Run the relevant build, test, and scripted playtest commands and record evidence that the authored secret route is discoverable, rewarding, and reconnects as specified