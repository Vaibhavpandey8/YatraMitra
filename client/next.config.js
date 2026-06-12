module.exports = {
  devIndicators: {
    autoPrerender: false,
  },
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.css$/,
      use: isServer
        ? ['ignore-loader']
        : ['style-loader', 'css-loader'],
    });
    return config;
  },
};