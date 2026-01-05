# CLAUDE.md - AI Assistant Development Guide

**Last Updated:** 2026-01-03
**Repository:** Cooking Assistant
**Project Status:** Early Development (Phase 1 Complete)

This document provides high-level guidance for AI assistants working on the Cooking Assistant codebase. For detailed information specific to each subsystem, see the CLAUDE.md files in subdirectories:

- **[backend/CLAUDE.md](backend/CLAUDE.md)** - Backend development standards, Python conventions, testing strategies
- **[frontend/CLAUDE.md](frontend/CLAUDE.md)** - Frontend development standards, TypeScript/React conventions, component testing
- **[docs/CLAUDE.md](docs/CLAUDE.md)** - Documentation maintenance, active development management, archiving procedures

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

### We always start with making a clear plan and initiate the SDLC.

1. **Create a Branch**
   - Ensure you follow stated Git conventions
   - Semantically name the branch according to user request

2. **Make a plan**
   - Communicate with the user to understand what is being requested
   - Create an implementation_plan.md under docs/active_development

### From here, we work in a Test Driven Design loop to achieve the plan.

1. **Write Tests**
   - Coordinate with the user and create meaningful tests that will allow for clear Test Driven Development

2. **Write Code**
   - Develop according to the active implementation plan

3. **Test Your Code**
   - Follow testing standards in subdirectory instruction files
   - Move on once tests pass
   - Save testing results to the implementation_plan.md file

4. **Update Docs**
   - Update README.md with anything relevant for the README level
   - Update the implementation plan(s) in the docs folder

5. **Commit and Push**
   - Commit changes and push to remote repo


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
- **Master Implementation Plan:** [docs/master_implementation_plan.md](docs/master_implementation_plan.md)
- **Active Development Plans:** [docs/active_development/](docs/active_development/)

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

**Last reviewed:** 2026-01-03
**Next review recommended:** After Phase 2 completion

---

## 💡 Questions or Need Help?

This is a living documentation system:
1. Check the relevant subdirectory's CLAUDE.md first
2. Review [docs/active_development/implementation_plan.md](docs/active_development/implementation_plan.md) for current work
3. Open an issue on GitHub if something is unclear
4. Submit a PR with proposed documentation improvements

Remember: The goal is to make it easy for both humans and AI assistants to contribute effectively to this project!
