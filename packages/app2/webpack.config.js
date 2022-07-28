const webpack = require("webpack");
const path = require("path");
const ServerSideModuleFederationPlugin = require("server-side-module-federation-plugin");

const exposes = {
  "./Shared": "./src/shared",
};

const shared = { react: { singleton: true }, "react-dom": { singleton: true } };

const serverConfig = {
  optimization: { minimize: false },
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
    path: path.join(__dirname, "dist/server"),
    libraryTarget: "commonjs-module",
    chunkLoading: "async-http-node",
    publicPath: "http://localhost:3002/server/",
  },
  entry: {},
  target: "node",
  plugins: [
    new ServerSideModuleFederationPlugin({
      name: "app2",
      library: { type: "commonjs-module" },
      exposes,
      shared,
    }),
  ],
  devServer: {
    devMiddleware: {
      writeToDisk: true,
    },
    port: 3002,
  },
};

const clientConfig = {
  optimization: { minimize: false },
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
  output: {
    path: path.join(__dirname, "dist/client"),
  },
  entry: {},
  target: "web",
  plugins: [
    new webpack.container.ModuleFederationPlugin({
      name: "app2",
      exposes,
    }),
  ],
};

module.exports = [clientConfig, serverConfig];
