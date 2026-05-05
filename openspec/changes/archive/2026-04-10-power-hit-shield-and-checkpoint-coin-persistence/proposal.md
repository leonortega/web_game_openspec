## Why

Powered hits currently punish the player twice by both removing their active powers and taking a heart, which makes powers feel fragile instead of protective. Checkpoint respawns also rebuild the stage coin state, so already collected coins reappear and can be collected again, undermining finite level totals and full-clear reward rules.

## What Changes

- Treat any active power as a one-hit shield: when the player is hit while powered, the hit removes all active powers and does not remove a heart.
- Keep the existing damage rule for unpowered hits so the player still loses a heart when no active power is present.
- Persist collected level coins and the player's level coin total across checkpoint respawns within the same stage run.
- Keep manual restarts, fresh stage starts, and other new attempts resetting coin collection normally.
- Prevent duplicate coin rewards or repeated full-clear payouts after a checkpoint respawn restores the player into the same stage run.
- Update player-facing gameplay rule text or status messaging that would otherwise still imply powered hits always cost health or that checkpoint respawns restore level coins.

## Capabilities

### Modified Capabilities
- `player-progression`: Active powers now function as a one-hit shield before health is lost, while still being cleared on damage and death.
- `player-controller`: Damage and respawn rules now distinguish between powered hits that consume powers and unpowered hits that consume health.
- `coin-energy-recovery`: Level coin tracking must preserve collected progress across checkpoint respawns without allowing duplicate coin rewards.
- `stage-progression`: Checkpoint respawns must preserve in-stage collectible progress for the current run while fresh attempts still rebuild the stage normally.

## Impact

- Player damage, death, respawn, and power-clearing logic in the gameplay simulation.
- Stage snapshot or checkpoint restore flow that currently rebuilds collectible state and stage coin totals.
- Coin collection bookkeeping, full-clear reward gating, and duplicate reward prevention.
- Any HUD, prompt, or rule text that describes powered damage or checkpoint collectible behavior.