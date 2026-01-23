# Context Management Guide

## Overview

This document defines the three categories of context used in development workflows, their purposes, boundaries, and management rules. These categories apply equally to human developers and coding agents.

---

## Context Categories

| Category | Lifespan | Location | Contains | Does NOT Contain |
|----------|----------|----------|----------|------------------|
| Durable Context | Indefinite | `docs/`, `AGENTS.md`, `CLAUDE.md` | Standards, conventions, architecture | Active tasks, roadmaps, session state |
| Task Context | Task lifetime | Issue tracker, task management system | Work items, acceptance criteria, decision log | Completed work, architectural decisions |
| Session Context | Single session | Conversation, working memory | Immediate reasoning, exploration | Anything that must survive session end |
| Handoff Artifact | Task lifetime | Attached to task | Session-end status, recommendations | Permanent decisions (those graduate) |

---

## Durable Context

### Definition

Durable Context is the stable, version-controlled body of knowledge about how this codebase works. It represents **decided truth**—conventions, standards, architecture, and instructions that apply regardless of what task is currently active.

### Characteristics

- **Stable**: Changes only through deliberate process (see Architecture Decision Workflow)
- **Universal**: Applies to all tasks, all developers, all sessions
- **Declarative**: States what IS, not what we're DOING
- **Version-controlled**: Lives in git, changes are trackable

### Locations

| Location | Purpose |
|----------|---------|
| `docs/` | Project documentation, guides |
| `CLAUDE.md` (root) | Agent-specific instructions for the entire repository |
| `*/CLAUDE.md` (subdirectories) | Agent-specific instructions scoped to that directory |

### What Belongs in Durable Context

- Installation and setup instructions
- Coding conventions and style guides
- Testing standards and patterns
- Architecture descriptions
- API documentation
- Agent behavioral rules and constraints
- Directory structure explanations
- Integration patterns

### What Does NOT Belong in Durable Context

- Current sprint goals
- Active task lists or backlogs
- Work in progress
- "Recently we decided..." (use ADRs instead)
- Session notes or scratch work
- Development roadmaps or future plans
- Individual developer preferences

### Example: Good vs Bad

**Good** (belongs in `docs/TESTING.md`):
```markdown
## Unit Test Conventions

Unit tests are placed in `__tests__/` directories adjacent to the source files they test.

Test files are named `{source-file}.test.ts`.

Use the factory pattern for test data. Factories are located in `tests/factories/`.
```

**Bad** (does NOT belong):
```markdown
## Current Testing Work

We're currently migrating from Jest to Vitest. See issue #234.

TODO: Update the auth tests after Sarah's PR merges.
```

### Management Rules

1. **Changes require process**: Durable Context changes should flow through the Architecture Decision Workflow (or a lighter process for minor corrections)
2. **No temporal language**: Avoid "currently", "recently", "soon", "TODO"
3. **No task references**: No issue numbers, PR references, or sprint mentions in the body text (ADRs may reference their triggering issue)
4. **Agent instructions are constraints**: AGENTS.md describes what agents MUST or MUST NOT do, not what they're working on

---

## Task Context

### Definition

Task Context is the information needed to complete a specific unit of work. It has a defined start (task creation) and end (task completion). It represents **active work**—what we're trying to accomplish right now and the criteria for success.

### Characteristics

- **Scoped**: Applies to one task, not the whole codebase
- **Temporal**: Has a start and end, gets completed or abandoned
- **Actionable**: Describes work to be done, not eternal truths
- **Tracked**: Lives in a system designed for work management

### What Task Context Must Provide

For a developer (human or agent) to execute a task effectively, Task Context must answer:

| Question | What This Enables |
|----------|-------------------|
| What is the goal? | Understanding success criteria |
| What is the scope? | Knowing boundaries of the work |
| What are the acceptance criteria? | Knowing when done |
| What files/areas are involved? | Focusing attention |
| What dependencies exist? | Sequencing work correctly |
| What decisions have been made? | Avoiding re-litigation |
| What is out of scope? | Preventing scope creep |

### Task Context Requirements

A well-formed task provides:

1. **Clear objective**: One sentence describing what "done" looks like
2. **Acceptance criteria**: Testable conditions for completion
3. **Scope boundaries**: Explicit in-scope and out-of-scope lists
4. **Context links**: References to relevant Durable Context (not duplicated content)
5. **Decision log**: Decisions made during task execution (appended as work progresses)

### Task Context Template (Reference)

```markdown
# Task: [Title]

## Objective
[One sentence: what does "done" look like?]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Scope
**In scope**:
- [Item 1]
- [Item 2]

**Out of scope**:
- [Item 1]
- [Item 2]

## Relevant Documentation
- [Link to relevant doc in docs/]
- [Link to relevant AGENTS.md section]

## Decision Log
[Append decisions as they're made during task execution]

| Date | Decision | Rationale |
|------|----------|-----------|
| | | |
```

### What Does NOT Belong in Task Context

- Architectural decisions (these graduate to ADRs if significant)
- Conventions that apply beyond this task (belongs in Durable Context)
- Session-specific reasoning or exploration (stays in Session Context)

### Relationship to Agile Processes

Task Context aligns with standard Agile artifacts:

| Agile Artifact | Task Context Element |
|----------------|---------------------|
| User Story | Objective |
| Acceptance Criteria | Acceptance Criteria |
| Definition of Done | Acceptance Criteria + Scope |
| Sprint Backlog | Collection of Task Contexts |
| Task Board | Task Context status tracking |

### Management Rules

1. **One task, one context**: Each task has its own isolated context
2. **No pollution**: Completing a task should not leave residue in Durable Context
3. **Decisions may graduate**: Significant decisions made during a task may trigger the ADR process
4. **Tools are not prescribed**: The specific tool (GitHub Issues, Jira, Linear, etc.) is an implementation decision

---

## Session Context

### Definition

Session Context is the ephemeral working memory of a single development session. It exists only during active work and is not expected to survive session end.

### Characteristics

- **Ephemeral**: Dies when session ends
- **Unstructured**: Free-form reasoning, exploration, trial and error
- **Private**: Belongs to the session executor, not the project

### What Happens in Session Context

- Reading and understanding code
- Exploring approaches before committing
- Debugging and investigation
- Drafting changes before finalizing
- Reasoning through problems
- False starts and abandoned approaches

### Session End: Explicit Handoff Artifact

At session end, the executor (human or agent) produces a structured handoff note. This artifact captures what matters from the session without polluting Task Context or requiring cleanup.

**Why this approach**:
- Forces reflection on what's valuable vs. noise
- Clean separation from Task Context
- Enables async collaboration and task handoff
- Provides safety net for interrupted sessions
- Handoff artifacts are disposable once task completes

### Handoff Artifact Template

```markdown
# Session Handoff: [Task Reference]

## Session Metadata
- **Date**: YYYY-MM-DD
- **Executor**: [Name or "Agent"]
- **Duration**: [Approximate]
- **Session Goal**: [What you were trying to accomplish this session]

## Status at Session End
[One paragraph: Where did you leave off? What state is the work in?]

## What Was Accomplished
- [Concrete outcome 1]
- [Concrete outcome 2]

## What Was Attempted but Not Completed
- [Item 1]: [Why not completed, what's blocking]
- [Item 2]: [Why not completed, what's blocking]

## Decisions Made
[Decisions that should be recorded but don't rise to ADR level]

| Decision | Rationale |
|----------|-----------|
| [Decision 1] | [Why] |
| [Decision 2] | [Why] |

## Open Questions
- [Question 1]
- [Question 2]

## Recommendations for Next Session
[What should the next executor do first? Any warnings or suggestions?]

## Graduation Candidates
[Insights that may need to move to Task Context or trigger ADR process]

- [ ] [Item]: → Task Context / ADR Evaluation / Neither
```

### Handoff Artifact Location

Handoff artifacts are stored with the task, not in the repository. The specific location depends on task management tooling:
- GitHub Issues: Comment on the issue
- External tracker: Attached to task record
- File-based system: `{task-id}/handoffs/YYYY-MM-DD.md`

### Handoff Artifact Lifecycle

1. **Created**: At session end (required)
2. **Consumed**: By next session executor (human or agent)
3. **Archived or Deleted**: When task completes

Handoff artifacts do not persist beyond task completion. Any valuable content should graduate to Task Context decision log or trigger ADR evaluation before task closes.

### The Graduation Question

Session Context exists in a processing zone. Valuable insights discovered during a session must either:

1. **Graduate to Task Context**: If it's a decision or note relevant to the current task → Add to Task Context decision log
2. **Graduate to Durable Context**: If it's a convention or architecture discovery → Trigger ADR process (Step 1: Gather Evidence)
3. **Carry forward via Handoff**: If it's relevant to continuing work → Include in Handoff Artifact
4. **Disappear**: If it was just working memory with no lasting value → Let it go

---

## Context Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  SESSION CONTEXT (ephemeral)                                        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Reading, exploring, debugging, drafting, reasoning...       │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│                             ↓                                       │
│                    SESSION END                                      │
│                             │                                       │
│              ┌──────────────┼──────────────────┐                   │
│              ↓              ↓                  ↓                    │
│         [disappear]   [include in         [flag for                │
│                        Handoff]            graduation]             │
│                             │                  │                    │
└─────────────────────────────┼──────────────────┼────────────────────┘
                              │                  │
                              ↓                  │
┌─────────────────────────────────────┐         │
│  HANDOFF ARTIFACT (task lifetime)   │         │
│                                     │         │
│  - Status at session end            │         │
│  - Decisions made                   │         │
│  - Open questions                   │         │
│  - Recommendations                  │         │
│  - Graduation candidates ───────────┼─────────┤
│                                     │         │
│  [Deleted when task completes]      │         │
└─────────────────────────────────────┘         │
                                                │
                              ┌─────────────────┴─────────────────┐
                              ↓                                   ↓
┌─────────────────────────────────────┐  ┌─────────────────────────────┐
│  TASK CONTEXT (task lifetime)       │  │  ADR PROCESS                │
│                                     │  │                             │
│  - Decision log updated             │  │  Step 1: Gather Evidence    │
│  - Scope refined                    │  │  Gate 1: Docs change needed?│
│                                     │  │  Step 2: Draft AD           │
│                                     │  │  ...                        │
└─────────────────────────────────────┘  └──────────────┬──────────────┘
                                                        │
                                                        ↓
                                         ┌─────────────────────────────┐
                                         │  DURABLE CONTEXT            │
                                         │                             │
                                         │  docs/, AGENTS.md updated   │
                                         │  via completed ADR          │
                                         └─────────────────────────────┘
```

---

## Rules Summary

### Durable Context Rules

1. No temporal language (currently, recently, TODO)
2. No task references in body text
3. Changes require ADR process (or documented exception for typo fixes)
4. Agent instructions are constraints, not task assignments

### Task Context Rules

1. One task, one isolated context
2. Must include: objective, acceptance criteria, scope
3. Decisions made during task go in decision log
4. Significant decisions trigger ADR evaluation
5. Completing a task leaves no residue in Durable Context

### Session Context Rules

1. Sessions end with a Handoff Artifact (required)
2. Handoff Artifacts are disposable—deleted when task completes
3. Valuable insights must graduate before task closes
4. Session Context never directly modifies Durable Context

---

## Appendix: Context Category Decision Tree

When you have information and need to decide where it belongs:

```
Is this about how we do things in general?
├── YES → Is it currently documented?
│         ├── YES → Does it need to change?
│         │         ├── YES → Trigger ADR process
│         │         └── NO → No action needed
│         └── NO → Trigger ADR process (new documentation)
└── NO → Is this about the current task?
         ├── YES → Is this a decision that affects the task outcome?
         │         ├── YES → Add to Task Context decision log
         │         └── NO → Include in Handoff Artifact
         └── NO → Is this needed after this session?
                  ├── YES → Include in Handoff Artifact, flag for graduation review
                  └── NO → Leave in Session Context (let it disappear)
```
