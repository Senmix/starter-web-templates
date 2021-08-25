// const path = require("path");
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";

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
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["react-app"],
                    },
                },
            },
        ],
    },
    resolve: {},
    devtool: "",
    plugins: [],
};
