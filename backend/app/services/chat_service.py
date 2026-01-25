"""
Chat Service

Pure logic functions for chat context assembly and message history management.
"""

from typing import Optional

from app.ai.schemas import ChatMessage


def build_chat_context(
    preferences: Optional[dict] = None,
    current_recipe: Optional[dict] = None,
    library_summary: Optional[list[dict]] = None,
) -> str:
    """
    Build a context string from user preferences, current recipe state,
    and library summary for inclusion in the system prompt.

    Args:
        preferences: User preferences (dietary_tags, skill_level, etc.)
        current_recipe: Current recipe being discussed (title, ingredients, instructions)
        library_summary: List of recipe summaries from user's library

    Returns:
        A context string containing all relevant sections.
    """
    sections: list[str] = []

    # User preferences section
    if preferences and any(preferences.values()):
        pref_lines = ["User Preferences:"]
        if preferences.get("dietary_tags"):
            pref_lines.append(
                f"  Dietary restrictions: {', '.join(preferences['dietary_tags'])}"
            )
        if preferences.get("skill_level"):
            pref_lines.append(f"  Skill level: {preferences['skill_level']}")
        if preferences.get("preferred_cuisines"):
            pref_lines.append(
                f"  Preferred cuisines: {', '.join(preferences['preferred_cuisines'])}"
            )
        sections.append("\n".join(pref_lines))

    # Current recipe section
    if current_recipe:
        recipe_lines = ["Current Recipe:"]
        if current_recipe.get("title"):
            recipe_lines.append(f"  Title: {current_recipe['title']}")
        if current_recipe.get("ingredients"):
            ingredient_names = [
                ing.get("name", "") for ing in current_recipe["ingredients"]
            ]
            recipe_lines.append(f"  Ingredients: {', '.join(ingredient_names)}")
        if current_recipe.get("instructions"):
            instruction_texts = [
                inst.get("instruction", "") for inst in current_recipe["instructions"]
            ]
            recipe_lines.append("  Instructions:")
            for i, text in enumerate(instruction_texts, 1):
                recipe_lines.append(f"    {i}. {text}")
        sections.append("\n".join(recipe_lines))

    # Library summary section
    if library_summary:
        lib_lines = ["Recipe Library:"]
        for recipe in library_summary:
            title = recipe.get("title", "Untitled")
            cuisine = recipe.get("cuisine_type", "Unknown")
            lib_lines.append(f"  - {title} ({cuisine})")
        sections.append("\n".join(lib_lines))

    return "\n\n".join(sections)


def truncate_message_history(
    messages: list[ChatMessage], max_count: int = 20
) -> list[ChatMessage]:
    """
    Truncate message history to keep only the last max_count messages.

    Args:
        messages: Full list of chat messages.
        max_count: Maximum number of messages to retain (default 20).

    Returns:
        List of at most max_count messages, keeping the most recent.
    """
    if len(messages) <= max_count:
        return messages
    return messages[-max_count:]
