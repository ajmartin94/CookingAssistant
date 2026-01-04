"""
Test Data Factories

Factories for generating realistic test data using the Faker library.
"""

from faker import Faker
from typing import Optional
import uuid

from app.models.user import User
from app.models.recipe import Recipe, DifficultyLevel
from app.models.library import RecipeLibrary
from app.models.share import RecipeShare, SharePermission
from app.services.auth_service import get_password_hash

fake = Faker()


class UserFactory:
    """Factory for creating User instances"""

    @staticmethod
    def create(**kwargs) -> dict:
        """
        Create user data dict for testing.

        Args:
            **kwargs: Override default values

        Returns:
            dict: User data ready for database insertion
        """
        return {
            "id": kwargs.get("id", str(uuid.uuid4())),
            "username": kwargs.get("username", fake.user_name()),
            "email": kwargs.get("email", fake.email()),
            "full_name": kwargs.get("full_name", fake.name()),
            "hashed_password": kwargs.get(
                "hashed_password", get_password_hash("password123")
            ),
            "is_active": kwargs.get("is_active", True),
        }

    @staticmethod
    def build(**kwargs) -> User:
        """
        Build a User model instance (not saved to database).

        Args:
            **kwargs: Override default values

        Returns:
            User: User model instance
        """
        data = UserFactory.create(**kwargs)
        return User(**data)


class RecipeFactory:
    """Factory for creating Recipe instances"""

    @staticmethod
    def create_ingredients(count: int = 3) -> list[dict]:
        """Generate random ingredients list"""
        ingredients = [
            "flour",
            "sugar",
            "eggs",
            "butter",
            "milk",
            "salt",
            "pepper",
            "olive oil",
            "garlic",
            "onion",
            "tomatoes",
            "chicken",
            "beef",
            "pasta",
            "rice",
        ]
        units = ["cup", "cups", "tbsp", "tsp", "oz", "g", "kg", "lb", "whole", "clove"]

        return [
            {
                "name": fake.random_element(ingredients),
                "amount": str(fake.random_int(min=1, max=10)),
                "unit": fake.random_element(units),
                "notes": fake.sentence() if fake.boolean(chance_of_getting_true=30) else "",
            }
            for _ in range(count)
        ]

    @staticmethod
    def create_instructions(count: int = 5) -> list[dict]:
        """Generate random instructions list"""
        cooking_actions = [
            "Mix",
            "Stir",
            "Whisk",
            "Chop",
            "Dice",
            "Sauté",
            "Bake",
            "Boil",
            "Simmer",
            "Fry",
            "Grill",
            "Roast",
        ]

        return [
            {
                "step_number": i + 1,
                "instruction": f"{fake.random_element(cooking_actions)} {fake.sentence()}",
                "duration_minutes": fake.random_int(min=1, max=30),
            }
            for i in range(count)
        ]

    @staticmethod
    def create(owner_id: Optional[str] = None, library_id: Optional[str] = None, **kwargs) -> dict:
        """
        Create recipe data dict for testing.

        Args:
            owner_id: User ID who owns the recipe
            library_id: Optional library ID
            **kwargs: Override default values

        Returns:
            dict: Recipe data ready for database insertion
        """
        cuisine_types = [
            "Italian",
            "Mexican",
            "Chinese",
            "Indian",
            "French",
            "American",
            "Japanese",
            "Thai",
        ]
        dietary_tags = ["vegetarian", "vegan", "gluten-free", "dairy-free", "keto", "paleo"]

        prep_time = kwargs.get("prep_time_minutes", fake.random_int(min=5, max=60))
        cook_time = kwargs.get("cook_time_minutes", fake.random_int(min=10, max=120))

        return {
            "id": kwargs.get("id", str(uuid.uuid4())),
            "title": kwargs.get("title", f"{fake.word().title()} {fake.word().title()}"),
            "description": kwargs.get("description", fake.paragraph(nb_sentences=2)),
            "ingredients": kwargs.get("ingredients", RecipeFactory.create_ingredients()),
            "instructions": kwargs.get("instructions", RecipeFactory.create_instructions()),
            "prep_time_minutes": prep_time,
            "cook_time_minutes": cook_time,
            "total_time_minutes": kwargs.get("total_time_minutes", prep_time + cook_time),
            "servings": kwargs.get("servings", fake.random_int(min=1, max=8)),
            "cuisine_type": kwargs.get("cuisine_type", fake.random_element(cuisine_types)),
            "dietary_tags": kwargs.get(
                "dietary_tags",
                fake.random_elements(dietary_tags, length=fake.random_int(min=0, max=3), unique=True),
            ),
            "difficulty_level": kwargs.get(
                "difficulty_level",
                fake.random_element([DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD]).value,
            ),
            "source_url": kwargs.get("source_url", fake.url() if fake.boolean() else None),
            "source_name": kwargs.get("source_name", fake.name() if fake.boolean() else None),
            "notes": kwargs.get("notes", fake.paragraph() if fake.boolean() else None),
            "image_url": kwargs.get("image_url", fake.image_url() if fake.boolean() else None),
            "owner_id": owner_id or kwargs.get("owner_id", str(uuid.uuid4())),
            "library_id": library_id or kwargs.get("library_id"),
        }

    @staticmethod
    def build(owner_id: Optional[str] = None, library_id: Optional[str] = None, **kwargs) -> Recipe:
        """
        Build a Recipe model instance (not saved to database).

        Args:
            owner_id: User ID who owns the recipe
            library_id: Optional library ID
            **kwargs: Override default values

        Returns:
            Recipe: Recipe model instance
        """
        data = RecipeFactory.create(owner_id=owner_id, library_id=library_id, **kwargs)
        return Recipe(**data)


class LibraryFactory:
    """Factory for creating RecipeLibrary instances"""

    @staticmethod
    def create(owner_id: Optional[str] = None, **kwargs) -> dict:
        """
        Create library data dict for testing.

        Args:
            owner_id: User ID who owns the library
            **kwargs: Override default values

        Returns:
            dict: Library data ready for database insertion
        """
        return {
            "id": kwargs.get("id", str(uuid.uuid4())),
            "name": kwargs.get("name", f"{fake.word().title()} Library"),
            "description": kwargs.get("description", fake.sentence()),
            "is_public": kwargs.get("is_public", fake.boolean()),
            "owner_id": owner_id or kwargs.get("owner_id", str(uuid.uuid4())),
        }

    @staticmethod
    def build(owner_id: Optional[str] = None, **kwargs) -> RecipeLibrary:
        """
        Build a RecipeLibrary model instance (not saved to database).

        Args:
            owner_id: User ID who owns the library
            **kwargs: Override default values

        Returns:
            RecipeLibrary: Library model instance
        """
        data = LibraryFactory.create(owner_id=owner_id, **kwargs)
        return RecipeLibrary(**data)


class ShareFactory:
    """Factory for creating RecipeShare instances"""

    @staticmethod
    def create(
        shared_by_id: str,
        recipe_id: Optional[str] = None,
        library_id: Optional[str] = None,
        **kwargs,
    ) -> dict:
        """
        Create share data dict for testing.

        Args:
            shared_by_id: User ID who created the share
            recipe_id: Optional recipe ID to share
            library_id: Optional library ID to share
            **kwargs: Override default values

        Returns:
            dict: Share data ready for database insertion
        """
        import secrets

        return {
            "id": kwargs.get("id", str(uuid.uuid4())),
            "recipe_id": recipe_id or kwargs.get("recipe_id"),
            "library_id": library_id or kwargs.get("library_id"),
            "shared_by_id": shared_by_id,
            "shared_with_id": kwargs.get("shared_with_id"),  # None for public shares
            "share_token": kwargs.get("share_token", secrets.token_urlsafe(32)),
            "permission": kwargs.get(
                "permission",
                fake.random_element([SharePermission.VIEW, SharePermission.EDIT]).value,
            ),
            "expires_at": kwargs.get("expires_at"),  # None for no expiration
        }

    @staticmethod
    def build(
        shared_by_id: str,
        recipe_id: Optional[str] = None,
        library_id: Optional[str] = None,
        **kwargs,
    ) -> RecipeShare:
        """
        Build a RecipeShare model instance (not saved to database).

        Args:
            shared_by_id: User ID who created the share
            recipe_id: Optional recipe ID to share
            library_id: Optional library ID to share
            **kwargs: Override default values

        Returns:
            RecipeShare: Share model instance
        """
        data = ShareFactory.create(
            shared_by_id=shared_by_id, recipe_id=recipe_id, library_id=library_id, **kwargs
        )
        return RecipeShare(**data)
