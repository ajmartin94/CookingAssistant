---
name: brainstorm
description: |
  Collaborative brainstorming to turn ideas into designs through natural dialogue.
  Use this skill when: (1) the user has a new feature idea to explore, (2) the user
  says "brainstorm" or "let's think about", (3) a feature needs design before planning.
---

# Brainstorm

Turn ideas into designs through collaborative Q&A. Output is an unstructured record
of the conversation — not a structured plan.

## Prerequisites

Verify `.plans/issue-{issue-number}/` exists (created by `/triage`). If it doesn't,
stop and tell the user: "Run `/triage` first — it sets up the workspace for this issue."

## Process

### 1. Understand Context

Check current project state (files, docs, recent changes) to ground the conversation.

### 2. Explore the Idea

- Use `AskUserQuestion` for all questions
- Limit to **one topic per round** but ask multiple questions on that topic for efficiency
- Prefer multiple-choice options when possible
- Focus on: purpose, constraints, success criteria, user experience

### 3. Explore Approaches

- Propose 2-3 approaches with trade-offs
- Lead with your recommendation and reasoning
- Let the user pick or combine

### 4. Present the Design

- Present in sections (200-300 words each)
- Check after each section: "Does this look right?"
- Cover: architecture, components, data flow, error handling
- Go back and revise if something doesn't fit

### 5. Independent Review

When you believe the brainstorm is complete, spawn a review sub-agent
(Task tool, `subagent_type="general-purpose"`):

```
Review this brainstorm for gaps and unanswered questions:
[brainstorm content so far]

Based on the project context (read CLAUDE.md and relevant source files), identify:
- Ambiguities that would block implementation
- Edge cases not discussed
- Assumptions that should be validated
- Missing constraints or requirements

Return ONLY questions not already addressed in the brainstorm.
```

If the reviewer surfaces new questions, present them to the user:
"I did an independent review and have some additional followup:"

Use `AskUserQuestion` to present the reviewer's questions. Incorporate answers
into the brainstorm doc.

### 6. Check with User

After the independent review (and any follow-up questions), ask the user via
`AskUserQuestion`: "Are you happy with this brainstorm, or is there more to explore?"

- Done — save and move on
- More to explore — continue from step 2

The user decides when the brainstorm is complete, not a round limit or checklist.

### 7. Save

Save to: `.plans/issue-{issue-number}/brainstorm.md`

The brainstorm doc should capture:
- The problem / motivation
- Key decisions made during Q&A
- Chosen approach and why
- Design as presented and validated
- Reviewer questions and answers (if any)
- Open questions (if any remain)

**Stop here.** Do not proceed to implementation or planning. Tell the user:
"Brainstorm saved. Run `/plan` when ready to structure this for TDD execution."

## Principles

- **One topic at a time** — don't mix concerns, but be efficient within a topic
- **YAGNI ruthlessly** — cut unnecessary scope
- **Explore alternatives** — always propose options before settling
- **Incremental validation** — present in sections, confirm each
- **Fresh eyes before done** — always run the independent review
