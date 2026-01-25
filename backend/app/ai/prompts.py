"""
System Prompt Builder

Constructs LLM system prompts from recipe state, user preferences,
and library summary context.
"""

# Mapping from skill_level to difficulty guidance
SKILL_LEVEL_GUIDANCE = {
    "beginner": "Suggest easy recipes with simple techniques and common ingredients.",
    "intermediate": "Suggest recipes of moderate difficulty with some advanced techniques.",
    "advanced": "Suggest hard and complex recipes with advanced techniques and specialty ingredients.",
}

# Valid enum values for reference in prompts
VALID_DIETARY_TAGS = [
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "nut-free",
    "keto",
    "paleo",
    "low-carb",
    "halal",
    "kosher",
]

VALID_DIFFICULTY_LEVELS = ["easy", "medium", "hard"]


def build_system_prompt(
    recipe_state: dict | None,
    preferences: dict | None,
    library_summary: list[dict] | None,
) -> str:
    """
    Build a system prompt for the LLM from optional context.

    Sections are omitted when their data is None or empty.

    Args:
        recipe_state: Current recipe being worked on (title, ingredients, etc.)
        preferences: User preferences (dietary_tags, skill_level, preferred_cuisines)
        library_summary: List of recipe summaries from user's library

    Returns:
        A complete system prompt string.
    """
    sections: list[str] = []

    # Base instructions
    sections.append(
        "You are a helpful cooking assistant. "
        "You help users discover, create, and modify recipes.\n\n"
        "When suggesting a recipe, respond with descriptive text and optionally "
        "include a ```json block containing the complete recipe with the following structure:\n"
        '- "title" (string): The recipe name\n'
        '- "description" (string): A brief description of the recipe\n'
        '- "ingredients" (list): Each with "name", "amount", and "unit"\n'
        '- "instructions" (list): Each with "step_number" and "instruction"\n'
        '- Optional fields: "cuisine_type", "difficulty_level", "prep_time_minutes", '
        '"cook_time_minutes", "servings", "dietary_tags"\n\n'
        f"Valid difficulty levels: {', '.join(VALID_DIFFICULTY_LEVELS)}.\n"
        f"Valid dietary tags: {', '.join(VALID_DIETARY_TAGS)}."
    )

    # Recipe state section
    if recipe_state:
        recipe_lines = ["\n\n## Current Recipe Context"]
        if recipe_state.get("title"):
            recipe_lines.append(f"Title: {recipe_state['title']}")
        if recipe_state.get("cuisine_type"):
            recipe_lines.append(f"Cuisine: {recipe_state['cuisine_type']}")
        if recipe_state.get("difficulty_level"):
            recipe_lines.append(f"Difficulty: {recipe_state['difficulty_level']}")
        if recipe_state.get("ingredients"):
            ingredient_names = [
                ing.get("name", "") for ing in recipe_state["ingredients"]
            ]
            recipe_lines.append(f"Ingredients: {', '.join(ingredient_names)}")
        if recipe_state.get("instructions"):
            instruction_texts = [
                inst.get("instruction", "") for inst in recipe_state["instructions"]
            ]
            recipe_lines.append("Instructions:")
            for i, text in enumerate(instruction_texts, 1):
                recipe_lines.append(f"  {i}. {text}")
        sections.append("\n".join(recipe_lines))

    # User preferences section
    if preferences and any(preferences.values()):
        pref_lines = ["\n\n## User Preferences"]
        if preferences.get("dietary_tags"):
            pref_lines.append(
                f"Dietary restrictions: {', '.join(preferences['dietary_tags'])}"
            )
        if preferences.get("skill_level"):
            skill = preferences["skill_level"]
            pref_lines.append(f"Skill level: {skill}")
            guidance = SKILL_LEVEL_GUIDANCE.get(skill, "")
            if guidance:
                pref_lines.append(f"Guidance: {guidance}")
        if preferences.get("preferred_cuisines"):
            pref_lines.append(
                f"Preferred cuisines: {', '.join(preferences['preferred_cuisines'])}"
            )
        sections.append("\n".join(pref_lines))

    # Library summary section
    if library_summary:
        lib_lines = ["\n\n## User's Recipe Library"]
        lib_lines.append("The user already has these recipes:")
        for recipe in library_summary:
            title = recipe.get("title", "Untitled")
            cuisine = recipe.get("cuisine_type", "Unknown")
            lib_lines.append(f"- {title} ({cuisine})")
        sections.append("\n".join(lib_lines))

    return "".join(sections)
