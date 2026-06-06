#!/bin/bash
set -euo pipefail

# Set git identity so commits appear under the user's own GitHub account
git config user.name "hosein-ul"
git config user.email "samroise22@gmail.com"

# Install root dependencies
npm install --legacy-peer-deps

# Install web dependencies
if [ -f "$CLAUDE_PROJECT_DIR/web/package.json" ]; then
  cd "$CLAUDE_PROJECT_DIR/web" && npm install --legacy-peer-deps
fi
