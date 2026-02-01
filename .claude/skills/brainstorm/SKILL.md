---
name: brainstorm
description: |
  Collaborative brainstorming to explore implementation options through critical Q&A.
  Use this skill when: (1) the user has a new feature idea to explore, (2) the user
  says "brainstorm" or "let's think about", (3) a feature needs design before planning,
  (4) /triage recommended brainstorming.
---

# Brainstorm

Explore implementation options through critical Q&A. Present choices, educate on
trade-offs, and challenge assumptions. Output is an unstructured record of the
conversation — not a structured plan.

**The vibe**: You are a knowledgeable colleague presenting options and explaining
the "why" behind each. Your job is to make the user informed enough to choose well,
not to make the choice for them. When existing project patterns exist, explain what
they are and whether this feature fits them or challenges them.

## Prerequisites

Verify `.plans/issue-{issue-number}/` exists (created by `/triage`). If it doesn't,
stop and tell the user: "Run `/triage` first — it sets up the workspace for this issue."

## Process

### 1. Understand Context

- Read the triage output (issue comments) to understand the articulated user need
- Check current project state (files, docs, recent changes, existing patterns)
- Identify which existing project conventions and patterns are relevant
- Note where this feature fits cleanly into existing patterns vs. where it pushes against them

### 2. Explore the Problem Space

- Use `AskUserQuestion` for all questions
- Limit to **one topic per round** but ask multiple questions on that topic for efficiency
- Prefer multiple-choice options when possible
- Focus on: purpose, constraints, success criteria, user experience
- **Challenge assumptions**: If the issue assumes a specific solution, ask whether the
  underlying need could be met differently

### 3. Present Options

For each major decision point, present 2-3 approaches:

- Explain what each option involves and why someone would choose it
- Call out how each option relates to existing project patterns
- Be honest about trade-offs (complexity, maintenance burden, flexibility)
- Lead with your recommendation and reasoning, but make all options clear
- Let the user pick or combine

**When existing patterns apply**: Explain the current pattern, whether this feature
fits it naturally, and what it would mean to deviate. Don't default to "follow the
pattern" without explaining why it's the right fit here.

**When no pattern exists**: Say so. Present options for establishing one.

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

Use this template:

```markdown
# Brainstorm: {feature name}

## Problem
[What we're solving and why — the user need from triage]

## Decisions Made
1. **{Topic}**: Chose {X} over {Y} because {reason}
2. **{Topic}**: Chose {X} because {reason}

## Design
### {Section 1}
[description — covers architecture, components, data flow as relevant]

### {Section 2}
[description]

## Constraints & Trade-offs
- [constraint or trade-off accepted]

## Review Findings
- [question]: [answer]

## Open Questions
- [any remaining, or "None"]
```

Post a summary comment on the GitHub issue:

```bash
gh issue comment <number> --body "$(cat <<'EOF'
## Brainstorm Complete

**Chosen approach:** [1-2 sentence summary of the selected approach]
**Key decisions:** [bullet list of major decisions made]
**Open questions:** [any remaining, or "None"]

Full brainstorm: `.plans/issue-<number>/brainstorm.md`
EOF
)"
```

**Stop here.** Do not proceed to implementation or planning. Tell the user:
"Brainstorm saved and posted to issue. Run `/plan` when ready to structure this for TDD execution."

## When to Skip Brainstorm

Brainstorm should only be skipped when ALL of these are true:
- The implementation path is obvious and well-understood
- The feature fits cleanly into existing project patterns without extending them
- There are no meaningful alternative approaches to consider
- The scope is small enough that `/plan` can handle any remaining decisions

If any of these don't hold, brainstorming adds value.

## Principles

- **Present options, don't prescribe** — educate the user so they choose well
- **Challenge the obvious** — the first solution isn't always the best one
- **One topic at a time** — don't mix concerns, but be efficient within a topic
- **YAGNI ruthlessly** — cut unnecessary scope
- **Respect existing patterns** — explain them, evaluate fit, don't ignore them
- **Incremental validation** — present in sections, confirm each
- **Fresh eyes before done** — always run the independent review
