#!/bin/bash

echo "Finding and renaming problematic TypeScript files in node_modules..."

# Focus specifically on expo-modules-core which is causing the issue
if [ -d "./node_modules/expo-modules-core/src" ]; then
  echo "Found expo-modules-core directory, renaming its TypeScript files..."
  
  # Find all .ts files in the expo-modules-core directory and create .js copies
  find "./node_modules/expo-modules-core/src" -name "*.ts" | while read file; do
    js_file="${file%.ts}.js"
    if [ ! -f "$js_file" ]; then
      echo "Copying $file to $js_file"
      cp "$file" "$js_file"
    fi
  done
  
  echo "Expo modules core TS files copied to JS successfully."
fi

# Also check for other problematic modules that might be referenced
problematic_modules=(
  "expo-router"
  "@expo/config"
  "@expo/cli"
  "@expo/metro-config"
)

for module in "${problematic_modules[@]}"; do
  if [ -d "./node_modules/$module" ]; then
    echo "Processing $module..."
    find "./node_modules/$module" -name "*.ts" -not -path "*/node_modules/*" | while read file; do
      js_file="${file%.ts}.js"
      if [ ! -f "$js_file" ]; then
        echo "Copying $file to $js_file"
        cp "$file" "$js_file"
      fi
    done
  fi
done

echo "TypeScript file renaming complete!"
echo "Now you can try running the EAS build with:"
echo "EAS_BUILD_CONFIG_FILE=app.config.minimal.js eas build --platform ios --profile preview"