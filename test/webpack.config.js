var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './browser',
  output: {
    path: 'build',
    filename: 'index.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, exclude: /\.useable\.css$/, loader: "style!css" }
    ]
  },
  plugins: [new HtmlWebpackPlugin()]
};
