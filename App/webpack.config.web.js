
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'production',
  target: 'web',
  entry: './index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/web/'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.template.html'
    })
  ]
};
