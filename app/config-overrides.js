const path = require("path");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = function override(config, env) {
  config.resolve.extensions.push(".wasm");

  config.module.rules.forEach((rule) => {
    (rule.oneOf || []).forEach((oneOf) => {
      if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
        // Make file-loader ignore WASM files
        oneOf.exclude.push(/\.wasm$/);
        oneOf.exclude.push(/\.worker\.js$/);
        oneOf.exclude.push(/\.vert$/);
        oneOf.exclude.push(/\.frag$/);
      }
    });
  });

  config.plugins = (config.plugins || []).concat([
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, "../rust"),
      outDir: path.resolve(__dirname, "./src/wasm"),
    }),
  ]);

  config.module.rules.push({
    test: /\.worker\.js$/,
    use: [{ loader: "worker-loader" }, { loader: "babel-loader" }],
  });

  config.module.rules.push({
    test: /\.vert$|\.frag$/,
    loader: 'raw-loader',
    options: {
      esModule: false,
    },
  })

  config.output.globalObject = "this";
  return config;
};
