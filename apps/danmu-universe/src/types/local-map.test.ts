import { providerNames } from "@forward-widget/scraper-kit/provider-metadata";
import { describe, expect, test } from "@rstest/core";
import type { LocalGeneratedMap, LocalMapLookupParams, LocalMapProvider } from "./local-map";

describe("LocalMap types", () => {
  test("accepts the generated flat movie and TV runtime map shape", () => {
    const localMap: LocalGeneratedMap = {
      movie: {
        "980477": [
          { provider: "tencent", idString: "cid=m441e3rjq9kuht7" },
          { provider: "iqiyi", idString: "entityId=107050701" },
        ],
      },
      tv: {
        "30983": [
          { season: 1, provider: "bilibili", idString: "seasonId=34430", epRange: [1, 24], epOffset: 0 },
          { season: 1, provider: "bilibili", idString: "seasonId=45574", epRange: [25, 47], epOffset: -24 },
        ],
      },
    };

    expect(localMap.movie["980477"]).toHaveLength(2);
    expect(localMap.tv["30983"][1].epOffset).toBe(-24);
  });

  test("accepts optional episode for TV lookup params", () => {
    const params: LocalMapLookupParams = {
      type: "tv",
      tmdbId: 30983,
      season: 1,
      episode: 25,
    };

    expect(params.episode).toBe(25);
  });

  test("should validate provider enum", () => {
    const providers: LocalMapProvider["provider"][] = [...providerNames];

    expect(providers).toHaveLength(6);
  });
});
