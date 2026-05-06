# Art Reference

This document captures pixel-art requirements for the current game and provides sprite-sheet targets, texture keys, and recommended canvas sizes.

## 1. Existing Texture Keys (Already Implemented)

These keys are already registered in boot texture setup.

| Element | Texture Key | Current Canvas Size |
| --- | --- | --- |
| Player portrait/body sprite | player | 26x42 |
| Walker enemy | walker | 30x28 |
| Hopper enemy | hopper | 30x28 |
| Turret enemy | turret | 28x38 |
| Charger enemy | charger | 34x30 |
| Flyer enemy | flyer | 34x24 |
| Projectile | projectile | 12x12 |
| Particle | retro-particle | 4x4 |
| Burst particle | retro-particle-burst | 12x12 |
| Collectible | collectible | 20x20 |
| Checkpoint | checkpoint | 24x80 |
| Exit capsule full art | exit | 48x80 |
| Exit shell | exit-shell | 36x44 |
| Exit door (closed) | exit-door | 24x36 |
| Exit door (open) | exit-door-open | 10x36 |

Source of truth: src/phaser/assets/bootTextures.ts

## 2. Elements That Still Need Pixel-Art Assets

These visuals are currently rectangle or shape-driven and should move to pixel textures/sprite sheets.

1. Gameplay player body composition (main on-stage astronaut)
2. Platform families and platform surface variants
3. Gravity zones, gravity fields, gravity capsules, capsule doors/buttons
4. Hazard spikes
5. Reward blocks and reward reveal iconography
6. Activation nodes and traversal marker glyphs
7. Exit/arrival support pieces (base, shadow plate, beacon)
8. Pause overlay framing elements (optional)
9. Menu/intro/complete panel ornaments for full pixel shell (optional)

## 3. Sprite-Sheet Targets and Recommended Keys

Use one atlas per major category, or split into small atlases if runtime memory is tight.

### 3.1 Player (Gameplay)

Orientation rule for all player clips: use side-view astronaut, not front-view. Character must face left or right based on movement/facing direction.

| Target | Recommended Texture Key | Recommended Frame Size | Notes |
| --- | --- | --- | --- |
| Full gameplay player sheet | player-sheet | 32x48 per frame | Replace rectangle-composed player visuals in gameplay scene. Side-view only (left/right facing). |
| Idle | player-idle | 32x48 | Keep last horizontal facing direction while idle. |
| Run | player-run | 32x48 | 6-8 frames suggested. |
| Jump/Fall | player-jump, player-fall | 32x48 | 1-2 frames each. |
| Dash | player-dash | 32x48 | Include directional smear frame. |
| Hurt/defeat | player-hurt, player-defeat | 32x48 | Match current feedback timing. |

### 3.2 Platforms and Terrain Variants

| Target | Recommended Texture Key | Recommended Frame/Tile Size | Notes |
| --- | --- | --- | --- |
| Base platform tile set | platform-tiles | 16x16 tiles | Core static/moving/falling/spring visuals. |
| Platform top strip | platform-top | 16x8 | Useful for layered highlight replacement. |
| Platform shadow tile | platform-shadow | 16x16 | Replace generated shadow rectangles. |
| Sticky sludge variant | terrain-sticky | 16x16 tiles | Animated 2-4 frames optional. |
| Brittle crystal variant | terrain-brittle | 16x16 tiles | Include states: intact/warning/ready/broken. |
| Magnetic platform overlay | platform-magnetic | 16x16 | Powered/unpowered variants. |

### 3.3 Gravity Systems

| Target | Recommended Texture Key | Recommended Frame Size | Notes |
| --- | --- | --- | --- |
| Low gravity zone tile | gravity-zone-tile | 16x16 | Repeating overlay pattern. |
| Anti-grav stream field | gravity-field-stream | 16x16 or 32x32 | Looping pattern frame(s). |
| Inversion column field | gravity-field-invert | 16x16 or 32x32 | Distinct directional glyph language. |
| Capsule shell | gravity-capsule-shell | 48x64 | Separate from exit capsule style for readability. |
| Capsule entry door | gravity-capsule-entry-door | 16x32 | Open/closed frames optional. |
| Capsule exit door | gravity-capsule-exit-door | 16x32 | Open/closed frames optional. |
| Capsule button | gravity-capsule-button | 24x16 | Idle/pressed states. |
| Capsule button core | gravity-capsule-button-core | 12x8 | Glow pulse optional. |

### 3.4 Hazards

| Target | Recommended Texture Key | Recommended Frame Size | Notes |
| --- | --- | --- | --- |
| Spike strip | hazard-spikes | 16x16 tiles | Horizontal/vertical variants. |
| Spike warning flash | hazard-spikes-warning | 16x16 | Optional flashing telegraph frame. |

### 3.5 Rewards, Nodes, and Interaction Props

| Target | Recommended Texture Key | Recommended Frame Size | Notes |
| --- | --- | --- | --- |
| Reward block | reward-block | 24x24 | Include hit flash variants or palette swaps. |
| Reward block consumed | reward-block-used | 24x24 | Optional explicit spent state frame. |
| Activation node | activation-node | 20x20 | Inactive/active frames. |
| Traversal marker set | traversal-marker-sheet | 8x8 or 12x12 | Replace debug-like rectangle markers with glyph icons. |

### 3.6 Exit/Arrival Support Pieces

| Target | Recommended Texture Key | Recommended Frame Size | Notes |
| --- | --- | --- | --- |
| Exit base plate | exit-base | 64x16 | Replaces rectangle base. |
| Exit base shadow | exit-base-shadow | 64x12 | Optional if baked into base. |
| Exit beacon | exit-beacon | 16x16 | Idle + pulse frames. |
| Arrival base plate | arrival-base | 48x14 | Smaller variant for stage start sequence. |
| Arrival beacon | arrival-beacon | 14x14 | Sync with stage-start sequence timing. |

### 3.7 UI Shell (Optional, Full Pixel Direction)

| Target | Recommended Texture Key | Recommended Frame Size | Notes |
| --- | --- | --- | --- |
| Menu panel corners/edges | ui-panel-atlas | 8x8 slices | 9-slice style pixel frame components. |
| Intro/complete banners | ui-banner-sheet | 256x48 | Scene title strips. |
| Pause frame | ui-pause-frame | 320x180 | Can be tiled/scaled to viewport. |

## 4. Suggested Atlas Grouping

1. gameplay-actors-atlas: player, enemies, projectile
2. gameplay-world-atlas: platforms, terrain, gravity, hazards
3. gameplay-props-atlas: reward block, activation node, exit support pieces
4. ui-shell-atlas: menu/intro/complete/pause decorative parts

## 5. Integration Notes

1. Keep current existing keys unchanged for backward compatibility until migration is complete.
2. Introduce new keys in parallel, then switch render paths scene-by-scene.
3. Prefer 16x16 world tile units for platforms, hazards, and field motifs to match existing world grid rhythm.
4. For animated sheets, use frame dimensions that align with current entity bounds to minimize collision/render drift.
5. Preserve nearest-neighbor sampling and avoid smoothing for all pixel textures.

## 6. Immediate Implementation Priority

1. player-sheet
2. platform-tiles + terrain-sticky + terrain-brittle
3. gravity-field-stream + gravity-field-invert + gravity-capsule-* keys
4. hazard-spikes
5. reward-block + activation-node
6. exit-base + exit-beacon

## 7. Implementation Checklist (Keys -> Registration -> Scene Usage)

Use this as the migration checklist.

### 7.1 Registration Touchpoints

1. Add all new keys to REQUIRED_BOOT_TEXTURE_KEYS in src/phaser/assets/bootTextures.ts.
2. Register textures in registerBootTextures in src/phaser/assets/bootTextures.ts.
3. Keep old keys during transition so existing scenes still render.

### 7.2 Scene Usage Touchpoints

1. Gameplay object creation entry: src/phaser/scenes/gameScene/bootstrap.ts
2. Platform sync/update path: src/phaser/scenes/gameScene/platformRendering.ts
3. Gravity sync/update path: src/phaser/scenes/gameScene/gravityRendering.ts
4. Hazard/projectile path: src/phaser/scenes/gameScene/enemyRendering.ts
5. Reward/checkpoint path: src/phaser/scenes/gameScene/rewardRendering.ts
6. Exit/arrival animation path: src/phaser/scenes/GameScene.ts

### 7.3 Key-Level Migration Matrix

| New Key | Register In | First Consumer | Current Visual Being Replaced |
| --- | --- | --- | --- |
| player-sheet | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/bootstrap.ts | Rectangle-composed gameplay player |
| player-idle | src/phaser/assets/bootTextures.ts | src/phaser/scenes/GameScene.ts | Idle state rectangles |
| player-run | src/phaser/assets/bootTextures.ts | src/phaser/scenes/GameScene.ts | Run cycle rectangles |
| player-jump | src/phaser/assets/bootTextures.ts | src/phaser/scenes/GameScene.ts | Jump pose rectangles |
| player-fall | src/phaser/assets/bootTextures.ts | src/phaser/scenes/GameScene.ts | Fall pose rectangles |
| player-dash | src/phaser/assets/bootTextures.ts | src/phaser/scenes/GameScene.ts | Dash pose rectangles |
| player-hurt | src/phaser/assets/bootTextures.ts | src/phaser/scenes/GameScene.ts | Hit feedback tint-only state |
| player-defeat | src/phaser/assets/bootTextures.ts | src/phaser/scenes/GameScene.ts | Defeat rectangle stack |
| platform-tiles | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/bootstrap.ts | Platform fill rectangles |
| platform-top | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/platformRendering.ts | Platform detail top strips |
| platform-shadow | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/platformRendering.ts | Shadow rectangles/GPU members |
| terrain-sticky | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/platformRendering.ts | Sticky terrain fill blocks |
| terrain-brittle | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/platformRendering.ts | Brittle terrain fill blocks |
| platform-magnetic | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/platformRendering.ts | Magnetic platform stroke/tint styling |
| gravity-zone-tile | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/bootstrap.ts | Low-gravity zone overlay rectangle |
| gravity-field-stream | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/gravityRendering.ts | Anti-grav field rectangles |
| gravity-field-invert | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/gravityRendering.ts | Inversion field rectangles |
| gravity-capsule-shell | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/gravityRendering.ts | Capsule shell rectangle |
| gravity-capsule-entry-door | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/gravityRendering.ts | Capsule entry door rectangle |
| gravity-capsule-exit-door | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/gravityRendering.ts | Capsule exit door rectangle |
| gravity-capsule-button | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/gravityRendering.ts | Capsule button rectangle |
| gravity-capsule-button-core | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/gravityRendering.ts | Capsule button core rectangle |
| hazard-spikes | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/enemyRendering.ts | Spike base + tooth rectangles |
| hazard-spikes-warning | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/enemyRendering.ts | Optional warning flash state |
| reward-block | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/bootstrap.ts | Reward block rectangle |
| reward-block-used | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/rewardRendering.ts | Reward used dim state |
| activation-node | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/platformRendering.ts | Activation node rectangle |
| traversal-marker-sheet | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/platformRendering.ts | Traversal marker rectangles |
| exit-base | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/bootstrap.ts | Exit base rectangle |
| exit-base-shadow | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/bootstrap.ts | Exit base shadow rectangle |
| exit-beacon | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/bootstrap.ts | Exit beacon rectangle |
| arrival-base | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/bootstrap.ts | Arrival base rectangle |
| arrival-beacon | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/bootstrap.ts | Arrival beacon rectangle |
| ui-panel-atlas | src/phaser/assets/bootTextures.ts | src/phaser/scenes/MenuScene.ts | Menu panel rectangles |
| ui-banner-sheet | src/phaser/assets/bootTextures.ts | src/phaser/scenes/StageIntroScene.ts | Intro/complete banner rectangles |
| ui-pause-frame | src/phaser/assets/bootTextures.ts | src/phaser/scenes/gameScene/bootstrap.ts | Pause overlay frame rectangle |

### 7.4 Suggested Rollout Order (Per Pull Request)

1. PR1: player-sheet migration in gameplay scene (keep old player key).
2. PR2: platforms + terrain variants.
3. PR3: gravity systems + hazards.
4. PR4: reward/activation props + exit/arrival support pieces.
5. PR5: optional UI shell atlas migration (menu/intro/complete/pause).

## 8. Movement Information (Animation and Motion Reference)

Use this section when drawing sprite sheets so movement states match simulation behavior.

### 8.1 Player Movement Constants (Simulation)

Current gameplay values from simulation logic:

| Parameter | Value | Meaning for Art |
| --- | --- | --- |
| MAX_MOVE_SPEED | 260 | Top horizontal run speed silhouette should read clearly at high stride speed. |
| GROUND_ACCEL | 1800 | Fast start/stop feel, so run-start and skid frames should be snappy. |
| AIR_ACCEL | 1200 | Air steering exists, so airborne pose should support left/right facing changes. |
| JUMP_SPEED | 640 | Strong upward launch, include distinct jump-start pose. |
| MAX_FALL_SPEED | 1100 | Fast descent, keep fall silhouette compact/readable. |
| COYOTE_TIME_MS | 120 | Small delayed jump forgiveness, landing and edge-leave frames should blend smoothly. |
| JUMP_BUFFER_MS | 140 | Buffered jump input, avoid over-long anticipation frames. |
| DASH_SPEED | 520 | Very fast horizontal burst, include clear dash smear frame. |
| DASH_DURATION_MS | 120 | Dash animation should be short and punchy (about 2-4 frames). |
| DASH_COOLDOWN_MS | 700 | Optional cooldown idle accent can pulse briefly then settle. |
| THRUSTER_PULSE_DOWN_SPEED | 760 | Downward strike action needs forceful downward pose. |
| THRUSTER_PULSE_COOLDOWN_MS | 260 | Thruster burst should feel discrete, not continuous. |
| THRUSTER_IMPACT_WINDOW_MS | 180 | Impact follow-through visual should resolve quickly. |
| PLAYER_PROJECTILE_SPEED | 520 | Shooting pose should keep arm readability at high projectile speed. |

### 8.1.1 Chibi Character Size and Proportion Envelope

Use this as the hard presentation envelope for richer 16-bit-like character detail while preserving runtime behavior.

| Actor | Runtime Texture Key | Frame Envelope | Chibi Read Target | Non-Negotiable Guardrails |
| --- | --- | --- | --- | --- |
| Player astronaut | player-sheet | 32x48 | Side-view chibi, oversized helmet/head with compact torso/limb mass (about 1:1 to 1:1.4 head-to-body mass read) | Preserve current collision and foot anchor; no hitbox growth |
| Walker | walker | 30x28 | Compact head-front or visor block with short leg cycle | Preserve patrol footing and lane bounds |
| Hopper | hopper | 30x28 | Compressed crouch mass and readable jump extension pose | Preserve hop launch and landing timing |
| Turret | turret | 28x38 | Chibi mech pillar: readable head/cannon cap and base separation | Preserve telegraph cadence and projectile origin behavior |
| Charger | charger | 34x30 | Heavy compact body with clear windup silhouette shift | Preserve trigger range and charge cadence |
| Flyer | flyer | 34x24 | Compact ovni/chibi drone read with clear underside-light mass | Preserve hover lane and bobbing behavior |

Notes:
1. Keep detail clusters bounded: silhouette + up to 3 interior accent clusters per actor state.
2. Keep pose readability at 1x gameplay scale as priority over micro-detail.
3. Sprite upgrades are presentation-only and must not alter simulation constants.

### 8.2 Recommended Player Movement Clips

| Clip | Key or Sheet Row | Frame Budget (Min-Max) | Suggested FPS | Notes |
| --- | --- | --- | --- | --- |
| Idle | player-idle | 4-6 | 6-8 | Subtle breathing; keep helmet/visor readable. Side-view, keep last facing dir. |
| Run | player-run | 6-10 | 10-14 | Main locomotion cycle, strong leg contrast. Use left/right flip or directional sets. |
| Jump start | player-jump-start | 2-3 | 12 | Very short anticipation then launch. |
| Jump rise | player-jump | 2-4 | 10-12 | Upward extension frame(s). |
| Apex | player-apex | 1-2 | hold | Brief hang frame before fall. |
| Fall | player-fall | 2-4 | 10-12 | Compact descent silhouette. |
| Land | player-land | 2-3 | 12 | Impact + recovery; sync with coyote/buffer feel. |
| Dash | player-dash | 3-5 | 16-20 | Use one stretched frame and one recovery frame. |
| Thruster pulse | player-thruster | 3-5 | 14-18 | Downward impact cue + recoil. |
| Shoot | player-shoot | 2-4 | 14-18 | Overlay or additive arm pose if possible. |
| Hurt | player-hurt | 2-3 | 10-12 | Quick readable hit reaction. |
| Defeat | player-defeat | 5-8 | 10-12 | Supports current defeat hold/fx timing. |

### 8.3 Enemy Movement Signatures

| Enemy | Movement Behavior | Required Motion Clips |
| --- | --- | --- |
| walker | Patrols lanes, reverses at bounds | idle, walk, turn frame |
| hopper | Waits, ballistic hop, lands and resets | crouch, launch, airborne, land |
| turret | Stationary, telegraphs, fires | idle, telegraph, fire, cooldown |
| charger | patrol -> windup -> charge -> cooldown | patrol, windup, charge, brake/cooldown |
| flyer | Horizontal sweep with bobbing | flap cycle (or hover cycle), turn frame |

### 8.3.1 Enemy Frame Budget Matrix

| Enemy | Clip | Frame Budget (Min-Max) | Notes |
| --- | --- | --- | --- |
| walker | idle | 2-4 | Keep compact breathing/readability loop. |
| walker | walk | 4-8 | Leg cadence must remain readable at patrol speed. |
| walker | turn | 1-2 | Fast lane-reversal clarity frame. |
| hopper | crouch | 2-4 | Build launch readability without delay drift. |
| hopper | launch | 1-3 | Keep launch snappy and ballistic-friendly. |
| hopper | airborne | 2-4 | Readable compact in-air silhouette. |
| hopper | land | 2-3 | Impact and reset cue. |
| turret | idle | 2-4 | Subtle idle pulse, low noise. |
| turret | telegraph | 2-4 | Must clearly read pre-fire warning. |
| turret | fire | 1-3 | Keep event crisp, no cadence drift. |
| turret | cooldown | 1-2 | Short settle before idle. |
| charger | patrol | 3-6 | Heavy but readable stepping loop. |
| charger | windup | 2-4 | Distinct pre-charge posture. |
| charger | charge | 2-4 | Strong directional momentum read. |
| charger | cooldown | 2-4 | Brake/recover without mechanic drift. |
| flyer | hover/flap | 4-8 | Stable hover read with bounded bob accent. |
| flyer | turn | 1-2 | Fast direction-change clarity frame. |

Notes:
1. Charger trigger range is 220, so windup silhouette must be obvious before burst.
2. Hopper targeting uses ballistic constraints, so takeoff and landing poses need clear readability.
3. Turret variant colors already communicate state, so motion can stay minimal but sharp.
4. Enemy clip budgets above are presentation limits only and MUST NOT modify collision, cadence, or threat reach.

### 8.4 Platform and World Motion Signatures

| System | Behavior | Art Motion Guidance |
| --- | --- | --- |
| moving platform | Oscillates on X or Y, reverses at range bounds | 2-4 frame conveyor or indicator loop to show travel intent |
| falling platform | Arms after support time, then delayed drop | states: idle, armed warning, break/drop |
| spring platform | Launches player, has cooldown timer | compressed frame, release frame, cooldown frame |
| brittle terrain | phases: intact/warning/ready/broken | 4 distinct visuals, warning should pulse |
| sticky terrain | slows movement/accel | viscous animated surface loop (2-4 frames) |
| magnetic platform | powered/unpowered state | clear emissive strip change between states |

### 8.5 Gravity and Capsule Motion Guidance

| System | Behavior | Art Motion Guidance |
| --- | --- | --- |
| anti-grav stream | gravity scale -0.38 | gentle upward flow animation loop |
| inversion column | gravity scale -1 | stronger directional pattern than anti-grav stream |
| capsule doors | open/close state visuals | 2-state minimum (closed/open), optional 3-4 transition frames |
| capsule button | inactive/active | idle + pressed frame, optional glow pulse |

### 8.6 Sprite-Sheet Layout Tips for Movement

1. Keep all movement clips for one actor on one sheet row group to simplify animation indexing.
2. Use consistent pivot/foot anchor across clips to avoid vertical jitter.
3. Prefer horizontal strip order: idle -> run -> jump -> fall -> dash -> action -> hurt/defeat.
4. If memory allows, reserve one extra frame per state for variant color/tint-free readability.
5. Do not use front-facing astronaut frames for gameplay locomotion; use side-view frames with left/right facing behavior.

### 8.7 Exact Production Row Packing (Character Sheets)

Use these exact row contracts when building production sheets. Clip slots outside listed ranges are reserved and MUST remain empty or hold only approved variant swaps.

#### 8.7.1 Player Sheet Packing

- Sheet key: `player-sheet`
- Frame size: 32x48
- Grid: 12 columns x 8 rows (96 slots)
- Packed canvas size: 384x384

| Row | Slot Range | Clip Assignment | Allocated Slots | Notes |
| --- | --- | --- | --- | --- |
| 0 | C0-C5 | idle | 6 | C6-C11 reserved |
| 1 | C0-C9 | run | 10 | C10-C11 reserved |
| 2 | C0-C2, C3-C6, C7-C8 | jump-start, jump-rise, apex | 9 | C9-C11 reserved |
| 3 | C0-C3, C4-C6 | fall, land | 7 | C7-C11 reserved |
| 4 | C0-C4, C5-C8 | dash, shoot | 9 | C9-C11 reserved |
| 5 | C0-C4, C5-C7 | thruster, hurt | 8 | C8-C11 reserved |
| 6 | C0-C7 | defeat | 8 | C8-C11 reserved |
| 7 | C0-C11 | reserved | 12 | Future additive states only |

#### 8.7.2 Enemy Sheet Packing

| Sheet Key | Frame Size | Grid (C x R) | Packed Canvas | Row Packing Contract |
| --- | --- | --- | --- | --- |
| walker-sheet | 30x28 | 8 x 4 | 240x112 | R0 idle C0-C3, R1 walk C0-C7, R2 turn C0-C1, R3 reserved |
| hopper-sheet | 30x28 | 8 x 4 | 240x112 | R0 crouch C0-C3, R1 launch C0-C2 + airborne C3-C6, R2 land C0-C2, R3 reserved |
| turret-sheet | 28x38 | 8 x 4 | 224x152 | R0 idle C0-C3, R1 telegraph C0-C3, R2 fire C0-C2 + cooldown C3-C4, R3 reserved |
| charger-sheet | 34x30 | 8 x 5 | 272x150 | R0 patrol C0-C5, R1 windup C0-C3, R2 charge C0-C3, R3 cooldown C0-C3, R4 reserved |
| flyer-sheet | 34x24 | 8 x 3 | 272x72 | R0 hover/flap C0-C7, R1 turn C0-C1, R2 reserved |

### 8.8 Atlas Memory Caps (Hard Limits)

Memory estimate formula:
1. `sheetBytes = sheetWidth * sheetHeight * 4`
2. `sheetMiB = sheetBytes / 1048576`
3. `groupMiB = sum(sheetMiB for all sheets in group)`

| Atlas Group | Included Production Sheets | Hard Cap (MiB) | Planned Baseline (MiB) | Headroom |
| --- | --- | --- | --- | --- |
| actor-atlas-group | player + walker + hopper + turret + charger + flyer sheets | 2.00 | 1.11 | 0.89 MiB |
| world-atlas-group | platform/terrain/gravity/hazard sheets | 4.00 | 2.60 | 1.40 MiB |
| props-ui-atlas-group | reward/activation/exit/arrival/ui-shell sheets | 2.00 | 1.20 | 0.80 MiB |
| global-pixel-atlas-budget | all pixel-art production atlases combined | 8.00 | 4.91 | 3.09 MiB |

Cap compliance rules:
1. Any group above cap is non-compliant and MUST be repacked or split before integration.
2. Global cap exceedance is blocking even if individual groups pass.
3. Reserve rows do not grant automatic cap exceptions; cap increases require a follow-up spec change.

## 9. Animator Checklist (State -> Trigger -> Exit)

Use this table when wiring Phaser animations or a manual animation state machine.

### 9.1 Player Animator Checklist

| State | Enter Trigger | Exit Condition |
| --- | --- | --- |
| idle | on ground, abs(vx) near 0, not dashing, not shooting | move input starts, jump starts, dash starts, shoot starts |
| run | on ground, abs(vx) above run threshold, not dashing | abs(vx) drops to near 0, jump starts, dash starts |
| jump-start | jump input accepted (ground/coyote/double jump) | fixed short duration or first upward frame finished |
| jump-rise | vy < 0 and airborne | vy >= 0 (apex/fall), land detected |
| apex | airborne and vy approx 0 | vy > 0 or land detected |
| fall | airborne and vy > 0 | land detected, dash starts |
| land | just landed (transition from airborne to grounded) | short duration then idle/run |
| dash | dash input accepted and cooldown ready | dash timer ends (120 ms) |
| thruster | thruster pulse input accepted and fuel/cooldown valid | short duration then fall/land |
| shoot | shoot input accepted and cooldown ready | short duration then return to locomotion state |
| hurt | damage event received | hit-flash timer ends or defeat starts |
| defeat | player defeated event | respawn/reset flow starts |

### 9.2 Enemy Animator Checklist

| Actor | State | Enter Trigger | Exit Condition |
| --- | --- | --- | --- |
| walker | patrol | spawn or lane settle | lane edge turn, hurt, defeat |
| walker | turn | lane boundary reached | short duration then patrol opposite direction |
| hopper | crouch | hop timer near fire point while grounded | hop launch starts |
| hopper | launch | hop target solved and jump begins | airborne phase begins |
| hopper | airborne | support lost with active hop | landing detected |
| hopper | land | contact with support platform | short duration then crouch/idle |
| turret | idle | default while telegraph timer inactive | telegraph begins or hurt/defeat |
| turret | telegraph | fire prep starts (telegraphMs active) | projectile fire event |
| turret | fire | projectile spawned | short duration then idle |
| turret | cooldown | post-fire settle | timer complete then idle |
| charger | patrol | default charger state | player in trigger range -> windup |
| charger | windup | trigger range reached | timer complete -> charge |
| charger | charge | windup timer finished | lane bound hit or hit reaction -> cooldown |
| charger | cooldown | charge ends | timer complete -> patrol |
| flyer | hover/fly | default flyer movement | edge reached flip or hurt/defeat |
| flyer | turn | left/right bound reached | short duration then hover/fly |

### 9.3 World/Prop Animator Checklist

| System | State | Enter Trigger | Exit Condition |
| --- | --- | --- | --- |
| moving platform | travel-forward | initial direction = 1 | max range reached -> travel-backward |
| moving platform | travel-backward | direction flipped to -1 | min range reached -> travel-forward |
| falling platform | idle | not triggered | support accumulation reaches arm threshold |
| falling platform | armed | fall.triggered = true | trigger delay timer reaches 0 |
| falling platform | falling | fall.falling = true | out of play/reset path |
| spring platform | idle | spring cooldown timer = 0 | player contact launches spring |
| spring platform | compressed/release | spring activated by contact | cooldown starts then returns idle |
| brittle terrain | intact | default phase | warning phase starts |
| brittle terrain | warning | brittle warning phase | ready phase starts |
| brittle terrain | ready | brittle ready phase | broken phase starts |
| brittle terrain | broken | break condition reached | rebuild/reset phase (if any) |
| magnetic platform | unpowered | node not activated | activation node toggled on |
| magnetic platform | powered | node activated | activation node toggled off |
| gravity capsule door | closed | capsule disabled or default closed | open condition active |
| gravity capsule door | open | capsule/button condition active | close condition active |
| reward block | active | reward hits remaining > 0 | remaining hits == 0 |
| reward block | consumed | remaining hits == 0 | stage reset/reload |

### 9.4 Quick Wiring Rules

1. Priority order for player state resolution: defeat -> hurt -> dash -> thruster/shoot overlays -> air states -> ground states.
2. Keep timers authoritative from simulation values (dash 120 ms, cooldowns from runtime) to avoid visual/gameplay drift.
3. For events with both pose and VFX, start pose first, then trigger particles/flash in same frame.
4. Always define explicit fallback transition to idle for safety when unknown state data appears.
5. Facing rule: if `vx > 0` face right, if `vx < 0` face left, if `vx == 0` keep previous facing direction.

## 10. Slice 1 Migration Status (2026-05-05)

### Completed In This Apply Pass

1. Registered and generated Slice 1 keys in `src/phaser/assets/bootTextures.ts`, including runtime player sprite-sheet frames and route-critical world textures.
2. Added gameplay player sprite-sheet render path plus state-driven Phaser animations (idle, run, jump, fall, dash, hurt, defeat) in `src/phaser/scenes/GameScene.ts` and `src/phaser/scenes/gameScene/bootstrap.ts`.
3. Migrated route-critical visual paths from rectangle-first rendering to sprite/tile rendering in:
   - `src/phaser/scenes/gameScene/platformRendering.ts`
   - `src/phaser/scenes/gameScene/gravityRendering.ts`
   - `src/phaser/scenes/gameScene/enemyRendering.ts`
   - `src/phaser/scenes/gameScene/rewardRendering.ts`
   - `src/phaser/scenes/gameScene/bootstrap.ts` (exit/arrival support pieces)
4. Implemented brittle terrain state visuals using distinct textures for `intact`, `warning`, `ready`, and `broken` while keeping existing timing semantics.

### Deferred Backlog For Next Slice

1. Optional UI shell keys remain deferred: `ui-panel-atlas`, `ui-banner-sheet`, `ui-pause-frame`.
2. Extended terrain/support variants remain deferred: `platform-top`, `platform-shadow`, `platform-magnetic`, `traversal-marker-sheet`, `exit-base-shadow`.
3. Additional capsule/field polish variants remain deferred: animated transitions for capsule doors/buttons and dedicated `gravity-zone-tile` overlays.
4. Full enemy sprite-sheet state animations remain deferred; current slice keeps existing enemy motion logic and upgrades hazard presentation.
