/**
 * ToolConfirmation component - displays a preview of a pending tool call
 * and allows the user to approve or reject it.
 *
 * TDD stub - to be implemented after tests are verified to fail.
 */

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

const ToolConfirmation: React.FC<ToolConfirmationProps> = () => {
  // TDD stub - implementation will follow after tests are verified to fail
  return <div>ToolConfirmation stub</div>;
};

export default ToolConfirmation;
