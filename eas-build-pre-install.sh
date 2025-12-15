#!/bin/bash
# Fix permissions for directories with parentheses
# This script runs before the build on EAS servers

set -e

echo "Fixing file permissions..."

# Ensure all directories are readable and executable
find . -type d -exec chmod 755 {} \;

# Ensure all files are readable
find . -type f -exec chmod 644 {} \;

# Make scripts executable
find . -name "*.sh" -exec chmod +x {} \;

echo "Permissions fixed successfully"

