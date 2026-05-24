import { parse as parseQueryStringify, stringify as stringifyQueryStringify } from "querystringify";
import { generateProviderIdString, isProviderName, parseProviderIdString } from "../provider-id";
import { DEFAULT_COLOR_INT, Fetch, Logger, z } from "../runtime";
import { getEpisodeBlacklistPattern } from "./blacklist";
import type { GlobalParamsConfig } from "./config";
import { parseEpNumber } from "./parse-ep-number";

export interface ProviderDramaInfo {
  provider: string;
  dramaId: string;
  dramaTitle: string;
  season: number;
}

export interface ProviderEpisodeInfo {
  provider: string;
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number;
}

export interface ProviderSegmentInfo {
  provider: string;
  segmentId: string;
  startTime: number;
}

export interface SearchDanmuParams {
  seriesName?: string;
  season?: string | number;
  [key: string]: unknown;
}

export enum CommentMode {
  SCROLL = 1,
  BOTTOM = 4,
  TOP = 5,
}

export const providerCommentItemSchema = z.object({
  id: z.coerce.string().optional(),
  timestamp: z.coerce.number(),
  mode: z.enum(CommentMode).catch(CommentMode.SCROLL).optional().default(CommentMode.SCROLL),
  color: z.number().catch(DEFAULT_COLOR_INT).optional().default(DEFAULT_COLOR_INT),
  content: z.string(),
});

export type ProviderCommentItem = z.infer<typeof providerCommentItemSchema>;

export type ScraperFetch = Pick<
  Fetch,
  "cookie" | "headers" | "get" | "post" | "getCookie" | "setCookie" | "setHeaders"
>;

export interface BaseScraperRuntime {
  fetch: ScraperFetch;
  logger?: Logger;
}

export abstract class BaseScraper<IDType extends z.ZodType = z.ZodType> {
  public providerName = "base";

  public logger: Logger;

  protected fetch: ScraperFetch;

  constructor(runtime: BaseScraperRuntime = { fetch: new Fetch() }) {
    this.fetch = runtime.fetch;
    this.logger = runtime.logger ?? new Logger(this.providerName);
  }

  private _providerConfig = {} as GlobalParamsConfig["provider"];

  public get providerConfig() {
    return this._providerConfig;
  }
  public set providerConfig(config: GlobalParamsConfig["provider"]) {
    const currentConfig = (config as Record<string, unknown>)[this.providerName];
    if (currentConfig) {
      this.logger.debug("设置 Provider 配置", currentConfig);
      this._providerConfig = config;
    }
  }

  abstract idSchema: IDType;

  protected parseIdString(idString: string): z.infer<IDType> | null {
    let decodedIdString: Record<string, unknown>;
    try {
      if (isProviderName(this.providerName)) {
        decodedIdString = parseProviderIdString(this.providerName, idString) as Record<string, unknown>;
      } else {
        decodedIdString = parseQueryStringify(idString) as Record<string, unknown>;
      }
    } catch (error) {
      this.logger.error("parseIdString", idString, error);
      return null;
    }
    const result = this.idSchema?.safeParse(decodedIdString);
    if (!result) {
      this.logger.error("parseIdString", idString, "idSchema is not defined");
      return null;
    }
    if (!result.success) {
      this.logger.error("parseIdString", idString, z.prettifyError(result.error));
      return null;
    }
    return result.data ?? null;
  }
  generateIdString(id: z.infer<IDType>) {
    if (isProviderName(this.providerName)) {
      return generateProviderIdString(this.providerName, id as never);
    }
    return stringifyQueryStringify(this.idSchema.parse(id) as object);
  }

  search?(params: SearchDanmuParams): Promise<ProviderDramaInfo[]>;

  abstract getEpisodes(idString: string, episodeIndex?: number): Promise<ProviderEpisodeInfo[]>;

  abstract getSegments(idString: string): Promise<ProviderSegmentInfo[]>;

  abstract getComments(idString: string, segmentId: string): Promise<Array<ProviderCommentItem | null> | null>;

  protected getEpisodeIndexFromTitle(title: string): number | null {
    return parseEpNumber(title);
  }

  protected PROVIDER_SPECIFIC_BLACKLIST = "";

  get episodeBlacklistPattern() {
    return getEpisodeBlacklistPattern(this.PROVIDER_SPECIFIC_BLACKLIST);
  }
}
