const webpack = require("webpack");
const path = require("path");
const ServerSideModuleFederationPlugin = require("server-side-module-federation-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackAssetsManifest = require('webpack-assets-manifest');

const remotes = (remoteType) => ({
  app2: `${remoteType === "client" ? "app2@" : ""}http://localhost:3002/${remoteType}/app2.js`,
});

const exposes = {
  "./Shared": "./src/shared",
};

const shared = { 
  react: { singleton: true }, 
  "react-dom": { singleton: true },
  "@optimaxdev/utils": { singleton: true },
};

const serverConfig = {
  optimization: { minimize: false },
  mode: 'development',
  module: {
    rules: [
      {
        test:  /\.css$/,
        use: [
          { 
            loader: "css-collector",
            options: {
              source: 'app3',
            }
          }, 
          {
            loader: "css-loader",
            options: {
              modules: {
                exportOnlyLocals: true
              },
            },
          }
        ],
      },
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
  resolveLoader: {
    alias: {
      'css-collector': path.resolve(__dirname, 'style-collector.loader.js'),
    },
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
  mode: 'production',
  optimization: { 
    minimize: false,
    chunkIds: 'named',
    moduleIds: 'named', 
  },
  module: {
    rules: [
      {
        test:  /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          }, {
            loader: "css-loader",
          }],
      },
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
    new WebpackAssetsManifest(),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new webpack.container.ModuleFederationPlugin({
      name: "app3",
      exposes,
      remotes: remotes("client"),
      shared,
    }),
  ],
  output: {
    clean: true,
    path: path.join(__dirname, "dist/client"),
  },
  stats: {
    errorDetails: true,
  },
};

module.exports = [clientConfig, serverConfig];
