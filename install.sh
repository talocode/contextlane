#!/usr/bin/env bash
set -e

echo "Installing @talocode/contextlane..."

if ! command -v node &>/dev/null; then
  echo "Error: Node.js is required. Install from https://nodejs.org"
  exit 1
fi

npm install -g @talocode/contextlane

echo ""
echo "ContextLane installed!"
echo "Run: contextlane demo"
