#!/bin/bash

echo "=== DEBUG EAS BUILD SCRIPT ==="
echo "This script will help diagnose EAS build issues"

echo -e "\n=== CHECKING CONFIGURATION FILES ==="

# Check if all required files exist
echo -e "\nChecking critical files:"
files_to_check=(
  "app.config.js"
  "babel.config.js"
  "tsconfig.json"
  "metro.config.js"
  "eas.json"
  "App.js"
  "app/index.js"
  "app/_layout.js"
)

for file in "${files_to_check[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file is missing"
  fi
done

# Check for conflicting files
echo -e "\nChecking for conflicting files:"
if [ -f "app.json" ]; then
  echo "⚠️ app.json exists - may conflict with app.config.js"
  echo "Contents:"
  cat app.json
else
  echo "✅ No conflicting app.json found"
fi

# Check npm/yarn and node versions
echo -e "\n=== CHECKING ENVIRONMENT ==="
echo "Node version:"
node -v
echo "npm version:"
npm -v
if command -v yarn &> /dev/null; then
  echo "yarn version:"
  yarn -v
fi

# Create a minimal test app
echo -e "\n=== RUNNING EXPO DOCTOR ==="
npx expo-doctor

echo -e "\n=== VALIDATING ENTRY POINTS ==="
# Check the main field in package.json
MAIN=$(node -e "console.log(require('./package.json').main)")
echo "package.json main field: $MAIN"

# Check if App.js exists and its content
if [ -f "App.js" ]; then
  echo "App.js content:"
  cat App.js
else
  echo "❌ App.js not found"
fi

echo -e "\n=== CHECKING APP STRUCTURE ==="
ls -la app/

echo -e "\n=== CHECKING RELEVANT DEPENDENCIES ==="
echo "Expo version:"
npx expo --version

echo -e "\n=== TRYING EXPO PREBUILD ==="
npx expo prebuild --clean

echo -e "\n=== CHECKING MODULE RESOLUTION ==="
cat << EOF > test-module-resolution.js
const path = require('path');
const fs = require('fs');

// Test module resolution for @/ paths
console.log("Testing module resolution for @/ paths");
console.log("Current working directory:", process.cwd());
console.log("src directory exists:", fs.existsSync('./src'));

// List directories in src
if (fs.existsSync('./src')) {
  console.log("Contents of src directory:", fs.readdirSync('./src'));
}

// Test babel config
console.log("\nBabel config:");
const babelConfig = require('./babel.config.js');
console.log(JSON.stringify(babelConfig, null, 2));

// Test tsconfig paths
console.log("\nTsconfig paths:");
try {
  const tsconfig = require('./tsconfig.json');
  console.log(JSON.stringify(tsconfig.compilerOptions.paths, null, 2));
} catch (err) {
  console.log("Error loading tsconfig:", err.message);
}

// Test metro config
console.log("\nMetro config:");
try {
  const metroConfig = require('./metro.config.js');
  console.log(JSON.stringify(metroConfig, null, 2));
} catch (err) {
  console.log("Error loading metro config:", err.message);
}
EOF

echo "Running module resolution test:"
node test-module-resolution.js

# Cleanup
rm test-module-resolution.js

echo -e "\n=== DEBUG COMPLETE ==="
echo "For EAS build, try running:"
echo "EXPO_DEBUG=1 eas build --platform ios --profile preview --non-interactive --no-wait --local"
echo "This will show more verbose output and may help identify the issue"