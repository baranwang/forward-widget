import { LOCAL_TMDB_PLATFORM_MAP } from "@forward-widget/tmdb-mapping-kit/local-map";
import type { GetEpisodeParam } from "../scrapers";
import type { LocalMapLookupParams, LocalMapLookupResult, LocalMapProvider } from "../types/local-map";

const cloneProviders = (providers: LocalMapProvider[]): GetEpisodeParam[] =>
  providers.map(({ provider, idString, episodeNumber }) => {
    if (episodeNumber === undefined) return { provider, idString };
    return { provider, idString, episodeNumber };
  });

export const lookupLocalMap = ({ type, tmdbId, season }: LocalMapLookupParams): LocalMapLookupResult => {
  if (!Number.isInteger(tmdbId) || tmdbId < 0) return null;
  const tmdbKey = String(tmdbId);
  if (type === "movie") {
    return LOCAL_TMDB_PLATFORM_MAP.movie[tmdbKey] ?? null;
  }
  const tvData = LOCAL_TMDB_PLATFORM_MAP.tv[tmdbKey];
  if (!tvData) return null;
  if (season === null || season === undefined) return tvData.series ?? null;
  return tvData[season] ?? tvData.series ?? null;
};

export const getLocalEpisodeParams = (params: LocalMapLookupParams): GetEpisodeParam[] => {
  const providers = lookupLocalMap(params);
  if (!providers) return [];
  return cloneProviders(providers);
};
