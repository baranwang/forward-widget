import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "@rstest/core";

describe("index local mapping integration", () => {
  test("wires local mapping before Douban fallback", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "src/index.ts"), "utf-8");
    const localIndex = source.indexOf("const localEpisodeParams = Number.isInteger(tmdbId)");
    const doubanIndex = source.indexOf("new DoubanMatcher");
    expect(localIndex).toBeGreaterThanOrEqual(0);
    expect(doubanIndex).toBeGreaterThanOrEqual(0);
    expect(localIndex).toBeLessThan(doubanIndex);
  });
});
