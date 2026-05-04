# Change: 2026-05-04-player-xstate-lifecycle

## Change Name
**2026-05-04-player-xstate-lifecycle** (May 4, 2026)

## Artifacts
- **proposal.md** - Scope, goals, backwards-compat strategy, success criteria
- **design.md** - State machine definition, context shape, proxy wrapper, guards, actions
- **tasks.md** - Implementation checklist (8 phases, 30+ tasks), test strategy, success criteria
- **specs/player-states/spec.md** - Player states capability spec (3 requirements, 11 scenarios)

## Status
**APPLY-READY**

All artifacts are complete and internally consistent. Change is ready for implementation phase.

## Summary
Introduce XState-backed player state machine with seven explicit states (idle, run, jump, fall, dash, hurt, dead) to replace flat boolean flags and scattered timer logic. Includes backwards-compatible proxy wrapper and no breaking serialization changes.

## Integration Points
1. `src/game/simulation/state.ts` - Machine definition, types, proxy factory
2. `src/game/simulation/GameSession.ts` - Event-driven state transitions
3. `src/game/simulation/GameSession.test.ts` - Transition and behavior verification
4. `package.json` - xstate dependency
