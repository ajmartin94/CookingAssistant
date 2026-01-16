#!/usr/bin/env python3
import json
import sys
from pathlib import Path
from datetime import datetime

def extract_latest_plan_content(transcript_path):
    """Extract the most recent plan content from exit_plan_mode tool use."""
    if not Path(transcript_path).exists():
        print(f"Transcript file not found: {transcript_path}", file=sys.stderr)
        return None
    
    plan_content = None
    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            for line in f:
                entry = json.loads(line)
                # Look for assistant messages with exit_plan_mode tool use
                if entry.get('type') == 'assistant':
                    content = entry.get('message', {}).get('content', [])
                    for block in content:
                        if block.get('type') == 'tool_use' and block.get('name') == 'ExitPlanMode':
                            # The plan is the markdown string in the tool input
                            plan_content = block.get('input', {}).get('plan')
                            if plan_content:
                                return plan_content,
    except Exception as e:
        print(f"Error parsing transcript: {e}", file=sys.stderr)
        return None
    
    if not plan_content:
        print(f"No exit_plan_mode tool use found in transcript", file=sys.stderr)
    return plan_content

def extract_todos(transcript_path):
    """Extract the most recent TodoWrite todos for comparison."""
    if not Path(transcript_path).exists():
        return None
    
    todos = None
    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            for line in f:
                entry = json.loads(line)
                if entry.get('type') == 'assistant':
                    content = entry.get('message', {}).get('content', [])
                    for block in content:
                        if block.get('type') == 'tool_use' and block.get('name') == 'TodoWrite':
                            todos = block.get('input', {}).get('todos', [])
    except Exception as e:
        print(f"Error parsing todos from transcript: {e}", file=sys.stderr)
        return None
    
    return todos

def save_plan_markdown(plan_md, todos, project_dir, stage='final'):
    """Save plan as markdown file with metadata."""
    if not plan_md:
        print(f"No plan content to save for stage: {stage}", file=sys.stderr)
        return False
    
    plans_dir = Path(project_dir) / '.claude' / 'plans'
    try:
        plans_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"Error creating plans directory: {e}", file=sys.stderr)
        return False
    
    timestamp = datetime.now().isoformat().replace(':', '-')
    plan_file = plans_dir / f"plan-{stage}-{timestamp}.md"
    
    try:
        with open(plan_file, 'w', encoding='utf-8') as f:
            # Write metadata header
            f.write(f"# Plan ({stage.upper()})\n\n")
            f.write(f"**Timestamp:** {datetime.now().isoformat()}\n\n")
            
            # Write the markdown plan
            f.write(plan_md)
            
            # Append todo summary if available
            if todos:
                f.write("\n\n## Execution Summary\n\n")
                completed = sum(1 for todo in todos if todo.get('status') == 'completed')
                in_progress = sum(1 for todo in todos if todo.get('status') == 'in_progress')
                pending = sum(1 for todo in todos if todo.get('status') == 'pending')
                
                f.write(f"- **Total:** {len(todos)}\n")
                f.write(f"- **Completed:** {completed}\n")
                f.write(f"- **In Progress:** {in_progress}\n")
                f.write(f"- **Pending:** {pending}\n")
        
        print(f"Plan ({stage}) saved to {plan_file}")
        return True
    except Exception as e:
        print(f"Error saving plan to file: {e}", file=sys.stderr)
        return False

def main():
    try:
        hook_input = json.load(sys.stdin)
        # print(hook_input, file=sys.stderr)  # Debug output
        transcript_path = hook_input.get('transcript_path')
        project_dir = hook_input.get('cwd')
        hook_event = hook_input.get('hook_event_name')
        tool_name = hook_input.get('tool_name')
        
        if not transcript_path or not project_dir:
            print(f"Missing transcript_path or cwd in hook input", file=sys.stderr)
            sys.exit(0)
        
        # Determine stage based on hook event
        if hook_event == 'PreToolUse' and tool_name == 'exit_plan_mode':
            stage = 'initial'
            plan_md = extract_latest_plan_content(transcript_path)
            todos = extract_todos(transcript_path)
        elif hook_event == 'Stop':
            stage = 'final'
            plan_md = extract_latest_plan_content(transcript_path)
            todos = extract_todos(transcript_path)
        else:
            print(f"Hook not configured for event: {hook_event}, tool: {tool_name}", file=sys.stderr)
            sys.exit(0)
        
        if plan_md and save_plan_markdown(plan_md, todos, project_dir, stage):
            sys.exit(0)  # Success
        else:
            sys.exit(1)  # Non-blocking error
    except json.JSONDecodeError as e:
        print(f"Error decoding hook input JSON: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected hook error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()