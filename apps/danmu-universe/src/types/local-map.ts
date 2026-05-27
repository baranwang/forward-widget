export type { LocalGeneratedMap, LocalMapProvider } from "@forward-widget/tmdb-mapping-kit";

import type { LocalMapProvider } from "@forward-widget/tmdb-mapping-kit";

export type LocalMapLookupProvider = LocalMapProvider & {
  episodeNumber?: number;
};

/** 运行时查找参数 */
export interface LocalMapLookupParams {
  type: "movie" | "tv";
  tmdbId: number;
  season?: number | null;
  episode?: number | null;
}

/** 运行时查找结果 */
export type LocalMapLookupResult = LocalMapLookupProvider[] | null;
