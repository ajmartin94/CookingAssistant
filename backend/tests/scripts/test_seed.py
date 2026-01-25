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
