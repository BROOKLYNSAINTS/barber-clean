module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Do not apply aliases to node_modules
    overrides: [
      {
        test: ['./app', './src'],
        plugins: [['module-resolver', { alias: { '@': './src' } }]]
      }
    ]
  };
};
