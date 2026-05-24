import { defineConfig } from "@rslib/core";
import { protobufjsPlugin } from "rsbuild-plugin-protobufjs";

export default defineConfig({
  source: {
    define: {
      "import.meta.rstest": false,
    },
  },
  plugins: [protobufjsPlugin({ wrap: "esm" })],
  output: {
    target: "web",
  },
  lib: [
    {
      format: "esm",
      syntax: ["node 18"],
      dts: true,
      bundle: false,
    },
  ],
});
