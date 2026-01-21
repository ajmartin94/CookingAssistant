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

```python
# BAD: Only checks response
response = await client.post("/api/v1/recipes", json=data)
assert response.status_code == 201

# GOOD: Verifies outcome
before_count = await test_db.scalar(select(func.count(Recipe.id)))
response = await client.post("/api/v1/recipes", json=data)
after_count = await test_db.scalar(select(func.count(Recipe.id)))
assert after_count == before_count + 1
```

### Updating Data

```python
# BAD: Only checks API acknowledged
response = await client.patch(f"/api/v1/recipes/{id}", json={"title": "New"})
assert response.status_code == 200

# GOOD: Verifies change persisted
await client.patch(f"/api/v1/recipes/{id}", json={"title": "New"})
recipe = await test_db.get(Recipe, id)
assert recipe.title == "New"
```

### Deleting Data

```python
# BAD: Only checks status
response = await client.delete(f"/api/v1/recipes/{id}")
assert response.status_code == 204

# GOOD: Verifies data gone
await client.delete(f"/api/v1/recipes/{id}")
recipe = await test_db.get(Recipe, id)
assert recipe is None
```

## What Counts as an Outcome

| Action | Outcome to verify |
|--------|-------------------|
| Create | New record exists in DB |
| Update | Field values changed in DB |
| Delete | Record no longer exists |
| Login | Session/token valid, user_id matches |
| Tool exec | Side effect occurred (data created/modified) |

## What Does NOT Count

- Response status codes (process, not outcome)
- Response JSON matching input (echo, not persistence)
- Mock assertions (`mock.toHaveBeenCalled()`)
- Intermediate state (processing, pending)

## The Acid Test

> "If I broke the database write but left the API returning 200 OK, would this test fail?"

If no, the test doesn't verify outcomes.
