import { describe, expect, test } from "@rstest/core";
import type { LocalMapEntry, LocalMapProvider } from "./local-map";

describe("LocalMap types", () => {
  test("should validate a movie entry", () => {
    const entry: LocalMapEntry = {
      type: "movie",
      tmdbId: 980477,
      title: "哪吒之魔童闹海",
      year: 2025,
      providers: [
        { provider: "tencent", idString: "cid=m441e3rjq9kuht7" },
        { provider: "iqiyi", idString: "entityId=107050701" },
      ],
      sourceUrl: "https://www.themoviedb.org/movie/980477",
      verifiedAt: "2025-01-15T00:00:00Z",
    };

    expect(entry.type).toBe("movie");
    expect(entry.tmdbId).toBe(980477);
    expect(entry.providers).toHaveLength(2);
  });

  test("should validate a tv entry with season", () => {
    const entry: LocalMapEntry = {
      type: "tv",
      tmdbId: 30983,
      season: 1,
      title: "名侦探柯南",
      providers: [{ provider: "tencent", idString: "cid=m441e3rjq9kuht7" }],
      sourceUrl: "https://www.themoviedb.org/tv/30983",
      verifiedAt: "2025-01-10T00:00:00Z",
    };

    expect(entry.type).toBe("tv");
    expect(entry.season).toBe(1);
  });

  test("should validate a tv entry with null season (series level)", () => {
    const entry: LocalMapEntry = {
      type: "tv",
      tmdbId: 30983,
      season: null,
      title: "名侦探柯南",
      providers: [{ provider: "bilibili", idString: "seasonId=45969" }],
      sourceUrl: "https://www.themoviedb.org/tv/30983",
      verifiedAt: "2025-01-10T00:00:00Z",
      notes: "series 级别映射",
    };

    expect(entry.season).toBeNull();
  });

  test("should validate provider enum", () => {
    const providers: LocalMapProvider["provider"][] = ["tencent", "youku", "iqiyi", "bilibili", "mgtv", "renren"];

    expect(providers).toHaveLength(6);
  });

  test("should validate JSONL sample data", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const filePath = path.resolve(process.cwd(), "../../packages/tmdb-mapping-kit/data/tmdb-platform-map.jsonl");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    expect(lines.length).toBeGreaterThan(0);

    for (const line of lines) {
      const entry = JSON.parse(line) as LocalMapEntry;
      expect(entry).toHaveProperty("type");
      expect(entry).toHaveProperty("tmdbId");
      expect(entry).toHaveProperty("providers");
      expect(entry).toHaveProperty("sourceUrl");
      expect(entry).toHaveProperty("verifiedAt");
      expect(entry.providers.length).toBeGreaterThan(0);

      for (const provider of entry.providers) {
        expect(provider).toHaveProperty("provider");
        expect(provider).toHaveProperty("idString");
      }
    }
  });
});
