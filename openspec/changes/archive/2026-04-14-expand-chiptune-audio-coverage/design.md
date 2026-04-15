## Context

The current audio layer already uses procedural synthesis through `src/phaser/audio/SynthAudio.ts`, with gameplay scene code starting biome music and draining one-shot gameplay cues emitted by `GameSession`. That gives the project a working chiptune foundation, but the coverage is incomplete: `MenuScene`, `StageIntroScene`, and `CompleteScene` do not currently own any synthesized music or UI cues, and simulation-driven gameplay coverage does not include a dedicated fatal-death cue or explicit contracts for several reward and interactive-object moments.

The current architecture also has two constraints that shape this change. First, browser autoplay rules mean audio may remain suspended until the player performs a qualifying keyboard or pointer interaction. Second, music is scene-local today, so adding menu and transition audio without clear ownership could easily create overlap or restart problems as scenes hand off between menu, intro, gameplay, and completion.

## Goals / Non-Goals

**Goals:**
- Extend chiptune coverage across missing high-value events and surfaces using the existing synthesized audio approach.
- Keep cue ownership explicit between simulation-driven gameplay events and scene-driven menu or transition events.
- Define browser unlock behavior so scenes stay fully usable before audio is available.
- Keep loop and stinger lifecycle manageable across scene changes without introducing overlapping music.
- Add verification targets for cue coverage, unlock behavior, and cross-scene audio handoff.

**Non-Goals:**
- Introduce external audio assets, streaming music, or a separate content pipeline.
- Build a reactive layered soundtrack or dynamic music mixer.
- Change scene ordering, transition durations, or gameplay timing to fit audio.
- Redesign the menu, HUD, or transition visuals beyond the audio hooks required by this change.

## Decisions

### Reuse `SynthAudio` as the single synthesized audio surface
The implementation should extend `SynthAudio` with the missing cue and music primitives instead of adding a second audio system. That keeps the procedural/chiptune direction intact, avoids asset management overhead, and lets all scenes share the existing browser `AudioContext` behavior.

This extension should cover three categories:
- gameplay one-shots such as fatal death, power acquisition, reward interactions, and any missing interactive-object cues;
- menu one-shots such as navigation, confirm, and back;
- scene-owned musical phrases such as menu music, stage intro stingers, gameplay loops, and completion congratulations.

Alternative considered: add packaged audio files for menu and transition surfaces.
Rejected because the request is practical extension of the existing synthesized system, not a new asset pipeline.

### Split audio ownership by source of truth
Simulation-owned events should continue to originate from `GameSession`, because it already determines when a jump, stomp, damage event, turret fire, reward interaction, or fatal death actually happens. Menu and transition scenes should own their own audio triggers, because those cues depend on UI navigation and scene presentation rather than simulation state updates.

In practice, apply should keep gameplay event emission centralized in `GameSession` or bridge-drained gameplay cue handling, while `MenuScene`, `StageIntroScene`, and `CompleteScene` directly trigger their menu or transition audio hooks.

Alternative considered: route all audio through a new bridge-level event bus.
Rejected because it adds coordination complexity without solving a concrete limitation in the current code.

### Treat browser audio unlock as opportunistic and non-blocking
Scenes should attempt to unlock synthesized audio on the first eligible keyboard or pointer interaction, then retry the relevant cue or music start once unlock is available. If a scene appears before audio is unlocked, it should remain fully functional and visually complete without sound.

Menu interactions are especially important here because the main menu may be the first surface a player sees. Button movement, confirmation, and back actions should be able to unlock audio naturally rather than requiring a separate explicit enable-audio control.

Alternative considered: force an additional click-to-enable-audio gate before allowing normal navigation.
Rejected because it adds friction and is unnecessary when the UI already receives eligible interactions.

### Keep a single active sustained music owner across scenes
Sustained music should remain single-owner: menu scenes own menu music, gameplay owns the biome loop, and transition scenes use short stingers or fanfares rather than long-running loops unless a final congratulatory phrase is explicitly intended to live only inside the completion screen. Each scene must stop or replace its own sustained playback on shutdown so scene changes do not leave multiple loops active.

This is the simplest way to keep lifecycle manageable within the current architecture, where each scene already has natural create/shutdown boundaries.

Alternative considered: move all music lifecycle into one persistent soundtrack manager that survives scene changes.
Rejected for now because it adds more architectural surface area than the change needs.

### Define fatal-death semantics separately from survivable damage
The existing hurt cue should remain the feedback for survivable hits and shield-breaking hits. A dedicated death cue should fire only when the player actually enters the death or respawn path, and it should fire once per fatal event. That prevents the death moment from sounding identical to ordinary damage and avoids replaying a fatal cue across invulnerability or respawn ticks.

Alternative considered: reuse the current hurt cue for fatal damage.
Rejected because the request explicitly calls for a dedicated death moment and the semantics are materially different.

### Use explicit cue naming for menu and scene transitions
The current string cue surface is workable, but this change increases the number of audio entry points enough that apply should consolidate cue names into a clearer contract, either through a typed cue union or a small constant map. That reduces drift between gameplay emitters, scene triggers, and `SynthAudio` playback branches.

Alternative considered: continue adding free-form string literals in each scene.
Rejected because the audio surface is now broad enough that typo risk and coverage gaps become harder to manage.

## Risks / Trade-offs

- [Scene unlock race] -> A scene may request music before the browser has allowed audio playback, causing silence on first render. Mitigation: retry unlock and eligible scene audio on the first keyboard or pointer interaction inside that active scene.
- [Audio clutter] -> Expanding coverage can make the game noisy if every small interaction gets a strong cue. Mitigation: keep one short cue per salient event class and avoid repeated UI hover spam or duplicate death feedback.
- [Cross-scene overlap] -> Menu, gameplay, and completion audio can stack if scenes do not stop owned loops on shutdown. Mitigation: keep single-owner sustained music semantics and add regression checks for menu to intro to gameplay to complete handoff.
- [Cue-contract drift] -> New gameplay and UI cue names can diverge between emitters and playback code. Mitigation: centralize cue identifiers and cover them with unit tests.

## Migration Plan

1. Extend `SynthAudio` with the additional synthesized cue and music helpers needed for menu, gameplay, intro, death, and completion coverage.
2. Update gameplay cue emission for any missing runtime events, especially fatal death and reward or power moments that need clearer audio semantics.
3. Add menu-scene and transition-scene audio ownership, including unlock-on-interaction behavior and clean shutdown handoff.
4. Add regression coverage for cue mapping, unlock deferral, menu navigation audio, and scene-to-scene loop replacement.
5. Validate with automated tests, build output, and targeted playtesting of menu start, death, power pickup, stage intro, and stage-clear flows.

## Open Questions

- No blocking design questions remain. Apply can choose the exact melody patterns and envelope shapes as long as they remain short synthesized chiptune phrases and preserve the cue distinctions defined by the specs.
