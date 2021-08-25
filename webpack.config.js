// const path = require("path");

module.exports = {
    entry: "./src/js/index.js",
    // context: path.resolve(__dirname),
    output: {
        // path: path.resolve(__dirname, "dist", "js"),
        filename: "index.min.js",
    },
    mode: "development",
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader"],
            },
        ],
    },
    resolve: {},
    devtool: "",
    plugins: [],
};
