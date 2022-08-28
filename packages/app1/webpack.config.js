const webpack = require("webpack");
const path = require("path");
const ServerSideModuleFederationPlugin = require("server-side-module-federation-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackAssetsManifest = require('webpack-assets-manifest');

const remotes = (remoteType) => ({
  app2: `${remoteType === "client" ? "app2@" : ""}http://localhost:3002/${remoteType}/app2.js`,
  app3: `${remoteType === "client" ? "app3@" : ""}http://localhost:3003/${remoteType}/app3.js`,
});

const shared = { 
  react: { singleton: true }, 
  "react-dom": { singleton: true },
  "@optimaxdev/utils": { singleton: true },
};

const serverConfig = {
  mode: 'production',
  optimization: { minimize: false },
  module: {
    rules: [
      {
        test:  /\.json$/,
        use: {
          loader: "json-loader",
        }
      },
      {
        test:  /\.css$/,
        use: [
          { 
            loader: "css-collector",
            options: {
              source: 'root',
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
            plugins: ["@loadable/babel-plugin"]
          },
        },
      },
    ],
  },
  entry: "./src/server/serverEntry.js",
  output: {
    clean: true,
    filename: "serverEntry.js",
    path: path.join(__dirname, "dist/server"),
    libraryTarget: "commonjs-module",
    chunkLoading: "async-http-node",
    publicPath: "http://localhost:3009/server/",
  },
  target: "node",
  plugins: [
    new MiniCssExtractPlugin(),
    new ServerSideModuleFederationPlugin({
      name: "app1",
      library: { type: "commonjs-module" },
      remotes: remotes("server"),
      shared,
    }),
  ],
  stats: { errorDetails: true },
  devServer: {
    writeToDisk: true,
  },
  resolveLoader: {
    alias: {
      'css-collector': path.resolve(__dirname, 'style-collector.loader.js'),
    },
  },
};

const clientConfig = {
  mode: 'production',
  optimization: { minimize: false },
  module: {
    rules: [
      {
        test:  /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          }, {
            loader: "css-loader",
            options: {
              url: true,
              modules: true,
            },
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
  entry: "./src/index.js",
  output: {
    clean: true, 
    path: path.join(__dirname, "dist/client"),
  },
  target: "web",
  plugins: [
    new WebpackAssetsManifest(),
    new MiniCssExtractPlugin({
      chunkFilename: '[name].css',
    }),
    new webpack.container.ModuleFederationPlugin({
      name: "app1",
      remotes: remotes("client"),
      shared,
    }),
  ],
  stats: { errorDetails: true },
};

module.exports = [clientConfig, serverConfig];
