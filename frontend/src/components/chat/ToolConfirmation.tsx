/**
 * ToolConfirmation component - displays a preview of a pending tool call
 * and allows the user to approve or reject it.
 *
 * Part of the "AI Assist" mode where all tool executions require user confirmation.
 */

import { useState } from 'react';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

interface ToolConfirmationProps {
  toolCall: ToolCall;
  onApprove: (toolCallId: string) => void;
  onReject: (toolCallId: string) => void;
  isLoading?: boolean;
}

/**
 * Converts snake_case tool name to Title Case display name
 */
function formatToolName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Gets action description based on tool name
 */
function getActionDescription(name: string): string {
  switch (name) {
    case 'create_recipe':
      return 'This will create a new recipe in your library.';
    case 'edit_recipe':
      return 'This will modify the existing recipe.';
    default:
      return `This action will be performed.`;
  }
}

/**
 * Recipe preview for create_recipe and edit_recipe tools
 */
function RecipePreview({
  args,
  isEdit,
  isExpanded,
}: {
  args: Record<string, unknown>;
  isEdit: boolean;
  isExpanded: boolean;
}) {
  const title = args.title as string | undefined;
  const description = args.description as string | undefined;
  const ingredients = (args.ingredients as string[]) || [];
  const instructions = (args.instructions as string[]) || [];
  const prepTime = args.prep_time as number | undefined;
  const cookTime = args.cook_time as number | undefined;
  const servings = args.servings as number | undefined;
  const dietaryTags = (args.dietary_tags as string[]) || [];

  // Show only first few items when collapsed
  const visibleIngredients = isExpanded ? ingredients : ingredients.slice(0, 3);
  const visibleInstructions = isExpanded ? instructions : instructions.slice(0, 2);
  const hasMoreIngredients = !isExpanded && ingredients.length > 3;
  const hasMoreInstructions = !isExpanded && instructions.length > 2;

  return (
    <div className="space-y-3">
      {/* Edit indicator */}
      {isEdit && (
        <p className="text-sm text-amber-600 font-medium">The following changes will be applied:</p>
      )}

      {/* Title */}
      {title && <p className="font-semibold text-neutral-900">{title}</p>}

      {/* Description */}
      {description && <p className="text-sm text-neutral-600">{description}</p>}

      {/* Meta info - always visible */}
      {(prepTime || cookTime || servings) && (
        <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
          {prepTime && <span>Prep: {prepTime} min</span>}
          {cookTime && <span>Cook: {cookTime} min</span>}
          {servings && <span>{servings} servings</span>}
        </div>
      )}

      {/* Dietary tags - always visible */}
      {dietaryTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {dietaryTags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Ingredients - always visible, but limited when collapsed */}
      {ingredients.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 mb-1">Ingredients</h4>
          <ul className="text-sm text-neutral-600 list-disc list-inside space-y-0.5">
            {visibleIngredients.map((ingredient, idx) => (
              <li key={idx}>{ingredient}</li>
            ))}
            {hasMoreIngredients && (
              <li className="text-neutral-400">...and {ingredients.length - 3} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Instructions - always visible, but limited when collapsed */}
      {instructions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 mb-1">Instructions</h4>
          <ol className="text-sm text-neutral-600 list-decimal list-inside space-y-0.5">
            {visibleInstructions.map((instruction, idx) => (
              <li key={idx}>{instruction}</li>
            ))}
            {hasMoreInstructions && (
              <li className="text-neutral-400 list-none">
                ...and {instructions.length - 2} more steps
              </li>
            )}
          </ol>
        </div>
      )}
    </div>
  );
}

/**
 * Generic preview for unknown tool types
 */
function GenericPreview({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="text-sm text-neutral-600">
      <p className="font-medium mb-2">Parameters:</p>
      <pre className="p-2 bg-neutral-50 rounded text-xs overflow-auto">
        {JSON.stringify(toolCall.args, null, 2)}
      </pre>
    </div>
  );
}

const ToolConfirmation: React.FC<ToolConfirmationProps> = ({
  toolCall,
  onApprove,
  onReject,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isRecipeTool = toolCall.name === 'create_recipe' || toolCall.name === 'edit_recipe';
  const isEdit = toolCall.name === 'edit_recipe';

  const handleApprove = () => {
    onApprove(toolCall.id);
  };

  const handleReject = () => {
    onReject(toolCall.id);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <section
      role="region"
      aria-label="Tool confirmation"
      className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <h3 className="font-semibold text-neutral-900">{formatToolName(toolCall.name)}</h3>
        <p className="text-sm text-neutral-600 mt-0.5">{getActionDescription(toolCall.name)}</p>
      </div>

      {/* Preview content */}
      <div className="px-4 py-3">
        {isRecipeTool ? (
          <RecipePreview args={toolCall.args} isEdit={isEdit} isExpanded={isExpanded} />
        ) : (
          <GenericPreview toolCall={toolCall} />
        )}

        {/* Expand/Collapse toggle for recipe tools */}
        {isRecipeTool && (
          <button
            onClick={toggleExpanded}
            className="mt-3 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show more details
              </>
            )}
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div
          role="status"
          aria-label="Executing action"
          aria-live="polite"
          className="px-4 py-2 bg-primary-50 border-t border-primary-100 flex items-center gap-2"
        >
          <Loader2
            className="w-4 h-4 animate-spin text-primary-600"
            data-testid="loading-spinner"
          />
          <span className="text-sm text-primary-700">Executing action...</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 flex gap-2">
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-white text-neutral-700 text-sm font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reject
        </button>
      </div>
    </section>
  );
};

export default ToolConfirmation;
