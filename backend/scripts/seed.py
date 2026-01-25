"""
Seed Data Script

CLI script that populates the local database with a test user and recipes.
Useful for development and demo purposes.

Usage:
    python -m scripts.seed           # Create seed data (exits if user exists)
    python -m scripts.seed --reset   # Wipe and re-create seed data
    python -m scripts.seed --help    # Show help
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.recipe import Recipe
from app.services.auth_service import get_password_hash


class SeedConfigError(Exception):
    """Raised when required configuration is missing."""

    pass


class SeedUserExistsError(Exception):
    """Raised when seed user already exists and --reset not specified."""

    pass


class SeedFixtureError(Exception):
    """Raised when fixture file is missing or malformed."""

    pass


def get_fixtures_path() -> str:
    """Get the default path to the recipes fixture file."""
    return str(Path(__file__).parent / "fixtures" / "recipes.json")


def load_fixtures(fixtures_path: str) -> list[dict]:
    """
    Load recipe fixtures from JSON file.

    Args:
        fixtures_path: Path to the fixtures JSON file

    Returns:
        List of recipe dictionaries

    Raises:
        SeedFixtureError: If file doesn't exist or JSON is malformed
    """
    try:
        with open(fixtures_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, list):
                raise SeedFixtureError(
                    f"Fixture file must contain a JSON array, got {type(data).__name__}"
                )
            return data
    except FileNotFoundError:
        raise SeedFixtureError(f"Fixture file not found: {fixtures_path}")
    except json.JSONDecodeError as e:
        raise SeedFixtureError(f"Invalid JSON in fixture file: {e}")


async def run_seed(
    db: AsyncSession,
    reset: bool = False,
    fixtures_path: Optional[str] = None,
) -> None:
    """
    Run the seed script to populate the database.

    Args:
        db: Database session
        reset: If True, delete existing seed user and recipes first
        fixtures_path: Optional path to fixtures file (defaults to built-in fixtures)

    Raises:
        SeedConfigError: If SEED_USER_EMAIL or SEED_USER_PASSWORD not set
        SeedUserExistsError: If seed user exists and reset=False
        SeedFixtureError: If fixtures file is invalid
    """
    # Get configuration from environment
    seed_email = os.environ.get("SEED_USER_EMAIL")
    seed_password = os.environ.get("SEED_USER_PASSWORD")

    if not seed_email:
        raise SeedConfigError(
            "SEED_USER_EMAIL environment variable is required. "
            "Set it to the email address for the seed user."
        )

    if not seed_password:
        raise SeedConfigError(
            "SEED_USER_PASSWORD environment variable is required. "
            "Set it to the password for the seed user."
        )

    # Load fixtures
    if fixtures_path is None:
        fixtures_path = get_fixtures_path()

    recipes_data = load_fixtures(fixtures_path)

    # Check if seed user already exists
    result = await db.execute(select(User).where(User.email == seed_email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if not reset:
            raise SeedUserExistsError(
                f"Seed user already exists with email '{seed_email}'. "
                "Use --reset to delete and re-create seed data."
            )

        # Delete existing user (cascade deletes recipes)
        await db.execute(delete(Recipe).where(Recipe.owner_id == existing_user.id))
        await db.execute(delete(User).where(User.id == existing_user.id))
        await db.commit()

    # Create seed user
    seed_user = User(
        username=seed_email.split("@")[0],  # Use email prefix as username
        email=seed_email,
        full_name="Seed User",
        hashed_password=get_password_hash(seed_password),
        is_active=True,
    )
    db.add(seed_user)
    await db.commit()
    await db.refresh(seed_user)

    # Create recipes
    for recipe_data in recipes_data:
        recipe = Recipe(
            title=recipe_data["title"],
            description=recipe_data.get("description"),
            ingredients=recipe_data["ingredients"],
            instructions=recipe_data["instructions"],
            prep_time_minutes=recipe_data.get("prep_time_minutes"),
            cook_time_minutes=recipe_data.get("cook_time_minutes"),
            total_time_minutes=recipe_data.get("total_time_minutes"),
            servings=recipe_data.get("servings", 4),
            cuisine_type=recipe_data.get("cuisine_type"),
            dietary_tags=recipe_data.get("dietary_tags"),
            difficulty_level=recipe_data.get("difficulty_level", "medium"),
            source_name=recipe_data.get("source_name"),
            owner_id=seed_user.id,
        )
        db.add(recipe)

    await db.commit()


async def main(reset: bool = False) -> None:
    """Main entry point for the seed script."""
    # Import here to avoid circular imports and allow env to be set first
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            await run_seed(db, reset=reset)
            print("Seed data created successfully!")
        except SeedConfigError as e:
            print(f"Configuration error: {e}", file=sys.stderr)
            sys.exit(1)
        except SeedUserExistsError as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
        except SeedFixtureError as e:
            print(f"Fixture error: {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Seed the database with a test user and sample recipes."
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing seed user and recipes, then re-create",
    )
    args = parser.parse_args()

    asyncio.run(main(reset=args.reset))
