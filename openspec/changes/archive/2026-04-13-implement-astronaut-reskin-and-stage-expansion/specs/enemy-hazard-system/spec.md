## ADDED Requirements

### Requirement: Enemy encounters are authored with readable spacing and density
The game SHALL author enemy and hazard placements in readable encounter bands across each main stage. The critical path MUST provide enough footing, telegraph space, or lane separation for the player to parse each encounter before entering it, and optional detours MAY carry higher pressure only when they remain clearly optional and offer extra reward or faster traversal value. Major support surfaces MUST NOT stack multiple simultaneous threats so tightly that the authored route lacks a safe staging point or alternate lane.

#### Scenario: Entering a critical-path encounter
- **WHEN** the player reaches an enemy or hazard setup on the intended main route
- **THEN** there is enough readable space to identify the threat and choose a response before forced contact occurs

#### Scenario: Taking a higher-pressure optional branch
- **WHEN** the player enters an optional detour or reward pocket
- **THEN** that branch may present denser enemy pressure than the critical path while still preserving a readable route through it

#### Scenario: Recovering after a pressure spike
- **WHEN** the player clears a dense encounter band
- **THEN** the next safe foothold or transition beat gives them room to reset before the following escalation