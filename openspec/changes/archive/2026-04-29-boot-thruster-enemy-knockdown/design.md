## Overview

This change replaces passive stomp-kill behavior with explicit astronaut-suit propulsion combat. The player must spend airborne thruster fuel and satisfy cooldown to generate a downward impulse; only that active impulse window can defeat eligible enemies from above.

## Design Decisions

### 1. Active intent requirement

Enemy defeat from above is no longer granted by generic falling overlap. Defeat requires an active thruster pulse window so combat reads as suit-technology intent rather than accidental stomp contact.

### 2. Fuel + cooldown

Thruster pulses use bounded airborne charges (`fuel`) and a short cooldown. Fuel refreshes on grounded recovery. This keeps timing skill and prevents infinite spam.

### 3. Separation from projectile combat

Plasma blaster defeats remain unchanged. Thruster-impact defeats get their own defeat cause and cue identity.

### 4. Input model

Thruster pulse is triggered by downward input press while airborne. Existing jump, dash, and shoot semantics remain unchanged.

## Non-Goals

- No changes to enemy taxonomy or baseline patrol/chase cadence.
- No changes to projectile damage model.
- No broad rework of gravity-room rules beyond normal compatibility with the new pulse behavior.
