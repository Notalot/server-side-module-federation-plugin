const webpack = require("webpack");
const path = require("path");
const ServerSideModuleFederationPlugin = require("server-side-module-federation-plugin");

const remotes = (remoteType) => ({
  app2: `${remoteType === "client" ? "app2@" : ""}http://localhost:3002/${remoteType}/app2.js`,
});

const exposes = {
  "./Shared": "./src/shared",
};

const shared = { react: { singleton: true }, "react-dom": { singleton: true } };

const serverConfig = {
  optimization: { minimize: false },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.jsx?/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    node: true,
                  },
                },
              ],
              "@babel/preset-react",
            ],
          },
        },
      },
    ],
  },
  output: {
    path: path.join(__dirname, process.env.GUSA ? "dist/serverForGusa" : "dist/server"),
    libraryTarget: "commonjs-module",
    chunkLoading: "async-http-node",
    publicPath: process.env.GUSA ? 'https://glassesusa.dev/godnota/serverForGusa/' : "http://localhost:3003/server/",
  },
  entry: {},
  target: "node",
  plugins: [
    new ServerSideModuleFederationPlugin({
      name: "app3",
      library: { type: "commonjs-module" },
      exposes,
      remotes: remotes("server"),
      shared,
    }),
  ],
  stats: {
    errorDetails: true,
  },
  devServer: {
    port: process.env.GUSA ? 3004 : 3003,
    devMiddleware: {
      writeToDisk: true,
    },
    static: {
      directory: 'dist'
    },
    allowedHosts: 'all',
  },
};

const clientConfig = {
  optimization: { minimize: false },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.jsx?/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env"], "@babel/preset-react"],
          },
        },
      },
    ],
  },
  entry: {},
  plugins: [
    new webpack.container.ModuleFederationPlugin({
      name: "app3",
      exposes,
      remotes: remotes("client"),
      shared,
    }),
  ],
  output: {
    path: path.join(__dirname, "dist/client"),
  },
  stats: {
    errorDetails: true,
  },
};

module.exports = [clientConfig, serverConfig];
