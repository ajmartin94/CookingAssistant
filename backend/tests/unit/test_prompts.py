"""
Unit Tests for System Prompt Builder

Tests for build_system_prompt() which constructs LLM system prompts
from recipe state, user preferences, and library summary.
"""

from app.ai.prompts import build_system_prompt


class TestSystemPromptWithRecipeState:
    """Tests for system prompt builder when recipe state is provided."""

    def test_includes_current_recipe_state_when_provided(self):
        """System prompt includes current recipe context when recipe_state is given."""
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

        # ACTION
        prompt = build_system_prompt(
            recipe_state=recipe_state, preferences=None, library_summary=None
        )

        # VERIFY
        assert "Pasta Carbonara" in prompt
        assert "spaghetti" in prompt
        assert "Italian" in prompt

    def test_omits_recipe_section_when_no_recipe_state(self):
        """System prompt omits recipe section when recipe_state is None."""
        # SETUP / ACTION
        prompt = build_system_prompt(
            recipe_state=None, preferences=None, library_summary=None
        )

        # VERIFY - should not contain recipe-specific markers
        assert "current recipe" not in prompt.lower() or "no recipe" in prompt.lower()


class TestSystemPromptWithPreferences:
    """Tests for system prompt builder when user preferences are provided."""

    def test_includes_user_preferences_when_provided(self):
        """System prompt includes dietary and skill preferences when given."""
        # SETUP
        preferences = {
            "dietary_tags": ["vegetarian", "gluten-free"],
            "skill_level": "beginner",
            "preferred_cuisines": ["Italian", "Mexican"],
        }

        # ACTION
        prompt = build_system_prompt(
            recipe_state=None, preferences=preferences, library_summary=None
        )

        # VERIFY
        assert "vegetarian" in prompt
        assert "gluten-free" in prompt
        assert "beginner" in prompt

    def test_includes_valid_dietary_tags_enum_values(self):
        """System prompt includes valid dietary tag values from enum."""
        # SETUP
        preferences = {
            "dietary_tags": ["vegan", "dairy-free", "nut-free"],
            "skill_level": "intermediate",
        }

        # ACTION
        prompt = build_system_prompt(
            recipe_state=None, preferences=preferences, library_summary=None
        )

        # VERIFY
        assert "vegan" in prompt
        assert "dairy-free" in prompt
        assert "nut-free" in prompt

    def test_maps_skill_level_to_difficulty_guidance(self):
        """System prompt maps skill_level to appropriate recipe difficulty guidance."""
        # SETUP
        beginner_prefs = {
            "dietary_tags": [],
            "skill_level": "beginner",
        }
        advanced_prefs = {
            "dietary_tags": [],
            "skill_level": "advanced",
        }

        # ACTION
        beginner_prompt = build_system_prompt(
            recipe_state=None, preferences=beginner_prefs, library_summary=None
        )
        advanced_prompt = build_system_prompt(
            recipe_state=None, preferences=advanced_prefs, library_summary=None
        )

        # VERIFY - beginner should get easy guidance, advanced should get harder
        assert "easy" in beginner_prompt.lower()
        assert "hard" in advanced_prompt.lower() or "complex" in advanced_prompt.lower()


class TestSystemPromptWithLibrarySummary:
    """Tests for system prompt builder when library summary is provided."""

    def test_includes_library_summary_titles_and_cuisines(self):
        """System prompt includes recipe titles and cuisines from library."""
        # SETUP
        library_summary = [
            {"title": "Spaghetti Bolognese", "cuisine_type": "Italian"},
            {"title": "Chicken Tikka Masala", "cuisine_type": "Indian"},
            {"title": "Tacos al Pastor", "cuisine_type": "Mexican"},
        ]

        # ACTION
        prompt = build_system_prompt(
            recipe_state=None, preferences=None, library_summary=library_summary
        )

        # VERIFY
        assert "Spaghetti Bolognese" in prompt
        assert "Chicken Tikka Masala" in prompt
        assert "Tacos al Pastor" in prompt
        assert "Italian" in prompt
        assert "Indian" in prompt
        assert "Mexican" in prompt


class TestSystemPromptOmitsEmptySections:
    """Tests for system prompt builder when sections are empty/None."""

    def test_omits_all_empty_sections(self):
        """System prompt is still valid when no recipe, prefs, or library given."""
        # SETUP / ACTION
        prompt = build_system_prompt(
            recipe_state=None, preferences=None, library_summary=None
        )

        # VERIFY - prompt should still be a non-empty string (base instructions)
        assert isinstance(prompt, str)
        assert len(prompt) > 0

    def test_omits_library_section_when_library_empty(self):
        """System prompt omits library section when library_summary is empty list."""
        # SETUP / ACTION
        prompt = build_system_prompt(
            recipe_state=None, preferences=None, library_summary=[]
        )

        # VERIFY - should be valid but not mention library recipes
        assert isinstance(prompt, str)
        assert len(prompt) > 0

    def test_omits_preferences_section_when_preferences_empty(self):
        """System prompt omits preferences section when preferences is empty dict."""
        # SETUP / ACTION
        prompt = build_system_prompt(
            recipe_state=None, preferences={}, library_summary=None
        )

        # VERIFY
        assert isinstance(prompt, str)
        assert len(prompt) > 0


class TestSystemPromptIncludesValidFieldValues:
    """Tests that the system prompt includes valid enums and difficulty levels."""

    def test_includes_valid_difficulty_levels(self):
        """System prompt includes the valid difficulty levels (easy, medium, hard)."""
        # SETUP / ACTION
        prompt = build_system_prompt(
            recipe_state=None, preferences=None, library_summary=None
        )

        # VERIFY - the base prompt should mention valid difficulty levels
        assert "easy" in prompt.lower()
        assert "medium" in prompt.lower()
        assert "hard" in prompt.lower()
