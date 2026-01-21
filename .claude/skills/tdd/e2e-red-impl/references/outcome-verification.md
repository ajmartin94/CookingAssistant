# Outcome Verification

Tests must verify **outcomes**, not process. An outcome is observable state change that proves the feature works.

## The Outcome Test Pattern

```
1. Capture state BEFORE action
2. Perform the user action
3. Capture state AFTER action
4. Assert outcome (state change proves it worked)
```

## Good vs Bad Examples

### Creating Data

```typescript
// BAD: Only checks response
const response = await api.createRecipe(data);
expect(response.status).toBe(201);

// GOOD: Verifies outcome
const beforeCount = (await api.getRecipes()).length;
const response = await api.createRecipe(data);
const afterCount = (await api.getRecipes()).length;
expect(afterCount).toBe(beforeCount + 1);
```

### Updating Data

```typescript
// BAD: Only checks API acknowledged
await api.updateRecipe(id, { title: 'New Title' });
expect(response.status).toBe(200);

// GOOD: Verifies change persisted
await api.updateRecipe(id, { title: 'New Title' });
const recipe = await api.getRecipe(id);
expect(recipe.title).toBe('New Title');
```

### Deleting Data

```typescript
// BAD: Only checks status
await api.deleteRecipe(id);
expect(response.status).toBe(204);

// GOOD: Verifies data gone
await api.deleteRecipe(id);
const recipes = await api.getRecipes();
expect(recipes.find(r => r.id === id)).toBeUndefined();
```

### Tool Execution (AI Chat)

```typescript
// BAD: Only checks approval status
await chat.approveTool();
expect(response.status).toBe('approved');

// GOOD: Verifies tool effect
const beforeRecipes = await api.getRecipes();
await chat.approveTool();
const afterRecipes = await api.getRecipes();
expect(afterRecipes.length).toBe(beforeRecipes.length + 1);
```

## What Counts as an Outcome

| Action | Outcome to verify |
|--------|-------------------|
| Create | New record exists in DB/API |
| Update | Field values changed in DB/API |
| Delete | Record no longer exists |
| Login | Session/token valid, can access protected resources |
| Tool exec | Side effect occurred (data created/modified) |

## What Does NOT Count

- Response status codes (process, not outcome)
- UI elements appearing (can exist without backend working)
- Mock assertions (`mock.toHaveBeenCalled()`)
- Intermediate state (processing, pending)

## The Acid Test

> "If I broke the backend but left the API returning 200 OK, would this test fail?"

If no, the test doesn't verify outcomes.
