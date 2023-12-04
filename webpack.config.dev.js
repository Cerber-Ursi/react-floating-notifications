var path = require('path');
var webpack = require('webpack');

var JS_REGEX = /\.js$|\.jsx$|\.es6$|\.babel$|\.tsx?$/;

module.exports = {
  devtool: 'source-map',
  mode: 'development',
  entry: [
    'webpack-hot-middleware/client',
    './example/src/scripts/App'
  ],
  output: {
    path: path.join(__dirname, 'example/build'),
    filename: 'app.js',
    publicPath: 'build/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  resolve: {
    extensions: ['', '.js', '.jsx', '.ts', '.tsx', '.sass']
  },
  module: {
    rules: [
      {
        test: JS_REGEX,
        loader: 'babel-loader',
        options: {
          plugins: ['@babel/plugin-transform-modules-commonjs'],
          presets: ["@babel/preset-react", "@babel/preset-typescript"]
        }
      },
      {
        test: /\.sass$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                indentedSyntax: 'sass',
                indentWidth: 2,
                includePaths: [path.resolve(__dirname, 'example/src')],
              }
            }
          }
        ]
      },
      {
        test: /\.(jpe?g|png|gif|svg|woff|eot|ttf)$/,
        type: "asset/resource",
        exclude: /node_modules/
      }
    ]
  }
};
