"""
Unit Tests for Recipe Tool Handlers

TDD tests for the recipe-specific tools (create, edit, substitutions).
These tests are written before implementation (red phase).

Tests cover:
- create_recipe tool (calls recipe service correctly)
- edit_recipe tool (partial updates work)
- suggest_substitutions tool (read-only, returns suggestions)
- Tool parameter validation
- Service error handling (recipe not found, permission denied)
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# =============================================================================
# create_recipe Tool Tests
# =============================================================================


class TestCreateRecipeTool:
    """Tests for the create_recipe tool handler."""

    @pytest.mark.asyncio
    async def test_create_recipe_calls_recipe_service(self):
        """Test that create_recipe tool calls recipe_service.create_recipe."""
        from app.services.tools.recipe_tools import create_recipe_handler

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            title="Pasta Carbonara",
        )

        with patch(
            "app.services.tools.recipe_tools.create_recipe",
            new_callable=AsyncMock,
            return_value=mock_recipe,
        ) as mock_create:
            result = await create_recipe_handler(
                db=mock_db,
                user=mock_user,
                title="Pasta Carbonara",
                ingredients=[
                    {"name": "pasta", "amount": "400", "unit": "g"},
                    {"name": "eggs", "amount": "4", "unit": "whole"},
                ],
                instructions=[
                    {"step_number": 1, "instruction": "Boil pasta"},
                    {"step_number": 2, "instruction": "Mix eggs"},
                ],
            )

            mock_create.assert_called_once()
            assert result["success"] is True
            assert result["recipe_id"] == "recipe_456"

    @pytest.mark.asyncio
    async def test_create_recipe_with_all_optional_fields(self):
        """Test create_recipe with all optional parameters."""
        from app.services.tools.recipe_tools import create_recipe_handler

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            title="Full Recipe",
        )

        with patch(
            "app.services.tools.recipe_tools.create_recipe",
            new_callable=AsyncMock,
            return_value=mock_recipe,
        ) as mock_create:
            _ = await create_recipe_handler(
                db=mock_db,
                user=mock_user,
                title="Full Recipe",
                description="A complete recipe",
                ingredients=[{"name": "ingredient", "amount": "1", "unit": "cup"}],
                instructions=[{"step_number": 1, "instruction": "Do something"}],
                prep_time_minutes=15,
                cook_time_minutes=30,
                servings=4,
                cuisine_type="Italian",
                dietary_tags=["vegetarian", "gluten-free"],
            )

            mock_create.assert_called_once()
            # Verify optional fields were passed through
            call_args = mock_create.call_args
            recipe_data = call_args[1]["recipe_create"]
            assert recipe_data.description == "A complete recipe"
            assert recipe_data.prep_time_minutes == 15
            assert recipe_data.cook_time_minutes == 30
            assert recipe_data.servings == 4
            assert recipe_data.cuisine_type == "Italian"
            assert recipe_data.dietary_tags == ["vegetarian", "gluten-free"]

    @pytest.mark.asyncio
    async def test_create_recipe_returns_recipe_details(self):
        """Test that create_recipe returns the new recipe details."""
        from app.services.tools.recipe_tools import create_recipe_handler

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            title="Test Recipe",
        )

        with patch(
            "app.services.tools.recipe_tools.create_recipe",
            new_callable=AsyncMock,
            return_value=mock_recipe,
        ):
            result = await create_recipe_handler(
                db=mock_db,
                user=mock_user,
                title="Test Recipe",
                ingredients=[{"name": "item", "amount": "1", "unit": "piece"}],
                instructions=[{"step_number": 1, "instruction": "Step 1"}],
            )

            assert result["success"] is True
            assert result["recipe_id"] == "recipe_456"
            assert result["title"] == "Test Recipe"


# =============================================================================
# edit_recipe Tool Tests
# =============================================================================


class TestEditRecipeTool:
    """Tests for the edit_recipe tool handler."""

    @pytest.mark.asyncio
    async def test_edit_recipe_calls_recipe_service(self):
        """Test that edit_recipe tool calls recipe_service.update_recipe."""
        from app.services.tools.recipe_tools import edit_recipe_handler

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            owner_id="user_123",
            title="Updated Recipe",
        )

        with (
            patch(
                "app.services.tools.recipe_tools.get_recipe",
                new_callable=AsyncMock,
                return_value=mock_recipe,
            ),
            patch(
                "app.services.tools.recipe_tools.update_recipe",
                new_callable=AsyncMock,
                return_value=mock_recipe,
            ) as mock_update,
        ):
            result = await edit_recipe_handler(
                db=mock_db,
                user=mock_user,
                recipe_id="recipe_456",
                title="Updated Recipe",
            )

            mock_update.assert_called_once()
            assert result["success"] is True
            assert result["recipe_id"] == "recipe_456"

    @pytest.mark.asyncio
    async def test_edit_recipe_partial_update_title_only(self):
        """Test edit_recipe with only title update (partial update)."""
        from app.services.tools.recipe_tools import edit_recipe_handler

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            owner_id="user_123",
            title="New Title",
        )

        with (
            patch(
                "app.services.tools.recipe_tools.get_recipe",
                new_callable=AsyncMock,
                return_value=mock_recipe,
            ),
            patch(
                "app.services.tools.recipe_tools.update_recipe",
                new_callable=AsyncMock,
                return_value=mock_recipe,
            ) as mock_update,
        ):
            result = await edit_recipe_handler(
                db=mock_db,
                user=mock_user,
                recipe_id="recipe_456",
                title="New Title",
            )

            # Verify only title was in the update
            call_args = mock_update.call_args
            recipe_update = call_args[1]["recipe_update"]
            assert recipe_update.title == "New Title"
            assert result["success"] is True

    @pytest.mark.asyncio
    async def test_edit_recipe_updates_ingredients(self):
        """Test edit_recipe can update ingredients list."""
        from app.services.tools.recipe_tools import edit_recipe_handler

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            owner_id="user_123",
            title="Recipe",
        )

        with (
            patch(
                "app.services.tools.recipe_tools.get_recipe",
                new_callable=AsyncMock,
                return_value=mock_recipe,
            ),
            patch(
                "app.services.tools.recipe_tools.update_recipe",
                new_callable=AsyncMock,
                return_value=mock_recipe,
            ) as mock_update,
        ):
            new_ingredients = [
                {"name": "new ingredient", "amount": "2", "unit": "cups"},
            ]

            result = await edit_recipe_handler(
                db=mock_db,
                user=mock_user,
                recipe_id="recipe_456",
                ingredients=new_ingredients,
            )

            call_args = mock_update.call_args
            recipe_update = call_args[1]["recipe_update"]
            assert recipe_update.ingredients is not None
            assert result["success"] is True

    @pytest.mark.asyncio
    async def test_edit_recipe_updates_instructions(self):
        """Test edit_recipe can update instructions list."""
        from app.services.tools.recipe_tools import edit_recipe_handler

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            owner_id="user_123",
            title="Recipe",
        )

        with (
            patch(
                "app.services.tools.recipe_tools.get_recipe",
                new_callable=AsyncMock,
                return_value=mock_recipe,
            ),
            patch(
                "app.services.tools.recipe_tools.update_recipe",
                new_callable=AsyncMock,
                return_value=mock_recipe,
            ) as mock_update,
        ):
            new_instructions = [
                {"step_number": 1, "instruction": "Updated step 1"},
                {"step_number": 2, "instruction": "New step 2"},
            ]

            result = await edit_recipe_handler(
                db=mock_db,
                user=mock_user,
                recipe_id="recipe_456",
                instructions=new_instructions,
            )

            call_args = mock_update.call_args
            recipe_update = call_args[1]["recipe_update"]
            assert recipe_update.instructions is not None
            assert result["success"] is True


# =============================================================================
# suggest_substitutions Tool Tests
# =============================================================================


class TestSuggestSubstitutionsTool:
    """Tests for the suggest_substitutions tool handler."""

    @pytest.mark.asyncio
    async def test_suggest_substitutions_returns_suggestions(self):
        """Test that suggest_substitutions returns substitution suggestions."""
        from app.services.tools.recipe_tools import suggest_substitutions_handler

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            owner_id="user_123",
            title="Recipe with Dairy",
            ingredients=[
                {"name": "butter", "amount": "100", "unit": "g"},
                {"name": "milk", "amount": "200", "unit": "ml"},
            ],
        )

        with patch(
            "app.services.tools.recipe_tools.get_recipe",
            new_callable=AsyncMock,
            return_value=mock_recipe,
        ):
            result = await suggest_substitutions_handler(
                db=mock_db,
                user=mock_user,
                recipe_id="recipe_456",
                dietary_requirement="dairy-free",
            )

            assert result["success"] is True
            assert "substitutions" in result
            assert isinstance(result["substitutions"], list)

    @pytest.mark.asyncio
    async def test_suggest_substitutions_is_read_only(self):
        """Test that suggest_substitutions does NOT modify the recipe."""
        from app.services.tools.recipe_tools import suggest_substitutions_handler

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            owner_id="user_123",
            ingredients=[{"name": "butter", "amount": "100", "unit": "g"}],
        )

        with (
            patch(
                "app.services.tools.recipe_tools.get_recipe",
                new_callable=AsyncMock,
                return_value=mock_recipe,
            ),
            patch(
                "app.services.tools.recipe_tools.update_recipe",
                new_callable=AsyncMock,
            ) as mock_update,
        ):
            await suggest_substitutions_handler(
                db=mock_db,
                user=mock_user,
                recipe_id="recipe_456",
            )

            # update_recipe should NOT be called
            mock_update.assert_not_called()

    @pytest.mark.asyncio
    async def test_suggest_substitutions_includes_original_and_replacement(self):
        """Test that each substitution includes original, replacement, and reason."""
        from app.services.tools.recipe_tools import suggest_substitutions_handler

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            owner_id="user_123",
            ingredients=[{"name": "butter", "amount": "100", "unit": "g"}],
        )

        with patch(
            "app.services.tools.recipe_tools.get_recipe",
            new_callable=AsyncMock,
            return_value=mock_recipe,
        ):
            result = await suggest_substitutions_handler(
                db=mock_db,
                user=mock_user,
                recipe_id="recipe_456",
                dietary_requirement="vegan",
            )

            # If substitutions are returned, each should have required fields
            if result["substitutions"]:
                for sub in result["substitutions"]:
                    assert "original" in sub
                    assert "replacement" in sub
                    assert "reason" in sub


# =============================================================================
# Parameter Validation Tests
# =============================================================================


class TestToolParameterValidation:
    """Tests for tool parameter validation."""

    @pytest.mark.asyncio
    async def test_create_recipe_missing_title_raises(self):
        """Test that create_recipe raises error when title is missing."""
        from app.services.tools.recipe_tools import (
            create_recipe_handler,
            RecipeToolError,
        )

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")

        with pytest.raises(RecipeToolError) as exc_info:
            await create_recipe_handler(
                db=mock_db,
                user=mock_user,
                # title is missing
                ingredients=[{"name": "item", "amount": "1", "unit": "piece"}],
                instructions=[{"step_number": 1, "instruction": "Step 1"}],
            )

        assert "title" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_create_recipe_missing_ingredients_raises(self):
        """Test that create_recipe raises error when ingredients are missing."""
        from app.services.tools.recipe_tools import (
            create_recipe_handler,
            RecipeToolError,
        )

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")

        with pytest.raises(RecipeToolError) as exc_info:
            await create_recipe_handler(
                db=mock_db,
                user=mock_user,
                title="Test Recipe",
                # ingredients missing
                instructions=[{"step_number": 1, "instruction": "Step 1"}],
            )

        assert "ingredients" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_create_recipe_missing_instructions_raises(self):
        """Test that create_recipe raises error when instructions are missing."""
        from app.services.tools.recipe_tools import (
            create_recipe_handler,
            RecipeToolError,
        )

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")

        with pytest.raises(RecipeToolError) as exc_info:
            await create_recipe_handler(
                db=mock_db,
                user=mock_user,
                title="Test Recipe",
                ingredients=[{"name": "item", "amount": "1", "unit": "piece"}],
                # instructions missing
            )

        assert "instructions" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_create_recipe_empty_ingredients_raises(self):
        """Test that create_recipe raises error when ingredients list is empty."""
        from app.services.tools.recipe_tools import (
            create_recipe_handler,
            RecipeToolError,
        )

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")

        with pytest.raises(RecipeToolError) as exc_info:
            await create_recipe_handler(
                db=mock_db,
                user=mock_user,
                title="Test Recipe",
                ingredients=[],  # empty list
                instructions=[{"step_number": 1, "instruction": "Step 1"}],
            )

        assert "ingredients" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_edit_recipe_missing_recipe_id_raises(self):
        """Test that edit_recipe raises error when recipe_id is missing."""
        from app.services.tools.recipe_tools import (
            edit_recipe_handler,
            RecipeToolError,
        )

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")

        with pytest.raises(RecipeToolError) as exc_info:
            await edit_recipe_handler(
                db=mock_db,
                user=mock_user,
                # recipe_id missing
                title="New Title",
            )

        assert "recipe_id" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_suggest_substitutions_missing_recipe_id_raises(self):
        """Test that suggest_substitutions raises error when recipe_id is missing."""
        from app.services.tools.recipe_tools import (
            suggest_substitutions_handler,
            RecipeToolError,
        )

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")

        with pytest.raises(RecipeToolError) as exc_info:
            await suggest_substitutions_handler(
                db=mock_db,
                user=mock_user,
                # recipe_id missing
            )

        assert "recipe_id" in str(exc_info.value).lower()


# =============================================================================
# Service Error Handling Tests
# =============================================================================


class TestServiceErrorHandling:
    """Tests for service error handling in tool handlers."""

    @pytest.mark.asyncio
    async def test_edit_recipe_not_found_raises(self):
        """Test that edit_recipe raises error when recipe is not found."""
        from app.services.tools.recipe_tools import (
            edit_recipe_handler,
            RecipeToolError,
        )

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")

        with patch(
            "app.services.tools.recipe_tools.get_recipe",
            new_callable=AsyncMock,
            return_value=None,  # Recipe not found
        ):
            with pytest.raises(RecipeToolError) as exc_info:
                await edit_recipe_handler(
                    db=mock_db,
                    user=mock_user,
                    recipe_id="nonexistent_123",
                    title="New Title",
                )

            assert "not found" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_edit_recipe_permission_denied_raises(self):
        """Test that edit_recipe raises error when user doesn't own the recipe."""
        from app.services.tools.recipe_tools import (
            edit_recipe_handler,
            RecipeToolError,
        )

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            owner_id="different_user",  # Different owner
        )

        with patch(
            "app.services.tools.recipe_tools.get_recipe",
            new_callable=AsyncMock,
            return_value=mock_recipe,
        ):
            with pytest.raises(RecipeToolError) as exc_info:
                await edit_recipe_handler(
                    db=mock_db,
                    user=mock_user,
                    recipe_id="recipe_456",
                    title="New Title",
                )

            assert (
                "permission" in str(exc_info.value).lower()
                or "authorized" in str(exc_info.value).lower()
                or "owner" in str(exc_info.value).lower()
            )

    @pytest.mark.asyncio
    async def test_suggest_substitutions_recipe_not_found_raises(self):
        """Test that suggest_substitutions raises error when recipe not found."""
        from app.services.tools.recipe_tools import (
            suggest_substitutions_handler,
            RecipeToolError,
        )

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")

        with patch(
            "app.services.tools.recipe_tools.get_recipe",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(RecipeToolError) as exc_info:
                await suggest_substitutions_handler(
                    db=mock_db,
                    user=mock_user,
                    recipe_id="nonexistent_123",
                )

            assert "not found" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_create_recipe_service_error_propagates(self):
        """Test that service errors are properly propagated."""
        from app.services.tools.recipe_tools import (
            create_recipe_handler,
            RecipeToolError,
        )

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")

        with patch(
            "app.services.tools.recipe_tools.create_recipe",
            new_callable=AsyncMock,
            side_effect=Exception("Database connection failed"),
        ):
            with pytest.raises(RecipeToolError) as exc_info:
                await create_recipe_handler(
                    db=mock_db,
                    user=mock_user,
                    title="Test Recipe",
                    ingredients=[{"name": "item", "amount": "1", "unit": "piece"}],
                    instructions=[{"step_number": 1, "instruction": "Step 1"}],
                )

            assert (
                "database" in str(exc_info.value).lower()
                or "failed" in str(exc_info.value).lower()
            )

    @pytest.mark.asyncio
    async def test_edit_recipe_service_error_propagates(self):
        """Test that update service errors are properly propagated."""
        from app.services.tools.recipe_tools import (
            edit_recipe_handler,
            RecipeToolError,
        )

        mock_db = AsyncMock()
        mock_user = MagicMock(id="user_123")
        mock_recipe = MagicMock(
            id="recipe_456",
            owner_id="user_123",
        )

        with (
            patch(
                "app.services.tools.recipe_tools.get_recipe",
                new_callable=AsyncMock,
                return_value=mock_recipe,
            ),
            patch(
                "app.services.tools.recipe_tools.update_recipe",
                new_callable=AsyncMock,
                side_effect=Exception("Update failed"),
            ),
        ):
            with pytest.raises(RecipeToolError) as exc_info:
                await edit_recipe_handler(
                    db=mock_db,
                    user=mock_user,
                    recipe_id="recipe_456",
                    title="New Title",
                )

            assert "failed" in str(exc_info.value).lower()


# =============================================================================
# Tool Handler Registration Tests
# =============================================================================


class TestToolHandlerRegistration:
    """Tests for registering tool handlers with the executor."""

    @pytest.mark.asyncio
    async def test_recipe_tools_can_be_registered(self):
        """Test that recipe tool handlers can be registered with executor."""
        from app.services.tools.executor import ToolExecutor
        from app.services.tools.recipe_tools import get_recipe_tool_handlers

        executor = ToolExecutor()
        handlers = get_recipe_tool_handlers()

        for name, handler in handlers.items():
            executor.register_tool(name, handler)

        assert executor.has_tool("create_recipe")
        assert executor.has_tool("edit_recipe")
        assert executor.has_tool("suggest_substitutions")

    @pytest.mark.asyncio
    async def test_registered_handlers_are_callable(self):
        """Test that registered handlers are async callables."""
        from app.services.tools.recipe_tools import get_recipe_tool_handlers
        import inspect

        handlers = get_recipe_tool_handlers()

        for name, handler in handlers.items():
            assert callable(handler), f"{name} handler is not callable"
            assert inspect.iscoroutinefunction(handler), f"{name} handler is not async"
