module.exports = {
    entry: "./src/main.js",
    output: {
        path: "./build/",
        filename: "spaces-adapter.js"
    },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel"
            }
        ]
    },
    resolve: {
        alias: {
            "events": "wolfy-eventemitter"
        }
    }
};
