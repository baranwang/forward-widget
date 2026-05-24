import type { ProviderName } from "@forward-widget/scraper-kit/provider-metadata";

export interface LocalMapProvider {
  provider: ProviderName;
  idString: string;
  episodeNumber?: number;
}

export type LocalGeneratedMap = {
  movie: Record<string, LocalMapProvider[]>;
  tv: Record<string, Record<string, LocalMapProvider[]>>;
};

export const LOCAL_TMDB_PLATFORM_MAP: LocalGeneratedMap = {
  movie: {},
  tv: {},
};
