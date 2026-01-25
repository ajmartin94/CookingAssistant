"""
Unit Tests for Response Parser

Tests for parse_chat_response() which extracts structured data
(text messages and recipe JSON) from raw LLM responses.

Test coverage (3 tests per revised plan):
1. Response parser extracts text and JSON recipe from well-formed response
2. Response parser validates required fields: title, ingredients, instructions
3. Response parser returns error for malformed JSON
"""

from app.ai.response_parser import parse_chat_response


class TestResponseParser:
    """Unit tests for response parser."""

    def test_extracts_text_and_json_recipe_from_well_formed_response(self):
        """Response parser extracts both message text and JSON recipe block."""
        # SETUP
        raw_text = (
            "Here's a great pasta recipe for you!\n\n"
            "```json\n"
            "{\n"
            '  "title": "Simple Garlic Pasta",\n'
            '  "description": "A quick and easy garlic pasta dish.",\n'
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
        assert (
            result.proposed_recipe["description"]
            == "A quick and easy garlic pasta dish."
        )
        assert len(result.proposed_recipe["ingredients"]) == 2
        assert len(result.proposed_recipe["instructions"]) == 2

    def test_validates_required_fields_title_ingredients_instructions(self):
        """Response parser validates required fields: title, ingredients, instructions."""
        # Test missing title
        raw_no_title = (
            "Here's your recipe:\n\n"
            "```json\n"
            '{"ingredients": [{"name": "flour", "amount": "2", "unit": "cups"}], '
            '"instructions": [{"step_number": 1, "instruction": "Mix"}]}\n'
            "```"
        )
        result = parse_chat_response(raw_no_title)
        assert result.error is not None
        assert result.proposed_recipe is None

        # Test missing ingredients
        raw_no_ingredients = (
            "Here's your recipe:\n\n"
            "```json\n"
            '{"title": "Test Recipe", '
            '"instructions": [{"step_number": 1, "instruction": "Mix"}]}\n'
            "```"
        )
        result = parse_chat_response(raw_no_ingredients)
        assert result.error is not None
        assert result.proposed_recipe is None

        # Test missing instructions
        raw_no_instructions = (
            "Here's your recipe:\n\n"
            "```json\n"
            '{"title": "Test Recipe", '
            '"ingredients": [{"name": "flour", "amount": "2", "unit": "cups"}]}\n'
            "```"
        )
        result = parse_chat_response(raw_no_instructions)
        assert result.error is not None
        assert result.proposed_recipe is None

        # Test empty ingredients list
        raw_empty_ingredients = (
            "Here's your recipe:\n\n"
            "```json\n"
            '{"title": "Test Recipe", "ingredients": [], '
            '"instructions": [{"step_number": 1, "instruction": "Mix"}]}\n'
            "```"
        )
        result = parse_chat_response(raw_empty_ingredients)
        assert result.error is not None
        assert result.proposed_recipe is None

        # Test empty instructions list
        raw_empty_instructions = (
            "Here's your recipe:\n\n"
            "```json\n"
            '{"title": "Test Recipe", '
            '"ingredients": [{"name": "flour", "amount": "2", "unit": "cups"}], '
            '"instructions": []}\n'
            "```"
        )
        result = parse_chat_response(raw_empty_instructions)
        assert result.error is not None
        assert result.proposed_recipe is None

    def test_returns_error_for_malformed_json(self):
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
