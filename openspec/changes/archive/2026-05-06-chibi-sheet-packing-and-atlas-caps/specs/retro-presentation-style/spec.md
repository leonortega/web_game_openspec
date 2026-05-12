## ADDED Requirements

### Requirement: Character production sheets use exact row packing and atlas memory caps
The game SHALL define gameplay-facing character production sheets through exact row packing contracts in `art.md`, including row index, clip assignment, frame-slot counts, and reserved slots per row. Player and enemy sheet authoring MUST stay within those exact row maps and MUST NOT exceed frame slots allocated for each clip class. The game SHALL also enforce explicit atlas memory caps in `art.md` for actor, world, props/UI, and total pixel-art atlas groups. Any sheet or atlas that exceeds slot allocations or memory caps MUST be treated as a contract violation and revised before integration. This contract remains presentation-only and MUST NOT alter gameplay timing, collision, or threat behavior.

#### Scenario: Validating player and enemy row packing
- **WHEN** new player or enemy sprite sheets are prepared for integration
- **THEN** each clip occupies only the row index and frame-slot allocation defined in `art.md`
- **AND** no clip spills into rows reserved for another clip family

#### Scenario: Validating atlas memory caps
- **WHEN** packed atlases are evaluated before runtime integration
- **THEN** each atlas group stays at or below its cap listed in `art.md`
- **AND** the aggregate pixel-art atlas memory stays at or below the total cap

#### Scenario: Handling cap or packing overflow
- **WHEN** any sheet packing or memory cap is exceeded
- **THEN** the content is flagged as non-compliant and revised
- **AND** gameplay simulation contracts remain unchanged during that revision
