## Why

Current enclosed gravity rooms drift away from sketch intent in two ways: runtime recolors interior room content that should keep its normal presentation, and authored rooms mix extra mechanics that make the gravity toggle harder to read as a bounded room challenge. This change is needed now because gravity rooms already shipped across current stages, so their contract must be tightened before more stage content builds on the wrong presentation and room behavior.

## What Changes

- Remove forced runtime recoloring of room-local platforms, enemies, and other interior room content inside enclosed gravity rooms so sketch colors remain indicative rather than prescriptive.
- Tighten enclosed gravity room behavior so the shell acts as an actual room boundary, with entry and exit only through the authored bottom door openings.
- Re-author current gravity rooms across active stages to focus on gravity-field traversal plus one interior disable button, stripping non-essential mixed mechanics and room-local clutter where possible while preserving stage progress and reachability.
- Keep gravity room state cues readable through shell, door, button, and field presentation changes rather than through recoloring unrelated room contents.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `platform-variation`: Narrow enclosed gravity room authoring toward true room boundaries, door-only entry/exit, and gravity-focused interior layouts instead of mixed mechanic bundles.
- `retro-presentation-style`: Remove the requirement that room-local gravity-room contents be recolored black or red, while preserving readable shell/button/field state cues.

## Impact

- Affected OpenSpec specs: `platform-variation`, `retro-presentation-style`.
- Expected implementation areas: gravity room authoring and validation in `src/game/content/stages.ts`, gravity room collision/state handling in simulation/runtime, and gravity room presentation logic in `src/phaser/scenes/GameScene.ts`.
- Expected validation updates: authored-data coverage for room containment and room-scope simplification, plus runtime checks or playtests that confirm shell walls block traversal outside door openings and that interior content keeps normal authored colors.