import { describe, expect, test } from "@rstest/core";
import { generateProviderIdString, isProviderName, parseProviderIdString, providerNames } from "./index";

describe("provider-id contracts", () => {
  test("providerNames contains exactly all supported providers", () => {
    expect(providerNames).toEqual(["tencent", "youku", "iqiyi", "bilibili", "mgtv", "renren"]);
  });

  test("isProviderName validates known and unknown names", () => {
    expect(isProviderName("mgtv")).toBe(true);
    expect(isProviderName("unknown")).toBe(false);
  });

  test("generateProviderIdString contract examples", () => {
    expect(generateProviderIdString("tencent", { cid: "c1" })).toBe("cid=c1");
    expect(generateProviderIdString("tencent", { cid: "c1", vid: "v1" })).toBe("cid=c1&vid=v1");
    expect(generateProviderIdString("youku", { showId: "s1", vid: "v1" })).toBe("showId=s1&vid=v1");
    expect(generateProviderIdString("iqiyi", { entityId: "e1" })).toBe("entityId=e1");
    expect(generateProviderIdString("bilibili", { seasonId: "45962" })).toBe("seasonId=45962");
    expect(generateProviderIdString("bilibili", { seasonId: "45962", aid: "1", cid: "2" })).toBe(
      "seasonId=45962&aid=1&cid=2",
    );
    expect(generateProviderIdString("mgtv", { dramaId: "860862" })).toBe("dramaId=860862");
    expect(generateProviderIdString("mgtv", { dramaId: "860862", videoId: "123" })).toBe("dramaId=860862&videoId=123");
    expect(generateProviderIdString("renren", { dramaId: 123 })).toBe("dramaId=123");
    expect(generateProviderIdString("renren", { dramaId: 123, episodeId: 456 })).toBe("dramaId=123&episodeId=456");
  });

  test("parseProviderIdString parses renren numeric fields", () => {
    expect(parseProviderIdString("tencent", "cid=c1")).toEqual({ cid: "c1" });
    expect(parseProviderIdString("tencent", "cid=c1&vid=v1")).toEqual({ cid: "c1", vid: "v1" });
    expect(parseProviderIdString("youku", "showId=s1&vid=v1")).toEqual({ showId: "s1", vid: "v1" });
    expect(parseProviderIdString("iqiyi", "entityId=e1")).toEqual({ entityId: "e1" });
    expect(parseProviderIdString("bilibili", "seasonId=45962")).toEqual({ seasonId: "45962" });
    expect(parseProviderIdString("bilibili", "seasonId=45962&aid=1&cid=2")).toEqual({
      seasonId: "45962",
      aid: "1",
      cid: "2",
    });
    expect(parseProviderIdString("mgtv", "dramaId=860862")).toEqual({ dramaId: "860862" });
    expect(parseProviderIdString("mgtv", "dramaId=860862&videoId=123")).toEqual({
      dramaId: "860862",
      videoId: "123",
    });
    expect(parseProviderIdString("renren", "dramaId=123&episodeId=456")).toEqual({
      dramaId: 123,
      episodeId: 456,
    });
  });

  test("generateProviderIdString throws provider-specific error for missing required field", () => {
    expect(() => generateProviderIdString("tencent", { vid: "v1" })).toThrow(/tencent/i);
    expect(() => generateProviderIdString("iqiyi", {})).toThrow(/iqiyi/i);
    expect(() => generateProviderIdString("bilibili", { aid: "1" })).toThrow(/bilibili/i);
    expect(() => generateProviderIdString("mgtv", { videoId: "123" })).toThrow(/mgtv/i);
    expect(() => generateProviderIdString("renren", { episodeId: 456 })).toThrow(/renren/i);
    expect(() => generateProviderIdString("renren", { dramaId: "" })).toThrow(/renren/i);
  });

  test("parseProviderIdString rejects empty RenRen required numeric fields", () => {
    expect(() => parseProviderIdString("renren", "dramaId=")).toThrow(/renren/i);
    expect(parseProviderIdString("renren", "dramaId=123&episodeId=")).toEqual({ dramaId: 123 });
  });
});
