## 1. Authoring Model And Validation

- [x] 1.1 Add dedicated `bouncePod` and `gasVent` launcher metadata and runtime state separate from springs
- [x] 1.2 Validate launcher kind, bounded footprint, upward-biased direction clamp, and non-overlap with ambiguous launcher or spring contact areas
- [x] 1.3 Author or update stage fixtures so at least one biome route uses a bounce pod and another uses a gas vent

## 2. Simulation And Presentation

- [x] 2.1 Implement bounce pod and gas vent trigger timing, cooldown, and ready-state reset behavior as first-contact launchers
- [x] 2.2 Apply controller composition rules for low gravity, sticky sludge, jump-hold suppression, buffered jump, dash, and spring coexistence
- [x] 2.3 Add distinct launcher presentation and cue handling so bounce pods and gas vents are readable apart from springs

## 3. Verification

- [x] 3.1 Add automated coverage for bounce pod launch, gas vent launch, directional clamp, and ambiguous authoring rejection
- [x] 3.2 Add automated coverage for suppression, cooldown reuse, low-gravity composition, sticky-sludge composition, and dash contact behavior
- [x] 3.3 Run scripted playtest coverage for authored launcher routes and record the results for the change