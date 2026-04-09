---
name: openspec-flow
description: Orchestrate the full OpenSpec flow with one agent per stage when a prompt starts with "openspec".
license: MIT
compatibility: Requires OpenSpec CLI and the local OpenSpec skills.
metadata:
  author: local
  version: "1.0"
---

Use this skill only when the user's prompt starts with the word `openspec`.

If the prompt does not start with `openspec`, do not apply this flow.

## Goal

Run the full OpenSpec workflow with one agent per stage:

`explore -> propose -> apply -> verify/fix loop -> archive`

Each stage must be handled by its own spawned agent.

## Stage Execution

1. Strip the leading `openspec` word from the user's prompt.
2. Treat the remaining text as the change request or change description.
3. Spawn a dedicated agent for `explore`.
4. After explore completes, spawn a dedicated agent for `propose`.
5. After propose completes, spawn a dedicated agent for `apply`.
6. After apply completes, spawn a dedicated agent for `verify`.
7. If verify reports incomplete tasks or warnings, return to `apply` for fixes, then run `verify` again.
8. Repeat step 7 until verify reports no incomplete tasks and no warnings.
9. Spawn a dedicated agent for `archive`.

## Agent Responsibilities

- `explore` agent:
  - Use the local `openspec-explore` skill behavior.
  - Refine the request, inspect relevant code or artifacts, and produce enough context for proposal creation.

- `propose` agent:
  - Use the local `openspec-propose` skill behavior.
  - Create or update the change artifacts needed to reach apply-ready status.

- `apply` agent:
  - Use the local `openspec-apply-change` skill behavior.
  - Implement all pending tasks.
  - During verify/fix loops, fix every issue reported by verify that corresponds to incomplete work or warnings.

- `verify` agent:
  - Use the local `openspec-verify-change` skill behavior.
  - Report whether any incomplete tasks, critical issues, or warnings remain.

- `archive` agent:
  - Use the local `openspec-archive-change` skill behavior.
  - Default to `sync now` whenever sync is offered.

## Verify/Fix Loop Rules

- Treat any incomplete task as a blocking failure.
- Treat any CRITICAL issue as a blocking failure.
- Treat any WARNING issue or explicit warning as a blocking failure that must be fixed before archive.
- Re-run verify after every fix round.
- Do not archive until verify is clean.

If verify produces only suggestions and no incomplete tasks, no CRITICAL issues, and no warnings, archive may proceed.

## Orchestration Guidance

- Use one agent per stage.
- Prefer sequential execution over parallel execution because later stages depend on earlier stage output.
- Pass forward the concrete outputs that matter: change name, artifacts created, implementation status, and verification findings.
- Reuse the existing stage agent if that is simpler than spawning a second apply/verify agent during the loop, but keep the stage ownership separate.
- Keep user-facing progress updates short and explicit about the current stage.

## Archive Default

When archive presents options, choose `sync now` by default.

Only choose a non-sync archive path if:
- the user explicitly requested that behavior, or
- sync cannot be completed and the user still wants to proceed.

