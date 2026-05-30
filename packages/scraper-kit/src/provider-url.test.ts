import { describe, expect, test } from "@rstest/core";
import { parseProviderIdStringFor, parseProviderUrl, parseProviderUrlFor } from "./index";
import { initializeFetchAdapter } from "./runtime";

initializeFetchAdapter({
  async get<T>(url: string) {
    if (url === "https://api.bilibili.com/pgc/view/web/season?ep_id=3409878") {
      return {
        data: { result: { season_id: 45962 } } as T,
        statusCode: 200,
        headers: {},
      };
    }

    if (url === "https://www.iqiyi.com/a_album.html") {
      return {
        data: '<html><body><a href="/v_mo3lbdn60s.html">episode</a></body></html>' as T,
        statusCode: 200,
        headers: {},
      };
    }

    if (
      url ===
      "https://openapi.youku.com/v2/videos/show_basic.json?client_id=53e6cc67237fc59a&package=com.huawei.hwvplayer.youku&video_id=XNTk3MzA5NzgzMg%3D%3D"
    ) {
      return {
        data: {
          id: "XNTk3MzA5NzgzMg==",
          show_id: "adaec02f09f9469ab8d8",
          title: "Example Youku Episode",
          seq: 1,
          duration: "2700",
          category: "电视剧",
          link: "https://v.youku.com/v_show/id_XNTk3MzA5NzgzMg==.html",
        } as T,
        statusCode: 200,
        headers: {},
      };
    }

    throw new Error(`Unexpected GET url: ${url}`);
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

  test("parses Youku v_show URL path and s query", async () => {
    const url = "https://v.youku.com/v_show/id_XNTk3MzA5NzgzMg==.html?&s=adaec02f09f9469ab8d8";

    await expect(parseProviderUrl(url)).resolves.toEqual({
      provider: "youku",
      id: { showId: "adaec02f09f9469ab8d8", vid: "XNTk3MzA5NzgzMg==" },
      idString: "showId=adaec02f09f9469ab8d8&vid=XNTk3MzA5NzgzMg%3D%3D",
      url,
    });
  });

  test("parses Youku v_show URL with only path vid", async () => {
    const url = "https://v.youku.com/v_show/id_XNTk3MzA5NzgzMg==.html";

    await expect(parseProviderUrl(url)).resolves.toEqual({
      provider: "youku",
      id: { showId: "adaec02f09f9469ab8d8", vid: "XNTk3MzA5NzgzMg==" },
      idString: "showId=adaec02f09f9469ab8d8&vid=XNTk3MzA5NzgzMg%3D%3D",
      url,
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

  test("parses IQIYI v_ URL via entityId conversion", async () => {
    await expect(parseProviderUrl("https://www.iqiyi.com/v_mo3lbdn60s.html")).resolves.toEqual({
      provider: "iqiyi",
      id: { entityId: "2349242958520400" },
      idString: "entityId=2349242958520400",
      url: "https://www.iqiyi.com/v_mo3lbdn60s.html",
    });
  });

  test("parses IQIYI a_ URL by fetching HTML and converting linked video id", async () => {
    await expect(parseProviderUrl("https://www.iqiyi.com/a_album.html")).resolves.toEqual({
      provider: "iqiyi",
      id: { entityId: "2349242958520400" },
      idString: "entityId=2349242958520400",
      url: "https://www.iqiyi.com/a_album.html",
    });
  });

  test("parseProviderUrlFor parses IQIYI v_ URL for iqiyi provider", async () => {
    await expect(parseProviderUrlFor("iqiyi", "https://www.iqiyi.com/v_mo3lbdn60s.html")).resolves.toEqual({
      id: { entityId: "2349242958520400" },
      idString: "entityId=2349242958520400",
      url: "https://www.iqiyi.com/v_mo3lbdn60s.html",
    });
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

  test("parseProviderIdStringFor parses idString through the selected provider", () => {
    expect(parseProviderIdStringFor("bilibili", "seasonId=45962")).toEqual({ seasonId: "45962" });
    expect(() => parseProviderIdStringFor("bilibili", "ses_19657d109ffe84cBiE6WQ5Qjrv")).toThrow("bilibili");
  });
});
