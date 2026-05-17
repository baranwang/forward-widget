export interface LocalMapProvider {
  provider: "tencent" | "youku" | "iqiyi" | "bilibili" | "mgtv" | "renren";
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
