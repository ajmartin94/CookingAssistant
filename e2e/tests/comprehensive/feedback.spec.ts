/**
 * Comprehensive Tier: Feedback Widget
 * Consolidated from: feedback/feedback.spec.ts
 *
 * Covers:
 * - Feedback button is visible on the page
 * - Authenticated user can submit feedback successfully
 *
 * Removed (per audit):
 * - Unauthenticated submit (less critical path)
 * - Modal open/close mechanics (UI detail)
 * - Validation of empty submit (UI detail)
 * - Bounding box position checks (implementation detail)
 */

import { test as publicTest, expect as publicExpect } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';

publicTest.describe('Comprehensive: Feedback Widget', () => {
  publicTest('feedback button is visible on home page', async ({ page }) => {
    await page.goto('/');

    const feedbackButton = page.getByRole('button', { name: /give feedback/i });
    await publicExpect(feedbackButton).toBeVisible();
  });
});

test.describe('Comprehensive: Feedback Submission', () => {
  test('authenticated user can submit feedback successfully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    // Hide sidebar to prevent it from intercepting feedback button click
    await authenticatedPage.evaluate(() => {
      const sidebar = document.querySelector('[data-testid="sidebar"]') as HTMLElement | null;
      if (sidebar) sidebar.style.display = 'none';
    });

    // Click the feedback button (aria-label="Give Feedback")
    const feedbackButton = authenticatedPage.getByRole('button', { name: /give feedback/i });
    await feedbackButton.click();

    // Modal should appear
    const modal = authenticatedPage.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Fill in the feedback textarea (labeled "Feedback Message")
    const feedbackText = `Test feedback submitted at ${Date.now()}`;
    const textarea = authenticatedPage.getByLabel(/feedback message/i);
    await textarea.fill(feedbackText);

    // Submit and wait for API response
    const submitButton = modal.getByRole('button', { name: /submit/i });

    const [response] = await Promise.all([
      authenticatedPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/feedback') && resp.status() === 201
      ),
      submitButton.click(),
    ]);

    expect(response.status()).toBe(201);

    // Success message should be displayed
    await expect(
      authenticatedPage.getByText(/thank|feedback|success/i)
    ).toBeVisible();

    // Modal should close after success
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  });
});
