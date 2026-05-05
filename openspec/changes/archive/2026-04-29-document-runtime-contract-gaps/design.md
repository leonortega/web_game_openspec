## Overview

This is a contract-capture change that aligns OpenSpec with already-shipped runtime behavior. No net-new systems are introduced. The design goal is to preserve existing scope boundaries while making hidden assumptions explicit.

## Design Decisions

### 1. Low-gravity zones are distinct from anti-grav streams and inversion columns

Low-gravity zones already exist as authored bounded areas that scale airborne gravity without becoming support surfaces. They should be documented as a separate bounded gravity-field family to prevent accidental removal or conflation with stream/inversion behavior.

### 2. Gravity-room button reachability needs an explicit lane guardrail

The runtime and validation path already enforces button-route reachability under active room gravity. The spec now names this as a bounded deactivation lane contract so future enemy/layout changes can be evaluated consistently.

### 3. Turret readability includes variant visuals and telegraph progression

Turret behavior contract should include bounded, stage-authored variant visuals and readable telegraph progression, while keeping cadence and damage semantics unchanged.

### 4. Hopper grounding contract includes first-action landing reachability

Grounded hopper validation already checks whether initial jump/landing patterns remain reachable from authored support. The spec now captures this explicitly so route safety does not regress.

### 5. Jump readability includes a short bounded pose hold

Controller presentation uses a short jump-pose hold to keep jump intent readable without changing controller physics, buffering, or coyote behavior.

### 6. Stage flow includes explicit pre-control and completion handshake states

Stage starts use bounded phase timing (arrival rematerialize, walk-out, close) before control. Stage completion already distinguishes first valid exit contact from final handoff. Specs now codify those transitions.

### 7. Coin full-clear milestone includes aggregate state

The run already tracks aggregate completion state separate from per-coin state. The spec now captures this milestone state and checkpoint behavior.

## Non-Goals

- Reworking gameplay behavior.
- Altering current timing values in code.
- Broadening mechanics beyond current shipped scope.