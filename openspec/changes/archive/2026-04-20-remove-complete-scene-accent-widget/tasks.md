## 1. Completion Surface Cleanup

- [x] 1.1 Remove the dedicated right-side widget from `CompleteScene` while preserving the existing centered frame, header strip, summary card, bottom strip, text content, timing, and input flow
- [x] 1.2 Remove any tween and particle burst behavior that exists only for that widget so the completion scene leaves no ghost accent in the removed region

## 2. Debug And Reporting Updates

- [x] 2.1 Update completion-scene debug snapshot handling so verification reflects a no-widget completion surface instead of requiring accent animation
- [x] 2.2 Update playtest and reporting expectations that currently require completion accent activity, including the main stage playtest completion check

## 3. Validation

- [x] 3.1 Run the relevant automated tests for completion-scene behavior and any affected debug snapshot consumers
- [x] 3.2 Run the focused playtest coverage that verifies the completion surface still preserves expected timing, readable status, and flow without the removed widget