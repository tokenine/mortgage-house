#!/usr/bin/env bash
# Quick setup script for Playwright E2E tests

set -e

echo "🎭 Setting up Playwright tests..."
echo ""

# Check if we're in the tests directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the tests/ directory"
    echo "   cd tests && ./setup.sh"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies with pnpm..."
pnpm install

# Install browsers
echo "🌐 Installing Chromium browser..."
pnpm exec playwright install chromium

echo ""
echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  pnpm test              - Run all tests"
echo "  pnpm run test:ui       - Run with UI mode"
echo "  pnpm run test:chromium - Run on Chromium only"
echo "  pnpm run test:debug    - Debug mode"
echo "  pnpm run test:report   - View last test report"
echo ""
echo "📖 See README.md for more information"
