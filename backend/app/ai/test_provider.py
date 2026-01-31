"""
Test Provider

Deterministic canned response provider for testing the AI chat flow
without making real LLM API calls.
"""

from app.ai.schemas import ChatMessage


# Canned recipe response for creation prompts (default: chocolate cake)
CANNED_CHOCOLATE_CAKE_RESPONSE = """Here's a delicious recipe for you!

```json
{
  "title": "Classic Chocolate Cake",
  "description": "A rich, moist chocolate cake perfect for any celebration.",
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

# Canned recipe response for spaghetti requests
CANNED_SPAGHETTI_RESPONSE = """Here's a classic Italian pasta dish for you!

```json
{
  "title": "Classic Spaghetti Bolognese",
  "description": "A hearty Italian pasta dish with rich meat sauce.",
  "ingredients": [
    {"name": "spaghetti", "amount": "400", "unit": "g"},
    {"name": "ground beef", "amount": "500", "unit": "g"},
    {"name": "onion", "amount": "1", "unit": "large"},
    {"name": "garlic", "amount": "3", "unit": "cloves"},
    {"name": "canned tomatoes", "amount": "400", "unit": "g"},
    {"name": "tomato paste", "amount": "2", "unit": "tbsp"},
    {"name": "olive oil", "amount": "2", "unit": "tbsp"},
    {"name": "salt", "amount": "1", "unit": "tsp"},
    {"name": "pepper", "amount": "0.5", "unit": "tsp"},
    {"name": "Italian herbs", "amount": "1", "unit": "tsp"}
  ],
  "instructions": [
    {"step_number": 1, "instruction": "Bring a large pot of salted water to boil for the pasta"},
    {"step_number": 2, "instruction": "Heat olive oil in a large pan, sauté onion until translucent"},
    {"step_number": 3, "instruction": "Add garlic and ground beef, cook until browned"},
    {"step_number": 4, "instruction": "Stir in tomatoes, tomato paste, and herbs. Simmer for 20 minutes"},
    {"step_number": 5, "instruction": "Cook spaghetti according to package directions, drain"},
    {"step_number": 6, "instruction": "Serve pasta topped with the meat sauce"}
  ],
  "cuisine_type": "Italian",
  "difficulty_level": "medium",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4
}
```

This is a family-friendly classic! Let me know if you'd like any modifications."""

# Backwards compatibility alias
CANNED_RECIPE_RESPONSE = CANNED_CHOCOLATE_CAKE_RESPONSE

# Canned recipe response for gluten-free modification requests
CANNED_GLUTEN_FREE_RESPONSE = """I've modified the recipe to be gluten-free!

```json
{
  "title": "Gluten-Free Pasta with Tomato Sauce",
  "description": "A delicious gluten-free pasta dish with fresh tomato sauce.",
  "ingredients": [
    {"name": "gluten-free pasta", "amount": "400", "unit": "g"},
    {"name": "tomato sauce", "amount": "200", "unit": "ml"},
    {"name": "olive oil", "amount": "2", "unit": "tbsp"},
    {"name": "garlic", "amount": "2", "unit": "cloves"},
    {"name": "basil", "amount": "0.25", "unit": "cups"}
  ],
  "instructions": [
    {"step_number": 1, "instruction": "Bring a large pot of salted water to boil"},
    {"step_number": 2, "instruction": "Cook gluten-free pasta according to package directions"},
    {"step_number": 3, "instruction": "In a pan, sauté garlic in olive oil until fragrant"},
    {"step_number": 4, "instruction": "Add tomato sauce and simmer for 10 minutes"},
    {"step_number": 5, "instruction": "Toss pasta with sauce and garnish with fresh basil"}
  ],
  "cuisine_type": "Italian",
  "difficulty_level": "easy",
  "prep_time_minutes": 10,
  "cook_time_minutes": 20,
  "servings": 4,
  "dietary_tags": ["gluten-free"]
}
```

This version uses gluten-free pasta instead of regular wheat pasta. Enjoy!"""

# Canned recipe response for modification requests (spicier, healthier, etc.)
CANNED_MODIFICATION_RESPONSE = """I've updated the recipe with your requested modifications!

```json
{
  "title": "Spicy Mango Chicken Curry",
  "description": "A fiery tropical curry with extra heat from fresh chilies.",
  "ingredients": [
    {"name": "chicken breast", "amount": "500", "unit": "g"},
    {"name": "mango", "amount": "2", "unit": "whole"},
    {"name": "curry powder", "amount": "3", "unit": "tbsp"},
    {"name": "red chili", "amount": "2", "unit": "whole"},
    {"name": "coconut milk", "amount": "400", "unit": "ml"},
    {"name": "ginger", "amount": "1", "unit": "inch"}
  ],
  "instructions": [
    {"step_number": 1, "instruction": "Dice chicken and slice chilies"},
    {"step_number": 2, "instruction": "Sauté chicken until golden, add chilies and ginger"},
    {"step_number": 3, "instruction": "Add curry powder and cook until fragrant"},
    {"step_number": 4, "instruction": "Pour in coconut milk and diced mango"},
    {"step_number": 5, "instruction": "Simmer for 15 minutes until sauce thickens"}
  ],
  "cuisine_type": "Indian",
  "difficulty_level": "medium",
  "prep_time_minutes": 15,
  "cook_time_minutes": 25,
  "servings": 4
}
```

I've added extra chilies for more heat. Adjust the amount based on your spice tolerance!"""

# Canned text-only response for conversational prompts
CANNED_CONVERSATIONAL_RESPONSE = (
    "That's a great question! Here are some tips for storing fresh herbs: "
    "wrap them loosely in a damp paper towel, place them in a resealable bag, "
    "and store in the refrigerator. Most herbs will stay fresh for about a week "
    "this way. Basil is an exception - it does better at room temperature in a "
    "glass of water, like fresh flowers."
)

# Canned shopping list consolidation response
CANNED_SHOPPING_LIST_RESPONSE = """Here are your consolidated shopping list items:

```json
{
  "items": [
    {"name": "Garlic", "amount": "5", "unit": "cloves", "category": "Produce"},
    {"name": "Pasta", "amount": "200", "unit": "g", "category": "Pantry"},
    {"name": "Olive Oil", "amount": "2", "unit": "tbsp", "category": "Pantry"},
    {"name": "Bread", "amount": "1", "unit": "loaf", "category": "Bakery"},
    {"name": "Butter", "amount": "3", "unit": "tbsp", "category": "Dairy"},
    {"name": "Onion", "amount": "1", "unit": "whole", "category": "Produce"},
    {"name": "Tomato", "amount": "2", "unit": "whole", "category": "Produce"},
    {"name": "Lettuce", "amount": "1", "unit": "head", "category": "Produce"},
    {"name": "Chicken", "amount": "500", "unit": "g", "category": "Meat"},
    {"name": "Rice", "amount": "2", "unit": "cups", "category": "Pantry"},
    {"name": "Salmon", "amount": "2", "unit": "fillets", "category": "Seafood"},
    {"name": "Lemon", "amount": "1", "unit": "whole", "category": "Produce"}
  ]
}
```
"""

# Keywords that trigger shopping list consolidation response
SHOPPING_LIST_KEYWORDS = ["shopping", "consolidate", "ingredients"]

# Keywords that indicate a recipe creation request
CREATION_KEYWORDS = ["create", "make", "recipe for", "cook", "bake", "prepare"]

# Keywords that trigger the spaghetti recipe (for E2E testing)
SPAGHETTI_KEYWORDS = ["spaghetti", "pasta", "bolognese"]

# Keywords that indicate a modification request
MODIFICATION_KEYWORDS = [
    "modify",
    "change",
    "make it",
    "update",
    "adjust",
    "spicier",
    "healthier",
]

# Keywords that trigger gluten-free response
GLUTEN_FREE_KEYWORDS = ["gluten-free", "gluten free", "no gluten"]


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

        Modification keywords (modify, change, make it, etc.) trigger
        modification-specific responses. Gluten-free keywords return
        a gluten-free recipe modification.

        Special keywords like "spaghetti", "pasta", or "bolognese" return
        the spaghetti recipe specifically for E2E testing.

        Args:
            messages: List of ChatMessage objects in the conversation.

        Returns:
            A canned response string.
        """
        # Check user messages for keywords
        for msg in messages:
            if msg.role == "user":
                content_lower = msg.content.lower()

                # Check for shopping list consolidation keywords
                if any(keyword in content_lower for keyword in SHOPPING_LIST_KEYWORDS):
                    return CANNED_SHOPPING_LIST_RESPONSE

                # Check for gluten-free modification keywords first (highest priority)
                if any(keyword in content_lower for keyword in GLUTEN_FREE_KEYWORDS):
                    return CANNED_GLUTEN_FREE_RESPONSE

                # Check for general modification keywords
                if any(keyword in content_lower for keyword in MODIFICATION_KEYWORDS):
                    return CANNED_MODIFICATION_RESPONSE

                # Check for spaghetti/pasta-specific keywords
                if any(keyword in content_lower for keyword in SPAGHETTI_KEYWORDS):
                    return CANNED_SPAGHETTI_RESPONSE

                # Check for general creation keywords
                if any(keyword in content_lower for keyword in CREATION_KEYWORDS):
                    return CANNED_CHOCOLATE_CAKE_RESPONSE

        return CANNED_CONVERSATIONAL_RESPONSE
