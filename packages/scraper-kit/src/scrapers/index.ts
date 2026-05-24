import type { ProviderName } from "../provider-metadata";
import type { BaseScraper } from "./base";
import { BilibiliScraper } from "./bilibili";
import { IqiyiScraper } from "./iqiyi";
import { MgTVScraper } from "./mgtv";
import { RenRenScraper } from "./renren";
import { TencentScraper } from "./tencent";
import { YoukuScraper } from "./youku";

export type ScraperRegistryOptions = Record<never, never>;

type ScraperConstructor = new () => BaseScraper;

export const scraperConstructors = {
  tencent: TencentScraper,
  youku: YoukuScraper,
  iqiyi: IqiyiScraper,
  bilibili: BilibiliScraper,
  mgtv: MgTVScraper,
  renren: RenRenScraper,
} as const satisfies Record<ProviderName, ScraperConstructor>;

type ScraperInstances = {
  [Provider in keyof typeof scraperConstructors]: InstanceType<(typeof scraperConstructors)[Provider]>;
};

export type ScraperProviderMap = Record<string, BaseScraper> & ScraperInstances;

export type ScraperRegistry = {
  scrapers: BaseScraper[];
  scraperMap: ScraperProviderMap;
};

export function createScraperRegistry(_options: ScraperRegistryOptions = {}): ScraperRegistry {
  const scraperMap: ScraperProviderMap = {
    tencent: new scraperConstructors.tencent(),
    youku: new scraperConstructors.youku(),
    iqiyi: new scraperConstructors.iqiyi(),
    bilibili: new scraperConstructors.bilibili(),
    mgtv: new scraperConstructors.mgtv(),
    renren: new scraperConstructors.renren(),
  };
  const scrapers = Object.values(scraperMap);

  return {
    scrapers,
    scraperMap,
  };
}
