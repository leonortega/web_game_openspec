# Proposal: Simplify Stage Intro UI with CRT and Live Astronaut Status

## Summary
Simplify the pre-stage transition UI to show only essential data: stage name and collected samples count, while rendering a live astronaut status avatar that reflects the currently active power variant. Apply the same CRT/postfx treatment used during gameplay to the pre-stage intro camera.

## Goals
1. Keep pre-stage UI minimal and readable.
2. Show only stage name + sample count.
3. Show astronaut visual in current power variant state.
4. Apply CRT-style effect consistent with gameplay camera presentation.

## In Scope
- `StageIntroScene` layout simplification.
- Intro camera CRT postfx enablement.
- Intro astronaut status avatar rendering with power-aware appearance.
- Stage-transition-flow spec adjustment for intro astronaut allowance.

## Out of Scope
- Completion screen redesign.
- Gameplay mechanics changes.
- New power behavior.

## Success Criteria
- [ ] Intro screen shows stage name and samples taken only.
- [ ] Intro screen displays astronaut with current power variant.
- [ ] CRT/postfx is applied on intro camera.
- [ ] Spec and implementation aligned, change archived.
