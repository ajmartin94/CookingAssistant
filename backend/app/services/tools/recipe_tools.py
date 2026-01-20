"""
Recipe Tool Handlers

Tool handlers for AI-assisted recipe operations:
- create_recipe: Create a new recipe
- edit_recipe: Update an existing recipe
- suggest_substitutions: Suggest ingredient substitutions (read-only)
"""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.recipe import (
    RecipeCreate,
    RecipeUpdate,
    IngredientSchema,
    InstructionSchema,
)
from app.services.recipe_service import (
    create_recipe,
    get_recipe,
    update_recipe,
)


class RecipeToolError(Exception):
    """Exception raised when a recipe tool encounters an error."""

    pass


# Common ingredient substitution mappings for dietary requirements
SUBSTITUTION_MAP: dict[str, dict[str, dict[str, str]]] = {
    "dairy-free": {
        "butter": {
            "replacement": "coconut oil or vegan butter",
            "reason": "Plant-based fat substitute",
        },
        "milk": {
            "replacement": "oat milk or almond milk",
            "reason": "Non-dairy milk alternative",
        },
        "cream": {
            "replacement": "coconut cream",
            "reason": "Rich non-dairy cream substitute",
        },
        "cheese": {
            "replacement": "nutritional yeast or vegan cheese",
            "reason": "Dairy-free cheese alternative",
        },
        "yogurt": {
            "replacement": "coconut yogurt or soy yogurt",
            "reason": "Plant-based yogurt alternative",
        },
    },
    "vegan": {
        "butter": {
            "replacement": "coconut oil or vegan butter",
            "reason": "Plant-based fat substitute",
        },
        "milk": {
            "replacement": "oat milk or almond milk",
            "reason": "Non-dairy milk alternative",
        },
        "cream": {
            "replacement": "coconut cream",
            "reason": "Rich non-dairy cream substitute",
        },
        "cheese": {
            "replacement": "nutritional yeast or vegan cheese",
            "reason": "Dairy-free cheese alternative",
        },
        "yogurt": {
            "replacement": "coconut yogurt or soy yogurt",
            "reason": "Plant-based yogurt alternative",
        },
        "egg": {
            "replacement": "flax egg (1 tbsp ground flax + 3 tbsp water)",
            "reason": "Vegan egg substitute for binding",
        },
        "eggs": {
            "replacement": "flax eggs (1 tbsp ground flax + 3 tbsp water per egg)",
            "reason": "Vegan egg substitute for binding",
        },
        "honey": {
            "replacement": "maple syrup or agave",
            "reason": "Plant-based sweetener",
        },
    },
    "gluten-free": {
        "flour": {
            "replacement": "almond flour or gluten-free all-purpose flour",
            "reason": "Gluten-free flour substitute",
        },
        "bread crumbs": {
            "replacement": "gluten-free bread crumbs or crushed rice crackers",
            "reason": "Gluten-free coating option",
        },
        "pasta": {
            "replacement": "rice pasta or gluten-free pasta",
            "reason": "Gluten-free pasta alternative",
        },
        "soy sauce": {
            "replacement": "tamari or coconut aminos",
            "reason": "Gluten-free soy sauce alternative",
        },
    },
}


async def create_recipe_handler(
    db: AsyncSession,
    user: User,
    title: str | None = None,
    description: str | None = None,
    ingredients: list[dict[str, Any]] | None = None,
    instructions: list[dict[str, Any]] | None = None,
    prep_time_minutes: int | None = None,
    cook_time_minutes: int | None = None,
    servings: int | None = None,
    cuisine_type: str | None = None,
    dietary_tags: list[str] | None = None,
) -> dict[str, Any]:
    """
    Create a new recipe.

    Args:
        db: Database session
        user: User creating the recipe
        title: Recipe title (required)
        description: Recipe description
        ingredients: List of ingredients (required)
        instructions: List of instructions (required)
        prep_time_minutes: Preparation time in minutes
        cook_time_minutes: Cooking time in minutes
        servings: Number of servings
        cuisine_type: Type of cuisine
        dietary_tags: List of dietary tags

    Returns:
        Dict with success status and recipe details

    Raises:
        RecipeToolError: If required fields are missing or service fails
    """
    # Validate required fields
    if not title:
        raise RecipeToolError("Missing required field: title")
    if not ingredients:
        raise RecipeToolError("Missing required field: ingredients")
    if not instructions:
        raise RecipeToolError("Missing required field: instructions")
    if len(ingredients) == 0:
        raise RecipeToolError("ingredients list cannot be empty")

    try:
        # Convert dict ingredients to IngredientSchema objects
        ingredient_schemas = [
            IngredientSchema(
                name=ing["name"],
                amount=ing["amount"],
                unit=ing["unit"],
                notes=ing.get("notes"),
            )
            for ing in ingredients
        ]

        # Convert dict instructions to InstructionSchema objects
        instruction_schemas = [
            InstructionSchema(
                step_number=inst["step_number"],
                instruction=inst["instruction"],
                duration_minutes=inst.get("duration_minutes"),
            )
            for inst in instructions
        ]

        # Build RecipeCreate schema
        recipe_create = RecipeCreate(
            title=title,
            description=description,
            ingredients=ingredient_schemas,
            instructions=instruction_schemas,
            prep_time_minutes=prep_time_minutes,
            cook_time_minutes=cook_time_minutes,
            servings=servings or 4,
            cuisine_type=cuisine_type,
            dietary_tags=dietary_tags,
            source_url=None,
            source_name=None,
            image_url=None,
        )

        # Call the recipe service
        recipe = await create_recipe(db=db, recipe_create=recipe_create, user=user)

        return {
            "success": True,
            "recipe_id": recipe.id,
            "title": recipe.title,
        }

    except RecipeToolError:
        raise
    except Exception as e:
        raise RecipeToolError(f"Failed to create recipe: {e}") from e


async def edit_recipe_handler(
    db: AsyncSession,
    user: User,
    recipe_id: str | None = None,
    title: str | None = None,
    description: str | None = None,
    ingredients: list[dict[str, Any]] | None = None,
    instructions: list[dict[str, Any]] | None = None,
    prep_time_minutes: int | None = None,
    cook_time_minutes: int | None = None,
    servings: int | None = None,
    cuisine_type: str | None = None,
    dietary_tags: list[str] | None = None,
) -> dict[str, Any]:
    """
    Edit an existing recipe.

    Args:
        db: Database session
        user: User editing the recipe
        recipe_id: ID of the recipe to edit (required)
        title: New recipe title
        description: New recipe description
        ingredients: New list of ingredients
        instructions: New list of instructions
        prep_time_minutes: New preparation time in minutes
        cook_time_minutes: New cooking time in minutes
        servings: New number of servings
        cuisine_type: New cuisine type
        dietary_tags: New list of dietary tags

    Returns:
        Dict with success status and recipe details

    Raises:
        RecipeToolError: If recipe not found, not authorized, or service fails
    """
    # Validate required fields
    if not recipe_id:
        raise RecipeToolError("Missing required field: recipe_id")

    try:
        # Fetch the recipe
        recipe = await get_recipe(db=db, recipe_id=recipe_id)
        if recipe is None:
            raise RecipeToolError(f"Recipe not found: {recipe_id}")

        # Check ownership
        if recipe.owner_id != user.id:
            raise RecipeToolError(
                f"Not authorized to edit recipe: {recipe_id}. User is not the owner."
            )

        # Convert ingredients if provided
        ingredient_schemas = None
        if ingredients is not None:
            ingredient_schemas = [
                IngredientSchema(
                    name=ing["name"],
                    amount=ing["amount"],
                    unit=ing["unit"],
                    notes=ing.get("notes"),
                )
                for ing in ingredients
            ]

        # Convert instructions if provided
        instruction_schemas = None
        if instructions is not None:
            instruction_schemas = [
                InstructionSchema(
                    step_number=inst["step_number"],
                    instruction=inst["instruction"],
                    duration_minutes=inst.get("duration_minutes"),
                )
                for inst in instructions
            ]

        # Build RecipeUpdate schema with only provided fields
        recipe_update = RecipeUpdate(
            title=title,
            description=description,
            ingredients=ingredient_schemas,
            instructions=instruction_schemas,
            prep_time_minutes=prep_time_minutes,
            cook_time_minutes=cook_time_minutes,
            servings=servings,
            cuisine_type=cuisine_type,
            dietary_tags=dietary_tags,
            source_url=None,
            source_name=None,
            image_url=None,
        )

        # Call the recipe service
        updated_recipe = await update_recipe(
            db=db, recipe=recipe, recipe_update=recipe_update
        )

        return {
            "success": True,
            "recipe_id": updated_recipe.id,
            "title": updated_recipe.title,
        }

    except RecipeToolError:
        raise
    except Exception as e:
        raise RecipeToolError(f"Failed to update recipe: {e}") from e


async def suggest_substitutions_handler(
    db: AsyncSession,
    user: User,
    recipe_id: str | None = None,
    dietary_requirement: str | None = None,
) -> dict[str, Any]:
    """
    Suggest ingredient substitutions for a recipe.

    This is a read-only operation that does NOT modify the recipe.

    Args:
        db: Database session
        user: User requesting substitutions
        recipe_id: ID of the recipe (required)
        dietary_requirement: Dietary requirement for substitutions
            (e.g., "dairy-free", "vegan", "gluten-free")

    Returns:
        Dict with success status and list of substitutions

    Raises:
        RecipeToolError: If recipe not found
    """
    # Validate required fields
    if not recipe_id:
        raise RecipeToolError("Missing required field: recipe_id")

    # Fetch the recipe
    recipe = await get_recipe(db=db, recipe_id=recipe_id)
    if recipe is None:
        raise RecipeToolError(f"Recipe not found: {recipe_id}")

    # Get the substitution map for the dietary requirement
    substitution_map = SUBSTITUTION_MAP.get(dietary_requirement or "", {})

    # Find matching substitutions based on recipe ingredients
    substitutions: list[dict[str, str]] = []

    # Handle both dict and list ingredients (recipe may have raw JSON or models)
    ingredients = recipe.ingredients or []
    for ingredient in ingredients:
        # Get ingredient name (handle both dict and object)
        if isinstance(ingredient, dict):
            name = ingredient.get("name", "").lower()
        else:
            name = getattr(ingredient, "name", "").lower()

        # Check if any substitution keyword matches
        for keyword, sub_info in substitution_map.items():
            if keyword in name:
                substitutions.append(
                    {
                        "original": name,
                        "replacement": sub_info["replacement"],
                        "reason": sub_info["reason"],
                    }
                )
                break  # Only one substitution per ingredient

    return {
        "success": True,
        "recipe_id": recipe_id,
        "substitutions": substitutions,
    }


def get_recipe_tool_handlers() -> dict[str, Any]:
    """
    Get all recipe tool handlers for registration with ToolExecutor.

    Returns:
        Dict mapping tool name to async handler function
    """
    return {
        "create_recipe": create_recipe_handler,
        "edit_recipe": edit_recipe_handler,
        "suggest_substitutions": suggest_substitutions_handler,
    }
