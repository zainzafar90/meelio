# Task Master AI – Agent Integration Guide

## Essential Commands
We are using flat structure we don't have a `src` folder so don't put stuff into it, check the structure before coding

## Core Workflow Commands

```bash
# Project Setup
task-master init                                         # Initialize Task Master in current project
task-master parse-prd .taskmaster/docs/prd.txt           # Generate tasks from PRD document
task-master models --setup                               # Configure AI models interactively

# Daily Development Workflow
task-master list                                         # Show all tasks with status
task-master next                                         # Get next available task to work on
task-master show <id>                                    # View detailed task information (e.g., task-master show 1.2)
task-master set-status --id=<id> --status=done           # Mark task complete

# Task Management
task-master add-task --prompt="description" --research    # Add new task with AI assistance
task-master expand --id=<id> --research --force           # Break task into subtasks
task-master update-task --id=<id> --prompt="changes"     # Update a specific task
task-master update --from=<id> --prompt="changes"        # Update multiple tasks from ID onwards


# Additional Commands

task-master remove-task --id=<id>                               # Delete a task by ID
task-master assign --id=<id> --user=<username>                  # Assign task to a user
task-master priority --id=<id> --level=<low|medium|high>        # Set task priority
task-master tag add --id=<id> --tag=<tag>                       # Add a tag to a task
task-master tag remove --id=<id> --tag=<tag>                    # Remove a tag from a task
task-master search --query="keyword"                            # Search tasks by keyword
task-master export --format=json|csv --output=tasks.json        # Export tasks to JSON or CSV
task-master history --id=<id>                                   # Show task history and changes
task-master help                                                # Show general help and usage
