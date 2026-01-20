import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import ToolConfirmation from './ToolConfirmation';

/**
 * TDD tests for ToolConfirmation component.
 * These tests are written before implementation (red phase).
 *
 * ToolConfirmation displays a preview of a pending tool call and allows
 * the user to approve or reject it. This is part of the "AI Assist" mode
 * where all tool executions require user confirmation.
 *
 * Per design doc (docs/plans/2026-01-19-ai-chat-integration-design.md):
 * - Tools that need confirmation: create_recipe, edit_recipe
 * - Tools that don't need confirmation: suggest_substitutions (read-only)
 */

// Types that will be implemented
interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

interface RecipeArgs {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  cuisine?: string;
  dietary_tags?: string[];
}

interface EditRecipeArgs {
  recipe_id: string;
  title?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  cuisine?: string;
  dietary_tags?: string[];
}

describe('ToolConfirmation', () => {
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();

  const createRecipeToolCall: ToolCall = {
    id: 'call_123',
    name: 'create_recipe',
    args: {
      title: 'Dairy-Free Pasta',
      description: 'A delicious creamy pasta without dairy',
      ingredients: ['pasta', 'cashew cream', 'garlic', 'olive oil', 'basil'],
      instructions: [
        'Cook pasta according to package directions',
        'Blend cashews with water to make cream',
        'Sauté garlic in olive oil',
        'Combine all ingredients',
      ],
      prep_time: 15,
      cook_time: 20,
      servings: 4,
      dietary_tags: ['dairy-free', 'vegan'],
    } as RecipeArgs,
    status: 'pending',
  };

  const editRecipeToolCall: ToolCall = {
    id: 'call_456',
    name: 'edit_recipe',
    args: {
      recipe_id: 'recipe_abc',
      ingredients: ['pasta', 'cashew cream', 'garlic', 'olive oil', 'basil'],
      dietary_tags: ['dairy-free', 'vegan'],
    } as EditRecipeArgs,
    status: 'pending',
  };

  const defaultProps = {
    toolCall: createRecipeToolCall,
    onApprove: mockOnApprove,
    onReject: mockOnReject,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Rendering Tool Call Preview (name, parameters)
  // ===========================================================================

  describe('Tool Call Preview', () => {
    it('should render the tool confirmation container', () => {
      render(<ToolConfirmation {...defaultProps} />);

      expect(
        screen.getByRole('region', { name: /tool confirmation|action preview/i })
      ).toBeInTheDocument();
    });

    it('should display the tool name in human-readable format', () => {
      render(<ToolConfirmation {...defaultProps} />);

      // "create_recipe" should be displayed as "Create Recipe" or similar
      expect(screen.getByRole('heading', { name: /create recipe/i })).toBeInTheDocument();
    });

    it('should display edit_recipe tool name correctly', () => {
      render(<ToolConfirmation {...defaultProps} toolCall={editRecipeToolCall} />);

      expect(screen.getByRole('heading', { name: /edit recipe/i })).toBeInTheDocument();
    });

    it('should show a description of what the action will do', () => {
      render(<ToolConfirmation {...defaultProps} />);

      // Should explain what will happen if approved
      expect(screen.getByText(/will create a new recipe|create this recipe/i)).toBeInTheDocument();
    });

    it('should show edit action description for edit_recipe', () => {
      render(<ToolConfirmation {...defaultProps} toolCall={editRecipeToolCall} />);

      expect(screen.getByText(/will update|will modify|edit this recipe/i)).toBeInTheDocument();
    });

    it('should display key parameters as a summary', () => {
      render(<ToolConfirmation {...defaultProps} />);

      // Should show at minimum the recipe title
      expect(screen.getByText('Dairy-Free Pasta')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Approve Button Tests
  // ===========================================================================

  describe('Approve Button', () => {
    it('should render an approve button', () => {
      render(<ToolConfirmation {...defaultProps} />);

      expect(screen.getByRole('button', { name: /approve|confirm|yes/i })).toBeInTheDocument();
    });

    it('should call onApprove with tool call id when clicked', async () => {
      const user = userEvent.setup();
      render(<ToolConfirmation {...defaultProps} />);

      const approveButton = screen.getByRole('button', { name: /approve|confirm|yes/i });
      await user.click(approveButton);

      expect(mockOnApprove).toHaveBeenCalledTimes(1);
      expect(mockOnApprove).toHaveBeenCalledWith('call_123');
    });

    it('should have accessible name indicating approval action', () => {
      render(<ToolConfirmation {...defaultProps} />);

      const approveButton = screen.getByRole('button', { name: /approve|confirm|yes/i });
      expect(approveButton).toHaveAccessibleName();
    });

    it('should be disabled when isLoading is true', () => {
      render(<ToolConfirmation {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /approve|confirm|yes/i })).toBeDisabled();
    });
  });

  // ===========================================================================
  // Reject Button Tests
  // ===========================================================================

  describe('Reject Button', () => {
    it('should render a reject button', () => {
      render(<ToolConfirmation {...defaultProps} />);

      expect(screen.getByRole('button', { name: /reject|cancel|no/i })).toBeInTheDocument();
    });

    it('should call onReject with tool call id when clicked', async () => {
      const user = userEvent.setup();
      render(<ToolConfirmation {...defaultProps} />);

      const rejectButton = screen.getByRole('button', { name: /reject|cancel|no/i });
      await user.click(rejectButton);

      expect(mockOnReject).toHaveBeenCalledTimes(1);
      expect(mockOnReject).toHaveBeenCalledWith('call_123');
    });

    it('should have accessible name indicating rejection action', () => {
      render(<ToolConfirmation {...defaultProps} />);

      const rejectButton = screen.getByRole('button', { name: /reject|cancel|no/i });
      expect(rejectButton).toHaveAccessibleName();
    });

    it('should be disabled when isLoading is true', () => {
      render(<ToolConfirmation {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /reject|cancel|no/i })).toBeDisabled();
    });
  });

  // ===========================================================================
  // Recipe Preview Display (create/edit tools)
  // ===========================================================================

  describe('Recipe Preview Display', () => {
    it('should display recipe title in preview', () => {
      render(<ToolConfirmation {...defaultProps} />);

      expect(screen.getByText('Dairy-Free Pasta')).toBeInTheDocument();
    });

    it('should display recipe description when provided', () => {
      render(<ToolConfirmation {...defaultProps} />);

      expect(screen.getByText('A delicious creamy pasta without dairy')).toBeInTheDocument();
    });

    it('should display ingredients list', () => {
      render(<ToolConfirmation {...defaultProps} />);

      // Should show ingredients section
      expect(screen.getByRole('heading', { name: /ingredients/i })).toBeInTheDocument();
      expect(screen.getByText('pasta')).toBeInTheDocument();
      expect(screen.getByText('cashew cream')).toBeInTheDocument();
    });

    it('should display instructions preview', () => {
      render(<ToolConfirmation {...defaultProps} />);

      // Should show instructions section
      expect(screen.getByRole('heading', { name: /instructions/i })).toBeInTheDocument();
      expect(screen.getByText(/Cook pasta according to package directions/i)).toBeInTheDocument();
    });

    it('should display cooking times when provided', () => {
      render(<ToolConfirmation {...defaultProps} />);

      expect(screen.getByText(/15\s*min|prep.*15/i)).toBeInTheDocument();
      expect(screen.getByText(/20\s*min|cook.*20/i)).toBeInTheDocument();
    });

    it('should display servings when provided', () => {
      render(<ToolConfirmation {...defaultProps} />);

      expect(screen.getByText(/4\s*servings|serves\s*4/i)).toBeInTheDocument();
    });

    it('should display dietary tags when provided', () => {
      render(<ToolConfirmation {...defaultProps} />);

      // Use getAllByText since "dairy-free" appears in both the title and as a tag
      const dairyFreeElements = screen.getAllByText(/dairy-free/i);
      expect(dairyFreeElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/vegan/i)).toBeInTheDocument();
    });

    it('should show only modified fields for edit_recipe', () => {
      render(<ToolConfirmation {...defaultProps} toolCall={editRecipeToolCall} />);

      // Should indicate this is an update
      expect(screen.getByText(/changes|modifications|updates/i)).toBeInTheDocument();
      // Should show the ingredients that will be set
      expect(screen.getByText('cashew cream')).toBeInTheDocument();
      // Should show dietary tags
      expect(screen.getByText(/dairy-free/i)).toBeInTheDocument();
    });

    it('should be collapsible/expandable for long previews', async () => {
      const user = userEvent.setup();
      render(<ToolConfirmation {...defaultProps} />);

      // Should have a toggle for showing more/less details
      const toggleButton = screen.getByRole('button', { name: /show more|expand|details/i });
      expect(toggleButton).toBeInTheDocument();

      await user.click(toggleButton);

      // After expanding, should show the toggle to collapse
      expect(screen.getByRole('button', { name: /show less|collapse|hide/i })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Loading State Tests
  // ===========================================================================

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<ToolConfirmation {...defaultProps} isLoading={true} />);

      expect(
        screen.getByRole('status', { name: /loading|executing|processing/i })
      ).toBeInTheDocument();
    });

    it('should show loading text indicating execution in progress', () => {
      render(<ToolConfirmation {...defaultProps} isLoading={true} />);

      expect(screen.getByText(/executing|processing|creating|running/i)).toBeInTheDocument();
    });

    it('should disable both buttons during loading', () => {
      render(<ToolConfirmation {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /approve|confirm|yes/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /reject|cancel|no/i })).toBeDisabled();
    });

    it('should show spinner or animation during loading', () => {
      const { container } = render(<ToolConfirmation {...defaultProps} isLoading={true} />);

      // Look for loading spinner element
      const spinner = container.querySelector('[data-testid="loading-spinner"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show loading indicator when isLoading is false', () => {
      render(<ToolConfirmation {...defaultProps} isLoading={false} />);

      expect(
        screen.queryByRole('status', { name: /loading|executing|processing/i })
      ).not.toBeInTheDocument();
    });

    it('should preserve preview content while loading', () => {
      render(<ToolConfirmation {...defaultProps} isLoading={true} />);

      // Recipe preview should still be visible
      expect(screen.getByText('Dairy-Free Pasta')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA region for the confirmation panel', () => {
      render(<ToolConfirmation {...defaultProps} />);

      const region = screen.getByRole('region', { name: /tool confirmation|action preview/i });
      expect(region).toBeInTheDocument();
    });

    it('should have keyboard-accessible buttons', () => {
      render(<ToolConfirmation {...defaultProps} />);

      const approveButton = screen.getByRole('button', { name: /approve|confirm|yes/i });
      const rejectButton = screen.getByRole('button', { name: /reject|cancel|no/i });

      approveButton.focus();
      expect(document.activeElement).toBe(approveButton);

      rejectButton.focus();
      expect(document.activeElement).toBe(rejectButton);
    });

    it('should announce loading state to screen readers', () => {
      render(<ToolConfirmation {...defaultProps} isLoading={true} />);

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite');
    });

    it('should have descriptive button labels', () => {
      render(<ToolConfirmation {...defaultProps} />);

      // Buttons should indicate what action they perform on what
      const approveButton = screen.getByRole('button', { name: /approve|confirm|yes/i });
      expect(approveButton.textContent?.toLowerCase()).toMatch(/approve|confirm|yes/);
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalToolCall: ToolCall = {
        id: 'call_minimal',
        name: 'create_recipe',
        args: {
          title: 'Simple Recipe',
          ingredients: ['ingredient 1'],
          instructions: ['Step 1'],
        },
        status: 'pending',
      };

      render(<ToolConfirmation {...defaultProps} toolCall={minimalToolCall} />);

      expect(screen.getByText('Simple Recipe')).toBeInTheDocument();
      // Should not crash when optional fields are missing
      expect(screen.queryByText(/prep.*time/i)).not.toBeInTheDocument();
    });

    it('should handle empty ingredients array', () => {
      const emptyIngredientsToolCall: ToolCall = {
        id: 'call_empty',
        name: 'create_recipe',
        args: {
          title: 'Empty Recipe',
          ingredients: [],
          instructions: ['Just do it'],
        },
        status: 'pending',
      };

      render(<ToolConfirmation {...defaultProps} toolCall={emptyIngredientsToolCall} />);

      expect(screen.getByText('Empty Recipe')).toBeInTheDocument();
      // Should show empty state or skip ingredients section
    });

    it('should handle very long recipe titles', () => {
      const longTitleToolCall: ToolCall = {
        id: 'call_long',
        name: 'create_recipe',
        args: {
          title:
            'This Is A Very Long Recipe Title That Should Be Handled Gracefully Without Breaking The Layout',
          ingredients: ['item'],
          instructions: ['step'],
        },
        status: 'pending',
      };

      render(<ToolConfirmation {...defaultProps} toolCall={longTitleToolCall} />);

      expect(screen.getByText(/This Is A Very Long Recipe Title/)).toBeInTheDocument();
    });

    it('should handle unknown tool names gracefully', () => {
      const unknownToolCall: ToolCall = {
        id: 'call_unknown',
        name: 'unknown_tool',
        args: { foo: 'bar' },
        status: 'pending',
      };

      render(<ToolConfirmation {...defaultProps} toolCall={unknownToolCall} />);

      // Should show a generic preview
      expect(
        screen.getByRole('region', { name: /tool confirmation|action preview/i })
      ).toBeInTheDocument();
      // Should display the tool name in some form
      expect(screen.getByText(/unknown.tool|unknown_tool/i)).toBeInTheDocument();
    });
  });
});
