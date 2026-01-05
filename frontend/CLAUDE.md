# CLAUDE.md - Frontend Development Guide

**Last Updated:** 2026-01-03
**Focus:** React/TypeScript Frontend Development Standards

This guide covers frontend-specific conventions, coding standards, and procedures. For general project guidance, see [../CLAUDE.md](../CLAUDE.md).

---

## 📋 Table of Contents

1. [Frontend Project Structure](#frontend-project-structure)
2. [TypeScript/React Coding Standards](#typescriptreact-coding-standards)
3. [Code Organization](#code-organization)
4. [Component Patterns](#component-patterns)
5. [Testing Strategy](#testing-strategy)
6. [Common Frontend Tasks](#common-frontend-tasks)

---

## 📁 Frontend Project Structure

```
frontend/
├── public/                      # Static assets
│   └── index.html              # Main HTML file
├── src/
│   ├── components/             # Reusable React components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── recipes/
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── RecipeForm.tsx
│   │   │   └── RecipeList.tsx
│   │   ├── libraries/
│   │   │   ├── LibraryCard.tsx
│   │   │   └── LibraryForm.tsx
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Button.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── ...
│   ├── pages/                  # Page-level components
│   │   ├── LoginPage.tsx
│   │   ├── RecipesPage.tsx
│   │   ├── CreateRecipePage.tsx
│   │   ├── RecipeDetailPage.tsx
│   │   └── ...
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useRecipes.ts
│   │   └── ...
│   ├── services/               # API client functions
│   │   ├── api.ts              # Base API client config
│   │   ├── authApi.ts
│   │   ├── recipeApi.ts
│   │   └── libraryApi.ts
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ...
│   ├── types/                  # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── recipe.ts
│   │   └── ...
│   ├── utils/                  # Helper functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── ...
│   ├── test/                   # Test infrastructure
│   │   ├── setup.ts            # Vitest setup
│   │   ├── test-utils.tsx      # Custom render function
│   │   └── mocks/              # MSW mocks
│   │       ├── handlers.ts
│   │       ├── server.ts
│   │       └── data.ts
│   ├── App.tsx                 # Root app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── package.json
├── vite.config.ts              # Vite configuration
├── vitest.config.ts            # Vitest configuration
├── tsconfig.json               # TypeScript configuration
└── CLAUDE.md                   # This file
```

---

## 💻 TypeScript/React Coding Standards

### Style Guide

- **Use TypeScript** for all components and files
- **Functional components with hooks** (no class components)
- **Follow React best practices** (proper hook dependencies, no setState in render, etc.)
- **Line length max of 100 characters**
- **Use descriptive variable names**
- **Format code** with Prettier
- **Lint code** with ESLint

### Component Code Example

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Recipe, RecipeCreateDTO } from '../types/recipe';
import { recipeApi } from '../services/recipeApi';
import { useAuth } from '../hooks/useAuth';


interface RecipeFormProps {
  recipeId?: string;
  onSuccess?: (recipe: Recipe) => void;
  onCancel?: () => void;
}


/**
 * RecipeForm - Component for creating and editing recipes
 *
 * Features:
 * - Dynamic ingredient and instruction management
 * - Real-time form validation
 * - Image upload (placeholder for Phase 2)
 * - Optimistic UI updates
 */
export const RecipeForm: React.FC<RecipeFormProps> = ({
  recipeId,
  onSuccess,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<RecipeCreateDTO>({
    title: '',
    description: '',
    ingredients: [],
    instructions: [],
    prep_time_minutes: 0,
    cook_time_minutes: 0,
    servings: 4,
    cuisine_type: '',
    difficulty_level: 'medium',
    dietary_tags: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(!!recipeId);

  // Load existing recipe if editing
  useEffect(() => {
    if (!recipeId) return;

    const loadRecipe = async () => {
      try {
        const recipe = await recipeApi.getRecipe(recipeId);
        setFormData(recipe);
      } catch (error) {
        setErrors({ form: 'Failed to load recipe' });
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipe();
  }, [recipeId]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (formData.ingredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }
    if (formData.instructions.length === 0) {
      newErrors.instructions = 'At least one instruction is required';
    }
    if (formData.servings < 1) {
      newErrors.servings = 'Servings must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateForm() || !currentUser) {
        return;
      }

      setIsSubmitting(true);

      try {
        let recipe: Recipe;

        if (recipeId) {
          recipe = await recipeApi.updateRecipe(recipeId, formData);
        } else {
          recipe = await recipeApi.createRecipe(formData);
        }

        onSuccess?.(recipe);
      } catch (error) {
        setErrors({
          form: error instanceof Error ? error.message : 'Failed to save recipe',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, recipeId, currentUser, validateForm, onSuccess]
  );

  const handleIngredientAdd = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { name: '', amount: '', unit: '', notes: '' },
      ],
    }));
  }, []);

  const handleIngredientChange = useCallback(
    (index: number, field: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.map((ing, i) =>
          i === index ? { ...ing, [field]: value } : ing
        ),
      }));
    },
    []
  );

  const handleIngredientRemove = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  }, []);

  if (isLoading) {
    return <div className="loading">Loading recipe...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="recipe-form">
      {errors.form && (
        <div className="error-message" role="alert">
          {errors.form}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && <span id="title-error" className="error">{errors.title}</span>}
      </div>

      {/* Ingredients Section */}
      <div className="form-group">
        <label>Ingredients *</label>
        <div className="ingredients-list">
          {formData.ingredients.map((ing, index) => (
            <div key={index} className="ingredient-row">
              <input
                type="text"
                placeholder="Ingredient name"
                value={ing.name}
                onChange={e => handleIngredientChange(index, 'name', e.target.value)}
              />
              <input
                type="text"
                placeholder="Amount"
                value={ing.amount}
                onChange={e => handleIngredientChange(index, 'amount', e.target.value)}
              />
              <select
                value={ing.unit}
                onChange={e => handleIngredientChange(index, 'unit', e.target.value)}
              >
                <option value="">Select unit</option>
                <option value="cup">Cup(s)</option>
                <option value="tbsp">Tablespoon(s)</option>
                <option value="tsp">Teaspoon(s)</option>
                <option value="g">Gram(s)</option>
                <option value="ml">Milliliter(s)</option>
              </select>
              <button
                type="button"
                onClick={() => handleIngredientRemove(index)}
                className="remove-btn"
                aria-label={`Remove ${ing.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleIngredientAdd}
          className="add-btn"
        >
          + Add Ingredient
        </button>
        {errors.ingredients && (
          <span className="error">{errors.ingredients}</span>
        )}
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={isSubmitting}
          className="primary-btn"
        >
          {isSubmitting ? 'Saving...' : (recipeId ? 'Update' : 'Create')} Recipe
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="secondary-btn"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
```

### Key Principles

- **Type everything** - Props interfaces, return types, state types
- **Use hooks properly** - Respect dependencies, avoid infinite loops
- **Error boundaries** - Catch component errors gracefully
- **Accessibility** - ARIA labels, semantic HTML, keyboard navigation
- **Performance** - useMemo/useCallback for expensive operations
- **Clean up** - Return cleanup functions from useEffect
- **Component composition** - Small, single-responsibility components

---

## 📂 Code Organization

### Components (`src/components/`)

Small, reusable, single-responsibility components:

```typescript
// components/recipes/RecipeCard.tsx
import React from 'react';
import { Recipe } from '../../types/recipe';
import { getDifficultyColor, formatTime } from '../../utils/formatters';


interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}


export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onClick,
  onEdit,
  onDelete,
  isOwner = false,
}) => {
  return (
    <article
      className="recipe-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={e => e.key === 'Enter' && onClick?.()}
    >
      <h3>{recipe.title}</h3>
      <p className="description">{recipe.description}</p>

      <div className="metadata">
        <span className="cuisine">{recipe.cuisine_type}</span>
        <span
          className={`difficulty ${getDifficultyColor(recipe.difficulty_level)}`}
        >
          {recipe.difficulty_level}
        </span>
      </div>

      <div className="times">
        <span>{formatTime(recipe.prep_time_minutes)} prep</span>
        <span>{formatTime(recipe.cook_time_minutes)} cook</span>
        <span>{recipe.servings} servings</span>
      </div>

      {isOwner && (
        <div className="actions">
          <button onClick={() => onEdit?.(recipe.id)} className="icon-btn">
            Edit
          </button>
          <button onClick={() => onDelete?.(recipe.id)} className="icon-btn danger">
            Delete
          </button>
        </div>
      )}
    </article>
  );
};
```

### Hooks (`src/hooks/`)

Reusable stateful logic:

```typescript
// hooks/useRecipes.ts
import { useState, useEffect, useCallback } from 'react';
import { Recipe, RecipeCreateDTO } from '../types/recipe';
import { recipeApi } from '../services/recipeApi';


interface UseRecipesOptions {
  skip?: number;
  limit?: number;
  search?: string;
  cuisine?: string;
  difficulty?: string;
}


export const useRecipes = (options: UseRecipesOptions = {}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await recipeApi.getRecipes(options);
      setRecipes(data.recipes);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  return {
    recipes,
    total,
    isLoading,
    error,
    refetch: loadRecipes,
  };
};
```

### Services (`src/services/`)

API client functions (no React/hooks):

```typescript
// services/recipeApi.ts
import { Recipe, RecipeCreateDTO, RecipeUpdateDTO } from '../types/recipe';
import { api } from './api';


export const recipeApi = {
  async getRecipes(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    cuisine?: string;
    difficulty?: string;
  }): Promise<{ recipes: Recipe[]; total: number }> {
    const response = await api.get('/recipes', { params });
    return response.data;
  },

  async getRecipe(id: string): Promise<Recipe> {
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  },

  async createRecipe(data: RecipeCreateDTO): Promise<Recipe> {
    const response = await api.post('/recipes', data);
    return response.data;
  },

  async updateRecipe(id: string, data: RecipeUpdateDTO): Promise<Recipe> {
    const response = await api.patch(`/recipes/${id}`, data);
    return response.data;
  },

  async deleteRecipe(id: string): Promise<void> {
    await api.delete(`/recipes/${id}`);
  },
};
```

### Types (`src/types/`)

TypeScript type definitions:

```typescript
// types/recipe.ts
export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  notes?: string;
}


export interface Instruction {
  step_number: number;
  instruction: string;
  duration_minutes?: number;
}


export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  total_time_minutes?: number;
  servings: number;
  cuisine_type?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  dietary_tags?: string[];
  owner_id: string;
  library_id?: string;
  created_at: string;
  updated_at: string;
}


export type RecipeCreateDTO = Omit<
  Recipe,
  'id' | 'owner_id' | 'created_at' | 'updated_at' | 'total_time_minutes'
>;


export type RecipeUpdateDTO = Partial<RecipeCreateDTO>;
```

### Contexts (`src/contexts/`)

Global state management using React Context:

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/auth';
import { authApi } from '../services/authApi';


interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}


export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authApi.getCurrentUser();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { user } = await authApi.login(username, password);
    setCurrentUser(user);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const { user } = await authApi.register(username, email, password);
      setCurrentUser(user);
    },
    []
  );

  const logout = useCallback(() => {
    authApi.logout();
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 🧪 Testing Strategy

### Test Structure

```
src/
├── components/
│   ├── recipes/
│   │   ├── RecipeCard.test.tsx
│   │   ├── RecipeForm.test.tsx
│   │   └── RecipeList.test.tsx
│   └── ...
├── pages/
│   ├── LoginPage.test.tsx
│   ├── RecipesPage.test.tsx
│   └── ...
├── services/
│   ├── recipeApi.test.ts
│   ├── authApi.test.ts
│   └── ...
├── contexts/
│   └── AuthContext.test.tsx
└── test/
    ├── setup.ts
    ├── test-utils.tsx
    └── mocks/
        ├── handlers.ts
        ├── server.ts
        └── data.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test RecipeForm.test.tsx

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Testing Best Practices

1. **Test user behavior, not implementation details**
2. **Use React Testing Library** - Query by role, label, text
3. **Mock API calls** with MSW (Mock Service Worker)
4. **Test accessibility** - ARIA labels, keyboard navigation
5. **Avoid testing internal state** - Test rendered output
6. **Use custom render** from test-utils with all providers

### Component Test Example

```typescript
// components/recipes/RecipeCard.test.tsx
import { render, screen } from '../../test/test-utils';
import { RecipeCard } from './RecipeCard';
import { mockRecipe } from '../../test/mocks/data';


describe('RecipeCard', () => {
  it('displays recipe information correctly', () => {
    const recipe = mockRecipe();
    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByRole('heading', { name: recipe.title })).toBeInTheDocument();
    expect(screen.getByText(recipe.description)).toBeInTheDocument();
    expect(screen.getByText(recipe.cuisine_type)).toBeInTheDocument();
  });

  it('displays difficulty level with correct styling', () => {
    const recipe = mockRecipe({ difficulty_level: 'hard' });
    render(<RecipeCard recipe={recipe} />);

    const difficultyElement = screen.getByText('hard');
    expect(difficultyElement).toHaveClass('difficulty');
  });

  it('calls onEdit when edit button is clicked', async () => {
    const recipe = mockRecipe();
    const onEdit = vi.fn();
    const { user } = render(<RecipeCard recipe={recipe} onEdit={onEdit} isOwner />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(recipe.id);
  });

  it('does not show edit/delete buttons when not owner', () => {
    const recipe = mockRecipe();
    render(<RecipeCard recipe={recipe} isOwner={false} />);

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});
```

### API Test Example

```typescript
// services/recipeApi.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { recipeApi } from './recipeApi';
import { server } from '../test/mocks/server';
import { HttpResponse, http } from 'msw';


describe('recipeApi', () => {
  it('fetches recipes successfully', async () => {
    const recipes = await recipeApi.getRecipes();

    expect(recipes.recipes).toBeInstanceOf(Array);
    expect(recipes.total).toBeGreaterThan(0);
  });

  it('handles API errors gracefully', async () => {
    // Override MSW handler to return error
    server.use(
      http.get('*/api/v1/recipes', () => {
        return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
      })
    );

    await expect(recipeApi.getRecipes()).rejects.toThrow();
  });

  it('creates a recipe with valid data', async () => {
    const newRecipe = {
      title: 'Test Recipe',
      ingredients: [],
      instructions: [],
      servings: 4,
    };

    const result = await recipeApi.createRecipe(newRecipe);

    expect(result.id).toBeDefined();
    expect(result.title).toBe('Test Recipe');
  });
});
```

---

## 🛠️ Common Frontend Tasks

### Adding a New Component

1. **Create component file** in `src/components/<feature>/`
2. **Define TypeScript props interface**
3. **Implement with hooks** if needed
4. **Write component tests** in `.test.tsx` file
5. **Export from barrel file** in `src/components/index.ts` (optional)
6. **Use in pages or other components**

### Adding a New Page

1. **Create page file** in `src/pages/<PageName>.tsx`
2. **Compose from existing components**
3. **Use hooks for page-level logic**
4. **Add routing** in `App.tsx`
5. **Write page integration tests**

### Adding API Integration

1. **Define types** in `src/types/`
2. **Create API client** in `src/services/`
3. **Create custom hook** in `src/hooks/` (if stateful)
4. **Use in components**
5. **Write API tests** with MSW mocks

---

## 📚 References

- **React:** https://react.dev/
- **TypeScript:** https://www.typescriptlang.org/
- **React Testing Library:** https://testing-library.com/react
- **Vitest:** https://vitest.dev/
- **MSW:** https://mswjs.io/
- **Vite:** https://vitejs.dev/

---

## 💡 Questions?

Refer to:
1. [../CLAUDE.md](../CLAUDE.md) - General project guidance
2. Component examples in `src/components/` - Follow established patterns
3. Test examples in `src/` - `.test.tsx` files show testing patterns
4. [../../docs/CLAUDE.md](../../docs/CLAUDE.md) - Documentation practices

Remember: Keep components focused, types comprehensive, tests user-centric!
