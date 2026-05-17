import { expect, test } from "@rstest/core";
import { canonicalMappingSchema, mappingCandidateSchema } from "../src/index";

test("canonical movie row with jsonl-shaped providers passes", () => {
  const row = {
    type: "movie",
    tmdbId: 129,
    title: "Spirited Away",
    year: 2001,
    sourceUrl: "https://www.themoviedb.org/movie/129",
    verifiedAt: "2026-05-17T10:00:00.000Z",
    providers: [
      { provider: "iqiyi", idString: "123" },
      { provider: "youku", idString: "abc", episodeNumber: 3 },
    ],
  };

  const result = canonicalMappingSchema.safeParse(row);
  expect(result.success).toBe(true);
});

test("canonical tv row with null season passes", () => {
  const row = {
    type: "tv",
    tmdbId: 456,
    title: "Example Show",
    sourceUrl: "https://www.themoviedb.org/tv/456",
    season: null,
    verifiedAt: "2026-05-17T10:00:00.000Z",
    notes: "manually checked",
    state: "verified",
    providers: [{ provider: "tencent", idString: "tv-1" }],
  };

  const result = canonicalMappingSchema.safeParse(row);
  expect(result.success).toBe(true);
});

test("invalid provider fails canonical schema", () => {
  const row = {
    type: "movie",
    tmdbId: 1,
    title: "Bad Provider",
    sourceUrl: "https://www.themoviedb.org/movie/1",
    verifiedAt: "2026-05-17T10:00:00.000Z",
    providers: [{ provider: "netflix", idString: "n-1" }],
  };

  const result = canonicalMappingSchema.safeParse(row);
  expect(result.success).toBe(false);
});

test("invalid source url fails canonical schema", () => {
  const row = {
    type: "movie",
    tmdbId: 2,
    title: "Bad Url",
    sourceUrl: "not-a-url",
    verifiedAt: "2026-05-17T10:00:00.000Z",
    providers: [{ provider: "renren", idString: "rr-1" }],
  };

  const result = canonicalMappingSchema.safeParse(row);
  expect(result.success).toBe(false);
});

test("non-integer season fails canonical schema", () => {
  const row = {
    type: "tv",
    tmdbId: 3,
    title: "Bad Season",
    sourceUrl: "https://www.themoviedb.org/tv/3",
    season: 1.5,
    verifiedAt: "2026-05-17T10:00:00.000Z",
    providers: [{ provider: "mgtv", idString: "m-1" }],
  };

  const result = canonicalMappingSchema.safeParse(row);
  expect(result.success).toBe(false);
});

test("candidate schema requires provider url", () => {
  const missingProviderUrl = {
    type: "movie",
    tmdbId: 4,
    title: "Candidate Missing Url",
    sourceUrl: "https://www.themoviedb.org/movie/4",
    verifiedAt: "2026-05-17T10:00:00.000Z",
    providers: [{ provider: "bilibili", idString: "bb-1" }],
  };

  const withProviderUrl = {
    ...missingProviderUrl,
    providers: [
      {
        provider: "bilibili",
        idString: "bb-1",
        url: "https://www.bilibili.com/video/BV1xx",
      },
    ],
  };

  expect(mappingCandidateSchema.safeParse(missingProviderUrl).success).toBe(false);
  expect(mappingCandidateSchema.safeParse(withProviderUrl).success).toBe(true);
});
