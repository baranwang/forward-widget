import { describe, expect, test } from "@rstest/core";
import { parseProviderUrl, parseProviderUrlFor } from "./index";

describe("provider-url contracts", () => {
  test("malformed URL and unsupported host return null", () => {
    expect(parseProviderUrl("not-a-url")).toBeNull();
    expect(parseProviderUrl("https://example.com/video/123")).toBeNull();
  });

  test("parses Tencent cover URL with cid", () => {
    expect(parseProviderUrl("https://v.qq.com/x/cover/c1.html")).toEqual({
      provider: "tencent",
      id: { cid: "c1" },
      idString: "cid=c1",
      url: "https://v.qq.com/x/cover/c1.html",
    });
  });

  test("parses Tencent cover+vid URL", () => {
    expect(parseProviderUrl("https://v.qq.com/x/cover/c1/v1.html")).toEqual({
      provider: "tencent",
      id: { cid: "c1", vid: "v1" },
      idString: "cid=c1&vid=v1",
      url: "https://v.qq.com/x/cover/c1/v1.html",
    });
  });

  test("parses Youku query URL", () => {
    expect(parseProviderUrl("https://v.youku.com/v_show/id_xxx.html?showid=s1&vid=v1")).toEqual({
      provider: "youku",
      id: { showId: "s1", vid: "v1" },
      idString: "showId=s1&vid=v1",
      url: "https://v.youku.com/v_show/id_xxx.html?showid=s1&vid=v1",
    });
  });

  test("parses IQIYI query URLs with tvid/entityId", () => {
    expect(parseProviderUrl("https://www.iqiyi.com/?tvid=e1")).toEqual({
      provider: "iqiyi",
      id: { entityId: "e1" },
      idString: "entityId=e1",
      url: "https://www.iqiyi.com/?tvid=e1",
    });
    expect(parseProviderUrl("https://www.iqiyi.com/?entityId=e1")).toEqual({
      provider: "iqiyi",
      id: { entityId: "e1" },
      idString: "entityId=e1",
      url: "https://www.iqiyi.com/?entityId=e1",
    });
  });

  test("IQIYI v_ path returns null without app/provider conversion", () => {
    expect(parseProviderUrl("https://www.iqiyi.com/v_abc.html")).toBeNull();
  });

  test("Bilibili ss URL resolves directly", () => {
    expect(parseProviderUrl("https://www.bilibili.com/bangumi/play/ss45962")).toEqual({
      provider: "bilibili",
      id: { seasonId: "45962" },
      idString: "seasonId=45962",
      url: "https://www.bilibili.com/bangumi/play/ss45962",
    });
  });

  test("Bilibili ep URL returns null without network season lookup", () => {
    expect(parseProviderUrl("https://www.bilibili.com/bangumi/play/ep3409878")).toBeNull();
  });

  test("MGTV h URL resolves dramaId", () => {
    expect(parseProviderUrl("https://www.mgtv.com/h/860862.html")).toEqual({
      provider: "mgtv",
      id: { dramaId: "860862" },
      idString: "dramaId=860862",
      url: "https://www.mgtv.com/h/860862.html",
    });
  });

  test("MGTV b URL resolves dramaId+videoId", () => {
    expect(parseProviderUrl("https://www.mgtv.com/b/860862/123.html")).toEqual({
      provider: "mgtv",
      id: { dramaId: "860862", videoId: "123" },
      idString: "dramaId=860862&videoId=123",
      url: "https://www.mgtv.com/b/860862/123.html",
    });
  });

  test("Renren URL parsing remains null without direct known URL format", () => {
    expect(parseProviderUrl("https://www.rrdyw.net/play/123-456.html")).toBeNull();
  });

  test("parseProviderUrlFor returns MGTV id payload for matching provider", () => {
    expect(parseProviderUrlFor("mgtv", "https://www.mgtv.com/h/860862.html")).toEqual({
      id: { dramaId: "860862" },
      idString: "dramaId=860862",
      url: "https://www.mgtv.com/h/860862.html",
    });
  });

  test("parseProviderUrlFor returns null when provider mismatches", () => {
    expect(parseProviderUrlFor("bilibili", "https://www.mgtv.com/h/860862.html")).toBeNull();
  });

  test("parseProviderUrlFor returns null for malformed URL and does not throw", () => {
    expect(() => parseProviderUrlFor("mgtv", "not-a-url")).not.toThrow();
    expect(parseProviderUrlFor("mgtv", "not-a-url")).toBeNull();
  });
});
