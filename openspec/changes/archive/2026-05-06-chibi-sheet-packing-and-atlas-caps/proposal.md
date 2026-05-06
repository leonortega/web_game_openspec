# Proposal: Chibi Sheet Packing and Atlas Memory Caps

## Summary
Turn the new chibi size/frame budgets into a production-ready sheet plan with exact row packing and explicit atlas memory caps. The plan defines where each clip sits on sheet rows, how much frame capacity each row has, and the maximum texture memory budget allowed for actor atlases.

## Goal
Make art production deterministic and apply-feasible by replacing loose budget guidance with exact packing contracts.

## In Scope
1. Add requirement language for exact row packing and memory caps.
2. Add per-sheet row map for player and enemy sheets in `art.md`.
3. Add atlas memory cap table and cap-validation rules in `art.md`.
4. Keep gameplay unchanged (presentation pipeline only).

## Out of Scope
1. Importing final PNG files.
2. Runtime texture manager refactor.
3. Collision, timing, or behavior changes.

## Success Criteria
- [ ] `art.md` defines exact row packing for player and each enemy sheet.
- [ ] `art.md` defines explicit per-sheet and aggregate atlas memory caps.
- [ ] OpenSpec requirements reference row-packing and memory-cap compliance.
- [ ] Change is archive-ready with all tasks checked.
