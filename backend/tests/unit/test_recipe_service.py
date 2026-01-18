"""
Unit Tests for Recipe Service

Tests for recipe CRUD operations, filtering, pagination, and ownership checks.
"""

import pytest
from fastapi import HTTPException

from app.services import recipe_service
from app.schemas.recipe import (
    RecipeCreate,
    RecipeUpdate,
    IngredientSchema,
    InstructionSchema,
)
from app.models.recipe import DifficultyLevel
from tests.utils.helpers import create_test_recipe, create_test_library


# Get Recipe Tests


@pytest.mark.asyncio
async def test_get_recipe_by_id_found(test_db, test_recipe):
    """Test retrieving existing recipe by ID"""
    recipe = await recipe_service.get_recipe(test_db, test_recipe.id)

    assert recipe is not None
    assert recipe.id == test_recipe.id
    assert recipe.title == test_recipe.title


@pytest.mark.asyncio
async def test_get_recipe_by_id_not_found(test_db):
    """Test retrieving non-existent recipe by ID"""
    recipe = await recipe_service.get_recipe(test_db, "nonexistent-id")

    assert recipe is None


# Get Recipes with Filters Tests


@pytest.mark.asyncio
async def test_get_recipes_no_filters(test_db, test_user):
    """Test getting all recipes without filters"""
    # Create multiple recipes
    await create_test_recipe(test_db, test_user, "Recipe 1")
    await create_test_recipe(test_db, test_user, "Recipe 2")
    await create_test_recipe(test_db, test_user, "Recipe 3")

    recipes, total = await recipe_service.get_recipes(test_db)

    assert len(recipes) == 3
    assert total == 3


@pytest.mark.asyncio
async def test_get_recipes_filter_by_owner(test_db, test_user, test_user2):
    """Test filtering recipes by owner"""
    # Create recipes for different users
    await create_test_recipe(test_db, test_user, "User1 Recipe 1")
    await create_test_recipe(test_db, test_user, "User1 Recipe 2")
    await create_test_recipe(test_db, test_user2, "User2 Recipe")

    recipes, total = await recipe_service.get_recipes(test_db, owner_id=test_user.id)

    assert len(recipes) == 2
    assert total == 2
    assert all(r.owner_id == test_user.id for r in recipes)


@pytest.mark.asyncio
async def test_get_recipes_filter_by_library(test_db, test_user):
    """Test filtering recipes by library"""
    library = await create_test_library(test_db, test_user, "Test Library")

    # Create recipes in and out of library
    await create_test_recipe(test_db, test_user, "In Library", library=library)
    await create_test_recipe(test_db, test_user, "Not in Library")

    recipes, total = await recipe_service.get_recipes(test_db, library_id=library.id)

    assert len(recipes) == 1
    assert total == 1
    assert recipes[0].library_id == library.id


@pytest.mark.asyncio
async def test_get_recipes_filter_by_cuisine_type(test_db, test_user):
    """Test filtering recipes by cuisine type"""
    await create_test_recipe(
        test_db, test_user, "Italian Recipe", cuisine_type="Italian"
    )
    await create_test_recipe(
        test_db, test_user, "Chinese Recipe", cuisine_type="Chinese"
    )
    await create_test_recipe(
        test_db, test_user, "Another Italian", cuisine_type="Italian"
    )

    recipes, total = await recipe_service.get_recipes(test_db, cuisine_type="Italian")

    assert len(recipes) == 2
    assert total == 2
    assert all(r.cuisine_type == "Italian" for r in recipes)


@pytest.mark.asyncio
async def test_get_recipes_filter_by_difficulty(test_db, test_user):
    """Test filtering recipes by difficulty level"""
    await create_test_recipe(test_db, test_user, "Easy Recipe", difficulty_level="easy")
    await create_test_recipe(test_db, test_user, "Hard Recipe", difficulty_level="hard")
    await create_test_recipe(
        test_db, test_user, "Another Easy", difficulty_level="easy"
    )

    recipes, total = await recipe_service.get_recipes(test_db, difficulty="easy")

    assert len(recipes) == 2
    assert total == 2
    assert all(r.difficulty_level == "easy" for r in recipes)


@pytest.mark.asyncio
async def test_get_recipes_search_in_title(test_db, test_user):
    """Test searching recipes by title"""
    await create_test_recipe(test_db, test_user, "Chocolate Cake")
    await create_test_recipe(test_db, test_user, "Vanilla Cake")
    await create_test_recipe(test_db, test_user, "Chocolate Cookies")

    recipes, total = await recipe_service.get_recipes(test_db, search="Chocolate")

    assert len(recipes) == 2
    assert total == 2
    assert all("Chocolate" in r.title for r in recipes)


@pytest.mark.asyncio
async def test_get_recipes_search_in_description(test_db, test_user):
    """Test searching recipes by description"""
    await create_test_recipe(
        test_db, test_user, "Recipe 1", description="A delicious chocolate dessert"
    )
    await create_test_recipe(
        test_db, test_user, "Recipe 2", description="A vanilla treat"
    )
    await create_test_recipe(
        test_db, test_user, "Recipe 3", description="Another chocolate recipe"
    )

    recipes, total = await recipe_service.get_recipes(test_db, search="chocolate")

    assert len(recipes) == 2
    assert total == 2


@pytest.mark.asyncio
async def test_get_recipes_search_case_insensitive(test_db, test_user):
    """Test that search is case-insensitive"""
    await create_test_recipe(test_db, test_user, "Chocolate Cake")

    recipes_lower, _ = await recipe_service.get_recipes(test_db, search="chocolate")
    recipes_upper, _ = await recipe_service.get_recipes(test_db, search="CHOCOLATE")
    recipes_mixed, _ = await recipe_service.get_recipes(test_db, search="ChOcOlAtE")

    assert len(recipes_lower) == 1
    assert len(recipes_upper) == 1
    assert len(recipes_mixed) == 1


@pytest.mark.asyncio
async def test_get_recipes_multiple_filters(test_db, test_user):
    """Test combining multiple filters"""
    await create_test_recipe(
        test_db,
        test_user,
        "Italian Pasta",
        cuisine_type="Italian",
        difficulty_level="easy",
    )
    await create_test_recipe(
        test_db,
        test_user,
        "Italian Pizza",
        cuisine_type="Italian",
        difficulty_level="hard",
    )
    await create_test_recipe(
        test_db,
        test_user,
        "Chinese Noodles",
        cuisine_type="Chinese",
        difficulty_level="easy",
    )

    recipes, total = await recipe_service.get_recipes(
        test_db, cuisine_type="Italian", difficulty="easy"
    )

    assert len(recipes) == 1
    assert total == 1
    assert recipes[0].title == "Italian Pasta"


# Pagination Tests


@pytest.mark.asyncio
async def test_get_recipes_pagination_first_page(test_db, test_user):
    """Test pagination - first page"""
    # Create 15 recipes
    for i in range(15):
        await create_test_recipe(test_db, test_user, f"Recipe {i}")

    recipes, total = await recipe_service.get_recipes(test_db, skip=0, limit=10)

    assert len(recipes) == 10
    assert total == 15


@pytest.mark.asyncio
async def test_get_recipes_pagination_second_page(test_db, test_user):
    """Test pagination - second page"""
    # Create 15 recipes
    for i in range(15):
        await create_test_recipe(test_db, test_user, f"Recipe {i}")

    recipes, total = await recipe_service.get_recipes(test_db, skip=10, limit=10)

    assert len(recipes) == 5
    assert total == 15


@pytest.mark.asyncio
async def test_get_recipes_returns_total_count(test_db, test_user):
    """Test that get_recipes returns correct total count"""
    for i in range(7):
        await create_test_recipe(test_db, test_user, f"Recipe {i}")

    recipes, total = await recipe_service.get_recipes(test_db, limit=5)

    assert len(recipes) == 5  # Limited to 5
    assert total == 7  # But total is 7


@pytest.mark.asyncio
async def test_get_recipes_empty_result(test_db):
    """Test getting recipes when none exist"""
    recipes, total = await recipe_service.get_recipes(test_db)

    assert len(recipes) == 0
    assert total == 0


# Create Recipe Tests


@pytest.mark.asyncio
async def test_create_recipe_success(
    test_db, test_user, sample_ingredients, sample_instructions
):
    """Test successful recipe creation"""
    recipe_data = RecipeCreate(
        title="New Recipe",
        description="A new test recipe",
        ingredients=sample_ingredients,
        instructions=sample_instructions,
        prep_time_minutes=15,
        cook_time_minutes=30,
        servings=4,
        cuisine_type="American",
        difficulty_level=DifficultyLevel.MEDIUM,
    )

    recipe = await recipe_service.create_recipe(test_db, recipe_data, test_user)

    assert recipe.id is not None
    assert recipe.title == "New Recipe"
    assert recipe.owner_id == test_user.id
    assert len(recipe.ingredients) == len(sample_ingredients)
    assert len(recipe.instructions) == len(sample_instructions)


@pytest.mark.asyncio
async def test_create_recipe_calculates_total_time(
    test_db, test_user, sample_ingredients, sample_instructions
):
    """Test that total time is calculated correctly"""
    recipe_data = RecipeCreate(
        title="Test Recipe",
        description="Test",
        ingredients=sample_ingredients,
        instructions=sample_instructions,
        prep_time_minutes=20,
        cook_time_minutes=35,
        servings=4,
        cuisine_type="American",
        difficulty_level=DifficultyLevel.EASY,
    )

    recipe = await recipe_service.create_recipe(test_db, recipe_data, test_user)

    assert recipe.total_time_minutes == 55  # 20 + 35


@pytest.mark.asyncio
async def test_create_recipe_converts_pydantic_to_dict(
    test_db, test_user, sample_ingredients, sample_instructions
):
    """Test that Pydantic models are converted to dicts for JSON storage"""
    recipe_data = RecipeCreate(
        title="Test Recipe",
        description="Test",
        ingredients=sample_ingredients,
        instructions=sample_instructions,
        prep_time_minutes=10,
        cook_time_minutes=20,
        servings=2,
        cuisine_type="Test",
        difficulty_level=DifficultyLevel.EASY,
    )

    recipe = await recipe_service.create_recipe(test_db, recipe_data, test_user)

    # Ingredients should be list of dicts
    assert isinstance(recipe.ingredients, list)
    assert all(isinstance(ing, dict) for ing in recipe.ingredients)
    assert recipe.ingredients[0]["name"] == sample_ingredients[0].name

    # Instructions should be list of dicts
    assert isinstance(recipe.instructions, list)
    assert all(isinstance(inst, dict) for inst in recipe.instructions)
    assert recipe.instructions[0]["instruction"] == sample_instructions[0].instruction


@pytest.mark.asyncio
async def test_create_recipe_sets_owner_id(
    test_db, test_user, sample_ingredients, sample_instructions
):
    """Test that owner_id is set correctly"""
    recipe_data = RecipeCreate(
        title="Test Recipe",
        description="Test",
        ingredients=sample_ingredients,
        instructions=sample_instructions,
        servings=4,
        cuisine_type="Test",
        difficulty_level=DifficultyLevel.EASY,
    )

    recipe = await recipe_service.create_recipe(test_db, recipe_data, test_user)

    assert recipe.owner_id == test_user.id


@pytest.mark.asyncio
async def test_create_recipe_with_library(
    test_db, test_user, test_library, sample_ingredients, sample_instructions
):
    """Test creating recipe in a library"""
    recipe_data = RecipeCreate(
        title="Library Recipe",
        description="In a library",
        ingredients=sample_ingredients,
        instructions=sample_instructions,
        servings=4,
        cuisine_type="Test",
        difficulty_level=DifficultyLevel.EASY,
        library_id=test_library.id,
    )

    recipe = await recipe_service.create_recipe(test_db, recipe_data, test_user)

    assert recipe.library_id == test_library.id


# Update Recipe Tests


@pytest.mark.asyncio
async def test_update_recipe_title_only(test_db, test_recipe):
    """Test updating only the title"""
    update_data = RecipeUpdate(title="Updated Title")

    updated = await recipe_service.update_recipe(test_db, test_recipe, update_data)

    assert updated.title == "Updated Title"
    assert updated.description == test_recipe.description  # Unchanged


@pytest.mark.asyncio
async def test_update_recipe_ingredients(test_db, test_recipe):
    """Test updating ingredients"""
    new_ingredients = [
        IngredientSchema(
            name="new ingredient", amount="5", unit="cups", notes="updated"
        )
    ]
    update_data = RecipeUpdate(ingredients=new_ingredients)

    updated = await recipe_service.update_recipe(test_db, test_recipe, update_data)

    assert len(updated.ingredients) == 1
    assert updated.ingredients[0]["name"] == "new ingredient"


@pytest.mark.asyncio
async def test_update_recipe_instructions(test_db, test_recipe):
    """Test updating instructions"""
    new_instructions = [
        InstructionSchema(step_number=1, instruction="New step", duration_minutes=10)
    ]
    update_data = RecipeUpdate(instructions=new_instructions)

    updated = await recipe_service.update_recipe(test_db, test_recipe, update_data)

    assert len(updated.instructions) == 1
    assert updated.instructions[0]["instruction"] == "New step"


@pytest.mark.asyncio
async def test_update_recipe_recalculates_total_time(test_db, test_recipe):
    """Test that total time is recalculated on update"""
    update_data = RecipeUpdate(prep_time_minutes=25, cook_time_minutes=40)

    updated = await recipe_service.update_recipe(test_db, test_recipe, update_data)

    assert updated.total_time_minutes == 65  # 25 + 40


@pytest.mark.asyncio
async def test_update_recipe_partial_time_update(test_db, test_recipe):
    """Test updating only prep time recalculates total"""
    original_cook_time = test_recipe.cook_time_minutes
    update_data = RecipeUpdate(prep_time_minutes=15)

    updated = await recipe_service.update_recipe(test_db, test_recipe, update_data)

    assert updated.total_time_minutes == 15 + original_cook_time


@pytest.mark.asyncio
async def test_update_recipe_multiple_fields(test_db, test_recipe):
    """Test updating multiple fields at once"""
    update_data = RecipeUpdate(
        title="New Title", description="New description", servings=6
    )

    updated = await recipe_service.update_recipe(test_db, test_recipe, update_data)

    assert updated.title == "New Title"
    assert updated.description == "New description"
    assert updated.servings == 6


# Delete Recipe Tests


@pytest.mark.asyncio
async def test_delete_recipe_success(test_db, test_recipe):
    """Test successful recipe deletion"""
    recipe_id = test_recipe.id

    await recipe_service.delete_recipe(test_db, test_recipe)

    # Verify recipe is deleted
    deleted = await recipe_service.get_recipe(test_db, recipe_id)
    assert deleted is None


# Ownership Check Tests


def test_check_recipe_ownership_owner(test_recipe, test_user):
    """Test ownership check when user owns the recipe"""
    # Should not raise exception
    recipe_service.check_recipe_ownership(test_recipe, test_user)


def test_check_recipe_ownership_not_owner_raises_403(test_recipe, test_user2):
    """Test ownership check when user doesn't own the recipe"""
    with pytest.raises(HTTPException) as exc_info:
        recipe_service.check_recipe_ownership(test_recipe, test_user2)

    assert exc_info.value.status_code == 403
    assert "Not authorized" in exc_info.value.detail
