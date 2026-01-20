# CLAUDE.md - AI Assistant Development Guide

**Last Updated:** 2026-01-01
**Repository:** Cooking Assistant
**Project Status:** Early Development (Planning Phase)

This document provides comprehensive guidance for AI assistants (like Claude) working on the Cooking Assistant codebase. It covers project structure, conventions, workflows, and key principles to follow.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Current Repository State](#current-repository-state)
3. [Planned Architecture](#planned-architecture)
4. [Development Workflow](#development-workflow)
5. [Code Organization](#code-organization)
6. [Coding Standards](#coding-standards)
7. [Git Conventions](#git-conventions)
8. [AI Integration Principles](#ai-integration-principles)
9. [Testing Strategy](#testing-strategy)
10. [Common Tasks](#common-tasks)

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

## 📁 Current Repository State

**Status:** The repository is in its initial planning phase. Currently contains:

```
CookingAssistant/
├── .git/
├── .gitignore          # Python-focused gitignore
├── LICENSE             # MIT License
├── README.md           # Comprehensive project documentation
└── CLAUDE.md           # This file
```

**What's Missing (To Be Built):**
- `/backend/` - FastAPI application
- `/frontend/` - React + Vite application
- `/docs/` - Additional documentation
- `/tests/` - Test suites
- Database schema and migrations
- CI/CD configuration

---

## 🏗️ Planned Architecture

### Tech Stack

#### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** SQLite (local) → PostgreSQL (production)
- **ORM:** SQLAlchemy or Tortoise ORM
- **AI Integration:**
  - Local: Ollama
  - Cloud: OpenAI API, Anthropic API
- **API Design:** RESTful with OpenAPI/Swagger docs

#### Frontend
- **Framework:** React 18+
- **Build Tool:** Vite
- **State Management:** React Context or Zustand
- **Styling:** TailwindCSS or Material-UI
- **Type Safety:** TypeScript (recommended)

#### Future Enhancements
- Vector search: Chroma/Weaviate
- Mobile: PWA → Capacitor → React Native
- Cloud deployment: Supabase, Railway, or Render

### Directory Structure (Planned)

```
CookingAssistant/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry
│   │   ├── config.py            # Configuration management
│   │   ├── database.py          # Database connection setup
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas (API contracts)
│   │   ├── api/                 # API route handlers
│   │   │   ├── recipes.py
│   │   │   ├── planning.py
│   │   │   ├── cooking.py
│   │   │   └── ai.py
│   │   ├── services/            # Business logic
│   │   ├── ai/                  # AI integration modules
│   │   └── utils/               # Helper functions
│   ├── migrations/              # Database migrations (Alembic)
│   ├── tests/                   # Backend tests
│   ├── requirements.txt         # Python dependencies
│   └── pyproject.toml           # Project metadata (optional)
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── recipes/
│   │   │   ├── planning/
│   │   │   ├── cooking/
│   │   │   └── common/
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API client functions
│   │   ├── utils/               # Helper functions
│   │   ├── contexts/            # React Context providers
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docs/                        # Additional documentation
├── scripts/                     # Utility scripts
├── .github/                     # GitHub Actions workflows
├── .gitignore
├── LICENSE
├── README.md
└── CLAUDE.md
```

---

## 🔄 Development Workflow

### Initial Setup (When Code Exists)

1. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database Setup:**
   ```bash
   cd backend
   alembic upgrade head  # Run migrations
   python scripts/seed_data.py  # Optional: seed test data
   ```

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes following coding standards**

3. **Test your changes:**
   ```bash
   # Backend
   pytest

   # Frontend
   npm test
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add feature: brief description"
   git push origin feature/your-feature-name
   ```

---

## 📂 Code Organization

### Backend Organization Principles

- **Models** (`models/`): SQLAlchemy models, database schema definitions
- **Schemas** (`schemas/`): Pydantic models for request/response validation
- **API Routes** (`api/`): FastAPI endpoint definitions
- **Services** (`services/`): Business logic, keep controllers thin
- **AI Integration** (`ai/`): LLM prompting, vector search, embeddings

### Frontend Organization Principles

- **Components**: Small, reusable, single-responsibility
- **Pages**: Route-level components that compose smaller components
- **Hooks**: Custom hooks for shared stateful logic
- **Services**: API client functions, external integrations
- **Utils**: Pure functions, helpers, formatters

---

## 💻 Coding Standards

### Python (Backend)

**Style Guide:**
- Follow PEP 8
- Use type hints for all functions
- Maximum line length: 100 characters
- Use `black` for formatting
- Use `ruff` for linting

**Example:**
```python
from typing import List, Optional
from sqlalchemy.orm import Session
from .models import Recipe
from .schemas import RecipeCreate, RecipeResponse

async def create_recipe(
    db: Session,
    recipe: RecipeCreate,
    user_id: int
) -> RecipeResponse:
    """
    Create a new recipe in the database.

    Args:
        db: Database session
        recipe: Recipe data from request
        user_id: ID of the user creating the recipe

    Returns:
        Created recipe with generated ID
    """
    db_recipe = Recipe(**recipe.dict(), owner_id=user_id)
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return RecipeResponse.from_orm(db_recipe)
```

**Key Principles:**
- Async/await for I/O operations
- Dependency injection for database sessions
- Pydantic for data validation
- Proper error handling with HTTPException
- Keep business logic in services, not routes

### TypeScript/React (Frontend)

**Style Guide:**
- Use TypeScript for type safety
- Use functional components with hooks
- Follow React best practices (hooks rules, component composition)
- Use descriptive variable names
- Maximum line length: 100 characters

**Example:**
```typescript
import { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { fetchRecipes } from '../services/api';

interface RecipeListProps {
  categoryId?: string;
}

export const RecipeList: React.FC<RecipeListProps> = ({ categoryId }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        const data = await fetchRecipes(categoryId);
        setRecipes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [categoryId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="recipe-list">
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
};
```

**Key Principles:**
- Proper TypeScript types for all props and state
- Error boundaries for component error handling
- Accessibility attributes (ARIA labels, semantic HTML)
- Performance optimization (useMemo, useCallback when needed)
- Clean component lifecycle management

### Database Schema Design

**Principles:**
- Use UUIDs for primary keys (better for distributed systems)
- Include `created_at` and `updated_at` timestamps
- Use proper foreign key constraints
- Index frequently queried columns
- Store structured data (like ingredients) as JSON when appropriate

**Example Recipe Model:**
```python
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    ingredients = Column(JSON, nullable=False)  # [{"name": "flour", "amount": "2 cups"}]
    instructions = Column(JSON, nullable=False)  # ["Step 1", "Step 2"]
    prep_time_minutes = Column(Integer)
    cook_time_minutes = Column(Integer)
    servings = Column(Integer, default=4)
    cuisine_type = Column(String(100), index=True)
    dietary_tags = Column(JSON)  # ["vegetarian", "gluten-free"]
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="recipes")
```

---

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
```

### Pull Request Guidelines

1. **Title:** Clear, descriptive summary
2. **Description:** Include:
   - What changed and why
   - Testing performed
   - Screenshots (for UI changes)
   - Breaking changes (if any)
3. **Link to issues:** Reference related issues
4. **Request reviews:** Tag appropriate reviewers

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

### AI Module Structure

```python
# backend/app/ai/prompts.py
RECIPE_GENERATION_PROMPT = """
You are a professional chef assistant. Generate a recipe based on:

Ingredients: {ingredients}
Cuisine: {cuisine}
Dietary restrictions: {dietary_restrictions}
Skill level: {skill_level}

Return a JSON object with:
- title
- description
- ingredients (array of {name, amount, unit})
- instructions (array of steps)
- prep_time_minutes
- cook_time_minutes
- servings
"""

# backend/app/ai/client.py
class AIClient:
    def __init__(self, provider: str = "openai"):
        self.provider = provider
        # Initialize client based on provider

    async def generate_recipe(
        self,
        ingredients: List[str],
        cuisine: Optional[str] = None,
        dietary_restrictions: Optional[List[str]] = None
    ) -> Recipe:
        prompt = RECIPE_GENERATION_PROMPT.format(
            ingredients=", ".join(ingredients),
            cuisine=cuisine or "any",
            dietary_restrictions=dietary_restrictions or [],
            skill_level="intermediate"
        )
        response = await self.complete(prompt)
        return self.parse_recipe(response)
```

---

## 🧪 Testing Strategy

### Backend Testing

**Structure:**
```
tests/
├── unit/              # Unit tests for individual functions
├── integration/       # Tests involving database, external APIs
├── e2e/              # End-to-end API tests
└── conftest.py       # Shared fixtures
```

**Tools:**
- `pytest` - Test framework
- `pytest-asyncio` - Async test support
- `httpx` - API client for testing
- `faker` - Generate test data

**Example:**
```python
import pytest
from app.services.recipes import create_recipe
from app.schemas import RecipeCreate

@pytest.mark.asyncio
async def test_create_recipe(db_session, test_user):
    recipe_data = RecipeCreate(
        title="Test Recipe",
        ingredients=[{"name": "flour", "amount": "2 cups"}],
        instructions=["Mix ingredients", "Bake at 350°F"]
    )

    recipe = await create_recipe(db_session, recipe_data, test_user.id)

    assert recipe.title == "Test Recipe"
    assert len(recipe.ingredients) == 1
    assert recipe.owner_id == test_user.id
```

### Frontend Testing

**Tools:**
- `Vitest` - Test runner
- `React Testing Library` - Component testing
- `MSW` - Mock Service Worker for API mocking

**Example:**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { RecipeList } from './RecipeList';
import { server } from '../mocks/server';

describe('RecipeList', () => {
  it('displays recipes after loading', async () => {
    render(<RecipeList />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
    });
  });
});
```

---

## 🛠️ Common Tasks

### For AI Assistants Working on This Project

#### 1. Adding a New API Endpoint

1. Define Pydantic schema in `backend/app/schemas/`
2. Create database model in `backend/app/models/` (if needed)
3. Add service function in `backend/app/services/`
4. Create route handler in `backend/app/api/`
5. Add tests in `backend/tests/`
6. Update API documentation

#### 2. Adding a New Frontend Component

1. Create component in appropriate `frontend/src/components/` subdirectory
2. Define TypeScript interfaces for props
3. Add tests in `ComponentName.test.tsx`
4. Update parent component to use new component
5. Add to Storybook (if implemented)

#### 3. Database Schema Changes

1. Create migration: `alembic revision --autogenerate -m "description"`
2. Review generated migration file
3. Test migration: `alembic upgrade head`
4. Update model classes if needed
5. Update affected services and tests

#### 4. Adding AI Features

1. Define prompt template in `backend/app/ai/prompts.py`
2. Add function to `backend/app/ai/client.py`
3. Create service layer wrapper in `backend/app/services/ai.py`
4. Add API endpoint in `backend/app/api/ai.py`
5. Implement frontend integration
6. Add comprehensive tests (mock LLM responses)

#### 5. Initial Project Setup (Current Priority)

When setting up the project for the first time:

1. **Create backend structure:**
   ```bash
   mkdir -p backend/app/{models,schemas,api,services,ai,utils}
   mkdir -p backend/tests/{unit,integration,e2e}
   touch backend/requirements.txt
   touch backend/app/main.py
   ```

2. **Create frontend structure:**
   ```bash
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install
   ```

3. **Set up database:**
   - Create SQLite database file
   - Set up Alembic for migrations
   - Define initial schema

4. **Configure development environment:**
   - Create `.env` files for configuration
   - Set up code formatters (black, prettier)
   - Configure linters (ruff, eslint)

---

## 🚨 Important Notes for AI Assistants

### Do's ✅

- **Read existing code before modifying** - Understand patterns and conventions
- **Use type hints** - Python and TypeScript both benefit from types
- **Write tests** - Especially for business logic and AI features
- **Keep it simple** - Start with the simplest solution that works
- **Document complex logic** - Especially AI prompts and business rules
- **Follow the three-mode principle** - Manual, AI-assist, AI-automation
- **Validate AI outputs** - Never trust LLM responses blindly

### Don'ts ❌

- **Don't over-engineer** - Build what's needed now, not what might be needed
- **Don't skip error handling** - Especially for AI features and external APIs
- **Don't hardcode values** - Use configuration files
- **Don't ignore security** - Validate inputs, sanitize outputs, use proper auth
- **Don't commit secrets** - Use environment variables
- **Don't break existing tests** - Fix or update them appropriately
- **Don't mix concerns** - Keep business logic separate from API routes

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

### Project Roadmap Reference

Refer to README.md for the current roadmap:
1. Phase 1: Core recipe library
2. Phase 2: AI recipe builder
3. Phase 3: Meal planning + grocery lists
4. Phase 4: Grocery store optimization
5. Phase 5: Interactive cooking mode
6. Phase 6: Calendar & smart home integrations
7. Phase 7: Mobile app

---

## 🔄 Document Maintenance

This document should be updated when:
- Major architectural decisions are made
- New conventions are established
- Tech stack changes occur
- New AI integration patterns are added
- Project structure evolves significantly

**Last reviewed:** 2026-01-01
**Next review recommended:** After initial backend/frontend setup

---

## 💡 Questions or Suggestions?

This is a living document. If you find something unclear or have suggestions for improvements, please:
1. Open an issue on GitHub
2. Submit a PR with proposed changes
3. Discuss in team meetings

Remember: The goal is to make it easy for both humans and AI assistants to contribute effectively to this project!
