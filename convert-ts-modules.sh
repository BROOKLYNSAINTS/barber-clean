#!/bin/bash

# Fix TypeScript files in node_modules
echo "Converting problematic TypeScript imports to JavaScript..."

# Find and process TypeScript files that are being imported
find "./node_modules" -name "*.ts" | while read file; do
  # Create a JavaScript version of each TypeScript file
  cp "$file" "${file%.ts}.js"
  echo "Created JS version for $file"
done

echo "Processing complete. Now attempting to build..."

# Run with minimal configuration
export EAS_BUILD_CONFIG_FILE=app.config.minimal.js 

# Run the build
eas build --platform ios --profile preview --non-interactive