/**
 * E2E Tests for Home Page Redesign
 *
 * Tests the new AI-first home page layout:
 * - Central chat input with suggestion chips
 * - Smart context cards
 * - Quick actions
 * - Time-of-day greeting
 */

import { test, expect } from '../../fixtures/auth.fixture';

// Viewport configurations
const viewports = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 1280, height: 720 },
};

test.describe('Home Page Redesign', () => {
  test.describe('Chat Input', () => {
    test('should display AI chat input with correct placeholder', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      // Chat input should be visible
      const chatInput = authenticatedPage.getByRole('textbox', { name: /what|cook|recipe/i });
      await expect(chatInput).toBeVisible();

      // Should have the expected placeholder
      await expect(chatInput).toHaveAttribute('placeholder', /what are we cooking/i);
    });

    test('should show visual feedback when submitting chat input', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      const chatInput = authenticatedPage.getByRole('textbox', { name: /what|cook|recipe/i });
      await chatInput.fill('Make me a pasta recipe');

      // Submit (press Enter or click submit button)
      const submitButton = authenticatedPage.locator('[data-testid="chat-submit"], button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
      } else {
        await chatInput.press('Enter');
      }

      // Should show toast or visual feedback (AI chat is visual only for now)
      const feedback = authenticatedPage.locator('[role="alert"], [data-testid="toast"], .toast');
      await expect(feedback.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Suggestion Chips', () => {
    test('should display suggestion chips below chat input', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      // Suggestion chips container should be visible
      const chipsContainer = authenticatedPage.locator('[data-testid="suggestion-chips"]');
      await expect(chipsContainer).toBeVisible();

      // Should have at least 3 suggestion chips
      const chips = authenticatedPage.locator('[data-testid="suggestion-chip"]');
      expect(await chips.count()).toBeGreaterThanOrEqual(3);
    });

    test('should show feedback when clicking suggestion chip', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      // Find a suggestion chip using data-testid
      const chip = authenticatedPage.locator('[data-testid="suggestion-chip"]').first();
      await chip.click();

      // Should show a toast notification
      const toast = authenticatedPage.locator('[data-testid="toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Quick Actions', () => {
    test('should display quick action buttons', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      // Quick actions section should be visible
      const quickActions = authenticatedPage.locator('[data-testid="quick-actions"]');
      await expect(quickActions).toBeVisible();

      // Should have the expected quick action links
      const actionLinks = quickActions.locator('[data-testid="quick-action"]');
      expect(await actionLinks.count()).toBeGreaterThanOrEqual(3);
    });

    test('should navigate to recipes when clicking Cookbook action', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      // Use specific selector within quick-actions to avoid sidebar conflicts
      const cookbookAction = authenticatedPage.locator('[data-testid="quick-actions"]').getByRole('link', { name: /cookbook/i });
      await cookbookAction.click();

      await expect(authenticatedPage).toHaveURL(/\/recipes/);
    });

    test('should navigate to planning when clicking Plan action', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      // Use specific selector within quick-actions
      const planAction = authenticatedPage.locator('[data-testid="quick-actions"]').getByRole('link', { name: /meal plan/i });
      await planAction.click();

      await expect(authenticatedPage).toHaveURL(/\/planning/);
    });

    test('should navigate to shopping when clicking Shop action', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      // Use specific selector within quick-actions
      const shopAction = authenticatedPage.locator('[data-testid="quick-actions"]').getByRole('link', { name: /shopping/i });
      await shopAction.click();

      await expect(authenticatedPage).toHaveURL(/\/shopping/);
    });
  });

  test.describe('Time-of-Day Greeting', () => {
    test('should display appropriate greeting based on time of day', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      // Should have a greeting element
      const greeting = authenticatedPage.locator('[data-testid="greeting"]');
      await expect(greeting).toBeVisible();

      // Greeting should contain time-based text
      const greetingText = await greeting.textContent();
      expect(greetingText).toMatch(/good morning|good afternoon|good evening/i);
    });
  });

  test.describe('Context Cards', () => {
    test('should display smart context cards', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      // Context cards should be visible - wait for them to appear
      const contextCards = authenticatedPage.locator('[data-testid="context-card"]');
      await expect(contextCards.first()).toBeVisible();

      // Should have at least one context card
      expect(await contextCards.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Responsive Layout', () => {
    test.use({ viewport: viewports.desktop });

    test('should display 2-column layout on desktop', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      // The context cards container should use grid layout on desktop
      const contextCardsContainer = authenticatedPage.locator('[data-testid="context-cards"]');
      await expect(contextCardsContainer).toBeVisible();

      // Check the grid layout
      const layout = await contextCardsContainer.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display;
      });

      expect(layout).toBe('grid');
    });
  });

  test.describe('Mobile Layout', () => {
    test.use({ viewport: viewports.mobile });

    test('should display stacked layout on mobile', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/home');

      // On mobile, elements should be stacked (single column)
      const mainContent = authenticatedPage.locator('[data-testid="home-content"]');
      await expect(mainContent).toBeVisible();

      // Chat input and suggestions should be full width
      const chatInput = authenticatedPage.getByRole('textbox', { name: /what|cook|recipe/i });
      await expect(chatInput).toBeVisible();
    });
  });
});
