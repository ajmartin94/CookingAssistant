/**
 * Core Tier: Shopping List CRUD + Check-off
 *
 * Covers: empty state, create list, add item, delete item, delete list,
 *         check off items while shopping
 */

import { test, expect } from '../../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

/**
 * Helper: creates a list, navigates into it, and adds the given items.
 * Returns after all items are visible in the detail view.
 */
async function createListWithItems(
  page: Page,
  listName: string,
  items: Array<{ name: string; category: string; amount?: string; unit?: string }>
) {
  await page.goto('/shopping');

  // Create list
  await page.getByRole('textbox', { name: /list name/i }).fill(listName);
  const createResponse = page.waitForResponse(
    (resp) =>
      resp.url().includes('/api/v1/shopping-lists') &&
      resp.request().method() === 'POST' &&
      resp.status() === 201
  );
  await page.getByRole('button', { name: /create list/i }).click();
  await createResponse;

  // Navigate into list detail
  await expect(
    page.locator('[data-testid="shopping-list-card"]').getByText(listName)
  ).toBeVisible();
  const detailResponse = page.waitForResponse(
    (resp) =>
      resp.url().includes('/api/v1/shopping-lists/') &&
      resp.request().method() === 'GET' &&
      resp.status() === 200
  );
  await page.locator('[data-testid="shopping-list-card"]').getByText(listName).click();
  await detailResponse;

  await expect(page.getByText(/back to lists/i)).toBeVisible();

  // Add each item
  for (const item of items) {
    const itemNameInput = page.getByRole('textbox', { name: /item name/i });
    await expect(itemNameInput).toBeVisible();
    await expect(itemNameInput).toBeEditable();

    await itemNameInput.fill(item.name);
    await page.getByRole('textbox', { name: /category/i }).fill(item.category);
    if (item.amount) {
      await page.getByRole('textbox', { name: /amount/i }).fill(item.amount);
    }
    if (item.unit) {
      await page.getByRole('textbox', { name: /unit/i }).fill(item.unit);
    }

    const addResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/items') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    );
    await page.getByRole('button', { name: /add item/i }).click();
    await addResponse;

    await expect(page.getByText(item.name)).toBeVisible();
  }
}

test.describe('Core: Shopping List CRUD', () => {
  test('user sees empty state with create list option when no lists exist', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/shopping');

    // Should see empty state messaging and the inline create form
    await expect(
      authenticatedPage.getByText(/no shopping lists/i)
    ).toBeVisible();
    await expect(
      authenticatedPage.getByRole('button', { name: /create list/i })
    ).toBeVisible();
  });

  test('user creates a new shopping list and it appears in the list', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/shopping');

    // Fill in the list name in the inline form
    await authenticatedPage
      .getByRole('textbox', { name: /list name/i })
      .fill('Weekly Groceries');

    // Submit by clicking Create list
    const responsePromise = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/shopping-lists') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    );
    await authenticatedPage
      .getByRole('button', { name: /create list/i })
      .click();
    await responsePromise;

    // The new list should appear as a clickable entry
    await expect(
      authenticatedPage.getByText('Weekly Groceries')
    ).toBeVisible();
  });

  test('user adds a manual item and it appears under its category', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/shopping');

    // Create a list first
    await authenticatedPage
      .getByRole('textbox', { name: /list name/i })
      .fill('Test List');
    const createResponse = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/shopping-lists') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    );
    await authenticatedPage
      .getByRole('button', { name: /create list/i })
      .click();
    await createResponse;

    // Wait for the list card to appear
    await expect(
      authenticatedPage.locator('[data-testid="shopping-list-card"]').getByText('Test List')
    ).toBeVisible();

    // Click the list to enter detail view, wait for detail fetch
    const detailResponse = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/shopping-lists/') &&
        resp.request().method() === 'GET' &&
        resp.status() === 200
    );
    await authenticatedPage
      .locator('[data-testid="shopping-list-card"]')
      .getByText('Test List')
      .click();
    await detailResponse;

    // Wait for detail view to load
    await expect(
      authenticatedPage.getByText(/back to lists/i)
    ).toBeVisible();

    // Ensure the Item name input is visible and ready
    const itemNameInput = authenticatedPage.getByRole('textbox', { name: /item name/i });
    await expect(itemNameInput).toBeVisible();
    await expect(itemNameInput).toBeEditable();

    // Fill in the add item form
    await itemNameInput.fill('Milk');
    await authenticatedPage
      .getByRole('textbox', { name: /amount/i })
      .fill('1');
    await authenticatedPage
      .getByRole('textbox', { name: /unit/i })
      .fill('gallon');
    await authenticatedPage
      .getByRole('textbox', { name: /category/i })
      .fill('Dairy');

    // Verify values before submitting
    await expect(itemNameInput).toHaveValue('Milk');
    await expect(authenticatedPage.getByRole('textbox', { name: /category/i })).toHaveValue('Dairy');

    const addResponse = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/items') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    );
    await authenticatedPage
      .getByRole('button', { name: /add item/i })
      .click();
    await addResponse;

    // Item should appear under its category
    await expect(authenticatedPage.getByText('Dairy')).toBeVisible();
    await expect(authenticatedPage.getByText('Milk')).toBeVisible();
  });

  test('user deletes an item and it disappears from the list', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/shopping');

    // Create a list
    await authenticatedPage
      .getByRole('textbox', { name: /list name/i })
      .fill('Delete Test');
    const createResponse = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/shopping-lists') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    );
    await authenticatedPage
      .getByRole('button', { name: /create list/i })
      .click();
    await createResponse;

    // Navigate into the list
    await expect(
      authenticatedPage.locator('[data-testid="shopping-list-card"]').getByText('Delete Test')
    ).toBeVisible();
    const detailResponse = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/shopping-lists/') &&
        resp.request().method() === 'GET' &&
        resp.status() === 200
    );
    await authenticatedPage
      .locator('[data-testid="shopping-list-card"]')
      .getByText('Delete Test')
      .click();
    await detailResponse;

    await expect(
      authenticatedPage.getByText(/back to lists/i)
    ).toBeVisible();

    // Ensure form is ready
    const itemNameInput = authenticatedPage.getByRole('textbox', { name: /item name/i });
    await expect(itemNameInput).toBeVisible();
    await expect(itemNameInput).toBeEditable();

    // Add an item
    await itemNameInput.fill('Bread');
    await authenticatedPage
      .getByRole('textbox', { name: /category/i })
      .fill('Bakery');

    await expect(itemNameInput).toHaveValue('Bread');

    const addResponse = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/items') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    );
    await authenticatedPage
      .getByRole('button', { name: /add item/i })
      .click();
    await addResponse;

    await expect(authenticatedPage.getByText('Bread')).toBeVisible();

    // Delete the item using its aria-label
    const deleteResponse = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/items/') &&
        resp.request().method() === 'DELETE' &&
        resp.status() === 204
    );
    await authenticatedPage
      .getByRole('button', { name: /delete bread/i })
      .click();
    await deleteResponse;

    // Item should be gone
    await expect(authenticatedPage.getByText('Bread')).not.toBeVisible();
  });

  test('user deletes a shopping list and it is removed', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/shopping');

    // Create a list
    await authenticatedPage
      .getByRole('textbox', { name: /list name/i })
      .fill('To Delete');
    const createResponse = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/shopping-lists') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    );
    await authenticatedPage
      .getByRole('button', { name: /create list/i })
      .click();
    await createResponse;

    await expect(authenticatedPage.getByText('To Delete')).toBeVisible();

    // Delete the list using its aria-label
    const deleteResponse = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/shopping-lists/') &&
        resp.request().method() === 'DELETE' &&
        resp.status() === 204
    );
    await authenticatedPage
      .getByRole('button', { name: /delete to delete/i })
      .click();
    await deleteResponse;

    // List should be gone, back to empty state
    await expect(authenticatedPage.getByText('To Delete')).not.toBeVisible();
    await expect(
      authenticatedPage.getByText(/no shopping lists/i)
    ).toBeVisible();
  });
});

test.describe('Core: Shopping List Check-off', () => {
  test('user checks off an item and it shows strikethrough and moves to bottom of category', async ({
    authenticatedPage,
  }) => {
    await createListWithItems(authenticatedPage, 'Check Test', [
      { name: 'Milk', category: 'Dairy', amount: '1', unit: 'gallon' },
      { name: 'Cheese', category: 'Dairy', amount: '1', unit: 'block' },
      { name: 'Yogurt', category: 'Dairy', amount: '2', unit: 'cups' },
    ]);

    // Click the checkbox for Milk to check it off
    await authenticatedPage.getByRole('checkbox', { name: /milk/i }).check();

    // Milk should have strikethrough styling (line-through)
    const milkItem = authenticatedPage
      .locator('[data-testid="shopping-item"]')
      .filter({ hasText: 'Milk' });
    await expect(milkItem).toHaveCSS('text-decoration-line', 'line-through');

    // Milk should now be the last item in the Dairy category
    // Get all items within the Dairy category section
    const dairySection = authenticatedPage
      .locator('[data-testid="category-section"]')
      .filter({ hasText: 'Dairy' });
    const itemNames = dairySection.locator('[data-testid="shopping-item"]');
    const lastItem = itemNames.last();
    await expect(lastItem).toContainText('Milk');
  });

  test('user refreshes page and checked state is preserved', async ({
    authenticatedPage,
  }) => {
    await createListWithItems(authenticatedPage, 'Persist Test', [
      { name: 'Apples', category: 'Produce', amount: '6', unit: 'pieces' },
      { name: 'Bananas', category: 'Produce', amount: '1', unit: 'bunch' },
    ]);

    // Check off Apples
    await authenticatedPage.getByRole('checkbox', { name: /apples/i }).check();
    await expect(
      authenticatedPage.getByRole('checkbox', { name: /apples/i })
    ).toBeChecked();

    // Refresh the page — this returns to the list-of-lists view
    await authenticatedPage.reload();

    // Navigate back into the list detail
    await expect(
      authenticatedPage.locator('[data-testid="shopping-list-card"]').getByText('Persist Test')
    ).toBeVisible();
    const detailResponse = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/shopping-lists/') &&
        resp.request().method() === 'GET' &&
        resp.status() === 200
    );
    await authenticatedPage.locator('[data-testid="shopping-list-card"]').getByText('Persist Test').click();
    await detailResponse;

    await expect(authenticatedPage.getByText(/back to lists/i)).toBeVisible();
    await expect(authenticatedPage.getByText('Apples')).toBeVisible();

    // Apples should still be checked after refresh
    await expect(
      authenticatedPage.getByRole('checkbox', { name: /apples/i })
    ).toBeChecked();

    // Apples should still have strikethrough
    const applesItem = authenticatedPage
      .locator('[data-testid="shopping-item"]')
      .filter({ hasText: 'Apples' });
    await expect(applesItem).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('user unchecks an item and it is restored to normal position', async ({
    authenticatedPage,
  }) => {
    await createListWithItems(authenticatedPage, 'Uncheck Test', [
      { name: 'Bread', category: 'Bakery', amount: '1', unit: 'loaf' },
      { name: 'Rolls', category: 'Bakery', amount: '6', unit: 'pieces' },
    ]);

    // Check off Bread
    await authenticatedPage.getByRole('checkbox', { name: /bread/i }).check();
    await expect(
      authenticatedPage.getByRole('checkbox', { name: /bread/i })
    ).toBeChecked();

    // Bread should be at the bottom
    const bakerySection = authenticatedPage
      .locator('[data-testid="category-section"]')
      .filter({ hasText: 'Bakery' });
    const itemsAfterCheck = bakerySection.locator('[data-testid="shopping-item"]');
    await expect(itemsAfterCheck.last()).toContainText('Bread');

    // Now uncheck Bread
    await authenticatedPage.getByRole('checkbox', { name: /bread/i }).uncheck();
    await expect(
      authenticatedPage.getByRole('checkbox', { name: /bread/i })
    ).not.toBeChecked();

    // Bread should no longer have strikethrough
    const breadItem = authenticatedPage
      .locator('[data-testid="shopping-item"]')
      .filter({ hasText: 'Bread' });
    await expect(breadItem).not.toHaveCSS('text-decoration-line', 'line-through');

    // Bread should be back at its original position (first, since it was added first)
    const itemsAfterUncheck = bakerySection.locator('[data-testid="shopping-item"]');
    await expect(itemsAfterUncheck.first()).toContainText('Bread');
  });

  test('user sees progress counter update as items are checked and unchecked', async ({
    authenticatedPage,
  }) => {
    await createListWithItems(authenticatedPage, 'Progress Test', [
      { name: 'Chicken', category: 'Meat', amount: '1', unit: 'lb' },
      { name: 'Rice', category: 'Grains', amount: '2', unit: 'cups' },
      { name: 'Onions', category: 'Produce', amount: '3', unit: 'pieces' },
    ]);

    // Progress should start at 0/3
    await expect(authenticatedPage.getByText('0/3')).toBeVisible();

    // Check off Chicken
    await authenticatedPage.getByRole('checkbox', { name: /chicken/i }).check();
    await expect(authenticatedPage.getByText('1/3')).toBeVisible();

    // Check off Rice
    await authenticatedPage.getByRole('checkbox', { name: /rice/i }).check();
    await expect(authenticatedPage.getByText('2/3')).toBeVisible();

    // Uncheck Chicken
    await authenticatedPage.getByRole('checkbox', { name: /chicken/i }).uncheck();
    await expect(authenticatedPage.getByText('1/3')).toBeVisible();

    // Check off all remaining
    await authenticatedPage.getByRole('checkbox', { name: /chicken/i }).check();
    await authenticatedPage.getByRole('checkbox', { name: /onions/i }).check();
    await expect(authenticatedPage.getByText('3/3')).toBeVisible();
  });
});
