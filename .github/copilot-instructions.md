# Workspace Instructions

## OpenSpec Flow

- When a user prompt starts with `openspec`, treat the request as a full OpenSpec workflow, not a partial stage.
- Complete the workflow through `explore -> propose -> apply -> verify/fix loop -> archive` unless the user explicitly asks to stop earlier.
- Do not stop after implementation or after `apply` if `verify` and `archive` are still pending.
- If a stage handoff is incomplete or unreliable, recover manually as needed, but still finish the remaining OpenSpec stages in the same run.
- During the verify/fix loop, treat incomplete tasks, critical issues, and warnings as blocking until they are resolved or the user explicitly accepts stopping.
- During archive, default to syncing delta specs into the main specs unless the user explicitly asks not to sync.