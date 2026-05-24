import { describe, expect, test } from "@rstest/core";
import * as scraperKit from "./index";

const expectedProviderKeys = ["tencent", "youku", "iqiyi", "bilibili", "mgtv", "renren"];

describe("public API exports", () => {
  test("exports migrated registry and deterministic helpers", () => {
    expect(typeof scraperKit.createScraperRegistry).toBe("function");
    expect(typeof scraperKit.generateProviderIdString).toBe("function");
    expect(typeof scraperKit.parseProviderIdString).toBe("function");
    expect(typeof scraperKit.parseProviderUrl).toBe("function");
    expect(typeof scraperKit.parseEpNumber).toBe("function");
    expect(scraperKit.providerNames).toEqual(["tencent", "youku", "iqiyi", "bilibili", "mgtv", "renren"]);
  });

  test("createScraperRegistry returns all provider keys and instances", () => {
    const registry = scraperKit.createScraperRegistry();

    expect(Object.keys(registry.scraperMap)).toEqual(expectedProviderKeys);
    expect(registry.scrapers).toHaveLength(expectedProviderKeys.length);
    expect(registry.scraperMap.tencent).toBeInstanceOf(scraperKit.TencentScraper);
    expect(registry.scraperMap.youku).toBeInstanceOf(scraperKit.YoukuScraper);
    expect(registry.scraperMap.iqiyi).toBeInstanceOf(scraperKit.IqiyiScraper);
    expect(registry.scraperMap.bilibili).toBeInstanceOf(scraperKit.BilibiliScraper);
    expect(registry.scraperMap.renren).toBeInstanceOf(scraperKit.RenRenScraper);
    expect(registry.scraperMap.mgtv).toBeInstanceOf(scraperKit.MgTVScraper);
    expect(registry.scrapers).toEqual(expectedProviderKeys.map((provider) => registry.scraperMap[provider]));
  });

  test("parseEpNumber remains exported with deterministic helper behavior", () => {
    expect(scraperKit.parseEpNumber("第12集")).toBe(12);
    expect(scraperKit.parseEpNumber("第十二话")).toBe(12);
    expect(scraperKit.parseEpNumber("Some Show S02E03")).toBe(3);
    expect(scraperKit.parseEpNumber("trailer")).toBeNull();
  });
});
