/*
 * Copyright 2017 BTC Business Technology AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

let path = require("path");
let ExtractTextPlugin = require("extract-text-webpack-plugin");
let UglifyJSPlugin = require("uglifyjs-webpack-plugin");
let HtmlWebpackPlugin = require("html-webpack-plugin");
let OfflinePlugin = require("offline-plugin");

module.exports = function(env) {
    let isProduction = env ? env.production === true : false;
    let useSourceMaps = !isProduction;
    return {
        entry: "./src/ts/index.ts",
        output: {
            filename: "bundle.js",
            path: path.resolve(__dirname, "dist"),
            publicPath: ""
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: "ts-loader",
                    exclude: /node_modules/
                },
                {
                    enforce: 'pre',
                    test: /\.js$/,
                    use: "source-map-loader"
                },
                {
                    enforce: 'pre',
                    test: /\.tsx?$/,
                    use: "source-map-loader"
                },
                {
                    test: /\.css$/,
                    use: ExtractTextPlugin.extract({
                        use: {
                            loader: "css-loader",
                            options: {
                                minimize: true
                            }
                        }
                    })
                },
                {
                    test: /\.html$/,
                    use: [{
                        loader: 'html-loader',
                        options: {
                            minimize: true
                        }
                    }]
                },
                {
                    test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                    loader: 'url-loader?limit=30000' // higher limit causes multiple fonts to be included in css, this is bad because browser would only need one
                }
            ]
        },
        resolve: {
            extensions: [".ts", ".js"]
        },
        plugins: [
            new ExtractTextPlugin("styles.css"),
            new UglifyJSPlugin({
                sourceMap: useSourceMaps //Enabling the sourcemap changes bundle size from 700KB to 7MB
            }),
            new HtmlWebpackPlugin({
                template: 'src/index.html'
            }),
            new OfflinePlugin({
                ServiceWorker: {
                    events: true
                }
            })
        ],
        devtool: useSourceMaps ? "inline-source-map" : "",
        devServer: {
            inline: true
        }
    }
};
