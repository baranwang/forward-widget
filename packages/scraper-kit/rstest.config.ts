import { withRslibConfig } from "@rstest/adapter-rslib";
import { defineConfig } from "@rstest/core";

export default defineConfig({
  testEnvironment: "node",
  extends: withRslibConfig(),
});
