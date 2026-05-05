## 1. Gravity-Room Authoring And Route Updates

- [x] 1.1 Update gravity-room stage data, room layout helpers, and any related content definitions so each active enclosed gravity room keeps a reachable interior disable-button route while preserving the enclosed shell, side-wall `IN`-left and `OUT`-right flow, and contact-based disable behavior.
- [x] 1.2 Re-author current gravity rooms that fail the new route-readability rule so the player can still jump and reach the button under active room gravity without moving the button outside the room beat or adding compliance-only helper support.
- [x] 1.3 Place contained interior enemies only where they remain room-local and do not crowd, pin, or replace the intended deactivation route to the button.

## 2. Validation And Runtime Behavior

- [x] 2.1 Update gravity-room validation so it rejects active-field button routes that are unreadable or unreachable with the existing jump and contact rules, and continues rejecting wrong-side door flow, bottom-edge openings, and compliance-only support pieces.
- [x] 2.2 Update gravity-room validation and runtime boundary handling so contained interior enemies remain trapped inside the room, exterior enemies remain outside, and interior enemy placement that blocks the only button lane is rejected.
- [x] 2.3 Update runtime gravity-room behavior only as needed to preserve the existing impulse-first player-controller contract: room gravity bends airborne motion after takeoff, never rewrites jump initiation, and never changes enemy gravity.

## 3. Automated Coverage

- [x] 3.1 Add or update validation coverage for gravity rooms that accept contained interior enemies only when the active-field button route remains readable and reachable.
- [x] 3.2 Add or update runtime or gameplay coverage proving the player can still jump, contact the interior button, and disable the room while active gravity and contained interior enemies are present.
- [x] 3.3 Run the narrow automated test slices for gravity-room validation and runtime behavior until they pass.

## 4. Focused Playtest Evidence

- [x] 4.1 Capture focused gravity-room playtest evidence showing the player can still reach and press each affected room button while the room field is active.
- [x] 4.2 Capture focused playtest evidence showing contained interior enemies remain readable and do not block the intended deactivation path, while exterior enemies still cannot enter the room.
- [x] 4.3 Record any room-specific follow-up adjustments needed to preserve readability if a playtest still reports a downward-feeling or backwards-reading button route.