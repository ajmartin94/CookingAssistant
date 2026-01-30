"""
Tests for Seed Data Script

Tests for the CLI script that populates the local database with test user and recipes.
The script should:
- Create a test user from env vars (SEED_USER_EMAIL, SEED_USER_PASSWORD)
- Create exactly 20 realistic recipes owned by the seed user
- Support --reset flag to wipe and re-create seed data
- Exit early if seed user exists (without --reset)
- Handle missing env vars and malformed fixtures gracefully
"""

import pytest
import os
from pathlib import Path
from unittest.mock import patch
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.recipe import Recipe
from app.models.library import RecipeLibrary
from app.models.meal_plan import MealPlan, MealPlanEntry

# Compute backend directory dynamically for CLI tests
BACKEND_DIR = Path(__file__).parent.parent.parent


class TestSeedScript:
    """Tests for the seed data CLI script."""

    @pytest.mark.asyncio
    async def test_seed_creates_user(self, test_db: AsyncSession):
        """Running seed script creates user with expected email from env vars."""
        # Setup: Define expected seed user credentials
        seed_email = "seeduser@example.com"
        seed_password = "seedpassword123"

        # Import and run the seed script
        from scripts.seed import run_seed

        with patch.dict(
            os.environ,
            {
                "SEED_USER_EMAIL": seed_email,
                "SEED_USER_PASSWORD": seed_password,
            },
        ):
            await run_seed(db=test_db)

        # Verify: User created with expected email
        result = await test_db.execute(select(User).where(User.email == seed_email))
        user = result.scalar_one_or_none()

        assert user is not None, "Seed user should be created"
        assert user.email == seed_email
        assert user.is_active is True

    @pytest.mark.asyncio
    async def test_seed_creates_recipes(self, test_db: AsyncSession):
        """Running seed script creates exactly 20 recipes with valid structure."""
        seed_email = "seeduser@example.com"
        seed_password = "seedpassword123"

        from scripts.seed import run_seed

        with patch.dict(
            os.environ,
            {
                "SEED_USER_EMAIL": seed_email,
                "SEED_USER_PASSWORD": seed_password,
            },
        ):
            await run_seed(db=test_db)

        # Verify: Exactly 20 recipes created
        recipe_count = await test_db.scalar(select(func.count(Recipe.id)))
        assert recipe_count == 20, f"Expected 20 recipes, got {recipe_count}"

        # Verify: All recipes owned by seed user
        result = await test_db.execute(select(User).where(User.email == seed_email))
        seed_user = result.scalar_one()

        result = await test_db.execute(
            select(Recipe).where(Recipe.owner_id == seed_user.id)
        )
        recipes = result.scalars().all()

        assert len(recipes) == 20, "All 20 recipes should be owned by seed user"

        # Verify: Each recipe has valid structure
        for recipe in recipes:
            assert recipe.title, "Recipe must have a title"
            assert recipe.ingredients, "Recipe must have ingredients"
            assert (
                len(recipe.ingredients) > 0
            ), "Recipe must have at least one ingredient"
            assert recipe.instructions, "Recipe must have instructions"
            assert (
                len(recipe.instructions) > 0
            ), "Recipe must have at least one instruction"

            # Verify ingredient structure
            for ing in recipe.ingredients:
                assert "name" in ing, "Ingredient must have name"
                assert "amount" in ing, "Ingredient must have amount"
                assert "unit" in ing, "Ingredient must have unit"

            # Verify instruction structure
            for inst in recipe.instructions:
                assert "step_number" in inst, "Instruction must have step_number"
                assert "instruction" in inst, "Instruction must have instruction text"

    @pytest.mark.asyncio
    async def test_seed_reset_flag(self, test_db: AsyncSession):
        """Running seed with --reset wipes and re-creates seed data."""
        seed_email = "seeduser@example.com"
        seed_password = "seedpassword123"

        from scripts.seed import run_seed

        env_vars = {
            "SEED_USER_EMAIL": seed_email,
            "SEED_USER_PASSWORD": seed_password,
        }

        # First run: create seed data
        with patch.dict(os.environ, env_vars):
            await run_seed(db=test_db)

        # Get original user ID
        result = await test_db.execute(select(User).where(User.email == seed_email))
        original_user = result.scalar_one()
        original_user_id = original_user.id

        # Second run with reset: should wipe and re-create
        with patch.dict(os.environ, env_vars):
            await run_seed(db=test_db, reset=True)

        # Verify: New user created (different ID)
        result = await test_db.execute(select(User).where(User.email == seed_email))
        new_user = result.scalar_one()

        assert (
            new_user.id != original_user_id
        ), "Reset should create new user with different ID"

        # Verify: Still exactly 20 recipes (not 40)
        recipe_count = await test_db.scalar(select(func.count(Recipe.id)))
        assert (
            recipe_count == 20
        ), f"After reset, expected 20 recipes, got {recipe_count}"

        # Verify: All recipes owned by new user
        result = await test_db.execute(
            select(Recipe).where(Recipe.owner_id == new_user.id)
        )
        recipes = result.scalars().all()
        assert len(recipes) == 20, "All recipes should belong to new seed user"

    @pytest.mark.asyncio
    async def test_seed_idempotent(self, test_db: AsyncSession):
        """Running seed twice without reset exits early with message."""
        seed_email = "seeduser@example.com"
        seed_password = "seedpassword123"

        from scripts.seed import run_seed, SeedUserExistsError

        env_vars = {
            "SEED_USER_EMAIL": seed_email,
            "SEED_USER_PASSWORD": seed_password,
        }

        # First run: create seed data
        with patch.dict(os.environ, env_vars):
            await run_seed(db=test_db)

        # Second run without reset: should raise error or return early
        with patch.dict(os.environ, env_vars):
            with pytest.raises(SeedUserExistsError) as exc_info:
                await run_seed(db=test_db, reset=False)

        assert "Seed user already exists" in str(exc_info.value)
        assert "--reset" in str(exc_info.value)

        # Verify: Still exactly 20 recipes (not 40)
        recipe_count = await test_db.scalar(select(func.count(Recipe.id)))
        assert recipe_count == 20, "Second run should not create additional recipes"

    @pytest.mark.asyncio
    async def test_seed_missing_env(self, test_db: AsyncSession):
        """Running seed with missing env vars exits with clear error."""
        from scripts.seed import run_seed, SeedConfigError

        # Test with missing SEED_USER_EMAIL
        with patch.dict(os.environ, {"SEED_USER_PASSWORD": "password123"}, clear=True):
            with pytest.raises(SeedConfigError) as exc_info:
                await run_seed(db=test_db)

        error_message = str(exc_info.value)
        assert (
            "SEED_USER_EMAIL" in error_message
        ), "Error should mention missing env var"

        # Test with missing SEED_USER_PASSWORD
        with patch.dict(
            os.environ, {"SEED_USER_EMAIL": "test@example.com"}, clear=True
        ):
            with pytest.raises(SeedConfigError) as exc_info:
                await run_seed(db=test_db)

        error_message = str(exc_info.value)
        assert (
            "SEED_USER_PASSWORD" in error_message
        ), "Error should mention missing env var"

        # Test with both missing
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(SeedConfigError) as exc_info:
                await run_seed(db=test_db)

        error_message = str(exc_info.value)
        assert (
            "SEED_USER_EMAIL" in error_message or "SEED_USER_PASSWORD" in error_message
        )

    @pytest.mark.asyncio
    async def test_seed_invalid_fixtures(self, test_db: AsyncSession, tmp_path):
        """Running seed with malformed fixtures JSON exits with validation error."""
        from scripts.seed import run_seed, SeedFixtureError

        seed_email = "seeduser@example.com"
        seed_password = "seedpassword123"

        # Create malformed fixtures file
        malformed_fixtures = tmp_path / "fixtures.json"
        malformed_fixtures.write_text("{ invalid json }")

        env_vars = {
            "SEED_USER_EMAIL": seed_email,
            "SEED_USER_PASSWORD": seed_password,
        }

        with patch.dict(os.environ, env_vars):
            with pytest.raises(SeedFixtureError) as exc_info:
                await run_seed(db=test_db, fixtures_path=str(malformed_fixtures))

        error_message = str(exc_info.value)
        assert "fixture" in error_message.lower() or "json" in error_message.lower()


class TestSeedCLI:
    """Tests for the seed script CLI interface."""

    def test_seed_cli_help(self):
        """Seed script should provide help text."""
        import subprocess
        import sys

        result = subprocess.run(
            [sys.executable, "-m", "scripts.seed", "--help"],
            capture_output=True,
            text=True,
            cwd=str(BACKEND_DIR),
        )

        # Should not error (exit code 0 for help)
        assert result.returncode == 0, f"Help should succeed: {result.stderr}"
        assert "seed" in result.stdout.lower() or "usage" in result.stdout.lower()

    def test_seed_cli_reset_flag_recognized(self):
        """Seed script should recognize --reset flag."""
        import subprocess
        import sys

        # Running with --reset but no env vars should work (module exists, flag recognized)
        # but fail due to missing env vars, not unknown flag
        result = subprocess.run(
            [sys.executable, "-m", "scripts.seed", "--reset"],
            capture_output=True,
            text=True,
            cwd=str(BACKEND_DIR),
            env={},  # No env vars
        )

        # The module should exist and be runnable
        # If module doesn't exist, this test should fail
        assert "No module named" not in result.stderr, (
            "scripts.seed module must exist: " + result.stderr
        )

        # Should fail due to missing env vars, not unknown flag
        # If --reset were unknown, we'd see "unrecognized arguments"
        assert "unrecognized" not in result.stderr.lower()


class TestSeedLibraries:
    """Tests for seed script library creation."""

    @pytest.mark.asyncio
    async def test_seed_creates_libraries(self, test_db: AsyncSession):
        """Running seed script creates 5 recipe libraries."""
        seed_email = "seeduser@example.com"
        seed_password = "seedpassword123"

        from scripts.seed import run_seed

        with patch.dict(
            os.environ,
            {
                "SEED_USER_EMAIL": seed_email,
                "SEED_USER_PASSWORD": seed_password,
            },
        ):
            await run_seed(db=test_db)

        library_count = await test_db.scalar(select(func.count(RecipeLibrary.id)))
        assert library_count == 5, f"Expected 5 libraries, got {library_count}"

    @pytest.mark.asyncio
    async def test_seed_libraries_have_varied_recipe_counts(
        self, test_db: AsyncSession
    ):
        """Seed libraries should have different numbers of recipes."""
        seed_email = "seeduser@example.com"
        seed_password = "seedpassword123"

        from scripts.seed import run_seed

        with patch.dict(
            os.environ,
            {
                "SEED_USER_EMAIL": seed_email,
                "SEED_USER_PASSWORD": seed_password,
            },
        ):
            await run_seed(db=test_db)

        result = await test_db.execute(select(RecipeLibrary))
        libraries = result.scalars().all()

        recipe_counts = set()
        for lib in libraries:
            # Refresh to load recipes relationship
            await test_db.refresh(lib, ["recipes"])
            recipe_counts.add(len(lib.recipes))

        assert (
            len(recipe_counts) > 1
        ), "Libraries should have varied recipe counts, not all the same"


class TestSeedMealPlan:
    """Tests for seed script meal plan creation."""

    @pytest.mark.asyncio
    async def test_seed_creates_meal_plan(self, test_db: AsyncSession):
        """Running seed script creates a meal plan for the current week."""
        seed_email = "seeduser@example.com"
        seed_password = "seedpassword123"

        from scripts.seed import run_seed

        with patch.dict(
            os.environ,
            {
                "SEED_USER_EMAIL": seed_email,
                "SEED_USER_PASSWORD": seed_password,
            },
        ):
            await run_seed(db=test_db)

        plan_count = await test_db.scalar(select(func.count(MealPlan.id)))
        assert plan_count == 1, f"Expected 1 meal plan, got {plan_count}"

    @pytest.mark.asyncio
    async def test_seed_creates_dinner_entries_for_each_day(
        self, test_db: AsyncSession
    ):
        """Seed meal plan should have dinner entries for all 7 days (0-6)."""
        seed_email = "seeduser@example.com"
        seed_password = "seedpassword123"

        from scripts.seed import run_seed

        with patch.dict(
            os.environ,
            {
                "SEED_USER_EMAIL": seed_email,
                "SEED_USER_PASSWORD": seed_password,
            },
        ):
            await run_seed(db=test_db)

        result = await test_db.execute(select(MealPlanEntry))
        entries = result.scalars().all()

        assert len(entries) == 7, f"Expected 7 dinner entries, got {len(entries)}"

        days = sorted([e.day_of_week for e in entries])
        assert days == list(range(7)), f"Expected days 0-6, got {days}"

        for entry in entries:
            assert entry.meal_type == "dinner"
            assert entry.recipe_id is not None


class TestSeedIdempotencyWithLibrariesAndMealPlans:
    """Tests for seed idempotency with libraries and meal plans."""

    @pytest.mark.asyncio
    async def test_seed_idempotent_no_duplicate_libraries(self, test_db: AsyncSession):
        """Running seed twice should not create duplicate libraries."""
        seed_email = "seeduser@example.com"
        seed_password = "seedpassword123"

        from scripts.seed import run_seed, SeedUserExistsError

        env_vars = {
            "SEED_USER_EMAIL": seed_email,
            "SEED_USER_PASSWORD": seed_password,
        }

        # First run
        with patch.dict(os.environ, env_vars):
            await run_seed(db=test_db)

        lib_count_after_first = await test_db.scalar(
            select(func.count(RecipeLibrary.id))
        )

        # Second run raises error
        with patch.dict(os.environ, env_vars):
            with pytest.raises(SeedUserExistsError):
                await run_seed(db=test_db, reset=False)

        lib_count_after_second = await test_db.scalar(
            select(func.count(RecipeLibrary.id))
        )
        assert (
            lib_count_after_first == lib_count_after_second
        ), "Library count should not change on second run"

    @pytest.mark.asyncio
    async def test_seed_reset_clears_libraries_and_meal_plans(
        self, test_db: AsyncSession
    ):
        """Running seed with --reset should clear libraries and meal plans."""
        seed_email = "seeduser@example.com"
        seed_password = "seedpassword123"

        from scripts.seed import run_seed

        env_vars = {
            "SEED_USER_EMAIL": seed_email,
            "SEED_USER_PASSWORD": seed_password,
        }

        # First run
        with patch.dict(os.environ, env_vars):
            await run_seed(db=test_db)

        # Reset run
        with patch.dict(os.environ, env_vars):
            await run_seed(db=test_db, reset=True)

        # Should still have exactly 5 libraries and 1 meal plan (not doubled)
        lib_count = await test_db.scalar(select(func.count(RecipeLibrary.id)))
        assert lib_count == 5, f"Expected 5 libraries after reset, got {lib_count}"

        plan_count = await test_db.scalar(select(func.count(MealPlan.id)))
        assert plan_count == 1, f"Expected 1 meal plan after reset, got {plan_count}"

        entry_count = await test_db.scalar(select(func.count(MealPlanEntry.id)))
        assert entry_count == 7, f"Expected 7 entries after reset, got {entry_count}"
