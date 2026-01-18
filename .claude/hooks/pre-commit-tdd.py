#!/usr/bin/env python3
"""
PreToolUse hook that warns if committing code changes without test changes.

This hook runs BEFORE git commit commands execute. It checks if source code
was modified without corresponding test file modifications, and displays
a warning reminder about TDD workflow.

Warn only - does not block commits.
"""
import json
import sys
import re
import subprocess


def get_staged_files():
    """Get list of staged files from git."""
    try:
        result = subprocess.run(
            ['git', 'diff', '--cached', '--name-only'],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.stdout.strip().split('\n') if result.stdout.strip() else []
    except Exception:
        return []


def is_code_file(filepath):
    """Check if file is source code (not test, config, or docs)."""
    # Skip test files
    if 'test' in filepath.lower() or filepath.endswith('.test.ts') or filepath.endswith('.test.tsx'):
        return False
    # Skip config/docs
    if filepath.endswith(('.md', '.json', '.yaml', '.yml', '.toml', '.ini', '.env')):
        return False
    if filepath.startswith(('.github/', 'docs/', '.claude/')):
        return False
    # Check for source code
    code_patterns = [
        r'backend/app/.*\.py$',
        r'frontend/src/.*\.(ts|tsx)$',
    ]
    return any(re.match(p, filepath) for p in code_patterns)


def is_test_file(filepath):
    """Check if file is a test file."""
    test_patterns = [
        r'.*test.*\.py$',
        r'.*\.test\.(ts|tsx)$',
        r'tests?/.*\.py$',
    ]
    return any(re.match(p, filepath.lower()) for p in test_patterns)


def main():
    try:
        hook_input = json.load(sys.stdin)
        tool_input = hook_input.get('tool_input', {})
        command = tool_input.get('command', '')

        # Only check git commit commands
        if not re.search(r'\bgit\s+commit\b', command):
            print(json.dumps({"decision": "allow"}))
            return

        staged_files = get_staged_files()
        if not staged_files:
            print(json.dumps({"decision": "allow"}))
            return

        has_code_changes = any(is_code_file(f) for f in staged_files)
        has_test_changes = any(is_test_file(f) for f in staged_files)

        if has_code_changes and not has_test_changes:
            result = {
                "decision": "allow",
                "message": """
========================================
TDD REMINDER
========================================

Code changes detected without test changes.

If this is a feature or bug fix, consider:
1. Did you write tests first? (RED phase)
2. Are tests passing? (GREEN phase)
3. Did you spawn a review agent? (REVIEW phase)

Skip this warning for: docs, config, pure refactoring.

See /beads skill for full TDD workflow.
========================================
"""
            }
            print(json.dumps(result))
        else:
            print(json.dumps({"decision": "allow"}))

    except Exception as e:
        # On error, allow the tool but log
        print(json.dumps({"decision": "allow"}), file=sys.stdout)
        print(f"Hook error: {e}", file=sys.stderr)


if __name__ == '__main__':
    main()
