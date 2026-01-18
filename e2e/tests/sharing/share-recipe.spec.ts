import { test, expect } from '../../fixtures/auth.fixture';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Recipe Sharing', () => {
  test('should create share link for recipe via API', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    const token = await recipeDetailPage.getAuthToken();

    // Create a recipe
    const recipe = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Share Test Recipe' })
    );

    // Create share link
    const share = await api.createShare(token!, {
      recipe_id: recipe.id,
      permission: 'view',
    });

    expect(share.share_token).toBeTruthy();
    expect(share.share_url).toBeTruthy();
  });

  test('should access shared recipe without authentication', async ({ page, request }) => {
    const api = new APIHelper(request);

    // First, register and create a recipe
    const username = `sharer_${Date.now()}`;
    const email = `sharer_${Date.now()}@test.com`;
    await api.registerUser(username, email, 'TestPass123!');
    const authToken = await api.login(username, 'TestPass123!');

    const recipe = await api.createRecipe(
      authToken,
      generateRecipeData({ title: 'Publicly Shared Recipe' })
    );

    // Create share
    const share = await api.createShare(authToken, {
      recipe_id: recipe.id,
      permission: 'view',
    });

    // Access shared recipe in a fresh page (no auth)
    await page.goto(`/shared/${share.share_token}`);

    // Should see recipe content
    await expect(page.getByText('Publicly Shared Recipe')).toBeVisible();
    await expect(page.getByText(/shared with you/i)).toBeVisible();
  });

  test('should show error for invalid share token', async ({ page }) => {
    await page.goto('/shared/invalid-token-12345');

    // Should show error
    await expect(page.getByText(/unable to load/i)).toBeVisible();
  });

  test('should create view-only share', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    const token = await recipeDetailPage.getAuthToken();

    const recipe = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'View Only Recipe' })
    );

    await api.createShare(token!, {
      recipe_id: recipe.id,
      permission: 'view',
    });

    // Verify by fetching from my-shares
    const shares = await api.getMyShares(token!);
    const viewShare = shares.find((s: any) => s.recipe_id === recipe.id);
    expect(viewShare).toBeTruthy();
    expect(viewShare.permission).toBe('view');
  });

  test('should create edit share', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    const token = await recipeDetailPage.getAuthToken();

    const recipe = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Editable Recipe' })
    );

    await api.createShare(token!, {
      recipe_id: recipe.id,
      permission: 'edit',
    });

    // Verify by fetching from my-shares
    const shares = await api.getMyShares(token!);
    const editShare = shares.find((s: any) => s.recipe_id === recipe.id);
    expect(editShare).toBeTruthy();
    expect(editShare.permission).toBe('edit');
  });

  test('should list my shares', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    const token = await recipeDetailPage.getAuthToken();

    // Create recipe and share
    const recipe = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Shared Recipe List Test' })
    );

    await api.createShare(token!, {
      recipe_id: recipe.id,
      permission: 'view',
    });

    // Get my shares
    const shares = await api.getMyShares(token!);
    expect(shares.length).toBeGreaterThanOrEqual(1);
  });

  test('should revoke share', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    const token = await recipeDetailPage.getAuthToken();

    // Create recipe and share
    const recipe = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Revoke Test Recipe' })
    );

    await api.createShare(token!, {
      recipe_id: recipe.id,
      permission: 'view',
    });

    // Get the share ID from my-shares
    const sharesBefore = await api.getMyShares(token!);
    const share = sharesBefore.find((s: any) => s.recipe_id === recipe.id);
    expect(share).toBeTruthy();

    // Revoke it
    await api.revokeShare(token!, share.id);

    // Verify it's gone
    const sharesAfter = await api.getMyShares(token!);
    const found = sharesAfter.find((s: any) => s.id === share.id);
    expect(found).toBeFalsy();
  });

  test('should not access revoked share', async ({ page, request }) => {
    const api = new APIHelper(request);

    // Register and create
    const username = `revoker_${Date.now()}`;
    await api.registerUser(username, `${username}@test.com`, 'TestPass123!');
    const authToken = await api.login(username, 'TestPass123!');

    const recipe = await api.createRecipe(
      authToken,
      generateRecipeData({ title: 'Will Be Revoked' })
    );

    const createResponse = await api.createShare(authToken, {
      recipe_id: recipe.id,
      permission: 'view',
    });

    // Get the share ID from my-shares
    const shares = await api.getMyShares(authToken);
    const share = shares.find((s: any) => s.recipe_id === recipe.id);

    // Revoke it
    await api.revokeShare(authToken, share.id);

    // Try to access - should fail
    await page.goto(`/shared/${createResponse.share_token}`);
    await expect(page.getByText(/unable to load/i)).toBeVisible();
  });
});
