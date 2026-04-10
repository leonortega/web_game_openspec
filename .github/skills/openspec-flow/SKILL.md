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

Run the full OpenSpec workflow with one dedicated agent per stage:

`explore -> propose -> apply -> verify/fix loop -> archive`

Each stage must be handled by its own spawned custom agent, not by ad hoc prompt switching inside one general agent.

## Stage Execution

1. Strip the leading `openspec` word from the user's prompt.
2. Treat the remaining text as the change request or change description.
3. Spawn the `OpenSpec Explore` agent for `explore`.
4. After explore completes, spawn the `OpenSpec Propose` agent for `propose`.
5. After propose completes, spawn the `OpenSpec Apply` agent for `apply`.
6. After apply completes, spawn the `OpenSpec Verify` agent for `verify`.
7. If verify reports incomplete tasks or warnings, return to `apply` for fixes, then run `verify` again.
8. Repeat step 7 until verify reports no incomplete tasks and no warnings.
9. Spawn the `OpenSpec Archive` agent for `archive`.

## Stage Handoff Contract

Each stage must pass a compact structured handoff to the next stage.

- `explore` returns:
  - change decision
  - relevant specs and changes
  - likely code touchpoints
  - current behavior summary
  - risks and ambiguities
  - recommended change name

- `propose` returns:
  - change name
  - artifact paths created or updated
  - apply-ready status
  - key implementation requirements

- `apply` returns:
  - files changed
  - tasks completed
  - validations run
  - remaining blockers or follow-ups

- `verify` returns:
  - PASS or FAIL
  - incomplete tasks
  - CRITICAL issues
  - WARNING issues
  - archive decision
  - exact fixes needed

- `archive` returns:
  - archive success status
  - updated or moved artifacts
  - follow-up needed

## Agent Responsibilities

- `OpenSpec Explore`:
  - Use the local `openspec-explore` skill behavior as the exploration stance.
  - Stay read-only.
  - Produce a proposal-ready context report.

- `OpenSpec Propose`:
  - Use the local `openspec-propose` skill behavior.
  - Edit only OpenSpec artifacts needed to make the change apply-ready.

- `OpenSpec Apply`:
  - Use the local `openspec-apply-change` skill behavior.
  - Implement all pending tasks.
  - Update task checkboxes as work is completed.
  - During verify/fix loops, fix every issue reported by verify that corresponds to incomplete work or warnings.

- `OpenSpec Verify`:
  - Use the local `openspec-verify-change` skill behavior.
  - Stay read-only.
  - Report whether any incomplete tasks, CRITICAL issues, or WARNING issues remain.

- `OpenSpec Archive`:
  - Use the local `openspec-archive-change` skill behavior.
  - Default to `sync now` whenever sync is offered.

## Verify/Fix Loop Rules

- Treat any incomplete task as a blocking failure.
- Treat any CRITICAL issue as a blocking failure.
- Treat any WARNING issue or explicit warning as a blocking failure that must be fixed before archive.
- Re-run verify after every fix round.
- Do not archive until verify is clean.
- `OpenSpec Verify` must not edit files during this loop.
- `OpenSpec Apply` owns all fix work during this loop.

If verify produces only suggestions and no incomplete tasks, no CRITICAL issues, and no warnings, archive may proceed.

## Orchestration Guidance

- Use one custom agent per stage.
- Prefer sequential execution over parallel execution because later stages depend on earlier stage output.
- Pass forward the concrete outputs that matter: change name, artifacts created, implementation status, and verification findings.
- Reuse the existing stage agent instance if that is simpler than spawning a second apply or verify agent during the loop, but keep stage ownership separate.
- Keep user-facing progress updates short and explicit about the current stage.
- If a dedicated stage agent is unavailable, fall back to the matching local step skill behavior and state that fallback explicitly.

## Archive Default

When archive presents options, choose `sync now` by default.

Only choose a non-sync archive path if:
- the user explicitly requested that behavior, or
- sync cannot be completed and the user still wants to proceed.

