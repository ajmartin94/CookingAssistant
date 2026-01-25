import { test as publicTest, expect as publicExpect } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';

// E2E uses port 8001 to avoid conflicts with dev server on 8000
const E2E_BACKEND_PORT = 8001;
const E2E_BACKEND_URL = `http://localhost:${E2E_BACKEND_PORT}`;

/**
 * Feedback Widget E2E Tests
 *
 * Tests for the floating feedback button that allows users to submit feedback
 * from any page in the application. The widget should:
 * - Be visible on all pages (authenticated and unauthenticated)
 * - Open a modal with a textarea when clicked
 * - Submit feedback to the backend API
 */

test.describe('Feature: User Submits Feedback', () => {
  test.describe('Feedback Button Visibility', () => {
    publicTest('feedback button is visible on home page for unauthenticated users', async ({ page }) => {
      // Navigate to the home page (unauthenticated)
      await page.goto('/');

      // The feedback button should be visible in the bottom-right corner
      const feedbackButton = page.getByRole('button', { name: /feedback/i });
      await publicExpect(feedbackButton).toBeVisible();

      // Verify it's positioned in the bottom-right (fixed position)
      const boundingBox = await feedbackButton.boundingBox();
      const viewportSize = page.viewportSize();

      publicExpect(boundingBox).toBeTruthy();
      publicExpect(viewportSize).toBeTruthy();

      if (boundingBox && viewportSize) {
        // Button should be in the right half of the screen
        publicExpect(boundingBox.x).toBeGreaterThan(viewportSize.width / 2);
        // Button should be in the bottom half of the screen
        publicExpect(boundingBox.y).toBeGreaterThan(viewportSize.height / 2);
      }
    });

    test('feedback button is visible on recipes page for authenticated users', async ({ authenticatedPage }) => {
      // Navigate to recipes page (already authenticated via fixture)
      await authenticatedPage.goto('/recipes');

      // The feedback button should be visible
      const feedbackButton = authenticatedPage.getByRole('button', { name: /feedback/i });
      await expect(feedbackButton).toBeVisible();

      // Verify it's positioned in the bottom-right (fixed position)
      const boundingBox = await feedbackButton.boundingBox();
      const viewportSize = authenticatedPage.viewportSize();

      expect(boundingBox).toBeTruthy();
      expect(viewportSize).toBeTruthy();

      if (boundingBox && viewportSize) {
        // Button should be in the right half of the screen
        expect(boundingBox.x).toBeGreaterThan(viewportSize.width / 2);
        // Button should be in the bottom half of the screen
        expect(boundingBox.y).toBeGreaterThan(viewportSize.height / 2);
      }
    });
  });

  test.describe('Feedback Modal Interaction', () => {
    publicTest('clicking feedback button opens modal with textarea', async ({ page }) => {
      await page.goto('/');

      // Click the feedback button
      const feedbackButton = page.getByRole('button', { name: /feedback/i });
      await feedbackButton.click();

      // Modal should appear
      const modal = page.getByRole('dialog');
      await publicExpect(modal).toBeVisible();

      // Modal should contain a textarea for feedback
      const textarea = page.getByRole('textbox', { name: /feedback/i });
      await publicExpect(textarea).toBeVisible();

      // Modal should have a submit button
      const submitButton = page.getByRole('button', { name: /submit/i });
      await publicExpect(submitButton).toBeVisible();

      // Modal should have a way to close it
      const closeButton = page.getByRole('button', { name: /close|cancel/i });
      await publicExpect(closeButton).toBeVisible();
    });

    publicTest('user can close the feedback modal', async ({ page }) => {
      await page.goto('/');

      // Open the modal
      const feedbackButton = page.getByRole('button', { name: /feedback/i });
      await feedbackButton.click();

      // Verify modal is open
      const modal = page.getByRole('dialog');
      await publicExpect(modal).toBeVisible();

      // Close the modal
      const closeButton = page.getByRole('button', { name: /close|cancel/i });
      await closeButton.click();

      // Modal should be closed
      await publicExpect(modal).not.toBeVisible();

      // Feedback button should still be visible
      await publicExpect(feedbackButton).toBeVisible();
    });
  });

  test.describe('Submit Feedback Flow', () => {
    test('authenticated user submits feedback successfully', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() =>
        localStorage.getItem('auth_token')
      );

      // Navigate to recipes page
      await authenticatedPage.goto('/recipes');

      // Click the feedback button
      const feedbackButton = authenticatedPage.getByRole('button', { name: /feedback/i });
      await feedbackButton.click();

      // Modal should appear
      const modal = authenticatedPage.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Fill in the feedback textarea
      const feedbackText = `Test feedback submitted at ${Date.now()}`;
      const textarea = authenticatedPage.getByRole('textbox', { name: /feedback/i });
      await textarea.fill(feedbackText);

      // Submit the feedback and wait for API response
      const submitButton = authenticatedPage.getByRole('button', { name: /submit/i });

      // Wait for the feedback submission response
      const [response] = await Promise.all([
        authenticatedPage.waitForResponse(
          (resp) =>
            resp.url().includes('/api/v1/feedback') && resp.status() === 201
        ),
        submitButton.click(),
      ]);

      // Verify the response
      expect(response.status()).toBe(201);

      // Success message should be displayed (toast appears inside modal briefly)
      await expect(
        authenticatedPage.getByText(/thank you|feedback.*submitted|success/i)
      ).toBeVisible();

      // Modal should close after showing the success message
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    publicTest('unauthenticated user can submit feedback', async ({ page }) => {
      await page.goto('/');

      // Click the feedback button
      const feedbackButton = page.getByRole('button', { name: /feedback/i });
      await feedbackButton.click();

      // Modal should appear
      const modal = page.getByRole('dialog');
      await publicExpect(modal).toBeVisible();

      // Fill in the feedback (10+ characters required)
      const feedbackText = `Anonymous feedback submitted at ${Date.now()}`;
      const textarea = page.getByRole('textbox', { name: /feedback/i });
      await textarea.fill(feedbackText);

      // Submit the feedback
      const submitButton = page.getByRole('button', { name: /submit/i });

      // Wait for the feedback submission response
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes('/api/v1/feedback') && resp.status() === 201
        ),
        submitButton.click(),
      ]);

      // Verify the response
      publicExpect(response.status()).toBe(201);

      // Success message should be displayed (toast appears inside modal briefly)
      await publicExpect(
        page.getByText(/thank you|feedback.*submitted|success/i)
      ).toBeVisible();

      // Modal should close after showing the success message
      await publicExpect(modal).not.toBeVisible({ timeout: 10000 });
    });

    publicTest('feedback submission requires message content', async ({ page }) => {
      await page.goto('/');

      // Click the feedback button
      const feedbackButton = page.getByRole('button', { name: /feedback/i });
      await feedbackButton.click();

      // Modal should appear
      const modal = page.getByRole('dialog');
      await publicExpect(modal).toBeVisible();

      // Try to submit without entering any feedback
      // The submit button is disabled, but we force click to trigger validation
      const submitButton = page.getByRole('button', { name: /submit/i });
      await submitButton.click({ force: true });

      // Should show validation error (minimum 10 characters required)
      await publicExpect(
        page.getByText(/enter.*at least|required|cannot be empty|characters/i)
      ).toBeVisible();

      // Modal should still be open
      await publicExpect(modal).toBeVisible();
    });
  });
});
