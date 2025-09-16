// Patch require to handle .ts files
// This must be required before any other modules
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

// Override the resolution algorithm
Module._resolveFilename = function(request, parent, isMain, options) {
  try {
    return originalResolveFilename(request, parent, isMain, options);
  } catch (e) {
    // If it fails and the error is about .ts extension
    if (e.message.includes('.ts') && !request.endsWith('.ts')) {
      // Try with .ts extension
      try {
        return originalResolveFilename(request + '.ts', parent, isMain, options);
      } catch (tsError) {
        // If that fails, try .tsx
        try {
          return originalResolveFilename(request + '.tsx', parent, isMain, options);
        } catch (tsxError) {
          // If both fail, throw the original error
          throw e;
        }
      }
    }
    throw e;
  }
};

// Add TypeScript extensions to require.extensions
require.extensions['.ts'] = require.extensions['.js'];
require.extensions['.tsx'] = require.extensions['.js'];

console.log('TypeScript module loading patches applied');