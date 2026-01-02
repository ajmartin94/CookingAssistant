"""
Unit Tests for Recipe Service

Tests recipe CRUD operations, filtering, search, and validation.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.recipe_service import (
    get_recipe,
    get_recipes,
    create_recipe,
    update_recipe,
    delete_recipe,
    check_recipe_ownership,
)
from app.schemas.recipe import RecipeCreate, RecipeUpdate
from app.models.recipe import DifficultyLevel, Recipe
from app.models.user import User
from fastapi import HTTPException


class TestRecipeRetrieval:
    """Test recipe retrieval functions"""

    @pytest.mark.asyncio
    async def test_get_recipe_by_id(self, test_db: AsyncSession, test_recipe: Recipe):
        """Test retrieving a recipe by ID"""
        recipe = await get_recipe(test_db, test_recipe.id)

        assert recipe is not None
        assert recipe.id == test_recipe.id
        assert recipe.title == test_recipe.title

    @pytest.mark.asyncio
    async def test_get_recipe_not_found(self, test_db: AsyncSession):
        """Test retrieving a non-existent recipe"""
        recipe = await get_recipe(test_db, "nonexistent-id")

        assert recipe is None

    @pytest.mark.asyncio
    async def test_get_recipes_all(
        self, test_db: AsyncSession, test_user: User, test_recipe: Recipe, test_recipe2: Recipe
    ):
        """Test retrieving all recipes for a user"""
        recipes, total = await get_recipes(test_db, owner_id=test_user.id)

        assert total == 2
        assert len(recipes) == 2
        assert recipes[0].owner_id == test_user.id
        assert recipes[1].owner_id == test_user.id

    @pytest.mark.asyncio
    async def test_get_recipes_with_library_filter(
        self, test_db: AsyncSession, test_user: User, test_recipe_in_library: Recipe, test_library
    ):
        """Test filtering recipes by library"""
        recipes, total = await get_recipes(
            test_db, owner_id=test_user.id, library_id=test_library.id
        )

        assert total == 1
        assert len(recipes) == 1
        assert recipes[0].library_id == test_library.id

    @pytest.mark.asyncio
    async def test_get_recipes_with_cuisine_filter(
        self, test_db: AsyncSession, test_user: User, test_recipe: Recipe, test_recipe2: Recipe
    ):
        """Test filtering recipes by cuisine type"""
        recipes, total = await get_recipes(
            test_db, owner_id=test_user.id, cuisine_type="Italian"
        )

        assert total == 1
        assert len(recipes) == 1
        assert recipes[0].cuisine_type == "Italian"

    @pytest.mark.asyncio
    async def test_get_recipes_with_difficulty_filter(
        self, test_db: AsyncSession, test_user: User, test_recipe: Recipe
    ):
        """Test filtering recipes by difficulty level"""
        recipes, total = await get_recipes(
            test_db, owner_id=test_user.id, difficulty="easy"
        )

        assert total >= 1
        for recipe in recipes:
            assert recipe.difficulty_level == DifficultyLevel.EASY

    @pytest.mark.asyncio
    async def test_get_recipes_with_search_term(
        self, test_db: AsyncSession, test_user: User, test_recipe: Recipe, test_recipe2: Recipe
    ):
        """Test searching recipes by title/description"""
        recipes, total = await get_recipes(
            test_db, owner_id=test_user.id, search="Italian"
        )

        assert total == 1
        assert len(recipes) == 1
        assert "Italian" in recipes[0].title or "Italian" in (recipes[0].description or "")

    @pytest.mark.asyncio
    async def test_get_recipes_pagination(
        self, test_db: AsyncSession, test_user: User, test_recipe: Recipe, test_recipe2: Recipe
    ):
        """Test recipe pagination"""
        # Get first page
        recipes_page1, total = await get_recipes(
            test_db, owner_id=test_user.id, skip=0, limit=1
        )

        assert total == 2
        assert len(recipes_page1) == 1

        # Get second page
        recipes_page2, _ = await get_recipes(
            test_db, owner_id=test_user.id, skip=1, limit=1
        )

        assert len(recipes_page2) == 1
        assert recipes_page1[0].id != recipes_page2[0].id

    @pytest.mark.asyncio
    async def test_get_recipes_empty_result(self, test_db: AsyncSession, test_user: User):
        """Test getting recipes when none exist"""
        recipes, total = await get_recipes(
            test_db, owner_id=test_user.id, cuisine_type="NonexistentCuisine"
        )

        assert total == 0
        assert len(recipes) == 0


class TestRecipeCRUD:
    """Test recipe CRUD operations"""

    @pytest.mark.asyncio
    async def test_create_recipe_minimal_data(self, test_db: AsyncSession, test_user: User):
        """Test creating a recipe with minimal required data"""
        recipe_create = RecipeCreate(
            title="Minimal Recipe",
            ingredients=[{"name": "water", "amount": "1", "unit": "cup", "notes": ""}],
            instructions=[{"step_number": 1, "instruction": "Drink water", "duration_minutes": 1}],
        )

        recipe = await create_recipe(test_db, recipe_create, test_user)

        assert recipe is not None
        assert recipe.id is not None
        assert recipe.title == "Minimal Recipe"
        assert recipe.owner_id == test_user.id
        assert len(recipe.ingredients) == 1
        assert len(recipe.instructions) == 1
        assert recipe.servings == 4  # Default value

    @pytest.mark.asyncio
    async def test_create_recipe_full_data(self, test_db: AsyncSession, test_user: User):
        """Test creating a recipe with full data"""
        recipe_create = RecipeCreate(
            title="Complete Recipe",
            description="A fully detailed recipe",
            ingredients=[
                {"name": "ingredient1", "amount": "1", "unit": "cup", "notes": "note1"},
                {"name": "ingredient2", "amount": "2", "unit": "tbsp", "notes": "note2"},
            ],
            instructions=[
                {"step_number": 1, "instruction": "Step 1", "duration_minutes": 5},
                {"step_number": 2, "instruction": "Step 2", "duration_minutes": 10},
            ],
            prep_time_minutes=15,
            cook_time_minutes=30,
            total_time_minutes=45,
            servings=6,
            cuisine_type="French",
            dietary_tags=["vegetarian", "gluten-free"],
            difficulty_level=DifficultyLevel.MEDIUM,
            source_url="https://example.com/recipe",
            source_name="Example Chef",
            notes="Personal notes here",
            image_url="https://example.com/image.jpg",
        )

        recipe = await create_recipe(test_db, recipe_create, test_user)

        assert recipe.title == "Complete Recipe"
        assert recipe.description == "A fully detailed recipe"
        assert len(recipe.ingredients) == 2
        assert len(recipe.instructions) == 2
        assert recipe.prep_time_minutes == 15
        assert recipe.cook_time_minutes == 30
        assert recipe.servings == 6
        assert recipe.cuisine_type == "French"
        assert "vegetarian" in recipe.dietary_tags
        assert recipe.difficulty_level == DifficultyLevel.MEDIUM
        assert recipe.source_url == "https://example.com/recipe"

    @pytest.mark.asyncio
    async def test_create_recipe_with_library(
        self, test_db: AsyncSession, test_user: User, test_library
    ):
        """Test creating a recipe and adding it to a library"""
        recipe_create = RecipeCreate(
            title="Library Recipe",
            ingredients=[{"name": "salt", "amount": "1", "unit": "tsp", "notes": ""}],
            instructions=[{"step_number": 1, "instruction": "Add salt", "duration_minutes": 1}],
            library_id=test_library.id,
        )

        recipe = await create_recipe(test_db, recipe_create, test_user)

        assert recipe.library_id == test_library.id

    @pytest.mark.asyncio
    async def test_update_recipe_title(
        self, test_db: AsyncSession, test_recipe: Recipe
    ):
        """Test updating a recipe title"""
        recipe_update = RecipeUpdate(title="Updated Title")

        updated_recipe = await update_recipe(test_db, test_recipe, recipe_update)

        assert updated_recipe.title == "Updated Title"
        assert updated_recipe.id == test_recipe.id

    @pytest.mark.asyncio
    async def test_update_recipe_ingredients(
        self, test_db: AsyncSession, test_recipe: Recipe
    ):
        """Test updating recipe ingredients"""
        new_ingredients = [
            {"name": "new ingredient", "amount": "5", "unit": "oz", "notes": "fresh"}
        ]
        recipe_update = RecipeUpdate(ingredients=new_ingredients)

        updated_recipe = await update_recipe(test_db, test_recipe, recipe_update)

        assert len(updated_recipe.ingredients) == 1
        assert updated_recipe.ingredients[0]["name"] == "new ingredient"

    @pytest.mark.asyncio
    async def test_update_recipe_instructions(
        self, test_db: AsyncSession, test_recipe: Recipe
    ):
        """Test updating recipe instructions"""
        new_instructions = [
            {"step_number": 1, "instruction": "New step 1", "duration_minutes": 10},
            {"step_number": 2, "instruction": "New step 2", "duration_minutes": 20},
        ]
        recipe_update = RecipeUpdate(instructions=new_instructions)

        updated_recipe = await update_recipe(test_db, test_recipe, recipe_update)

        assert len(updated_recipe.instructions) == 2
        assert updated_recipe.instructions[0]["instruction"] == "New step 1"

    @pytest.mark.asyncio
    async def test_update_recipe_move_to_library(
        self, test_db: AsyncSession, test_recipe: Recipe, test_library
    ):
        """Test moving a recipe to a library"""
        recipe_update = RecipeUpdate(library_id=test_library.id)

        updated_recipe = await update_recipe(test_db, test_recipe, recipe_update)

        assert updated_recipe.library_id == test_library.id

    @pytest.mark.asyncio
    async def test_delete_recipe(self, test_db: AsyncSession, test_recipe: Recipe):
        """Test deleting a recipe"""
        recipe_id = test_recipe.id

        await delete_recipe(test_db, test_recipe)

        # Verify recipe is deleted
        deleted_recipe = await get_recipe(test_db, recipe_id)
        assert deleted_recipe is None

    @pytest.mark.asyncio
    async def test_delete_recipe_cascades_shares(
        self, test_db: AsyncSession, test_recipe: Recipe, test_share
    ):
        """Test that deleting a recipe cascades to delete shares"""
        from sqlalchemy import select
        from app.models.share import RecipeShare

        recipe_id = test_recipe.id

        # Verify share exists
        result = await test_db.execute(
            select(RecipeShare).where(RecipeShare.recipe_id == recipe_id)
        )
        shares_before = result.scalars().all()
        assert len(shares_before) > 0

        # Delete recipe
        await delete_recipe(test_db, test_recipe)
        await test_db.commit()

        # Verify shares are also deleted
        result = await test_db.execute(
            select(RecipeShare).where(RecipeShare.recipe_id == recipe_id)
        )
        shares_after = result.scalars().all()
        assert len(shares_after) == 0


class TestRecipeValidation:
    """Test recipe validation logic"""

    @pytest.mark.asyncio
    async def test_ingredients_json_structure(
        self, test_db: AsyncSession, test_recipe: Recipe
    ):
        """Test that ingredients are stored as JSON with correct structure"""
        assert isinstance(test_recipe.ingredients, list)
        assert len(test_recipe.ingredients) > 0

        for ingredient in test_recipe.ingredients:
            assert "name" in ingredient
            assert "amount" in ingredient
            assert "unit" in ingredient

    @pytest.mark.asyncio
    async def test_instructions_json_structure(
        self, test_db: AsyncSession, test_recipe: Recipe
    ):
        """Test that instructions are stored as JSON with correct structure"""
        assert isinstance(test_recipe.instructions, list)
        assert len(test_recipe.instructions) > 0

        for instruction in test_recipe.instructions:
            assert "step_number" in instruction
            assert "instruction" in instruction

    @pytest.mark.asyncio
    async def test_total_time_calculation(self, test_db: AsyncSession, test_recipe: Recipe):
        """Test that total time is correctly calculated/stored"""
        if test_recipe.prep_time_minutes and test_recipe.cook_time_minutes:
            expected_total = test_recipe.prep_time_minutes + test_recipe.cook_time_minutes
            assert test_recipe.total_time_minutes == expected_total

    @pytest.mark.asyncio
    async def test_dietary_tags_validation(self, test_db: AsyncSession, test_recipe: Recipe):
        """Test that dietary tags are stored as JSON array"""
        if test_recipe.dietary_tags:
            assert isinstance(test_recipe.dietary_tags, list)
            for tag in test_recipe.dietary_tags:
                assert isinstance(tag, str)


class TestRecipeOwnership:
    """Test recipe ownership checks"""

    def test_check_recipe_ownership_success(self, test_recipe: Recipe, test_user: User):
        """Test successful ownership check"""
        # Should not raise exception
        check_recipe_ownership(test_recipe, test_user)

    def test_check_recipe_ownership_failure(self, test_recipe: Recipe, test_user2: User):
        """Test failed ownership check"""
        with pytest.raises(HTTPException) as exc_info:
            check_recipe_ownership(test_recipe, test_user2)

        assert exc_info.value.status_code == 403
