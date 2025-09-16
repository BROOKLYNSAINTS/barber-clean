// This is a direct plugin for Metro to handle TypeScript files
// https://github.com/facebook/metro/blob/main/packages/metro-react-native-babel-transformer/src/index.js

const path = require('path');
const babel = require('@babel/core');
const fs = require('fs');

function transform({ src, filename, options }) {
  // If the file is TypeScript
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
    const babelConfig = {
      presets: ['module:metro-react-native-babel-preset'],
      plugins: ['babel-plugin-transform-typescript-metadata'],
      sourceType: 'unambiguous',
      filename,
    };

    const result = babel.transformSync(src, babelConfig);
    return {
      code: result.code,
      map: result.map,
    };
  }
  
  // For other file types, let the default transformer handle it
  return upstreamTransformer.transform({ src, filename, options });
}

// Get the default transformer
let upstreamTransformer = null;
try {
  upstreamTransformer = require('metro-react-native-babel-transformer');
  console.log('Using metro-react-native-babel-transformer as default');
} catch (e) {
  try {
    // Import the metro-react-native-babel-transformer directly from node_modules
    const transformerPath = path.join(__dirname, 'node_modules', 'metro-react-native-babel-transformer');
    upstreamTransformer = require(transformerPath);
    console.log('Using direct path to metro-react-native-babel-transformer');
  } catch (e) {
    console.error('Could not find default transformer');
    // Provide a simple transform function as fallback
    upstreamTransformer = { 
      transform: ({ src }) => { 
        return { code: src };
      } 
    };
  }
}

module.exports.transform = transform;