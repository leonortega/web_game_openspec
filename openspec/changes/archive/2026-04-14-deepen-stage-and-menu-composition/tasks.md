## 1. Composition Authoring Model

- [x] 1.1 Extend the synthesized music authoring shape in the shared audio contract and synth runtime so menu and stage themes can declare motif identity, phrase template, cadence or turnaround behavior, register intent, and intro or gameplay or completion phrase relationships.
- [x] 1.2 Re-author the menu title theme and the current playable stage themes for `forest-ruins`, `amber-cavern`, and `sky-sanctum` using the richer composition fields and the required contrast between buoyant, heavy, and open musical grammar.
- [x] 1.3 Update stage-authored audio metadata so each stage exposes the labels and signatures needed to connect intro, gameplay, clear, and final phrase families without changing stage timing semantics.

## 2. Runtime Playback And Scene Ownership

- [x] 2.1 Update the synthesized music scheduler to realize multi-phrase gameplay loops, turnaround or fill variation, delayed counterline entry, and restart pickups while keeping the existing procedural playback approach.
- [x] 2.2 Update menu, intro, gameplay, and completion scene ownership so the correct title, intro, gameplay, stage-clear, and final-congratulations phrases play without overlapping sustained owners.
- [x] 2.3 Preserve browser audio-unlock behavior and existing scene durations while ensuring transition cues resolve the active stage-theme family instead of using unrelated generic stingers, with sustained theme ownership deferred until unlock succeeds.

## 3. Validation

- [x] 3.1 Update automated audio coverage to verify that authored menu and stage themes include the required composition fields and that menu-versus-stage theme selection remains distinct under unlocked realized playback.
- [x] 3.2 Update regression coverage for scene handoff and gameplay-triggered audio so intro, gameplay, clear, final, and menu interaction phrases remain differentiated, unlock-safe, and timing-safe.
- [x] 3.3 Update playtest validation evidence to compare the unlocked menu theme and the three current stage themes through realized section playback for recognizable motif identity, repeat-relief behavior, and the required forest or cavern or sky contrast.