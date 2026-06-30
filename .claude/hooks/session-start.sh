#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code on the web sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "Installing dependencies..."
npm install

echo "Installing Playwright browsers..."
npx playwright install chromium

echo "Setup complete."
