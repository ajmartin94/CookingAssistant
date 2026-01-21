"""
Mock LLM Service for E2E Testing

Provides deterministic, predictable responses for e2e tests.
Pattern-matches user messages to return appropriate mock responses.
"""

import json
import re
from dataclasses import dataclass
from typing import Any
from unittest.mock import MagicMock


@dataclass
class MockToolCall:
    """Mock tool call data structure."""

    id: str
    name: str
    arguments: str


@dataclass
class MockMessage:
    """Mock message from LLM."""

    content: str | None
    tool_calls: list[MockToolCall] | None = None


@dataclass
class MockChoice:
    """Mock choice from LLM response."""

    message: MockMessage


@dataclass
class MockResponse:
    """Mock LLM response."""

    choices: list[MockChoice]


class MockLLMService:
    """
    Mock LLM service that returns deterministic responses for e2e testing.

    Patterns:
    - "create" + recipe-related words → create_recipe tool call
    - "edit" or "change" or "update" → edit_recipe tool call
    - "substitut" → suggest_substitutions tool call
    - Error triggers (specific phrases) → errors
    - Default → helpful text response
    """

    def __init__(self) -> None:
        self.model = "mock/e2e-test"
        self._call_count = 0

    def chat(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        stream: bool = True,
    ) -> "MockChatResponse":
        """Return a mock chat response based on message patterns."""
        return MockChatResponse(self, messages, tools, stream)


class MockChatResponse:
    """Mock chat response that mimics the real ChatResponse interface."""

    def __init__(
        self,
        service: MockLLMService,
        messages: list[dict],
        tools: list[dict] | None,
        stream: bool,
    ):
        self._service = service
        self._messages = messages
        self._tools = tools
        self._stream = stream

    def __await__(self):
        """Allow awaiting for non-streaming responses."""
        return self._complete_response().__await__()

    async def _complete_response(self) -> MockResponse:
        """Generate a mock response based on the user message."""
        # Get the last user message
        user_message = ""
        for msg in reversed(self._messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "").lower()
                break

        # Get context from system message
        context = self._extract_context()

        # Generate response based on patterns
        return self._generate_response(user_message, context)

    def _extract_context(self) -> dict[str, Any]:
        """Extract context from the system message."""
        context = {}
        for msg in self._messages:
            if msg.get("role") == "system":
                content = msg.get("content", "")
                # Parse recipe ID from context
                recipe_id_match = re.search(r"Recipe ID: ([a-zA-Z0-9-]+)", content)
                if recipe_id_match:
                    context["recipe_id"] = recipe_id_match.group(1)
                # Parse recipe title
                title_match = re.search(r"Recipe: ([^,\n]+)", content)
                if title_match:
                    context["recipe_title"] = title_match.group(1).strip()
                break
        return context

    def _generate_response(
        self, user_message: str, context: dict[str, Any]
    ) -> MockResponse:
        """Generate appropriate mock response based on patterns."""
        self._service._call_count += 1
        call_id = f"call_e2e_{self._service._call_count}"

        # Check for create recipe patterns
        if self._matches_create_recipe(user_message):
            return self._create_recipe_response(user_message, call_id)

        # Check for edit recipe patterns
        if self._matches_edit_recipe(user_message):
            return self._edit_recipe_response(user_message, context, call_id)

        # Check for substitution patterns
        if self._matches_substitution(user_message):
            return self._substitution_response(context, call_id)

        # Default: return a helpful text response
        return self._text_response(user_message)

    def _matches_create_recipe(self, message: str) -> bool:
        """Check if message requests recipe creation."""
        create_words = ["create", "make me", "give me", "new recipe"]
        recipe_words = ["recipe", "pasta", "cake", "dish", "meal"]
        has_create = any(word in message for word in create_words)
        has_recipe = any(word in message for word in recipe_words)
        return has_create and has_recipe

    def _matches_edit_recipe(self, message: str) -> bool:
        """Check if message requests recipe editing."""
        edit_words = ["edit", "change", "update", "modify", "rename"]
        return any(word in message for word in edit_words)

    def _matches_substitution(self, message: str) -> bool:
        """Check if message requests substitutions."""
        return "substitut" in message or "replace" in message

    def _create_recipe_response(self, message: str, call_id: str) -> MockResponse:
        """Generate a create_recipe tool call response."""
        # Determine recipe title based on message content
        if "pasta" in message or "carbonara" in message:
            title = "Classic Spaghetti Carbonara"
            ingredients = [
                {"name": "spaghetti", "amount": "400", "unit": "g", "notes": ""},
                {"name": "pancetta", "amount": "200", "unit": "g", "notes": "diced"},
                {"name": "egg yolks", "amount": "4", "unit": "whole", "notes": ""},
                {"name": "parmesan", "amount": "100", "unit": "g", "notes": "grated"},
            ]
            instructions = [
                {"step_number": 1, "instruction": "Cook pasta in salted water", "duration_minutes": 10},
                {"step_number": 2, "instruction": "Fry pancetta until crispy", "duration_minutes": 5},
                {"step_number": 3, "instruction": "Mix egg yolks with cheese", "duration_minutes": 2},
                {"step_number": 4, "instruction": "Combine all and serve", "duration_minutes": 3},
            ]
        elif "cake" in message:
            title = "Simple Vanilla Cake"
            ingredients = [
                {"name": "flour", "amount": "2", "unit": "cups", "notes": ""},
                {"name": "sugar", "amount": "1", "unit": "cup", "notes": ""},
                {"name": "eggs", "amount": "3", "unit": "whole", "notes": ""},
                {"name": "butter", "amount": "1/2", "unit": "cup", "notes": "softened"},
            ]
            instructions = [
                {"step_number": 1, "instruction": "Mix dry ingredients", "duration_minutes": 5},
                {"step_number": 2, "instruction": "Cream butter and sugar", "duration_minutes": 5},
                {"step_number": 3, "instruction": "Combine and bake at 350F", "duration_minutes": 30},
            ]
        else:
            # Generic recipe
            title = f"E2E Test Recipe {self._service._call_count}"
            ingredients = [
                {"name": "ingredient 1", "amount": "1", "unit": "cup", "notes": ""},
                {"name": "ingredient 2", "amount": "2", "unit": "tbsp", "notes": ""},
            ]
            instructions = [
                {"step_number": 1, "instruction": "Step 1", "duration_minutes": 5},
                {"step_number": 2, "instruction": "Step 2", "duration_minutes": 10},
            ]

        tool_args = {
            "title": title,
            "description": "A delicious recipe created via chat",
            "ingredients": ingredients,
            "instructions": instructions,
            "prep_time_minutes": 15,
            "cook_time_minutes": 30,
            "servings": 4,
        }

        tool_call = MockToolCall(
            id=call_id,
            name="create_recipe",
            arguments=json.dumps(tool_args),
        )

        # Create a MagicMock that mimics the LiteLLM tool call structure
        mock_tool_call = MagicMock()
        mock_tool_call.id = tool_call.id
        mock_tool_call.function = MagicMock()
        mock_tool_call.function.name = tool_call.name
        mock_tool_call.function.arguments = tool_call.arguments

        message = MockMessage(
            content="I'll create this recipe for you. Please review the details below.",
            tool_calls=[mock_tool_call],
        )

        return MockResponse(choices=[MockChoice(message=message)])

    def _edit_recipe_response(
        self, message: str, context: dict[str, Any], call_id: str
    ) -> MockResponse:
        """Generate an edit_recipe tool call response."""
        recipe_id = context.get("recipe_id", "unknown-recipe-id")

        tool_args = {
            "recipe_id": recipe_id,
            "title": f"Updated Title {self._service._call_count}",
        }

        tool_call = MockToolCall(
            id=call_id,
            name="edit_recipe",
            arguments=json.dumps(tool_args),
        )

        mock_tool_call = MagicMock()
        mock_tool_call.id = tool_call.id
        mock_tool_call.function = MagicMock()
        mock_tool_call.function.name = tool_call.name
        mock_tool_call.function.arguments = tool_call.arguments

        message = MockMessage(
            content="I'll update the recipe for you.",
            tool_calls=[mock_tool_call],
        )

        return MockResponse(choices=[MockChoice(message=message)])

    def _substitution_response(
        self, context: dict[str, Any], call_id: str
    ) -> MockResponse:
        """Generate a suggest_substitutions tool call response."""
        recipe_id = context.get("recipe_id", "unknown-recipe-id")

        tool_args = {
            "recipe_id": recipe_id,
            "dietary_requirement": "dairy-free",
        }

        tool_call = MockToolCall(
            id=call_id,
            name="suggest_substitutions",
            arguments=json.dumps(tool_args),
        )

        mock_tool_call = MagicMock()
        mock_tool_call.id = tool_call.id
        mock_tool_call.function = MagicMock()
        mock_tool_call.function.name = tool_call.name
        mock_tool_call.function.arguments = tool_call.arguments

        message = MockMessage(
            content=None,
            tool_calls=[mock_tool_call],
        )

        return MockResponse(choices=[MockChoice(message=message)])

    def _text_response(self, user_message: str) -> MockResponse:
        """Generate a simple text response."""
        if "hello" in user_message or "help" in user_message:
            content = "Hello! I'm your AI cooking assistant. How can I help you today?"
        elif "what am i looking at" in user_message:
            content = "I can see you're viewing a recipe. Would you like me to help you modify it or suggest variations?"
        else:
            content = "I'd be happy to help you with that! What would you like to do?"

        message = MockMessage(content=content, tool_calls=None)
        return MockResponse(choices=[MockChoice(message=message)])


# Singleton for e2e testing
_mock_llm_service: MockLLMService | None = None


def get_mock_llm_service() -> MockLLMService:
    """Get or create the mock LLM service singleton."""
    global _mock_llm_service
    if _mock_llm_service is None:
        _mock_llm_service = MockLLMService()
    return _mock_llm_service
