import { LOCAL_TMDB_PLATFORM_MAP } from "@forward-widget/tmdb-mapping-kit/local-map";
import type { GetEpisodeParam } from "../scrapers";
import type { LocalMapLookupParams, LocalMapLookupProvider, LocalMapLookupResult } from "../types/local-map";

const cloneProviders = (providers: LocalMapLookupProvider[]): GetEpisodeParam[] =>
  providers.map(({ provider, idString, episodeNumber }) => {
    if (episodeNumber === undefined) return { provider, idString };
    return { provider, idString, episodeNumber };
  });

export const lookupLocalMap = ({ type, tmdbId, season, episode }: LocalMapLookupParams): LocalMapLookupResult => {
  if (!Number.isInteger(tmdbId) || tmdbId < 0) return null;
  const tmdbKey = String(tmdbId);
  if (type === "movie") {
    return LOCAL_TMDB_PLATFORM_MAP.movie[tmdbKey] ?? null;
  }
  const providers = LOCAL_TMDB_PLATFORM_MAP.tv[tmdbKey];
  if (!providers || season === null || season === undefined) return null;

  const seasonProviders = providers.filter((provider) => provider.season === season);
  if (episode === null || episode === undefined) {
    return seasonProviders.length ? seasonProviders : null;
  }

  const matchedProviders = seasonProviders.flatMap((provider): LocalMapLookupProvider[] => {
    if (provider.epRange && (episode < provider.epRange[0] || episode > provider.epRange[1])) {
      return [];
    }

    const episodeNumber = episode + provider.epOffset;
    if (!Number.isInteger(episodeNumber) || episodeNumber < 0) {
      return [];
    }

    return [{ ...provider, episodeNumber }];
  });
  return matchedProviders.length ? matchedProviders : null;
};

export const getLocalEpisodeParams = (params: LocalMapLookupParams): GetEpisodeParam[] => {
  const providers = lookupLocalMap(params);
  if (!providers) return [];
  return cloneProviders(providers);
};

if (import.meta.rstest) {
  const { describe, expect, test } = import.meta.rstest;

  describe("getLocalEpisodeParams real test", () => {
    test("沧元图", () => {
      const result = getLocalEpisodeParams({
        type: "tv",
        tmdbId: 229192,
        season: 1,
        episode: 79,
      });
      console.log(result);
      expect(result.length).toBe(1);
    });
  });
}
