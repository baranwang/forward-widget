import { withRslibConfig } from "@rstest/adapter-rslib";
import { defineConfig } from "@rstest/core";
import { protobufjsPlugin } from "rsbuild-plugin-protobufjs";

export default defineConfig({
  extends: withRslibConfig(),
  plugins: [protobufjsPlugin({ wrap: "esm" })],
});
