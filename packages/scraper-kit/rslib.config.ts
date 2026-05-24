import { defineConfig } from "@rslib/core";
import { protobufjsPlugin } from "rsbuild-plugin-protobufjs";

const externalPackages = [
  /^@forward-widget\/libs-fetch$/,
  /^@forward-widget\/libs-storage$/,
  /^crypto-js(?:\/.*)?$/,
  /^date-fns$/,
  /^es-toolkit(?:\/.*)?$/,
  /^fast-xml-parser$/,
  /^querystringify$/,
  /^zod(?:\/.*)?$/,
];

export default defineConfig({
  source: {
    define: {
      "import.meta.rstest": false,
    },
  },
  plugins: [protobufjsPlugin()],
  output: {
    target: "web",
  },
  tools: {
    rspack(config) {
      config.externals = [...externalPackages, ...(Array.isArray(config.externals) ? config.externals : [])];
    },
  },
  lib: [
    {
      format: "esm",
      syntax: ["node 18"],
      dts: true,
      bundle: true,
      autoExternal: false,
    },
  ],
});
