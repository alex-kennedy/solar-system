const path = require("path");

module.exports = {
  webpack: function override(config, env) {
    config.module.rules.forEach((rule) => {
      (rule.oneOf || []).forEach((oneOf) => {
        if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
          oneOf.exclude.push(/\.worker\.(js|ts)$/);
          oneOf.exclude.push(/\.vert$/);
          oneOf.exclude.push(/\.frag$/);
        }
      });
    });

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
    config.output.filename = "static/js/[name].bundle.js";
    return config;
  },
  paths: function (paths, env) {
    paths.appIndexJs = path.resolve(__dirname, "app/src/index.tsx");
    paths.appSrc = path.resolve(__dirname, "app");
    return paths;
  },
};
