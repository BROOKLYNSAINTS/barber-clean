// metro.config.override.js
module.exports = {
  resolver: {
    sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'],
    assetExts: ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', 'ttf'],
    resolveRequest: (context, moduleName, platform) => {
      // Force main.js to be the entry point
      if (moduleName === 'expo-router/entry') {
        return {
          filePath: require.resolve('./main.js'),
          type: 'sourceFile',
        };
      }
      
      // Continue with the default resolution for all other modules
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};
