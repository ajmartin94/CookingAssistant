export const generateUniqueUsername = () => {
  return `testuser_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};

export const generateUniqueEmail = () => {
  return `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
};

export const generateRecipeData = (overrides?: Partial<any>) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    title: `Test Recipe ${timestamp}_${random}`,
    description: 'A delicious test recipe created by E2E tests',
    ingredients: [
      { name: 'flour', amount: '2', unit: 'cups', notes: '' },
      { name: 'sugar', amount: '1', unit: 'cup', notes: '' },
      { name: 'eggs', amount: '3', unit: 'whole', notes: 'large' },
    ],
    instructions: [
      { step_number: 1, instruction: 'Mix dry ingredients', duration_minutes: 5 },
      { step_number: 2, instruction: 'Add eggs and mix', duration_minutes: 3 },
      { step_number: 3, instruction: 'Bake at 350°F', duration_minutes: 30 },
    ],
    prep_time_minutes: 10,
    cook_time_minutes: 30,
    servings: 4,
    cuisine_type: 'American',
    difficulty_level: 'easy',
    dietary_tags: ['vegetarian'],
    ...overrides,
  };
};

export const testCredentials = {
  username: 'e2e_test_user',
  email: 'e2e_test@example.com',
  password: 'TestPassword123!',
};
