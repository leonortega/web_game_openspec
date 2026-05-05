## Context

`scopeResultsForChange` already resolves explicit scope entries from `CHANGE_RESULT_SCOPE` before it falls back to full report output. That behavior is sufficient for narrow cleanup changes when map entries exist. The current noise comes from missing entries for `trim-mechanic-check-nonterrain-failures` and `trim-mechanic-check-terrain-failures`, even though both archived proposals describe work scoped to `Mechanic Checks` only.

This proposal should stay narrow. It does not need gameplay changes, helper-logic changes, or naming-pattern inference for future changes. Apply only needs to add missing explicit scope metadata so report filtering matches existing change intent.

## Goals / Non-Goals

**Goals:**
- Add explicit report-scope entries for both recent narrow cleanup changes.
- Make change-scoped analysis output include only `Mechanic Checks` rows for those two change names.
- Preserve current fallback behavior for change names that still have no explicit scope entry.

**Non-Goals:**
- Rewriting `scopeResultsForChange` fallback behavior.
- Inferring scope automatically from change-name patterns.
- Changing gameplay, runtime, or helper validation logic outside report scoping metadata.

## Decisions

### Decision: Extend explicit scope map instead of rewriting fallback logic
Apply should add missing `CHANGE_RESULT_SCOPE` entries for `trim-mechanic-check-nonterrain-failures` and `trim-mechanic-check-terrain-failures`.

Rationale:
- Existing scoped filtering path already works when entry exists.
- Missing metadata is root cause of noisy output.
- Small explicit fix keeps behavior predictable and easy to audit.

Alternatives considered:
- Rewrite fallback to infer narrow scope from change-name patterns: rejected because it broadens behavior beyond this cleanup and adds heuristic risk.
- Change `scopeResultsForChange` default behavior for all unmapped changes: rejected because user asked to keep fallback rewrite out of scope.

### Decision: Scope both target changes to `Mechanic Checks` only
Apply should map both target change names to `new Set(['Mechanic Checks'])`.

Rationale:
- Archived proposals for both changes describe `Mechanic Checks` cleanup only.
- This is most precise scope that removes unrelated report rows without hiding intended signal.

Alternatives considered:
- Include adjacent rows such as terrain rollout or flow checks: rejected because archived cleanup intent is narrower.

### Decision: Leave future narrow changes on manual explicit-map maintenance
Apply should not introduce generic pattern-based scoping for future changes in this proposal.

Rationale:
- User explicitly excluded broad future inference.
- Manual entries are cheap and keep scope decisions explicit in review.

Alternatives considered:
- Add convention-driven automatic scoping for all future `trim-mechanic-check-*` changes: rejected because it couples unrelated future work to this small cleanup.

## Risks / Trade-offs

- [Risk] Future narrow cleanup changes can still miss explicit entries and fall back to noisy output. -> Mitigation: keep this requirement explicit so later narrow changes add map entries intentionally.
- [Risk] Change-name typo in map can silently preserve fallback behavior. -> Mitigation: validate scoped analysis for both target names after apply.