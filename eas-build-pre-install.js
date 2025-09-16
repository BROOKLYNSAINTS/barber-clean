// Fix for ".ts" extension error
const fs = require('fs');
const path = require('path');

// Add .ts to require.extensions
require.extensions['.ts'] = require.extensions['.js'];

// Create a minimal tsconfig if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'tsconfig.json'))) {
  const tsConfig = {
    extends: "expo/tsconfig.base",
    compilerOptions: {
      strict: false,
      allowJs: true,
      jsx: "react-native",
      esModuleInterop: true,
      skipLibCheck: true,
      noEmit: true
    },
    include: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.js",
      "**/*.jsx"
    ],
    exclude: [
      "node_modules"
    ]
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );
  
  console.log('Created tsconfig.json');
}

console.log('Build preparation complete!');