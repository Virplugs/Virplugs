// vue.config.js

const StyleLintPlugin = require('stylelint-webpack-plugin');

module.exports = {
	lintOnSave: process.env.NODE_ENV !== 'production',
	configureWebpack: {
		node: {
			global: false
		},
		plugins: [
			new StyleLintPlugin({
				files: ['src/**/*.{vue,htm,html,css,sss,less,scss,sass}'],
			})
		],
		resolve: {
			symlinks: false
		},
		externals: [
		],
		module: {
			rules: [
				{
					test: /\.worker\.js$/i,
					use: [
						{
							loader: 'comlink-loader',
							options: {
								singleton: true
							}
						}
					]
				},
			]
		},
		devtool: 'source-map'
	},
	publicPath: process.env.NODE_ENV === 'production'
		? './'
		: '/',
	productionSourceMap: false,
	devServer: {
		port: 8123
	},

};
