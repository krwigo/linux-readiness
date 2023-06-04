const path = require("path");
module.exports = {
  mode: "production",
  entry: [
    path.resolve(__dirname, "index.html"),
    path.resolve(__dirname, "frontend.js"),
  ],
  output: {
    path: path.resolve(__dirname, "docs"),
    publicPath: "/linux-readiness/",
    clean: true,
  },
  module: {
    rules: [
      {
        //
        test: /\.html$/i,
        loader: "file-loader",
        options: {
          name: "[name].[ext]?[hash]",
        },
      },
      {
        //
        test: /\.js$/i,
        loader: "esbuild-loader",
        options: {
          loader: "jsx",
          target: "es2015",
        },
      },
      {
        //
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },
  devServer: {
    allowedHosts: "all",
  },
  performance: {
    hints: false,
  },
};
