"""
Unit Tests for Response Parser

Tests for parse_chat_response() which extracts structured data
(text messages and recipe JSON) from raw LLM responses.
"""

from app.ai.response_parser import parse_chat_response


class TestParseWellFormedResponse:
    """Tests for parsing well-formed LLM responses with text and JSON."""

    def test_extracts_text_and_json_recipe_from_well_formed_response(self):
        """Response parser extracts both message text and JSON recipe block."""
        # SETUP
        raw_text = (
            "Here's a great pasta recipe for you!\n\n"
            "```json\n"
            "{\n"
            '  "title": "Simple Garlic Pasta",\n'
            '  "ingredients": [\n'
            '    {"name": "spaghetti", "amount": "400", "unit": "g"},\n'
            '    {"name": "garlic", "amount": "4", "unit": "cloves"}\n'
            "  ],\n"
            '  "instructions": [\n'
            '    {"step_number": 1, "instruction": "Boil pasta until al dente"},\n'
            '    {"step_number": 2, "instruction": "Saute garlic in olive oil"}\n'
            "  ]\n"
            "}\n"
            "```\n\n"
            "Let me know if you'd like any modifications!"
        )

        # ACTION
        result = parse_chat_response(raw_text)

        # VERIFY
        assert result.error is None
        assert "great pasta recipe" in result.message
        assert result.proposed_recipe is not None
        assert result.proposed_recipe["title"] == "Simple Garlic Pasta"
        assert len(result.proposed_recipe["ingredients"]) == 2
        assert len(result.proposed_recipe["instructions"]) == 2


class TestParseTextOnlyResponse:
    """Tests for parsing responses without JSON blocks."""

    def test_returns_text_only_when_no_json_block_present(self):
        """Response parser returns text message with no recipe when no JSON found."""
        # SETUP
        raw_text = (
            "I'd be happy to help you cook! What kind of cuisine are you "
            "interested in today? I can suggest Italian, Mexican, or Asian dishes."
        )

        # ACTION
        result = parse_chat_response(raw_text)

        # VERIFY
        assert result.message == raw_text
        assert result.proposed_recipe is None
        assert result.error is None


class TestParseMalformedJSON:
    """Tests for handling malformed JSON in responses."""

    def test_returns_error_when_json_is_malformed(self):
        """Response parser returns error when JSON block is not valid JSON."""
        # SETUP
        raw_text = (
            "Here's a recipe:\n\n"
            "```json\n"
            "{\n"
            '  "title": "Broken Recipe",\n'
            '  "ingredients": [INVALID JSON HERE\n'
            "}\n"
            "```"
        )

        # ACTION
        result = parse_chat_response(raw_text)

        # VERIFY
        assert result.error is not None
        assert result.proposed_recipe is None
        # The text message should still be extracted
        assert "recipe" in result.message.lower()


class TestParseIncompleteRecipe:
    """Tests for validating recipe completeness."""

    def test_rejects_recipe_missing_title(self):
        """Response parser rejects recipe JSON missing required 'title' field."""
        # SETUP
        raw_text = (
            "Here's your recipe:\n\n"
            "```json\n"
            "{\n"
            '  "ingredients": [\n'
            '    {"name": "flour", "amount": "2", "unit": "cups"}\n'
            "  ],\n"
            '  "instructions": [\n'
            '    {"step_number": 1, "instruction": "Mix everything"}\n'
            "  ]\n"
            "}\n"
            "```"
        )

        # ACTION
        result = parse_chat_response(raw_text)

        # VERIFY
        assert result.error is not None
        assert result.proposed_recipe is None

    def test_rejects_recipe_missing_ingredients(self):
        """Response parser rejects recipe JSON missing required 'ingredients' field."""
        # SETUP
        raw_text = (
            "Here's your recipe:\n\n"
            "```json\n"
            "{\n"
            '  "title": "No Ingredients Recipe",\n'
            '  "instructions": [\n'
            '    {"step_number": 1, "instruction": "Do something"}\n'
            "  ]\n"
            "}\n"
            "```"
        )

        # ACTION
        result = parse_chat_response(raw_text)

        # VERIFY
        assert result.error is not None
        assert result.proposed_recipe is None

    def test_rejects_recipe_missing_instructions(self):
        """Response parser rejects recipe JSON missing required 'instructions' field."""
        # SETUP
        raw_text = (
            "Here's your recipe:\n\n"
            "```json\n"
            "{\n"
            '  "title": "No Instructions Recipe",\n'
            '  "ingredients": [\n'
            '    {"name": "flour", "amount": "2", "unit": "cups"}\n'
            "  ]\n"
            "}\n"
            "```"
        )

        # ACTION
        result = parse_chat_response(raw_text)

        # VERIFY
        assert result.error is not None
        assert result.proposed_recipe is None

    def test_rejects_recipe_with_empty_ingredients_list(self):
        """Response parser rejects recipe with empty ingredients list."""
        # SETUP
        raw_text = (
            "Here's your recipe:\n\n"
            "```json\n"
            "{\n"
            '  "title": "Empty Ingredients Recipe",\n'
            '  "ingredients": [],\n'
            '  "instructions": [\n'
            '    {"step_number": 1, "instruction": "Do something"}\n'
            "  ]\n"
            "}\n"
            "```"
        )

        # ACTION
        result = parse_chat_response(raw_text)

        # VERIFY
        assert result.error is not None
        assert result.proposed_recipe is None

    def test_rejects_recipe_with_empty_instructions_list(self):
        """Response parser rejects recipe with empty instructions list."""
        # SETUP
        raw_text = (
            "Here's your recipe:\n\n"
            "```json\n"
            "{\n"
            '  "title": "Empty Instructions Recipe",\n'
            '  "ingredients": [\n'
            '    {"name": "flour", "amount": "2", "unit": "cups"}\n'
            "  ],\n"
            '  "instructions": []\n'
            "}\n"
            "```"
        )

        # ACTION
        result = parse_chat_response(raw_text)

        # VERIFY
        assert result.error is not None
        assert result.proposed_recipe is None


class TestParseAcceptsPartialOptionalFields:
    """Tests that parser accepts valid recipes with optional fields missing."""

    def test_accepts_valid_recipe_without_source_url(self):
        """Response parser accepts complete recipe without optional sourceUrl."""
        # SETUP
        raw_text = (
            "Here's your recipe:\n\n"
            "```json\n"
            "{\n"
            '  "title": "Simple Salad",\n'
            '  "ingredients": [\n'
            '    {"name": "lettuce", "amount": "1", "unit": "head"},\n'
            '    {"name": "tomato", "amount": "2", "unit": "whole"}\n'
            "  ],\n"
            '  "instructions": [\n'
            '    {"step_number": 1, "instruction": "Wash and chop lettuce"},\n'
            '    {"step_number": 2, "instruction": "Slice tomatoes and combine"}\n'
            "  ]\n"
            "}\n"
            "```"
        )

        # ACTION
        result = parse_chat_response(raw_text)

        # VERIFY
        assert result.error is None
        assert result.proposed_recipe is not None
        assert result.proposed_recipe["title"] == "Simple Salad"
        assert len(result.proposed_recipe["ingredients"]) == 2
        assert len(result.proposed_recipe["instructions"]) == 2
        # sourceUrl is not required
        assert (
            "source_url" not in result.proposed_recipe
            or result.proposed_recipe.get("source_url") is None
        )
