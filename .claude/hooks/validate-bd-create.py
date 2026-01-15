#!/usr/bin/env python3
"""
PreToolUse hook that validates bd create commands have required fields.

This hook runs BEFORE the Bash tool executes and checks if the command
is a `bd create` operation. If it is, it validates that required fields
are present for the issue type being created.

Features MUST have: --design, --acceptance
Bugs MUST have: --description, --acceptance
"""
import json
import sys
import re


REQUIRED_FIELDS = {
    'feature': ['--design', '--acceptance'],
    'bug': ['--description', '--acceptance'],
}


def main():
    try:
        hook_input = json.load(sys.stdin)
        tool_input = hook_input.get('tool_input', {})
        command = tool_input.get('command', '')

        # Check if this is a bd create command
        if not re.search(r'\bbd\s+create\b', command):
            print(json.dumps({"decision": "allow"}))
            return

        # Extract issue type
        type_match = re.search(r'--type[=\s]+["\']?(\w+)["\']?', command)
        if not type_match:
            print(json.dumps({"decision": "allow"}))  # No type specified, allow
            return

        issue_type = type_match.group(1)
        required = REQUIRED_FIELDS.get(issue_type, [])

        # Check for missing required fields
        missing = []
        for field in required:
            if field not in command:
                missing.append(field)

        if missing:
            field_list = '\n'.join(f'  {f}' for f in required)
            result = {
                "decision": "allow",  # Allow but warn
                "message": f"""
========================================
WARNING: Missing Required Fields
========================================

Creating {issue_type} without required fields: {', '.join(missing)}

For {issue_type} issues, please include:
{field_list}

Consider canceling and re-running with the required fields.
See .claude/templates/bead-create-{issue_type}.md for examples.
========================================
"""
            }
            print(json.dumps(result))
        else:
            print(json.dumps({"decision": "allow"}))

    except Exception as e:
        print(json.dumps({"decision": "allow"}), file=sys.stdout)
        print(f"Hook error: {e}", file=sys.stderr)


if __name__ == '__main__':
    main()
