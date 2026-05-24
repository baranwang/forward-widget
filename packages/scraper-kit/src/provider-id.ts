import type { ProviderName } from "./provider-metadata";
import type { z } from "./runtime";
import { createScraperRegistry, type ScraperProviderMap } from "./scrapers";
import type { BilibiliId } from "./scrapers/bilibili";
import type { IqiyiId } from "./scrapers/iqiyi";
import type { MgTVId as MgtvId } from "./scrapers/mgtv/schema";
import type { RenRenId as RenrenId } from "./scrapers/renren";
import type { TencentId } from "./scrapers/tencent";
import type { YoukuId } from "./scrapers/youku";

export type { BilibiliId, IqiyiId, MgtvId, RenrenId, TencentId, YoukuId };
export type { ProviderName };
export { isProviderName, providerNames } from "./provider-metadata";

export type ProviderId = {
  tencent: TencentId;
  youku: YoukuId;
  iqiyi: IqiyiId;
  bilibili: BilibiliId;
  mgtv: MgtvId;
  renren: RenrenId;
};

const scraperMap = createScraperRegistry().scraperMap;

type ProviderScraper<P extends ProviderName> = ScraperProviderMap[P];

function getProviderScraper<P extends ProviderName>(provider: P): ProviderScraper<P> {
  return scraperMap[provider];
}

export function parseProviderIdString<P extends ProviderName>(
  provider: P,
  idString: string,
): z.infer<ProviderScraper<P>["idSchema"]> {
  return getProviderScraper(provider).parseProviderIdString(idString) as z.infer<ProviderScraper<P>["idSchema"]>;
}

export function generateProviderIdString<P extends ProviderName>(
  provider: P,
  id: Partial<ProviderId[P]> | Record<string, unknown>,
): string {
  switch (provider) {
    case "tencent":
      return scraperMap.tencent.generateIdString(id as unknown as TencentId);
    case "youku":
      return scraperMap.youku.generateIdString(id as unknown as YoukuId);
    case "iqiyi":
      return scraperMap.iqiyi.generateIdString(id as unknown as IqiyiId);
    case "bilibili":
      return scraperMap.bilibili.generateIdString(id as unknown as BilibiliId);
    case "mgtv":
      return scraperMap.mgtv.generateIdString(id as unknown as MgtvId);
    case "renren":
      return scraperMap.renren.generateIdString(
        id as unknown as Parameters<typeof scraperMap.renren.generateIdString>[0],
      );
  }
}
