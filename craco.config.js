const path = require("path");
const webpack = require("webpack");
const dotenv = require("dotenv");

const NODE_ENV = process.env.NODE_ENV || "development";
const rootDir = __dirname;

// Carrega .env base e sobrescreve com o arquivo específico do ambiente ativo.
dotenv.config({ path: path.resolve(rootDir, ".env") });
dotenv.config({ path: path.resolve(rootDir, `.env.${NODE_ENV}`), override: true });

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
      const envKeys = ["API_BASE_URL", "API_FESTIVAL", "API_VAGAS"];
      const definedEnv = envKeys.reduce((acc, key) => {
        acc[`process.env.${key}`] = JSON.stringify(process.env[key] || "");
        return acc;
      }, {});

      webpackConfig.plugins = [
        ...(webpackConfig.plugins || []),
        new webpack.DefinePlugin(definedEnv),
      ];

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
