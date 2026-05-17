import type { LocalMapProvider } from "@forward-widget/tmdb-mapping-kit";

export type { LocalGeneratedMap, LocalMapProvider } from "@forward-widget/tmdb-mapping-kit";

export interface LocalMapEntry {
  /** 媒体类型 */
  type: "movie" | "tv";
  /** TMDB ID */
  tmdbId: number;
  /** 季度（TV 类型专用，null/undefined 表示 series 级别） */
  season?: number | null;
  /** 标题（用于人工审核） */
  title: string;
  /** 年份（用于人工审核） */
  year?: number;
  /** 平台映射 */
  providers: LocalMapProvider[];
  /** 来源 URL（证明映射正确性） */
  sourceUrl: string;
  /** 验证时间（ISO 8601） */
  verifiedAt: string;
  /** 状态 */
  state?: "active" | "deprecated" | "suspect";
  /** 备注 */
  notes?: string;
}

/** 运行时查找参数 */
export interface LocalMapLookupParams {
  type: "movie" | "tv";
  tmdbId: number;
  season?: number | null;
}

/** 运行时查找结果 */
export type LocalMapLookupResult = LocalMapProvider[] | null;
