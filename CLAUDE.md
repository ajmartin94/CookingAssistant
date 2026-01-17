# CLAUDE.md - Cooking Assistant

**Project:** AI-powered cooking companion

---

## What Makes This Project Unique

- **Local-first**: Easy to run, privacy-focused, SQLite + JSON
- **AI-everywhere**: Manual, AI-assist, and full automation modes
- **LLM-friendly structures**: Data designed for AI consumption

---

## Development Principles

### 1. Beads-First
All work MUST be tracked in beads. Use the `/beads` skill for workflow guidance.

```bash
bd ready                              # Find available work
bd show <id>                          # Review details
bd update <id> --status=in_progress   # Claim it
```

### 2. TDD-Enforced
Features and bugs require tests before code. The `/beads` skill includes the RED-GREEN-REVIEW workflow.

### 3. Three Modes
Every AI feature should support:
- **Manual**: User has full control
- **AI Assist**: AI suggests, user approves
- **AI Automation**: End-to-end with minimal input

---

## Repository Structure

```
CookingAssistant/
├── backend/          # FastAPI (see backend/CLAUDE.md)
├── frontend/         # React/TypeScript (see frontend/CLAUDE.md)
├── docs/             # Documentation
├── .beads/           # Issue tracking
└── .claude/          # Skills and hooks
```

---

## Tech-Specific Guidance

- **Backend**: See [backend/CLAUDE.md](backend/CLAUDE.md) for Python/FastAPI conventions
- **Frontend**: See [frontend/CLAUDE.md](frontend/CLAUDE.md) for React/TypeScript conventions

---

## Session Close Protocol

Before ending any session:

```bash
git status              # Check what changed
git add <files>         # Stage changes
bd sync --from-main     # Pull beads updates
git commit -m "..."     # Commit with conventional message
```

**Rule**: Every `bd close` must be followed immediately by a `git commit`.
