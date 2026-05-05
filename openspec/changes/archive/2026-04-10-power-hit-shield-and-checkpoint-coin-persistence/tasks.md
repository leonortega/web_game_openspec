## 1. Damage And Power Rules

- [x] 1.1 Update player damage handling so any active power absorbs one damaging hit by clearing all active powers without removing a heart
- [x] 1.2 Preserve the existing unpowered damage and death flow so hits still remove health when no active power is present
- [x] 1.3 Adjust any gameplay feedback or rule text that still describes powered hits as costing health

## 2. Checkpoint Coin Persistence

- [x] 2.1 Refactor checkpoint respawn restoration so collected stage coins and current coin totals persist within the same stage run
- [x] 2.2 Keep manual restart and fresh stage initialization rebuilding the authored coin set and resetting per-attempt coin totals
- [x] 2.3 Prevent duplicate coin rewards and repeated full-clear energy restores when respawning after previously collected coins

## 3. Verification

- [x] 3.1 Add regression coverage for powered hits consuming powers without reducing health and for unpowered hits still removing health
- [x] 3.2 Add regression coverage for checkpoint respawn preserving collected coins, preserving the stage coin total, and blocking duplicate full-clear rewards
- [x] 3.3 Run the relevant build or playtest validation and record results for the new damage and checkpoint coin behaviors