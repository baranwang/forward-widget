import { describe, expect, test } from "@rstest/core";
import { getLocalEpisodeParams, lookupLocalMap } from "./local";

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
});
