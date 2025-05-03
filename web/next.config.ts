import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Output static HTML/JS.
  distDir: "build",
  trailingSlash: true,
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.vert$|\.frag$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
