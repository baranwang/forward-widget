import { describe, expect, test } from "@rstest/core";
import { createLocalMap } from "./generate-local-map";
import { mappingFileSchema, movieMappingFileSchema, tvMappingFileSchema, tvProviderSchema } from "./schema";

describe("mappingFileSchema", () => {
  test("accepts the user TV example without sourceUrl", () => {
    const result = mappingFileSchema.safeParse({
      type: "tv",
      tmdbId: 95479,
      title: "咒术回战",
      providers: [
        { season: 1, provider: "bilibili", idString: "seasonId=34430", epRange: [1, 24] },
        { season: 1, provider: "bilibili", idString: "seasonId=45574", epOffset: -24, epRange: [25, 47] },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("defaults omitted provider epOffset to zero in output", () => {
    const result = tvProviderSchema.parse({
      season: 1,
      provider: "bilibili",
      idString: "seasonId=34430",
      epRange: [1, 24],
    });

    expect(result.epOffset).toBe(0);
  });

  test("accepts season zero, episode zero, and negative epOffset in TV providers", () => {
    const result = tvProviderSchema.parse({
      season: 0,
      provider: "bilibili",
      idString: "seasonId=zero",
      epRange: [0, 0],
      epOffset: -1,
    });

    expect(result).toEqual({
      season: 0,
      provider: "bilibili",
      idString: "seasonId=zero",
      epRange: [0, 0],
      epOffset: -1,
    });
  });

  test("rejects unknown fields on files and providers", () => {
    const fileResult = mappingFileSchema.safeParse({
      type: "movie",
      tmdbId: 129,
      title: "Spirited Away",
      sourceUrl: "https://www.themoviedb.org/movie/129",
      providers: [{ provider: "iqiyi", idString: "vid-001" }],
    });

    const providerResult = mappingFileSchema.safeParse({
      type: "movie",
      tmdbId: 129,
      title: "Spirited Away",
      providers: [{ provider: "iqiyi", idString: "vid-001", extra: true }],
    });

    expect(fileResult.success).toBe(false);
    expect(providerResult.success).toBe(false);
  });

  test("rejects movie provider TV-only fields", () => {
    for (const tvOnlyField of ["season", "epRange", "epOffset"] as const) {
      const provider = {
        provider: "iqiyi",
        idString: "vid-001",
        [tvOnlyField]: tvOnlyField === "epRange" ? [1, 2] : 1,
      };

      const result = movieMappingFileSchema.safeParse({
        type: "movie",
        tmdbId: 129,
        title: "Spirited Away",
        providers: [provider],
      });

      expect(result.success).toBe(false);
    }
  });

  test("rejects rejected long episode field names", () => {
    const tmdbPrefix = "tmdb";
    const platformPrefix = "platform";
    const episodeStart = "EpisodeStart";
    const episodeEnd = "EpisodeEnd";

    for (const rejectedField of [
      `${tmdbPrefix}${episodeStart}`,
      `${tmdbPrefix}${episodeEnd}`,
      `${platformPrefix}${episodeStart}`,
    ] as const) {
      const result = tvMappingFileSchema.safeParse({
        type: "tv",
        tmdbId: 95479,
        title: "咒术回战",
        providers: [
          {
            season: 1,
            provider: "bilibili",
            idString: "seasonId=34430",
            epRange: [1, 24],
            [rejectedField]: 1,
          },
        ],
      });

      expect(result.success).toBe(false);
    }
  });

  test("rejects invalid inclusive episode ranges", () => {
    const result = tvProviderSchema.safeParse({
      season: 1,
      provider: "bilibili",
      idString: "seasonId=34430",
      epRange: [24, 1],
    });

    expect(result.success).toBe(false);
  });

  test("requires TV providers to include season", () => {
    const result = tvMappingFileSchema.safeParse({
      type: "tv",
      tmdbId: 95479,
      title: "咒术回战",
      providers: [{ provider: "bilibili", idString: "seasonId=34430", epRange: [1, 24] }],
    });

    expect(result.success).toBe(false);
  });

  test("exposes English descriptions on schema fields", () => {
    expect(mappingFileSchema.description).toBe("Strict one-TMDB-one-JSON mapping source file.");
    expect(tvMappingFileSchema.shape.providers.description).toBe(
      "Provider mappings available for this TMDB TV series.",
    );
    expect(tvProviderSchema.shape.epRange.description).toBe(
      "Optional inclusive TMDB episode range for this provider entry.",
    );
  });
});

describe("createLocalMap", () => {
  test("emits a flat runtime map with defaulted TV provider offsets", () => {
    const map = createLocalMap([
      {
        filePath: "/repo/packages/tmdb-mapping-kit/data/tv/95479.json",
        content: JSON.stringify({
          type: "tv",
          tmdbId: 95479,
          title: "咒术回战",
          providers: [
            { season: 1, provider: "bilibili", idString: "seasonId=34430", epRange: [1, 24] },
            { season: 1, provider: "bilibili", idString: "seasonId=45574", epOffset: -24, epRange: [25, 47] },
          ],
        }),
      },
      {
        filePath: "/repo/packages/tmdb-mapping-kit/data/movie/129.json",
        content: JSON.stringify({
          type: "movie",
          tmdbId: 129,
          title: "Spirited Away",
          providers: [{ provider: "iqiyi", idString: "vid-001" }],
        }),
      },
    ]);

    expect(map.movie["129"]).toEqual([{ provider: "iqiyi", idString: "vid-001" }]);
    expect(Array.isArray(map.tv["95479"])).toBe(true);
    expect(map.tv["95479"]).toEqual([
      { season: 1, provider: "bilibili", idString: "seasonId=34430", epRange: [1, 24], epOffset: 0 },
      { season: 1, provider: "bilibili", idString: "seasonId=45574", epRange: [25, 47], epOffset: -24 },
    ]);
  });

  test("rejects filename and body mismatches", () => {
    expect(() =>
      createLocalMap([
        {
          filePath: "/repo/packages/tmdb-mapping-kit/data/tv/91097.json",
          content: JSON.stringify({
            type: "tv",
            tmdbId: 1,
            title: "Mismatch",
            providers: [{ season: 1, provider: "bilibili", idString: "seasonId=1" }],
          }),
        },
      ]),
    ).toThrow("filename TMDB id 91097 does not match body tmdbId 1");
  });

  test("rejects invalid JSON with file context", () => {
    expect(() =>
      createLocalMap([{ filePath: "/repo/packages/tmdb-mapping-kit/data/tv/91097.json", content: "{" }]),
    ).toThrow("/repo/packages/tmdb-mapping-kit/data/tv/91097.json: invalid JSON:");
  });

  test("rejects duplicate TMDB files deterministically", () => {
    const mapping = {
      type: "tv",
      tmdbId: 91097,
      title: "Duplicate",
      providers: [{ season: 1, provider: "bilibili", idString: "seasonId=1" }],
    };

    expect(() =>
      createLocalMap([
        { filePath: "/repo-a/packages/tmdb-mapping-kit/data/tv/91097.json", content: JSON.stringify(mapping) },
        { filePath: "/repo-b/packages/tmdb-mapping-kit/data/tv/91097.json", content: JSON.stringify(mapping) },
      ]),
    ).toThrow("duplicate TMDB mapping tv:91097");
  });
});
