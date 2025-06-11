// metro.config.js

// metro.config.js
//const { getDefaultConfig } = require('expo/metro-config');

//const config = getDefaultConfig(__dirname);
//module.exports = config;

// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;



/*const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
/*  os: require.resolve('os-browserify'),
  'whatwg-fetch': require.resolve('whatwg-fetch'),
};*/

