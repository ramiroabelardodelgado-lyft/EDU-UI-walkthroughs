//PLUGIN
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');


const path = require('path');
const webpack = require('webpack');


module.exports = (env, argv) => ({
mode: argv.mode === 'production' ? 'production' : 'development',
watch: true,
// This is necessary because Figma's 'eval' works differently than normal eval
devtool: argv.mode === 'production' ? false : 'inline-source-map',
  entry: {
    ui: './src/ui.ts', 
    code: './src/code.ts' // This is the entry point for our plugin code.
  },
  module: {
    rules: [
      // Converts TypeScript code to JavaScript
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      
    ],
  },
  // Webpack tries these extensions for you if you omit the extension like "import './file'"
  resolve: {
    extensions: ['.tsx','.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  //Plugins HTMLWEBPACK PLUGIN
  plugins:[

    new webpack.DefinePlugin({
        global: {}, // Fix missing symbol error when running in developer VM
      }),
      new HtmlWebpackPlugin({
        inject: 'body',
        template: './src/ui.html',
        filename: 'ui.html',
        chunks: ['ui'],
      }),
      new HtmlInlineScriptPlugin({
        htmlMatchPattern: [/ui.html/],
        scriptMatchPattern: [/.js$/],
      }),
    
  ]

});