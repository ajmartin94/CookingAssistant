"""
Test Provider

Deterministic canned response provider for testing the AI chat flow
without making real LLM API calls.
"""

from app.ai.schemas import ChatMessage


# Canned recipe response for creation prompts
CANNED_RECIPE_RESPONSE = """Here's a delicious recipe for you!

```json
{
  "title": "Classic Chocolate Cake",
  "ingredients": [
    {"name": "all-purpose flour", "amount": "2", "unit": "cups"},
    {"name": "sugar", "amount": "1.5", "unit": "cups"},
    {"name": "cocoa powder", "amount": "0.75", "unit": "cups"},
    {"name": "eggs", "amount": "3", "unit": "whole"},
    {"name": "butter", "amount": "0.5", "unit": "cups"}
  ],
  "instructions": [
    {"step_number": 1, "instruction": "Preheat oven to 350F (175C)"},
    {"step_number": 2, "instruction": "Mix dry ingredients: flour, sugar, and cocoa powder"},
    {"step_number": 3, "instruction": "Beat eggs and melted butter into dry mixture"},
    {"step_number": 4, "instruction": "Pour batter into greased 9-inch pan"},
    {"step_number": 5, "instruction": "Bake for 30-35 minutes until toothpick comes out clean"}
  ],
  "cuisine_type": "American",
  "difficulty_level": "medium",
  "prep_time_minutes": 15,
  "cook_time_minutes": 35,
  "servings": 8
}
```

Let me know if you'd like any modifications to this recipe!"""

# Canned text-only response for conversational prompts
CANNED_CONVERSATIONAL_RESPONSE = (
    "That's a great question! Here are some tips for storing fresh herbs: "
    "wrap them loosely in a damp paper towel, place them in a resealable bag, "
    "and store in the refrigerator. Most herbs will stay fresh for about a week "
    "this way. Basil is an exception - it does better at room temperature in a "
    "glass of water, like fresh flowers."
)

# Keywords that indicate a recipe creation request
CREATION_KEYWORDS = ["create", "make", "recipe for", "cook", "bake", "prepare"]


class TestProvider:
    """
    Test provider that returns deterministic canned responses.

    Used when model is set to "test" to allow full integration testing
    without external API calls.
    """

    async def complete(self, messages: list[ChatMessage]) -> str:
        """
        Return a canned response based on message content.

        If any user message contains creation keywords (create, make, etc.),
        returns a full recipe JSON response. Otherwise returns a text-only
        conversational response.

        Args:
            messages: List of ChatMessage objects in the conversation.

        Returns:
            A canned response string.
        """
        # Check user messages for creation keywords
        for msg in messages:
            if msg.role == "user":
                content_lower = msg.content.lower()
                if any(keyword in content_lower for keyword in CREATION_KEYWORDS):
                    return CANNED_RECIPE_RESPONSE

        return CANNED_CONVERSATIONAL_RESPONSE
