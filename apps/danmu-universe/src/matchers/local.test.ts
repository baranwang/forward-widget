import { LOCAL_TMDB_PLATFORM_MAP } from "@forward-widget/tmdb-mapping-kit/local-map";
import { afterEach, beforeEach, describe, expect, rs, test } from "@rstest/core";
import "../index";
import { scraper } from "../scrapers";
import { DoubanMatcher } from "./douban";
import { getLocalEpisodeParams, lookupLocalMap } from "./local";

const resetLocalMap = () => {
  LOCAL_TMDB_PLATFORM_MAP.movie = {};
  LOCAL_TMDB_PLATFORM_MAP.tv = {};
};

const mappedTvProviders = [
  {
    season: 1,
    provider: "bilibili" as const,
    idString: "seasonId=34430",
    epRange: [1, 24] as [number, number],
    epOffset: 0,
  },
  {
    season: 1,
    provider: "bilibili" as const,
    idString: "seasonId=45574",
    epRange: [25, 47] as [number, number],
    epOffset: -24,
  },
  { season: 1, provider: "mgtv" as const, idString: "dramaId=season-1", epOffset: 0 },
  { season: 2, provider: "mgtv" as const, idString: "dramaId=season-2", epOffset: 0 },
];

beforeEach(() => {
  resetLocalMap();
});

afterEach(() => {
  rs.restoreAllMocks();
  resetLocalMap();
});

describe("Local TMDB platform map", () => {
  test("returns null for missing movie mappings", () => {
    const providers = lookupLocalMap({ type: "movie", tmdbId: 980477 });
    expect(providers).toBeNull();
  });

  test("returns null for missing TV season mappings", () => {
    const providers = lookupLocalMap({ type: "tv", tmdbId: 30983, season: 1 });
    expect(providers).toBeNull();
  });

  test("does not fall back to series mapping when an explicit season misses", () => {
    const providers = lookupLocalMap({ type: "tv", tmdbId: 30983, season: 999 });
    expect(providers).toBeNull();
  });

  test("returns null for missing series mapping when season is absent", () => {
    LOCAL_TMDB_PLATFORM_MAP.tv["30983"] = mappedTvProviders;

    const providers = lookupLocalMap({ type: "tv", tmdbId: 30983, season: null });
    expect(providers).toBeNull();
  });

  test("does not treat explicit season zero as series mapping", () => {
    const providers = lookupLocalMap({ type: "tv", tmdbId: 30983, season: 0 });
    expect(providers).toBeNull();
  });

  test("keeps movie and TV keys separate", () => {
    const movie = lookupLocalMap({ type: "movie", tmdbId: 30983 });
    const tv = lookupLocalMap({ type: "tv", tmdbId: 30983, season: null });
    expect(movie).toBeNull();
    expect(tv).toBeNull();
  });

  test("returns an empty list when local mapping is absent", () => {
    const providers = getLocalEpisodeParams({ type: "movie", tmdbId: 980477 });
    expect(providers).toEqual([]);
  });

  test("returns movie providers from the flat movie map", () => {
    LOCAL_TMDB_PLATFORM_MAP.movie["980477"] = [{ provider: "iqiyi", idString: "entityId=107050701" }];

    const providers = getLocalEpisodeParams({ type: "movie", tmdbId: 980477 });

    expect(providers).toEqual([{ provider: "iqiyi", idString: "entityId=107050701" }]);
  });

  test("maps TMDB season 1 episode 25 to provider episode 1 using epRange and epOffset", () => {
    LOCAL_TMDB_PLATFORM_MAP.tv["30983"] = mappedTvProviders;

    const providers = getLocalEpisodeParams({ type: "tv", tmdbId: 30983, season: 1, episode: 25 });

    expect(providers).toContainEqual({ provider: "bilibili", idString: "seasonId=45574", episodeNumber: 1 });
    expect(providers).not.toContainEqual({ provider: "bilibili", idString: "seasonId=34430", episodeNumber: 25 });
  });

  test("includes the epRange end when mapping TMDB episode 47 to provider episode 23", () => {
    LOCAL_TMDB_PLATFORM_MAP.tv["30983"] = mappedTvProviders;

    const providers = getLocalEpisodeParams({ type: "tv", tmdbId: 30983, season: 1, episode: 47 });

    expect(providers).toContainEqual({ provider: "bilibili", idString: "seasonId=45574", episodeNumber: 23 });
  });

  test("returns every requested-season provider without episodeNumber when episode is absent", () => {
    LOCAL_TMDB_PLATFORM_MAP.tv["30983"] = mappedTvProviders;

    const providers = getLocalEpisodeParams({ type: "tv", tmdbId: 30983, season: 1 });

    expect(providers).toEqual([
      { provider: "bilibili", idString: "seasonId=34430" },
      { provider: "bilibili", idString: "seasonId=45574" },
      { provider: "mgtv", idString: "dramaId=season-1" },
    ]);
  });

  test("supports season zero and episode zero when provider metadata allows them", () => {
    LOCAL_TMDB_PLATFORM_MAP.tv["30983"] = [
      { season: 0, provider: "bilibili", idString: "seasonId=zero", epRange: [0, 0], epOffset: 0 },
    ];

    const providers = getLocalEpisodeParams({ type: "tv", tmdbId: 30983, season: 0, episode: 0 });

    expect(providers).toEqual([{ provider: "bilibili", idString: "seasonId=zero", episodeNumber: 0 }]);
  });

  test("drops translated TV episodes that are negative or non-integer while keeping episode zero", () => {
    LOCAL_TMDB_PLATFORM_MAP.tv["30983"] = [
      { season: 1, provider: "bilibili", idString: "seasonId=zero", epOffset: -25 },
      { season: 1, provider: "bilibili", idString: "seasonId=negative", epOffset: -26 },
      { season: 1, provider: "bilibili", idString: "seasonId=fraction", epOffset: -24.5 },
    ];

    const providers = getLocalEpisodeParams({ type: "tv", tmdbId: 30983, season: 1, episode: 25 });

    expect(providers).toEqual([{ provider: "bilibili", idString: "seasonId=zero", episodeNumber: 0 }]);
  });
});

describe("searchDanmu local map episode filtering", () => {
  test("does not re-filter local-mapped scraper results by the original TMDB episode", async () => {
    LOCAL_TMDB_PLATFORM_MAP.tv["30983"] = [
      {
        season: 1,
        provider: "bilibili",
        idString: "seasonId=45574",
        epRange: [25, 47],
        epOffset: -24,
      },
    ];
    const getEpisodes = rs.spyOn(scraper, "getEpisodes").mockResolvedValueOnce([
      {
        provider: "bilibili",
        episodeId: "bilibili:platform-episode-1",
        episodeTitle: "平台第 1 集",
        episodeNumber: 1,
      },
    ]);

    const result = await searchDanmu({ type: "tv", tmdbId: "30983", season: "1", episode: "25" } as SearchDanmuParams);

    expect(getEpisodes).toHaveBeenCalledWith({ provider: "bilibili", idString: "seasonId=45574", episodeNumber: 1 });
    expect(result?.animes).toEqual([{ animeId: "bilibili:platform-episode-1", animeTitle: "[哔哩哔哩] 平台第 1 集" }]);
  });

  test("keeps generic episode filtering for non-local search results", async () => {
    rs.spyOn(DoubanMatcher.prototype, "getEpisodeParams").mockResolvedValueOnce({
      doubanIds: [],
      videoPlatformInfo: [{ provider: "bilibili", idString: "seasonId=generic" }],
    });
    const getEpisodes = rs.spyOn(scraper, "getEpisodes").mockResolvedValueOnce([
      {
        provider: "bilibili",
        episodeId: "bilibili:episode-3",
        episodeTitle: "第 3 集",
        episodeNumber: 3,
      },
      {
        provider: "bilibili",
        episodeId: "bilibili:episode-4",
        episodeTitle: "第 4 集",
        episodeNumber: 4,
      },
    ]);

    const result = await searchDanmu({
      type: "tv",
      tmdbId: "123456",
      season: "1",
      episode: "3",
      fuzzyMatch: "never",
    } as SearchDanmuParams);

    expect(getEpisodes).toHaveBeenCalledWith({ provider: "bilibili", idString: "seasonId=generic", episodeNumber: 3 });
    expect(result?.animes).toEqual([{ animeId: "bilibili:episode-3", animeTitle: "[哔哩哔哩] 第 3 集" }]);
  });
});
