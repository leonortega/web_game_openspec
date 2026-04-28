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

Default to the local `caveman` skill for OpenSpec orchestration as far as practical, including user-facing progress updates, stage-agent narration, and compact handoff summaries. Keep code, commits, and other technical deliverables in normal form where the caveman skill requires it. Never use caveman style inside spec artifacts or change artifacts under `openspec/specs/` or `openspec/changes/`; those files must stay in normal repo prose.

## Stage Execution

1. Strip the leading `openspec` word from the user's prompt.
2. Treat the remaining text as the change request or change description.
3. If the remaining request starts with `fix`, mark the run as diagnosis-first and require `explore` to inspect the current implementation for the reported issue before proposal work begins.
3. Read the local `caveman` skill before orchestration and capture the requested level if the user specified one; otherwise use the caveman default mode for workflow communication.
4. Spawn the `OpenSpec Explore` agent for `explore`, and require it to inspect any relevant local skills or best-practice guidance before it settles on exploration findings.
5. After explore completes, spawn the `OpenSpec Propose` agent for `propose`.
6. After propose completes, spawn the `OpenSpec Apply` agent for `apply`.
7. After apply completes, spawn the `OpenSpec Verify` agent for `verify`.
8. If verify reports incomplete tasks or warnings, return to `apply` for fixes, then run `verify` again.
9. Repeat step 8 until verify reports no incomplete tasks and no warnings.
10. Spawn the `OpenSpec Archive` agent for `archive`.

## Stage Handoff Contract

Each stage must pass a compact structured handoff to the next stage.

- `explore` returns:
  - change decision
  - relevant skills consulted
  - relevant specs and changes
  - interpreted user intent
  - issue diagnosis and likely root cause when the request is a fix request
  - concrete solution direction when the request is a fix request
  - meaning of examples, annotations, sketches, or screenshots when present
  - gameplay or design constraints that must be kept, removed, moved, or forbidden
  - false-positive solutions that would satisfy code/spec wording but miss intended player-facing outcome
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

- All stage agents:
  - Read and follow the local `caveman` skill before doing stage work unless the user explicitly disables it.
  - Keep stage-agent user-facing narration and handoff summaries in caveman mode.
  - Keep artifact text in normal repo style for all files under `openspec/specs/` and `openspec/changes/`, plus code, commits, and any other output the caveman skill excludes.

- `OpenSpec Explore`:
  - Use the local `openspec-explore` skill behavior as the exploration stance.
  - Before exploring the codebase in depth, identify and read any relevant local skills that match the requested domain so exploration reflects repo best practices.
  - If no domain skill applies, say so explicitly in the explore handoff instead of implying a skill review happened.
  - If the request starts with `fix`, inspect the current code for the reported issue before proposal work, name the likely root cause, and recommend a concrete repair direction grounded in the existing codebase.
  - Normalize user intent before proposal: translate examples, images, annotations, sketches, and player-experience language into explicit constraints and anti-goals.
  - Distinguish gameplay/design semantics from implementation wording so later stages do not optimize for validator/code success while missing intended player-facing behavior.
  - When user-provided examples imply keep/remove/move/forbid semantics, capture those explicitly in the explore handoff.
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
- Do not require scripted playtests, active-play, or manual gameplay evidence as part of the default OpenSpec flow unless the user explicitly requests that validation.

If verify produces only suggestions and no incomplete tasks, no CRITICAL issues, and no warnings, archive may proceed.

## Orchestration Guidance

- Use one custom agent per stage.
- Prefer sequential execution over parallel execution because later stages depend on earlier stage output.
- Pass forward the concrete outputs that matter: change name, artifacts created, implementation status, and verification findings.
- Include caveman mode explicitly in every stage prompt so terse communication persists across stage boundaries.
- Reuse the existing stage agent instance if that is simpler than spawning a second apply or verify agent during the loop, but keep stage ownership separate.
- Keep user-facing progress updates short and explicit about the current stage.
- If a dedicated stage agent is unavailable, fall back to the matching local step skill behavior and state that fallback explicitly.
- Keep tool calls and shell commands distinct across all stages: edits must use the editing tool path, and terminal commands must contain only executable shell syntax.
- Never send tool names such as `apply_patch` to the terminal. If a stage needs to edit a file, call the edit tool directly instead of describing it as a shell action.
- On Windows workspaces, translate any illustrative shell snippets into PowerShell-native commands before terminal execution.

## Archive Default

When archive presents options, choose `sync now` by default.

Only choose a non-sync archive path if:
- the user explicitly requested that behavior, or
- sync cannot be completed and the user still wants to proceed.

