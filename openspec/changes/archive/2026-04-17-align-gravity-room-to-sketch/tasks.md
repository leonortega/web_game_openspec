## 1. Runtime Gravity Room Behavior

- [x] 1.1 Remove gravity-room-specific interior recolor overrides from `src/phaser/scenes/GameScene.ts` so room-local platforms, enemies, and other interior content keep normal authored presentation.
- [x] 1.2 Enforce gravity room shells as blocking walls outside the authored entry and exit door openings using the existing shell and door geometry.
- [x] 1.3 Keep gravity room active versus disabled readability on shell, button, door, and field cues without reintroducing interior recolor grouping.

## 2. Gravity Room Authoring

- [x] 2.1 Re-author Verdant Impact Crater's enclosed gravity room so the route focuses on gravity traversal, disable-button access, and room exit with only essential local support.
- [x] 2.2 Re-author Ember Rift Warrens' enclosed gravity room so the route focuses on gravity traversal, disable-button access, and room exit with only essential local support.
- [x] 2.3 Re-author Halo Spire Array's enclosed gravity rooms so each room focuses on gravity traversal, disable-button access, and room exit with only essential local support.
- [x] 2.4 Confirm each re-authored room remains reachable on entry, supports button access before the disabled-state route beat, and preserves overall stage progression.

## 3. Validation And Coverage

- [x] 3.1 Extend authored-data validation and tests to reject enclosed gravity rooms that are not fully blocked outside door openings or that keep non-essential mixed room-local mechanics.
- [x] 3.2 Update runtime or scene-level tests to cover wall blocking and preserved interior presentation for enclosed gravity rooms.
- [x] 3.3 Update or add scripted playtest coverage that exercises current gravity rooms across stages and confirms entry, button disable, wall containment, and exit flow still work after re-authoring.