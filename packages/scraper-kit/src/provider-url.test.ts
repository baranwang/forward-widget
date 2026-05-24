import { describe, expect, test } from "@rstest/core";
import { parseProviderUrl, parseProviderUrlFor } from "./index";
import { initializeFetchAdapter } from "./runtime";

initializeFetchAdapter({
  async get<T>(url: string) {
    expect(url).toBe("https://api.bilibili.com/pgc/view/web/season?ep_id=3409878");
    return {
      data: { result: { season_id: 45962 } } as T,
      statusCode: 200,
      headers: {},
    };
  },
  async post<T>() {
    return {
      data: null as T,
      statusCode: 405,
      headers: {},
    };
  },
});

describe("provider-url contracts", () => {
  test("malformed URL and unsupported host return null", async () => {
    await expect(parseProviderUrl("not-a-url")).resolves.toBeNull();
    await expect(parseProviderUrl("https://example.com/video/123")).resolves.toBeNull();
  });

  test("parses Tencent cover URL with cid", async () => {
    await expect(parseProviderUrl("https://v.qq.com/x/cover/c1.html")).resolves.toEqual({
      provider: "tencent",
      id: { cid: "c1" },
      idString: "cid=c1",
      url: "https://v.qq.com/x/cover/c1.html",
    });
  });

  test("parses Tencent cover+vid URL", async () => {
    await expect(parseProviderUrl("https://v.qq.com/x/cover/c1/v1.html")).resolves.toEqual({
      provider: "tencent",
      id: { cid: "c1", vid: "v1" },
      idString: "cid=c1&vid=v1",
      url: "https://v.qq.com/x/cover/c1/v1.html",
    });
  });

  test("parses Youku query URL", async () => {
    await expect(parseProviderUrl("https://v.youku.com/v_show/id_xxx.html?showid=s1&vid=v1")).resolves.toEqual({
      provider: "youku",
      id: { showId: "s1", vid: "v1" },
      idString: "showId=s1&vid=v1",
      url: "https://v.youku.com/v_show/id_xxx.html?showid=s1&vid=v1",
    });
  });

  test("parses IQIYI query URLs with tvid/entityId", async () => {
    await expect(parseProviderUrl("https://www.iqiyi.com/?tvid=e1")).resolves.toEqual({
      provider: "iqiyi",
      id: { entityId: "e1" },
      idString: "entityId=e1",
      url: "https://www.iqiyi.com/?tvid=e1",
    });
    await expect(parseProviderUrl("https://www.iqiyi.com/?entityId=e1")).resolves.toEqual({
      provider: "iqiyi",
      id: { entityId: "e1" },
      idString: "entityId=e1",
      url: "https://www.iqiyi.com/?entityId=e1",
    });
  });

  test("IQIYI v_ path returns null without app/provider conversion", async () => {
    await expect(parseProviderUrl("https://www.iqiyi.com/v_abc.html")).resolves.toBeNull();
  });

  test("Bilibili ss URL resolves directly", async () => {
    await expect(parseProviderUrl("https://www.bilibili.com/bangumi/play/ss45962")).resolves.toEqual({
      provider: "bilibili",
      id: { seasonId: "45962" },
      idString: "seasonId=45962",
      url: "https://www.bilibili.com/bangumi/play/ss45962",
    });
  });

  test("Bilibili ep URL resolves season id through fetch", async () => {
    await expect(parseProviderUrl("https://www.bilibili.com/bangumi/play/ep3409878")).resolves.toEqual({
      provider: "bilibili",
      id: { seasonId: "45962" },
      idString: "seasonId=45962",
      url: "https://www.bilibili.com/bangumi/play/ep3409878",
    });
  });

  test("MGTV h URL resolves dramaId", async () => {
    await expect(parseProviderUrl("https://www.mgtv.com/h/860862.html")).resolves.toEqual({
      provider: "mgtv",
      id: { dramaId: "860862" },
      idString: "dramaId=860862",
      url: "https://www.mgtv.com/h/860862.html",
    });
  });

  test("MGTV b URL resolves dramaId+videoId", async () => {
    await expect(parseProviderUrl("https://www.mgtv.com/b/860862/123.html")).resolves.toEqual({
      provider: "mgtv",
      id: { dramaId: "860862", videoId: "123" },
      idString: "dramaId=860862&videoId=123",
      url: "https://www.mgtv.com/b/860862/123.html",
    });
  });

  test("Renren URL parsing remains null without direct known URL format", async () => {
    await expect(parseProviderUrl("https://www.rrdyw.net/play/123-456.html")).resolves.toBeNull();
  });

  test("parseProviderUrlFor returns MGTV id payload for matching provider", async () => {
    await expect(parseProviderUrlFor("mgtv", "https://www.mgtv.com/h/860862.html")).resolves.toEqual({
      id: { dramaId: "860862" },
      idString: "dramaId=860862",
      url: "https://www.mgtv.com/h/860862.html",
    });
  });

  test("parseProviderUrlFor returns null when provider mismatches", async () => {
    await expect(parseProviderUrlFor("bilibili", "https://www.mgtv.com/h/860862.html")).resolves.toBeNull();
  });

  test("parseProviderUrlFor returns null for malformed URL and does not throw", async () => {
    await expect(parseProviderUrlFor("mgtv", "not-a-url")).resolves.toBeNull();
  });
});
