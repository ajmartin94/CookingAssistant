/**
 * Core Tier: Sharing
 * Consolidated from: sharing/share-recipe.spec.ts
 *
 * Keeps 3 core tests: create share link, access without auth, revoke blocks access
 *
 * Removed (per audit): invalid share token, view-only share, edit share,
 * list my shares, revoke share (API-only, covered by revoke+access test)
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { test as baseTest } from '@playwright/test';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Core: Recipe Sharing', () => {
  test('should create share link for recipe', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    const token = await recipeDetailPage.getAuthToken();

    const recipe = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Share Test Recipe' })
    );

    const share = await api.createShare(token!, {
      recipe_id: recipe.id,
      permission: 'view',
    });

    expect(share.share_token).toBeTruthy();
    expect(share.share_url).toBeTruthy();
  });
});

baseTest.describe('Core: Shared Recipe Access', () => {
  baseTest('should access shared recipe without authentication', async ({ page, request }) => {
    const api = new APIHelper(request);

    const username = `sharer_${Date.now()}`;
    const email = `sharer_${Date.now()}@test.com`;
    await api.registerUser(username, email, 'TestPass123!');
    const authToken = await api.login(username, 'TestPass123!');

    const recipe = await api.createRecipe(
      authToken,
      generateRecipeData({ title: 'Publicly Shared Recipe' })
    );

    const share = await api.createShare(authToken, {
      recipe_id: recipe.id,
      permission: 'view',
    });

    await page.goto(`/shared/${share.share_token}`);

    await baseTest.expect(page.getByText('Publicly Shared Recipe')).toBeVisible();
    await baseTest.expect(page.getByText(/shared with you/i)).toBeVisible();
  });

  baseTest('should not access revoked share', async ({ page, request }) => {
    const api = new APIHelper(request);

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

    const shares = await api.getMyShares(authToken);
    const share = shares.find((s: any) => s.recipe_id === recipe.id);

    await api.revokeShare(authToken, share.id);

    await page.goto(`/shared/${createResponse.share_token}`);
    await baseTest.expect(page.getByText(/unable to load/i)).toBeVisible();
  });
});
