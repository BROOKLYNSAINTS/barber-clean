const fs = require('fs');
const path = require('path');

// Read the existing package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add a preprocess script for TypeScript
packageJson.scripts = packageJson.scripts || {};
packageJson.scripts.prestart = "node ./build-support/ts-support.js";

// Make sure main points to a JS file
packageJson.main = "./App.js";

// Update the package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('Updated package.json for EAS build');
