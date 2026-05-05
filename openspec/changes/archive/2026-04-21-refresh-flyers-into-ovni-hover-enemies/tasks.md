## 1. Hover Enemy Ovni Refresh

- [x] 1.1 Update generated hover-enemy art in the retro presentation and boot texture path so the sprite reads as an original symmetric ovni with clearer canopy, hull, and underside-light separation without changing gameplay bounds
- [x] 1.2 Remove top-heavy capped-drone cues from in-game hover-enemy rendering and any existing menu or preview presentation that shares the same enemy art path

## 2. Bounded Hover Polish

- [x] 2.1 Keep hover-enemy presentation on the current hover-only lane patrol and bobbing path, with no new attacks, no body-footprint change, and no runtime kind rename unless a narrow player-facing label requires it
- [x] 2.2 Add optional subtle blink-light or shimmer polish only if it stays secondary to readability and does not introduce distracting strobe behavior or telegraph dependence

## 3. Regression Coverage And Validation

- [x] 3.1 Add or update focused rendering, presentation, or snapshot coverage for the refreshed ovni silhouette and preserved hover-enemy footprint or behavior contract
- [x] 3.2 Run focused playtest or scripted validation to confirm unchanged fixed-lane hover fairness, bobbing readability, and absence of collision or encounter regressions after the visual refresh