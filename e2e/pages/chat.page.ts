import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for ChatPanel interactions in E2E tests.
 *
 * The ChatPanel appears on recipe pages (detail, edit, create, list)
 * and provides AI-assisted recipe interactions.
 */
export class ChatPage extends BasePage {
  // Chat panel
  readonly chatPanel: Locator;
  readonly toggleButton: Locator;
  readonly chatHeader: Locator;

  // Message area
  readonly messageList: Locator;
  readonly userMessages: Locator;
  readonly assistantMessages: Locator;
  readonly streamingIndicator: Locator;
  readonly emptyState: Locator;

  // Input area
  readonly messageInput: Locator;
  readonly sendButton: Locator;

  // Error handling
  readonly errorAlert: Locator;
  readonly dismissErrorButton: Locator;
  readonly retryButton: Locator;

  // Tool confirmation
  readonly toolConfirmation: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly toolExecutingIndicator: Locator;

  constructor(page: Page) {
    super(page);

    // Chat panel elements
    this.chatPanel = page.locator('aside[aria-label="Chat assistant"]');
    this.toggleButton = page.locator('button[aria-label="Expand chat"], button[aria-label="Collapse chat"]');
    this.chatHeader = page.locator('aside[aria-label="Chat assistant"] h2');

    // Message area elements
    this.messageList = page.locator('[data-testid="message-list"]');
    this.userMessages = page.locator('article[data-role="user"]');
    this.assistantMessages = page.locator('article[data-role="assistant"]');
    this.streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    this.emptyState = page.locator('text=How can I help you today?');

    // Input area elements
    this.messageInput = page.locator('textarea[aria-label="Message"], textarea#chat-message-input');
    this.sendButton = page.locator('button[aria-label="Send message"]');

    // Error handling elements
    this.errorAlert = page.locator('[role="alert"]');
    this.dismissErrorButton = page.locator('button[aria-label="Dismiss error"]');
    this.retryButton = page.locator('button:has-text("Retry")');

    // Tool confirmation elements
    this.toolConfirmation = page.locator('section[aria-label="Tool confirmation"]');
    this.approveButton = page.locator('section[aria-label="Tool confirmation"] button:has-text("Approve")');
    this.rejectButton = page.locator('section[aria-label="Tool confirmation"] button:has-text("Reject")');
    this.toolExecutingIndicator = page.locator('[aria-label="Executing action"]');
  }

  /**
   * Expand the chat panel if collapsed
   */
  async expandChat(): Promise<void> {
    const expandButton = this.page.locator('button[aria-label="Expand chat"]');
    if (await expandButton.isVisible()) {
      await expandButton.click();
    }
  }

  /**
   * Collapse the chat panel if expanded
   */
  async collapseChat(): Promise<void> {
    const collapseButton = this.page.locator('button[aria-label="Collapse chat"]');
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
    }
  }

  /**
   * Check if chat panel is expanded
   */
  async isChatExpanded(): Promise<boolean> {
    const collapseButton = this.page.locator('button[aria-label="Collapse chat"]');
    return collapseButton.isVisible();
  }

  /**
   * Send a message to the chat
   */
  async sendMessage(message: string): Promise<void> {
    await this.expandChat();
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  /**
   * Get all user messages
   */
  async getUserMessages(): Promise<string[]> {
    const messages: string[] = [];
    const count = await this.userMessages.count();
    for (let i = 0; i < count; i++) {
      const text = await this.userMessages.nth(i).textContent();
      if (text) messages.push(text);
    }
    return messages;
  }

  /**
   * Get all assistant messages
   */
  async getAssistantMessages(): Promise<string[]> {
    const messages: string[] = [];
    const count = await this.assistantMessages.count();
    for (let i = 0; i < count; i++) {
      const text = await this.assistantMessages.nth(i).textContent();
      if (text) messages.push(text);
    }
    return messages;
  }

  /**
   * Get the chat context label from the header
   */
  async getContextLabel(): Promise<string | null> {
    const headerText = await this.chatHeader.textContent();
    return headerText;
  }

  /**
   * Wait for streaming to complete
   */
  async waitForStreamingComplete(): Promise<void> {
    // Wait for streaming indicator to disappear
    await this.streamingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
  }

  /**
   * Wait for a response to appear
   */
  async waitForResponse(): Promise<void> {
    await this.assistantMessages.first().waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Approve a pending tool call
   */
  async approveTool(): Promise<void> {
    await this.approveButton.click();
  }

  /**
   * Reject a pending tool call
   */
  async rejectTool(): Promise<void> {
    await this.rejectButton.click();
  }

  /**
   * Wait for tool confirmation to appear
   */
  async waitForToolConfirmation(): Promise<void> {
    await this.toolConfirmation.waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Get the tool name from the confirmation dialog
   */
  async getToolName(): Promise<string | null> {
    const header = this.toolConfirmation.locator('h3');
    return header.textContent();
  }

  /**
   * Dismiss an error
   */
  async dismissError(): Promise<void> {
    await this.dismissErrorButton.click();
  }

  /**
   * Retry after an error
   */
  async retry(): Promise<void> {
    await this.retryButton.click();
  }

  /**
   * Check if there's an error displayed
   */
  async hasError(): Promise<boolean> {
    return this.errorAlert.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.hasError()) {
      return this.errorAlert.textContent();
    }
    return null;
  }
}
