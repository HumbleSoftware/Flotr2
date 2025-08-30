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

echo "Updating CHANGELOG.md..."
# Create new changelog with current version at top
{
    echo "# Changelog"
    echo ""
    ./scripts/changelog.sh "$VERSION"
    
    # Append existing changelog if it exists
    if [ -f "CHANGELOG.md" ] && grep -q "^## " CHANGELOG.md; then
        tail -n +3 CHANGELOG.md  # Skip "# Changelog" and empty line
    fi
} > CHANGELOG_NEW.md

mv CHANGELOG_NEW.md CHANGELOG.md

echo ""
echo "Running tests..."
make test

echo "Building assets..."
make flotr2

echo "Committing built assets and changelog..."
git add flotr2*.js CHANGELOG.md
if git diff --staged --quiet; then
    echo "Warning: No changes to commit"
else
    git commit -m "build: assets and changelog for $VERSION"
fi

echo "Creating and pushing tag..."
git tag "$VERSION"
git push origin main
git push origin "$VERSION"

echo "Release $VERSION complete!"
echo "GitHub Actions will create the release automatically."
echo "Check: https://github.com/$(git remote get-url origin | sed 's/.*github\.com[:\/]\([^\/]*\/[^\/]*\)\.git.*/\1/')/releases"
