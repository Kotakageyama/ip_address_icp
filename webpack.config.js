const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
    entry: './src/ip_address_frontend/assets/main.js',
    mode: isDevelopment ? 'development' : 'production',
    output: {
        filename: 'index.[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    optimization: {
        minimize: !isDevelopment,
        minimizer: [new TerserPlugin()],
    },
    resolve: {
        extensions: ['.js', '.ts'],
        fallback: {
            assert: require.resolve('assert/'),
            buffer: require.resolve('buffer/'),
            events: require.resolve('events/'),
            stream: require.resolve('stream-browserify/'),
            util: require.resolve('util/'),
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/ip_address_frontend/assets/index.html',
            filename: 'index.html',
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src/ip_address_frontend/assets/style.css'),
                    to: path.resolve(__dirname, 'dist'),
                },
            ],
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 8080,
        hot: true,
        proxy: {
            '/api': {
                target: 'http://localhost:4943',
                changeOrigin: true,
                pathRewrite: {
                    '^/api': '/api/v2',
                },
            },
        },
    },
    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
}; 