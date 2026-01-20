"""
LLM Smoke Tests

Smoke tests that verify the LLM integration works end-to-end with a real model.
These tests require Ollama running locally with a model pulled.

Run with: pytest tests/smoke/ -v
Skip in CI with: pytest -m "not smoke"
"""

import pytest

from app.services.llm.service import LLMService, LLMServiceError
from app.api.chat import TOOL_DEFINITIONS


# Custom marker for smoke tests - these hit real LLM and are slow
pytestmark = [
    pytest.mark.smoke,
    pytest.mark.slow,
    pytest.mark.integration,
]


@pytest.fixture
def llm_service() -> LLMService:
    """Create a real LLM service instance."""
    return LLMService()


@pytest.fixture
def basic_messages() -> list[dict]:
    """Simple test messages."""
    return [
        {"role": "user", "content": "Hello, what can you help me with?"},
    ]


@pytest.fixture
def recipe_request_messages() -> list[dict]:
    """Messages that should trigger recipe creation tool."""
    return [
        {
            "role": "system",
            "content": """You are a helpful cooking assistant. You help users create, edit, and improve recipes.

You have access to the following tools:
- create_recipe: Create a new recipe with title, ingredients, and instructions
- edit_recipe: Modify an existing recipe
- suggest_substitutions: Suggest ingredient substitutions (read-only, no confirmation needed)

When the user asks you to create or modify a recipe, use the appropriate tool.
Be conversational and helpful. Ask clarifying questions if needed.

Current context: No specific context""",
        },
        {
            "role": "user",
            "content": "Create a simple recipe for scrambled eggs with 2 eggs, salt, and butter.",
        },
    ]


class TestLLMBasicResponse:
    """Test that the LLM returns valid response structures."""

    @pytest.mark.asyncio
    async def test_returns_valid_response_structure(
        self, llm_service: LLMService, basic_messages: list[dict]
    ):
        """Test that model returns response with expected structure."""
        response = await llm_service.chat(
            messages=basic_messages,
            tools=None,
            stream=False,
        )

        # Verify response structure
        assert response is not None
        assert hasattr(response, "choices")
        assert len(response.choices) > 0

        # Verify message structure
        message = response.choices[0].message
        assert hasattr(message, "role")
        assert hasattr(message, "content")
        assert message.role == "assistant"

    @pytest.mark.asyncio
    async def test_response_contains_meaningful_content(
        self, llm_service: LLMService, basic_messages: list[dict]
    ):
        """Test that model returns non-empty, meaningful content."""
        response = await llm_service.chat(
            messages=basic_messages,
            tools=None,
            stream=False,
        )

        content = response.choices[0].message.content
        assert content is not None
        assert len(content.strip()) > 0
        # Should get a meaningful response, not just whitespace
        assert len(content.strip()) > 10

    @pytest.mark.asyncio
    async def test_streaming_response_works(
        self, llm_service: LLMService, basic_messages: list[dict]
    ):
        """Test that streaming responses work and accumulate content."""
        chunks = []

        async for chunk in llm_service.chat(
            messages=basic_messages,
            tools=None,
            stream=True,
        ):
            chunks.append(chunk)

        # Should receive multiple chunks
        assert len(chunks) > 0

        # At least one chunk should have content
        has_content = any(
            hasattr(c, "choices")
            and c.choices
            and hasattr(c.choices[0], "delta")
            and c.choices[0].delta.content
            for c in chunks
        )
        assert has_content


class TestLLMToolCalling:
    """Test that the LLM uses tools when prompted appropriately."""

    @pytest.mark.asyncio
    async def test_uses_create_recipe_tool_when_asked(
        self, llm_service: LLMService, recipe_request_messages: list[dict]
    ):
        """Test that model calls create_recipe tool when asked to create a recipe."""
        response = await llm_service.chat(
            messages=recipe_request_messages,
            tools=TOOL_DEFINITIONS,
            stream=False,
        )

        message = response.choices[0].message

        # Model should use create_recipe tool
        assert (
            message.tool_calls is not None
        ), "Model should use tools for recipe creation"
        assert len(message.tool_calls) > 0

        # Find create_recipe call
        tool_names = [tc.function.name for tc in message.tool_calls]
        assert (
            "create_recipe" in tool_names
        ), f"Expected create_recipe tool, got: {tool_names}"

    @pytest.mark.asyncio
    async def test_tool_call_has_valid_structure(
        self, llm_service: LLMService, recipe_request_messages: list[dict]
    ):
        """Test that tool calls have required structure."""
        response = await llm_service.chat(
            messages=recipe_request_messages,
            tools=TOOL_DEFINITIONS,
            stream=False,
        )

        message = response.choices[0].message
        assert message.tool_calls is not None

        for tool_call in message.tool_calls:
            # Verify tool call structure
            assert hasattr(tool_call, "id")
            assert hasattr(tool_call, "function")
            assert hasattr(tool_call.function, "name")
            assert hasattr(tool_call.function, "arguments")

            # ID should be non-empty
            assert tool_call.id is not None
            assert len(tool_call.id) > 0

    @pytest.mark.asyncio
    async def test_does_not_use_tools_for_general_chat(self, llm_service: LLMService):
        """Test that model doesn't use tools for general conversation."""
        messages = [
            {
                "role": "system",
                "content": "You are a helpful cooking assistant.",
            },
            {
                "role": "user",
                "content": "What's the difference between baking and roasting?",
            },
        ]

        response = await llm_service.chat(
            messages=messages,
            tools=TOOL_DEFINITIONS,
            stream=False,
        )

        message = response.choices[0].message

        # Should NOT use tools for informational question
        # (may have content instead, or empty tool_calls)
        if message.tool_calls:
            # If there are tool calls, none should be recipe creation tools
            tool_names = [tc.function.name for tc in message.tool_calls]
            assert (
                "create_recipe" not in tool_names
            ), "Should not create recipe for informational question"


class TestRecipeSchemaGeneration:
    """Test that recipe generation produces valid schema."""

    @pytest.mark.asyncio
    async def test_generated_recipe_has_required_fields(
        self, llm_service: LLMService, recipe_request_messages: list[dict]
    ):
        """Test that generated recipe contains required fields."""
        import json

        response = await llm_service.chat(
            messages=recipe_request_messages,
            tools=TOOL_DEFINITIONS,
            stream=False,
        )

        message = response.choices[0].message
        assert message.tool_calls is not None

        # Find create_recipe call
        create_recipe_call = None
        for tc in message.tool_calls:
            if tc.function.name == "create_recipe":
                create_recipe_call = tc
                break

        assert create_recipe_call is not None, "Expected create_recipe tool call"

        # Parse arguments
        args = json.loads(create_recipe_call.function.arguments)

        # Check required fields per TOOL_DEFINITIONS
        assert "title" in args, "Recipe must have title"
        assert "ingredients" in args, "Recipe must have ingredients"
        assert "instructions" in args, "Recipe must have instructions"

    @pytest.mark.asyncio
    async def test_generated_ingredients_have_valid_structure(
        self, llm_service: LLMService, recipe_request_messages: list[dict]
    ):
        """Test that generated ingredients follow the expected schema."""
        import json

        response = await llm_service.chat(
            messages=recipe_request_messages,
            tools=TOOL_DEFINITIONS,
            stream=False,
        )

        message = response.choices[0].message
        assert message.tool_calls is not None

        # Find create_recipe call
        create_recipe_call = None
        for tc in message.tool_calls:
            if tc.function.name == "create_recipe":
                create_recipe_call = tc
                break

        assert create_recipe_call is not None
        args = json.loads(create_recipe_call.function.arguments)

        ingredients = args.get("ingredients", [])
        assert len(ingredients) > 0, "Recipe should have at least one ingredient"

        for ing in ingredients:
            # Required fields per schema
            assert "name" in ing, f"Ingredient missing name: {ing}"
            assert "amount" in ing, f"Ingredient missing amount: {ing}"
            assert "unit" in ing, f"Ingredient missing unit: {ing}"

    @pytest.mark.asyncio
    async def test_generated_instructions_have_valid_structure(
        self, llm_service: LLMService, recipe_request_messages: list[dict]
    ):
        """Test that generated instructions follow the expected schema."""
        import json

        response = await llm_service.chat(
            messages=recipe_request_messages,
            tools=TOOL_DEFINITIONS,
            stream=False,
        )

        message = response.choices[0].message
        assert message.tool_calls is not None

        # Find create_recipe call
        create_recipe_call = None
        for tc in message.tool_calls:
            if tc.function.name == "create_recipe":
                create_recipe_call = tc
                break

        assert create_recipe_call is not None
        args = json.loads(create_recipe_call.function.arguments)

        instructions = args.get("instructions", [])
        assert len(instructions) > 0, "Recipe should have at least one instruction"

        for inst in instructions:
            # Required fields per schema
            assert "step_number" in inst, f"Instruction missing step_number: {inst}"
            assert (
                "instruction" in inst
            ), f"Instruction missing instruction text: {inst}"


class TestLLMErrorHandling:
    """Test error handling for LLM unavailability."""

    @pytest.mark.asyncio
    async def test_handles_invalid_model_gracefully(self):
        """Test that service handles invalid model configuration."""
        from unittest.mock import patch

        # Create service with invalid model
        with patch("app.config.settings") as mock_settings:
            mock_settings.llm_model = "invalid/nonexistent-model"
            service = LLMService()
            service.model = "invalid/nonexistent-model"

            with pytest.raises(LLMServiceError):
                await service.chat(
                    messages=[{"role": "user", "content": "test"}],
                    stream=False,
                )
