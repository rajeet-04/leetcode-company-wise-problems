# Agentic Execution Protocol

This folder contains execution-facing documents. Planning documents explain what and why; execution documents define task order, exact verification, and handoff expectations.

## Required reading order

1. `docs/agentic/README.md`
2. `docs/agentic/AGENT.md`
3. relevant track `AGENT.md`
4. relevant track `PLAN.md`
5. current execution phase document

## Execution mode

Preferred: Superpowers subagent-driven development, one fresh agent per independently reviewable task, with verification between tasks.

Alternative: Superpowers executing-plans in the current session with explicit checkpoints.

## Branch/worktree policy

- Create an isolated worktree before implementation work.
- Use one feature branch per execution phase or tightly coupled task group.
- Documentation branch `docs/agentic-roadmap` is not the implementation branch.
- Keep generated catalog churn separate from unrelated UI commits when practical.

## Task cycle

For every implementation task:

1. Read interfaces produced by prior tasks.
2. Write the failing test first.
3. Run the targeted test and confirm the intended failure.
4. Implement the minimum production code.
5. Run the targeted test and confirm pass.
6. Run relevant track verification.
7. Review diff for scope creep and privacy violations.
8. Commit with a focused message.

## Review gates

A reviewer should reject a task when any of these are true:

- shared logic was duplicated in a client;
- user data is sent to a remote service;
- extension asks for unnecessary permissions;
- a LeetCode selector leaked outside the adapter;
- migration can destroy existing local progress;
- a score lacks explanation components/reasons;
- tests cover implementation details rather than externally meaningful behavior;
- verification commands were not run.

## Phase completion report

Every phase completion note must include:

- branch/commit range;
- tasks completed;
- tests/build/typecheck commands actually run and outcomes;
- migrations introduced;
- user-visible changes;
- remaining risks;
- exact next phase dependency.

## Initial execution order

Start with:

1. [`00-foundation.md`](./00-foundation.md)
2. [`01-catalog-v2.md`](./01-catalog-v2.md)

Do not start broad website redesign or extension feature work before these contracts exist.
