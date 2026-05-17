import { defineConfig } from "@rslib/core";
import { localMapPlugin } from "./scripts/local-map-plugin.ts";

export default defineConfig({
  plugins: [localMapPlugin()],
  source: {
    entry: {
      index: "./src/index.ts",
      "local-map": "./src/local-map.ts",
    },
  },
  lib: [
    {
      format: "esm",
      syntax: ["node 18"],
      dts: true,
    },
  ],
});
