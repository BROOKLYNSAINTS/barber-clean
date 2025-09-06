// babel.config.js
module.exports = function (api) {
  api.cache(true);

  const config = {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      ['module-resolver', {
        root: ['./'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: { '@': './src' },
      }],
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
      'react-native-reanimated/plugin',
    ],
  };

  // 👇 This will show up in EAS build logs
  try {
    const shape = config.plugins.map((p) =>
      Array.isArray(p) ? [p[0], typeof p[1]] : [p, 'none']
    );
    console.log('[BABEL SHAPE]', JSON.stringify(shape));
  } catch (e) { console.log('[BABEL SHAPE ERROR]', e?.message); }

  return config;
};