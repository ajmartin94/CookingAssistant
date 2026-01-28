---
name: triage
description: |
  Analyze a GitHub issue, gather missing context, determine type and size, and route
  to the correct workflow. Use this skill when: (1) picking up any issue to work on,
  (2) the user says "triage" or "let's work on #123", (3) an issue needs scoping before
  starting implementation.
---

# Triage

Analyze a GitHub issue, determine what it is and how big it is, then route to the
correct workflow. Every issue goes through triage before any other work begins.

## State Machine

```
new → gathering → assessed → routed
```

| State | Meaning |
|-------|---------|
| `new` | Issue exists, no triage started |
| `gathering` | Questions posted, awaiting user answers |
| `assessed` | Type and size determined, pending routing |
| `routed` | Workflow assigned and started |

## Process

### 1. Read the Issue

```bash
gh issue view <number> --json title,body,labels,comments
```

Check issue comments for existing triage state by looking for the HTML marker:

```
<!-- triage-state: <state> -->
```

- **No marker** → Start fresh (state: `new`)
- **`gathering`** → Look for user reply after the questions comment, continue
- **`assessed`** → Show assessment, confirm routing
- **`routed`** → Already done, show summary and next step

### 2. Gather Context (state: `new` → `gathering`)

Read the issue body and any existing comments. Then gather information from two sources:

#### From the codebase (do this yourself, don't ask the user):

- Search for files related to the issue (keywords, feature area)
- Check which layers have relevant code (backend, frontend, e2e)
- Check whether tests exist in the affected area
- Note any recent changes to related files (`git log --oneline -10 -- <paths>`)

#### From the user (use `AskUserQuestion`):

Ask these questions in a single round:

1. **Outcome**: "What user-visible outcome should this produce?"
   - Options vary by issue type, but always include "Not sure yet"

2. **Layers**: "Which layers does this touch?"
   - Backend only
   - Frontend only
   - Backend + Frontend
   - Full stack (Backend + Frontend + E2E behavior change)

3. **Breaking changes**: "Will this change existing behavior that users or tests depend on?"
   - No — purely additive
   - Yes — existing behavior changes
   - Not sure

4. **Scope clarity**: "Is the scope well-defined enough to start implementation?"
   - Yes — I know exactly what needs to happen
   - Mostly — a few details to figure out during planning
   - No — needs design exploration first

Post the questions and user's answers as an issue comment:

```markdown
<!-- triage-state: gathering -->
## Triage: Context

**Codebase analysis:**
- Related files: [files found]
- Existing tests: [yes/no, which files]
- Layers with code: [backend/frontend/e2e]

**User responses:**
1. Outcome: [answer]
2. Layers: [answer]
3. Breaking changes: [answer]
4. Scope clarity: [answer]
```

### 3. Assess (state: `gathering` → `assessed`)

Apply these heuristics to determine **type** and **size**:

#### Type Detection

| Signal | Type |
|--------|------|
| Issue label is `bug` | `bug` |
| Issue label is `idea` | `idea` |
| Issue label is `chore` | `chore` |
| Issue label is `enhancement` | `enhancement` |
| Issue label is `spike` | `spike` |
| No type label | Infer from content, confirm with user |

If no type label exists, suggest one and confirm with `AskUserQuestion`.

#### Size Heuristics

Score the issue:

| Factor | Score |
|--------|-------|
| Layers: 1 | +0 |
| Layers: 2 | +1 |
| Layers: 3+ | +2 |
| Breaking changes: yes | +1 |
| Breaking changes: not sure | +1 |
| Scope clarity: no | +1 |
| Existing tests in area: no | +1 |

| Total Score | Size |
|-------------|------|
| 0–1 | Small |
| 2–3 | Medium |
| 4+ | Large |

#### Workflow Routing

| Type + Size | Workflow |
|-------------|----------|
| `bug` (small) | `/tdd` (RED: reproduce → GREEN: fix) |
| `bug` (medium/large) | `/plan` → `/tdd` → `/migrate` → `/code-review` |
| `enhancement` (small) | `/plan` → `/tdd` → `/code-review` |
| `enhancement` (medium) | `/plan` → `/tdd` → `/migrate` → `/code-review` |
| `enhancement` (large) | `/brainstorm` → `/plan` → `/tdd` → `/migrate` → `/code-review` |
| `idea` (any) | `/brainstorm` → `/plan` → `/tdd` → `/migrate` → `/code-review` |
| `chore` (code-touching) | Direct execution → run existing tests → `/code-review` |
| `chore` (non-code) | Direct execution |
| `spike` (any) | Research → document findings → post to issue → close or spawn follow-up issues |

Post the assessment as an issue comment:

```markdown
<!-- triage-state: assessed -->
## Triage: Assessment

**Type:** enhancement
**Size:** Medium (score: 3)
**Score breakdown:**
- Layers: 2 (backend + frontend) → +1
- Breaking changes: yes → +1
- Scope clarity: mostly → +0
- Existing tests: yes → +0

**Workflow:**
`/plan` → `/tdd` → `/migrate` → `/code-review`

**Labels to add:** `ready`
```

Present the assessment to the user via `AskUserQuestion`:

"Based on analysis, this is a **medium enhancement** (score 3). Workflow: `/plan` → `/tdd` → `/migrate` → `/code-review`. Does this look right?"

- Looks right — proceed
- Should be smaller — explain why
- Should be larger — explain why
- Wrong type — it's actually a [bug/chore/idea/spike]

If the user adjusts, update the assessment and re-post.

### 4. Route (state: `assessed` → `routed`)

Once assessment is confirmed:

1. **Update labels** on the issue:

```bash
# Add type label if missing
gh issue edit <number> --add-label "<type>"

# Add ready label (issue is now scoped)
gh issue edit <number> --add-label "ready"

# Add size label
gh issue edit <number> --add-label "size:<S|M|L>"
```

2. **Post routing comment** to the issue:

```markdown
<!-- triage-state: routed -->
## Triage: Complete

**Type:** enhancement | **Size:** Medium | **Score:** 3

**Workflow:**
1. [ ] `/plan` — Structure implementation approach
2. [ ] `/tdd` — Execute via test-driven development
3. [ ] `/migrate` — Clean up broken tests
4. [ ] `/code-review` — Verify against plan and standards

**Next step:** Run `/plan` to begin.
```

3. **Create branch** (if not already on a feature branch):

```bash
git checkout -b <type>/<issue-number>-<slug> main
```

Branch naming:
- `fix/<number>-<slug>` for bugs
- `feature/<number>-<slug>` for enhancements and ideas
- `chore/<number>-<slug>` for chores
- `spike/<number>-<slug>` for spikes

4. **Begin the first workflow step** — invoke the next skill in the workflow.

## Spike Workflow

Spikes are different — they produce knowledge, not code.

### Spike Process

1. **Define the question**: What are we trying to learn?
2. **Research**: Read code, docs, test approaches, prototype if needed
3. **Document findings**: Post to issue as structured comment
4. **Recommend**: Create follow-up issues for actionable work
5. **Close**: Close the spike issue

### Spike Output Format

```markdown
## Spike: Findings

### Question
[What we were investigating]

### Findings
[What we learned]

### Recommendation
[What to do next]

### Follow-up Issues
- #XX — [description]
- #YY — [description]
```

## Principles

- **Every issue gets triaged** — no skipping straight to implementation
- **Process is the process** — triage determines workflow, user follows it
- **GitHub is the record** — all triage state lives in issue comments
- **Resumable** — can stop and restart triage across sessions
- **User provides context, heuristics provide structure** — neither alone is sufficient
- **Labels reflect state** — type, size, and `ready` are always current
