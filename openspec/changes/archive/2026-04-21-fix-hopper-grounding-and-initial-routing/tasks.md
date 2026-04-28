## 1. Grounded Hopper Validation

- [x] 1.1 Update authored enemy validation so grounded hopper and walker spawns require real support and fail when they would appear floating or unsupported.
- [x] 1.2 Add focused content tests for supported grounded hopper starts, unsupported starts, and layouts whose initial intended hop has no reachable supported landing.

## 2. Hopper Startup Routing

- [x] 2.1 Update hopper startup and first-hop target selection so the first committed hop chooses a deterministic reachable supported landing instead of defaulting to a left-biased launch.
- [x] 2.2 Keep grounded hoppers on support when no valid initial landing exists, without broadening that fallback into flyer-style hover behavior.

## 3. Stage and Regression Coverage

- [x] 3.1 Fix any authored stages that fail under the tighter grounded-hopper support and initial-routing rules.
- [x] 3.2 Add or update focused simulation and scripted playtest coverage for floating-hopper regressions, wrong-way first hops, and preserved flyer hover behavior.