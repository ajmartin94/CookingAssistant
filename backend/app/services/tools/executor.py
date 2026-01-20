"""
Tool Executor Framework

Manages LLM tool calls with confirmation gating and execution.
"""

import json
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Coroutine


class ToolCallStatus(Enum):
    """Status of a tool call in its lifecycle."""

    PENDING_CONFIRMATION = "pending_confirmation"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTED = "executed"
    FAILED = "failed"


class ToolExecutorError(Exception):
    """Exception raised when tool executor encounters an error."""

    pass


@dataclass
class ToolCall:
    """Represents a parsed tool call from the LLM."""

    id: str
    name: str
    arguments: dict[str, Any]
    status: ToolCallStatus = field(default=ToolCallStatus.PENDING_CONFIRMATION)

    def to_dict(self) -> dict[str, Any]:
        """Convert tool call to dictionary for API response."""
        return {
            "id": self.id,
            "name": self.name,
            "arguments": self.arguments,
            "status": self.status.value,
        }


# Tools that don't require user confirmation (read-only operations)
READ_ONLY_TOOLS = {"suggest_substitutions"}

# Tools that require user confirmation before execution
CONFIRMATION_REQUIRED_TOOLS = {"create_recipe", "edit_recipe"}


class ToolExecutor:
    """
    Manages tool call lifecycle including parsing, confirmation, and execution.

    Tool calls go through the following lifecycle:
    1. Parsed from LLM response
    2. Set to PENDING_CONFIRMATION (or APPROVED for read-only tools)
    3. User approves or rejects
    4. Executed if approved
    5. Status updated to EXECUTED or FAILED
    """

    def __init__(self) -> None:
        """Initialize the tool executor."""
        self._tool_calls: dict[str, ToolCall] = {}
        self._handlers: dict[str, Callable[..., Coroutine[Any, Any, Any]]] = {}

    def parse_tool_calls(self, tool_calls_data: list[dict]) -> list[ToolCall]:
        """
        Parse tool calls from LLM response data.

        Args:
            tool_calls_data: List of tool call dictionaries from LLM response.

        Returns:
            List of parsed ToolCall objects.

        Raises:
            ToolExecutorError: If tool call data is malformed.
        """
        parsed_calls = []

        for data in tool_calls_data:
            try:
                tool_id = data["id"]
                function_data = data["function"]
                name = function_data["name"]
                arguments_str = function_data["arguments"]

                # Parse JSON arguments
                try:
                    arguments = json.loads(arguments_str)
                except json.JSONDecodeError as e:
                    raise ToolExecutorError(
                        f"Failed to parse JSON arguments for tool call {tool_id}: {e}"
                    ) from e

                # Determine initial status based on tool type
                # - Read-only tools: auto-approved
                # - Confirmation-required tools: pending confirmation
                # - Unknown tools: auto-approved (will fail on execution if no handler)
                if name in CONFIRMATION_REQUIRED_TOOLS:
                    status = ToolCallStatus.PENDING_CONFIRMATION
                else:
                    status = ToolCallStatus.APPROVED

                tool_call = ToolCall(
                    id=tool_id,
                    name=name,
                    arguments=arguments,
                    status=status,
                )

                self._tool_calls[tool_id] = tool_call
                parsed_calls.append(tool_call)

            except KeyError as e:
                raise ToolExecutorError(
                    f"Missing required field in tool call data: {e}"
                ) from e

        return parsed_calls

    def requires_confirmation(self, tool_name: str) -> bool:
        """
        Check if a tool requires user confirmation before execution.

        Args:
            tool_name: Name of the tool.

        Returns:
            True if the tool requires confirmation, False otherwise.
        """
        return tool_name in CONFIRMATION_REQUIRED_TOOLS

    def approve_tool_call(self, tool_call_id: str) -> None:
        """
        Approve a pending tool call for execution.

        Args:
            tool_call_id: ID of the tool call to approve.

        Raises:
            ToolExecutorError: If tool call is not found.
        """
        tool_call = self._tool_calls.get(tool_call_id)
        if tool_call is None:
            raise ToolExecutorError(f"Tool call not found: {tool_call_id}")

        tool_call.status = ToolCallStatus.APPROVED

    def reject_tool_call(self, tool_call_id: str) -> None:
        """
        Reject a pending tool call.

        Args:
            tool_call_id: ID of the tool call to reject.

        Raises:
            ToolExecutorError: If tool call is not found.
        """
        tool_call = self._tool_calls.get(tool_call_id)
        if tool_call is None:
            raise ToolExecutorError(f"Tool call not found: {tool_call_id}")

        tool_call.status = ToolCallStatus.REJECTED

    async def execute_tool_call(self, tool_call_id: str) -> dict[str, Any]:
        """
        Execute an approved tool call.

        Args:
            tool_call_id: ID of the tool call to execute.

        Returns:
            Result dictionary from the tool handler.

        Raises:
            ToolExecutorError: If tool call is not found, not approved,
                              or handler is not registered.
        """
        tool_call = self._tool_calls.get(tool_call_id)
        if tool_call is None:
            raise ToolExecutorError(f"Tool call not found: {tool_call_id}")

        # Check approval status
        if tool_call.status == ToolCallStatus.PENDING_CONFIRMATION:
            raise ToolExecutorError(
                f"Tool call {tool_call_id} requires confirmation before execution"
            )

        if tool_call.status == ToolCallStatus.REJECTED:
            raise ToolExecutorError(f"Tool call {tool_call_id} was rejected")

        # Check handler is registered
        handler = self._handlers.get(tool_call.name)
        if handler is None:
            raise ToolExecutorError(
                f"Unknown tool or handler not registered: {tool_call.name}"
            )

        # Execute the tool
        try:
            result = await handler(**tool_call.arguments)
            tool_call.status = ToolCallStatus.EXECUTED
            return result
        except Exception as e:
            tool_call.status = ToolCallStatus.FAILED
            return {"success": False, "error": str(e)}

    def register_tool(
        self,
        name: str,
        handler: Callable[..., Coroutine[Any, Any, Any]],
    ) -> None:
        """
        Register a tool handler.

        Args:
            name: Name of the tool.
            handler: Async function to handle tool execution.
        """
        self._handlers[name] = handler

    def has_tool(self, name: str) -> bool:
        """
        Check if a tool handler is registered.

        Args:
            name: Name of the tool.

        Returns:
            True if handler is registered, False otherwise.
        """
        return name in self._handlers

    def get_registered_tools(self) -> list[str]:
        """
        Get list of registered tool names.

        Returns:
            List of tool names with registered handlers.
        """
        return list(self._handlers.keys())

    def get_pending_tool_calls(self) -> list[ToolCall]:
        """
        Get all tool calls pending confirmation.

        Returns:
            List of tool calls with PENDING_CONFIRMATION status.
        """
        return [
            tc
            for tc in self._tool_calls.values()
            if tc.status == ToolCallStatus.PENDING_CONFIRMATION
        ]

    def get_tool_call(self, tool_call_id: str) -> ToolCall | None:
        """
        Get a tool call by ID.

        Args:
            tool_call_id: ID of the tool call.

        Returns:
            ToolCall if found, None otherwise.
        """
        return self._tool_calls.get(tool_call_id)

    def clear(self) -> None:
        """Clear all tool calls from the executor."""
        self._tool_calls.clear()
