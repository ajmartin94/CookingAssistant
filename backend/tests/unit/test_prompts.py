"""
Unit Tests for System Prompt Builder

Tests for build_system_prompt() which constructs LLM system prompts
from recipe state, user preferences, and library summary.

Test coverage (3 tests per revised plan):
1. System prompt builder includes recipe state, user preferences, library summary
2. System prompt builder includes valid enum values (dietary tags, difficulty levels)
3. System prompt instructs AI to include description field in JSON schema
"""

from app.ai.prompts import build_system_prompt


class TestSystemPromptBuilder:
    """Unit tests for system prompt builder."""

    def test_includes_recipe_state_user_preferences_and_library_summary(self):
        """System prompt includes recipe state, user preferences, and library summary."""
        # SETUP
        recipe_state = {
            "title": "Pasta Carbonara",
            "ingredients": [
                {"name": "spaghetti", "amount": "400", "unit": "g"},
                {"name": "eggs", "amount": "4", "unit": "whole"},
            ],
            "instructions": [
                {"step_number": 1, "instruction": "Boil pasta"},
                {"step_number": 2, "instruction": "Mix eggs with cheese"},
            ],
            "cuisine_type": "Italian",
            "difficulty_level": "medium",
        }
        preferences = {
            "dietary_tags": ["vegetarian", "gluten-free"],
            "skill_level": "beginner",
            "preferred_cuisines": ["Italian", "Mexican"],
        }
        library_summary = [
            {"title": "Spaghetti Bolognese", "cuisine_type": "Italian"},
            {"title": "Chicken Tikka Masala", "cuisine_type": "Indian"},
        ]

        # ACTION
        prompt = build_system_prompt(
            recipe_state=recipe_state,
            preferences=preferences,
            library_summary=library_summary,
        )

        # VERIFY - recipe state is included
        assert "Pasta Carbonara" in prompt
        assert "spaghetti" in prompt
        assert "Italian" in prompt

        # VERIFY - user preferences are included
        assert "vegetarian" in prompt
        assert "gluten-free" in prompt
        assert "beginner" in prompt

        # VERIFY - library summary is included
        assert "Spaghetti Bolognese" in prompt
        assert "Chicken Tikka Masala" in prompt

    def test_includes_valid_enum_values_dietary_tags_and_difficulty_levels(self):
        """System prompt includes valid dietary tags and difficulty levels from enums."""
        # SETUP / ACTION
        prompt = build_system_prompt(
            recipe_state=None,
            preferences=None,
            library_summary=None,
        )

        # VERIFY - valid difficulty levels are mentioned
        assert "easy" in prompt.lower()
        assert "medium" in prompt.lower()
        assert "hard" in prompt.lower()

        # VERIFY - valid dietary tags are mentioned
        assert "vegetarian" in prompt.lower()
        assert "vegan" in prompt.lower()
        assert "gluten-free" in prompt.lower()
        assert "dairy-free" in prompt.lower()
        assert "nut-free" in prompt.lower()

    def test_instructs_ai_to_include_description_field_in_json_schema(self):
        """System prompt includes 'description' in the JSON schema so LLM returns it."""
        # SETUP / ACTION
        prompt = build_system_prompt(
            recipe_state=None,
            preferences=None,
            library_summary=None,
        )

        # VERIFY - the prompt must tell the LLM to include a description field
        assert "description" in prompt.lower()
        # Also verify it's in the schema section (near other fields)
        assert "title" in prompt.lower()
        assert "ingredients" in prompt.lower()
        assert "instructions" in prompt.lower()
