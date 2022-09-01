const webpack = require("webpack");
const path = require("path");
const ServerSideModuleFederationPlugin = require("server-side-module-federation-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const exposes = {
  "./Shared": "./src/shared",
};

const shared = { react: { singleton: true }, "react-dom": { singleton: true } };

const serverConfig = {
  mode: 'development',
  optimization: {
    chunkIds: 'deterministic',
    moduleIds: 'deterministic',  
  },
  module: {
    rules: [
      {
        test:  /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: "css-loader",
            options: {
              modules: true,
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
    clean: true,
    path: path.join(__dirname, "dist/server"),
    libraryTarget: "commonjs-module",
    chunkLoading: "async-http-node",
    publicPath: "http://localhost:3002/server/",
  },
  entry: {},
  target: "node",
  plugins: [
    new MiniCssExtractPlugin({
      runtime: false,
      filename: '[contenthash].css'
    }),
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
    static: {
      directory: 'dist'
    },
    port: 3002,
  },
};

const clientConfig = {
  mode: 'development',
  optimization: {
    chunkIds: 'deterministic',
    moduleIds: 'deterministic',  
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
            options: {
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
  entry: {},
  target: "web",
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[contenthash].css'
    }),
    new webpack.container.ModuleFederationPlugin({
      name: "app2",
      exposes,
    }),
  ],
  output: {
    clean: true,
    path: path.join(__dirname, "dist/client"),
  },
};

module.exports = [clientConfig, serverConfig];
