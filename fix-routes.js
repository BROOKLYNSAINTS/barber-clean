#!/usr/bin/env node

/**
 * This script fixes route files that are missing default exports
 * by checking for components that should be exported as default
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Helper function to fix a file
function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that already have default exports
    if (content.includes('export default')) {
      console.log(`✓ ${filePath} already has default export`);
      return;
    }
    
    // Common patterns for component names
    const componentNamePattern = /const\s+([A-Z][a-zA-Z0-9]*(?:Screen|Layout|Page|Component)?)\s*=/;
    const match = content.match(componentNamePattern);
    
    if (match && match[1]) {
      const componentName = match[1];
      
      // Add export default at the end if not present
      if (!content.includes(`export default ${componentName}`)) {
        const newContent = content + `\nexport default ${componentName};\n`;
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Added default export for ${componentName} in ${filePath}`);
      }
    } else {
      // Fallback - create a default component
      const filename = path.basename(filePath, path.extname(filePath));
      const componentName = filename
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

      const defaultComponent = `
// Default component created automatically
const ${componentName}Screen = () => {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>This is the ${filename.replace(/-/g, ' ')} screen</Text>
    </View>
  );
};

export default ${componentName}Screen;
`;

      const newContent = content + defaultComponent;
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`🔶 Created default component for ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Error fixing ${filePath}:`, err);
  }
}

// Find all route files in the app directory
const routeFiles = glob.sync('app/**/*.js', {
  ignore: ['app/index.js', 'app/_layout.js'] // These likely already have proper exports
});

console.log(`Found ${routeFiles.length} route files to check`);

// Fix each file
routeFiles.forEach(fixFile);

console.log('Done fixing route files!');
