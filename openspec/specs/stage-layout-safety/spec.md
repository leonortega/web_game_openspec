# stage-layout-safety Specification

## Purpose
Define authored static-layout safety rules that keep collision-bearing stage elements readable and free of unintended overlap.

## Requirements
### Requirement: Authored static stage elements remain collision-free
The game SHALL author static stage elements so their collision bounds do not overlap or interpenetrate in the same world space. Static elements that are intended to be adjacent MAY touch at edges, but they MUST not occupy the same collision area or create unreadable authored collisions. Any static stage element authored as floor-anchored or route-grounded MUST also rest on visible authored support in source data and MUST NOT depend on hidden helper support, render-only vertical compensation, or default snap-to-ground fallback to appear grounded.

#### Scenario: Rejecting overlapping static elements
- **WHEN** a stage author places two static world elements so their collision bounds overlap
- **THEN** validation rejects the layout or requires one element to move so the placements no longer collide

#### Scenario: Allowing edge-adjacent static elements
- **WHEN** two static elements are authored to meet at a shared edge without overlapping bounds
- **THEN** the layout remains valid and the elements stay readable as separate authored pieces

#### Scenario: Rejecting unsupported floor-anchored static elements
- **WHEN** a stage author places a floor-anchored static prop or route-grounded structure whose visible base lacks stable authored support
- **THEN** validation reports that placement for authored correction before runtime use
- **AND** the fix path does not add hidden support or presentation-only grounding cheats
