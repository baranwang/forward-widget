import type { BaseScraper } from "./base";
import { BilibiliScraper } from "./bilibili";
import { IqiyiScraper } from "./iqiyi";
import { MgTVScraper } from "./mgtv";
import { RenRenScraper } from "./renren";
import { TencentScraper } from "./tencent";
import { YoukuScraper } from "./youku";

export type ScraperRegistryOptions = Record<never, never>;

export type ScraperProviderMap = Record<string, BaseScraper> & {
  tencent: TencentScraper;
  youku: YoukuScraper;
  iqiyi: IqiyiScraper;
  bilibili: BilibiliScraper;
  renren: RenRenScraper;
  mgtv: MgTVScraper;
};

export type ScraperRegistry = {
  scrapers: BaseScraper[];
  scraperMap: ScraperProviderMap;
};

export function createScraperRegistry(_options: ScraperRegistryOptions = {}): ScraperRegistry {
  const tencent = new TencentScraper();
  const youku = new YoukuScraper();
  const iqiyi = new IqiyiScraper();
  const bilibili = new BilibiliScraper();
  const renren = new RenRenScraper();
  const mgtv = new MgTVScraper();
  const scrapers: BaseScraper[] = [tencent, youku, iqiyi, bilibili, renren, mgtv];
  const scraperMap: ScraperProviderMap = {
    tencent,
    youku,
    iqiyi,
    bilibili,
    renren,
    mgtv,
  };

  return {
    scrapers,
    scraperMap,
  };
}
