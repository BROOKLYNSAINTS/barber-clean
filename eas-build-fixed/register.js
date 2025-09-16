// This file ensures TypeScript files can be processed
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    jsx: "react",
    module: "commonjs",
    target: "es2017",
    allowJs: true,
    esModuleInterop: true,
    skipLibCheck: true
  }
});

// Register TypeScript extension handler
require.extensions['.ts'] = require.extensions['.js'];
require.extensions['.tsx'] = require.extensions['.js'];

console.log('TypeScript registration complete');
