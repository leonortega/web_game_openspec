## Why

Current jump-over enemy defeat reads as classic stomp combat rather than astronaut suit behavior. Combat should reinforce astronaut fiction while preserving airborne route skill and readable risk-reward timing.

## What Changes

- Replace stomp-based enemy defeat with a boot-thruster propulsion impulse takedown.
- Add airborne downward thruster pulse input that can trigger only while airborne.
- Add thruster resource rules: bounded airborne fuel charges plus per-pulse cooldown.
- Gate enemy defeat from above to active thruster-impact windows instead of passive falling contact.
- Keep projectile defeat behavior unchanged.
- Update audio feedback so thruster pulse and thruster impact remain distinct from projectile and damage cues.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `player-controller`: defeat-from-above now requires active thruster pulse, fuel, and cooldown semantics.
- `audio-feedback`: threat-resolution cues shift from stomp to thruster-impact identity.

## Impact

- Affected simulation: player input handling, airborne movement state, enemy interaction resolution.
- Affected presentation/audio: defeat-cause routing and synthesized cue mapping.
- Affected tests: simulation, bridge input, and synth cue distinction coverage.
