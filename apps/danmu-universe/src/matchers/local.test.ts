import { describe, expect, test } from "@rstest/core";
import { getLocalEpisodeParams, lookupLocalMap } from "./local";

describe("Local TMDB platform map", () => {
  test("matches movie mappings by TMDB ID", () => {
    const providers = lookupLocalMap({ type: "movie", tmdbId: 980477 });
    expect(providers?.map((item) => item.provider).sort()).toEqual(["iqiyi", "tencent", "youku"]);
  });

  test("matches TV mappings by exact season", () => {
    const providers = lookupLocalMap({ type: "tv", tmdbId: 30983, season: 1 });
    expect(providers?.map((item) => item.provider).sort()).toEqual(["tencent", "youku"]);
  });

  test("does not fall back to series mapping when an explicit season misses", () => {
    const providers = lookupLocalMap({ type: "tv", tmdbId: 30983, season: 999 });
    expect(providers).toBeNull();
  });

  test("uses series mapping only when season is absent", () => {
    const providers = lookupLocalMap({ type: "tv", tmdbId: 30983, season: null });
    expect(providers).toEqual([{ provider: "bilibili", idString: "seasonId=45969" }]);
  });

  test("does not treat explicit season zero as series mapping", () => {
    const providers = lookupLocalMap({ type: "tv", tmdbId: 30983, season: 0 });
    expect(providers).toBeNull();
  });

  test("keeps movie and TV keys separate", () => {
    const movie = lookupLocalMap({ type: "movie", tmdbId: 30983 });
    const tv = lookupLocalMap({ type: "tv", tmdbId: 30983, season: null });
    expect(movie).toBeNull();
    expect(tv).not.toBeNull();
  });

  test("returns cloned GetEpisodeParam entries", () => {
    const providers = getLocalEpisodeParams({ type: "movie", tmdbId: 980477 });
    providers[0].idString = "mutated";
    expect(getLocalEpisodeParams({ type: "movie", tmdbId: 980477 })[0].idString).not.toBe("mutated");
  });
});
