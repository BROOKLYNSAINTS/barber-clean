// Register TypeScript extensions as JavaScript
require.extensions['.ts'] = require.extensions['.js'];
require.extensions['.tsx'] = require.extensions['.js'];
console.log('TypeScript support registered');
