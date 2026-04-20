## Overview

This change keeps the existing lower-left transient message lane and timer behavior, but narrows what is allowed to enter that lane.

## Message Policy

Keep messages that help the player make an immediate decision or confirm an important state change:

- stage objective briefing and incomplete-exit reminder
- objective completion
- checkpoint activation
- route or traversal state changes such as route reveal or temporary bridge activation
- power gain confirmation
- major optional-reward milestones such as full collectible completion with health restoration

Remove messages that do not change the player's next decision or are already obvious from presentation:

- long authored stage hints
- segment title plus focus banners
- enemy defeat narration
- damage, hit-shield, invincibility-expire, or respawn narration
- per-coin or per-hit reward-block messages when the HUD and pickup feedback already cover them
- exit-finish flavor copy

## Implementation Notes

- Leave the HUD renderer and placement alone; adjust only message producers and message strings.
- Allow coin and reward flows to award progress without always setting a transient message.
- Keep stage-objective startup briefings intact by continuing to seed objective stages with that short message on snapshot creation.
- For non-objective stages, start with no transient message instead of a long authored stage hint.