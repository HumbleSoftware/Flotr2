#!/bin/bash
set -e

# Check if version is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 v2.1.5"
    exit 1
fi

VERSION="$1"

# Validate version format (should start with v)
if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be in format v1.2.3"
    exit 1
fi

echo "Building assets..."
make flotr2

echo "Committing built assets..."
git add flotr2*.js
if git diff --staged --quiet; then
    echo "Warning: No changes to built assets"
else
    git commit -m "build: assets for $VERSION"
fi

echo "Creating and pushing tag..."
git tag "$VERSION"
git push origin main
git push origin "$VERSION"

echo "Release $VERSION complete!"
echo "GitHub Actions will create the release automatically."
echo "Check: https://github.com/$(git remote get-url origin | sed 's/.*github\.com[:\/]\([^\/]*\/[^\/]*\)\.git.*/\1/')/releases"
