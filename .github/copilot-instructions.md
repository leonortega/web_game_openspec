# Workspace Instructions

## Caveman Default

- Default to the local `caveman` skill for all prompts in this workspace, not only `openspec` prompts.
- Use caveman in `full` mode unless the user explicitly asks for another caveman level or asks to stop using caveman.
- Apply that terse style to normal user-facing replies, progress updates, planning summaries, context carry-forward, and similar agent narration as far as practical.
- Do not use caveman style for code, commits, pull request text, or artifact files that should stay in normal repo prose.
- Do not use caveman style inside `openspec/specs/` or `openspec/changes/` files.

## OpenSpec Flow

- When a user prompt starts with `openspec`, treat the request as a full OpenSpec workflow, not a partial stage.
- Complete the workflow through `explore -> propose -> apply -> verify/fix loop -> archive` unless the user explicitly asks to stop earlier.
- Do not stop after implementation or after `apply` if `verify` and `archive` are still pending.
- If a stage handoff is incomplete or unreliable, recover manually as needed, but still finish the remaining OpenSpec stages in the same run.
- During the verify/fix loop, treat incomplete tasks, critical issues, and warnings as blocking until they are resolved or the user explicitly accepts stopping.
- During archive, default to syncing delta specs into the main specs unless the user explicitly asks not to sync.
- For any `openspec` stage, keep file-edit tool actions and terminal actions strictly separate: invoke edit tools for file changes, and send only real shell commands to the terminal.
- Never emit or paste tool names such as `apply_patch`, `read_file`, or other agent-tool identifiers into terminal commands or shell snippets.
- On this Windows workspace, prefer PowerShell-native commands when a terminal step is required, such as `New-Item`, `Move-Item`, and `Test-Path`, instead of bash-style commands like `mkdir -p` or `mv`.
- Before ending any `openspec` request, run a final completion audit for the change worked in that request.
- The final completion audit must confirm all of the following before the request can be treated as complete:
	- the target change name is known,
	- `verify` has run after the latest fix round,
	- no tasks remain unchecked in that change,
	- the change no longer exists as an active folder under `openspec/changes/`, and
	- the change exists under `openspec/changes/archive/` unless the user explicitly accepted stopping early.
- If the target change still exists as an active folder after `apply` or `verify`, do not end the request as complete; continue the flow or report the exact blocker.
- If a validation task requires active-play or manual evidence, do not mark the OpenSpec workflow complete until that evidence is recorded or the user explicitly accepts the gap.