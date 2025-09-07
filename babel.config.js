module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Keep as a string or a [preset, options] tuple — NOT a separate object.
      'babel-preset-expo',
      // If you ever need to disable the preset's reanimated transform, do it like:
      // ['babel-preset-expo', { reanimated: false }],
    ],
    plugins: [
      // Keep your aliases if you use them:
      ['module-resolver', {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: { '@': './' }  // adjust if you use a different alias map
      }],
      // Keep dotenv if you use @env:
      ['module:react-native-dotenv', { moduleName: '@env', path: '.env', safe: false, allowUndefined: true }],

      // IMPORTANT: this must be LAST
      'react-native-reanimated/plugin',
    ],
  };
};
EOF