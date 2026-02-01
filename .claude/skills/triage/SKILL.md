---
name: triage
description: |
  Analyze a GitHub issue, articulate the user needs it represents, determine type and
  size, and route to the correct workflow. Use this skill when: (1) picking up any issue
  to work on, (2) the user says "triage" or "let's work on #123", (3) an issue needs
  scoping before starting implementation.
---

# Triage

Articulate the user needs behind a GitHub issue, determine what it is and how big it is,
then route to the correct workflow. Every issue goes through triage before any other work
begins.

**Focus on needs, not solutions.** Triage answers "what is the user trying to accomplish
and what's missing/broken?" — not "how should we build it." Solutions come later in
`/brainstorm` and `/plan`.

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

#### Articulate user needs (do this yourself based on issue + codebase analysis):

Before asking the user anything, draft a **user needs statement**:

- Who is the user affected? (end user, developer, admin)
- What are they trying to accomplish?
- What's currently broken, missing, or friction-heavy?
- What does "done" look like from their perspective?

This becomes the foundation for all downstream work.

#### From the user (use `AskUserQuestion`):

Ask these questions in a single round:

1. **User needs check**: "Here's my understanding of the user need: [your draft]. Is this accurate?"
   - Yes — that captures it
   - Partially — [they'll clarify]
   - No — the real need is different

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

**User needs:**
[Final articulated user need after incorporating user feedback]

**Codebase analysis:**
- Related files: [files found]
- Existing tests: [yes/no, which files]
- Layers with code: [backend/frontend/e2e]

**User responses:**
1. User needs: [confirmed/adjusted]
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

#### Brainstorm Recommendation

After sizing, evaluate whether `/brainstorm` is warranted. Recommend brainstorm when ANY of:

- Size is Large
- The feature challenges or extends existing implementation patterns/guidance
- Scope clarity is "No" (needs design exploration)
- Multiple valid implementation approaches exist
- The issue introduces a new architectural concept to the project

**The user always decides** whether to follow the recommendation. Present it as part of the
assessment (step 3) with reasoning, not as a gate.

#### Workflow Routing

All code-touching work follows `/plan` → `/tdd` → `/review` as a unit. The plan's
complexity scales with the issue — a small bug gets a one-story plan, a large feature
gets multiple stories with journey checks.

| Type + Size | Workflow |
|-------------|----------|
| `bug` (any) | `/plan` → `/tdd` → `/review` |
| `enhancement` (small/medium) | `/plan` → `/tdd` → `/review` |
| `enhancement` (large) | `/brainstorm`* → `/plan` → `/tdd` → `/review` |
| `idea` (any) | `/brainstorm` → `/plan` → `/tdd` → `/review` |
| `chore` (code-touching) | `/plan` → `/tdd` → `/review` |
| `chore` (non-code) | Direct execution |
| `spike` (any) | Research → document findings → post to issue → close or spawn follow-up issues |

*`/brainstorm` is recommended for large enhancements but the user decides. See above.

Post the assessment as an issue comment:

```markdown
<!-- triage-state: assessed -->
## Triage: Assessment

**User need:** [one-sentence summary from step 2]

**Type:** enhancement
**Size:** Medium (score: 3)
**Score breakdown:**
- Layers: 2 (backend + frontend) → +1
- Breaking changes: yes → +1
- Scope clarity: mostly → +0
- Existing tests: yes → +0

**Brainstorm recommended:** Yes/No — [reason]

**Workflow:**
`/plan` → `/tdd` → `/review`

**Labels to add:** `ready`
```

Present the assessment to the user via `AskUserQuestion`:

"Based on analysis, this is a **medium enhancement** (score 3). Workflow: `/plan` → `/tdd` → `/review`. [If brainstorm recommended: I recommend running `/brainstorm` first because {reason}.] Does this look right?"

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

**User need:** [one-sentence summary]
**Type:** enhancement | **Size:** Medium | **Score:** 3

**Workflow:**
1. [ ] `/plan` — Structure user stories and acceptance criteria
2. [ ] `/tdd` — Execute via test-driven development
3. [ ] `/review` — Suite health + code review, final gate before PR

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

4. **Create `.plans/` folder** (if workflow includes `/brainstorm`, `/plan`, or `/tdd`):

```bash
mkdir -p .plans/issue-<number>
```

This folder is always at the repo root. Downstream skills expect it to exist.

5. **Begin the first workflow step** — invoke the next skill in the workflow.

## Principles

- **Every issue gets triaged** — no skipping straight to implementation
- **Process is the process** — triage determines workflow, user follows it
- **GitHub is the record** — all triage state lives in issue comments
- **Resumable** — can stop and restart triage across sessions
- **User provides context, heuristics provide structure** — neither alone is sufficient
- **Labels reflect state** — type, size, and `ready` are always current
