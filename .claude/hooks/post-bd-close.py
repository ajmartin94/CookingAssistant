#!/usr/bin/env python3
"""
PostToolUse hook that checks if a bd close command was executed.
If so, outputs a reminder to commit immediately.

This hook runs AFTER the Bash tool completes and checks if the command
was a `bd close` operation. If it was, it displays a prominent reminder
to commit the changes.
"""
import json
import sys
import re


def main():
    try:
        hook_input = json.load(sys.stdin)
        tool_input = hook_input.get('tool_input', {})
        command = tool_input.get('command', '')

        # Check if this was a bd close command
        if re.search(r'\bbd\s+close\b', command):
            # Return a reminder message
            result = {
                "decision": "allow",
                "message": """
========================================
BEAD CLOSED - COMMIT REQUIRED
========================================

You just closed a bead. You MUST now:

1. git add .
2. git commit -m "type(scope): description

   Closes: <id>

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

Do NOT proceed with other work until this commit is made.
One closure = One commit. This is MANDATORY.
========================================
"""
            }
            print(json.dumps(result))
        else:
            # Not a bd close, allow silently
            print(json.dumps({"decision": "allow"}))

    except Exception as e:
        # On error, allow the tool but log
        print(json.dumps({"decision": "allow"}), file=sys.stdout)
        print(f"Hook error: {e}", file=sys.stderr)


if __name__ == '__main__':
    main()
