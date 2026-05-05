# Design: Player State Machine with XState

## Overview
XState machine models complete player lifecycle with seven states and explicit guard conditions. Machine context holds minimal locomotion data; heavy lifting (physics, timers) stays in `PlayerState`. Proxy wrapper provides backwards-compat boolean reads.

## State Machine Definition

### States & Transitions

```
┌─────────────┐
│   IDLE      │ (grounded, no input)
└──────┬──────┘
   │ moveInput  │ jumpInput  │ hurt
   │            │            │ (damage)
   v            v            v
┌─────────┐  ┌──────┐  ┌──────┐
│   RUN   │  │ JUMP │  │ HURT │
└────┬────┘  └──┬───┘  └──┬───┘
     │ noMove   │ peak     │ invulnExpire
     │          v          │
     │ ┌──────┐            │
     ├─┤ FALL ├────────────┘
     │ └──┬───┘
     │    │ grounded
     └────┤
          │ dashInput
          v
       ┌──────┐
       │ DASH │
       └──┬───┘
          │ dashEnd
   (back to jump/fall/run)
   
   Any → DEAD (health reaches 0)
   DEAD → IDLE (respawn)
```

### State Definitions

#### idle
- **Condition**: Grounded, no horizontal movement input, `vx` near zero
- **Entry**: None (no special action needed)
- **Active**: Player on platform, still
- **Transitions**:
  - → **run** on move input
  - → **jump** on jump input
  - → **hurt** on damage taken
  - → **dash** on dash input (if dash available)

#### run
- **Condition**: Grounded, horizontal movement input active, `|vx| > threshold`
- **Entry**: Apply ground acceleration
- **Active**: Player moving on platform with input
- **Transitions**:
  - → **idle** on input stop (move stick to center)
  - → **jump** on jump input
  - → **hurt** on damage taken
  - → **dash** on dash input (if dash available)

#### jump
- **Condition**: Just left ground via jump initiation; airborne after `vx` changes direction
- **Entry**: Set `vy = -JUMP_SPEED`; decrement `airJumpsRemaining` if double-jump
- **Active**: Ascending phase + bounded jump-pose hold window (per spec)
- **Transitions**:
  - → **fall** when peak detected (`vy >= 0` after ascending) or jump-pose hold expires
  - → **hurt** on damage (but preserve upward momentum for air-dodge visual)
  - → **dash** on dash input during airtime (interrupts jump)

#### fall
- **Condition**: Airborne, descending (`vy > 0` or at descent phase)
- **Entry**: None (gravity already applied in physics)
- **Active**: Falling; includes coyote-time eligibility, jump-buffer window
- **Transitions**:
  - → **idle** on ground contact with no input
  - → **run** on ground contact with move input
  - → **jump** on jump input + (valid ground support OR coyote time active)
  - → **jump** on buffered jump input arriving during fall + ground contact occurs
  - → **hurt** on damage taken (preserve fall momentum)
  - → **dash** on dash input if available

#### dash
- **Condition**: Active horizontal dash movement override
- **Entry**: Set `vx = DASH_SPEED * facing`; start `dashTimerMs`
- **Active**: Dash phase (120ms currently)
- **Transitions**:
  - → **fall** when `dashTimerMs` expires and `vy > 0` (or not grounded)
  - → **jump** when `dashTimerMs` expires and grounded + jump input buffered
  - → **idle** when `dashTimerMs` expires and grounded + no input
  - → **run** when `dashTimerMs` expires and grounded + move input
  - → **hurt** on damage during dash (end dash, apply invulnerability)

#### hurt
- **Condition**: Post-hit invulnerability window active (`invulnerableMs > 0`)
- **Entry**: Set `invulnerableMs = INVULNERABLE_MS`; apply knockback (if designed); clear active non-invincible powers
- **Active**: Invulnerable, player still moves/falls but cannot be hit
- **Transitions**:
  - → **idle** when invulnerability expires and grounded + no input
  - → **run** when invulnerability expires and grounded + move input
  - → **fall** when invulnerability expires and airborne
  - → **dead** if health reaches 0 (can occur during hurt if multi-hit scenario)

#### dead
- **Condition**: Health ≤ 0; death presentation active
- **Entry**: Trigger death animation/particles; set `RESPAWN_DELAY_MS` timer
- **Active**: Non-controllable; player visible during bounded death flash (~120ms)
- **Transitions**:
  - → **idle** on respawn (timer expires, checkpoint/start position restored)

---

## Context Shape

```typescript
export type PlayerMachineContext = {
  // Locomotion intent
  moveDir: -1 | 0 | 1;           // from input controller
  jumpIntent: boolean;            // jump button pressed this frame
  dashIntent: boolean;            // dash button pressed this frame
  isDashing: boolean;             // for presentation sync
  
  // Derived motion state (read-only for guards)
  lastGroundedVx: number;         // velocity when last touching ground
  jumpInitiatedThisFrame: boolean;
};

export type PlayerMachineEvent =
  | { type: 'MOVE_INPUT'; dir: -1 | 0 | 1 }
  | { type: 'JUMP_INPUT' }
  | { type: 'DASH_INPUT' }
  | { type: 'JUMP_BUFFERED' }
  | { type: 'GROUND_CONTACT' }
  | { type: 'LEAVE_GROUND' }
  | { type: 'DAMAGE_TAKEN'; knockbackVx?: number }
  | { type: 'RESPAWN' }
  | { type: 'DASH_END' }
  | { type: 'JUMP_PEAK' }
  | { type: 'DASH_COOLDOWN_READY' }
  | { type: 'INVULNERABILITY_EXPIRED' };
```

---

## Proxy Wrapper for Backwards Compatibility

### Creation
```typescript
export function createPlayerStateWithMachine(
  baseState: PlayerState,
  machine: StateMachine
): PlayerState {
  return new Proxy(baseState, {
    get(target, prop) {
      if (prop === 'dead') {
        return machine.matches('dead');
      }
      if (prop === 'onGround') {
        return (
          machine.matches('idle') ||
          machine.matches('run')
        );
      }
      return Reflect.get(target, prop);
    },
    set(target, prop, value) {
      // Allow normal property writes for timers, physics, etc.
      return Reflect.set(target, prop, value);
    },
  });
}
```

### Usage
After wrapping:
```typescript
// Old code still works
if (player.dead) { /* ... */ }
if (player.onGround) { /* ... */ }

// New code uses machine
state.send({ type: 'MOVE_INPUT', dir: 1 });
state.send({ type: 'JUMP_INPUT' });
```

---

## Guard Conditions

### Guards for Transitions

#### canJump
```typescript
() => {
  // Valid if: grounded OR coyote-time active OR double-jump available
  return (
    state.matches('idle') ||
    state.matches('run') ||
    (state.matches('fall') && coyoteMs > 0) ||
    (state.matches('fall') && airJumpsRemaining > 0)
  );
}
```

#### canDash
```typescript
() => {
  // Valid if: dash cooldown expired AND not already dashing
  return dashCooldownMs <= 0 && !state.matches('dash');
}
```

#### isGrounded
```typescript
() => {
  return state.matches('idle') || state.matches('run');
}
```

#### isDescending
```typescript
() => {
  return vy > 0;
}
```

#### jumpPeakReached
```typescript
() => {
  return vy >= 0 && wasAscending; // velocity turned non-negative
}
```

---

## Serialization

### For Save/Load
Machine state remains logically compatible:
- `machine.matches('idle')` → Serialize as `state_type: 'idle'`
- Restore as: `state.send({ type: 'INIT', savedState: 'idle' })`
- All timer data (`coyoteMs`, etc.) serializes normally in `PlayerState`
- No breaking changes to existing save format

### Backwards Compat Check
- Old saves (with boolean `dead`, `onGround`) can be loaded
- Convert old format on load: `dead: true` → send RESPAWN; `onGround: true` → enter idle/run
- No migrations needed; proxies handle transparent reads

---

## Actions & Effects

### On State Entry
```typescript
actions: {
  startJump: () => {
    vy = -JUMP_SPEED;
    airJumpsRemaining--;
  },
  startDash: () => {
    dashTimerMs = DASH_DURATION_MS;
    vx = DASH_SPEED * facing;
  },
  applyInvulnerability: () => {
    invulnerableMs = INVULNERABLE_MS;
    // Clear non-invincible powers (handled in GameSession)
  },
  beginDeathPresentation: () => {
    // Trigger particles, sound, animation
    // Called once on entry to 'dead'
  },
}
```

### Tick/Update Actions
Happen every frame *outside* machine but machine drives them:
```typescript
// In GameSession.update():
if (machine.matches('run')) {
  // Apply ground acceleration
  vx = clamp(vx + moveDir * GROUND_ACCEL * dt, -MAX_MOVE_SPEED, MAX_MOVE_SPEED);
}
if (machine.matches('fall') || machine.matches('jump')) {
  // Apply gravity
  vy = clamp(vy + gravity * dt, -Infinity, MAX_FALL_SPEED);
}
if (machine.matches('hurt')) {
  // Tick invulnerability
  invulnerableMs = max(0, invulnerableMs - dt);
  if (invulnerableMs <= 0) {
    state.send({ type: 'INVULNERABILITY_EXPIRED' });
  }
}
```

---

## Integration Hooks

### In GameSession Constructor
```typescript
const playerMachine = createPlayerStateMachine();
player = createPlayerStateWithMachine(basePlayerState, playerMachine);
```

### In GameSession.update()
Existing physics loop stays mostly the same:
1. **Read Input** → `state.send({ type: 'MOVE_INPUT', dir })`
2. **Apply Physics** (gravity, collision, velocity)
3. **Check Ground Contact** → `state.send({ type: 'GROUND_CONTACT' })` or `LEAVE_GROUND`
4. **Handle Damage** → `state.send({ type: 'DAMAGE_TAKEN' })`
5. **Update Timers** (not machine-driven)
6. **Update Presentation** (animation, particles based on current state)

### In GameSession Tests
- Verify state transitions: `state.send(event)` → `state.matches(expected)` ✓
- Verify physics behavior: send transition → verify `vx`, `vy` in valid range ✓
- Verify spec compliance: all player-controller scenarios pass ✓

---

## Type Exports

```typescript
export type PlayerStateMachineConfig = ReturnType<typeof createPlayerStateMachine>;
export type PlayerMachineState = typeof PlayerStateMachineConfig.state;

// Backwards-compat types (no changes)
export type PlayerState = /* existing definition */;
```
