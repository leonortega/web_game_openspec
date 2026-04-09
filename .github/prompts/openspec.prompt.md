---
description: Run the full OpenSpec multi-agent flow for prompts that start with "openspec"
---

Run the full OpenSpec flow only when the user's prompt starts with the word `openspec`.

If the prompt does not start with `openspec`, ignore this workflow and handle the request normally.

## Workflow

Create and use one agent for each stage, in this order:

1. `explore`
2. `propose`
3. `apply`
4. `verify`
5. `archive`

Each stage must run in its own agent. Do not merge stages into a single agent.

## Agent Rules

- Spawn one agent dedicated to `explore`, using the local OpenSpec explore instructions as context.
- Spawn one agent dedicated to `propose`, using the local OpenSpec propose instructions as context.
- Spawn one agent dedicated to `apply`, using the local OpenSpec apply instructions as context.
- Spawn one agent dedicated to `verify`, using the local OpenSpec verify instructions as context.
- Spawn one agent dedicated to `archive`, using the local OpenSpec archive instructions as context.
- Pass the original user request, minus the leading `openspec` trigger word, into the flow as the change request.
- Reuse outputs from earlier stages as context for later stages.
- Execute stages sequentially. Wait for the current stage to complete before starting the next one.

## Required Sequence

Always follow this sequence:

`explore -> propose -> apply -> verify/fix loop -> archive`

### Verify/Fix Loop

After `apply`, run `verify`.

If the verify agent reports any incomplete tasks, CRITICAL issues, WARNING issues, or explicit warnings:

1. Spawn or reuse the `apply` agent to fix all reported issues.
2. Run the `verify` agent again.
3. Repeat until the verify result contains no incomplete tasks and no warnings.

Do not proceed to archive while verify still reports incomplete tasks or warnings.

Suggestions may be left as-is unless they are clearly required to eliminate a warning or incomplete-task condition.

## Archive Default

When the flow reaches `archive`, the default archive choice is `sync now`.

If delta specs exist and sync is relevant:
- prefer `Sync now`
- only skip sync if the user explicitly asks to skip it or sync is impossible

## Output Expectations

- Keep the user informed of the current stage.
- Summarize stage outcomes briefly.
- When the loop repeats, state what verify found and what was fixed before re-verifying.
- End with the final archive result.
