# CLAUDE.md - AI Assistant Development Guide

**Last Updated:** 2026-01-14
**Repository:** Cooking Assistant
**Project Status:** Early Development (Phase 1 Complete)

This document provides high-level guidance for AI assistants working on the Cooking Assistant codebase. For detailed information specific to each subsystem, see the CLAUDE.md files in subdirectories:

- **[backend/CLAUDE.md](backend/CLAUDE.md)** - Backend development standards, Python conventions, testing strategies
- **[frontend/CLAUDE.md](frontend/CLAUDE.md)** - Frontend development standards, TypeScript/React conventions, component testing

---

## 🎯 Project Overview

**Cooking Assistant** is an AI-powered cooking companion designed to help users plan, shop, and cook with ease. The project emphasizes:

- **Local-first development** → easy to run, privacy-focused
- **AI-everywhere approach** → manual, AI-assist, and full automation modes
- **Progressive enhancement** → start simple, scale when needed
- **LLM-friendly data structures** → JSON/SQLite for easy AI integration

### Key Features (Planned)
- Recipe management with AI suggestions
- Meal planning and smart grocery lists
- Interactive step-by-step cooking mode
- Voice-assisted guidance
- Calendar and smart home integrations

---

## 📁 Repository Structure

```
CookingAssistant/
├── backend/                    # FastAPI backend (see backend/CLAUDE.md)
├── frontend/                   # React frontend (see frontend/CLAUDE.md)
├── docs/                       # Documentation (see docs/CLAUDE.md)
├── scripts/                    # Utility scripts
├── .github/                    # GitHub Actions workflows
├── CLAUDE.md                   # This file - high-level guidance
├── README.md                   # Project overview and setup
├── LICENSE
└── .gitignore
```

## 🔄 Development Workflow

### Beads-First Development

**CRITICAL: All work MUST be tracked in beads.** Use the `beads` skill for issue management.

Before starting ANY task:
1. Check for existing issue: `bd ready` or `bd list --status=open`
2. Create issue if none exists (with `--design`, `--acceptance`, `--notes` for rich context)
3. Claim work: `bd update <id> --status=in_progress`

**Never do work outside of a beads issue.** This ensures:
- Persistent context across sessions
- Clear audit trail of decisions
- Discoverable work for any contributor

### Standard Workflow

1. **Create a Branch** - Follow Git conventions below

2. **Claim or Create Issue**
   ```bash
   bd ready                                    # Find available work
   bd create --title="..." --type=feature \   # Or create new issue
     --design="Implementation plan..." \
     --acceptance="Testing criteria..."
   bd update <id> --status=in_progress        # Claim it
   ```

3. **Test-Driven Development Loop**
   - Write tests first
   - Implement to pass tests
   - Update `--notes` with session discoveries

4. **Complete Work - COMMIT AFTER EVERY CLOSURE**
   ```bash
   # Close the bead
   bd close <id> --reason="Summary of what was done"

   # MANDATORY: Commit IMMEDIATELY after closing
   git add .
   git commit -m "type(scope): description

   Closes: <id>

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

   # Sync beads state
   bd sync --from-main
   ```

> **MANDATORY: Commit After Every Bead Closure**
>
> Work is NOT complete until both:
> 1. `bd close <id>` succeeds
> 2. `git commit` captures the closure
>
> Never close multiple beads without committing between them.
> Never end a session with uncommitted bead closures.
> Each `bd close` = one `git commit`.


## 🔀 Git Conventions

### Branch Naming
- `main` - production-ready code
- `develop` - integration branch for features
- `feature/description` - new features
- `fix/description` - bug fixes
- `docs/description` - documentation updates
- `refactor/description` - code refactoring
- `test/description` - test additions/updates

### Commit Messages

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(recipes): add recipe import from URL functionality
fix(planning): correct grocery list deduplication logic
docs: update API documentation for cooking endpoints
refactor(ai): simplify prompt construction for recipe generation
test(auth): add comprehensive authentication service tests
```

---

## 🤖 AI Integration Principles

### General Guidelines

1. **LLM-Friendly Data Structures:**
   - Store recipes, instructions, and metadata in structured JSON
   - Use clear, descriptive field names
   - Include context in prompts (user preferences, dietary restrictions)

2. **Three Modes of Operation:**
   - **Manual Mode:** User has full control, no AI suggestions
   - **AI Assist:** AI provides suggestions, user approves
   - **AI Automation:** End-to-end workflows with minimal user input

3. **Prompt Engineering:**
   - Use system prompts to define AI behavior
   - Include examples (few-shot learning)
   - Validate AI outputs before saving
   - Handle errors gracefully

---

## 🚨 Important Principles for AI Assistants

### Do's ✅

- **Read existing code before modifying** - Understand patterns and conventions
- **Use type hints** - Python and TypeScript both benefit from types
- **Write tests** - Especially for business logic and AI features
- **Keep it simple** - Start with the simplest solution that works
- **Document complex logic** - Especially AI prompts and business rules
- **Follow the three-mode principle** - Manual, AI-assist, AI-automation
- **Validate AI outputs** - Never trust LLM responses blindly
- **Check subdirectory CLAUDE.md files** - They contain specific guidance for each area

### Don'ts ❌

- **Don't over-engineer** - Build what's needed now, not what might be needed
- **Don't skip error handling** - Especially for AI features and external APIs
- **Don't hardcode values** - Use configuration files
- **Don't ignore security** - Validate inputs, sanitize outputs, use proper auth
- **Don't commit secrets** - Use environment variables
- **Don't break existing tests** - Fix or update them appropriately
- **Don't mix concerns** - Keep business logic separate from API routes
- **Don't skip reading subdirectory guides** - Context-specific advice is there for a reason

### Security Considerations

- **Input Validation:** Always validate and sanitize user inputs
- **SQL Injection:** Use ORM parameterized queries
- **XSS Prevention:** Sanitize data before rendering in frontend
- **Authentication:** Implement proper user authentication (JWT recommended)
- **Authorization:** Check user permissions before allowing actions
- **Rate Limiting:** Protect API endpoints from abuse
- **Secrets Management:** Never commit API keys or passwords
- **CORS:** Configure properly for frontend-backend communication

---

## 📚 Additional Resources

### Documentation to Reference

- **Project README:** [README.md](README.md)
- **Archived Implementation Plan:** [docs/archive/master_implementation_plan_v1.md](docs/archive/master_implementation_plan_v1.md) (historical reference)

### Issue Tracking with Beads

This project uses [beads](https://github.com/steveyegge/beads) for issue tracking. **Use the `beads` skill** for detailed workflow guidance.

**Key commands:**
- `bd ready` - Find available work
- `bd create --title="..." --type=feature --design="..." --acceptance="..."` - Create with rich context
- `bd update <id> --status=in_progress` - Claim work
- `bd close <id> --reason="..."` - Complete with summary

**Rich context fields** (store plans directly in issues):
- `--design` - Implementation plans
- `--acceptance` - Testing criteria / Definition of Done
- `--notes` - Session discoveries, decisions, to-dos

**Issue Types:** `task`, `bug`, `feature`, `epic`
**Priorities:** P0 (critical) → P4 (backlog)

### Tech Stack Documentation
- **FastAPI:** https://fastapi.tiangolo.com/
- **React:** https://react.dev/
- **SQLAlchemy:** https://docs.sqlalchemy.org/
- **Pydantic:** https://docs.pydantic.dev/
- **Vite:** https://vitejs.dev/

### Design Patterns to Follow

- **Repository Pattern** - Separate data access from business logic
- **Service Layer Pattern** - Business logic in services, not controllers
- **Dependency Injection** - FastAPI's built-in DI for database sessions
- **Component Composition** - React component design
- **Hooks Pattern** - React custom hooks for reusable logic

---

## 🔄 Document Maintenance

The CLAUDE.md files in each subdirectory should be updated when:
- New conventions are established in that area
- Tech stack changes for that component
- New patterns are adopted
- Significant refactoring occurs

**Last reviewed:** 2026-01-14
**Next review recommended:** After Phase 2 completion

---

## 💡 Questions or Need Help?

This is a living documentation system:
1. Check the relevant subdirectory's CLAUDE.md first
2. Run `bd ready` to see current work items
3. Open an issue on GitHub if something is unclear
4. Submit a PR with proposed documentation improvements

Remember: The goal is to make it easy for both humans and AI assistants to contribute effectively to this project!
