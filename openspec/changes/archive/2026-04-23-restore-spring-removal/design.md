## Context

Live specs already removed springs from supported traversal language, but current branch implementation still appears behind that contract. User intent is explicit: screenshot item 2 spring-looking platforms should become item 1 green platform family, and spring type should disappear entirely. Converted beats must read as plain support plus bounce-pod launcher, not as ordinary support that secretly launches.

## Goals / Non-Goals

**Goals:**
- Delete spring as authored and runtime traversal category everywhere implementation still depends on it.
- Convert every current spring beat into readable support-plus-bounce-pod composition with preserved route timing and footing.
- Keep bounce pods and gas vents as only launcher families in this lane.
- Retarget validation and coverage so spring authoring fails fast and converted routes remain proven.

**Non-Goals:**
- Add new launcher families or broaden gas-vent behavior.
- Hide former spring behavior behind unchanged normal green support visuals.
- Retune unrelated traversal systems, menus, HUD, or gravity-room rules.

## Decisions

- Use current main specs as source of truth.
  - Decision: do not author duplicate spec deltas in this fresh change.
  - Rationale: current live specs already contain spring-removal contract, so duplicating those deltas would create churn without changing product behavior.

- Convert springs to explicit support-plus-launcher beats.
  - Decision: each lingering spring route becomes ordinary support geometry paired with bounce-pod launcher authoring aligned to that support.
  - Rationale: this preserves readable contact timing and avoids forbidden visual-only reskin or hidden launch behavior.

- Remove spring from all source-of-truth unions and dispatch points.
  - Decision: implementation must delete spring handling from stage content types, builders, validation, runtime session state, traversal resolution, rendering, audio selection, and tests.
  - Rationale: partial removal would leave dead branches and stale fixtures that continue to drift from spec.

- Validate through launcher-only coverage.
  - Decision: focused tests and scripted playtests must prove converted routes, launcher metadata validation, suppression/cooldown rules, and launcher composition with other movement modifiers still work after spring removal.
  - Rationale: launcher migration is cross-cutting and easy to partially break while deleting old category branches.

## Risks / Trade-offs

- Bounce-pod timing may not match old spring beats exactly.
  - Mitigation: preserve route shape with local support adjustment where needed instead of simple skin swap.

- Spring references may remain in scattered presentation or audio helpers.
  - Mitigation: treat renderer and synthesized traversal cues as first-class deletion targets, not follow-up cleanup.

- Tests may pass while route readability regresses.
  - Mitigation: keep scripted playtests focused on exact converted beats and require visible support-plus-launcher composition.