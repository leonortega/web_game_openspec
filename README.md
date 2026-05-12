# Crystal Run

Crystal Run is a browser platformer built with Phaser 4, TypeScript, and Vite. The player controls an astronaut crossing long handcrafted stages, collecting research samples, activating checkpoints, unlocking powers, and reaching each stage exit while surviving hazards, enemies, and traversal puzzles.

## Overview

- Genre: 2D browser platformer
- Runtime: Phaser 4
- Language: TypeScript
- Build tool: Vite
- Main campaign stages:
  - `forest-ruins` / `Verdant Impact Crater`
  - `amber-cavern` / `Ember Rift Warrens`
  - `sky-sanctum` / `Halo Spire Array`

## Game Mechanics

### Core movement

- Move: `A/D` or arrow keys
- Jump: `W`, `Up`, or `Space`
- Thruster action: `S` or `Down`
- Dash: `Shift`
- Shoot: `F`
- Restart stage: `R`
- Pause / resume: `Esc`

### Player systems

- Ground movement, jumping, coyote time, buffered jumps, air jumps, and dash cooldowns
- Health-based survival with respawn through checkpoints
- Power progression through reward blocks:
  - `doubleJump`
  - `shooter`
  - `invincible`
  - `dash`
- State-based player lifecycle modeled with XState in [playerStateMachine.ts](/C:/Endava/EndevLocal/Personal/web_game_openspec/src/game/simulation/playerStateMachine.ts)

### Stage mechanics

- Static, moving, falling, and spring platforms
- Magnetic and crystal platform variants
- Gravity-field sections with enclosed gravity capsules
- Activation nodes that power linked traversal elements
- Reveal volumes and scanner-triggered temporary bridges
- Reward blocks with coins or powers
- Collectibles used as research samples / progression pickups
- Secret-route and optional-detour content in the extended stages

### Enemies and hazards

- Enemy types:
  - walker
  - hopper
  - turret
  - charger
  - flyer
- Environmental hazards:
  - spikes
- Enemy defeat, hit feedback, particles, and stage-specific presentation effects are handled in the Phaser scene/view layer

### Progression and HUD

- Multi-stage campaign flow with intro, gameplay, completion, and menu scenes
- Checkpoints persist current run progress
- HUD displays:
  - stage name
  - collectibles / total
  - health
  - current power state
  - difficulty
  - current segment
  - stage message
- Run settings include music volume, SFX volume, difficulty, enemy pressure, and CRT filter preference

## Technologies Used

### Core libraries

- [Phaser 4](https://phaser.io/): main game engine, rendering, input, scenes, timing, particles, audio, and camera handling
- [TypeScript](https://www.typescriptlang.org/): typed application and gameplay code
- [Vite](https://vitejs.dev/): dev server and production bundling
- [XState](https://stately.ai/docs/xstate): player state machine and lifecycle modeling
- [localForage](https://localforage.github.io/localForage/): persistent browser storage support used through the Rex file plugin path

### Phaser plugins and runtime extensions

The game loads multiple Rex plugins from `public/vendor/rex/` in [main.ts](/C:/Endava/EndevLocal/Personal/web_game_openspec/src/main.ts):

- `rexuiplugin`: HUD and UI helpers
- `rextextplayerplugin`: text-driven presentation helpers
- `rextagtextplugin`: richer text rendering support
- `rexscaleouterplugin`: responsive scaling / viewport management
- `rexlocalforagefilesplugin`: file-style persistence backed by browser storage
- `rexcrtfilterplugin`: CRT post-processing effect support

The project also includes a local scene plugin:

- [EnhancedRenderPlugin.ts](/C:/Endava/EndevLocal/Personal/web_game_openspec/src/phaser/plugins/EnhancedRenderPlugin.ts)
  - render helper façade
  - GPU sprite fallback path
  - world-local retro effect region support
  - compatibility shims for filter and lighting behavior

### Testing and developer tooling

- [Vitest](https://vitest.dev/): unit and regression tests
- [Playwright](https://playwright.dev/): browser playtests and flow validation
- Custom playtest scripts in `scripts/`
  - `npm run playtest:stages`
  - `npm run playtest:gravity-room-in-out-flow`
  - `npm run playtest:traversal-visual-language`
  - `npm run playtest:complete-scene-accent`

## Audio, Art, and Presentation

- Audio assets are documented in [musicAssetManifest.json](/C:/Endava/EndevLocal/Personal/web_game_openspec/src/audio/musicAssetManifest.json)
- Active music currently comes from ChillMindscapes asset packs
- The game uses a retro presentation style with:
  - pixel-art rendering settings
  - authored HUD overlays
  - CRT-style optional post-processing
  - custom scene graphics and particles

## Persistence

Run progress is stored in-browser through [RunProgressStore.ts](/C:/Endava/EndevLocal/Personal/web_game_openspec/src/phaser/persistence/RunProgressStore.ts).

Persisted data includes:

- unlocked stage index
- total collected coins / samples
- active powers
- invincibility timer
- run settings

## Project Structure

- `src/game/`: simulation, stage content, progression, and rules
- `src/phaser/`: scenes, rendering, adapters, plugins, persistence, and Phaser-specific runtime code
- `src/audio/`: audio contracts, music metadata, and sound asset manifests
- `src/ui/`: UI view-model types
- `public/vendor/rex/`: Phaser Rex plugin bundles
- `scripts/`: browser playtest and validation scripts
- `openspec/`: specification-driven change history and current specs
- `.codex/skills/`: Codex workflow skills used during development

## AI / IA-Related Tooling

This repository does not ship gameplay AI models inside the running game. The AI-related tooling is part of the development workflow.

### OpenSpec workflow

The `openspec/` directory stores structured product and engineering artifacts:

- proposals
- design notes
- task lists
- specs
- archived change history

This makes the project spec-driven rather than ad hoc. Major mechanics and content rollouts were tracked as formal changes before implementation.

### Codex skills

The `.codex/skills/` directory contains local Codex skills used to guide implementation work. These include:

- OpenSpec workflow skills
- Phaser 4 domain skills
- exploration and verification helpers

Examples:

- `openspec-propose`
- `openspec-apply-change`
- `openspec-verify-change`
- `phaser4-scenes`
- `phaser4-particles`
- `phaser4-input-keyboard-mouse-touch`

### AI-assisted development usage

The repo structure indicates an AI-assisted workflow centered on:

- requirements capture through OpenSpec
- guided implementation through Codex skills
- browser-based validation with Playwright

In short: AI is used here as a development accelerator and documentation/planning aid, not as a runtime gameplay dependency.

## Development

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Preview production build

```bash
npm run preview
```

## Notes

- The game is heavily data-driven through the authored stage catalog in [catalog.ts](/C:/Endava/EndevLocal/Personal/web_game_openspec/src/game/content/stages/catalog.ts)
- Runtime behavior is separated between simulation code and Phaser presentation code
- The repo contains extensive archived design history under `openspec/changes/archive`, which is useful if you need to trace how a mechanic evolved
