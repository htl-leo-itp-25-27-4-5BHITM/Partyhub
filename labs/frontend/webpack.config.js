const path = require("path")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

const isProduction = process.env.NODE_ENV == 'production'
const stylesHandler = isProduction ? MiniCssExtractPlugin.loader : 'style-loader'

const config = {
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
    },
    devtool: "cheap-source-map",
    devServer: {
        open: true,
        host: 'localhost',
        port: 4200,
        historyApiFallback: {
            index: "/index.html",
            verbose: true
        },
        proxy: [
            {
                context: ["/api"],
                target: "http://localhost:8080",
                changeOrigin: true,
                logLevel: 'debug',
                secure: false,
                ws: true
            },
            {
                context: ["/realms", "/resources"],
                target: "http://localhost:1080",
                changeOrigin: true,
                logLevel: "debug",
                secure: false,
                ws: true
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html',
            scriptLoading: "module"
        }),
        new MiniCssExtractPlugin(),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
              { from: "images", to: "images" },
            ]
          })       
    ],
    module: {
        rules: [
            {
                test: /\.(ts)$/i,
                loader: 'ts-loader',
                exclude: ['/node_modules/'],
            },
            {
                test: /\.css$/i,
                use: [stylesHandler,'css-loader'],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js', '...'],
    }
}

module.exports = env => {
    const authUrl = env["auth-url"]
    const realm = env["realm"]
    const clientId = env["client-id"]
    const authSettings = {
        url: authUrl,
        realm,
        clientId
    }
    const definePlugin = new webpack.DefinePlugin({
        AUTHENTICATION_SETTINGS: JSON.stringify(authSettings),
        AUTH_URL: JSON.stringify(authUrl)
    })
    if (isProduction) {
        config.mode = 'production'
    } else {
        config.mode = 'development'
    }
    config.plugins.push(definePlugin)
    console.log(`building in ${config.mode} mode with authentication settings`, authSettings)
    return config
}
