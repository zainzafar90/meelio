# Focus Workflow Intelligence Design

## Goal

Make the focus experience smarter about what the user should do next by improving start, resume, switch, and active-task behavior without bloating the shell.

## Problems To Solve

- The current CTA is derived mostly from timer state and task count.
- The active focus task is inferred from the first incomplete task, which is too passive.
- Starting focus does not clearly encode whether the user is resuming, starting fresh, or switching tasks.
- Completing a task during focus does not yet give the dashboard a strong next-step behavior.

## Desired Behavior

### Start

- If there is a selected active focus task, start focus for that task.
- If there are tasks but no selected active task, guide the user to choose or pin one.

### Resume

- If a focus timer is already running, the CTA should unambiguously resume/open that session.

### Switch

- If the user chooses a different task while another one is active, the dashboard should reflect that switch cleanly.

### Complete

- If the active task is completed, the dashboard should promote the next candidate and keep the next-step CTA sensible.

## Scope

- Contracts/core/application logic for richer focus action state
- Shared focus-dashboard behavior for task promotion and CTA handling
- Minimal UI copy adjustments where needed

## Non-Goals

- New backend APIs
- New task-management features
- Deep analytics

## Success Criteria

- CTA behavior feels intentional, not generic.
- Active task selection is explicit enough to support start/resume/switch.
- The dashboard answers “what should I focus on now?” more clearly.
