const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = (env, argv) => {
    // Determine if we're in development mode
    const isDevelopment = argv.mode === 'development';

    // Check for Cloudflare Pages environment
    const isCloudflarePages = process.env.CF_PAGES === '1';
    const isProductionBranch = isCloudflarePages && (process.env.CF_PAGES_BRANCH === 'release');
    const isPreviewBranch = isCloudflarePages && (process.env.CF_PAGES_BRANCH === 'main');
    const apiUrl = isDevelopment ? '"http://localhost:8787"' : '"https://probi-oh-api.gdare1.workers.dev"';

    // Set LOG based on our conditions
    const shouldLog = isDevelopment || (isPreviewBranch);

    return {
        entry: './src/app/index.tsx',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'bundle.[contenthash].js',
            clean: true,
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
            plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.aliases.json" })]
        },
        devtool: isDevelopment || isPreviewBranch ? 'eval-source-map' : false,
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
                        },
                    },
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.(png|jpe?g|gif|svg)$/i,
                    type: 'asset/resource',
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './public/index.html',
                favicon: "./public/favicon.ico"
            }),
            new webpack.DefinePlugin({
                'process.env.LOG': shouldLog,
                'process.env.DEVELOPMENT': isDevelopment,
                'process.env.PREVIEW': isPreviewBranch,
                'process.env.PRODUCTION': isProductionBranch,
                'process.env.API_URL': apiUrl,
            }),
        ],
        devServer: {
            static: path.join(__dirname, 'dist'),
            compress: true,
            port: 4000,
            historyApiFallback: true
        },
    };
};