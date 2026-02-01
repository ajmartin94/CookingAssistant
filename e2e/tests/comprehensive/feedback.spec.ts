/**
 * Comprehensive Tier: Feedback Widget
 * Consolidated from: feedback/feedback.spec.ts
 *
 * Covers:
 * - Feedback button is visible on the page
 * - Authenticated user can submit feedback successfully
 * - Feedback modal displays screenshot preview after opening
 * - POST request to /api/v1/feedback includes screenshot field in body
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

    // Click the feedback button using JavaScript dispatch since it overlaps
    // with sidebar (desktop) or bottom tab bar (mobile)
    await authenticatedPage.evaluate(() => {
      const button = document.querySelector('button[aria-label="Give Feedback"]') as HTMLElement;
      if (button) button.click();
    });

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

    // Success message should be displayed (specific text to avoid matching other "feedback" elements)
    await expect(
      authenticatedPage.getByText('Thanks for your feedback!')
    ).toBeVisible();

    // Modal should close after success
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('Comprehensive: Feedback Screenshot', () => {
  test('feedback modal displays screenshot preview image after opening', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    // Click the feedback button (async — captures screenshot before opening modal)
    await authenticatedPage.evaluate(() => {
      const button = document.querySelector('button[aria-label="Give Feedback"]') as HTMLElement;
      if (button) button.click();
    });

    // Modal should appear (may take longer due to screenshot capture)
    const modal = authenticatedPage.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 15000 });

    // Screenshot preview image should be visible inside the modal
    const screenshotPreview = modal.getByRole('img', { name: /screenshot preview/i });
    await expect(screenshotPreview).toBeVisible({ timeout: 10000 });

    // The image src should be a data URL (base64 jpeg from html2canvas)
    const src = await screenshotPreview.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toMatch(/^data:image\//);
  });

  test('POST request to feedback API includes screenshot field in body', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    // Set up route interception to capture the request body (pass through to real backend)
    let capturedBody: Record<string, unknown> | null = null;
    await authenticatedPage.route('**/api/v1/feedback', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        capturedBody = JSON.parse(request.postData() || '{}');
      }
      await route.continue();
    });

    // Click the feedback button
    await authenticatedPage.evaluate(() => {
      const button = document.querySelector('button[aria-label="Give Feedback"]') as HTMLElement;
      if (button) button.click();
    });

    // Wait for modal with screenshot preview
    const modal = authenticatedPage.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 15000 });
    await expect(modal.getByRole('img', { name: /screenshot preview/i })).toBeVisible({ timeout: 10000 });

    // Fill in feedback and submit
    const feedbackText = `Screenshot test feedback at ${Date.now()}`;
    await authenticatedPage.getByLabel(/feedback message/i).fill(feedbackText);

    const submitButton = modal.getByRole('button', { name: /submit/i });
    await Promise.all([
      authenticatedPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/feedback') && resp.status() === 201
      ),
      submitButton.click(),
    ]);

    // Verify the captured request body includes a screenshot field
    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.screenshot).toBeTruthy();
    expect(typeof capturedBody!.screenshot).toBe('string');
    expect(capturedBody!.screenshot as string).toMatch(/^data:image\//);
  });
});
