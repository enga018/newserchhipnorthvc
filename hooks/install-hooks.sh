#!/bin/bash

# Install git hooks from the hooks directory to .git/hooks

set -e

HOOKS_DIR="hooks"
GIT_HOOKS_DIR=".git/hooks"

# Ensure .git/hooks exists
mkdir -p "$GIT_HOOKS_DIR"

# Copy all hooks
for hook in "$HOOKS_DIR"/*; do
    if [ -f "$hook" ]; then
        hook_name=$(basename "$hook")
        cp "$hook" "$GIT_HOOKS_DIR/$hook_name"
        chmod +x "$GIT_HOOKS_DIR/$hook_name"
        echo "✓ Installed hook: $hook_name"
    fi
done

echo "All hooks installed successfully!"
