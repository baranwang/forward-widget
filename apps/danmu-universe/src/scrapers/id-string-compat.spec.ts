import { generateProviderIdString, providerNames } from "@forward-widget/scraper-kit";
import { describe, expect, test } from "@rstest/core";
import { BilibiliScraper } from "./bilibili/bilibili";
import { scraper } from "./index";
import { IqiyiScraper } from "./iqiyi/iqiyi";
import { MgTVScraper } from "./mgtv/mgtv";
import { RenRenScraper } from "./renren/renren";
import { TencentScraper } from "./tencent/tencent";
import { YoukuScraper } from "./youku/youku";

class TencentScraperForTest extends TencentScraper {
  parseForTest(idString: string) {
    return this.parseIdString(idString);
  }
}

class YoukuScraperForTest extends YoukuScraper {
  parseForTest(idString: string) {
    return this.parseIdString(idString);
  }
}

class IqiyiScraperForTest extends IqiyiScraper {
  parseForTest(idString: string) {
    return this.parseIdString(idString);
  }
}

class BilibiliScraperForTest extends BilibiliScraper {
  parseForTest(idString: string) {
    return this.parseIdString(idString);
  }
}

class MgTVScraperForTest extends MgTVScraper {
  parseForTest(idString: string) {
    return this.parseIdString(idString);
  }
}

class RenRenScraperForTest extends RenRenScraper {
  parseForTest(idString: string) {
    return this.parseIdString(idString);
  }
}

describe("scraper id string compatibility", () => {
  test("app shim exposes package registry scraperMap and compatible ID generation", () => {
    expect(Object.keys(scraper.scraperMap).sort()).toEqual([...providerNames].sort());
    expect(scraper.scraperMap.tencent.generateIdString({ cid: "c1", vid: "v1" })).toBe(
      generateProviderIdString("tencent", { cid: "c1", vid: "v1" }),
    );
    expect(scraper.scraperMap.youku.generateIdString({ showId: "s1", vid: "v1" })).toBe(
      generateProviderIdString("youku", { showId: "s1", vid: "v1" }),
    );
    expect(scraper.scraperMap.iqiyi.generateIdString({ entityId: "e1" })).toBe(
      generateProviderIdString("iqiyi", { entityId: "e1" }),
    );
    expect(scraper.scraperMap.bilibili.generateIdString({ seasonId: "45962", aid: "1", cid: "2" })).toBe(
      generateProviderIdString("bilibili", { seasonId: "45962", aid: "1", cid: "2" }),
    );
    expect(scraper.scraperMap.mgtv.generateIdString({ dramaId: "860862", videoId: "123" })).toBe(
      generateProviderIdString("mgtv", { dramaId: "860862", videoId: "123" }),
    );
    expect(scraper.scraperMap.renren.generateIdString({ dramaId: 123, episodeId: 456 })).toBe(
      generateProviderIdString("renren", { dramaId: 123, episodeId: 456 }),
    );
  });

  test.each([
    {
      title: "tencent cid only",
      scraper: new TencentScraperForTest(),
      id: { cid: "c1" },
      expected: "cid=c1",
    },
    {
      title: "tencent cid and vid",
      scraper: new TencentScraperForTest(),
      id: { cid: "c1", vid: "v1" },
      expected: "cid=c1&vid=v1",
    },
    {
      title: "youku show and vid",
      scraper: new YoukuScraperForTest(),
      id: { showId: "s1", vid: "v1" },
      expected: "showId=s1&vid=v1",
    },
    {
      title: "iqiyi entity id",
      scraper: new IqiyiScraperForTest(),
      id: { entityId: "e1" },
      expected: "entityId=e1",
    },
    {
      title: "bilibili season only",
      scraper: new BilibiliScraperForTest(),
      id: { seasonId: "45962" },
      expected: "seasonId=45962",
    },
    {
      title: "bilibili full ids",
      scraper: new BilibiliScraperForTest(),
      id: { seasonId: "45962", aid: "1", cid: "2" },
      expected: "seasonId=45962&aid=1&cid=2",
    },
    {
      title: "mgtv drama only",
      scraper: new MgTVScraperForTest(),
      id: { dramaId: "860862" },
      expected: "dramaId=860862",
    },
    {
      title: "mgtv drama and video",
      scraper: new MgTVScraperForTest(),
      id: { dramaId: "860862", videoId: "123" },
      expected: "dramaId=860862&videoId=123",
    },
    {
      title: "renren drama only",
      scraper: new RenRenScraperForTest(),
      id: { dramaId: 123 },
      expected: "dramaId=123",
    },
    {
      title: "renren drama and episode",
      scraper: new RenRenScraperForTest(),
      id: { dramaId: 123, episodeId: 456 },
      expected: "dramaId=123&episodeId=456",
    },
  ])("$title", ({ scraper, id, expected }) => {
    expect(scraper.generateIdString(id as never)).toBe(expected);
    expect(scraper.parseForTest(expected)).toEqual(id);
  });
});
