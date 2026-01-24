"""
Response Parser

Extracts structured data (text messages and recipe JSON)
from raw LLM responses.
"""

import json
import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class ParsedResponse:
    """Parsed result from an LLM response."""

    message: str
    proposed_recipe: Optional[dict] = None
    error: Optional[str] = None


def parse_chat_response(raw_text: str) -> ParsedResponse:
    """
    Parse a raw LLM response into structured text and optional recipe JSON.

    Extracts text before/around ```json blocks as the message.
    Extracts JSON block content as proposed_recipe.
    Validates required fields: title (str), ingredients (list, len >= 1),
    instructions (list, len >= 1).

    Args:
        raw_text: The raw text response from the LLM.

    Returns:
        ParsedResponse with message, optional proposed_recipe, and optional error.
    """
    # Try to find a ```json ... ``` block
    json_pattern = re.compile(r"```json\s*\n(.*?)\n\s*```", re.DOTALL)
    match = json_pattern.search(raw_text)

    if not match:
        # No JSON block found - return text-only response
        return ParsedResponse(message=raw_text.strip())

    # Extract the text around the JSON block as the message
    json_start = match.start()
    json_end = match.end()

    text_before = raw_text[:json_start].strip()
    text_after = raw_text[json_end:].strip()

    # Combine text parts, filtering empty ones
    message_parts = [p for p in [text_before, text_after] if p]
    message = "\n\n".join(message_parts) if message_parts else ""

    # Try to parse the JSON
    json_str = match.group(1)
    try:
        recipe_data = json.loads(json_str)
    except json.JSONDecodeError as e:
        return ParsedResponse(
            message=message or raw_text.strip(),
            proposed_recipe=None,
            error=f"Malformed JSON in response: {str(e)}",
        )

    # Validate required fields
    validation_error = _validate_recipe(recipe_data)
    if validation_error:
        return ParsedResponse(
            message=message or raw_text.strip(),
            proposed_recipe=None,
            error=validation_error,
        )

    return ParsedResponse(
        message=message,
        proposed_recipe=recipe_data,
    )


def _validate_recipe(data: dict) -> Optional[str]:
    """
    Validate that a recipe dict has all required fields.

    Required:
    - title: str
    - ingredients: list with at least 1 item
    - instructions: list with at least 1 item

    Returns:
        Error message string if validation fails, None if valid.
    """
    if not isinstance(data.get("title"), str) or not data.get("title"):
        return "Recipe missing required field: title"

    ingredients = data.get("ingredients")
    if not isinstance(ingredients, list) or len(ingredients) < 1:
        return "Recipe missing or empty required field: ingredients"

    instructions = data.get("instructions")
    if not isinstance(instructions, list) or len(instructions) < 1:
        return "Recipe missing or empty required field: instructions"

    return None
