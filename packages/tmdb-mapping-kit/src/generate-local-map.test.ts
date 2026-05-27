import { describe, expect, test } from "@rstest/core";
import {
  createLocalMap,
  type LocalMapSourceFile,
  parseLocalMapSourceFile,
  renderLocalMapRuntimeModule,
} from "./generate-local-map";

function sourceFile(type: "movie" | "tv", tmdbId: number, body: unknown): LocalMapSourceFile {
  return {
    filePath: `/repo/packages/tmdb-mapping-kit/data/${type}/${tmdbId}.json`,
    content: JSON.stringify(body),
  };
}

describe("parseLocalMapSourceFile", () => {
  test("parses strict JSON mapping files and defaults TV provider epOffset", () => {
    const mapping = parseLocalMapSourceFile(
      sourceFile("tv", 95479, {
        type: "tv",
        tmdbId: 95479,
        title: "咒术回战",
        providers: [{ season: 1, provider: "bilibili", idString: "seasonId=34430", epRange: [1, 24] }],
      }),
    );

    expect(mapping).toEqual({
      type: "tv",
      tmdbId: 95479,
      title: "咒术回战",
      providers: [{ season: 1, provider: "bilibili", idString: "seasonId=34430", epRange: [1, 24], epOffset: 0 }],
    });
  });

  test("rejects filename and body TMDB id mismatches", () => {
    expect(() =>
      parseLocalMapSourceFile(
        sourceFile("tv", 91097, {
          type: "tv",
          tmdbId: 1,
          title: "Mismatch",
          providers: [{ season: 1, provider: "bilibili", idString: "seasonId=1" }],
        }),
      ),
    ).toThrow("filename TMDB id 91097 does not match body tmdbId 1");
  });

  test("rejects invalid JSON with file context", () => {
    expect(() =>
      parseLocalMapSourceFile({ filePath: "/repo/packages/tmdb-mapping-kit/data/tv/91097.json", content: "{" }),
    ).toThrow("/repo/packages/tmdb-mapping-kit/data/tv/91097.json: invalid JSON:");
  });

  test("rejects strict schema violations with file context", () => {
    expect(() =>
      parseLocalMapSourceFile(
        sourceFile("movie", 129, {
          type: "movie",
          tmdbId: 129,
          title: "Spirited Away",
          sourceUrl: "https://www.themoviedb.org/movie/129",
          providers: [{ provider: "iqiyi", idString: "vid-001" }],
        }),
      ),
    ).toThrow("/repo/packages/tmdb-mapping-kit/data/movie/129.json: schema validation failed:");
  });

  test("rejects files outside movie or tv parent directories", () => {
    expect(() =>
      parseLocalMapSourceFile({
        filePath: "/repo/packages/tmdb-mapping-kit/data/anime/95479.json",
        content: JSON.stringify({
          type: "tv",
          tmdbId: 95479,
          title: "Wrong Parent",
          providers: [{ season: 1, provider: "bilibili", idString: "seasonId=34430" }],
        }),
      }),
    ).toThrow("parent directory must be movie or tv");
  });
});

describe("createLocalMap", () => {
  test("emits flat movie and TV maps from JSON source files", () => {
    const map = createLocalMap([
      sourceFile("tv", 95479, {
        type: "tv",
        tmdbId: 95479,
        title: "咒术回战",
        providers: [
          { season: 1, provider: "bilibili", idString: "seasonId=45574", epOffset: -24, epRange: [25, 47] },
          { season: 1, provider: "bilibili", idString: "seasonId=34430", epRange: [1, 24] },
        ],
      }),
      sourceFile("tv", 97199, {
        type: "tv",
        tmdbId: 97199,
        title: "妻子的浪漫旅行",
        providers: [{ season: 6, provider: "mgtv", idString: "dramaId=860862" }],
      }),
      sourceFile("movie", 129, {
        type: "movie",
        tmdbId: 129,
        title: "Spirited Away",
        providers: [{ provider: "iqiyi", idString: "vid-001" }],
      }),
    ]);

    expect(map.movie["129"]).toEqual([{ provider: "iqiyi", idString: "vid-001" }]);
    expect(Array.isArray(map.tv["95479"])).toBe(true);
    expect(map.tv["95479"]).toEqual([
      { season: 1, provider: "bilibili", idString: "seasonId=34430", epRange: [1, 24], epOffset: 0 },
      { season: 1, provider: "bilibili", idString: "seasonId=45574", epRange: [25, 47], epOffset: -24 },
    ]);
    expect(map.tv["97199"]).toEqual([{ season: 6, provider: "mgtv", idString: "dramaId=860862", epOffset: 0 }]);
  });

  test("rejects duplicate source file paths deterministically", () => {
    const file = sourceFile("tv", 91097, {
      type: "tv",
      tmdbId: 91097,
      title: "Duplicate File",
      providers: [{ season: 1, provider: "bilibili", idString: "seasonId=1" }],
    });

    expect(() => createLocalMap([file, file])).toThrow("duplicate source file");
  });

  test("rejects duplicate TMDB mappings deterministically", () => {
    const mapping = {
      type: "tv",
      tmdbId: 91097,
      title: "Duplicate TMDB",
      providers: [{ season: 1, provider: "bilibili", idString: "seasonId=1" }],
    };

    expect(() =>
      createLocalMap([
        { filePath: "/repo-a/packages/tmdb-mapping-kit/data/tv/91097.json", content: JSON.stringify(mapping) },
        { filePath: "/repo-b/packages/tmdb-mapping-kit/data/tv/91097.json", content: JSON.stringify(mapping) },
      ]),
    ).toThrow("duplicate TMDB mapping tv:91097");
  });
});

describe("renderLocalMapRuntimeModule", () => {
  test("renders the flat local map runtime export", () => {
    const moduleCode = renderLocalMapRuntimeModule([
      sourceFile("tv", 97199, {
        type: "tv",
        tmdbId: 97199,
        title: "妻子的浪漫旅行",
        providers: [{ season: 6, provider: "mgtv", idString: "dramaId=860862" }],
      }),
    ]);

    expect(moduleCode).toContain("export const LOCAL_TMDB_PLATFORM_MAP = {");
    expect(moduleCode).toContain('"97199": [');
    expect(moduleCode).toContain('"epOffset": 0');
    expect(moduleCode).not.toContain('"6": [');
  });
});
