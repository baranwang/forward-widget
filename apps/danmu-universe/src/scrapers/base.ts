import { BaseScraper as PackageBaseScraper } from "@forward-widget/scraper-kit";
import { Fetch } from "../libs/fetch";

export type {
  BaseScraperRuntime,
  ProviderCommentItem,
  ProviderDramaInfo,
  ProviderEpisodeInfo,
  ProviderSegmentInfo,
  ScraperFetch,
  SearchDanmuParams,
} from "@forward-widget/scraper-kit";
export { CommentMode, providerCommentItemSchema } from "@forward-widget/scraper-kit";

export abstract class BaseScraper<
  IDType extends import("@forward-widget/scraper-kit").z.ZodType = import("@forward-widget/scraper-kit").z.ZodType,
> extends PackageBaseScraper<IDType> {
  constructor() {
    super({ fetch: new Fetch() });
  }
}
