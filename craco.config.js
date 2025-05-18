const path = require("path");

module.exports = {
  webpack: {
    alias: {
      stream: "stream-browserify",
      https: "https-browserify",
      http: "stream-http",
      url: "url",
      util: "util",
      assert: "assert",
      zlib: "browserify-zlib",
    },
    configure: (webpackConfig) => {
      // Remover o CssMinimizerPlugin para evitar erro de barra
      if (webpackConfig.optimization && webpackConfig.optimization.minimizer) {
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
          (plugin) => plugin.constructor.name !== 'CssMinimizerPlugin'
        );
      }

      // Adicionar seus fallbacks existentes
      webpackConfig.resolve = {
        ...(webpackConfig.resolve || {}),
        fallback: {
          stream: require.resolve("stream-browserify"),
          https: require.resolve("https-browserify"),
          http: require.resolve("stream-http"),
          url: require.resolve("url/"),
          util: require.resolve("util/"),
          assert: require.resolve("assert/"),
          zlib: require.resolve("browserify-zlib"),
        },
      };

      return webpackConfig;
    },
  },
};
