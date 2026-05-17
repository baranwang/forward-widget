import { describe, expect, test } from "@rstest/core";
import { canonicalMappingSchema, mappingCandidateSchema } from "./schema";

describe("canonicalMappingSchema", () => {
  test("accepts canonical movie row matching JSONL provider shape", () => {
    const row = {
      type: "movie",
      tmdbId: 129,
      title: "Spirited Away",
      year: 2001,
      sourceUrl: "https://www.themoviedb.org/movie/129",
      verifiedAt: "2026-05-17T10:00:00.000Z",
      providers: [
        { provider: "iqiyi", idString: "vid-001" },
        { provider: "youku", idString: "vid-002", episodeNumber: 4 },
      ],
    };

    expect(canonicalMappingSchema.safeParse(row).success).toBe(true);
  });

  test("accepts canonical tv row with numeric season", () => {
    const row = {
      type: "tv",
      tmdbId: 800,
      title: "Example Drama",
      sourceUrl: "https://www.themoviedb.org/tv/800",
      season: 2,
      verifiedAt: "2026-05-17T10:00:00.000Z",
      providers: [{ provider: "tencent", idString: "tv-200" }],
    };

    expect(canonicalMappingSchema.safeParse(row).success).toBe(true);
  });

  test("accepts canonical tv row with null season", () => {
    const row = {
      type: "tv",
      tmdbId: 801,
      title: "Example Drama Null Season",
      sourceUrl: "https://www.themoviedb.org/tv/801",
      season: null,
      verifiedAt: "2026-05-17T10:00:00.000Z",
      providers: [{ provider: "mgtv", idString: "tv-201" }],
    };

    expect(canonicalMappingSchema.safeParse(row).success).toBe(true);
  });

  test("accepts canonical tv row with omitted season", () => {
    const row = {
      type: "tv",
      tmdbId: 802,
      title: "Example Drama Omitted Season",
      sourceUrl: "https://www.themoviedb.org/tv/802",
      verifiedAt: "2026-05-17T10:00:00.000Z",
      providers: [{ provider: "renren", idString: "tv-202" }],
    };

    expect(canonicalMappingSchema.safeParse(row).success).toBe(true);
  });

  test("rejects invalid provider name", () => {
    const row = {
      type: "movie",
      tmdbId: 803,
      title: "Invalid Provider",
      sourceUrl: "https://www.themoviedb.org/movie/803",
      verifiedAt: "2026-05-17T10:00:00.000Z",
      providers: [{ provider: "netflix", idString: "bad-1" }],
    };

    expect(canonicalMappingSchema.safeParse(row).success).toBe(false);
  });

  test("rejects non-integer season", () => {
    const row = {
      type: "tv",
      tmdbId: 804,
      title: "Invalid Season Float",
      sourceUrl: "https://www.themoviedb.org/tv/804",
      season: 1.5,
      verifiedAt: "2026-05-17T10:00:00.000Z",
      providers: [{ provider: "bilibili", idString: "tv-204" }],
    };

    expect(canonicalMappingSchema.safeParse(row).success).toBe(false);
  });

  test("rejects negative season", () => {
    const row = {
      type: "tv",
      tmdbId: 805,
      title: "Invalid Season Negative",
      sourceUrl: "https://www.themoviedb.org/tv/805",
      season: -1,
      verifiedAt: "2026-05-17T10:00:00.000Z",
      providers: [{ provider: "youku", idString: "tv-205" }],
    };

    expect(canonicalMappingSchema.safeParse(row).success).toBe(false);
  });
});

describe("mappingCandidateSchema", () => {
  test("requires provider url while canonical provider does not", () => {
    const baseRow = {
      type: "movie",
      tmdbId: 900,
      title: "Candidate URL Check",
      sourceUrl: "https://www.themoviedb.org/movie/900",
      verifiedAt: "2026-05-17T10:00:00.000Z",
    };

    const canonicalLikeWithoutUrl = {
      ...baseRow,
      providers: [{ provider: "iqiyi", idString: "cand-1" }],
    };

    const candidateWithUrl = {
      ...baseRow,
      providers: [
        {
          provider: "iqiyi",
          idString: "cand-1",
          url: "https://www.iqiyi.com/v_123.html",
        },
      ],
    };

    expect(canonicalMappingSchema.safeParse(canonicalLikeWithoutUrl).success).toBe(true);
    expect(mappingCandidateSchema.safeParse(canonicalLikeWithoutUrl).success).toBe(false);
    expect(mappingCandidateSchema.safeParse(candidateWithUrl).success).toBe(true);
  });
});
