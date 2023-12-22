const path = require("path");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = {
  webpack: function override(config, env) {
    config.resolve.extensions.push(".wasm");

    config.module.rules.forEach((rule) => {
      (rule.oneOf || []).forEach((oneOf) => {
        if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
          // Make file-loader ignore WASM files
          oneOf.exclude.push(/\.wasm$/);
          oneOf.exclude.push(/\.worker\.(js|ts)$/);
          oneOf.exclude.push(/\.vert$/);
          oneOf.exclude.push(/\.frag$/);
        }
      });
    });

    config.plugins = (config.plugins || []).concat([
      new WasmPackPlugin({
        crateDirectory: path.resolve(__dirname, "./rust"),
        outDir: path.resolve(__dirname, "./app/src/wasm"),
      }),
    ]);

    config.module.rules.push({
      test: /\.worker\.js$/,
      use: [{ loader: "worker-loader" }, { loader: "babel-loader" }],
    });

    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: [{ loader: "worker-loader" }, { loader: "ts-loader" }],
    });

    config.module.rules.push({
      test: /\.vert$|\.frag$/,
      type: "asset/source",
    });

    config.output.globalObject = "this";
    config.output.filename = 'static/js/[name].bundle.js'
    return config;
  },
  paths: function(paths, env) {
    paths.appIndexJs = path.resolve(__dirname, 'app/src/index.tsx');
    paths.appSrc = path.resolve(__dirname, 'app');
    return paths;
  },
};
