## 1. Menu Layout

- [x] 1.1 Remove the default subtitle, footer/meta, and other persistent chrome from `src/phaser/scenes/MenuScene.ts`
- [x] 1.2 Keep the title and interactive option list centered and readable in the simplified menu layout
- [x] 1.3 Preserve the existing menu actions for `Start`, difficulty, enemy pressure, volume, and rules

## 2. Verification

- [x] 2.1 Update `scripts/stage-playtest.mjs` to assert the simplified menu surface instead of the removed footer/meta text
- [x] 2.2 Add or adjust regression checks for pointer and keyboard interaction on the simplified menu
- [x] 2.3 Run `npm run build` and the stage playtest suite to confirm the menu change is stable
