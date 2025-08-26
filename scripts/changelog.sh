#!/bin/bash
set -e

# Get the version (required parameter)
if [ -z "$1" ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 v2.1.5"
    exit 1
fi

VERSION="$1"

# Get previous tag
PREVIOUS_TAG=$(git tag -l "v*" --sort=-version:refname | head -1)

# Generate changelog entry
echo "## $VERSION ($(date +%Y-%m-%d))"
echo ""

if [ -n "$PREVIOUS_TAG" ]; then
    git log --pretty=format:"- %s" ${PREVIOUS_TAG}..HEAD --no-merges
else
    git log --pretty=format:"- %s" --no-merges
fi

echo ""